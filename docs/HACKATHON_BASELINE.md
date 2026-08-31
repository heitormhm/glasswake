# GlassWake Devpost MVP — Hackathon Baseline

Status: `BASELINE_COMPLETE_READ_ONLY`

Captured on 2026-08-31 in `America/Sao_Paulo`. This document separates current repository evidence from prior reports. No source repository was mutated while establishing this baseline.

## Authority pack

The user selected the following files, in this order. SHA-256 values bind the exact inputs used for this consolidation.

| Order | File | SHA-256 |
| --- | --- | --- |
| 1 | `/Users/heitor/Downloads/01_ROUTE_A_CONSOLIDATION_MASTER_PROMPT.md` | `113fa45fd5a2689e14cb6266befd7a538247f96217ae7946fcab357d62ea2ec9` |
| 2 | `/Users/heitor/Downloads/00_MVP_FREEZE.md` | `0f427da20ccdc3c9a48523fd49f7bd1a2504321a737c5802bde2367666e10852` |
| 3 | `/Users/heitor/Downloads/03_INTEGRATION_CONTRACT.md` | `ef1f56bea30756adb833ae3f781bce591156f4ed4392c57dbffac6f00544415c` |
| 4 | `/Users/heitor/Downloads/04_DEMO_GOLDEN_PATH.md` | `8d8ef1b58daaa780234b15747eec56eeaebdf7d34a0b359224ddbfe2c5ba95e2` |
| 5 | `/Users/heitor/Downloads/README_V2.md` | `1a737094cd50b852741ed95f8d02b25837ecec127ea5c03f408c34d3da52a1c9` |
| 6 | `/Users/heitor/Downloads/northstar_products.json` | `d6410c99828ff01cf4205423ec7542265e150726272ad644f8e760163c53d90d` |

## Target workspace truth

Path: `/Users/heitor/Documents/KANON PULSE`

- The directory is not currently a Git repository.
- A Route B Vite/React skeleton was already present when the baseline was written.
- Existing Route B files are preserved as user/concurrent work and are outside Route A visual ownership.
- The existing Route B `HackathonView` TypeScript fixture is a presentation model (`route-b.fixture.v2`) and does not yet implement the frozen top-level Route A contract. It must not be treated as the backend source of truth.
- Route A will add backend, contracts, fixtures, tests, and evidence in separate paths. It will not restyle the frontend.

Existing files observed before Route A source work:

