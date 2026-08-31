# ADR-0002 — Evidence carries an epistemic label

## Context

Most agent systems emit one undifferentiated "result" per worker. That collapses
four different kinds of claim — what was seen, what was asserted, what was
guessed, and what was proven — into a single value with a single, misleading
level of confidence.

## Decision

Every piece of evidence is labelled with how it was come by: `OBSERVED`,
`DECLARED`, `INFERRED`, `APPROVED`, or `VERIFIED`. The label travels with the
evidence through the spine and is rendered as a distinct badge in the UI.

## Alternatives rejected

- A numeric confidence score. Rejected: it implies comparability between
  fundamentally different epistemic categories. An observation is not a
  high-confidence inference.
- A boolean `verified` flag. Rejected: it cannot distinguish an approval from a
  fresh proof, which is precisely the distinction ADR-0004 depends on.

## Consequences

A reader can tell at a glance which claims are grounded and which are derived.
The distinction is what makes the authority gate legible: approval is visibly
not the same act as verification.
