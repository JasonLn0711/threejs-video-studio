"""Verify speech preservation, exact PCM timing and bounded final holds."""
import argparse
from array import array
import hashlib
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import sys
import wave

RATE = 48000


def require(condition, message):
    if not condition:
        raise ValueError(message)


def final_hold(total_samples, end_sample, limit_seconds):
    require(math.isfinite(limit_seconds) and limit_seconds >= 0, 'Invalid final-hold limit')
    remaining = total_samples - end_sample
    require(0 <= remaining <= round(limit_seconds * RATE),
            f'Final hold {remaining / RATE:.6f}s exceeds limit {limit_seconds}s or truncates speech')
    return remaining / RATE


def trailing_silence(pcm, channels=2, threshold_db=-50):
    """Last above-threshold sample, independently of caption/clip metadata."""
    threshold = 32768 * 10 ** (threshold_db / 20)
    total = len(pcm) // channels
    for frame in range(total - 1, -1, -1):
        if any(abs(pcm[frame * channels + c]) >= threshold for c in range(channels)):
            return (total - frame - 1) / RATE
    return total / RATE


class Durations(HTMLParser):
    def __init__(self):
        super().__init__()
        self.values = {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id') in ('film', 'narration'):
            self.values[a['id']] = float(a.get('data-duration', 'nan'))


def verify(project):
    f = json.loads((project / 'film.json').read_text())
    cues = json.loads((project / 'captions.json').read_text())
    timing = f['audioTiming']
    require(timing['tailPolicy'] == 'bounded_final_hold', 'Unbounded final-hold policy')
    duration, fps = f['duration'], f['fps']
    require(duration > 0 and fps > 0 and math.isclose(duration * fps, round(duration * fps)), 'Timeline must contain whole frames')
    total = round(duration * RATE)
    require(len(cues) == len(f['narration']) and len(cues) > 0, 'Missing narration cues')
    hold = final_hold(total, cues[-1]['endSample'], timing['maxFinalHoldSeconds'])
    html = Durations(); html.feed((project / 'index.html').read_text())
    require(html.values == {'film': duration, 'narration': duration}, 'HTML duration differs from film.json')
    require(f['beats'][0]['start'] == 0 and f['beats'][-1]['end'] == duration, 'Beat coverage differs from film duration')
    require(all(b['start'] < b['end'] and (i == 0 or f['beats'][i-1]['end'] == b['start']) for i, b in enumerate(f['beats'])), 'Invalid beat boundaries')
    target = project / 'assets/audio/narration.wav'
    with wave.open(str(target)) as w:
        require((w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()) == (RATE, 2, 2, total), 'Reference PCM format/duration mismatch')
        pcm = array('h', w.readframes(total))
    gaps = []
    for i, (c, line) in enumerate(zip(cues, f['narration'])):
        start, end = c['startSample'], c['endSample']
        require(isinstance(start, int) and isinstance(end, int) and 0 <= start < end <= total, f'Invalid cue {i}')
        require(c['text'] == line['text'] and c['start'] == line['at'] == start / RATE and c['end'] == line['until'] == end / RATE, f'Cue/text timing mismatch {i}')
        clip_path = project / f'assets/audio/{i:02}.wav'
        require(hashlib.sha256(clip_path.read_bytes()).hexdigest() == c['sha256'], f'Changed speech clip {i}')
        with wave.open(str(clip_path)) as w:
            require((w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()) == (RATE, 2, 2, end-start), f'Clip format/length mismatch {i}')
            clip = array('h', w.readframes(w.getnframes()))
        require(pcm[start*2:end*2] == clip, f'Clipped or altered speech {i}')
        previous = cues[i-1]['endSample'] if i else 0
        gap = start - previous
        expected = round((timing['sentenceGapSeconds'] if i else timing['startSeconds']) * RATE)
        require(gap == expected and not any(pcm[previous*2:start*2]), f'Unexpected gap {i}')
        if i: gaps.append(gap)
    require(not any(pcm[cues[-1]['endSample']*2:]), 'Unexpected sound after narration')
    require(max(abs(x) for x in pcm) < 32767, 'Clipping detected')
    silence = trailing_silence(pcm)
    require(silence <= timing['maxFinalHoldSeconds'] + .05, 'Measured trailing silence exceeds limit')
    return {'status': 'passed', 'sentences': len(cues), 'gaps': gaps,
            'gapSeconds': timing['sentenceGapSeconds'], 'sampleRate': RATE,
            'audioFrames': total, 'durationSeconds': duration,
            'narrationEndSeconds': cues[-1]['end'], 'animatedTailSeconds': hold,
            'finalHoldSeconds': hold, 'maxFinalHoldSeconds': timing['maxFinalHoldSeconds'],
            'trailingSilenceSeconds': silence, 'silenceThresholdDb': -50,
            'pcmSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
            'scope': 'Exact original processed clips, PCM gaps and bounded ending. Human listening remains separate.'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', default='examples/ddos-capacity')
    args = parser.parse_args()
    print('audio-timing | checking clips, gaps and final hold', file=sys.stderr)
    try:
        result = verify(Path(args.project))
    except (ValueError, KeyError, OSError, wave.Error) as e:
        print(json.dumps({'status': 'failed', 'error': str(e)}))
        print(f'audio-timing | failed | {e}', file=sys.stderr)
        raise SystemExit(1)
    print(json.dumps(result))
    print('audio-timing | passed', file=sys.stderr)


if __name__ == '__main__':
    main()
