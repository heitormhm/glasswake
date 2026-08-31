# GlassWake Route B — HackathonView binding

## Trust boundary

`HackathonView` is the only semantic input to the presentation components. The local fixture implements the provisional `route-b.fixture.v2` schema and can be replaced by Route A without rewriting the UI hierarchy.

The frontend may format, filter, sort, shorten hashes, select a drawer tab, and animate an explicit backend state. It does **not** choose affected nodes, invent findings, grant authority, determine repair success, infer verification, create a receipt, or claim Cloud execution.

## Projection map

| Contract field | UI projection |
| --- | --- |
| `policy` | ChangeCard and Northstar PolicyCallout |
| `mission` | Seven-stage MissionStepper |
| `graph.nodes[]` / `graph.edges[]` | ImpactMap / ImpactNode / ImpactEdge |
| `graph.metrics` | Four counters labeled `Demo graph` |
| `agents[]` | Five AgentCard roles and structured status summaries |
| `evidence[]` | Findings list with evidence type, source, time, and identifier |
| `triggerCrumb` | Left-rail and drawer crumb projections |
| `authority` | Authority Gate; decision and provenance are display-only |
| `verification` | Fresh verifier panel and progress supplied by the view |
| `receipt` | Receipt panel; absent until the contract supplies it |
| `cloudProof` | Cloud proof, rendered only when non-null |

## Critical invariants

1. `repair_applied` changes the two fixture surfaces to 14 days but still has no verification or receipt.
2. `verifying` begins a fresh verifier run and cannot reuse the repair actor's evidence narrative.
3. `receipt_complete` is the first state allowed to expose the receipt artifact.
4. A null `cloudProof` produces no Cloud Run or Firestore execution claim.
5. Confidence is displayed only if the contract supplies it.

## Fixture replacement seam

The fixture factory lives in `src/app/fixtures.ts`; presentation consumes the `HackathonView` interface from `src/app/types.ts`. Route A integration should replace the snapshot provider in `src/app/App.tsx`, retain the interface, and add a schema adapter at that boundary if the live field names differ.
