"""Deterministic stem assembly with a frozen shared preview/render master."""
import json,subprocess,hashlib,re,shutil,sys
from pathlib import Path
import numpy as np
import soundfile as sf
P=Path('examples/the-missing-signature');f=json.loads((P/'film.json').read_text());cues=json.loads((P/'captions.json').read_text());rate=48000
A=P/'assets/audio';S=A/'sources';S.mkdir(exist_ok=True)
ledger=[json.loads(x) for x in (P/'.media/manifest.jsonl').read_text().splitlines()] if (P/'.media/manifest.jsonl').exists() else json.loads((A/'source-manifest.json').read_text())['used']
used=[]
for idx,name in [(0,'drone'),(1,'key')]:
 item=ledger[idx];dst=S/f'{name}.mp3';src=P/item.get('adoptedPath',item['path']);
 if src.resolve()!=dst.resolve():shutil.copyfile(src,dst)
 item={**item,'adoptedPath':str(dst.relative_to(P)),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()};used.append(item)
 subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(dst),'-ar','48000','-ac','2','-af','lowpass=f=200' if name=='drone' else 'highpass=f=150',str(S/f'{name}.wav')],check=True)
(A/'source-manifest.json').write_text(json.dumps({'used':used,'unusedResolvedAssets':[x['id'] for x in ledger[2:]],'derivatives':'Low-pass/crossfade drone bed; shaped transient from licensed drone; keyboard click reused for mechanical accents.'},indent=2)+'\n')
credits='\n\n'.join(x['provenance']['credit']+'\nSource: '+x['provenance']['source_url']+'\nChanges: resampling, filtering, envelopes, mixing.' for x in used)
existing_credits=(P/'CREDITS.md').read_text() if (P/'CREDITS.md').exists() else ''
software_notice=('\n## Software and synthetic speech'+existing_credits.split('## Software and synthetic speech',1)[1]) if '## Software and synthetic speech' in existing_credits else ''
(P/'CREDITS.md').write_text('# Sound credits\n\n'+credits+'\n\nInclude these credits with publication. Font licenses are in assets/fonts/.\n'+software_notice)
drone,_=sf.read(S/'drone.wav',always_2d=True);key,_=sf.read(S/'key.wav',always_2d=True)
drone/=max(abs(drone).max(),1e-6);key/=max(abs(key).max(),1e-6)
def bed_for(n):
 # Equal-power-free overlap-add avoids random phases and loop discontinuities.
 fade=9600;chunk=drone.copy();env=np.ones(len(chunk));env[:fade]=np.linspace(0,1,fade);env[-fade:]=np.linspace(1,0,fade);chunk*=env[:,None]
 bed=np.zeros((n,2));step=len(chunk)-fade
 for start in range(0,n,step):bed[start:min(start+len(chunk),n)]+=chunk[:min(len(chunk),n-start)]
 return bed

