"""English phrase captions: exact utterance bounds, estimated internal phrase splits."""
import json,re,subprocess,textwrap
from pathlib import Path

P=Path(__file__).resolve().parents[1]/'examples/the-missing-signature'
voice=json.loads((P/'captions.json').read_text());result=[]
for c in voice:
 text=c['text'];words=text.split();groups=[];current=[]
 for word in words:
  candidate=' '.join(current+[word])
  if len(textwrap.wrap(candidate,32))>2 and current:groups.append(' '.join(current));current=[word]
  else:current.append(word)
 if current:groups.append(' '.join(current))
 # Prefer grammatical authored phrase boundaries over a mid-clause wrap.
 authored={
 'S03-1':['An AI agent found it','for a sixteen-year-old researcher.'],
 'S04-1':['For ten days, it worked through','one security check after another.'],
 'S05-1':["The server checked the token's claims,",'but never verified its signature.'],
 'S09-1':['That meant seventeen databases,','with an estimated seventeen point three','trillion rows potentially reachable.'],
 'S11-1':['Microsoft restricted access','and awarded him five thousand dollars.']}
 groups=authored.get(c['id'],groups)
 assert ' '.join(groups)==text,(c['id'],groups,text)
 scan=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',str(P/'assets/audio'/f'{c["id"]}.wav'),'-af','silencedetect=n=-38dB:d=0.07','-f','null','-'],capture_output=True,text=True,check=True)
 pauses=[];start=None
 for line in scan.stderr.splitlines():
  m=re.search(r'silence_start: ([\d.]+)',line)
  if m:start=float(m[1])
  m=re.search(r'silence_end: ([\d.]+)',line)
  if m and start is not None:pauses.append((start+float(m[1]))/2);start=None
 duration=c['end']-c['start'];weights=[len(g.split()) for g in groups];bounds=[0];cum=0
 for weight in weights[:-1]:
  cum+=weight;nominal=duration*cum/sum(weights);near=[x for x in pauses if abs(x-nominal)<=.4 and x>bounds[-1]+.3 and x<duration-.3];bounds.append(min(near,key=lambda x:abs(x-nominal)) if near else nominal)
 bounds.append(duration)
 for i,g in enumerate(groups):
  wrapped='\n'.join(textwrap.wrap(g,32));assert len(wrapped.splitlines())<=2
  result.append({'id':f'{c["id"]}-caption-{i+1}','utterance':c['id'],'start':c['start']+bounds[i],'end':c['start']+bounds[i+1],'text':wrapped,'alignment':'measured utterance; estimated phrase split snapped to nearby silence'})
(P/'display-captions.json').write_text(json.dumps(result,indent=2)+'\n')
def stamp(t,sep):
 n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}{sep}{n%1000:03}'
for ext in ['srt','vtt']:
 sep=',' if ext=='srt' else '.';body='\n\n'.join(f'{i+1}\n{stamp(c["start"],sep)} --> {stamp(c["end"],sep)}\n{c["text"]}' for i,c in enumerate(result));(P/f'captions.en-US.{ext}').write_text(('WEBVTT\n\n' if ext=='vtt' else '')+body+'\n')
print(f'captions | {len(result)} English cues | at most two 32-character lines')
