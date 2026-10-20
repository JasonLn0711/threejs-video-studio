"""Fresh local synthetic narration; immutable, content-addressed clip cache."""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import subprocess
import sys
import shutil


def digest(path):
    return hashlib.file_digest(open(path, "rb"), "sha256").hexdigest()


def stamp(seconds):
    ms = round(seconds * 1000)
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", default="examples/ddos-capacity")
    parser.add_argument("--models", default=os.environ.get("KOKORO_MODEL_DIR"))
    args = parser.parse_args()
    if not args.models:
        parser.error("set KOKORO_MODEL_DIR or pass --models (kokoro-v1.0.onnx, voices-v1.0.bin)")
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro
    root = Path(args.project)
    film = json.loads((root / "film.json").read_text())
    models = Path(args.models)
    identities = {name: digest(models / name) for name in ["kokoro-v1.0.onnx", "voices-v1.0.bin"]}
    runtime = {name: importlib.metadata.version(name) for name in ["kokoro-onnx", "onnxruntime", "numpy", "soundfile"]}
    folder = root / "assets/audio"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "baseline").mkdir(exist_ok=True)
    cache = root / ".cache/speech"
    cache.mkdir(parents=True, exist_ok=True)
    model = None
    output = np.zeros((round(film["duration"] * 48000), 2), dtype=np.int16)
    clips, generated, reused = [], 0, 0
    for i, line in enumerate(film["narration"]):
        recipe = {"text": line["text"], "voice": film["voice"], "models": identities, "runtime": runtime}
        key = hashlib.sha256(json.dumps(recipe, sort_keys=True).encode()).hexdigest()
        raw = cache / f"{key}.wav"
        receipt = cache / f"{key}.json"
        valid = raw.exists() and receipt.exists() and json.loads(receipt.read_text())["sha256"] == digest(raw)
        if valid:
            reused += 1
        else:
            if model is None:
                model = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))
            samples, rate = model.create(line["text"], voice=film["voice"]["name"],
                                         speed=film["voice"]["speed"], lang=film["voice"]["language"])
            if rate != 24000 or not len(samples):
                raise RuntimeError("Unexpected synthesis sample rate or empty audio")
            gain = min(1.0, 0.9 / max(float(np.max(np.abs(samples))), 1e-9))
            sf.write(raw, samples * gain, rate, subtype="PCM_16")
            receipt.write_text(json.dumps({"recipe": recipe, "sha256": digest(raw), "gain": gain}, indent=2))
            generated += 1
        clip = folder / f"{i:02}.wav"
        shutil.copy2(raw, folder / "baseline" / f"{i:02}.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(raw),
                        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(clip)], check=True)
        data, rate = sf.read(clip, dtype="int16", always_2d=True)
        start = round(line["at"] * rate)
        end = start + len(data)
        if end > round(line["until"] * rate):
            raise RuntimeError(f"Line {i} exceeds its window: {len(data)/rate:.3f}s > {line['until']-line['at']:.3f}s; revise text, never truncate")
        if np.any(output[start:end]):
            raise RuntimeError("Narration overlap")
        output[start:end] = data
        clips.append({"id": i, "text": line["text"], "start": start / rate, "end": end / rate,
                      "startSample": start, "endSample": end, "sha256": digest(clip),
                      "baselineSha256": digest(raw)})
        print(f"speech {i+1}/{len(film['narration'])} | generated={generated} reused={reused} | {len(data)/rate:.2f}s", file=sys.stderr)
    target = folder / "narration.wav"
    sf.write(target, output, 48000, subtype="PCM_16")
    (root / "captions.json").write_text(json.dumps(clips, indent=2) + "\n")
    (root / "captions.srt").write_text("\n\n".join(
        f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i, c in enumerate(clips)) + "\n")
    report = {"status": "generated_and_assembled", "voice": film["voice"], "models": identities,
              "runtime": runtime, "generatedClips": generated, "reusedClips": reused,
              "sampleRate": 48000, "channels": 2, "audioFrames": len(output),
              "tempoPasses": 0, "narrationSha256": digest(target),
              "humanListening": "pending", "segments": clips}
    (folder / "receipt.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "segments"}))


if __name__ == "__main__":
    main()
