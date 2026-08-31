# Route A Handoff

## Status

`PASS_LOCAL_DETERMINISTIC` is the intended local gate. It does not mean cloud-verified, frontend-integrated, published or submitted.

## Route A outputs

- Canonical schema: `contracts/hackathon_view.schema.json`.
- Schema hash: `contracts/hackathon_view.schema.sha256`.
- Canonical UI fixtures: `fixtures/hackathon_view/00_idle.json` through `09_loopguard_recovery.json`.
- Deterministic backend: `src/hackathon/`.
- Local/Cloud Run API: `services/cloud_api/main.py`.
- Tests: `tests/`.

## Route B integration rule

Route B must map the canonical snake_case projection. It may create view-model helpers for presentation, but it may not invent or override affected nodes, agent status, evidence labels, authority, repair, verification, receipt or cloud proof.

The pre-existing `route-b.fixture.v2` structure is not the shared contract. The next integration change should replace its semantic source with the generated `HackathonView` snapshots while preserving its visual components.

## Exact next integration action

After Route A tests are green, validate all ten JSON fixtures in Route B, implement a pure adapter from canonical `HackathonView` to the existing presentation model, run Route B rendering tests, and then run one local API-backed replay. Do not deploy before that gate passes and the owner separately authorizes Google Cloud use.

