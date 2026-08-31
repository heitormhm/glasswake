from __future__ import annotations

import copy
import hashlib
import json

import pytest

from hackathon.agent_catalog import CATALOG_BY_ID
from hackathon.change_event import issue_trigger_crumb, northstar_change_event
from hackathon.contracts import (
    project_root,
    schema_path,
    validate_hackathon_view,
    validate_with_json_schema,
)
from hackathon.fleet import SNAPSHOT_STATES, GoldenPathRunner, IndependentVerifier
from hackathon.impact_projection import select_watchzone
from hackathon.models import Crumb, EvidenceLabel, canonical_json, sha256_prefixed
from hackathon.repair_policy import LoopGuard
from hackathon.structured_output import StructuredOutputError, append_model_finding


@pytest.fixture()
def runner() -> GoldenPathRunner:
    return GoldenPathRunner()


@pytest.fixture()
def snapshots(runner: GoldenPathRunner) -> dict[str, dict[str, object]]:
    return runner.generate_snapshots()


def test_change_event_creates_exactly_one_trigger_crumb(snapshots):
    crumbs = snapshots["change_detected"]["crumbs"]
    assert [crumb["kind"] for crumb in crumbs] == ["TRIGGER"]
    assert issue_trigger_crumb(northstar_change_event()).can_grant_authority is False


def test_dependency_selection_excludes_unrelated_nodes(runner):
    state = runner.load_fixture_state()
    affected, summary = select_watchzone(state["dependencies"], "policy.returns_window_days")
    assert len(affected) == 5
    assert summary["skipped_nodes"] == 7
    assert summary["selective_work_reduction"] == 0.583333
    unrelated_prefixes = ("catalog.", "inventory.", "shipping.", "marketing.", "analytics.")
    assert not any(node_id.startswith(unrelated_prefixes) for node_id in affected)


def test_each_affected_node_maps_to_an_allowed_specialist(runner):
    state = runner.load_fixture_state()
    affected, summary = select_watchzone(state["dependencies"], "policy.returns_window_days")
    assignments = {
        node["agent_id"]
        for node in state["dependencies"]["nodes"]
        if node["node_id"] in affected
    }
    assert None not in assignments
    assert assignments <= CATALOG_BY_ID.keys()
    assert len(assignments) == summary["dispatched_agents"] == 3


def test_crumb_cannot_elevate_authority():
    with pytest.raises(ValueError, match="cannot grant authority"):
        Crumb(
            crumb_id="bad",
            kind="EVIDENCE",
            evidence_label=EvidenceLabel.OBSERVED,
            source_agent_id="storefront-auditor",
            statement="bad",
            evidence_refs=(),
            can_grant_authority=True,
        )


def test_duplicate_dispatch_is_idempotently_guarded(runner):
    agents = ["policy-auditor", "data-auditor", "storefront-auditor"]
    assert runner.dispatch_agents("run-test", agents) == sorted(agents)
    assert runner.dispatch_agents("run-test", agents) == []


def test_stale_storefront_and_support_are_detected(snapshots):
    findings = snapshots["findings_complete"]["findings"]
    stale = {finding["node_id"] for finding in findings if finding["stale"]}
    assert stale == {
        "storefront.product_return_badge",
        "storefront.checkout_help",
        "support.returns_answer",
    }


def test_current_database_state_passes(snapshots):
    finding = next(
        item
        for item in snapshots["findings_complete"]["findings"]
        if item["node_id"] == "db.return_window_days"
    )
    assert finding["observed_value"] == finding["expected_value"] == 14
    assert finding["stale"] is False


def test_repair_is_bounded_to_synthetic_allowlist(snapshots):
    repair = snapshots["repair_applied"]["repair"]
    assert repair["synthetic_only"] is True
    assert repair["rollback_available"] is True
    assert set(repair["applied_paths"]) == {
        "storefront.product_return_badge",
        "storefront.checkout_help",
        "support.returns_answer",
    }
    assert set(repair["before"].values()) == {30}
    assert set(repair["after"].values()) == {14}


