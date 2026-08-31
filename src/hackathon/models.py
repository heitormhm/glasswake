from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, is_dataclass
from enum import StrEnum
from typing import Any


class EvidenceLabel(StrEnum):
    OBSERVED = "OBSERVED"
    DECLARED = "DECLARED"
    INFERRED = "INFERRED"
    APPROVED = "APPROVED"
    VERIFIED = "VERIFIED"


class AuthorityDecision(StrEnum):
    OK = "OK"
    REPAIR_1 = "REPAIR_1"
    REPAIR_2 = "REPAIR_2"
    ASK_USER = "ASK_USER"
    BLOCK = "BLOCK"


class AgentStatus(StrEnum):
    IDLE = "IDLE"
    DISPATCHED = "DISPATCHED"
    RUNNING = "RUNNING"
    FOUND = "FOUND"
    WAITING_REVIEW = "WAITING_REVIEW"
    VERIFIED = "VERIFIED"
    SAFE_PARK = "SAFE_PARK"
    BLOCKED = "BLOCKED"


class FindingDisposition(StrEnum):
    VALID = "VALID"
    INVALID = "INVALID"
    REVIEW = "REVIEW"


def to_plain(value: Any) -> Any:
    if isinstance(value, StrEnum):
        return value.value
    if is_dataclass(value):
        return to_plain(asdict(value))
    if isinstance(value, dict):
        return {str(key): to_plain(item) for key, item in value.items()}
    if isinstance(value, (tuple, list)):
        return [to_plain(item) for item in value]
    return value


def canonical_json(value: Any) -> str:
    return json.dumps(
        to_plain(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True
    )


def sha256_prefixed(value: Any) -> str:
    digest = hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


@dataclass(frozen=True)
class Crumb:
    crumb_id: str
    kind: str
    evidence_label: EvidenceLabel
    source_agent_id: str
    statement: str
    evidence_refs: tuple[str, ...]
    can_grant_authority: bool = False

    def __post_init__(self) -> None:
        if self.can_grant_authority:
            raise ValueError("Crumbs are evidence and cannot grant authority.")

    def to_projection(self) -> dict[str, Any]:
        payload = {
            "crumb_id": self.crumb_id,
            "kind": self.kind,
            "evidence_label": self.evidence_label.value,
            "source_agent_id": self.source_agent_id,
            "statement": self.statement,
            "evidence_refs": list(self.evidence_refs),
            "can_grant_authority": False,
        }
        return {**payload, "content_hash": sha256_prefixed(payload)}


@dataclass(frozen=True)
class Finding:
    finding_id: str
    agent_id: str
    node_id: str
    disposition: FindingDisposition
    evidence_label: EvidenceLabel
    expected_value: Any
    observed_value: Any
    stale: bool
    evidence_refs: tuple[str, ...]

    def to_projection(self) -> dict[str, Any]:
        return to_plain(self)


@dataclass(frozen=True)
class AgentDefinition:
    agent_id: str
    display_name: str
    owner: str
    domain: str
    purpose: str
    allowed_tools: tuple[str, ...]
    allowed_data_scopes: tuple[str, ...]
    authority_ceiling: str
    input_schema: str
    output_schema: str
    version: str = "1.0.0"

    def to_projection(self, status: AgentStatus) -> dict[str, Any]:
        return {**to_plain(self), "status": status.value}

