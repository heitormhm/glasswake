# Devpost Reuse and Disclosure

Status: `DISCLOSED_LOCAL / PUBLICATION_NOT_AUTHORIZED`

This project is a new thin consolidation layer. No historical repository was copied wholesale. The table records pre-existing work that informed small equivalents or was referenced without import.

| Source | Revision | Reused idea or primitive | Treatment in Route A | Current publication boundary |
| --- | --- | --- | --- | --- |
| GlassWake | `d8b502e626ea1510a4845365186c4e8e8a59ab57`; contracts byte-identical to freeze `b336a748...` | evidence/authority separation, fail-closed policy, typed contracts, deterministic router, receipt discipline | small compatible implementation under `src/hackathon/` | source is `All Rights Reserved - private R&D pending IP review`; no direct source publication claimed |
| Crumbonaut S03 canonical | `fe5a53bddd04f7b3c8cd6a5db8c83e1681f1478b` | canonical JSON/hash, RepairBrief, LoopGuard action/progress separation, independent verification pattern | adapted semantics with new Python code and Northstar tests | Apache-2.0/NOTICE applies to adapted design influence; preserve attribution if published |
| Sailor C8-R1 | `d133beee9f0d98ed86dc5fbadcf5ebebe24ae90d` | complete structured-output validation before state mutation | reimplemented as strict Gemini output guard | local clean-room source; compatibility evidence is fixture-only |
| GlassCP Integration Consumer | attached `73a1ef7...`; independent C8-R1 `5a117068...` | explicit tool/surface identity and independent oracle discipline | adapted into catalog IDs, node IDs and local mock tests | sibling/successor adjudications are not collapsed into one authority claim |
| Owner-supplied Northstar product fixture | SHA-256 `d6410c99828ff01cf4205423ec7542265e150726272ad644f8e760163c53d90d` | product IDs, names, prices, categories and baseline values | copied as `fixtures/northstar/products.json` | synthetic fixture only |
| Route B files already present in target | unversioned at baseline | presentation types and screen-state fixture | preserved; not used as backend truth | integration mapping still required |

Explicit exclusions:

- no G2 human harness or human-run package;
- no private benchmark/eval population;
- no Cartographer research program;
- no protected holdout;
- no WebMCP relay source;
- no historical navy/bag fixture content as the Northstar scenario;
- no current Crumbonaut asset pipeline;
- no full GlassCP SaaS or general crawler;
- no graph database, auth platform, multi-tenancy, billing or production data.

