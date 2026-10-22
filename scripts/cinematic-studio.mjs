// Project-scoped cinematic gates. Existing DDoS commands retain their original path.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stripVTControlCharacters} from 'node:util';
import {chromium} from 'playwright';
import {root,compile} from './build.mjs';
import {browserQA} from './cinematic-browser-qa.mjs';
import {compareEncoded} from './cinematic-encoded.mjs';
const arg=(key,fallback)=>{const i=process.argv.indexOf(key);if(i<0)return fallback;if(!process.argv[i+1]||process.argv[i+1].startsWith('--'))throw new Error(`${key} requires a value`);return process.argv[i+1];};
const command=process.argv[2],project=path.resolve(arg('--project',''));
const film=JSON.parse(await fs.readFile(path.join(project,'film.json'),'utf8'));
if(film.profile!=='cinematic-short-v1')throw new Error('Unsupported project profile');
if(!['preview','check','render','package'].includes(command))throw new Error('Use preview, check, render or package');
const proof=process.argv.includes('--proof'),targetProject=proof?path.join(project,'proof'):project;
const output=path.resolve(arg('--output',process.env.STUDIO_OUTPUT||path.join(root,'output',film.id)));
const qa=path.join(root,'qa/projects',film.id);await fs.mkdir(qa,{recursive:true});await fs.mkdir(output,{recursive:true});
const runId=new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+command+(proof?'-proof':'');const run=path.join(qa,'runs',runId);await fs.mkdir(run,{recursive:true});const start=performance.now();
const hf=path.join(root,'node_modules/.bin/hyperframes');const hash=b=>createHash('sha256').update(b).digest('hex');const hashFile=async p=>hash(await fs.readFile(p));
async function inputs(){const files=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['.cache','.media','.hyperframes','dist','__pycache__','reference','proof'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isSymbolicLink())throw new Error('Source symlink unsupported');if(e.isDirectory())await walk(f);else if(!e.name.endsWith('.md'))files.push(f);}}await walk(path.join(root,'src/missing-signature'));await walk(path.join(root,'scripts'));await walk(project);for(const rel of ['index.html','film.json','captions.json','assets/audio/mix.wav','assets/audio/narration.wav'])files.push(path.join(project,'proof',rel));files.push(path.join(root,'package-lock.json'));files.sort();return hash(JSON.stringify(await Promise.all(files.map(async p=>[path.relative(root,p),await hashFile(p)]))));}
let active;let cancelled=false;function cancel(){cancelled=true;if(active)try{process.kill(-active.pid,'SIGTERM');}catch{}}process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
async function child(stage,exe,args,cwd=root){process.stderr.write(`${stage} | started\n`);const began=performance.now();let out='',err='';const code=await new Promise((resolve,reject)=>{active=spawn(exe,args,{cwd,env:{...process.env,HYPERFRAMES_BROWSER_PATH:process.env.HYPERFRAMES_BROWSER_PATH||chromium.executablePath()},detached:true,stdio:['ignore','pipe','pipe']});active.stdout.on('data',x=>{out+=x;});active.stderr.on('data',x=>{err+=x;process.stderr.write(process.stderr.isTTY?x:stripVTControlCharacters(x.toString()));});active.on('error',reject);active.on('close',resolve);});active=null;await fs.writeFile(path.join(run,stage+'.stdout.log'),out);await fs.writeFile(path.join(run,stage+'.stderr.log'),stripVTControlCharacters(err));const event={stage,code,elapsedSeconds:(performance.now()-began)/1000};await fs.appendFile(path.join(run,'events.jsonl'),JSON.stringify(event)+'\n');process.stderr.write(`${stage} | ${code===0?'finished':'failed'} | ${event.elapsedSeconds.toFixed(1)}s\n`);if(code!==0||cancelled)throw new Error(`${stage} failed; diagnostics: ${run}`);return out;}
async function check(){const identity=await inputs();await child('types','npm',['run','typecheck']);await child('unit-tests','npm',['test']);await child('audio-unit-tests','python3',['-m','unittest','discover','-s','tests','-p','*_test.py']);for(const [name,dir]of (film.approval?.fullRender==='approved'?[['film',project]]:[['film',project],['proof',path.join(project,'proof')]])){await child(name+'-audio','python3',['scripts/verify_cinematic.py','--project',dir,'--output',path.join(run,name+'-audio.json')]);const native=JSON.parse(await child(name+'-native',hf,['check','--json','--samples',name==='film'?'13':'9'],dir));if(!native.ok||native.browserSkipped)throw new Error(`${name} native gate failed`);await browserQA(dir,path.join(run,name+'-browser'));}if(identity!==await inputs())throw new Error('Source changed during check');const gate={status:'passed',identity,run:path.relative(root,run),project:film.id,createdAt:new Date().toISOString()};await fs.writeFile(path.join(qa,'latest-check.json'),JSON.stringify(gate,null,2)+'\n');return gate;}
let result={status:'failed',command,project:film.id,proof,run: path.relative(root,run)};
try{
 if(command!=='package')await compile(project);
 if(command==='preview'){result.url=await child('preview',hf,['preview','--background','--port',arg('--port','3048')],targetProject);}
 else if(command==='check')result.gate=await check();
 else if(command==='render'){
  if(proof&&film.approval?.fullRender==='approved')throw new Error('The approved proof is historical; render the authorized revised full film without --proof');
  if(!proof&&(film.approval?.fullRender!=='approved'||!film.approval?.proofSha256))throw new Error('Full render awaits user approval of the 10-second proof. Use --proof for the authorized sample.');
  if(!proof&&film.approval.proofSha256!==await hashFile(path.join(output,'proof-10s.mp4')))throw new Error('Approved proof hash does not match the reviewed artifact');
  const gate=JSON.parse(await fs.readFile(path.join(qa,'latest-check.json'),'utf8'));
  if(gate.status!=='passed'||gate.identity!==await inputs())throw new Error('Missing or stale project check; run check --project first');
  await child('usage',hf,['usage','--json'],targetProject);
  const count=proof?2:1;const outputs=[];const duration=proof?10:film.duration;
  for(let i=1;i<=count;i++){
   const native=path.join(run,`native-frames-${i}`),final=path.join(output,proof?(i===1?'proof-10s.mp4':'proof-repeat.mp4'):`${film.id}.mp4`);
   await child(`render-${i}`,hf,['render','--format','png-sequence','--output',native,'--fps','30','--quality','delivery','--workers','1','--browser-gpu','--strict'],targetProject);
   const names=(await fs.readdir(native)).filter(x=>x.endsWith('.png')).sort();
   if(names.length!==Math.round(duration*30))throw new Error('Native frame count differs');
   const frameHashes=await Promise.all(names.map(async name=>({name,sha256:await hashFile(path.join(native,name))})));
   await fs.writeFile(path.join(run,`native-frame-hashes-${i}.json`),JSON.stringify(frameHashes,null,2)+'\n');
   if(i>1){const first=JSON.parse(await fs.readFile(path.join(run,'native-frame-hashes-1.json'),'utf8'));if(JSON.stringify(first)!==JSON.stringify(frameHashes))throw new Error('Independent native PNG sequences differ');}
   await child(`encode-${i}`,'ffmpeg',['-v','error','-nostdin','-y','-framerate','30','-start_number','1','-i',path.join(native,'frame_%06d.png'),'-i',path.join(targetProject,'assets/audio/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','slow','-crf','15','-threads','1','-bf','0','-x264-params','lookahead-threads=1:aq-mode=3:aq-strength=0.8:deblock=1,1','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','aac','-ar','48000','-ac','2','-b:a','192k','-t',String(duration),'-movflags','+faststart',final]);outputs.push(final);
  }
  await child('encoded-audio','python3',['scripts/verify_cinematic.py','--project',targetProject,'--video',outputs[0],'--output',path.join(run,'encoded-audio.json')]);
  result.encoded=await compareEncoded(outputs[0],proof?outputs[1]:null,path.join(root,gate.run,proof?'proof-browser':'film-browser'),path.join(run,'encoded'));
  if(gate.identity!==await inputs())throw new Error('Source changed during render');
  result.artifact=outputs[0];result.sha256=await hashFile(outputs[0]);result.identity=gate.identity;result.gate=gate;result.status='passed';
  await fs.writeFile(path.join(output,proof?'proof-receipt.json':'render-receipt.json'),JSON.stringify(result,null,2)+'\n');
 }else{await child('package','python3',['scripts/package_cinematic.py','--project',project,'--output',output,...(proof?['--proof']:[])]);}
 result.status='passed';
}catch(e){result.error=e.message;result.status=cancelled?'cancelled':'failed';process.exitCode=1;}
finally{result.elapsedSeconds=(performance.now()-start)/1000;await fs.writeFile(path.join(run,'summary.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
