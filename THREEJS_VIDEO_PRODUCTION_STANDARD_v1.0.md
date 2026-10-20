# Three.js Video Production Standard v1.0

Status: implemented specification; validation is reported separately in the
repository evidence index. A passing pilot certifies its recorded profile and
runtime, not every possible Three.js scene.

Owner: `threejs-video-studio`. Effective: 2026-10-20, Asia/Taipei.
Normative terms **MUST**, **SHOULD**, and **MAY** mean required, recommended with
a documented reason to vary, and optional. This is the complete normative
document. Examples and external references illustrate it; they do not introduce
hidden production requirements.

## 1. Purpose and scope

Produce editable, deterministic 3D films whose spatial relationships help a
viewer understand the declared subject. The standard is topic-independent.
Its first delivery profile is a vertical, single-concept educational short.
Other aspect ratios and longer films require a named profile with their own
timing, composition, budget and coverage inventory.

The first pilot explains how distributed traffic can saturate a shared network
link. It is an inert visual model. It sends no attack traffic and establishes
no measured network or defensive efficacy claim.

### Relationship to the earlier 2D system

This standard derives workflow principles from the CEH English v1.2 production
standard adopted on 2026-10-20. That release's complete validation was still
pending when this work began. Historical 2D receipts prove only their own inputs.
The 2D specifications, code, profiles and assets remain independently owned.

| Inherited principle | 3D adaptation |
| --- | --- |
| Exact timeline and audio evidence | Integer video frames and PCM sample indices |
| Explicit layout bounds | World bounds, camera projection, text bounds and occlusion review |
| Repeatable seeking | Absolute-time camera, animation, materials and simulation |
| Asset identity | Geometry generators, model/texture/font hashes and licenses |
| Changed-consumer rebuilds | Separate speech, scene, render, inspection and archive identities |
| Representative before complete QA | Difficult 3D poses before all-frame checks and full encode |
| Archive-only invalidation | Packaging edits do not invalidate unchanged video bytes |
| Actual measured performance | Renderer, GPU, capture path and overlapping stage times recorded |

The 2D film's chapter count, quiz cadence, fixed silence intervals, narration
tempo, horizontal safe areas, characters, campus and palette are not inherited.

## 2. Content contract

Each short MUST declare one concept, one audience, one learning objective and
one takeaway sentence before implementation. Every shot must explain or show
that concept. Additional mechanisms belong in another film.

The brief records destination, language, duration, visual direction, audio
identity, authoring/review mode, input sources and permitted publication scope.
A storyboard records time windows, visible cause and effect, required labels
and camera purpose even when human storyboard review is not requested.

Technical statements MUST trace to primary sources. Distinguish measured data,
simulation, illustration, inference and real observations. Illustrative rates
and colors must never be presented as captured traffic or threat classification.
Label synthetic models in the film and explain their simplifications in source.

A short may use multiple beats within one continuous scene. A beat transition
does not automatically require another model, renderer or composition.
Narration, labels and animation must express the same causal direction.

## 3. Canonical inputs and ownership

The repository owns source, the normative standard, pinned dependency manifests,
film configuration, script, storyboard, small permitted assets and public QA.
Large outputs, complete capture sets and runtime caches stay in ignored or
external workspaces. Planning may hold locators/status/capacity/next action only.

Every project MUST declare:

- unique project ID, standard version, profile version and source identity;
- one concept and audience; language and reviewed source links;
- width, height, frame rate, frame count and audio sample rate;
- beat intervals, narration text, pronunciation decisions and captions;
- stable seed, model generation parameters and asset/license manifest;
- runtime pins, actual renderer/GPU, output settings and acceptance inventory.

Sources and interpretations stay distinct from implementation, technical QA,
human acceptance and publication evidence. Prepared films do not establish
learner progress.

## 4. Short-form profile v1

| Field | Pilot/default short profile |
| --- | --- |
| Canvas | 1080 × 1920, pixel ratio 1 |
| Frame rate | 30 constant frames/second |
| Pilot duration | 60.000 seconds / 1,800 frames |
| Delivery | MP4, H.264 video, AAC audio, SDR |
| Reference audio | 48,000 Hz, stereo PCM |
| Key-copy safe rectangle | x=90..900, y=240..1480 |
| Caption zone | x=96..896, y=1330..1470; at most two visible lines |
| Primary typography | Locally supplied Oswald; IBM Plex Mono labels |
| Sound | English synthetic narration; no music in the pilot |
| Playback | Video remains 1×; no final whole-film speed transform |

