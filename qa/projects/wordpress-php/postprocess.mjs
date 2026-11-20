import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {browserQA} from '../../../scripts/php-browser-qa.mjs';
const root=process.cwd(),project=path.join(root,'examples/wordpress-php'),output=path.join(root,'output/wordpress-php'),qa=path.join(root,'qa/projects/wordpress-php');
const sha=b=>createHash('sha256').update(b).digest('hex');
const mode=process.argv[2];
if(mode==='legacy'){
 const report={status:'passed',scope:'Pre-existing PHP films: sampled native seeks compared with their previous accepted browser captures',episodes:[]};
 for(const slug of ['php-oom','php-stale-state']){
  const gate=JSON.parse(await fs.readFile(path.join(root,'qa/projects',slug,'latest-check.json'),'utf8'));
  const goldenDir=path.join(root,gate.run,'browser'),golden=JSON.parse(await fs.readFile(path.join(goldenDir,'report.json'),'utf8'));
  const actualDir=path.join(qa,'regression',slug),actual=await browserQA(path.join(root,'examples',slug),actualDir,{allFrames:false});
  const frames=[];
  for(const c of actual.captures){
   const prior=golden.captures.find(g=>g.frame===c.frame);if(!prior)throw new Error(`Missing golden ${slug} ${c.frame}`);
   const a=PNG.sync.read(await fs.readFile(path.join(goldenDir,prior.file))),b=PNG.sync.read(await fs.readFile(path.join(actualDir,c.file)));
   let sum=0,max=0,over=0;for(let p=0;p<a.data.length;p+=4){let peak=0;for(let k=0;k<3;k++){const d=Math.abs(a.data[p+k]-b.data[p+k]);sum+=d;max=Math.max(max,d);peak=Math.max(peak,d);}if(peak>8)over++;}
   const mae=sum/(a.width*a.height*3),fraction=over/(a.width*a.height);frames.push({frame:c.frame,exact:c.sha256===prior.sha256,mae,max,fractionOver8:fraction,passed:mae<=.005&&max<=16&&fraction<=.0001});
  }
  report.episodes.push({id:slug,samples:frames.length,frames});if(!frames.every(f=>f.passed))report.status='failed';
 }
 await fs.writeFile(path.join(qa,'legacy-regression.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,episodes:report.episodes.map(e=>({id:e.id,samples:e.samples,exact:e.frames.filter(f=>f.exact).length}))}));
 if(report.status!=='passed')process.exitCode=1;
}else if(mode==='poster'){
 const runtime=await fs.readFile(path.join(root,'node_modules/hyperframes/dist/hyperframe-runtime.js'));
 const server=http.createServer(async(req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(u==='/__runtime.js'){res.setHeader('Content-Type','text/javascript');res.end(runtime);return;}
  const file=path.resolve(project,'.'+(u==='/'?'/index.html':u));if(!file.startsWith(project+path.sep))throw new Error('outside project');
  let data=await fs.readFile(file);if(file.endsWith('index.html'))data=Buffer.from(data.toString().replace('</body>','<script src="/__runtime.js"></script></body>'));
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.ttf':'font/ttf','.wav':'audio/wav'})[path.extname(file)]||'application/octet-stream');res.end(data);
 }catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--font-render-hinting=none','--force-color-profile=srgb']});
  const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.studio&&window.__player?.renderSeek);
  const film=JSON.parse(await fs.readFile(path.join(project,'film.json'),'utf8'));const frame=Math.floor(film.shots[2].start_frame+film.shots[2].frames*.58);
  await page.evaluate(async f=>{await Promise.all(Object.values(window.__hf?.buildReady||{}));window.__player.pause();await window.__player.renderSeek(f/30,{exact:true});await window.__hfWaitForSeekCompletion?.();},frame);
  await page.evaluate(()=>{document.getElementById('headline').textContent='WORDPRESS UPDATED.\nPHP CHECKED?';document.getElementById('subtitle').textContent='Check the runtime beneath your site.';document.getElementById('caption').style.display='none';});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const bytes=await page.screenshot();await fs.writeFile(path.join(output,'poster.png'),bytes);
  await fs.writeFile(path.join(output,'poster-receipt.json'),JSON.stringify({status:'rendered',sourceFrame:frame,method:'Live procedural composition rendered with a cover headline; no raster-image editing',sha256:sha(bytes)},null,2)+'\n');console.log(JSON.stringify({status:'rendered',frame}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}else if(mode==='review'){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const report={status:'failed',videos:[],scope:'Three-film review page: metadata, play/decode, seek and local artifact links. H.264 master verification is separate.'};
 try{
  const page=await browser.newPage();await page.goto(pathToFileURL(path.join(root,'output/php-series-review/index.html')).href);
  const links=await page.locator('a[href]').evaluateAll(es=>es.map(e=>e.href));for(const link of links){const u=new URL(link);if(u.protocol==='file:')await fs.access(decodeURIComponent(u.pathname));}
  const count=await page.locator('video').count();if(count!==3)throw new Error('Review page must contain three films');
  for(let i=0;i<count;i++){
   const video=page.locator('video').nth(i);await video.evaluate(v=>{v.muted=true;v.load();});await page.waitForFunction(n=>document.querySelectorAll('video')[n].readyState>=2,i,{timeout:30000});
   await video.evaluate(v=>v.play());await page.waitForFunction(n=>document.querySelectorAll('video')[n].currentTime>.5,i,{timeout:15000});await video.evaluate(v=>{v.pause();v.currentTime=10;});
   await page.waitForFunction(n=>{const v=document.querySelectorAll('video')[n];return !v.seeking&&Math.abs(v.currentTime-10)<.05;},i);
   const data=await video.evaluate(v=>({source:v.currentSrc.split('/').at(-1),duration:v.duration,width:v.videoWidth,height:v.videoHeight,currentTime:v.currentTime,error:v.error,decodedFrames:v.getVideoPlaybackQuality().totalVideoFrames}));if(data.error||!data.decodedFrames||data.width!==1080||data.height!==1920)throw new Error('Playback validation failed');report.videos.push(data);
  }
  report.status='passed';report.localLinks=links.length;
 }catch(e){report.error=e.message;process.exitCode=1;}finally{await browser.close();await fs.writeFile(path.join(output,'review-player.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
}else throw new Error('Choose legacy, poster or review');
