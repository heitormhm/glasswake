# GlassWake Route B — frozen HackathonView binding

## Source of truth

Route B consumes the frozen Route A contract identified by `contracts/hackathon_view.schema.json` (`HackathonView`, JSON Schema 2020-12). The deterministic backend generates ten validated files in `fixtures/hackathon_view/`; the nine-state UI sequence consumes `00_idle.json` through `08_receipt_complete.json`. `09_loopguard_recovery.json` remains backend evidence and is not inserted into the canonical S0–S8 narrative.

`src/app/routeAAdapter.ts` is the only semantic adaptation boundary. Presentation components never read raw backend JSON directly and never recreate backend decisions.

## Trust boundary

The adapter may format labels, assign deterministic graph coordinates, shorten operational copy, map uppercase contract enums to visual states, select a default drawer tab, and derive presentation counts directly from backend arrays.

It does **not** choose affected nodes, invent findings, grant authority, determine repair success, infer verification, create a receipt, or claim Cloud execution. A false `cloud_run` / `firestore` projection remains visibly labeled as a local fixture.

## Projection map

| Frozen Route A field | Route B projection |
| --- | --- |
| `run.phase` | Run status and mission-stage orientation |
| `change_event` | ChangeCard and authoritative 30 → 14 delta |
| `watchzone_summary` | Four `Demo graph` counters: 12 total, 5 affected, 7 skipped, 3 dispatched |
| `nodes[]` / `edges[]` | ImpactMap; enum states map directly to affected, stale, repairing, verified, blocked, or muted visuals |
| `agents[]` | Five AgentCard roles using backend name, status, domain, authority ceiling, and evidence ownership |
| `findings[]` | Findings rows; observed/expected values, evidence label, source ref, and stale count come from the contract |
| `crumbs[]` | Trigger and evidence crumb views; no crumb grants authority |
| `authority` | Three-path Authority Gate with backend decision, repair brief, refs, reason, and rollback requirement |
| `repair` | Northstar runtime policy projection and repair metrics; never treated as final success |
| `verification` | Independent 5/5 fresh-run proof including `received_implementer_narrative: false` |
| `receipt` | Final receipt metrics and actual deterministic `receipt_hash` |
| `cloud_proof` | Cloud proof only when the backend booleans and evidence refs support it |

## Critical invariants

1. `06_repair_applied.json` changes the permitted synthetic paths to 14 but has no verification or receipt.
2. `07_fresh_verification.json` is independent, fresh, accepts no implementer narrative, passes five checks, and still has no receipt.
3. `08_receipt_complete.json` is the first state allowed to expose the receipt artifact.
4. Three stale customer-memory surfaces—product policy, checkout help, and support answer—come from Route A findings; the UI does not hardcode the count.
5. The affected compliance mission is visualized separately from the three stale surfaces, while aggregate counts remain exactly those supplied by `watchzone_summary`.
6. `cloud_run: false` and `firestore: false` produce no deployment or persistence claim.

## Live transport and fixture fallback

`src/app/routeAClient.ts` is the trust boundary in front of the adapter. It checks local API health, requires the exact canonical S0–S8 catalogue, validates every raw snapshot against `contracts/hackathon_view.schema.json`, and enforces the cross-state invariants above. Only then does it call the existing `adaptRouteAView` function. The adapter's semantic responsibilities do not change.

`src/app/useRouteASequence.ts` owns the transport lifecycle. Its user-visible states are:

- `loading`: frozen fixtures remain available as an immediate preview while the local sequence is checked;
- `live`: all nine API snapshots passed schema and sequence validation;
- `fallback`: the local API failed or returned untrusted data, so frozen fixtures remain active with the exact failure category and a retry action;
- `fixture`: explicit deterministic fixture mode; no network request is made.

The URL preference is preserved across Control Plane, Storefront, product and checkout-help routes. `source=auto` is the default, `source=api` explicitly requests the local bridge, and `source=fixture` pins deterministic offline data. The default API origin is `http://127.0.0.1:8080`; `VITE_ROUTE_A_BASE_URL` may override it.

## Regeneration seam

Regenerate frozen views with:

```bash
PYTHONPATH=src python3 -m hackathon.cli --write
```

The frontend imports those validated JSON files in `src/app/fixtures.ts`. They are the deterministic fallback and golden-capture source. A replacement provider must satisfy the same frozen schema and sequence validation before reaching `adaptRouteAView`; presentation components require no semantic change.