- `index.html`
- `package.json`
- `src/main.tsx`
- `src/app/types.ts`
- `src/app/fixtures.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `vite.config.ts`

## Source repository snapshot

The rows below are read-only observations. `REPRODUCED_CURRENT` means the branch/HEAD/worktree fact was observed in this session. Test results remain `NOT_RUN_CURRENT` until a named command is executed in this consolidation.

| Source | Branch | Exact HEAD | Dirty paths | Evidence status |
| --- | --- | --- | --- | --- |
| `/Users/heitor/Documents/GLASSWAKE` | `main` | `d8b502e626ea1510a4845365186c4e8e8a59ab57` | 59 untracked files under six `research/gates/GWK-G2/human-runs/` directories | `REPRODUCED_CURRENT` repository fact; tests `NOT_RUN_CURRENT` |
| `/Users/heitor/Documents/SAILOR MCP C8` | `sailor/c8-local-acp-process` | `c053ad588b02dc12ead1222f1674da5cfc67e9da` | none reported by short status | `REPRODUCED_CURRENT` repository fact; tests `NOT_RUN_CURRENT` |
| `/Users/heitor/Documents/GLASSCP INTEGRATION CONSUMER-r1-s03c-adjudication-20260830` | `consumer/r1-s03c-adjudication-20260830` | `73a1ef7d0593f8c77c0d5f58d6300dafe903f975` | none reported by short status | `REPRODUCED_CURRENT` repository fact; tests `NOT_RUN_CURRENT` |
| `/Users/heitor/Documents/Crumbonaut` | `feat/asset-pipeline` | `60c4448e70bd676185adec9988376ac467c2592f` | concurrent tracked/untracked asset-pipeline changes appeared during the audit | `REPRODUCED_CURRENT` repository fact; this is not the preserved S03 canonical ref; tests `NOT_RUN_CURRENT` |

All four source repositories have no configured Git remote. Source-repository instructions prohibit expanding external effects. No source checkout was edited.

### Preserved source identities that matter

- GlassWake contract freeze: `b336a7486660a3ea259e10d6a10707e7b50449c6`.
- GlassWake Wave 2 controller: `4d14cbe3e47c7a5ddc4fcfb15e514275ac2ac4c6`, already ancestral to current `main`.
- Sailor C8-R1 repair worktree: `/Users/heitor/.config/superpowers/worktrees/SAILOR-MCP-C8/c8-r1-initialize-info-conformance`, branch `sailor/c8-r1-initialize-info-conformance`, HEAD `d133beee9f0d98ed86dc5fbadcf5ebebe24ae90d`.
- Independent Consumer C8-R1 readjudication: `/Users/heitor/.config/superpowers/worktrees/GLASSCP-INTEGRATION-CONSUMER/r2i-sailor-c8-r1-readjudication`, HEAD `5a1170680b242d4136d2e65da08e8ff9f9e5d77f`.
- Preserved Crumbonaut S03 canonical worktree: `/Users/heitor/.config/superpowers/worktrees/GlassCP-Crumbonaut-SailorCP-Codex-Handoff-v0.2.0/crumb-s03-canonical-20260830`, branch `codex/crumb-s03-canonical-20260830`, HEAD `fe5a53bddd04f7b3c8cd6a5db8c83e1681f1478b`.

The Crumbonaut canonical worktree is a separate nested/shared Git repository. It is not represented by the current visual asset-pipeline checkout HEAD.

## Evidence and authority boundaries

- Prior summaries are discovery aids, not repository evidence.
- A local fixture pass is not real cross-product integration.
- A preserved or canonical local ref does not grant merge, push, deploy, publication, Devpost submission, credential use, paid model calls, real shopping, messaging, or production-data authority.
- The present task authorizes local source edits, deterministic tests, synthetic fixture mutation, and local commits only.
- No fresh human G2 run, Google credential use, Gemini call, Firestore write, Cloud Run deployment, push, or publication has been performed.

## Current local toolchain

- Python `3.11.15`
- uv `0.10.8`
- Google Cloud SDK `582.0.0`
- Docker `29.7.2`
- Google ADK / Gen AI / Firestore Python packages were not established in the global Python environment at baseline time.

## Frozen contract and primitive identities

### GlassWake

The following current `main` files are byte-identical to the GlassWake G1 freeze:

| File | SHA-256 |
| --- | --- |
| `src/glasswake/models.py` | `44f638aee0eb978f278a0862ba18344f58122e416038998c996dfaa142d4c132` |
| `src/glasswake/contracts.py` | `071b5fc8636702b2f1c43c770c393848a1207a4d1f1c1da23fa9d57c8a1c33c8` |
| `src/glasswake/authority.py` | `dd5c2ec6c5e293a9babbdb03d3c5e6d4cdcd55f8857071fd0363db0a8c6dcce3` |
| `src/glasswake/conformance.py` | `2131c93b9814400cbbac2820bd27efa4a6858d48c8272c7454ac65902148ead8` |
| `src/glasswake/receipts.py` | `cd121d7946b2a0a9e3c06ee07957dcb4340696cd9271b5cb2afc3531a6a6c725` |
| `src/glasswake/orchestrator.py` | `3d87c855189faa31ee846436476015acadc3359bf9c21739c02c765da6d415a6` |
| `schemas/crumb.schema.json` | `42e6dcfe046faacf9406c46a7c0b1e5a52b52a328ef35c86133ec70c38e81696` |
| `schemas/receipt.schema.json` | `452b03f10fd44a14ce9343de5151e928d7c5694fd2d49d7c43ed9e037ff79834` |

Root license status: `All Rights Reserved - private R&D pending IP review`. Route A must therefore use small compatible equivalents unless the owner separately clears direct copying/publication.

### Crumbonaut S03 canonical

| File | SHA-256 |
| --- | --- |
| `schemas/crumb.schema.json` | `e001b9096b32d37bfbd1ec511851acde93a486b77abf92d948b1fbedf637c383` |
| `schemas/receipt.schema.json` | `82e67976714b019e829bd3643dd550118c70607bdb4f2919ed699ddbf0763d07` |
| `schemas/repair-brief.schema.json` | `4eb305d9c633edd5cf56a924f7db878fc92addc876b7c45f31ff06907e20fc88` |
| `compatibility/authorizations/g5-errata-a1.json` | `5f467c456b1f893df518f4166ddb92325d2d8079ea822cb7cdfac54c0843562d` |

The local fast-forward to `fe5a53b...` is complete. The preserved receipt candidate remains `LOCAL_ONLY`, `NOT_INTEGRATED`, `NOT_PUBLISHED`, and `NOT_INDEPENDENTLY_ADJUDICATED` by its own fields. The canonical worktree declares Apache-2.0 and an applicable NOTICE; adaptations must be disclosed.

### Sailor C8-R1 and Consumer

- Sailor C8-R1 producer packet SHA-256: `7194ca0ffdd46856d8c3765556628fd60c526560b754a836f4f96a9d3cd67f7c`.
- Independent Consumer packet SHA-256: `4774eeebebf2400aa4cf3c4a373947ec63c3b3326672c257827eaa74b39335d1`.
- Independent protocol result SHA-256: `bbbf561618939a26a80509dbb2c0b8ab4f891fcf4b41d81204913da794e9872c`.
- The supported claim is `PASS_LOCAL_PROCESS_FIXTURE`; real host, authentication, browser and cross-product integration are not validated or claimed.
- `initialize.result.info` must be a non-null, non-array object. `{}` and optional known string fields are accepted. Missing/null/array/primitive/wrong-known-field forms fail as `MALFORMED_OUTPUT` during initialize, before session calls or retries.

## Latest human/operator evidence present

The latest observed GlassWake run directory is:

`/Users/heitor/Documents/GLASSWAKE/research/gates/GWK-G2/human-runs/gwk-g2-human-20260831T151606Z-a58f09d2`

Read-only inspection reproduced the presence of 17/17 files, the receipt sidecar match, `status=GWK-G2_PASS`, `run_mode=human`, `human_count=1`, seven actions, three workflows, `6/7` mapping coverage, `ASK_USER` for the sensitive boundary, and zero adapter executions, authorized actions, external effects, services, credentials or production data.

Classification:

- artifact presence, fields and hash match: `REPRODUCED_CURRENT`;
- that a human actually performed the run: `REPORTED_MEASURED` from the persisted artifact;
- canonical disposition: `NOT_CANONICALIZED / INDEPENDENT_REVIEW_PENDING`;
- scope: `LOCAL_ONLY`.

No fresh human run is required or authorized for this MVP consolidation.

## Available source test commands

These commands were discovered but intentionally not executed because this baseline is an input audit, not a revalidation of the source programs.

- GlassWake: `make verify`; focused Python `python -m pytest -q`; console `npm test`, `npm run typecheck`, `npm run build`.
- Sailor C8-R1: `npm test`, `npm run test:conformance`, `npm run verify`, `npm run validate:control`, `npm run validate:packet`.
- Consumer: `npm test`, `npm run verify`, `npm run audit:inputs`, `npm run audit:sources`, `npm run test:integrated-fixture`.
- Crumbonaut S03 canonical: `npm test`, focused `node --test tests/s03c-canonical-r1-port.test.mjs`, common black-box and frozen-integrity checks documented in the canonical packet.

Historical counts remain `REPORTED_MEASURED`; they are not silently promoted to current test evidence. Route A will run its own fresh deterministic tests against the new Northstar contract.

## Baseline conclusion

The smallest safe construction is a new, thin Route A layer. It will adapt the low-coupling invariants—fail-closed authority, explicit capability identity, deterministic canonical JSON/hash, bounded repair, LoopGuard action/progress separation, and independent verification—without importing historical gates, private benchmarks, human harnesses, browser evidence, or whole source repositories.
