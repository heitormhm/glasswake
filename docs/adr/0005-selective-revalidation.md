# ADR-0005 — Revalidate the affected subgraph, not the estate

## Context

Waking every agent on every change is the default and it does not survive
contact with an enterprise graph. Cost and latency scale with the estate rather
than with the change.

## Decision

A change selects a WatchZone: the subgraph reachable from the changed
assumption. Only affected nodes are revalidated and only relevant specialists
dispatch. In the demo graph, one changed assumption yields 5 affected nodes,
7 safely skipped, and 3 dispatched specialists out of 12 total.

## Alternatives rejected

- Revalidate everything. Rejected: no economic argument, and it buries the
  signal in noise.
- Let the model choose the scope. Rejected: scope is an authority-adjacent
  decision, so it stays deterministic per ADR-0003.

## Consequences

The skipped count is a first-class output, not an absence. Proven by
`test_dependency_selection_excludes_unrelated_nodes`. The counters shown in the
UI are the backend's, never recomputed by the frontend.
