# Sound credits

"basscapes_Subbassonly.wav" by suonho is licensed under CC BY 4.0. To view a copy of this license, visit https://creativecommons.org/licenses/by/4.0/.
Source: https://freesound.org/people/suonho/sounds/58764
Changes: resampling, filtering, envelopes, mixing.

"mechanical key hard.wav" by bigmonmulgrew is marked with CC0 1.0. To view the terms, visit https://creativecommons.org/publicdomain/zero/1.0/.
Source: https://freesound.org/people/bigmonmulgrew/sounds/378085
Changes: resampling, filtering, envelopes, mixing.

Include these credits with publication. Font licenses are in assets/fonts/.

## Software and synthetic speech

The original project code uses the repository MIT license. Redistributed GSAP 3.15.0 retains its Standard License notice in `assets/js/GSAP-NOTICE.txt`; it is not MIT. Three.js 0.186.1 is MIT. HyperFrames 0.8.181 and Playwright 1.62.1 are Apache-2.0. esbuild 0.25.12 and pngjs 7.0.0 are MIT; TypeScript 5.9.3 is Apache-2.0. These identifiers come from the pinned installed package metadata; dependency installation retains upstream notices.

Narration is generated locally with Kokoro ONNX, voice `am_michael`, at speed 1.0. It does not impersonate the researcher. `assets/audio/speech-receipt.json` records the exact model-file hashes and runtime versions. Model weights and voice embeddings are downloaded dependencies, excluded from the editable archive. The archive includes the generated speech and original dry WAVs.

Kokoro runtime and model-file source: https://github.com/thewh1teagle/kokoro-onnx ; the pinned download URLs are recorded in `scripts/download_models.py`.

Original PHP-series score, event synthesis, procedural geometry and code: this project, MIT. No voice cloning.