def assemble(folder,n,voice,segments,events,silences):
 folder.mkdir(parents=True,exist_ok=True);bed=bed_for(n)*.035;sfx=np.zeros((n,2));duck=np.ones(n)
 for c in segments:
  lo,hi=c['startSample'],c['endSample'];ramp=min(2400,lo);duck[lo:hi]=.35
  if ramp:duck[lo-ramp:lo]=np.minimum(duck[lo-ramp:lo],np.linspace(1,.35,ramp))
  end=min(n,hi+4800);duck[hi:end]=np.minimum(duck[hi:end],np.linspace(.35,1,end-hi))
 bed*=duck[:,None]
 for at,kind in events:
  src=key.copy()*.15 if kind=='key' else drone[:int(1.4*rate)].copy()*.2
  if kind!='key':
   env=np.exp(-np.arange(len(src))/rate*4);env[:240]*=np.linspace(0,1,240);src*=env[:,None]
  start=round(at*rate);count=min(len(src),n-start)
  if count>0:sfx[start:start+count]+=src[:count]
 for lo,hi in silences:
  a,b=round(lo*rate),round(hi*rate)
  for track in [bed,sfx]:
   ramp=min(2400,a);track[a-ramp:a]*=np.linspace(1,0,ramp)[:,None];track[a:b]=0
   end=min(n,b+960);track[b:end]*=np.linspace(0,1,end-b)[:,None]
 fade_end=n-round(.4*rate);fade_start=fade_end-round(.7*rate)
 for track in [bed,sfx]:track[fade_start:fade_end]*=np.linspace(1,0,fade_end-fade_start)[:,None];track[fade_end:]=0
 sf.write(folder/'narration.wav',voice,rate,subtype='PCM_16');sf.write(folder/'ambience.wav',bed,rate,subtype='PCM_16');sf.write(folder/'effects.wav',sfx,rate,subtype='PCM_16')
 raw=folder/'premix.wav';sf.write(raw,voice+bed+sfx,rate,subtype='PCM_24')
 cmd=['ffmpeg','-hide_banner','-nostdin','-i',str(raw),'-af','loudnorm=I=-14:TP=-2:LRA=9:print_format=json','-f','null','-']
 first=subprocess.run(cmd,capture_output=True,text=True,check=True);m=json.loads(first.stderr[first.stderr.rfind('{'):])
 filt=f'loudnorm=I=-14:TP=-2:LRA=9:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true:print_format=json,aresample=48000,apad,atrim=end_sample={n}'
 final=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-y','-i',str(raw),'-af',filt,'-ar','48000','-ac','2','-c:a','pcm_s16le',str(folder/'mix.wav')],capture_output=True,text=True,check=True)
 # Measure the actual written PCM, not the normalization pass's prediction.
 measurement=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',str(folder/'mix.wav'),'-af','loudnorm=I=-14:TP=-2:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 measured=json.loads(measurement.stderr[measurement.stderr.rfind('{'):])
 receipt={'sampleRate':rate,'samples':n,'duration':n/rate,'integratedLufs':float(measured['input_i']),'truePeakDbtp':float(measured['input_tp']),'intentionalSilences':silences,'events':events,'normalization':m,'humanListening':'pending','mixSha256':hashlib.sha256((folder/'mix.wav').read_bytes()).hexdigest()}
 (folder/'mix-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
voice,_=sf.read(A/'narration.wav',always_2d=True)
admin=next(x for x in cues if x['id']=='S07-2');before=next(x for x in cues if x['id']=='S07-1')
events=[(.15,'impact'),(f['shots'][1]['start']+.2,'key'),(admin['start'],'key'),(f['shots'][7]['start'],'impact'),(f['shots'][10]['start']+.2,'key')]
assemble(A,len(voice),voice,cues,events,[(before['end'],admin['start'])])
if f.get('approval',{}).get('fullRender')=='approved':sys.exit(0)
# Separate 10s editorial proof: complete S07/S08, then S09's first clause.
proof=P/'proof';pa=proof/'assets/audio';pa.mkdir(parents=True,exist_ok=True);pc=[];v=np.zeros((480000,2))
for ident,at,limit in [('S07-1',before['start']-f['shots'][6]['start'],None),('S07-2',admin['start']-f['shots'][6]['start'],None),('S08-1',4.3+next(x['start'] for x in cues if x['id']=='S08-1')-f['shots'][7]['start'],None),('S09-1',6.3+next(x['start'] for x in cues if x['id']=='S09-1')-f['shots'][8]['start'],2.45)]:
 c=next(x for x in cues if x['id']==ident);data,_=sf.read(A/f'{ident}.wav',always_2d=True)
 if limit:data=data[:round(limit*rate)]
 start=round(at*rate);end=start+len(data);v[start:end]=data
 pc.append({**c,'start':start/rate,'end':end/rate,'startSample':start,'endSample':end,'excerpt':bool(limit),'zh':'背後有 17 座分析資料庫。' if limit else c['zh']})
assemble(pa,len(v),v,pc,[(pc[1]['start'],'key'),(4.3,'impact')],[(pc[0]['end'],pc[1]['start'])])
(pf:=proof/'film.json').write_text(json.dumps({'id':'the-missing-signature-proof','profile':'cinematic-proof-v1','fps':30,'width':1080,'height':1920,'duration':10,'frameCount':300,'audioMaster':'assets/audio/mix.wav','audioTiming':f['audioTiming'],'sourceProject':'examples/the-missing-signature','sourceMap':[{'at':0,'duration':4.3,'source':f['shots'][6]['start']},{'at':4.3,'duration':2,'source':f['shots'][7]['start']},{'at':6.3,'duration':3.7,'source':f['shots'][8]['start']}],'editorialNote':'S09 first clause ends at 2.45s, inside the measured 2.209–2.679s pause; no rate change. Final film uses the whole sentence.','narration':pc},ensure_ascii=False,indent=2)+'\n')
(proof/'captions.json').write_text(json.dumps(pc,ensure_ascii=False,indent=2)+'\n')
