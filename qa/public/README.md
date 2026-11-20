# Pilot evidence — bounded-ending revision, 2026-10-21

This revision shortens the DDoS shared-capacity film to 44.000 seconds and retains
all 15 original spoken sentences at their original speed. The final sentence ends
at 42.381917 seconds; the concluding visual holds for 1.618083 seconds.
Current-source browser and encoded-media verification passed on Linux ARM64 /
NVIDIA GB10. Human viewing, listening and
pronunciation acceptance remain pending; social publication is outside this revision.

## Source, diagnosis and adopted correction

User report, preserved verbatim:

> 你昨天給我的影片 `ddos-capacity.mp4` 後段有很奇怪的沒有旁白也沒有聲音的影片，請優化，並將優化的內容等等寫入標準化的文件規範內。

The user selected the shorter, approximately 44-second version, preserving the
original speech, speed and 0.35-second sentence gaps. The former requirement to
fill exactly 60 seconds is superseded for this film.

The prior delivered MP4 hash is
`e1a6d2ca2407555dbe638ea2904d9600fca8fbd9a282c33c3138f1833a9332d4`.
Its matching PCM/caption ledger ends at 42.381917 seconds and leaves 17.618083
seconds of silence. A read-only FFmpeg `silencedetect=noise=-50dB:d=1` scan of
that actual MP4 reported silence beginning at 42.3474 seconds and continuing to
the decoded AAC boundary at 60.0107 seconds. The former tests verified exact
sentence gaps and reference agreement but explicitly allowed the long final hold.
The file encoded successfully; its ending failed the user's viewing expectations.

The [preserved previous evidence](history/2026-10-20-cinematic-events/README.md)
retains that delivery's reports, contact sheets and technical outcomes. They apply
to the earlier source and criteria, not to this revised acceptance policy.
Local native-check report locators are normalized to repository-relative paths;
measurements and media hashes are unchanged. Original raw logs remain in local runs.

## Current acceptance inventory

| Layer | Result and evidence |
| --- | --- |
| Regression | [Ending regression](ending-regression.json): actual CLI rejects the former 17.618083-second hold; all 15 original speech segment records unchanged; 7 Node tests and 5 Python tests pass |
| PCM | [Audio timing](audio-timing.json): 14 gaps of 16,800 samples, 2,112,000 stereo sample frames, 1.618083-second final hold; independently measured silence 1.652583 seconds at -50 dBFS |
| Native host | [HyperFrames check](native-check.json): passed; browser checks ran |
| 3D runtime | [Browser report](browser.json): all 1,320 frames, 41 native seek samples and 7 repeated/reverse seeks pass |
| Render | [Receipt](render.json): 44.000-second, 1080×1920, 30 fps H.264/AAC; current source and encoded-report hash bound |
| Encoded media | [Report](encoded.json): all 16 checks pass; full decode, exact frame timestamps, subtitles, no detected black/frozen intervals, bounded final hold and AAC silence |
| Audio agreement | [Speech receipt](speech.json): 15 existing processed clips reused, zero new inference; decoded AAC/reference correlation 0.999952 and normalized RMS error 0.009874 |
| Pixel comparison | [41 comparisons](encoded-comparison.json): pass the existing lossy thresholds, including the final frame |
| Agent sample inspection | [Review](visual-review.json): all 76 decoded samples inspected in contact sheets; final frame and incident peak inspected at full resolution |
| Restore | [Candidate restore](restore.json): clean install/build; all six frames including frame 1319 match byte-for-byte; final ZIP restore receipt is delivered beside the archive |

The new MP4 SHA-256 is
`badf751046dafc2ef81d74b3039d7a74c2538243c77b88f7af590b201a9d052e`.
[Sheet 1](contact-sheet-1.jpg), [2](contact-sheet-2.jpg),
[3](contact-sheet-3.jpg), [4](contact-sheet-4.jpg), [5](contact-sheet-5.jpg),
[6](contact-sheet-6.jpg) and [7](contact-sheet-7.jpg) contain actual decoded frames.
Sheet 7 shows the caption ending and brief final hold. [Cover](cover.png) is frame 934.

The final-hold limit is 2.0 seconds; encoded boundaries allow 0.05 seconds.
The actual renderer used hardware WebGL with screenshot capture; BeginFrame was
unavailable. The CLI trace sometimes retained its requested `beginframe` label;
the renderer's final summary identifies the actual capture path.

[Optional continuous HTML playback](ending-playback.json) is `not_evaluated`:
the local ARM64 Playwright Chromium advertises neither H.264 nor AAC playback and
timed out waiting for video readiness. FFmpeg fully decoded the delivered file.
This environment limitation is recorded separately from media integrity and from
pending human continuous viewing/listening acceptance.

The regression suite covers the historical rejected 17.618083-second hold,
the exact two-second limit, a one-sample excess, truncated speech, actual decoded
silence, HTML/configuration mismatch and the complete 44-second reference PCM.
The traffic test verifies that shortening the simulation preserves its original
first 1,320 frame states. QA identities include the validators and tests, excluding
Python bytecode caches. `render` now runs encoded checks after muxing and binds
the passing report into its receipt, including when video bytes are reused.

## Editorial and runtime boundaries

The dark procedural 3D scene, English synthetic af_heart voice, captions and
existing event cues remain: amber capacity warning at frame 463, first packet
loss at 478 and legitimate request loss at 928. The server stays online in this
illustrative model. No real network traffic or defensive efficacy is measured.

The [production standard](../../THREEJS_VIDEO_PRODUCTION_STANDARD_v1.0.md)
contains the 2026-10-21 bounded-ending amendment. The brief, storyboard, design
notes and repository README describe the corrected duration. Sentence captions
retain their original measured boundaries. Technical validation, agent sample
inspection, human listening and publication are distinct acceptance layers.

Large media and complete logs remain in the local delivery workspace. The editable
archive contains source, fonts, original and processed speech clips, updated PCM,
captions, current reports and historical evidence. Archive checks verify CRC and
all extracted hashes; clean-install restore checks include the new last frame.
Restoration on this machine does not certify another GPU/platform or new TTS
inference. No Git commit, remote push or social upload is part of this correction.

## Restore diagnostic and final archive binding

The [initial restore attempt](restore-initial.json) differed only at frame 0;
frames 600, 1020, 1319, 484 and 934 matched exactly. The diagnostic rerun matched
all six frames without altering scene code, baseline pixels or equality rules.
The initial difference did not reproduce; its cause is unconfirmed. The restore
checker now saves mismatched PNGs beside a failed receipt for future diagnosis.
This does not establish that a transient first-frame issue has been fixed.

The public restore report concerns the candidate archive's visual source. The
final ZIP includes these current reports and the diagnostic improvement. A fresh
extraction of that final ZIP is checked separately; `restore-receipt.json` and
`package-receipt.json` beside the delivery bind the final ZIP hash and restore
result without a circular archive hash dependency.
