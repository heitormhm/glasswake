# GlassWake Route B — design tokens

## Control-plane palette

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg-canvas` | `#07111f` | Near-black navy canvas |
| `--bg-elevated` | `#0b1626` | Rails and elevated regions |
| `--surface-1` | `#101d2e` | Primary component surface |
| `--surface-2` | `#142338` | Nested region |
| `--border-subtle` | `#26364b` | Structural dividers |
| `--text-primary` | `#f5f8fc` | Primary copy |
| `--text-secondary` | `#a8b5c7` | Supporting copy |
| `--text-tertiary` | `#78879a` | Metadata |
| `--state-active` | `#44c7f4` | Affected / running / verifying |
| `--state-verified` | `#49c88b` | Proven current / passed |
| `--state-review` | `#f2b84b` | Stale / authority review |
| `--state-blocked` | `#f06b73` | Concrete invalid or blocked state only |
| `--state-inferred` | `#9b8cff` | Backend-supplied inference badge only |
| `--state-muted` | `#607086` | Unaffected / inactive |

## Geometry and rhythm

- Spacing rhythm: `4 / 8 / 12 / 16 / 24 / 32`.
- Desktop gutters: `22–34px` depending on surface.
- Primary panel radius: `14px`.
- Compact control radius: `9px`.
- Borders carry hierarchy more often than shadow or elevation.

## Typography

- Operational UI: **DM Sans** with **Manrope** for compact display hierarchy.
- Hashes, timestamps, status codes, and counters: **DM Mono**.
- Northstar editorial headings only: **Newsreader**.
- Operational copy stays concrete and short. Agent cards never contain narrative reasoning.

## Motion

- Ordinary state transition: `180ms`, cubic-bezier `(0.16, 1, 0.3, 1)`.
- Major narrative transition: `420–500ms`.
- Only `transform` and `opacity` animate for movement; state colors and borders transition directly.
- No looping glow, particle field, moving backdrop, decorative count-up, or general spring physics.
- The only continuous animation is the verifier's progress glyph while a fresh verification run is actively in progress.

## Storefront contrast

Northstar uses a warm ivory canvas, graphite text, deep navy actions, minimal borders, and restrained Newsreader headings. It is intentionally consumer-facing and never reuses the control-plane dark theme.
