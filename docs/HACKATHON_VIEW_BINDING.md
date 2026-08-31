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

## Regeneration and replacement seam

Regenerate frozen views with:

```bash
PYTHONPATH=src python3 -m hackathon.cli --write
```

The frontend imports those validated JSON files in `src/app/fixtures.ts`. A future live Route A provider should supply the same frozen schema to `adaptRouteAView`; no presentation component needs semantic changes.
