from __future__ import annotations

import copy
import json
from typing import Any, Mapping

from .models import EvidenceLabel, FindingDisposition


class StructuredOutputError(ValueError):
    """Raised before canonical state is touched when model output is malformed."""


GEMINI_FINDING_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "node_id",
        "disposition",
        "observed_value",
        "expected_value",
        "evidence_label",
        "rationale",
    ],
    "properties": {
        "node_id": {"type": "string"},
        "disposition": {"type": "string", "enum": [item.value for item in FindingDisposition]},
        "observed_value": {"type": "integer"},
        "expected_value": {"type": "integer"},
        "evidence_label": {"type": "string", "enum": [item.value for item in EvidenceLabel]},
        "rationale": {"type": "string"},
    },
}


def parse_gemini_finding(payload: str | Mapping[str, Any]) -> dict[str, Any]:
    if isinstance(payload, str):
        try:
            value = json.loads(payload)
        except json.JSONDecodeError as exc:
            raise StructuredOutputError("Gemini output is not valid JSON.") from exc
    elif isinstance(payload, Mapping):
        value = dict(payload)
    else:
        raise StructuredOutputError("Gemini output must be a JSON object.")

    if not isinstance(value, dict):
        raise StructuredOutputError("Gemini output must be a JSON object.")

    required = set(GEMINI_FINDING_SCHEMA["required"])
    allowed = set(GEMINI_FINDING_SCHEMA["properties"])
    if set(value) != required or set(value) - allowed:
        raise StructuredOutputError("Gemini output fields do not match the frozen schema.")
    if not isinstance(value["node_id"], str) or not value["node_id"]:
        raise StructuredOutputError("node_id must be a non-empty string.")
    if value["disposition"] not in {item.value for item in FindingDisposition}:
        raise StructuredOutputError("disposition is invalid.")
    if value["evidence_label"] not in {item.value for item in EvidenceLabel}:
        raise StructuredOutputError("evidence_label is invalid.")
    if not isinstance(value["observed_value"], int) or isinstance(value["observed_value"], bool):
        raise StructuredOutputError("observed_value must be an integer.")
    if not isinstance(value["expected_value"], int) or isinstance(value["expected_value"], bool):
        raise StructuredOutputError("expected_value must be an integer.")
    if not isinstance(value["rationale"], str) or not value["rationale"]:
        raise StructuredOutputError("rationale must be a non-empty string.")
    return value


def append_model_finding(
    canonical_state: dict[str, Any], payload: str | Mapping[str, Any]
) -> dict[str, Any]:
    parsed = parse_gemini_finding(payload)
    updated = copy.deepcopy(canonical_state)
    updated.setdefault("model_findings", []).append(parsed)
    return updated

