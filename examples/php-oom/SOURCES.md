# Technical claims and visual boundaries

Reviewed 2026-10-22. Primary sources:

- https://www.php.net/archive/2026.php#2026-10-21-5
- https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w
- https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp
- https://ubuntu.com/security/notices/USN-8948-1

| Claim | Primary evidence | Boundary |
| --- | --- | --- |
| OOM may interrupt partially initialized reachable data; shutdown may use it | GHSA-w8hw-w9fx-j79w, Summary / Susceptibility | Allocation failure occurs during incomplete initialization; OOM does not create initialization. |
| Pre-application unauthenticated RCE demonstrated in mod_php | OOM advisory, Impact and reliability | Do not apply the demonstrated exploit conditions to every SAPI. |
| A reused worker may retain request-owned state after its memory is freed | GHSA-6wmf-4rv5-p3rp, Summary | Both a producer and an early consumer are required in the same worker. |
| Use of stale state before normal reset may lead to RCE | Stale-state advisory, Summary / Consumers | RCE is conditional, never an automatic consequence of every freed pointer. |
| Initial execution occurs with the web worker account | OOM advisory, Impact and reliability | RCE does not automatically confer root. |
| Updating PHP is the complete remediation | PHP 2026-10-21 advisory | A WAF is not a replacement for runtime patching. |
| Fixed upstream versions | PHP announcement | 8.5.12, 8.4.27, 8.3.36, 8.2.35; vendor backports need vendor evidence. |
| Ubuntu 24.04 backport | USN-8948-1 | php8.3 8.3.6-0ubuntu0.24.04.13 is listed as fixed. |

## Model limits
All requests, memory cells, reference lines and material states are illustrative. No attack is executed, no packet capture is shown, and no server is scanned or modified. The request memory budget is not the entire host's RAM. A freed block remains visibly outlined: free ends ownership/lifetime, not necessarily physical contents. Request A and B are explicitly handled by one persistent worker. The conditional RCE branch is drawn with separated segments and a visible qualifier. The corrected lifecycle is an explanatory invariant, not a claim to reproduce every internal patch operation.
