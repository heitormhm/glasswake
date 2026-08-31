from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from .agent_catalog import catalog_projection
from .change_event import issue_trigger_crumb, northstar_change_event
from .contracts import project_root, validate_hackathon_view
from .impact_projection import node_projection, select_watchzone
from .models import (
    AgentStatus,
    AuthorityDecision,
    Crumb,
    EvidenceLabel,
    Finding,
    FindingDisposition,
)
from .receipt_projection import build_receipt
from .repair_policy import (
    LoopGuard,
    apply_synthetic_repair,
    authority_projection,
    build_repair_brief,
)


RUN_ID = "run_demo_001"
STARTED_AT = "2026-08-31T12:04:18Z"
RECEIPT_AT = "2026-08-31T12:04:25Z"

SNAPSHOT_STATES = (
    "idle",
    "change_detected",
    "impacted_nodes_selected",
    "agents_running",
    "findings_complete",
    "authority_review",
    "repair_applied",
    "fresh_verification",
    "receipt_complete",
    "loopguard_recovery",
)


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


class IndependentVerifier:
    """Fresh verifier that accepts only fixture state and frozen postconditions."""

    def verify(
        self,
        fixture_state: dict[str, Any],
        postconditions: tuple[tuple[str, tuple[str, ...], Any], ...],
        *,
        implementer_narrative: str | None = None,
    ) -> dict[str, Any]:
        if implementer_narrative is not None:
            raise ValueError("Independent verifier may not receive implementer diagnosis narrative.")
        fresh_state = copy.deepcopy(fixture_state)
        checks = []
        for node_id, path, expected in postconditions:
            observed: Any = fresh_state
            for part in path:
                observed = observed[part]
            checks.append(
                {
                    "node_id": node_id,
                    "expected": expected,
                    "observed": observed,
                    "passed": observed == expected,
                }
            )
        surface_checks_passed = all(check["passed"] for check in checks)
        checks.append(
            {
                "node_id": "mission.return_policy_compliance",
                "expected": True,
                "observed": surface_checks_passed,
                "passed": surface_checks_passed,
            }
        )
        return {
            "verification_id": "verify_returns_001",
            "status": "VERIFIED" if all(check["passed"] for check in checks) else "FAILED",
            "fresh_run": True,
            "independent": True,
            "checks": checks,
            "received_implementer_narrative": False,
        }


