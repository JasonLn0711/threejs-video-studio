"""Content-timed cinematic narration. Never changes speech rate to fit a slot."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
import shutil
import importlib.metadata


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def stamp(t, sep=','):
    ms = round(t * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{sep}{ms%1000:03}'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--project', required=True)
    p.add_argument('--model', required=True)
    p.add_argument('--voices', required=True)
    a = p.parse_args()
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro
    project = Path(a.project)
    film = json.loads((project/'film.json').read_text())
    folder = project/'assets/audio'
    cache = project/'.cache/speech'
    folder.mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)
    models = {str(Path(x).name): sha(Path(x)) for x in [a.model, a.voices]}
    runtime = {x: importlib.metadata.version(x) for x in ['kokoro-onnx','onnxruntime','numpy','soundfile']}
    engine = None
    segments, audio = [], []
    cursor = round(film['audioTiming']['startSeconds']*48000)
    for i, line in enumerate(film['narration']):
        recipe = {'text':line['text'], 'voice':film['voice'], 'models':models, 'runtime':runtime}
        key = hashlib.sha256(json.dumps(recipe,sort_keys=True).encode()).hexdigest()
        raw = cache/f'{key}.wav'
        if not raw.exists():
            if engine is None:
                engine = Kokoro(a.model, a.voices)
            samples, rate = engine.create(line['text'], voice=film['voice']['name'], speed=1.0, lang='en-us')
            if rate != 24000 or not len(samples):
                raise RuntimeError('Invalid TTS output')
            sf.write(raw, samples, rate, subtype='PCM_16')
            (cache/f'{key}.json').write_text(json.dumps(recipe,indent=2)+'\n')
        (folder/'baseline').mkdir(exist_ok=True)
        shutil.copyfile(raw, folder/'baseline'/f'{line["id"]}.wav')
        target = folder/f'{line["id"]}.wav'
        subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(raw),'-ar','48000','-ac','2',str(target)],check=True)
        data,rate = sf.read(target,dtype='int16',always_2d=True)
        active = np.flatnonzero(np.max(np.abs(data.astype(np.int32)),axis=1)>32768*10**(-50/20))
        if not len(active):
            raise RuntimeError(f'Empty speech: {line["id"]}')
        begin,end = max(0,int(active[0])-480),min(len(data),int(active[-1])+481)
        data = data[begin:end]
        sf.write(target,data,rate,subtype='PCM_16')
        if i:
            cursor += round(line['gapBefore']*48000)
        segments.append({**line,'startSample':cursor,'endSample':cursor+len(data),'start':cursor/48000,'end':(cursor+len(data))/48000,'sha256':sha(target),'baselineSha256':sha(raw),'trimStartSample48k':begin,'trimEndSample48k':end})
        audio.append(data)
        cursor += len(data)
        print(f'speech | {i+1}/{len(film["narration"])} | {line["id"]} | {len(data)/48000:.3f}s',file=sys.stderr,flush=True)
    frames = round(film['audioTiming']['targetDurationSeconds']*film['fps']) if 'targetDurationSeconds' in film['audioTiming'] else math.ceil((cursor/48000+1.5)*film['fps'])
    if not .5 <= frames/film['fps']-cursor/48000 <= 2:
        raise RuntimeError('Narration must fit target with 0.5–2 seconds of final hold; revise the script rather than changing speech speed')
    total = frames*1600
    pcm = np.zeros((total,2),dtype=np.int16)
    for cue,data in zip(segments,audio):
        pcm[cue['startSample']:cue['endSample']] = data
    sf.write(folder/'narration.wav',pcm,48000,subtype='PCM_16')
    film['duration'],film['frameCount'] = frames/30,frames
    for i,shot in enumerate(film['shots']):
        cues = [x for x in segments if x['shot']==shot['id']]
        shot['start_frame'] = 0 if i==0 else math.floor(cues[0]['start']*30)
        shot['start'] = shot['start_frame']/30
    for i,shot in enumerate(film['shots']):
        shot['end_frame_exclusive'] = film['shots'][i+1]['start_frame'] if i+1<len(film['shots']) else frames
        shot['end'] = shot['end_frame_exclusive']/30
        shot['frames'] = shot['end_frame_exclusive']-shot['start_frame']
    admin = next((x for x in segments if x['id']=='S07-2'), None)
    if admin is not None:
        film['adminRevealSeconds'] = admin['start']
    (project/'film.json').write_text(json.dumps(film,ensure_ascii=False,indent=2)+'\n')
    (project/'captions.json').write_text(json.dumps(segments,ensure_ascii=False,indent=2)+'\n')
    for ext in ['srt','vtt']:
        sep = ',' if ext=='srt' else '.'
        body = '\n\n'.join(f'{i+1}\n{stamp(c["start"],sep)} --> {stamp(c["end"],sep)}\n{c['text']}' for i,c in enumerate(segments))
        (project/f'captions.en-US.{ext}').write_text(('WEBVTT\n\n' if ext=='vtt' else '')+body+'\n')
    report = {'status':'generated_and_assembled','voice':film['voice'],'models':models,'runtime':runtime,'sampleRate':48000,'channels':2,'samples':total,'duration':frames/30,'narrationEndSeconds':cursor/48000,'finalHoldSeconds':(total-cursor)/48000,'tempoPasses':0,'humanListening':'pending','sha256':sha(folder/'narration.wav'),'segments':segments}
    (folder/'speech-receipt.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='segments'}))


if __name__=='__main__':
    main()
