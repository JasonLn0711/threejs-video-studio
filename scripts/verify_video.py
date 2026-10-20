"""Validate and sample the actual encoded film. Uses standard-library PCM metrics."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import math
from array import array


def call(args):
    return subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def sha(p):
    with open(p, "rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--reference", default="examples/ddos-capacity/assets/audio/narration.wav")
    parser.add_argument("--output", default="qa/encoded")
    args = parser.parse_args()
    movie = Path(args.video)
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    probe = json.loads(call(["ffprobe", "-v", "error", "-count_frames", "-show_streams",
                             "-show_format", "-of", "json", str(movie)]).stdout)
    video = next(s for s in probe["streams"] if s["codec_type"] == "video")
    audio = next(s for s in probe["streams"] if s["codec_type"] == "audio")
    checks = {
        "dimensions": (video["width"], video["height"]) == (1080, 1920),
        "frames": int(video["nb_read_frames"]) == 1800,
        "fps": video["avg_frame_rate"] == "30/1",
        "codecs": video["codec_name"] == "h264" and audio["codec_name"] == "aac",
        "sampleRate": audio["sample_rate"] == "48000" and audio["channels"] == 2,
        "duration": abs(float(probe["format"]["duration"]) - 60) < .05,
    }
    decoded = call(["ffmpeg", "-v", "error", "-i", str(movie), "-f", "null", "-"])
    checks["fullDecode"] = not decoded.stderr
    black = call(["ffmpeg", "-hide_banner", "-i", str(movie), "-an", "-vf",
                  "blackdetect=d=0.05:pix_th=0.005:pic_th=0.98", "-f", "null", "-"])
    black_lines = [x for x in black.stderr.decode().splitlines() if "black_start:" in x]
    checks["noUnexpectedBlack"] = not black_lines
    freeze = call(["ffmpeg", "-hide_banner", "-i", str(movie), "-an", "-vf",
                   "crop=1080:740:0:565,freezedetect=n=-80dB:d=2", "-f", "null", "-"])
    freeze_lines = [x for x in freeze.stderr.decode().splitlines() if "freeze_start:" in x]
    checks["noUnexpectedFreeze"] = not freeze_lines
    timestamps = json.loads(call(["ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "frame=best_effort_timestamp_time", "-of", "json", str(movie)]).stdout)["frames"]
    checks["constantFrameTimestamps"] = len(timestamps) == 1800 and all(
        abs(float(f["best_effort_timestamp_time"]) - i/30) < .00001 for i, f in enumerate(timestamps))
    project = Path(args.reference).resolve().parents[2]
    cues = json.loads((project / "captions.json").read_text())
    film = json.loads((project / "film.json").read_text())
    checks["subtitleCoverage"] = len(cues) == len(film["narration"]) and all(
        c["text"] == n["text"] and c["start"] == n["at"] and c["start"] < c["end"] <= n["until"]
        and (i == 0 or cues[i-1]["end"] <= c["start"])
        for i, (c, n) in enumerate(zip(cues, film["narration"])))
    pcm = []
    for file in [args.reference, str(movie)]:
        data = call(["ffmpeg", "-v", "error", "-i", file, "-vn", "-ar", "48000", "-ac", "2",
                     "-t", "60", "-f", "s16le", "-"]).stdout
        a = array("h"); a.frombytes(data); pcm.append(a)
    a, b = pcm
    checks["decodedAudioFrames"] = len(a) == len(b) == 60 * 48000 * 2
    if len(a) != len(b):
        raise RuntimeError("Unexpected decoded PCM length")
    aa = sum(x*x for x in a); bb = sum(x*x for x in b)
    ab = sum(x*y for x, y in zip(a, b))
    correlation = ab / math.sqrt(aa*bb)
    nrmse = math.sqrt(sum((x-y)**2 for x, y in zip(a, b)) / aa)
    checks["audioReferenceAgreement"] = correlation >= .98 and nrmse <= .15
    frames = sorted(set([n * 30 for n in range(60)] + [1799] +
                        [round(b["start"] * film["fps"]) + d for b in film["beats"][1:] for d in [-1, 0, 1]]))
    select = "+".join(f"eq(n\\,{f})" for f in frames)
    call(["ffmpeg", "-v", "error", "-i", str(movie), "-vf", f"select='{select}'",
          "-fps_mode", "vfr", "-y", str(out / "sample-%03d.png")])
    samples = [{"frame": f, "file": f"sample-{i+1:03}.png", "sha256": sha(out / f"sample-{i+1:03}.png")}
               for i, f in enumerate(frames)]
    report = {"status": "passed" if all(checks.values()) else "failed",
              "videoSha256": sha(movie), "referenceSha256": sha(Path(args.reference)), "checks": checks,
              "video": {k: video[k] for k in ["width", "height", "codec_name", "avg_frame_rate", "nb_read_frames", "pix_fmt"]},
              "duration": float(probe["format"]["duration"]), "blackIntervals": black_lines, "freezeIntervals": freeze_lines,
              "freezeMethod": "FFmpeg freezedetect on the 1080x740 canvas at (0,565), -80 dB noise threshold, minimum 2 seconds; excludes the static title/caption field",
              "audio": {"correlation": correlation, "normalizedRMSE": nrmse, "decodedAudioFrames": len(b)//2,
                        "scope": "All decoded PCM samples; zero-shift comparison; lossy AAC tolerance."},
              "samples": samples, "visualReview": "pending", "humanListening": "pending"}
    (out / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "samples"}))
    if report["status"] != "passed":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
