# The Missing Signature — English full film

> Git archive of the authored source. The supplied reference bundle is preserved under `reference/`. Local audio and compiled delivery files are held with the original production materials.

A 49.233333-second, 12-shot cybersecurity Short with conversational US English narration and English captions. The user approved the visual proof and authorized this revision and full rendering. `film.json` records that approval and the reviewed proof hash. Historical reference files remain unchanged under `reference/`.

## Reproduce

Use Node.js 22+, Python 3, FFmpeg and Chromium with hardware WebGL. Set `HYPERFRAMES_BROWSER_PATH` if browser discovery requires it. The archive includes generated voice/audio stems and licensed fonts; model weights are not needed to render the existing narration.

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm run build --project examples/the-missing-signature
pnpm run preview --project examples/the-missing-signature --port 3049
pnpm run check --project examples/the-missing-signature
pnpm run render --project examples/the-missing-signature --output output/the-missing-signature
pnpm run package --project examples/the-missing-signature --output output/the-missing-signature
```

Before the full render, place the originally reviewed `proof-10s.mp4` in the selected output directory. Its SHA-256 must match the approval record. The separate proof-stage ZIP and MP4 preserve that original version; the full-film archive retains historical proof metadata and audio as identity-check fixtures. Use the separate proof-stage archive to reproduce the original proof.

To regenerate speech, use `scripts/cinematic-speech.py --project examples/the-missing-signature --model MODEL_PATH --voices VOICES_PATH` inside the environment from `requirements-audio.txt`. Then run `scripts/signature-captions.py`, `scripts/cinematic-mix.py` and `scripts/signature-layout.py` from the repository root. Speech stays at speed 1.0; the target duration requires a final hold between 0.5 and 2 seconds. The current hold is 1.352188 seconds. All ordinary sentence gaps are 0.25 seconds; the admin reveal gap is 0.55 seconds.

`captions.en-US.srt`, `captions.en-US.vtt` and `display-captions.json` contain the same 20 English cues. Utterance boundaries are measured; internal phrase timings are estimated and snapped to nearby silence. They are not word-level forced alignment.

The native PNG sequence, encoded-pixel comparison, AAC verification and source-bound receipt are recorded under `qa/projects/the-missing-signature/`. Packaging checks all archive hashes and performs a fresh installation, build and sequential browser replay with a strict, documented GPU edge-raster tolerance. Human listening and phone review of the final film remain separate from technical acceptance. Publication is not performed.

Publish `CREDITS.md` and the source attribution in `SOURCES.md` with any upload. Minimal DDoS JSON fixtures are included for shared tests; the DDoS delivery is unchanged.
