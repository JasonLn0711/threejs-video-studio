# Pilot evidence — 2026-10-20

The DDoS shared-capacity pilot has passed the recorded technical checks on Linux
ARM64 / NVIDIA GB10. Human viewing, listening and pronunciation acceptance remain
pending. No YouTube or Instagram upload has been performed.

| Layer | Result and evidence |
| --- | --- |
| Source | One concept; illustrative FIFO model; pinned Three.js/HyperFrames; 3 unit tests and TypeScript checks pass |
| Native host | [HyperFrames check](native-check.json): 13 layout samples, 59 contrast checks, zero findings; built-in motion check disabled, covered separately below |
| 3D runtime | [Browser report](browser.json): all 1,800 frames checked for bounds; 22 native seek samples; 5 repeated/reverse seeks with identical pixels |
| Render | [Receipt](render.json): complete 60.000-second MP4, 1080×1920, 1,800 frames, 30 fps, H.264/AAC |
| Encoded media | [Automated report](encoded.json): constant frame timestamps, full decode, subtitle coverage, no detected black/frozen intervals, exact 2,880,000 decoded audio frames |
| Audio | [Original synthesis receipt](speech.json): 11 newly generated clips, af_heart, speed 1.0, zero tempo passes; AAC/reference correlation 0.999943, normalized RMS error 0.010747 |
| Pixel comparison | [12 native/encoded comparisons](encoded-comparison.json) pass the declared lossy thresholds; no registration or masking |
| Sample inspection | [Agent review](visual-review.json): all 71 extracted samples inspected; this is separate from the automated report's pending human-review field |
| Restore | [Restore report](restore.json): clean npm install and rebuild from ZIP; frames 0, 600 and 1020 match the original native captures byte-for-byte |
| CLI cancellation | [Controlled SIGTERM check](cli-interruption.json): owned check stops and records cancelled; successful prior gate retained |

Runtime: Chromium 151.0.7922.34, ANGLE / NVIDIA GB10 / OpenGL 4.5.0. Sampled
scene complexity: 82–84 draw calls and 3,472–6,328 triangles.

The full production attempt is `2026-10-20T09-35-19-057Z-render`. Its wall time,
including usage lookup and audio mux, was 356.661 seconds. HyperFrames reported
334.6 seconds for its native render; capture and encoding overlapped for 312.5
seconds and must not be added together. One worker was used. There is no paired
performance comparison or speedup claim.

**Actual capture path:** hardware WebGL rendering with screenshot capture.
`HeadlessExperimental.enable` was unavailable, so HyperFrames fell back from
BeginFrame. Some trace rows retained the requested `beginframe` label; the fallback
message, session initialization and final summary establish the actual path.

## Inspection and controls

The final encoded file SHA-256 is
`282bce7f805065fdcc76d48ae1b61c6a608c02866fcb60cf8de310a42effeadb`.
Its complete extracted-image hash inventory is in `encoded.json`.

[Contact sheet 1](contact-sheet-1.jpg), [2](contact-sheet-2.jpg),
[3](contact-sheet-3.jpg), [4](contact-sheet-4.jpg), [5](contact-sheet-5.jpg)
and [the cover extracted at frame 1650](cover.png) show the delivered picture.
These are frames from the MP4, not substitutes captured from the source preview.

The [freeze-control record](freeze-control.json) retains the initial whole-frame
false positives and the revised viewport method. A three-second static control
is correctly detected after two seconds. Detection is scoped to freezes lasting
at least two seconds; continuous human review remains a separate check.

Earlier rejected attempts remain in local run directories: a phase-locked FIFO
model initially failed the normal-traffic-loss test; floating screen-label
positions failed repeat-seek pixel equality; the first ARM64 browser auto-install
failed; Studio's first editor-ID stamping invalidated an earlier source gate.
These issues were resolved before the successful production render. No failing
capture was automatically promoted into a baseline.

## Delivery and reproducibility

Large MP4/audio/ZIP files and full raw run logs are outside Git. The editable ZIP
includes baseline and processed narration, fonts, scene source, lockfiles and
captions. Each package operation verifies CRC and every extracted SHA-256 value.
The final `package-receipt.json` stays beside the ZIP to avoid a circular archive
hash dependency; it binds the exact ZIP and the final restore result.

The public restore record concerns the identical visual source used by the final
archive. Final archive integrity and restore receipts are retained with the local
delivery. This restore test uses the same machine/GPU and does not certify another
platform or a second full-film render.

To repeat the frame comparison after extraction:

```bash
node scripts/restore-check.mjs /path/to/extracted-project qa/public/browser.json /path/to/restore-receipt.json
```

Original 2D source remains separately owned. This project writes only its own
source and delivery workspace. A local before/after inventory detected four
concurrent changes in the 2D workspace; those files were left in place. This
report therefore makes no byte-identical claim about the concurrently active
2D workspace.

Remaining acceptance: user review of the continuous film and pronunciation;
destination-specific safe-area/playback review if social publication is activated.
Fresh TTS dependency installation on another machine, cross-platform rendering,
WebGPU and social-platform publication are not certified by these receipts.
