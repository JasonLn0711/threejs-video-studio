"""Check the delivered PCM sentence spacing independently of synthesis."""
import json
from pathlib import Path
import wave
import hashlib
from array import array
p = Path('examples/ddos-capacity')
f = json.loads((p/'film.json').read_text())
cues = json.loads((p/'captions.json').read_text())
with wave.open(str(p/'assets/audio/narration.wav')) as w:
    assert (w.getframerate(), w.getnchannels(), w.getsampwidth()) == (48000, 2, 2)
    assert w.getnframes() == 2880000
    pcm = array('h', w.readframes(w.getnframes()))
gaps = []
for i, c in enumerate(cues):
    with wave.open(str(p/f'assets/audio/{i:02}.wav')) as w:
        clip = array('h', w.readframes(w.getnframes()))
    assert list(pcm[c['startSample']*2:c['endSample']*2]) == list(clip)
    if i:
        previous = cues[i-1]['endSample']; gap = c['startSample'] - previous
        assert gap == 16800, (i, gap)
        assert not any(pcm[previous*2:c['startSample']*2])
        gaps.append(gap)
assert not any(pcm[:cues[0]['startSample']*2])
assert not any(pcm[cues[-1]['endSample']*2:])
assert max(abs(x) for x in pcm) < 32767
result = {'status':'passed', 'sentences':len(cues), 'gaps':gaps, 'gapSeconds':.35,
          'sampleRate':48000, 'audioFrames':2880000, 'durationSeconds':60,
          'narrationEndSeconds':cues[-1]['end'], 'animatedTailSeconds':60-cues[-1]['end'],
          'pcmSha256':hashlib.sha256((p/'assets/audio/narration.wav').read_bytes()).hexdigest(),
          'scope':'Exact processed-clip boundaries and zero PCM between clips; phonetic boundary acceptance requires listening.'}
print(json.dumps(result))
