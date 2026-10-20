# Three.js Video Studio

An editable 3D film reference pipeline with one complete production standard.
It turns an explicit concept, a deterministic Three.js scene and measured
narration into a vertical film with inspectable delivery evidence.

**Start with [the single complete production standard](THREEJS_VIDEO_PRODUCTION_STANDARD_v1.0.md).**
It owns content, 3D design, timing, audio, validation, efficiency and packaging.
The implementation is independent of the original CEH 2D production system.

## First film

**How DDoS Fills a Network Link** explains one mechanism: distributed traffic
consumes shared link capacity and legitimate traffic is delayed or dropped.
The film uses a procedural 3D network, English narration and captions.
Target: 60 seconds, 1080 × 1920, 30 fps, H.264/AAC, 48 kHz stereo reference PCM.

See the [brief](examples/ddos-capacity/BRIEF.md),
[storyboard](examples/ddos-capacity/STORYBOARD.md),
[design](examples/ddos-capacity/design.md) and
[claim/source boundary](examples/ddos-capacity/SOURCES.md).
Delivery status and measured results are in [the evidence index](qa/public/README.md).
Human listening/viewing and social-platform upload are separate acceptance layers.

Current timing revision: 15 sentences with exactly 0.35 seconds between processed
clips. Wording and voice speed are preserved. Narration ends at 42.381917 seconds;
the animated takeaway continues for 17.618083 seconds, reaching exactly 60 seconds.
`python3 scripts/verify_audio.py` verifies all 14 gaps at PCM sample precision.

Cinematic event cues now mark the first packet loss and a later lost legitimate
request with red warning type, an outlined exclamation mark, a brief camera push
and a local expanding ring. The server stays online throughout the model.

## Setup

Use Node.js 24, Python 3.12+ and FFmpeg/ffprobe on PATH.
The first measured production environment is Linux ARM64 with NVIDIA GB10.
Other environments require their own browser/GPU checks.

```bash
npm ci
npx playwright install chromium
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-audio.txt
python3 scripts/download_models.py --directory models
.venv/bin/python scripts/speech.py --models models
npm run build
npm run preview
```

For Windows, use the equivalent virtual-environment Python executable.
The provided scripts are validated on Linux; Windows execution is not certified.
The downloaded model files are separately licensed and excluded from Git.
Source model hashes are enforced by the downloader and stored in speech receipts.

The editable delivery archive includes generated audio, captions, source and
fonts. Restoring that archive requires no TTS inference: install npm dependencies
and build. A fresh Git clone generates speech before attempting full-film checks.
Sentence captions are measured at actual clip boundaries, not word-aligned.

HyperFrames uses the pinned Playwright browser path unless
`HYPERFRAMES_BROWSER_PATH` is explicitly set. This avoids an automatic system
browser installation on Linux ARM64. Browser dependencies may still require
installation on a new operating system.

## Production

```bash
npm run preview
npm run check
npm run render
python3 scripts/verify_video.py output/ddos-capacity.mp4 --output qa/encoded --browser-report qa/public/browser.json
npm run package
```

After encoded validation, compare native and delivery frames with
`scripts/compare-encoded.mjs`; use `scripts/restore-check.mjs` on a freshly
extracted archive. The evidence index records the exact pilot outcomes.

Open preview before the final check: Studio may stamp stable editor IDs into
the HTML on first opening. That is a real source change and invalidates an older
check. The render command intentionally rejects a stale or missing QA receipt.

Set `STUDIO_OUTPUT` to an external output directory for large media; default is
the ignored `output/` directory. Keep the same setting for render and package.
`preview` uses a persistent local Studio on port 3047 and prints its actual URL.
Stop it with the pinned HyperFrames CLI's `preview --stop` in the example folder.

The renderer emits a native HyperFrames MP4, then copies its video stream into
the delivery MP4 with an explicitly encoded 48 kHz AAC track from reference PCM.
It does not re-encode the picture or change playback speed.
The final encoded-artifact checks are separate from the render receipt.

### Outputs

| Artifact | Purpose |
| --- | --- |
| `ddos-capacity.mp4` | Delivery picture and narration |
| `captions.srt` / `captions.json` | Sentence-level subtitle text and actual times |
| `render-receipt.json` | Source identity, media hash and encoding settings |
| `threejs-video-studio-editable.zip` | Editable source, required assets and included audio |
| `package-receipt.json` | CRC and extracted hash verification, outside the archive |
| `qa/runs/<run-id>/` | Preserved command logs, event trace, failures and browser captures |
| `qa/public/` | Small relative-path evidence suitable for public sharing |

## Architecture and extension

- `src/traffic.ts` bakes an inert FIFO simulation; `src/scene.ts` renders its
  absolute frame state and projected labels.
- The scene provides `prepare`, `renderAt` and `dispose`. The HyperFrames
  `hf-seek` adapter owns capture time; no wall-clock animation loop is used.
- Native host seeking and a separate all-frame scene inspection are both tested.
  DOM checks alone cannot validate meshes inside a canvas.
- Visual, QA, encoding, speech and archive identities are separate. A packaging
  implementation edit does not force a new render. Cache hits verify hashes.
- The current CLI is a reference implementation for the first pilot. To add a
  different subject, author a new one-concept film and scene against the same
  standard; do not claim an untested topic/profile has passed.

No WebGPU, imported character rig, photorealistic renderer, cloud render backend,
social upload or full generic film editor is included in v0.1.

## Checks and troubleshooting

`npm test` checks bounded queues, fixed service capacity, overload losses,
repeatability and exact beat boundaries. `npm run typecheck` validates source
types. `npm run check` combines these with native HyperFrames checks and actual
hardware browser QA. The latter verifies all 1,800 pilot frames and performs
pixel-identical repeated/reverse seeks.

- **Missing audio:** run the speech command or restore the editable archive.
- **Narration exceeds a window:** revise the script; the synthesizer fails rather
  than truncating or speeding speech.
- **Stale QA:** reopen preview if needed, then run check against the final source.
- **GPU or WebGL failure:** inspect the recorded renderer; software diagnostics
  do not certify the hardware path.
- **Interrupted operation:** keep its run directory. A render is reused only when
  its receipt and output hash match. Partial files are not accepted as cache hits.
- **Archive mismatch:** the temporary archive remains unpromoted; resolve the
  failing entry and rebuild packaging without rerendering unchanged media.

Progress and diagnostics use stderr. Studio command summaries use JSON stdout.
Every attempt retains a unique ID; a failed attempt is not overwritten by a retry.

## License

Original code and documentation: [MIT](LICENSE).
Fonts, model dependencies and installed packages retain their upstream licenses;
see [third-party notices](THIRD_PARTY_NOTICES.md).
