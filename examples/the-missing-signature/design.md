# Design contract

Near-black #070B14; navy #111D2C; steel cyan #74B8C6; amber #E0A96B; rejection red #C85A5A; text #F1F4F6. Oswald display type, IBM Plex Mono technical labels, with IBM Plex Mono at 40 px for English captions. The original licensed CJK subset remains available in the source assets.

Critical copy fits x=100..890, y=250..1480. Captions fit y=1330..1470 with at most two lines. The full-bleed 3D environment may extend beyond these bounds; critical lettering is rendered in the DOM and audited separately. A dark caption backplate protects text over the data architecture.

The recurring door joins the opening and ending. S07 has a quiet, intimate desk and keyboard. S08 hard-cuts to the single query result. S09 pulls back across 17 towers and holds all scale qualifiers for at least three seconds. Camera and material state are pure functions of source time. The proof uses the same renderer, geometry, shaders, fonts and sound sources as the draft film.

The initial proof architecture uses restrained procedural models. The user approved the existing visual design for the full film. The first and last door shots share the framing motif; the whole movie is not claimed to be a pixel-identical seamless loop.

## Adapter and production tradeoffs

HyperFrames 0.8.181 drives a paused GSAP timeline and the existing `hf-seek` adapter. A nearest-frame clock clamps the endpoint to the last real frame. Local external script URLs also work through Studio's preview route. The GB10 hardware renderer uses screenshot capture because native BeginFrame is unavailable on this Chromium build. A finite warm-up initializes the geometry. The renderer finishes each GPU frame offscreen, then copies it to the visible 2D canvas for capture. This prevents screenshot capture from observing a partially drawn WebGL default framebuffer; the Three.js geometry and camera remain the source of the image.

The proof uses one GPU worker, two independent native PNG sequences and two single-threaded H.264 encodes. Raw frame hashes and decoded video frame hashes must both match. This prioritizes repeatable output over parallel throughput; no speedup or cross-machine pixel equivalence is claimed. Procedural models, existing licensed sounds and local synthetic speech avoid new paid asset generation. Runtime and model dependencies remain pinned. This does not establish human acceptance of the voice or visual treatment.