def test_independent_verifier_rejects_implementer_narrative(runner):
    with pytest.raises(ValueError, match="may not receive"):
        IndependentVerifier().verify(
            runner.load_fixture_state(),
            (("db.return_window_days", ("database", "returns_window_days"), 14),),
            implementer_narrative="I fixed it; trust me.",
        )


def test_fresh_postconditions_pass_after_repair(snapshots):
    verification = snapshots["fresh_verification"]["verification"]
    assert verification["fresh_run"] is True
    assert verification["independent"] is True
    assert verification["received_implementer_narrative"] is False
    assert verification["status"] == "VERIFIED"
    assert all(check["passed"] for check in verification["checks"])


def test_receipt_hashes_frozen_inputs_and_results(snapshots):
    receipt = snapshots["receipt_complete"]["receipt"]
    unsigned = dict(receipt)
    receipt_hash = unsigned.pop("receipt_hash")
    assert receipt_hash == sha256_prefixed(unsigned)
    assert receipt["frozen_input_hash"].startswith("sha256:")
    assert receipt["frozen_result_hash"].startswith("sha256:")


def test_local_deterministic_replay_is_byte_stable():
    first = GoldenPathRunner().generate_snapshots()
    second = GoldenPathRunner().generate_snapshots()
    assert canonical_json(first) == canonical_json(second)


def test_malformed_gemini_output_cannot_mutate_canonical_state():
    state = {"model_findings": []}
    before = copy.deepcopy(state)
    with pytest.raises(StructuredOutputError):
        append_model_finding(state, {"node_id": "x", "disposition": "VALID"})
    assert state == before


def test_all_ten_snapshots_validate_contract(snapshots):
    assert tuple(snapshots) == SNAPSHOT_STATES
    for view in snapshots.values():
        validate_hackathon_view(view)
        validate_with_json_schema(view)


def test_checked_in_snapshots_equal_the_deterministic_replay(snapshots):
    fixture_dir = project_root() / "fixtures" / "hackathon_view"
    for index, (name, expected) in enumerate(snapshots.items()):
        path = fixture_dir / f"{index:02d}_{name}.json"
        assert json.loads(path.read_text()) == expected


def test_schema_sidecar_binds_the_frozen_contract():
    sidecar = schema_path().with_suffix(".sha256")
    expected = sidecar.read_text().split()[0]
    assert hashlib.sha256(schema_path().read_bytes()).hexdigest() == expected


def test_explicit_project_root_supports_installed_package_layout(monkeypatch):
    expected = project_root()
    monkeypatch.setenv("GLASSWAKE_PROJECT_ROOT", str(expected))
    assert project_root() == expected


def test_loopguard_blocks_no_progress_without_authority(snapshots):
    view = snapshots["loopguard_recovery"]
    assert view["authority"]["decision"] == "BLOCK"
    assert view["repair"]["status"] == "NOOP_ALREADY_VERIFIED"
    assert view["crumbs"][-1]["kind"] == "LOOPGUARD"
    assert view["crumbs"][-1]["can_grant_authority"] is False


def test_loopguard_ignores_nonsemantic_metadata():
    guard = LoopGuard(threshold=3)
    action = {
        "mission": "m",
        "phase": "p",
        "tool": "fixture.patch",
        "surface_id": "s",
        "arguments": {"value": 14},
    }
    progress = {
        "outcome": "same",
        "postcondition": "same",
        "target_state": "same",
        "authority": "NONE",
    }
    assert guard.observe({**action, "trace_id": "1"}, {**progress, "timestamp": "1"}) is False
    assert guard.observe({**action, "trace_id": "2"}, {**progress, "timestamp": "2"}) is False
    assert guard.observe({**action, "trace_id": "3"}, {**progress, "timestamp": "3"}) is True
