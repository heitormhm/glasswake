# ADR-0006 — The frontend is projection-only

## Context

A dashboard that can compute any part of the proof chain is a dashboard that can
fake it. If the UI can decide a node is verified, the receipt is theatre.

## Decision

The frontend renders, animates, inspects, and requests. It cannot decide
affected nodes, grant authority, declare verification, manufacture evidence, or
compute the receipt. It validates every payload against the frozen
`HackathonView` schema and refuses to adapt anything that fails, falling back to
a visibly-labelled frozen fixture instead of rendering untrusted data.

## Alternatives rejected

- Optimistically render a repair before the backend confirms it. Rejected: it
  would show a state that was never proven.
- Recompute counters client-side for responsiveness. Rejected: two sources of
  truth for the same number is one too many.

## Consequences

Transport failure degrades to an honest, labelled fallback rather than a
plausible lie. Proven by the `routeAClient` fail-closed suite and by
`test_v1_health_matches_healthz_and_binds_the_same_contract`.
