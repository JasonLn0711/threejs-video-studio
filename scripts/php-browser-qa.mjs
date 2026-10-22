import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { root } from './build.mjs';
export async function browserQA(project, output, {allFrames=true,keyframes=false}={}) {
 await fs.mkdir(output,{recursive:true});
 const film=JSON.parse(await fs.readFile(path.join(project,'film.json'),'utf8'));
 const runtime=await fs.readFile(path.join(root,'node_modules/hyperframes/dist/hyperframe-runtime.js'));
 const hash=x=>createHash('sha256').update(x).digest('hex');
 const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.otf':'font/otf','.ttf':'font/ttf','.wav':'audio/wav'};
 const server=http.createServer(async(req,res)=>{try{const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(url==='/__runtime.js'){res.setHeader('content-type','text/javascript');return res.end(runtime);}const file=path.resolve(project,'.'+(url==='/'?'/index.html':url));if(!file.startsWith(project+path.sep)){res.statusCode=403;return res.end();}let data=await fs.readFile(file);if(file.endsWith('index.html'))data=Buffer.from(data.toString().replace('</body>','<script src="/__runtime.js"></script></body>'));res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const report={status:'failed',project:film.id,checkedFrames:0,runtimeHash:hash(runtime),captures:[],repeats:[],errors:[],layoutFindings:[],fonts:null};let browser;
 try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--font-render-hinting=none','--force-color-profile=srgb','--force-device-scale-factor=1']});
 const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(r.failure()?.errorText==='net::ERR_ABORTED'&&r.url().endsWith('.wav'))return;report.errors.push(r.url()+': '+r.failure()?.errorText);});
 await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.studio&&window.__player?.renderSeek,{timeout:45000});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(Object.values(window.__hf?.buildReady||{}));window.__player.pause();});
 await page.waitForFunction(()=>document.getElementById('mix').readyState>=1,{timeout:15000});
 report.audio=await page.evaluate(()=>({duration:document.getElementById('mix').duration,error:document.getElementById('mix').error}));
 report.fonts=await page.evaluate(()=>({caption:document.fonts.check('40px "IBM Plex Mono"','PHP memory lifetime'),title:document.fonts.check('76px Oswald'),mono:document.fonts.check('24px "IBM Plex Mono"')}));
 const total=Math.round(film.duration*film.fps);const captureSet=new Set([0,total-1]);
 if(film.shots)for(const s of film.shots){for(const frame of [s.start_frame-1,s.start_frame,s.start_frame+1,s.end_frame_exclusive-1,Math.floor((s.start_frame+s.end_frame_exclusive)/2)])if(frame>=0&&frame<total)captureSet.add(frame);}
 else for(let n=0;n<total;n+=15)captureSet.add(n);
 const seek=async frame=>{await page.evaluate(async f=>{await window.__player.renderSeek(f/30,{exact:true});await window.__hfWaitForSeekCompletion?.();},frame);};
 const inspect=async()=>page.evaluate(profile=>{
  const findings=[];
  for(const e of document.querySelectorAll('[data-qa-copy]')) {
   const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0||!e.textContent.trim())continue;
   if(r.x<99||r.right>891||r.y<249||r.bottom>1481||e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)findings.push({id:e.id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight});
  }
  const state=window.studio.inspect();
  if(profile==='wordpress-runtime-v1'){
   if(state.phpPatchStatus!=='unknown'||state.fixVerified!==false||state.realSiteScanned!==false||state.conceptual!==true||state.wordpressCoreStatus!=='up-to-date')findings.push({id:'wordpress-technical-boundary'});
   if(state.contextLost||state.drawCalls<1)findings.push({id:'capture-context'});
  }else if(profile==='php-runtime-v1'){
   if(state.workerId!=='W01'||state.rootAccess!==false||state.rce!=='conditional_risk')findings.push({id:'technical-boundary'});
  }else findings.push({id:'unknown-validation-profile'});
  for(const [id,p] of Object.entries(state.essentialPoints))if(!Number.isFinite(p.x)||p.x<85||p.x>995||p.y<570||p.y>1320||p.z<0||p.z>1)findings.push({id:'essential-point',object:id,...p});
  if(!state.renderer||/SwiftShader|llvmpipe/i.test(state.renderer))findings.push({id:'hardware-renderer',renderer:state.renderer});
  const caption=document.getElementById('caption').textContent;
  if(caption.split('\n').length>2)findings.push({id:'caption-lines'});
  return {state,findings};
 },film.validationProfile);
 for(let frame=0;frame<total;frame+=film.fps)captureSet.add(frame);
 if(keyframes){captureSet.clear();for(const index of (film.validationProfile==='wordpress-runtime-v1'?[0,1,2,3,4,5,6]:[0,1,2,3,5])){const s=film.shots[index];captureSet.add(index===0?Math.min(30,s.end_frame_exclusive-1):Math.floor(s.start_frame+(s.end_frame_exclusive-s.start_frame)*.58));}}
 const frames=allFrames?Array.from({length:total},(_,i)=>i):[...captureSet].sort((a,b)=>a-b);
 for(const frame of frames){await seek(frame);const info=await inspect();if(info.findings.length)report.layoutFindings.push({frame,...info});report.checkedFrames++;if(captureSet.has(frame)){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const bytes=await page.screenshot();const name=`frame-${String(frame).padStart(4,'0')}.png`;await fs.writeFile(path.join(output,name),bytes);report.captures.push({frame,sha256:hash(bytes),file:name,...info.state});}if(report.checkedFrames%150===0)process.stderr.write(`browser | ${report.checkedFrames}/${frames.length} frames inspected\n`);}
 const seen=new Map();for(const frame of [90,10,50,10,90,50,total-1,10]){await seek(frame);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const actual=hash(await page.screenshot());if(seen.has(frame))report.repeats.push({frame,passed:actual===seen.get(frame),actual,expected:seen.get(frame)});seen.set(frame,actual);}
 report.status=!report.audio.error&&Math.abs(report.audio.duration-film.duration)<.05&&!report.errors.length&&!report.layoutFindings.length&&Object.values(report.fonts).every(Boolean)&&report.repeats.every(x=>x.passed)?'passed':'failed';
 }catch(e){report.errors.push(e.stack);}finally{await browser?.close();await new Promise(r=>server.close(r));await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
 if(report.status!=='passed')throw new Error(`Browser QA failed: ${output}/report.json`);
 return report;
}
if(process.argv[1]===new URL(import.meta.url).pathname){const result=await browserQA(path.resolve(process.argv[2]),path.resolve(process.argv[3]),{allFrames:!process.argv.includes('--keyframes'),keyframes:process.argv.includes('--keyframes')});console.log(JSON.stringify({status:result.status,checkedFrames:result.checkedFrames}));}
