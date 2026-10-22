# PHP runtime Shorts — delivery evidence

Three complete 1080×1920, 30 fps films with US English Kokoro `am_michael` narration, burned-in English captions, music and event effects. Human viewing/listening acceptance remains pending; no social publication was requested.

| Episode | Duration | Frames | Evidence |
| --- | ---: | ---: | --- |
| Before Your Code Runs | 53.47 s | 1604 | [php-oom](php-oom/qa.json) |
| The Pointer That Stayed | 57.27 s | 1718 | [php-stale-state](php-stale-state/qa.json) |
| WordPress Is Updated. Is Your PHP? | 49.77 s | 1493 | [wordpress-php](wordpress-php/qa.json) |

## Delivery

[Local review player](../../../output/php-series-review/index.html). Each `output/<episode>/` contains the MP4, editable ZIP, SRT/VTT, sources, credits, keyframes and QA report. Output media is locally generated and ignored by Git.

## Verification scope

The browser checked every frame through native HyperFrames seeking, plus repeated out-of-order seeks. Full decoded streams passed audio, black-frame and freeze detection. Sampled decoded frames, including cut boundaries, matched browser captures within the existing delivery tolerance. Each editable archive passed CRC, extracted-file hashes, a clean dependency install, rebuilding and full-frame browser checks with strict sampled pixel comparison on this machine.

Narration timing uses measured utterances with proportional phrase splits, not word-level forced alignment. Technical source review is editorial, not a live exploit experiment. Automated checks do not establish pronunciation quality or human cinematic acceptance.

The initial EP01 render was retained as a rejected attempt because its slow eased closing camera triggered freeze detection. The closing camera was revised and the complete check/render sequence repeated. No tolerance was weakened to accept that attempt. The first EP02 native capture logged WebGL context loss and lost parts of its canvas. Encoded pixel comparison rejected it. EP02 now uses a CPU-backed presentation canvas; the complete source check and render were repeated. Raw run records remain under `qa/projects/<episode>/runs`.

## Final regression and review evidence

[Legacy regression](legacy-regression.json) passed: 41 DDoS and 36 Missing Signature captures matched their pre-task golden images exactly. All 199 protected original files and dependency files retained their hashes. JavaScript tests: 15 passed; Python audio tests: 9 passed.

Agent visual inspection covered six decoded shot midpoints and the final frame of each film: [EP01 review](php-oom/visual-review.json), [EP02 review](php-stale-state/visual-review.json). This is sampled visual inspection, not human acceptance or a claim to have listened to the complete films.

The review page links, final video hashes and editable archive hashes were checked after delivery assembly. Browser playback validation is recorded separately from the H.264 delivery checks.

[Review player validation](review-player.json) passed for both AV1/Opus WebM fallback files: metadata loaded, playback decoded frames, and seeking to 10 seconds succeeded. The installed automation Chromium does not support H.264; the final H.264/AAC MP4s passed full FFmpeg decode and remain the delivery masters. [Review-copy audio and format checks](review-copies.json) are recorded separately.

## Episode 3 — WordPress/PHP maintenance

EP03 adds an independent wordpress-runtime-v1 scene model. Runtime patch status stays unknown at every frame; observing a version or illustrating a vendor patch never certifies a real site. All 1,493 frames passed browser state/layout checks. The final H.264/AAC master passed complete decode, audio, black/freeze detection and sampled pixel comparisons. Its editable archive passed clean installation, rebuild and native-seek comparison. New QA: [EP03 evidence](wordpress-php/qa.json).

The shared workflow changes passed 18 JavaScript tests and 9 Python audio tests. Previous PHP episodes passed sampled pixel regression against their existing captures. All 364 protected original source/assets/deliverables and the dependency files remained unchanged. EP01/EP02 historical evidence above remains the record of their original delivery.

The third subtitle uses measured utterance edges and editorial phrase divisions with proportional timing; it is not word-level forced alignment. Human viewing/listening and publication remain pending.

[Updated three-film player validation](wordpress-php/review-player.json) passed playback and seeking for all three browser copies and resolved 25 local artifact links. EP03's first Opus derivative exceeded the audio peak ceiling; the retained rejected attempt was replaced with audio from the PCM mix at -0.4 dB. The accepted derivative measures -14.78 LUFS / -1.90 dBTP, and its video bitstream is unchanged. MP4 and editable archive verification were unaffected.

[Delivery and ownership record](../../../docs/php-series-delivery-2026-10-22.md) connects the accepted request, episode sources, upload copy and Planning review gate.
