# Route B V2 handoff

- Branch: `route-b-v2` (local repository; no remote or integration performed).
- Initial consolidated commit: `ce41e61`.
- Frozen-contract integration commit: `74cc9a2`.
- Run: `npm install && npm run dev`.
- Control plane: `/control-plane` (also rendered at `/`).
- Storefront: `/store`, `/store/product/NST-BAG-001`, `/store/checkout-help`.
- Live local bridge: run Route A on `127.0.0.1:8080`, then open `?state=0..8&source=api`; the developer-only sequencer is visible in the footer.
- Deterministic fixture mode: `?state=0..8&source=fixture`; golden capture uses this explicit mode.
- Route A fixture regeneration: `PYTHONPATH=src python3 -m hackathon.cli --write`.
- Validation: deterministic Route A CLI, `npm run test:run`, `npm run build`, and `npm run capture`.
- Cloud proof: private revision `glasswake-kanon-pulse-f777655` passed Gemini and Firestore replay with the exact receipt; see `docs/CLOUD_PROOF.md`.
- Route B validates `/healthz`, the canonical state catalogue, all nine S0–S8 payloads, the frozen JSON Schema and cross-state invariants before using the unchanged `routeAAdapter.ts` boundary.
- While validation is pending, frozen fixtures provide the immediate preview. Any transport or validation failure is exposed as `Fixture fallback` with an error code and retry control; invalid live payloads never reach the adapter.
- This bridge is local only and does not infer the separately captured Cloud proof. Public access, deployment, publication and submission remain separate owner gates.
