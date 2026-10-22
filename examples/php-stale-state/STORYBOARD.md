# Measured storyboard

Timing follows complete measured speech. Macro / tracking / controlled orbit are deterministic Three.js camera poses; focus follows real depth. SVG path-draw semantics are used for causal connectors; no animated webpage-card simulation substitutes for the 3D model.

| Shot | Seconds | Camera and purpose | Narration |
| --- | --- | --- | --- |
| S01 | 0.000–3.133 | Macro hook and motivated push-in | The request is gone. Its pointer isn't. |
| S02 | 3.133–10.767 | Controlled orbit revealing two lifetimes | Inside a PHP worker, one request creates data in memory. Worker-wide state keeps a reference to that data. |
| S03 | 10.767–15.967 | Hold on incomplete state / retained reference | When the request ends, its memory is released, but some state can still point there. |
| S04 | 15.967–25.700 | Track the consumer and rack focus to invalid memory | Now the same worker handles another request. Before normal initialization resets that state, an early operation can use the stale reference. |
| S05 | 25.700–41.033 | Pull back to the worker permission boundary | That's use-after-free: accessing memory after its lifetime has ended. Under exploitable conditions, an attacker can turn that memory error into remote code execution. That means the worker's permissions, not automatic root access. |
| S06 | 41.033–57.267 | Match composition; correct lifecycle; restrained pullback | The exact trigger depends on the deployment and internal state involved. PHP's fix addresses this lifecycle bug. Patch the runtime, restart affected workers, and verify the version actually serving requests. |

Total: 1718 frames, 57.266667 seconds. Caption phrase splits are estimated inside measured utterance intervals.
