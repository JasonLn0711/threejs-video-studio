"""Independent source/caption checks and decoded-video anomaly detection."""
import argparse,json,hashlib,subprocess,re,math
from pathlib import Path

def require(ok,message):
 if not ok:raise ValueError(message)
def verify(project,video=None):
 P=Path(project);f=json.loads((P/'film.json').read_text());cues=json.loads((P/'captions.json').read_text());display=json.loads((P/'display-captions.json').read_text())
 require(45<=f['duration']<=60,'Film must be 45–60 seconds')
 require(f['frameCount']==round(f['duration']*30),'Frame count mismatch')
 require(f['voice']=={'name':'am_michael','speed':1.0,'language':'en-us'},'Voice contract changed')
 require(f['review']['mode']=='final_only' and bool(f['review']['renderAuthorization']),'Missing render authorization')
 require(f['review']['humanReview']=='pending','Human acceptance cannot be inferred')
 previous=0
 for shot in f['shots']:
  require(shot['start_frame']==previous and shot['end_frame_exclusive']>previous,'Shot gap or overlap');previous=shot['end_frame_exclusive']
 require(previous==f['frameCount'],'Shots do not cover film')
 for cue,line in zip(cues,f['narration']):
  require(cue['text']==line['text'],'Spoken source text mismatch')
  pieces=[c for c in display if c['utterance']==cue['id']]
  require(len(pieces)>0,'Missing caption')
  require(' '.join(' '.join(c['text'].split()) for c in pieces)==cue['text'],'Caption omission or changed words')
  require(abs(pieces[0]['start']-cue['start'])<1e-7 and abs(pieces[-1]['end']-cue['end'])<1e-7,'Caption edge differs from measured voice')
  for i,c in enumerate(pieces):
   require(c['end']>c['start'] and len(c['text'].splitlines())<=2,'Caption interval or line count')
   require(all(len(x)<=32 for x in c['text'].splitlines()),'Caption line too long')
   if i:require(abs(pieces[i-1]['end']-c['start'])<1e-7,'Phrase gap/overlap')
 require(len(cues)==len(f['narration']),'Missing speech clips')
 report={'status':'passed','project':f['id'],'duration':f['duration'],'frameCount':f['frameCount'],'utterances':len(cues),'displayCues':len(display),'captionTextCoverage':'complete','timingMethod':'measured utterances; proportional phrase timing, not word forced alignment','technicalFacts':'Source-linked editorial review is documented separately; this check validates declared content consistency.','humanReview':'pending'}
 if video:
  r=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',video,'-vf','blackdetect=d=0.1:pic_th=0.98:pix_th=0.02,freezedetect=n=-60dB:d=1','-an','-f','null','-'],capture_output=True,text=True,check=True)
  black=[line.strip() for line in r.stderr.splitlines() if 'black_start:' in line]
  freeze=[line.strip() for line in r.stderr.splitlines() if 'freeze_start:' in line]
  require(not black,'Unexpected black interval: '+str(black));require(not freeze,'Unexpected frozen interval: '+str(freeze))
  report.update({'videoSha256':hashlib.sha256(Path(video).read_bytes()).hexdigest(),'blackIntervals':black,'freezeIntervals':freeze,'anomalyMethod':'Full decoded stream; black >=98% pixels below 2% for 0.1s; freeze noise -60dB for 1s'})
 return report
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--project',required=True);p.add_argument('--video');p.add_argument('--output',required=True);a=p.parse_args()
 try:report=verify(a.project,a.video)
 except Exception as e:report={'status':'failed','error':str(e)}
 Path(a.output).parent.mkdir(parents=True,exist_ok=True);Path(a.output).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));raise SystemExit(0 if report['status']=='passed' else 1)
