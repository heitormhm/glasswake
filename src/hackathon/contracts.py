from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

from .models import AgentStatus, AuthorityDecision, EvidenceLabel, FindingDisposition

TOP_LEVEL_FIELDS = {
    "run",
    "change_event",
    "watchzone_summary",
    "nodes",
    "edges",
    "agents",
    "findings",
    "crumbs",
    "authority",
    "repair",
    "verification",
    "receipt",
    "cloud_proof",
}


def project_root() -> Path:
    candidates = []
    configured = os.getenv("GLASSWAKE_PROJECT_ROOT")
    if configured:
        candidates.append(Path(configured))
    candidates.extend((Path.cwd(), Path(__file__).resolve().parents[2]))
    for candidate in candidates:
        if (candidate / "contracts" / "hackathon_view.schema.json").is_file() and (
            candidate / "fixtures" / "northstar"
        ).is_dir():
            return candidate
    raise RuntimeError("Unable to locate the GlassWake contract and fixture root.")


def schema_path() -> Path:
    return project_root() / "contracts" / "hackathon_view.schema.json"


def schema_sha256() -> str:
    return hashlib.sha256(schema_path().read_bytes()).hexdigest()


def validate_hackathon_view(view: dict[str, Any]) -> None:
    if set(view) != TOP_LEVEL_FIELDS:
        raise ValueError(
            f"HackathonView top-level contract mismatch: expected {sorted(TOP_LEVEL_FIELDS)}, "
            f"received {sorted(view)}"
        )
    if view["run"]["fixture"] is not True:
        raise ValueError("MVP snapshots must be synthetic fixtures.")
    evidence_labels = {item.value for item in EvidenceLabel}
    agent_statuses = {item.value for item in AgentStatus}
    authority_decisions = {item.value for item in AuthorityDecision}
    dispositions = {item.value for item in FindingDisposition}
    for agent in view["agents"]:
        if agent["status"] not in agent_statuses:
            raise ValueError(f"Unknown agent status: {agent['status']}")
    for finding in view["findings"]:
        if finding["evidence_label"] not in evidence_labels:
            raise ValueError(f"Unknown evidence label: {finding['evidence_label']}")
        if finding["disposition"] not in dispositions:
            raise ValueError(f"Unknown finding disposition: {finding['disposition']}")
    for crumb in view["crumbs"]:
        if crumb["can_grant_authority"] is not False:
            raise ValueError("Crumbs cannot grant authority.")
    if view["authority"] is not None and view["authority"]["decision"] not in authority_decisions:
        raise ValueError("Unknown authority decision.")
    summary = view["watchzone_summary"]
    if summary["affected_nodes"] + summary["skipped_nodes"] != summary["total_nodes"]:
        raise ValueError("WatchZone counts are inconsistent.")


def validate_with_json_schema(view: dict[str, Any]) -> None:
    try:
        import jsonschema
    except ImportError as exc:
        raise RuntimeError("Install the dev extra to run JSON Schema validation.") from exc
    schema = json.loads(schema_path().read_text())
    jsonschema.Draft202012Validator(schema).validate(view)
