from pathlib import Path
import json,subprocess,hashlib,math
from array import array
root=Path.cwd();P=root/'examples/wordpress-php';O=root/'output/wordpress-php';movie=O/'wordpress-php-review.webm';f=json.loads((P/'film.json').read_text())
r={'status':'failed','file':movie.name,'scope':'AV1/Opus browser derivative; MP4 is the delivery master'}
try:
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)]));v=next(x for x in probe['streams'] if x['codec_type']=='video');a=next(x for x in probe['streams'] if x['codec_type']=='audio')
 assert v['codec_name']=='av1' and v['width']==1080 and v['height']==1920 and v['r_frame_rate']=='30/1';assert a['codec_name']=='opus' and a['sample_rate']=='48000' and a['channels']==2
 assert abs(float(probe['format']['duration'])-f['duration'])<.05
 decoded=subprocess.check_output(['ffmpeg','-v','error','-nostdin','-i',str(movie),'-map','0:v:0','-f','framemd5','-'],text=True)
 v['nb_read_frames']=sum(1 for line in decoded.splitlines() if line and not line.startswith('#'))
 assert v['nb_read_frames']==f['frameCount'], 'Decoded video frame count mismatch'
 streams=[]
 for file in [P/'assets/audio/mix.wav',movie]:
  data=array('h');data.frombytes(subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-vn','-ar','8000','-ac','1','-f','s16le','-']));streams.append(data)
 n=min(map(len,streams));x,y=streams;ex=sum(z*z for z in x[:n]);ey=sum(z*z for z in y[:n]);corr=sum(a*b for a,b in zip(x[:n],y[:n]))/math.sqrt(ex*ey);nrmse=math.sqrt(sum((a-b)**2 for a,b in zip(x[:n],y[:n]))/ex)
 assert corr>=.98 and nrmse<=.15
 proc=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',str(movie),'-vn','-af','loudnorm=I=-14:TP=-1:print_format=json','-f','null','-'],capture_output=True,text=True,check=True);m=json.loads(proc.stderr[proc.stderr.rfind('{'):]);assert -15<=float(m['input_i'])<=-13 and float(m['input_tp'])<=-1, f'Audio levels outside limits: {m}'
 pixels=json.loads((O/'review-copy-pixels/report.json').read_text());assert pixels['status']=='passed'
 r.update(status='passed',sha256=hashlib.sha256(movie.read_bytes()).hexdigest(),frames=int(v['nb_read_frames']),duration=float(probe['format']['duration']),audioCorrelation=corr,audioNormalizedRMSE=nrmse,integratedLufs=float(m['input_i']),truePeakDbtp=float(m['input_tp']),fullDecode='passed',pixelComparison={'status':pixels['status'],'samples':len(pixels['frames']),'minimumPsnr':pixels['minimumPsnr']})
except Exception as e:r['error']=str(e)
(O/'review-copy.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r));raise SystemExit(0 if r['status']=='passed' else 1)
