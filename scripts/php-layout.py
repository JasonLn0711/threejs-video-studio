"""Measured phrase captions and the shared series layout; no speech-rate changes."""
import argparse,json,textwrap
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--project',required=True);a=p.parse_args();P=Path(a.project)
f=json.loads((P/'film.json').read_text());voice=json.loads((P/'captions.json').read_text());display=[]
for cue in voice:
 words=cue['text'].split();groups=[];current=[]
 for w in words:
  if current and (len(' '.join(current+[w]))>57 or len(current)>=9):groups.append(current);current=[]
  current.append(w)
 if current:groups.append(current)
 elapsed=0
 for i,g in enumerate(groups):
  start=cue['start']+(cue['end']-cue['start'])*elapsed/len(words);elapsed+=len(g)
  end=cue['end'] if i==len(groups)-1 else cue['start']+(cue['end']-cue['start'])*elapsed/len(words)
  lines=textwrap.wrap(' '.join(g),width=32,break_long_words=False,break_on_hyphens=False)
  if len(lines)>2:raise ValueError('Caption needs more than two lines')
  display.append({'id':f'{cue["id"]}-{i+1}','utterance':cue['id'],'start':start,'end':end,'text':'\n'.join(lines),'alignment':'phrase estimate within measured utterance; not word forced alignment'})
(P/'display-captions.json').write_text(json.dumps(display,indent=2)+'\n')
def stamp(t,sep=','):
 m=round(t*1000);return f'{m//3600000:02}:{m//60000%60:02}:{m//1000%60:02}{sep}{m%1000:03}'
for ext in ['srt','vtt']:
 sep=',' if ext=='srt' else '.'
 (P/f'captions.en-US.{ext}').write_text(('WEBVTT\n\n' if ext=='vtt' else '')+'\n\n'.join(f'{i+1}\n{stamp(c["start"],sep)} --> {stamp(c["end"],sep)}\n{c["text"]}' for i,c in enumerate(display))+'\n')
style='''@font-face{font-family:Oswald;src:url('assets/fonts/Oswald.ttf')}@font-face{font-family:'IBM Plex Mono';src:url('assets/fonts/IBMPlexMono-Regular.ttf')}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#070B14;color:#F1F4F6}#film{position:relative;width:100%;height:100%;overflow:hidden}.clip{position:absolute;inset:0;width:100%;height:100%}#world{position:absolute;inset:0;width:1080px;height:1920px}#top{position:absolute;left:100px;top:250px;width:790px;font:400 22px/32px 'IBM Plex Mono';color:#adc7cf;display:flex;justify-content:space-between;border-top:1px solid #46616e;padding-top:16px}#headline{position:absolute;left:100px;top:316px;width:790px;height:190px;margin:0;font:500 76px/1.12 Oswald;letter-spacing:-.5px;white-space:pre-line}#subtitle{position:absolute;left:100px;top:516px;width:790px;min-height:68px;font:400 26px/1.4 'IBM Plex Mono';color:#bdced6}#phase{position:absolute;left:100px;top:608px;font:400 23px/1.4 'IBM Plex Mono';letter-spacing:1px;color:#E0A96B}#status{position:absolute;left:100px;top:1156px;width:790px;font:400 25px/1.5 'IBM Plex Mono';color:#E0A96B;background:rgba(7,11,20,.8);padding:12px 15px;border:1px solid #38505d}#qualifier{position:absolute;left:100px;top:1227px;width:790px;height:76px;white-space:pre-line;font:400 23px/1.45 'IBM Plex Mono';color:#c0d2da}#caption{position:absolute;left:100px;top:1330px;width:790px;height:140px;margin:0;padding:5px 10px;font:400 40px/1.35 'IBM Plex Mono';background:rgba(7,11,20,.94);white-space:pre-line;text-shadow:0 2px 5px #000}#memory-label{position:absolute;min-width:190px;padding:7px 10px;border-left:2px solid #E0A96B;background:rgba(7,11,20,.9);color:#E0A96B;font:400 22px/1.35 'IBM Plex Mono'}#footer{position:absolute;left:100px;top:1630px;width:790px;color:#86a4b2;border-top:1px solid #324d5b;padding-top:15px;font:400 20px/1.6 'IBM Plex Mono'}'''
html=f'''<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{f['title']}</title><style>{style}</style></head><body><main id="film" data-composition-id="{f['id']}" data-width="1080" data-height="1920" data-duration="{f['duration']}"><section id="stage" class="clip"><canvas id="world" width="1080" height="1920" data-layout-allow-overflow aria-label="Conceptual three-dimensional PHP worker and request memory"></canvas><div id="top" data-qa-copy><span>PHP / EP{f['episodeNumber']:02} · {f['cve']}</span><span id="shot-number"></span></div><h1 id="headline" data-qa-copy></h1><div id="subtitle" data-qa-copy></div><div id="phase" data-qa-copy></div><div id="memory-label" data-qa-copy></div><div id="status" data-qa-copy></div><div id="qualifier" data-qa-copy></div><p id="caption" data-qa-copy></p><div id="footer">{f['cve']} · OCT 21, 2026 · CONCEPTUAL VISUALIZATION · PHP OFFICIAL ADVISORY</div></section><audio id="mix" src="assets/audio/mix.wav" data-start="0" data-duration="{f['duration']}" data-track-index="1"></audio></main><script src="assets/js/gsap.min.js"></script><script>window.__timelines=window.__timelines||{{}};window.__timelines['{f['id']}']=gsap.timeline({{paused:true}}).to({{clock:0}},{{clock:1,duration:{f['duration']},ease:'none'}});</script><script type="module" src="dist/scene.js"></script></body></html>'''
(P/'index.html').write_text(html+'\n')
rows=[]
cameras=['Macro hook and motivated push-in','Controlled orbit revealing two lifetimes' if f['episode']=='stale' else 'Tracking into the request memory section','Hold on incomplete state / retained reference','Track the consumer and rack focus to invalid memory','Pull back to the worker permission boundary','Match composition; correct lifecycle; restrained pullback']
for i,s in enumerate(f['shots']):
 lines=[c for c in voice if c['shot']==s['id']]
 rows.append(f"| {s['id']} | {s['start']:.3f}–{s['end']:.3f} | {cameras[i]} | {' '.join(c['text'] for c in lines)} |")
(P/'STORYBOARD.md').write_text('# Measured storyboard\n\nTiming follows complete measured speech. Macro / tracking / controlled orbit are deterministic Three.js camera poses; focus follows real depth. SVG path-draw semantics are used for causal connectors; no animated webpage-card simulation substitutes for the 3D model.\n\n| Shot | Seconds | Camera and purpose | Narration |\n| --- | --- | --- | --- |\n'+'\n'.join(rows)+f'\n\nTotal: {f["frameCount"]} frames, {f["duration"]:.6f} seconds. Caption phrase splits are estimated inside measured utterance intervals.\n')
print(json.dumps({'project':f['id'],'captions':len(display),'duration':f['duration']}))
