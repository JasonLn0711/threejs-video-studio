# The Missing Signature

- workflow: general-video
- flow: automation
- storyboard: yes
- owner: threejs-video-studio
- profile: cinematic-short-v1
- destination: YouTube Shorts; local production and publication-copy draft
- audience: general technology and cybersecurity viewers
- takeaway: inspecting identity claims without verifying the signature defeats the authentication boundary
- language: US English narration and captions
- voice: Kokoro am_michael, speed 1.0; synthetic, not a cloned person
- format: 1080 × 1920, 30 fps, H.264/AAC, 48 kHz stereo
- duration: measured narration plus bounded editorial holds; film.json is authoritative
- source: reference/manifest.json preserves all eight supplied files and their hashes
- review gate: satisfied; the user approved the proof and authorized the specified revisions plus full rendering.

## Adopted changes to the reference

The user selected content-driven duration and a calm American male voice. The original 60-second/1,800-frame anchors remain untouched in reference/. The measured film has 12 shots and 14 speech units. S07's colon becomes a sentence boundary to make the 0.55-second pause reproducible; S12 has two spoken units. Speech is neither sped up nor truncated.

The proof is an editorial montage, not a continuous extract: S07 occupies 0–4.3 s, S08 4.3–6.3 s, and S09 6.3–10 s. It includes S09's first clause, ending inside a measured pause. The final film retains the entire S09 sentence. The proof's visual holds are explicit and its narration tail remains below two seconds.

The existing licensed-font packaging rule takes precedence over the reference's blanket font exclusion. All fonts are local, hash-identified and accompanied by their licenses. The current repository has its own tested hf-seek integration; no CEH settings are changed.

## Acceptance and scope

Review the male voice, admin pause, hard cut to 1, tower reveal, estimate qualifiers and caption readability in the actual MP4. Technical acceptance, human listening, three-viewer retelling, full-film approval and social publication have distinct statuses. Full render was authorized by the user on 2026-10-21 with the English-caption, narration-continuity and shorter-gap revisions. No upload or Git publication is included.

## Adopted full-film revision

User instruction: 「請改為英文字幕。旁白的撰寫上必須有上下文關聯的流暢性（美式口語化英文）。另外，每句間隔請縮短 0.1秒。其餘核准，可渲染 49.23秒全片。」

The revised narration preserves the source claims and connects the discovery, failed username lookup, human intervention, query result, scope and disclosure. All 13 inter-utterance gaps are 0.1 seconds shorter: ordinary gaps are 0.25 seconds, with a 0.55-second pre-admin reveal. The final duration is exactly 1,477 frames (49.233333 seconds); narration ends at 47.881146 seconds, leaving a 1.352188-second hold. No voice-rate change or speech truncation is used. English display captions and SRT/VTT share 20 cues; internal phrase splits are estimated from utterance timing and nearby acoustic silence, not claimed as word-level forced alignment. The prior proof remains archived unchanged.
