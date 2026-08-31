# Route A Handoff

## Status

`CLOUD_VERIFIED_PRIVATE` is reached. The deterministic backend, frozen projection, Route B adapter/rendering tests, Vertex AI structured review and Firestore-backed Cloud Run replay pass. This does not mean live-transport-integrated, public, published or submitted.

## Route A outputs

- Canonical schema: `contracts/hackathon_view.schema.json`.
- Schema hash: `contracts/hackathon_view.schema.sha256`.
- Canonical UI fixtures: `fixtures/hackathon_view/00_idle.json` through `09_loopguard_recovery.json`.
- Deterministic backend: `src/hackathon/`.
- Local/Cloud Run API: `services/cloud_api/main.py`.
- Tests: `tests/`.

## Route B integration status and rule

Route B now maps the canonical snake_case projection through `src/app/routeAAdapter.ts`. It may create view-model helpers for presentation, but it may not invent or override affected nodes, agent status, evidence labels, authority, repair, verification, receipt or cloud proof.

The pre-existing `route-b.fixture.v2` structure is not the shared contract. The generated `HackathonView` snapshots are the current semantic source while the visual components remain presentation-only.

## Exact next integration action

Repair the successor revision's externally intercepted `/healthz` path or select a non-reserved health endpoint, then connect Route B to the private `/v1/demo/replay` transport without changing the frozen adapter semantics. Retain fixture fallback for the deterministic Devpost narrative. Public access, video recording, publication and Devpost submission remain separate owner gates.
