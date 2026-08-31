# Four-Minute Demo Evidence Checklist

Status vocabulary: `REPRODUCED_CURRENT`, `MOCKED / SYNTHETIC`, `STAGED`, `BLOCKED`.

| Time | Proof | Artifact/state | Current status |
| --- | --- | --- | --- |
| 0:00–0:20 | Enterprise memory rot framing | Northstar policy/service mismatch | `SYNTHETIC` |
| 0:20–0:45 | Wake | `01_change_detected.json`, one TriggerCrumb | `REPRODUCED_CURRENT` after local test |
| 0:45–1:35 | Specialist fleet | `03_agents_running.json`; policy/data/storefront statuses | `REPRODUCED_CURRENT` deterministic |
| 1:35–2:05 | Selective revalidation | `02_impacted_nodes_selected.json`; 12/5/7 and reduction | `REPRODUCED_CURRENT` deterministic |
| 2:05–2:35 | Governance | `05_authority_review.json`; one RepairBrief and `REPAIR_1` | `REPRODUCED_CURRENT` deterministic |
| 2:35–3:10 | Repair + fresh verify | `06_repair_applied.json`, `07_fresh_verification.json` | `REPRODUCED_CURRENT` deterministic |
| 3:10–3:35 | Receipt | `08_receipt_complete.json`; before/after, postconditions, hashes | `REPRODUCED_CURRENT` deterministic |
| 3:35–3:50 | Google proof | Cloud Run revision/log plus Firestore run/receipt | `CLOUD_VERIFIED_PRIVATE` |
| 3:50–4:00 | Close | receipt narrative | `REPRODUCED_CURRENT` locally; video not recorded |

Do not record the Devpost video until:

- every canonical snapshot validates against the frozen schema (`PASS_LOCAL`);
- Route B renders the Route A snapshots without semantic inference (`PASS_LOCAL_CONTRACT`);
- the deterministic API replay and frontend rendering suites pass (`PASS_LOCAL`; live HTTP transport remains a later enhancement);
- the captured Cloud Run and Firestore evidence in `docs/CLOUD_PROOF.md` is preserved with the demo source revision;
- the final UI displays cloud proof only when the backend supplies it;
- disclosure/IP review permits the intended submission/publication mode.
