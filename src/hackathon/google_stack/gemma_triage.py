"""Gemma Wake Triage — candidate-only preflight classification.

Gemma runs *before* the governed core and may suggest where a change might
matter. It has no authority over what the canonical WatchZone is. Its output is
a candidate that must survive deterministic validation, and even a fully
accepted candidate never widens or narrows the scope that dependency selection
computes.

This is not a theoretical guard. Asked to classify the Northstar returns-policy
change, Gemma 4 confidently proposes watchzones such as "customer_service" and
"checkout_flow": plausible, well-formed, and not canonical identifiers. The
validator below is what stands between that and dispatch.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from typing import Any

DEFAULT_GEMMA_MODEL = "gemma-4-26b-a4b-it-maas"

# Gemma 4 MaaS is served only from the global endpoint, unlike the derived
# media models which are us-central1 only.
GEMMA_LOCATION = "global"

ALLOWED_DOMAINS = ("POLICY", "PRICING", "INVENTORY", "SUPPORT")
ALLOWED_RISK_CLASSES = ("CUSTOMER_FACING", "INTERNAL", "REGULATORY")
CANONICAL_WATCHZONES = ("RETURNS",)

_TRIAGE_PROMPT = """Classify this enterprise change event for triage.

Return ONLY a JSON object with exactly these keys:
  "domain": one of {domains}
  "candidate_watchzones": array of short uppercase watchzone names
  "risk_class": one of {risks}

Change event: {change}
"""


@dataclass(frozen=True)
class TriageCandidate:
    """What Gemma proposed. Nothing here is trusted."""

    domain: str | None
    candidate_watchzones: tuple[str, ...]
    risk_class: str | None
    model: str
    raw_text: str


@dataclass(frozen=True)
class TriageValidation:
    """What survived deterministic validation.

    `authority` is a constant. Triage is advisory in every outcome, so there is
    no code path in which this value differs.
    """

    accepted: bool
    domain: str | None
    risk_class: str | None
    accepted_watchzones: tuple[str, ...]
    rejected_watchzones: tuple[str, ...]
    rejections: tuple[str, ...] = field(default_factory=tuple)
    authority: str = "candidate_only"

    def projection(self) -> dict[str, Any]:
        return {
            "accepted": self.accepted,
            "domain": self.domain,
            "risk_class": self.risk_class,
            "accepted_watchzones": list(self.accepted_watchzones),
            "rejected_watchzones": list(self.rejected_watchzones),
            "rejections": list(self.rejections),
            "authority": self.authority,
            "can_grant_authority": False,
            "can_alter_canonical_scope": False,
        }


def _extract_json(text: str) -> dict[str, Any] | None:
    """Pull the first JSON object out of a model response.

    Gemma commonly wraps JSON in a markdown fence. Tolerate that here, because
    the substantive rejection belongs in validation, not in string handling.
    """
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    body = fenced.group(1) if fenced else None
    if body is None:
        braced = re.search(r"\{.*\}", text, re.S)
        body = braced.group(0) if braced else None
    if body is None:
        return None
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def parse_triage_candidate(text: str, model: str) -> TriageCandidate:
    payload = _extract_json(text) or {}
    zones = payload.get("candidate_watchzones")
    if not isinstance(zones, list):
        zones = []
    return TriageCandidate(
        domain=payload.get("domain") if isinstance(payload.get("domain"), str) else None,
        candidate_watchzones=tuple(
            str(zone).strip().upper() for zone in zones if str(zone).strip()
        ),
        risk_class=(
            payload.get("risk_class") if isinstance(payload.get("risk_class"), str) else None
        ),
        model=model,
        raw_text=text,
    )


def validate_triage(candidate: TriageCandidate) -> TriageValidation:
    """Reduce a candidate to only what is canonically meaningful.

    Unknown watchzones are dropped and named. A domain or risk class outside the
    allowed enum is refused outright rather than coerced into the nearest match,
    because a silently corrected classification is indistinguishable from a
    correct one.
    """
    rejections: list[str] = []

    domain = candidate.domain.upper() if candidate.domain else None
    if domain not in ALLOWED_DOMAINS:
        if domain is not None:
            rejections.append(f"domain {domain!r} is not an allowed domain")
        domain = None

    risk_class = candidate.risk_class.upper() if candidate.risk_class else None
    if risk_class not in ALLOWED_RISK_CLASSES:
        if risk_class is not None:
            rejections.append(f"risk_class {risk_class!r} is not an allowed risk class")
        risk_class = None

    accepted = tuple(z for z in candidate.candidate_watchzones if z in CANONICAL_WATCHZONES)
    rejected = tuple(z for z in candidate.candidate_watchzones if z not in CANONICAL_WATCHZONES)
    for zone in rejected:
        rejections.append(f"watchzone {zone!r} is not a canonical watchzone")

    return TriageValidation(
        accepted=bool(domain and risk_class and accepted),
        domain=domain,
        risk_class=risk_class,
        accepted_watchzones=accepted,
        rejected_watchzones=rejected,
        rejections=tuple(rejections),
    )


class GemmaWakeTriage:
    """Serverless Gemma 4 preflight. Advisory in every outcome."""

    def __init__(self, *, client: Any | None = None, model: str | None = None) -> None:
        self._client = client
        self.model = model or os.getenv("GLASSWAKE_GEMMA_MODEL", DEFAULT_GEMMA_MODEL)

    def _client_or_default(self) -> Any:
        if self._client is not None:
            return self._client
        try:
            from google import genai
        except ImportError as exc:
            raise RuntimeError("Install the google extra to enable Gemma triage.") from exc
        self._client = genai.Client(location=GEMMA_LOCATION)
        return self._client

    def triage(self, change: dict[str, Any]) -> tuple[TriageCandidate, TriageValidation]:
        prompt = _TRIAGE_PROMPT.format(
            domains=", ".join(ALLOWED_DOMAINS),
            risks=", ".join(ALLOWED_RISK_CLASSES),
            change=json.dumps(change, ensure_ascii=False, sort_keys=True),
        )
        response = self._client_or_default().models.generate_content(
            model=self.model,
            contents=prompt,
            config={"temperature": 0, "max_output_tokens": 256},
        )
        candidate = parse_triage_candidate(response.text or "", self.model)
        return candidate, validate_triage(candidate)
