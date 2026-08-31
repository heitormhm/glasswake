# GlassWake Route B — UI information architecture

## Primary comprehension path

The control plane is ordered so a first-time viewer can read the run without narration:

1. **Cause** — the left rail shows the one authoritative fact that changed.
2. **Scope** — the central impact map identifies five affected nodes and seven safely skipped nodes.
3. **Actors** — the fleet rail shows only the specialists whose role and status matter.
4. **Constraint** — the evidence drawer gives the Authority Gate its own material treatment.
5. **Proof** — the Independent Verifier is visually and semantically separated from repair.
6. **Closure** — the final drawer becomes a receipt artifact with the run's postconditions.

The impact map remains the hero. Logs, raw payloads, and chat are deliberately absent from the default surface.

## Desktop frame

| Region | Role | Approximate share at 1440px |
| --- | --- | ---: |
| Top bar | Fixture identity, run state, short causal summary | 64px high |
| Change / Mission | One policy delta and seven-stage orientation | 246px wide |
| Impact map | Selective dependency topology and four demo counters | Flexible center |
| Agent fleet | Five vertically stacked specialist roles | 302px wide |
| Evidence drawer | Findings, crumbs, authority, verification, receipt | 192–252px high |
| Demo sequencer | Developer-only manual snapshot control | 52px high |

## Routes

| Route | Purpose |
| --- | --- |
| `/control-plane` | Canonical GlassWake golden run; `/` renders the same view. |
| `/store` | Consumer-facing Northstar Supply fixture with three products. |
| `/store/product/NST-BAG-001` | Inspectable Navy Commuter Bag policy surface. |
| `/store/checkout-help` | Inspectable checkout-help policy surface. |

All routes accept `?state=0..8`. The demo sequencer also stores the selected state locally so the storefront can be inspected at the same fixture projection.

## Responsive behavior

- At 1024–1200px, the graph stays central while rails narrow and low-priority fleet metadata collapses.
- Below 900px, the hero map leads a single-column reading order; change/mission and fleet follow.
- Below 640px, the graph becomes horizontally inspectable, controls remain reachable, and the storefront becomes one column.
- Every full-height surface uses `min-height: 100dvh`; no mobile browser relies on unstable `100vh`.

## Accessibility contract

- State is encoded with label, shape, and color—not color alone.
- Keyboard focus is visible on links, tabs, and sequencer controls.
- The graph has an accessible title/description; each node carries a state label.
- Evidence is a semantic ordered list and drawer navigation uses tab roles.
- Motion is state-driven and suppressed under `prefers-reduced-motion`.
