# Sources and factual boundaries

Primary account: [Faav, “How I could've accessed 17 trillion Microsoft records”](https://blog.faav.net/how-i-couldve-accessed-17-trillion-microsoft-records), published September 25, 2026; reviewed October 21, 2026.

| Shots | Adopted claim | Boundary |
| --- | --- | --- |
| S01–S03 | VPN-protected Titan frontend, externally reachable API; Antares found the lead on August 25 | Illustrative geometry, not a Microsoft screenshot. Publicly reachable does not mean authentication was absent. |
| S04–S06 | Repeated JWT claim checks and failed email-format user lookups; signature not verified | No genuine tokens, credentials or endpoints. No claim that JWT cryptography was broken. |
| S07–S08 | Researcher tried local username admin; SELECT 1 returned 1 | A bounded proof of query execution, not a data dump. |
| S09 | 17 connected analytics databases; estimated 17,333,335,124,315 stored rows | Metadata-derived storage estimate, potentially including historical, duplicated and derived data. The displayed 17.3 trillion rows were not all extracted. |
| S10 | Limited verification and report to MSRC on September 5 | The account reports two one-row Bing samples and access to platform metadata. Do not claim that no records were ever accessed. |
| S11 | Endpoint restricted September 9; $5,000 award September 17 | Attributed to the researcher's coordinated disclosure timeline. Not certification that every related issue was fixed. |
| S12 | Verify signatures as well as claims | The signature-verification failure is the educational takeaway. |

The supplied ZIP's exact files are preserved under reference/; their source hashes are recorded in reference/manifest.json. Production wording, measured timings and evidence are separate from that source layer.

## Visual risk decisions

Use the bible's SIGNATURE: NOT VERIFIED wording instead of the schematic's EMPTY shorthand. Use exactly 17 tower instances; their heights are decorative and do not represent per-database record counts. Show ESTIMATED, POTENTIALLY REACHABLE and NOT EXFILTRATED together; the last label qualifies the displayed total, not the researcher's bounded samples. Do not present staged footage as real incident footage or depict the researcher's identity.

## Sound and font sources

CREDITS.md and assets/audio/source-manifest.json identify the adopted drone and keyboard sounds. The other resolver candidates were not adopted because their per-file licenses were not documented in the returned metadata. The impact is an enveloped excerpt of the credited drone. Fonts and their source/derivation hashes are in assets/fonts/manifest.json.
