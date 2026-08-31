# GlassWake Devpost MVP Architecture

Status: `IMPLEMENTED_LOCAL / CLOUD_STAGED`

## Vertical slice

```text
Northstar change_event
        |
        v
Change Sentinel -- one TriggerCrumb
        |
        v
JSON WatchZone -- 12 total / 5 affected / 7 skipped
        |
        +--> Policy Agent ------ evidence only
        +--> Data Agent -------- evidence only
        +--> Storefront Agent -- evidence only
        |
        v
Authority Gate -- one synthetic REPAIR_1 brief
        |
        v
Bounded fixture patch -- three allowlisted paths
        |
        v
Independent Verifier -- fresh copy + frozen postconditions
        |
        v
Receipt -- canonical JSON input/result/receipt hashes
        |
        +--> HackathonView JSON snapshots
        +--> Firestore adapter when explicitly configured
```

## Boundaries

- Route A owns canonical semantics, state, affected-node selection, authority, repair, verification, receipt, Google integration and deterministic fixtures.
- Route B owns layout, styling, accessibility, responsive behavior and motion. It may render but not infer backend facts.
- Workers return evidence. They cannot grant authority.
- The repair executor is a non-agent system component and accepts only a bounded `RepairBrief` plus an explicit gate decision.
- The verifier rejects implementer diagnosis narrative and reads a fresh fixture copy.
- The deterministic core imports no Google package and makes no network call.
- The Google layer is optional at local-test time and uses ADK roles, a structured Gemini response schema, Cloud Run API packaging and Firestore server-side persistence.

## Data flow and persistence

`HackathonView` is frozen at `contracts/hackathon_view.schema.json`. Every snapshot carries exactly the contract's top-level fields. Firestore writes server-side documents to:

- `runs`;
- `change_events`;
- `agent_catalog`;
- `crumbs`;
- `findings`;
- `receipts`;
- `run_views`.

The checked-in rules deny direct client access. Cloud Run's service identity is the intended writer. No cloud evidence is claimed until an authorized deployment and a persisted replay are captured.

## Selective revalidation

The dependency fixture uses a JSON edge list, not a graph database. Breadth-first downstream selection excludes the changed source node and all unrelated catalog, inventory, shipping, marketing and analytics nodes. The fixed demo result is five affected nodes, seven skipped nodes and a `0.583333` selective-work reduction.

## LoopGuard

Action identity includes mission, phase, executable tool, surface and arguments. Progress identity includes outcome, postcondition, target state and authority. Timestamps, trace IDs, prose and filesystem paths do not create progress. Three identical action/progress pairs produce evidence and a `BLOCK`; the guard never grants or applies a repair.

