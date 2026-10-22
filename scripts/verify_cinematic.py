"""Independent dry-voice, mixed-PCM and encoded cinematic acceptance."""
import argparse,json,hashlib,wave,math,subprocess
from array import array
from pathlib import Path
from verify_audio import trailing_silence

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def require(x,msg):
 if not x:raise ValueError(msg)
def pcm(p):
 with wave.open(str(p),'rb') as w:
  require((w.getframerate(),w.getnchannels(),w.getsampwidth())==(48000,2,2),'Expected 48k stereo PCM16')
  data=array('h');data.frombytes(w.readframes(w.getnframes()));return data

def measure(p):
 r=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',str(p),'-af','loudnorm=I=-14:TP=-1:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 return json.loads(r.stderr[r.stderr.rfind('{'):])

def verify(project):
 project=Path(project);f=json.loads((project/'film.json').read_text());c=json.loads((project/'captions.json').read_text());a=project/'assets/audio';dry=pcm(a/'narration.wav');mix=pcm(a/'mix.wav');n=round(f['duration']*48000)
 require(len(dry)==len(mix)==n*2,'PCM duration mismatch')
 require(round(f['duration']*30)==f['frameCount'],'Frame count mismatch')
 require(len(c)>0,'No voice cues')
 previous=0
 for i,x in enumerate(c):
  start,end=x['startSample'],x['endSample'];require(previous<=start<end<=n,'Voice overlap or truncation');require(not any(dry[previous*2:start*2]),'Unexpected dry sound outside cues')
  source=(project.parent if f['profile']=='cinematic-proof-v1' else project)/'assets/audio'/f'{x["id"]}.wav'
  original=pcm(source)
  if x.get('excerpt'):original=original[:(end-start)*2]
  require(dry[start*2:end*2]==original,'Voice differs from complete source or declared excerpt')
  if f['profile']=='cinematic-short-v1' and i:require(start-previous==round(x['gapBefore']*48000),'Sentence gap mismatch')
  previous=end
 require(not any(dry[previous*2:]),'Unexpected sound after dry narration')
 hold=(n-previous)/48000;require(hold<=2,'Excessive final hold')
 receipt=json.loads((a/'mix-receipt.json').read_text());require(receipt['mixSha256']==sha(a/'mix.wav'),'Stale mix receipt')
 for start,end in receipt['intentionalSilences']:
  quiet=mix[round((start+.02)*48000)*2:round((end-.02)*48000)*2]
  require(len(quiet)>0 and max(map(abs,quiet))<104,'Intentional near-silence masked by sound')
 m=measure(a/'mix.wav');require(-15<=float(m['input_i'])<=-13,'Mix loudness outside -14 ±1 LUFS');require(float(m['input_tp'])<=-1,'True peak exceeds -1 dBTP')
 tail=trailing_silence(mix,2,-50)
 require(tail<=2.05,'Unintended silent ending')
 # Detect long mixed-track silence separately from declared clip timing.
 scan=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',str(a/'mix.wav'),'-af','silencedetect=n=-50dB:d=0.5','-f','null','-'],capture_output=True,text=True,check=True)
 import re
 intervals=[];start=None
 for line in scan.stderr.splitlines():
  if 'silence_start:' in line:start=float(line.split('silence_start:')[1].split()[0])
  if 'silence_end:' in line and start is not None:
   end=float(line.split('silence_end:')[1].split()[0]);intervals.append([start,end]);start=None
 allowed=receipt['intentionalSilences']+[[f['duration']-2,f['duration']+.05]]
 for start,end in intervals:require(any(start>=lo-.05 and end<=hi+.05 for lo,hi in allowed),'Unexpected mixed-track silent interval')
 return {'status':'passed','project':f['id'],'duration':f['duration'],'frameCount':f['frameCount'],'narrationEndSeconds':previous/48000,'finalHoldSeconds':hold,'trailingSilenceSeconds':tail,'integratedLufs':float(m['input_i']),'truePeakDbtp':float(m['input_tp']),'detectedSilences':intervals,'intentionalSilences':receipt['intentionalSilences'],'mixSha256':sha(a/'mix.wav'),'humanListening':'pending'}

def video(project,movie):
 f=json.loads((Path(project)/'film.json').read_text());p=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(movie)]));v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
 require((v['codec_name'],v['width'],v['height'],v['r_frame_rate'],int(v['nb_read_frames']))==('h264',1080,1920,'30/1',f['frameCount']),'Video format/frame count mismatch')
 require(a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2,'Audio format mismatch')
 require(abs(float(a['duration'])-f['duration'])<.05 and abs(float(v['duration'])-f['duration'])<.05,'Stream duration mismatch')
 subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(movie),'-f','null','-'],check=True)
 streams=[]
 for file in [Path(project)/'assets/audio/mix.wav',movie]:
  data=array('h');data.frombytes(subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-vn','-ar','8000','-ac','1','-f','s16le','-']));streams.append(data)
 n=min(map(len,streams));x,y=streams;ex=sum(z*z for z in x[:n]);ey=sum(z*z for z in y[:n]);corr=sum(a*b for a,b in zip(x[:n],y[:n]))/math.sqrt(ex*ey);nrmse=math.sqrt(sum((a-b)**2 for a,b in zip(x[:n],y[:n]))/ex)
 require(corr>=.98 and nrmse<=.15,'Encoded audio differs from approved mix')
 m=measure(movie);require(float(m['input_tp'])<=-1,'Encoded true peak exceeds -1 dBTP')
 return {'status':'passed','videoSha256':sha(Path(movie)),'frames':int(v['nb_read_frames']),'duration':float(v['duration']),'audioCorrelation':corr,'audioNormalizedRMSE':nrmse,'integratedLufs':float(m['input_i']),'truePeakDbtp':float(m['input_tp']),'fullDecode':'passed','humanListening':'pending'}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--project',required=True);p.add_argument('--video');p.add_argument('--output');a=p.parse_args()
 try:r=verify(a.project);r['encoded']=video(a.project,a.video) if a.video else None
 except Exception as e:r={'status':'failed','error':str(e)}
 text=json.dumps(r,indent=2)+'\n'
 if a.output:Path(a.output).write_text(text)
 print(text,end='')
 raise SystemExit(0 if r['status']=='passed' else 1)
