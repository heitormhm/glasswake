# GlassWake — KANON PULSE Route A

This workspace contains the smallest deterministic backend vertical slice for the GlassWake Devpost MVP. The only scenario is Northstar Supply's returns-policy change from 30 days to 14 days.

The proof chain is:

`CHANGE → TriggerCrumb → selective impact → specialist fleet → evidence → authority gate → bounded repair → independent fresh verify → Receipt`

## Current status

- Local deterministic backend: implemented and covered by fresh tests.
- `HackathonView`: frozen JSON Schema plus ten fixture snapshots.
- Google ADK and Gemini: a structured Vertex AI review passed on revision `glasswake-kanon-pulse-f777655`.
- Cloud Run and Firestore: private deployment and persisted replay are `CLOUD_VERIFIED`; see `docs/CLOUD_PROOF.md`.
- Route B: the Vite/React control plane now connects to the local Route A API, validates the complete canonical sequence, and then passes each snapshot through the unchanged `HackathonView` adapter. Frozen fixtures remain an explicit, visible fallback.

## Local verification

```text
uv sync --extra dev --extra api --extra google
uv run pytest
uv run ruff check src tests services
uv run glasswake-golden-path --write
```

Run the local API:

```text
uv run uvicorn services.cloud_api.main:app --host 127.0.0.1 --port 8080
```

Important endpoints:

- `GET /healthz`
- `GET /v1/agent-catalog`
- `GET /v1/demo/snapshots`
- `GET /v1/demo/snapshots/{state}`
- `POST /v1/demo/replay`
- `POST /v1/demo/runs` — executes the golden path once and opens a run
- `GET /v1/demo/runs/{run_id}`
- `POST /v1/demo/runs/{run_id}/advance`
- `POST /v1/gemini/review` — live and credential-dependent; not used by deterministic tests

The exact deployed revision and its immutable proof are documented in `docs/CLOUD_PROOF.md`. Public access, a successor deployment, publication, push and submission still require separate owner authority.

## Route B frontend

Keep the local API running on `127.0.0.1:8080`, then start the Vite application in a second terminal:

```text
npm install
npm run dev
npm run test:run
npm run build
npm run capture
```

Open `/control-plane` and press **Run GlassWake**. That opens a Route A run
(`POST /v1/demo/runs`), which executes `GoldenPathRunner` once and records its
nine canonical phases; the control plane then replays those recorded phases and
stamps each transition from the backend event log. The run identity strip states
plainly that this is replay of a recorded run, not nine live computations. If
the run endpoint is unreachable the deck falls back to browser-local playback
and says so — it never shows a run id it does not have.

The nine-step phase track is labelled semantically (Baseline → Receipt sealed);
`S0`–`S8` survive only as the internal fixture aliases. Any phase can still be
clicked directly, which pauses the run and hands control to the operator. The connected consumer views are available at `/store`, `/store/product/NST-BAG-001`, and `/store/checkout-help`. All cross-route links preserve the selected data-source mode.

The default `source=auto` mode renders the frozen fixtures as an immediate preview while it validates the local API. It switches to `Local API validated` only after all nine canonical snapshots pass the frozen JSON Schema and sequence invariants. Network, timeout, HTTP, JSON, schema, or sequence failures produce a visible `Fixture fallback` rail with a retry action; the adapter is never called with an untrusted payload. Use `source=api` to request the local connection explicitly or `source=fixture` for deterministic offline capture. Override the local origin with `VITE_ROUTE_A_BASE_URL` when needed.

Frontend binding and design contracts are documented in `docs/HACKATHON_VIEW_BINDING.md`, `docs/UI_INFORMATION_ARCHITECTURE.md`, `docs/DESIGN_TOKENS.md`, and `docs/DEMO_SCREEN_STATES.md`.
