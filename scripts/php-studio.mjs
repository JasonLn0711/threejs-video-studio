// Explicitly project-scoped series workflow. Legacy cinematic approval is unchanged.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stripVTControlCharacters} from 'node:util';
import {chromium} from 'playwright';
import {root,compile} from './build.mjs';
import {browserQA} from './php-browser-qa.mjs';
import {compareEncoded} from './cinematic-encoded.mjs';
const arg=(key,fallback)=>{const i=process.argv.indexOf(key);if(i<0)return fallback;if(!process.argv[i+1]||process.argv[i+1].startsWith('--'))throw new Error(`${key} requires a value`);return process.argv[i+1];};
const command=process.argv[2],project=path.resolve(arg('--project',''));
const film=JSON.parse(await fs.readFile(path.join(project,'film.json'),'utf8'));
if(!['php-runtime-v1','wordpress-runtime-v1'].includes(film.validationProfile)||film.review?.mode!=='final_only'||!film.review.renderAuthorization)throw new Error('Unsupported film or missing explicit full-production authorization');
if(!['preview','check','render','package'].includes(command))throw new Error('Use preview, check, render or package');
const output=path.resolve(arg('--output',process.env.STUDIO_OUTPUT||path.join(root,'output',film.id)));
const qa=path.join(root,'qa/projects',film.id);await fs.mkdir(qa,{recursive:true});await fs.mkdir(output,{recursive:true});
const runId=new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+command;const run=path.join(qa,'runs',runId);await fs.mkdir(run,{recursive:true});const started=performance.now();
const hf=path.join(root,'node_modules/.bin/hyperframes');const hash=b=>createHash('sha256').update(b).digest('hex');const hashFile=async p=>hash(await fs.readFile(p));
export async function sourceIdentity(){
 const files=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['.cache','.media','.hyperframes','dist','__pycache__','.thumbnails','.waveform-cache'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isSymbolicLink())throw new Error('Source symlink unsupported');if(e.isDirectory())await walk(p);else if(!e.name.endsWith('.md'))files.push(p);}}
 await walk(path.join(root,'src/php-series'));await walk(project);
 for(const rel of ['package-lock.json','scripts/build.mjs','scripts/studio.mjs','scripts/php-studio.mjs','scripts/php-browser-qa.mjs','scripts/php-layout.py','scripts/php-audio.py','scripts/php-verify.py','scripts/php-package.py','scripts/php-restore.mjs','scripts/cinematic-speech.py','scripts/verify_cinematic.py','scripts/verify_audio.py','scripts/cinematic-encoded.mjs','tests/php-series.test.mjs'])files.push(path.join(root,rel));
 if(film.validationProfile==='wordpress-runtime-v1')files.push(path.join(root,'tests/wordpress-runtime.test.mjs'));
 const hashes=await Promise.all([...new Set(files)].sort().map(async p=>[path.relative(root,p),await hashFile(p)]));return {key:hash(JSON.stringify(hashes)),hashes};
}
let active,cancelled=false;function cancel(){cancelled=true;if(active)try{process.kill(-active.pid,'SIGTERM');}catch{}}process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
async function child(stage,exe,args,cwd=root){if(cancelled)throw new Error('cancelled');process.stderr.write(`${stage} | started\n`);const began=performance.now();let out='',err='';const code=await new Promise((resolve,reject)=>{active=spawn(exe,args,{cwd,env:{...process.env,HYPERFRAMES_BROWSER_PATH:process.env.HYPERFRAMES_BROWSER_PATH||chromium.executablePath()},detached:true,stdio:['ignore','pipe','pipe']});active.stdout.on('data',x=>{out+=x;const text=stripVTControlCharacters(x.toString());if(stage.startsWith('render-'))process.stderr.write(text);});active.stderr.on('data',x=>{err+=x;process.stderr.write(process.stderr.isTTY?x:stripVTControlCharacters(x.toString()));});active.on('error',reject);active.on('close',resolve);});active=null;await fs.writeFile(path.join(run,stage+'.stdout.log'),out);await fs.writeFile(path.join(run,stage+'.stderr.log'),stripVTControlCharacters(err));await fs.appendFile(path.join(run,'events.jsonl'),JSON.stringify({stage,code,elapsedSeconds:(performance.now()-began)/1000})+'\n');process.stderr.write(`${stage} | ${code===0?'finished':'failed'}\n`);if(code!==0||cancelled)throw new Error(`${stage}: ${cancelled?'cancelled':`exit ${code}`}; diagnostics ${run}`);return out;}
let result={status:'failed',command,project:film.id,run:path.relative(root,run)};
try{
 if(command!=='package')await compile(project);
 if(command==='preview')result.url=await child('preview',hf,['preview','--background','--port',arg('--port',film.episode==='wordpress'?'3052':film.episode==='oom'?'3050':'3051')],project);
 else if(command==='check'){
  const identity=await sourceIdentity();
  await child('typecheck','npm',['run','typecheck']);await child('unit-tests','npm',['test']);
  await child('audio-tests','python3',['-m','unittest','discover','-s','tests','-p','*_test.py']);
  await child('audio','python3',['scripts/verify_cinematic.py','--project',project,'--output',path.join(run,'audio.json')]);
  await child('content','python3',['scripts/php-verify.py','--project',project,'--output',path.join(run,'content.json')]);
  const native=JSON.parse(await child('native',hf,['check','--json','--samples','13'],project));if(!native.ok||native.browserSkipped)throw new Error('Native HyperFrames check failed');
  await browserQA(project,path.join(run,'browser'));
  if(identity.key!==(await sourceIdentity()).key)throw new Error('Source changed during QA');
  result.gate={status:'passed',identity:identity.key,run:path.relative(root,run),project:film.id,createdAt:new Date().toISOString()};
  await fs.writeFile(path.join(qa,'latest-check.json'),JSON.stringify(result.gate,null,2)+'\n');
 }else if(command==='render'){
  const gate=JSON.parse(await fs.readFile(path.join(qa,'latest-check.json'),'utf8')),identity=await sourceIdentity();
  if(gate.status!=='passed'||gate.identity!==identity.key||gate.project!==film.id)throw new Error('Missing or stale project check');
  await child('usage',hf,['usage','--json'],project);
  const native=path.join(run,'native-frames'),movie=path.join(output,`${film.id}.mp4`);
  await child('render-native',hf,['render','--format','png-sequence','--output',native,'--fps',String(film.fps),'--quality','delivery','--workers','1','--browser-gpu','--strict'],project);
  const names=(await fs.readdir(native)).filter(n=>n.endsWith('.png')).sort();if(names.length!==film.frameCount)throw new Error('Native frame count differs');
  const frameHashes=await Promise.all(names.map(async name=>({name,sha256:await hashFile(path.join(native,name))})));await fs.writeFile(path.join(run,'native-frame-hashes.json'),JSON.stringify(frameHashes,null,2)+'\n');
  const common=['-v','error','-nostdin','-y','-framerate',String(film.fps),'-start_number','1','-i',path.join(native,'frame_%06d.png'),'-i',path.join(project,'assets/audio/mix.wav'),'-map','0:v:0','-map','1:a:0'];
  const tail=['-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','aac','-ar','48000','-ac','2','-b:a','192k','-t',String(film.duration),'-movflags','+faststart',movie];
  const profiles=[['nvenc',['-c:v','h264_nvenc','-preset','p7','-tune','hq','-rc','vbr','-cq','16','-b:v','0','-spatial-aq','1','-aq-strength','8','-bf','0']],['libx264',['-c:v','libx264','-preset','slow','-crf','15','-threads','1','-bf','0','-x264-params','lookahead-threads=1:aq-mode=3:aq-strength=0.8:deblock=1,1']]];
  let passed=false;
  for(const [name,options]of profiles){try{
   await child('encode-'+name,'ffmpeg',[...common,...options,...tail]);
   await child('encoded-audio-'+name,'python3',['scripts/verify_cinematic.py','--project',project,'--video',movie,'--output',path.join(run,'encoded-audio-'+name+'.json')]);
   result.encoded=await compareEncoded(movie,null,path.join(root,gate.run,'browser'),path.join(run,'encoded-'+name));
   await child('encoded-video-'+name,'python3',['scripts/php-verify.py','--project',project,'--video',movie,'--output',path.join(run,'encoded-video-'+name+'.json')]);
   result.encoder=name;passed=true;break;
  }catch(error){if(cancelled)throw error;await fs.writeFile(path.join(run,name+'-failure.json'),JSON.stringify({error:error.message})+'\n');await fs.rename(movie,path.join(run,name+'-rejected.mp4')).catch(()=>{});process.stderr.write(`${name} | failed quality/encoding gate; retained attempt\n`);}}
  if(!passed)throw new Error('Both encoding profiles failed');
  if(identity.key!==(await sourceIdentity()).key)throw new Error('Source changed during render');
  result={...result,artifact:movie,sha256:await hashFile(movie),identity:identity.key,source:identity.hashes,gate,status:'passed',humanReview:'pending'};
  await fs.writeFile(path.join(output,'render-receipt.json'),JSON.stringify(result,null,2)+'\n');
 }else await child('package','python3',['scripts/php-package.py','--project',project,'--output',output]);
 result.status='passed';
}catch(e){result.error=e.message;result.status=cancelled?'cancelled':'failed';process.exitCode=1;}
finally{result.elapsedSeconds=(performance.now()-started)/1000;await fs.writeFile(path.join(run,'summary.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
