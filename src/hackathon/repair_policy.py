from __future__ import annotations

import copy
from dataclasses import dataclass
from typing import Any

from .models import AuthorityDecision, Finding, canonical_json, sha256_prefixed


ALLOWED_REPAIR_PATHS = {
    "storefront.product_return_badge": ("storefront", "surfaces", "product_return_badge", "returns_window_days"),
    "storefront.checkout_help": ("storefront", "surfaces", "checkout_help", "returns_window_days"),
    "support.returns_answer": ("support", "returns_window_days"),
}


@dataclass(frozen=True)
class RepairBrief:
    repair_brief_id: str
    allowed_paths: tuple[str, ...]
    target_value: int
    evidence_refs: tuple[str, ...]
    rollback_required: bool = True


def build_repair_brief(findings: list[Finding], target_value: int) -> RepairBrief:
    stale_paths = tuple(
        sorted(finding.node_id for finding in findings if finding.stale and finding.node_id in ALLOWED_REPAIR_PATHS)
    )
    if not stale_paths:
        raise ValueError("No allowed stale synthetic paths require repair.")
    prohibited = [
        finding.node_id
        for finding in findings
        if finding.stale and finding.node_id not in ALLOWED_REPAIR_PATHS
    ]
    if prohibited:
        raise ValueError(f"RepairBrief contains prohibited paths: {sorted(prohibited)}")
    evidence_refs = tuple(
        sorted({ref for finding in findings if finding.stale for ref in finding.evidence_refs})
    )
    return RepairBrief(
        repair_brief_id="repair_brief_returns_001",
        allowed_paths=stale_paths,
        target_value=target_value,
        evidence_refs=evidence_refs,
    )


def authority_projection(brief: RepairBrief) -> dict[str, Any]:
    return {
        "decision": AuthorityDecision.REPAIR_1.value,
        "repair_brief_id": brief.repair_brief_id,
        "allowed_paths": list(brief.allowed_paths),
        "evidence_refs": list(brief.evidence_refs),
        "rollback_required": brief.rollback_required,
        "reason": "One bounded synthetic RepairBrief covers only the stale returns-policy surfaces.",
    }


def _read_path(state: dict[str, Any], logical_path: str) -> Any:
    value: Any = state
    for part in ALLOWED_REPAIR_PATHS[logical_path]:
        value = value[part]
    return value


def _write_path(state: dict[str, Any], logical_path: str, value: Any) -> None:
    target: Any = state
    parts = ALLOWED_REPAIR_PATHS[logical_path]
    for part in parts[:-1]:
        target = target[part]
    target[parts[-1]] = value


def apply_synthetic_repair(
    state: dict[str, Any], brief: RepairBrief, decision: AuthorityDecision
) -> tuple[dict[str, Any], dict[str, Any]]:
    if decision is not AuthorityDecision.REPAIR_1:
        raise PermissionError("A bounded REPAIR_1 authority decision is required.")
    if any(path not in ALLOWED_REPAIR_PATHS for path in brief.allowed_paths):
        raise PermissionError("RepairBrief escaped the synthetic allowlist.")

    repaired = copy.deepcopy(state)
    before = {path: _read_path(repaired, path) for path in brief.allowed_paths}
    for path in brief.allowed_paths:
        _write_path(repaired, path, brief.target_value)
    after = {path: _read_path(repaired, path) for path in brief.allowed_paths}
    repair = {
        "repair_id": "repair_returns_001",
        "status": "APPLIED",
        "applied_paths": list(brief.allowed_paths),
        "before": before,
        "after": after,
        "rollback_available": True,
        "synthetic_only": True,
    }
    return repaired, repair


class LoopGuard:
    """Detect repeated action/state pairs without granting repair authority."""

    def __init__(self, threshold: int = 3) -> None:
        if threshold < 2:
            raise ValueError("LoopGuard threshold must be at least two.")
        self.threshold = threshold
        self._history: list[tuple[str, str]] = []

    def observe(self, action: dict[str, Any], progress: dict[str, Any]) -> bool:
        action_signature = sha256_prefixed(
            {
                key: action[key]
                for key in ("mission", "phase", "tool", "surface_id", "arguments")
                if key in action
            }
        )
        progress_signature = sha256_prefixed(
            {
                key: progress[key]
                for key in ("outcome", "postcondition", "target_state", "authority")
                if key in progress
            }
        )
        self._history.append((action_signature, progress_signature))
        recent = self._history[-self.threshold :]
        return len(recent) == self.threshold and len(set(recent)) == 1

    def evidence(self) -> dict[str, Any]:
        return {
            "threshold": self.threshold,
            "observations": len(self._history),
            "fingerprint": sha256_prefixed(canonical_json(self._history)),
        }

