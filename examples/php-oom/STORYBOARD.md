# Measured storyboard

Timing follows complete measured speech. Macro / tracking / controlled orbit are deterministic Three.js camera poses; focus follows real depth. SVG path-draw semantics are used for causal connectors; no animated webpage-card simulation substitutes for the 3D model.

| Shot | Seconds | Camera and purpose | Narration |
| --- | --- | --- | --- |
| S01 | 0.000–6.667 | Macro hook and motivated push-in | Your website's code hasn't even started. But PHP is already parsing an incoming request. |
| S02 | 6.667–11.933 | Tracking into the request memory section | While internal data is still being initialized, a memory allocation fails. |
| S03 | 11.933–16.533 | Hold on incomplete state / retained reference | PHP's old out-of-memory handling jumps out of that work. |
| S04 | 16.533–28.233 | Track the consumer and rack focus to invalid memory | The trouble comes next: cleanup can treat the unfinished data as valid. With a carefully crafted request, that memory error can become remote code execution, without a login. |
| S05 | 28.233–39.900 | Pull back to the worker permission boundary | The code runs with the web worker's permissions, so root access isn't automatic. This was demonstrated with Apache's mod_php; other deployments have different conditions. |
| S06 | 39.900–53.467 | Match composition; correct lifecycle; restrained pullback | PHP patched the flaw on October twenty-first. Update the PHP runtime, then verify the running service has loaded the fix. A firewall can't repair the runtime underneath your site. |

Total: 1604 frames, 53.466667 seconds. Caption phrase splits are estimated inside measured utterance intervals.
