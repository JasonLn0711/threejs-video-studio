# Before Your Code Runs

A sourced cinematic explanation of CVE-2026-109618. Technical claims and simplifications are in SOURCES.md; editorial source is film.json and SCRIPT.md. Human viewing/listening and social publication remain separate from technical QA.

## Reproduce

Use the pinned root package-lock.json, Node.js 24, Python 3.12+ and FFmpeg with H.264/AAC support.

```sh
npm ci
npm run build -- --project examples/php-oom
npm run preview -- --project examples/php-oom
npm run check -- --project examples/php-oom
npm run render -- --project examples/php-oom
npm run package -- --project examples/php-oom
```

The editable archive includes generated speech and the final mix; restoration does not require TTS inference. Fresh narration uses the pinned Kokoro files documented in scripts/download_models.py and requirements-audio.txt. Rebuild captions/layout with `python3 scripts/php-layout.py --project examples/php-oom` after speech changes. Rebuild sound with `.venv/bin/python scripts/php-audio.py --project examples/php-oom`. Never regenerate old episodes as part of this workflow.

Checks bind source, runtime, audio and output hashes. Raw attempts and failures are kept under qa/projects/php-oom/runs; output defaults to output/php-oom. Rendering uses one GPU worker; H.264 NVENC is preferred, with the previous libx264 profile as a checked fallback. Review mode is final_only, reflecting the user's explicit full-production authorization, not human acceptance.

## Regenerate narration

```sh
python3 scripts/download_models.py --directory models
.venv/bin/python scripts/cinematic-speech.py --project examples/php-oom --model models/kokoro-v1.0.onnx --voices models/voices-v1.0.bin
.venv/bin/python scripts/php-audio.py --project examples/php-oom
python3 scripts/php-layout.py --project examples/php-oom
```

The narration source is `film.json`. After changing it, update SCRIPT.md and the source-backed editorial review. Speech is cached per text, voice, model hash and runtime. Preview can stamp editor IDs: open it before the final check, then render from that checked identity. The master mix includes an original 68-BPM score and credited source effects.
