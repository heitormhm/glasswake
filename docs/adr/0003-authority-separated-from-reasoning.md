# ADR-0003 — Authority is a separate subsystem from reasoning

## Context

A worker that discovers a problem has an obvious incentive to fix it. If
discovery implies permission, the blast radius of any single confused agent is
the whole system.

## Decision

Finding something wrong grants no permission to change it. Repair scope is a
deterministic allowlist, `ALLOWED_REPAIR_PATHS`, naming three synthetic
storefront paths. `build_repair_brief` raises if any stale finding falls outside
that allowlist, so an out-of-scope repair cannot be assembled at all rather than
being assembled and then declined. The decision surfaces as an explicit
`AuthorityDecision`: `OK`, `REPAIR_1`, `REPAIR_2`, `ASK_USER`, or `BLOCK`.

## Alternatives rejected

- Let the model emit the allowed paths. Rejected: that is the model granting
  itself authority, which is the failure this ADR exists to prevent.
- Filter prohibited paths out silently. Rejected: silently narrowing a repair
  hides an attempted authority violation that operators should see.

## Consequences

Reasoning can be wrong without being dangerous. Proven by
`test_repair_is_bounded_to_synthetic_allowlist` and
`test_crumb_cannot_elevate_authority`.
