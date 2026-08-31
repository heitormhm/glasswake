from __future__ import annotations

from typing import Any

from .models import sha256_prefixed


def build_receipt(
    *,
    change_event: dict[str, Any],
    affected_node_ids: list[str],
    findings: list[dict[str, Any]],
    repair: dict[str, Any],
    verification: dict[str, Any],
    issued_at: str,
) -> dict[str, Any]:
    frozen_inputs = {
        "change_event": change_event,
        "affected_node_ids": affected_node_ids,
        "finding_ids": [finding["finding_id"] for finding in findings],
        "repair_brief_id": "repair_brief_returns_001",
    }
    frozen_results = {
        "repair": repair,
        "verification": verification,
    }
    receipt = {
        "receipt_id": "receipt_returns_001",
        "status": "VERIFIED",
        "issued_at": issued_at,
        "before": repair["before"],
        "after": repair["after"],
        "postconditions": verification["checks"],
        "regression_result": (
            "PASS" if all(item["passed"] for item in verification["checks"]) else "FAIL"
        ),
        "frozen_input_hash": sha256_prefixed(frozen_inputs),
        "frozen_result_hash": sha256_prefixed(frozen_results),
    }
    return {**receipt, "receipt_hash": sha256_prefixed(receipt)}