class GoldenPathRunner:
    def __init__(self, fixture_root: Path | None = None) -> None:
        self.fixture_root = fixture_root or project_root() / "fixtures" / "northstar"
        self._dispatch_keys: set[str] = set()

    def load_fixture_state(self) -> dict[str, Any]:
        return {
            "policy": _load_json(self.fixture_root / "policy.json"),
            "database": _load_json(self.fixture_root / "database.json"),
            "storefront": _load_json(self.fixture_root / "storefront.json"),
            "support": _load_json(self.fixture_root / "support.json"),
            "products": _load_json(self.fixture_root / "products.json"),
            "dependencies": _load_json(self.fixture_root / "dependencies.json"),
        }

    def dispatch_agents(self, run_id: str, agent_ids: list[str]) -> list[str]:
        dispatched = []
        for agent_id in sorted(set(agent_ids)):
            key = f"{run_id}:{agent_id}"
            if key in self._dispatch_keys:
                continue
            self._dispatch_keys.add(key)
            dispatched.append(agent_id)
        return dispatched

    @staticmethod
    def _watchzone_idle(total_nodes: int) -> dict[str, Any]:
        return {
            "total_nodes": total_nodes,
            "affected_nodes": 0,
            "skipped_nodes": total_nodes,
            "dispatched_agents": 0,
            "affected_node_ids": [],
            "selective_work_reduction": 1.0,
        }

    @staticmethod
    def _agent_statuses(stage: str) -> dict[str, AgentStatus]:
        if stage == "detected":
            return {"change-sentinel": AgentStatus.VERIFIED}
        if stage == "scoped":
            return {
                "change-sentinel": AgentStatus.VERIFIED,
                "policy-auditor": AgentStatus.DISPATCHED,
                "data-auditor": AgentStatus.DISPATCHED,
                "storefront-auditor": AgentStatus.DISPATCHED,
            }
        if stage == "running":
            return {
                "change-sentinel": AgentStatus.VERIFIED,
                "policy-auditor": AgentStatus.RUNNING,
                "data-auditor": AgentStatus.RUNNING,
                "storefront-auditor": AgentStatus.RUNNING,
            }
        if stage == "findings":
            return {
                "change-sentinel": AgentStatus.VERIFIED,
                "policy-auditor": AgentStatus.VERIFIED,
                "data-auditor": AgentStatus.VERIFIED,
                "storefront-auditor": AgentStatus.FOUND,
            }
        if stage == "authority":
            return {
                "change-sentinel": AgentStatus.VERIFIED,
                "policy-auditor": AgentStatus.VERIFIED,
                "data-auditor": AgentStatus.VERIFIED,
                "storefront-auditor": AgentStatus.WAITING_REVIEW,
            }
        if stage == "repair":
            return {
                "change-sentinel": AgentStatus.VERIFIED,
                "policy-auditor": AgentStatus.VERIFIED,
                "data-auditor": AgentStatus.VERIFIED,
                "storefront-auditor": AgentStatus.WAITING_REVIEW,
                "independent-verifier": AgentStatus.DISPATCHED,
            }
        if stage == "verified":
            return {agent["agent_id"]: AgentStatus.VERIFIED for agent in catalog_projection()}
        if stage == "loopguard":
            return {
                "change-sentinel": AgentStatus.BLOCKED,
                "policy-auditor": AgentStatus.VERIFIED,
                "data-auditor": AgentStatus.VERIFIED,
                "storefront-auditor": AgentStatus.SAFE_PARK,
                "independent-verifier": AgentStatus.VERIFIED,
            }
        return {}

    @staticmethod
    def _findings(state: dict[str, Any]) -> list[Finding]:
        expected = state["policy"]["returns_window_days"]
        observations = (
            (
                "finding_policy_001",
                "policy-auditor",
                "policy.returns_window",
                state["policy"]["returns_window_days"],
                "fixture://northstar/policy.json",
                EvidenceLabel.VERIFIED,
            ),
            (
                "finding_database_001",
                "data-auditor",
                "db.return_window_days",
                state["database"]["returns_window_days"],
                "fixture://northstar/database.json",
                EvidenceLabel.VERIFIED,
            ),
            (
                "finding_product_001",
                "storefront-auditor",
                "storefront.product_return_badge",
                state["storefront"]["surfaces"]["product_return_badge"]["returns_window_days"],
                "fixture://northstar/storefront.json#/surfaces/product_return_badge",
                EvidenceLabel.OBSERVED,
            ),
            (
                "finding_checkout_001",
                "storefront-auditor",
                "storefront.checkout_help",
                state["storefront"]["surfaces"]["checkout_help"]["returns_window_days"],
                "fixture://northstar/storefront.json#/surfaces/checkout_help",
                EvidenceLabel.OBSERVED,
            ),
            (
                "finding_support_001",
                "storefront-auditor",
                "support.returns_answer",
                state["support"]["returns_window_days"],
                "fixture://northstar/support.json",
                EvidenceLabel.OBSERVED,
            ),
        )
        return [
            Finding(
                finding_id=finding_id,
                agent_id=agent_id,
                node_id=node_id,
                disposition=FindingDisposition.VALID,
                evidence_label=label,
                expected_value=expected,
                observed_value=observed,
                stale=observed != expected,
                evidence_refs=(evidence_ref,),
            )
            for finding_id, agent_id, node_id, observed, evidence_ref, label in observations
        ]

    @staticmethod
    def _evidence_crumbs(findings: list[Finding]) -> list[Crumb]:
        return [
            Crumb(
                crumb_id=f"crumb_{finding.finding_id}",
                kind="EVIDENCE",
                evidence_label=finding.evidence_label,
                source_agent_id=finding.agent_id,
                statement=(
                    f"{finding.node_id} observed {finding.observed_value}; "
                    f"expected {finding.expected_value}; stale={str(finding.stale).lower()}."
                ),
                evidence_refs=finding.evidence_refs,
            )
            for finding in findings
        ]

    @staticmethod
    def _node_statuses(findings: list[Finding], phase: str) -> dict[str, str]:
        statuses = {"policy.returns_window": "CURRENT"}
        for finding in findings:
            statuses[finding.node_id] = "STALE" if finding.stale else "CURRENT"
        if phase == "repair":
            for finding in findings:
                if finding.stale:
                    statuses[finding.node_id] = "REPAIRING"
        if phase == "verified":
            for node_id in list(statuses):
                statuses[node_id] = "VERIFIED"
            statuses["mission.return_policy_compliance"] = "VERIFIED"
        elif any(finding.stale for finding in findings):
            statuses["mission.return_policy_compliance"] = "STALE"
        return statuses

    @staticmethod
    def _base_view(
        *,
        phase: str,
        state: dict[str, Any],
        change_event: dict[str, Any] | None,
        watchzone_summary: dict[str, Any],
        affected: list[str],
        agent_stage: str,
        findings: list[dict[str, Any]] | None = None,
        crumbs: list[dict[str, Any]] | None = None,
        authority: dict[str, Any] | None = None,
        repair: dict[str, Any] | None = None,
        verification: dict[str, Any] | None = None,
        receipt: dict[str, Any] | None = None,
        node_statuses: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        view = {
            "run": {
                "run_id": RUN_ID,
                "phase": phase,
                "started_at": STARTED_AT,
                "fixture": True,
            },
            "change_event": change_event,
            "watchzone_summary": watchzone_summary,
            "nodes": node_projection(state["dependencies"], affected, node_statuses),
            "edges": copy.deepcopy(state["dependencies"]["edges"]),
            "agents": catalog_projection(GoldenPathRunner._agent_statuses(agent_stage)),
            "findings": findings or [],
            "crumbs": crumbs or [],
            "authority": authority,
            "repair": repair,
            "verification": verification,
            "receipt": receipt,
            "cloud_proof": {"cloud_run": False, "firestore": False, "evidence_refs": []},
        }
        validate_hackathon_view(view)
        return view

    def generate_snapshots(self) -> dict[str, dict[str, Any]]:
        self._dispatch_keys.clear()
        state = self.load_fixture_state()
        dependencies = state["dependencies"]
        idle_summary = self._watchzone_idle(len(dependencies["nodes"]))
        event = northstar_change_event()
        trigger = issue_trigger_crumb(event)
        affected, scoped_summary = select_watchzone(dependencies, event["subject"])

        snapshots: dict[str, dict[str, Any]] = {}
        snapshots["idle"] = self._base_view(
            phase="IDLE",
            state=state,
            change_event=None,
            watchzone_summary=idle_summary,
            affected=[],
            agent_stage="idle",
        )
        snapshots["change_detected"] = self._base_view(
            phase="DETECTED",
            state=state,
            change_event=event,
            watchzone_summary=idle_summary,
            affected=[],
            agent_stage="detected",
            crumbs=[trigger.to_projection()],
        )

        evidence_agents = ["policy-auditor", "data-auditor", "storefront-auditor"]
        dispatched = self.dispatch_agents(RUN_ID, evidence_agents)
        if len(dispatched) != len(evidence_agents):
            raise RuntimeError("Initial fleet dispatch was not unique.")
        snapshots["impacted_nodes_selected"] = self._base_view(
            phase="SCOPED",
            state=state,
            change_event=event,
            watchzone_summary=scoped_summary,
            affected=affected,
            agent_stage="scoped",
            crumbs=[trigger.to_projection()],
        )
        snapshots["agents_running"] = self._base_view(
            phase="RUNNING",
            state=state,
            change_event=event,
            watchzone_summary=scoped_summary,
            affected=affected,
            agent_stage="running",
            crumbs=[trigger.to_projection()],
        )

        findings = self._findings(state)
        finding_projection = [finding.to_projection() for finding in findings]
        evidence_crumbs = self._evidence_crumbs(findings)
        crumb_projection = [trigger.to_projection()] + [crumb.to_projection() for crumb in evidence_crumbs]
        finding_statuses = self._node_statuses(findings, "findings")
        snapshots["findings_complete"] = self._base_view(
            phase="FINDINGS_COMPLETE",
            state=state,
            change_event=event,
            watchzone_summary=scoped_summary,
            affected=affected,
            agent_stage="findings",
            findings=finding_projection,
            crumbs=crumb_projection,
            node_statuses=finding_statuses,
        )

        brief = build_repair_brief(findings, target_value=event["after"])
        authority = authority_projection(brief)
        snapshots["authority_review"] = self._base_view(
            phase="AUTHORITY_REVIEW",
            state=state,
            change_event=event,
            watchzone_summary=scoped_summary,
            affected=affected,
            agent_stage="authority",
            findings=finding_projection,
            crumbs=crumb_projection,
            authority=authority,
            node_statuses=finding_statuses,
        )

        repaired_state, repair = apply_synthetic_repair(
            state, brief, AuthorityDecision.REPAIR_1
        )
        snapshots["repair_applied"] = self._base_view(
            phase="REPAIRED",
            state=repaired_state,
            change_event=event,
            watchzone_summary=scoped_summary,
            affected=affected,
            agent_stage="repair",
            findings=finding_projection,
            crumbs=crumb_projection,
            authority=authority,
            repair=repair,
            node_statuses=self._node_statuses(findings, "repair"),
        )

        postconditions = (
            ("db.return_window_days", ("database", "returns_window_days"), 14),
            (
                "storefront.product_return_badge",
                ("storefront", "surfaces", "product_return_badge", "returns_window_days"),
                14,
            ),
            (
                "storefront.checkout_help",
                ("storefront", "surfaces", "checkout_help", "returns_window_days"),
                14,
            ),
            ("support.returns_answer", ("support", "returns_window_days"), 14),
        )
        verification = IndependentVerifier().verify(repaired_state, postconditions)
        verified_statuses = self._node_statuses(findings, "verified")
        snapshots["fresh_verification"] = self._base_view(
            phase="VERIFYING",
            state=repaired_state,
            change_event=event,
            watchzone_summary=scoped_summary,
            affected=affected,
            agent_stage="verified",
            findings=finding_projection,
            crumbs=crumb_projection,
            authority=authority,
            repair=repair,
            verification=verification,
            node_statuses=verified_statuses,
        )

        receipt = build_receipt(
            change_event=event,
            affected_node_ids=affected,
            findings=finding_projection,
            repair=repair,
            verification=verification,
            issued_at=RECEIPT_AT,
        )
        snapshots["receipt_complete"] = self._base_view(
            phase="COMPLETE",
            state=repaired_state,
            change_event=event,
            watchzone_summary=scoped_summary,
            affected=affected,
            agent_stage="verified",
            findings=finding_projection,
            crumbs=crumb_projection,
            authority={**authority, "decision": AuthorityDecision.OK.value},
            repair=repair,
            verification=verification,
            receipt=receipt,
            node_statuses=verified_statuses,
        )

        guard = LoopGuard(threshold=3)
        repeated_action = {
            "mission": "return_policy_compliance",
            "phase": "post_verify_repair",
            "tool": "fixture.patch",
            "surface_id": "storefront.product_return_badge",
            "arguments": {"returns_window_days": 14},
        }
        no_progress = {
            "outcome": "already_current",
            "postcondition": "returns_window_days=14",
            "target_state": "VERIFIED",
            "authority": "NONE",
        }
        loop_detected = False
        for _ in range(3):
            loop_detected = guard.observe(repeated_action, no_progress)
        if not loop_detected:
            raise RuntimeError("LoopGuard fixture did not detect the frozen repeat.")
        loop_crumb = Crumb(
            crumb_id="crumb_loopguard_returns_001",
            kind="LOOPGUARD",
            evidence_label=EvidenceLabel.OBSERVED,
            source_agent_id="change-sentinel",
            statement="Repeated repair attempt made no semantic progress and was blocked.",
            evidence_refs=("loopguard://returns/001",),
        )
        loop_authority = {
            "decision": AuthorityDecision.BLOCK.value,
            "repair_brief_id": "repair_brief_returns_repeat_001",
            "allowed_paths": [],
            "evidence_refs": ["loopguard://returns/001"],
            "rollback_required": False,
            "reason": "LoopGuard detected three identical action/progress signatures.",
        }
        loop_repair = {
            "repair_id": "repair_returns_repeat_001",
            "status": "NOOP_ALREADY_VERIFIED",
            "applied_paths": [],
            "before": {"storefront.product_return_badge": 14},
            "after": {"storefront.product_return_badge": 14},
            "rollback_available": False,
            "synthetic_only": True,
        }
        snapshots["loopguard_recovery"] = self._base_view(
            phase="LOOPGUARD_RECOVERY",
            state=repaired_state,
            change_event=event,
            watchzone_summary=scoped_summary,
            affected=affected,
            agent_stage="loopguard",
            findings=finding_projection,
            crumbs=crumb_projection + [loop_crumb.to_projection()],
            authority=loop_authority,
            repair=loop_repair,
            verification=verification,
            receipt=receipt,
            node_statuses=verified_statuses,
        )

        if tuple(snapshots) != SNAPSHOT_STATES:
            raise RuntimeError("Golden snapshot order drifted.")
        return snapshots

    def write_snapshots(self, output_dir: Path) -> dict[str, Path]:
        output_dir.mkdir(parents=True, exist_ok=True)
        paths = {}
        for index, (name, view) in enumerate(self.generate_snapshots().items()):
            path = output_dir / f"{index:02d}_{name}.json"
            path.write_text(json.dumps(view, indent=2, sort_keys=True) + "\n")
            paths[name] = path
        return paths