These safe-area values are an internal conservative design profile, not an
official platform guarantee. Decorative geometry may extend beyond it; essential
copy must fit. Platform overlays, feed crops, covers and actual uploaded playback
need their own destination review when publication is activated.

Refresh platform requirements before upload. Vertical output is consistent with
[YouTube Shorts eligibility](https://support.google.com/youtube/answer/15424877)
and [Meta's Reels creative guidance](https://www.facebook.com/business/ads/facebook-instagram-reels-ads).
Platform rules and account-specific acceptance must not be inferred from a local
MP4. Sources reviewed 2026-10-20.

## 5. Visual design and spatial meaning

Define palette, type, hierarchy, lighting, materials, camera and supporting
detail in the film's design specification before authoring.

World coordinates MUST use one declared convention. The pilot uses Y-up,
arbitrary illustrative world units, with the shared link extending toward -Z.
World units are not physical measurements unless the film explicitly defines them.
Object identity and dimensions remain stable across camera moves.

Use genuinely spatial relationships: depth, perspective, parallax, volume or a
meaningful sectional view. A canvas containing flat slides alone does not prove
3D production. The first pilot uses original procedural geometry; imported
glTF assets are optional and require source, license, scale and dependency records.

Each essential object has an ID, world bounds and a visibility responsibility.
The camera MUST preserve its declared focal object, valid near/far clipping and
readable projected scale. Screen-space text uses projected anchors or authored
zones. Inspect intentional occlusion separately from clipping: a projected
bounding box inside the canvas does not prove that another mesh has not hidden it.

Camera movement must help explain spatial relationships. Avoid gratuitous spins,
fast zooms, unstable horizons and unexplained scale changes. All cuts and visibility
windows share the same boundary constants. Use half-open intervals [start, end).

Lights MUST reveal form from every required camera position. A lit material with
only a key light can disappear on its unlit side; provide an appropriate fill.
State material parameters, tone mapping, exposure and output color space.
The pilot uses Linear-sRGB working calculations, sRGB canvas output and ACES
filmic tone mapping. Follow [Three.js color management](https://threejs.org/manual/pages/color-management.html).

Color must be supplemented by shape, labels or position when it communicates
meaning. Text and key markers must survive SDR encoding and phone-size viewing.
Temporal effects, screen-space reflection and motion blur require additional
history reconstruction tests; they are excluded from the initial profile.

### Event-driven cinematic emphasis

Use anticipation, a brief impact, and a readable aftermath to mark consequential
state changes. Bind every cue to the simulated event frame. Reserve red type and
an outlined warning triangle for confirmed overload or loss; use amber for an
approaching threshold. Pair color with explicit text and a symbol. A short camera
push and a local expanding ring may focus attention on the affected component.
Keep captions and equipment labels readable, avoid full-screen flashes and
repetitive strobing, and reset all effects on arbitrary seeks.

Name the actual failure: packet loss or link saturation does not establish a
server crash. A crash cue requires a modeled server failure. Sample event entry,
peak and exit in native and decoded-video QA. Cinematic effects preserve the
adopted narration, 0.35-second sentence gaps and exact 60-second pilot duration.

## 6. Deterministic rendering contract

The invariant is `Frame(i) = Render(Source, Assets, Profile, Seed, i / fps)`.
Within the same pinned environment, repeated evaluation of a frame MUST reproduce
its pixels. Different GPU/browser stacks maintain separate baselines; cross-GPU
byte equality is not assumed.

The scene interface is:

```ts
prepare(): Promise<void>
renderAt(frameIndex: number): void
dispose(): void
```

`prepare` loads fonts, textures and models, builds geometry, compiles shaders and
resolves only when the scene is drawable. Register readiness synchronously before
the host's first readiness check. A rejected dependency MUST stop capture.

`renderAt` accepts a bounded integer frame. It sets every time-dependent property
from that absolute time. Camera transforms, object state, visibility, material
parameters, caption state and shader uniforms follow the same clock.

Prohibited rendering dependencies: wall clocks, unseeded randomness, user input,
render-time network fetches, accumulated frame deltas and private uncontrolled
animation loops. Physical or queue simulations must be deterministically baked
or reconstructible for arbitrary seeking. WebGL resources are disposed explicitly.

The HyperFrames integration uses `hf-seek`, a finite root duration, the build-ready
promise and the native seek-completion barrier. A Three-only composition may use
`data-no-timeline`; it is not a waiver of animation testing. Do not add a fake GSAP
timeline merely to satisfy a static pattern.

The pilot pins Three.js 0.186.1 and HyperFrames 0.8.181. WebGL2 is the first target;
WebGPU requires separate correctness and performance evidence. Never silently
switch renderer, downgrade to 2D or label a software renderer as the hardware run.

## 7. Text, captions and audio

Ship the actual font binaries, source URLs, hashes and licenses. Load them before
measurement. Reject missing fonts, unreadable size, clipping and unexpected line
wraps. Do not hide overflowing text to satisfy a bounds assertion.

Caption intervals derive from actual audio clip boundaries. Sentence-level timing
must not be described as word alignment. Captions stay inside their zone and avoid
the 3D explanation. Meaningful text is readable with decorative effects disabled.

Keep canonical text, synthesis text, voice/model identity, baseline audio and final
PCM distinct. Cache speech by text, voice, model hash, synthesis rate and runtime.
The pilot uses Kokoro v1.0 ONNX, `af_heart`, `en-us`, speed 1.0 and zero tempo passes.
This is a new profile, not a retuning of existing CEH audio.

The audio assembly MUST have exact sample indices, no unintended overlaps,
clipping or truncated speech. If a clip exceeds its window, revise the script or
explicitly revise the timeline. Never crop speech or silently speed the full film.
Timing amendment (2026-10-20): each complete spoken sentence MUST be synthesized
and timed separately. The interval from one processed sentence clip's end to the
next clip's start is **0.35 seconds** (16,800 samples at 48 kHz). Do not add another
pause at beat boundaries. Preserve the original baseline, trim synthesis edge
silence only in processed clips, and record the trim method and sample indices.
Sentence captions follow these measured clips; scene beats follow their starts.

The pilot preserves its original wording and voice speed. It begins at 0.35 seconds;
after the final sentence, the takeaway remains visible with continuing 3D animation
until exactly 60.000 seconds. This ending interval is an explicit final hold, not an
inter-sentence pause. Do not stretch speech or insert additional pauses to fill the
remaining duration. Report both narration end and final-hold duration.

Keep PCM truth separate from lossy AAC behavior. AAC encoder delay/residue does
not establish an error in the PCM ledger. Compare decoded audio against the
reference with a declared tolerance and report the actual method.
Automated measurements do not replace human listening or pronunciation acceptance.

## 8. Efficient production and cache boundaries

Work in this order: content/design → voice and measured cues → difficult pose →
representative capture → complete current-source QA → full encode → encoded
inspection → archive verification.

| Changed input | Invalidate | Preserve when bytes/identity match |
| --- | --- | --- |
| One spoken sentence | Its speech clip, assembly, cues and consumers | Other speech clips |
| Camera/geometry/material | Consuming visual outputs and reviews | Speech baseline and PCM |
| Caption timing | Visual consumers and caption review | Unchanged speech |
| Renderer or shared scene code | All consuming frames and video | Independent audio |
| QA implementation | Its receipts and dependent acceptance | Unchanged media bytes |
| Archive implementation | Manifest, ZIP and extraction checks | Video and audio verification |

Cache hits verify content hashes. A filename or successful previous run is
insufficient. Edited dependencies invalidate downstream evidence. Build artifacts
must not be part of their own source recipe.

Start with one render worker for this short. Change concurrency only after paired,
same-source, same-quality measurements and successful correctness checks. Do not
reuse long-form 2D speedup claims or assume GPU brand proves acceleration.
Record actual draw calls, triangles, browser, GPU renderer and capture path.

## 9. Operator and failure contract

Each attempt MUST have a unique run ID, start/end events, exit status, dependency
identity, outputs and failure record. Preserve earlier failures and retries.
Wall time, accumulated parallel work, queue delay and idle tail are distinct.
Report reuse as reuse, not a fabricated stage speedup.

CLI progress uses measured units where available. An alive process or spinner is
not proof of completed work. Unknown totals display the stage and elapsed time.
Human progress uses stderr; final machine-readable JSON uses stdout. Redirected
output must avoid terminal control codes. Preserve child exit status and diagnostics.

Interrupts terminate owned child processes, preserve partial artifacts and report
cancelled status. Resume only from verified checkpoints. Never stop another
project's running job or rewrite its source to improve this pipeline.

## 10. Acceptance gates

### A. Source and content

Check the one-concept brief, factual claims, illustrative labels, timeline,
dependency pins, asset permissions and complete input manifest.
Unknown or out-of-scope assets block delivery.

### B. Scene and runtime

Require actual target-browser execution, resolved fonts/assets, no unhandled
runtime errors and nonempty 3D content. Check native host seeks as well as the scene
function. Inspect first/last frames, beat boundaries at -1/0/+1 frame, high load,
caption changes, return seeks and repeated seeks.

Compute bounds and state invariants over every pilot frame. Check projected
essential objects and DOM copy independently. Review actual pixels for occlusion,
silhouettes, lighting, readability and temporal artifacts.
Canvas internals are not certified by DOM checks alone.

Keep initial inspected candidates and rejected results. Do not automatically
promote a failing frame into a golden baseline. Repeat-seek hashes prove
repeatability, not artistic quality.

### C. Full encoded artifact

Require the exact frame count, dimensions, constant frame rate, streams and
duration; a successful full decode; audio-reference comparison; subtitle
coverage; and absence of unexpected black/frozen intervals.

Extract and inspect one encoded frame per second plus boundary-adjacent frames.
Compare selected encoded frames with native reference images under a stated lossy
tolerance. A source screenshot is not evidence about the delivered MP4.
Bind inspection to the encoded file hash and extracted image hashes.

### D. Packaging and restore

Create an explicit manifest before ZIP writing. Reject symlinks that would escape
the package, unknown entries and circular dependencies. Stream files directly into
a temporary archive; promote only after CRC and extracted SHA-256 verification.
Keep the final archive receipt outside the archive.

Include editable source, lockfiles, permitted fonts/assets, generated captions,
original/processed voice clips and reference PCM. Pin external model/runtime
installation instructions separately. Exclude secrets, user profiles, node_modules,
virtual environments and reproducible temporary capture hosts.

Restore in a new directory, install pinned dependencies and rebuild a representative
frame using included audio without new inference. Verify both preserved files and
the actual restored frame result.

### E. Human and publication

Track `source_ready`, `runtime_tested`, `rendered`, `technical_qa_passed`,
`human_review_pending/accepted`, and `published` as separate facts.
A local film and a public source repository do not prove a social upload.
Record verified destination URLs only after authorized publication.

## 11. Open-source stewardship

Original code and this specification use MIT. Third-party software, fonts, model
weights and media retain their own licenses. Never label the whole dependency
closure MIT. Include attribution and distinguish downloadable dependencies from
redistributed assets.

Public evidence uses relative paths and excludes credentials, personal source
material, restricted course content, internal targets and unrelated transcripts.
Commit only owned files. Preserve existing repositories and remote histories.
Validate before pushing and verify remote main afterward.

## 12. Versioning and scope of evidence

Version the standard, engine, design/audio/output profiles and project separately.
Record compatibility changes explicitly. A new profile or renderer receives new
baselines; existing films retain their original contracts.

The first pilot establishes one complete WebGL2 production path. It does not
establish photorealism, imported-model support, physics-engine correctness,
WebGPU equivalence, cloud rendering, cross-platform pixel identity, automated
social uploads or comparative production speedups.

### Primary technical references

- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer)
- [Three.js color management](https://threejs.org/manual/pages/color-management.html)
- [Three.js renderer alternatives](https://threejs.org/manual/pages/webgpurenderer)
- [HyperFrames source](https://github.com/heygen-com/hyperframes)
- [RFC 4732, especially section 2.7](https://www.rfc-editor.org/rfc/rfc4732#section-2.7)
- [YouTube upload encoding](https://support.google.com/youtube/answer/1722171)

References checked during design on 2026-10-20. Refresh version-sensitive guidance
when changing dependencies or activating a new destination.
