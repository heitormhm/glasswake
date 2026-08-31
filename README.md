# GlassWake — KANON PULSE Route A

This workspace contains the smallest deterministic backend vertical slice for the GlassWake Devpost MVP. The only scenario is Northstar Supply's returns-policy change from 30 days to 14 days.

The proof chain is:

`CHANGE → TriggerCrumb → selective impact → specialist fleet → evidence → authority gate → bounded repair → independent fresh verify → Receipt`

## Current status

- Local deterministic backend: implemented and covered by fresh tests.
- `HackathonView`: frozen JSON Schema plus ten fixture snapshots.
- Google ADK and Gemini: a structured Vertex AI review passed on revision `glasswake-kanon-pulse-f777655`.
- Cloud Run and Firestore: private deployment and persisted replay are `CLOUD_VERIFIED`; see `docs/CLOUD_PROOF.md`.
- Route B: the Vite/React control plane is preserved and now consumes the canonical snapshots through an explicit `HackathonView` adapter.

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
- `POST /v1/gemini/review` — live and credential-dependent; not used by deterministic tests

The exact deployed revision and its immutable proof are documented in `docs/CLOUD_PROOF.md`. Public access, a successor deployment, publication, push and submission still require separate owner authority.

## Route B frontend

The Vite/React control plane now consumes the frozen Route A snapshots through `src/app/routeAAdapter.ts`; the provisional presentation fixture is no longer treated as the backend source of truth.

```text
npm install
npm run dev
npm run test:run
npm run build
npm run capture
```

Open `/control-plane` for the S0–S8 sequencer. The consumer fixture is available at `/store`, `/store/product/NST-BAG-001`, and `/store/checkout-help`. Frontend binding and design contracts are documented in `docs/HACKATHON_VIEW_BINDING.md`, `docs/UI_INFORMATION_ARCHITECTURE.md`, `docs/DESIGN_TOKENS.md`, and `docs/DEMO_SCREEN_STATES.md`.
