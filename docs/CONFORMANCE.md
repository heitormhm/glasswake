# Conformance matrix

Each invariant, where it is enforced at runtime, the test that fails if it stops
holding, and where a viewer can see it during the demo.

`tests/test_architecture_claims.py` fails if any test named below stops existing,
so this table cannot quietly rot.

| Invariant | Runtime enforcement | Test | Demo proof |
| --- | --- | --- | --- |
| Model output cannot become canonical state | `parse_gemini_finding` re-validates every response and raises `StructuredOutputError` | `test_malformed_gemini_output_cannot_mutate_canonical_state` | Evidence ledger shows typed findings, never raw model text |
| A crumb cannot elevate authority | `can_grant_authority` is fixed `false` on the crumb contract | `test_crumb_cannot_elevate_authority` | Crumbs tab |
| Repair is bounded to the synthetic allowlist | `ALLOWED_REPAIR_PATHS`; `build_repair_brief` raises on a prohibited path | `test_repair_is_bounded_to_synthetic_allowlist`, `test_repair_allowlist_is_exactly_the_three_documented_synthetic_paths` | Authority panel: allowed scope versus denied scope |
| Repair cannot self-certify | Verifier receives frozen postconditions, not the implementer narrative | `test_independent_verifier_rejects_implementer_narrative` | Verification panel: `implementer narrative not received` |
| A receipt cannot precede fresh verification | Run projection raises if a receipt is exposed with no `fresh_verification` event recorded | `test_golden_run_advances_and_never_seals_a_receipt_before_fresh_verification` | Phases 08 then 09: receipt appears only after the verifier |
| Postconditions are proven by a fresh read | Verifier re-reads the repaired surfaces after mutation | `test_fresh_postconditions_pass_after_repair` | `5/5 postconditions passed` |
| Unaffected nodes stay untouched | WatchZone selects the affected subgraph only | `test_dependency_selection_excludes_unrelated_nodes` | Impact map: 5 affected, 7 safely skipped, `SKIPPED` tags at the end |
| Each affected node maps to a permitted specialist | Agent catalog binds node kinds to bounded roles | `test_each_affected_node_maps_to_an_allowed_specialist` | Agent fleet rail |
| A no-progress loop halts without escalating | `LoopGuard` compares semantic keys and parks the worker | `test_loopguard_blocks_no_progress_without_authority`, `test_loopguard_ignores_nonsemantic_metadata`, `test_loopguard_compares_semantic_keys_not_metadata` | `SAFE_PARK` / `BLOCKED` states in the recovery snapshot |
| Duplicate dispatch is idempotent | Dispatch guard keyed on agent and node | `test_duplicate_dispatch_is_idempotently_guarded` | Dispatched count stays at 3 |
| The frontend never renders unvalidated data | `routeAClient` validates against the frozen schema and fails closed | `test_all_ten_snapshots_validate_contract`, `test_schema_sidecar_binds_the_frozen_contract` | `Fixture fallback` rail with an explicit error code |
| The receipt is deterministic | Receipt hashes frozen inputs and results | `test_receipt_hashes_frozen_inputs_and_results`, `test_local_deterministic_replay_is_byte_stable` | Receipt hash identical locally and on Cloud Run |
| Fixture and live data never mix | Source boundary in `useRouteASequence`; adapter is never called with an unvalidated payload | `test_checked_in_snapshots_equal_the_deterministic_replay` | Source rail names the origin: `Cloud Run validated` or `Local API validated` |
| The origin is never overstated | Origin label derives from `cloud_proof`, which Cloud Run populates from its own injected `K_SERVICE` / `K_REVISION` | `test_snapshot_endpoint_stamps_the_serving_cloud_run_revision`, `test_snapshot_endpoint_claims_nothing_when_not_on_cloud_run` | Top bar shows the serving revision |
| Health contracts cannot drift | `/healthz` and `/v1/healthz` share one payload builder | `test_v1_health_matches_healthz_and_binds_the_same_contract` | Source rail reports the validated contract hash |

## Not claimed

Stated explicitly, because an architecture document is read as evidence.

- **Semantic identity across modality changes.** `surface_id` exists as a
  canonical field and as the key `LoopGuard` compares on, but there is no
  locator-swap mechanism that retries a failed WebMCP tool against a DOM locator
  under the same identity. The capability is designed, not built, and is not
  shown in the architecture view.
- **A derived-intelligence plane.** No derived model ships yet. See
  `docs/adr/README.md`.
