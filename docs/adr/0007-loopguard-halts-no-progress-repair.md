# ADR-0007 — A no-progress loop halts instead of escalating

## Context

The characteristic failure of an autonomous worker is not a crash. It is
retrying a semantically identical action forever, consuming budget and
occasionally escalating its own permissions to "make progress".

## Decision

`LoopGuard` compares successive attempts on their semantic keys — mission,
phase, tool, `surface_id`, arguments — and ignores non-semantic metadata such as
timestamps and attempt counters. After a threshold of no-progress attempts the
worker is parked rather than retried, and parking never widens authority.

## Alternatives rejected

- Cap retries by count alone. Rejected: it cannot distinguish a genuinely
  different second attempt from the same attempt re-sent.
- Hash the whole payload. Rejected: a changing timestamp would defeat detection.

## Consequences

A stuck worker degrades into a visible `SAFE_PARK` or `BLOCKED` state that an
operator can act on. Proven by `test_loopguard_blocks_no_progress_without_authority`
and `test_loopguard_ignores_nonsemantic_metadata`.
