# Route B V2 handoff

- Branch: `route-b-v2` (local repository; no remote or integration performed).
- Initial consolidated commit: `ce41e61`.
- Frozen-contract integration commit: `74cc9a2`.
- Run: `npm install && npm run dev`.
- Control plane: `/control-plane` (also rendered at `/`).
- Storefront: `/store`, `/store/product/NST-BAG-001`, `/store/checkout-help`.
- Golden fixture: `?state=0..8`; developer-only sequencer is visible in the footer.
- Route A fixture regeneration: `PYTHONPATH=src python3 -m hackathon.cli --write`.
- Validation: deterministic Route A CLI, `npm run test:run`, `npm run build`, and `npm run capture`.
- Known gap: a live Route A transport and real Cloud proof are not connected. The UI consumes the frozen validated Route A snapshots through `routeAAdapter.ts`, remains fixture-first, and explicitly makes no Cloud execution claim.
