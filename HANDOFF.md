# Route B V2 handoff

- Branch: `route-b-v2` (local repository; no remote or integration performed).
- Implementation commit: populated after visual QA.
- Run: `npm install && npm run dev`.
- Control plane: `/control-plane` (also rendered at `/`).
- Storefront: `/store`, `/store/product/NST-BAG-001`, `/store/checkout-help`.
- Golden fixture: `?state=0..8`; developer-only sequencer is visible in the footer.
- Validation: `npm run test:run`, `npm run build`, `npm run capture`.
- Known gap: Route A live data and real Cloud proof are not connected; the interface is fixture-first and explicitly makes no Cloud execution claim.
