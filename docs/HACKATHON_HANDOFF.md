# Route A Handoff

## Status

`CLOUD_VERIFIED_PRIVATE` is reached. The deterministic backend, frozen projection, Route B adapter/rendering tests, Vertex AI structured review and Firestore-backed Cloud Run replay pass. Separately, Route B is now connected to the local Route A API with a validated, explicit fixture fallback. This does not mean publicly accessible, published or submitted.

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

`src/app/routeAClient.ts` validates local health, the state catalogue, every S0–S8 snapshot, the frozen schema and cross-state invariants before invoking the unchanged adapter. `src/app/useRouteASequence.ts` exposes loading, live, fallback and explicit fixture states. Control Plane and Storefront navigation preserve `source=auto|api|fixture`; fallback is visible and retryable instead of silent.

## Remaining owner gates

The implemented frontend bridge targets the local API only; it does not make the private Cloud Run service publicly reachable and does not reuse private Cloud evidence as live UI state. Public access, a successor deployment, video recording, publication and Devpost submission remain separate owner gates.
