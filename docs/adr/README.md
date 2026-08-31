# Architecture decision records

One record per decision that is actually implemented in this repository. Each
names the alternatives that were rejected, because the rejected option is
usually the more interesting half of an architectural decision.

| ADR | Decision |
| --- | --- |
| [0001](0001-canonical-state-not-owned-by-model.md) | Canonical state is not owned by the model |
| [0002](0002-evidence-epistemic-labels.md) | Evidence carries an epistemic label |
| [0003](0003-authority-separated-from-reasoning.md) | Authority is a separate subsystem from reasoning |
| [0004](0004-fresh-independent-verification.md) | Verification is fresh and independent |
| [0005](0005-selective-revalidation.md) | Revalidate the affected subgraph, not the estate |
| [0006](0006-projection-only-frontend.md) | The frontend is projection-only |
| [0007](0007-loopguard-halts-no-progress-repair.md) | A no-progress loop halts instead of escalating |

Records for the derived-intelligence plane are deliberately absent until that
plane ships. An ADR describing a constraint on code that does not exist is a
plan, not a decision record.
