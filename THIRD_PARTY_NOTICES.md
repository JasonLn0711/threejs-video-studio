# Third-party notices

Original project code and documentation use [MIT](LICENSE). Dependency and asset
licenses remain separate.

| Component | Version/source | License | Distribution |
| --- | --- | --- | --- |
| Three.js | 0.186.1, npm lockfile | MIT | Installed; bundled into generated scene |
| HyperFrames | 0.8.181, npm lockfile | Apache-2.0 | Installed runtime/CLI |
| Playwright | 1.62.1 | Apache-2.0 | Installed QA dependency |
| TypeScript | 5.9.3 | Apache-2.0 | Installed build dependency |
| esbuild | 0.25.12 | MIT | Installed build dependency |
| pngjs | 7.0.0 | MIT | Installed QA dependency |
| Oswald | Google Fonts, binary hash in font manifest | SIL OFL 1.1 | Font and OFL text included |
| IBM Plex Mono | Google Fonts, binary hash in font manifest | SIL OFL 1.1 | Font and OFL text included |
| kokoro-onnx | 0.6.1 | MIT | Optional installed narration runtime |
| Kokoro model | v1.0 ONNX + voices | Apache-2.0 per upstream | Downloaded separately; weights excluded |
| FFmpeg | System installation | Build-dependent; local build GPL-enabled | External executable, not bundled |

The npm lockfile preserves the transitive dependency graph. Installed dependencies
retain their upstream notices. esbuild emits bundled legal comments beside the
generated scene. The complete [Three.js MIT license](examples/ddos-capacity/assets/licenses/three-LICENSE.txt)
is included for the bundled runtime. Third-party bundled components retain
their original licenses.

Font source URLs, SHA-256 values and local OFL files are recorded in
[the font manifest](examples/ddos-capacity/assets/fonts/manifest.json).

Kokoro's [upstream runtime](https://github.com/thewh1teagle/kokoro-onnx) distinguishes
its MIT code from the model's Apache-2.0 license. The
[model card](https://huggingface.co/hexgrad/Kokoro-82M) provides model provenance.
The pilot uses fresh synthetic `af_heart` narration, not a user's recorded voice
or a cloned speaker. The model downloader verifies the exact files used.

The server, computers, paths, packet meshes, FIFO simulation, camera motion,
script and design are authored for this project. Existing CEH character/campus
art, course source packages and private evidence are not redistributed.
