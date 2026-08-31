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
- Cloud proof: private revision `glasswake-kanon-pulse-f777655` passed Gemini and Firestore replay with the exact receipt; see `docs/CLOUD_PROOF.md`.
- Known gap: live Route A transport is not connected to Route B. The UI remains fixture-first through `routeAAdapter.ts` and must not infer the separately captured cloud proof.
