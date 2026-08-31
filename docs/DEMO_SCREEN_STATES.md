# GlassWake Route B — canonical demo states

| State | Canonical visible change | Evidence drawer default | Narrative purpose |
| --- | --- | --- | --- |
| S0 · Baseline | 30 days everywhere; fleet idle; graph muted | Findings empty state | Establish normal state |
| S1 · Change detected | Authoritative source becomes 14 days; Sentinel active; trigger crumb appears | Crumbs | Cause |
| S2 · Impact scoped | Five affected nodes illuminate; seven unrelated nodes remain muted; counters appear | Crumbs | First scope moment |
| S3 · Fleet dispatched | Policy, Data, and Storefront auditors run; verifier stays idle | Findings | Selective actors |
| S4 · Stale surfaces found | Policy and DB are current; product policy, checkout help, and support answer are stale; the compliance mission reflects the failed condition | Findings | Confirm the problem |
| S5 · Authority ready | Exact three-path proposal, backend `REPAIR_1`, authority ceiling, rollback, and provenance appear | Authority | Safety and governance |
| S6 · Repair applied | Three permitted synthetic paths now hold 14 days; there is still no verification or receipt | Authority | Repair without premature success |
| S7 · Fresh verification | Independent Verifier returns a fresh 5/5 pass without receiving implementer narrative; the receipt is still absent | Verification | Trust through separation |
| S8 · Receipt complete | Five postconditions pass; deterministic receipt and before/after artifact seal the run | Receipt | Screenshot-worthy closure |

## Manual sequencing

Use the footer sequencer or query `/control-plane?state=0..8`. The storefront accepts the same state query, allowing the 30-day surface to be shown before S6 and the repaired 14-day surface at S6 or later. The nine UI states are adapted from the frozen Route A files `00_idle.json` through `08_receipt_complete.json`; the Route A LoopGuard recovery fixture is intentionally outside this golden visual sequence.

## Capture contract

`npm run capture` records S0–S8 at 1440×900 in `screenshots/golden/`. Captures use reduced-motion mode so every state is deterministic and legible.
