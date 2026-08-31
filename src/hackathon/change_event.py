from __future__ import annotations

from typing import Any

from .models import Crumb, EvidenceLabel


def northstar_change_event() -> dict[str, Any]:
    return {
        "event_id": "chg_returns_001",
        "subject": "policy.returns_window_days",
        "before": 30,
        "after": 14,
        "source": "policy",
        "evidence_label": EvidenceLabel.VERIFIED.value,
    }


def issue_trigger_crumb(change_event: dict[str, Any]) -> Crumb:
    if change_event != northstar_change_event():
        raise ValueError("The MVP freeze permits only the Northstar returns-policy event.")
    return Crumb(
        crumb_id="crumb_trigger_returns_001",
        kind="TRIGGER",
        evidence_label=EvidenceLabel.VERIFIED,
        source_agent_id="change-sentinel",
        statement="Returns policy changed from 30 days to 14 days.",
        evidence_refs=("fixture://northstar/policy.json",),
    )

