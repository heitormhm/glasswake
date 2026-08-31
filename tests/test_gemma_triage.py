"""Gemma triage is advisory. These tests are the proof, not the claim."""

from __future__ import annotations

from dataclasses import dataclass

from hackathon.fleet import GoldenPathRunner
from hackathon.google_stack.gemma_triage import (
    GemmaWakeTriage,
    parse_triage_candidate,
    validate_triage,
)


@dataclass
class FakeResponse:
    text: str


class FakeModels:
    def __init__(self, text: str) -> None:
        self.text = text
        self.calls: list[dict] = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return FakeResponse(self.text)


class FakeClient:
    def __init__(self, text: str) -> None:
        self.models = FakeModels(text)


# The exact shape Gemma 4 returned when asked to triage the Northstar change.
REAL_GEMMA_OUTPUT = """```json
{
  "domain": "POLICY",
  "candidate_watchzones": ["customer_service", "checkout_flow", "terms_and_conditions"],
  "risk_class": "CUSTOMER_FACING"
}
```"""


def test_hallucinated_watchzones_are_dropped_and_named():
    candidate, validation = GemmaWakeTriage(client=FakeClient(REAL_GEMMA_OUTPUT)).triage(
        {"subject": "returns_window", "before": 30, "after": 14}
    )

    assert candidate.domain == "POLICY"
    # Gemma proposed three watchzones. None is canonical.
    assert len(candidate.candidate_watchzones) == 3
    assert validation.accepted_watchzones == ()
    assert set(validation.rejected_watchzones) == {
        "CUSTOMER_SERVICE",
        "CHECKOUT_FLOW",
        "TERMS_AND_CONDITIONS",
    }
    # Domain and risk survived, but with no canonical zone the triage is not accepted.
    assert validation.domain == "POLICY"
    assert validation.risk_class == "CUSTOMER_FACING"
    assert validation.accepted is False
    assert validation.authority == "candidate_only"


def test_a_canonical_watchzone_is_accepted_without_gaining_authority():
    _, validation = GemmaWakeTriage(
        client=FakeClient('{"domain":"POLICY","candidate_watchzones":["RETURNS"],'
                          '"risk_class":"CUSTOMER_FACING"}')
    ).triage({"subject": "returns_window"})

    assert validation.accepted is True
    assert validation.accepted_watchzones == ("RETURNS",)
    projection = validation.projection()
    assert projection["can_grant_authority"] is False
    assert projection["can_alter_canonical_scope"] is False
    assert projection["authority"] == "candidate_only"


def test_out_of_enum_classification_is_refused_not_coerced():
    validation = validate_triage(
        parse_triage_candidate(
            '{"domain":"LEGAL","candidate_watchzones":["RETURNS"],"risk_class":"CATASTROPHIC"}',
            "test",
        )
    )
    # A silently corrected classification is indistinguishable from a correct one.
    assert validation.domain is None
    assert validation.risk_class is None
    assert validation.accepted is False
    assert any("LEGAL" in reason for reason in validation.rejections)
    assert any("CATASTROPHIC" in reason for reason in validation.rejections)


def test_unparseable_output_degrades_to_an_empty_candidate():
    validation = validate_triage(parse_triage_candidate("I could not comply.", "test"))
    assert validation.accepted is False
    assert validation.accepted_watchzones == ()
    assert validation.domain is None


def test_triage_cannot_alter_the_canonical_scope_it_precedes():
    """The architectural claim, proven end to end.

    Canonical scope is computed by deterministic dependency selection. Whatever
    triage says — including a confident wrong answer — the affected set is
    byte-identical.
    """
    baseline = GoldenPathRunner().generate_snapshots()["receipt_complete"]
    expected = baseline["watchzone_summary"]

    for output in (
        REAL_GEMMA_OUTPUT,
        '{"domain":"INVENTORY","candidate_watchzones":["PRICING","SHIPPING"],"risk_class":"INTERNAL"}',
        "total nonsense",
    ):
        GemmaWakeTriage(client=FakeClient(output)).triage({"subject": "returns_window"})
        after = GoldenPathRunner().generate_snapshots()["receipt_complete"]
        assert after["watchzone_summary"] == expected
        assert after["watchzone_summary"]["affected_nodes"] == 5
        assert after["watchzone_summary"]["skipped_nodes"] == 7
