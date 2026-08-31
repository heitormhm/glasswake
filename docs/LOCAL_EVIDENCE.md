# Local Consolidation Evidence

Evidence date: `2026-08-31`  
Tested source commit: `303ba792af7b9020931ff912f9021743311d5bb1`  
Branch: `route-b-v2`  
Scope: deterministic local MVP only; no Google Cloud deployment, Firestore write, live Gemini call, push, publication or Devpost submission.

## Gate classification

`GREEN_MVP_BASE_LOCAL / CLOUD_PROOF_STAGED_NOT_DEPLOYED / NOT_SUBMITTED`

The tested source commit meets the master prompt's `GREEN_MVP_BASE` conditions at the authorized local boundary: the deterministic golden path passes, the frontend contract and snapshots are frozen, the Google integrations are implemented and locally import-tested, deploy/persistence paths exist, reuse is disclosed, and the tested tree was clean. Actual Cloud Run, Firestore and Gemini execution remain unclaimed because no cloud project, credentials, spend or deployment authority was supplied.

## Reproduced checks

| Check | Result |
| --- | --- |
| `uv run pytest -q` | `23 passed` |
| `uv run ruff check src tests services` | `All checks passed` |
| `npm run test:run` | `3 test files passed; 12 tests passed` |
| `npm run build` | `PASS`; 4,587 modules transformed |
| `git diff --check` | `PASS`; no output |
| Local API replay | `PASS_LOCAL_DETERMINISTIC`; `/healthz` and `/v1/demo/replay` covered by `TestClient` |
| Route B contract binding | `PASS_LOCAL_CONTRACT`; nine canonical narrative snapshots consumed through `routeAAdapter.ts` |

## Frozen identifiers

- Contract SHA-256: `ed44e8765577ed5e82f3e25551869fb757169cad197fad54e4ea00084c43c3b8`.
- Contract path: `contracts/hackathon_view.schema.json`.
- Snapshot count: `10`.
- Snapshot aggregate SHA-256 (filename + NUL + bytes + NUL): `5f98e518acf446735cc08de4de75b65b942993f2d6d881236af5c27f6859b4d6`.
- Receipt ID: `receipt_returns_001`.
- Receipt SHA-256: `sha256:69eef0a35654db8410cee5e09f1afd178df6438c43f691d71c25280c5c873f9b`.
- Final deterministic phase: `COMPLETE`.
- Final deterministic cloud flags: `cloud_run=false`, `firestore=false`, `evidence_refs=[]`.

## Boundary notes

- The Northstar scenario and all repaired values are synthetic fixtures.
- `09_loopguard_recovery.json` is backend recovery evidence and is intentionally outside the S0-S8 UI narrative.
- The UI is fixture-first by the frozen integration contract. It does not invent backend decisions or cloud proof.
- A real Google proof requires separate owner authorization and immutable evidence from the same deployed source revision.

