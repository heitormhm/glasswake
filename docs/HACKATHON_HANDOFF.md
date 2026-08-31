# Route A Handoff

## Status

`GREEN_MVP_BASE_LOCAL` is reached at the authorized local boundary. The deterministic backend, frozen projection and Route B adapter/rendering tests pass. This does not mean cloud-verified, live-transport-integrated, published or submitted.

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

Obtain explicit owner authorization for a named Google Cloud project, region, billing boundary and service identity. Then deploy the tested source revision, execute one Gemini structured review and one Firestore-backed replay on the Cloud Run revision, capture immutable evidence, and confirm that the returned receipt hash matches the local receipt. Do not infer deployment authority from this local handoff.

For a later live-transport enhancement, connect Route B to `/v1/demo/replay` without changing the frozen adapter semantics and retain fixture fallback for the deterministic Devpost narrative.
