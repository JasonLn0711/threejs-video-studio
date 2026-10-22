"""Project-scoped deterministic score, licensed effects and sample-accurate mix."""
import argparse,json,hashlib,shutil,subprocess,math
from pathlib import Path
import numpy as np
import soundfile as sf
p=argparse.ArgumentParser();p.add_argument('--project',required=True);args=p.parse_args();P=Path(args.project);A=P/'assets/audio';S=A/'sources';S.mkdir(exist_ok=True)
f=json.loads((P/'film.json').read_text());cues=json.loads((P/'captions.json').read_text());rate=48000
origin=Path('examples/the-missing-signature/assets/audio')
if not (A/'source-manifest.json').exists():
 shutil.copyfile(origin/'source-manifest.json',A/'source-manifest.json')
 for name in ['drone','key']:shutil.copyfile(origin/'sources'/f'{name}.mp3',S/f'{name}.mp3')
for name in ['drone','key']:
 subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(S/f'{name}.mp3'),'-ar','48000','-ac','2','-af','lowpass=f=180' if name=='drone' else 'highpass=f=150',str(S/f'{name}.wav')],check=True)
voice,_=sf.read(A/'narration.wav',always_2d=True);n=len(voice);t=np.arange(n)/rate
bed=np.zeros((n,2));drone,_=sf.read(S/'drone.wav',always_2d=True);drone/=max(abs(drone).max(),1e-8)
fade=min(9600,len(drone)//4);env=np.ones(len(drone));env[:fade]=np.linspace(0,1,fade);env[-fade:]=np.linspace(1,0,fade)
for start in range(0,n,len(drone)-fade):
 count=min(len(drone),n-start);bed[start:start+count]+=(drone*env[:,None])[:count]*.022
# Original low-register score: C2 / G2 / Eb3 / D3, resolving to C/G at the end.
score=np.zeros((n,2));beat=60/68
for k,start in enumerate(np.arange(.1,f['duration'],beat*2)):
 frequency=[65.406,97.999,155.563,146.832][k%4]
 if start>=f['shots'][-1]['start']:frequency=[65.406,97.999][k%2]
 count=min(round(beat*3*rate),n-round(start*rate));local=np.arange(count)/rate
 envelope=(1-np.exp(-local*12))*np.exp(-local*1.4)
 signal=(np.sin(2*np.pi*frequency*local)+.18*np.sin(2*np.pi*frequency*2*local))*envelope*.022
 begin=round(start*rate);score[begin:begin+count,0]+=signal;score[begin:begin+count,1]+=signal*.94
key,_=sf.read(S/'key.wav',always_2d=True);key/=max(abs(key).max(),1e-8);effects=np.zeros((n,2));events=[]
event_specs=[(0,0,'mechanical','request_arrival'),(1,.75,'mechanical','allocation_failure'),(2,0,'mechanical','early_exit'),(3,.22,'impact','unsafe_access'),(5,.2,'mechanical','patched_path')] if f['episode']=='oom' else [(0,0,'mechanical','preview'),(1,.2,'mechanical','allocation'),(2,.42,'mechanical','release'),(3,.72,'impact','unsafe_access'),(5,.18,'mechanical','reference_reset')]
if f['validationProfile']=='wordpress-runtime-v1':event_specs=f['soundEvents']
for i,fraction,kind,purpose in event_specs:
 shot=f['shots'][i];frame=shot['start_frame']+math.ceil((shot['end_frame_exclusive']-shot['start_frame']-1)*fraction);at=frame/f['fps'];events.append({'at':at,'frame':frame,'kind':kind,'shot':shot['id'],'purpose':purpose})
 if kind=='mechanical':src=key*.055
 else:
  local=np.arange(round(.8*rate))/rate;phase=2*np.pi*(78*local-25*local**2);signal=np.sin(phase)*np.exp(-local*7)*np.minimum(1,local/.008)*.13;src=np.column_stack([signal,signal])
 begin=round(at*rate);count=min(len(src),n-begin);effects[begin:begin+count]+=src[:count]
duck=np.ones(n)
for cue in cues:
 a,b=cue['startSample'],cue['endSample'];duck[a:b]=.25
 lo=max(0,a-2400);duck[lo:a]=np.minimum(duck[lo:a],np.linspace(1,.25,a-lo))
 hi=min(n,b+4800);duck[b:hi]=np.minimum(duck[b:hi],np.linspace(.25,1,hi-b))
# EP03: make room in the speech band using the measured voice envelope.
# The existing episode mix path stays unchanged.
carve=None
if f['validationProfile']=='wordpress-runtime-v1':
 activity=(1-duck)/.75
 freqs=np.fft.rfftfreq(n,1/rate)
 gain=np.interp(freqs,[0,180,250,2500,3500,rate/2],[1,1,10**(-9/20),10**(-9/20),1,1])
 for track in [bed,score]:
  carved=np.fft.irfft(np.fft.rfft(track,axis=0)*gain[:,None],n=n,axis=0)
  track[:]=track*(1-activity[:,None])+carved*activity[:,None]
 carve={'method':'Speech-interval envelope blends a spectral notch into music and ambience, before level ducking','bandHz':[250,2500],'gainDb':-9,'envelope':'measured utterance spans; 50ms attack / 100ms release','silence':'original spectrum restored during pauses'}
bed*=duck[:,None];score*=duck[:,None]
silences=[]
for previous,cue in zip(cues,cues[1:]):
 if cue['gapBefore']>.3:silences.append([previous['end'],cue['start']])
for track in [bed,score,effects]:
 for lo,hi in silences:
  a,b=round(lo*rate),round(hi*rate);ramp=min(a,2400);track[a-ramp:a]*=np.linspace(1,0,ramp)[:,None];track[a:b]=0
  end=min(n,b+480);track[b:end]*=np.linspace(0,1,end-b)[:,None]
 end=n-round(.15*rate);begin=end-round(1.1*rate);track[begin:end]*=np.linspace(1,0,end-begin)[:,None];track[end:]=0
for name,data in [('ambience',bed),('music',score),('effects',effects)]:sf.write(A/f'{name}.wav',data,rate,subtype='PCM_16')
sf.write(A/'premix.wav',voice+bed+score+effects,rate,subtype='PCM_24')
def measure(path):
 r=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',str(path),'-af','loudnorm=I=-14:TP=-2:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 return json.loads(r.stderr[r.stderr.rfind('{'):])
m=measure(A/'premix.wav')
filter=f'loudnorm=I=-14:TP=-2:LRA=9:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true,aresample=48000,apad,atrim=end_sample={n}'
subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(A/'premix.wav'),'-af',filter,'-ar','48000','-ac','2','-c:a','pcm_s16le',str(A/'mix.wav')],check=True)
actual=measure(A/'mix.wav');receipt={'sampleRate':rate,'samples':n,'duration':n/rate,'integratedLufs':float(actual['input_i']),'truePeakDbtp':float(actual['input_tp']),'intentionalSilences':silences,'events':events,'score':'Original deterministic 68-BPM low-register motif; spectral separation and measured-utterance ducking.','normalization':m,'humanListening':'pending','mixSha256':hashlib.sha256((A/'mix.wav').read_bytes()).hexdigest()}
if carve:receipt['spectralCarve']=carve
f['events']=events;(P/'film.json').write_text(json.dumps(f,indent=2)+'\n')
(A/'mix-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
