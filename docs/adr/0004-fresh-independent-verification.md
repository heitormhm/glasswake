# ADR-0004 — Verification is fresh and independent

## Context

A repair agent carries context bias toward its own diagnosis. If it also reports
success, the receipt attests to nothing beyond the agent's own opinion of its
own work.

## Decision

Verification runs as a fresh bounded mission against frozen postconditions. The
verifier does not inherit the repairer's explanatory narrative; the run view
records `received_implementer_narrative: false`. The receipt cannot exist before
a verification event: the API's run projection raises if a receipt is exposed
without a recorded `fresh_verification`.

## Alternatives rejected

- Allow the repair worker to assert success. Rejected: self-attestation is not
  proof.
- Reuse the pre-repair read. Rejected: it cannot observe the repair's effect.

## Consequences

One extra read buys substantially stronger closure semantics. Proven by
`test_independent_verifier_rejects_implementer_narrative`,
`test_fresh_postconditions_pass_after_repair`, and
`test_golden_run_advances_and_never_seals_a_receipt_before_fresh_verification`.
