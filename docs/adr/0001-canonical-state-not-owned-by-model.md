# ADR-0001 — Canonical state is not owned by the model

## Context

A language model is the easiest place to put enterprise truth and the worst.
Model output is probabilistic, unversioned, and cannot be replayed byte for
byte. GlassWake's entire claim is that its receipts mean something, which
requires state that a model cannot silently rewrite.

## Decision

Gemini proposes interpretation and bounded actions. It never becomes the source
of canonical state. Every model result crosses a deterministic boundary before
it can influence anything: `GeminiStructuredReviewer` requests a constrained
JSON schema, and `parse_gemini_finding` re-validates the response and raises
`StructuredOutputError` on anything unexpected.

## Alternatives rejected

- Let the model write findings directly into the run state. Rejected: a
  malformed or hallucinated field would become indistinguishable from evidence.
- Trust the model's own structured-output mode without post-validation.
  Rejected: schema enforcement at the provider is a request, not a guarantee.

## Consequences

The pipeline is reproducible and `test_local_deterministic_replay_is_byte_stable`
can assert byte stability. A malformed model response fails closed and is proven
unable to mutate canonical state by
`test_malformed_gemini_output_cannot_mutate_canonical_state`.
