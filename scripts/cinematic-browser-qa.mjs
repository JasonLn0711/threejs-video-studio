import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { root } from './build.mjs';
export async function browserQA(project, output, {allFrames=true}={}) {
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
 report.fonts=await page.evaluate(()=>({caption:document.fonts.check('40px "IBM Plex Mono"','Verify the signature'),title:document.fonts.check('89px Oswald'),mono:document.fonts.check('24px "IBM Plex Mono"')}));
 const total=Math.round(film.duration*film.fps);const captureSet=new Set([0,total-1]);
 if(film.shots)for(const s of film.shots){captureSet.add(s.start_frame);captureSet.add(s.end_frame_exclusive-1);captureSet.add(Math.floor((s.start_frame+s.end_frame_exclusive)/2));}
 else for(let n=0;n<total;n+=15)captureSet.add(n);
 const seek=async frame=>{await page.evaluate(async f=>{await window.__player.renderSeek(f/30,{exact:true});await window.__hfWaitForSeekCompletion?.();},frame);};
 const inspect=async()=>page.evaluate(()=>{const findings=[];for(const id of ['headline','subtitle','caption','scale','admin','result','claims','dates','archive','rejection','report']){const e=document.getElementById(id),r=e.getBoundingClientRect(),s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||!e.textContent.trim())continue;if(r.x<99||r.right>891||r.y<249||r.bottom>1481||e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)findings.push({id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight});}const state=window.studio.inspect();if(state.towerCount!==17)findings.push({id:'tower-count'});if(state.shot==='S09'){const text=document.getElementById('scale').textContent;for(const q of ['ESTIMATED ROWS','POTENTIALLY REACHABLE','NOT EXFILTRATED'])if(!text.includes(q))findings.push({id:'missing-qualifier',q});}return{state,findings};});
 const frames=allFrames?Array.from({length:total},(_,i)=>i):[...captureSet].sort((a,b)=>a-b);
 for(const frame of frames){await seek(frame);const info=await inspect();if(info.findings.length)report.layoutFindings.push({frame,...info});report.checkedFrames++;if(captureSet.has(frame)){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const bytes=await page.screenshot();const name=`frame-${String(frame).padStart(4,'0')}.png`;await fs.writeFile(path.join(output,name),bytes);report.captures.push({frame,sha256:hash(bytes),file:name,...info.state});}if(report.checkedFrames%150===0)process.stderr.write(`browser | ${report.checkedFrames}/${frames.length} frames inspected\n`);}
 const seen=new Map();for(const frame of [90,10,50,10,90,50,total-1,10]){await seek(frame);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const actual=hash(await page.screenshot());if(seen.has(frame))report.repeats.push({frame,passed:actual===seen.get(frame),actual,expected:seen.get(frame)});seen.set(frame,actual);}
 report.status=!report.audio.error&&Math.abs(report.audio.duration-film.duration)<.05&&!report.errors.length&&!report.layoutFindings.length&&Object.values(report.fonts).every(Boolean)&&report.repeats.every(x=>x.passed)?'passed':'failed';
 }catch(e){report.errors.push(e.stack);}finally{await browser?.close();await new Promise(r=>server.close(r));await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
 if(report.status!=='passed')throw new Error(`Browser QA failed: ${output}/report.json`);
 return report;
}
if(process.argv[1]===new URL(import.meta.url).pathname){const result=await browserQA(path.resolve(process.argv[2]),path.resolve(process.argv[3]));console.log(JSON.stringify({status:result.status,checkedFrames:result.checkedFrames}));}
