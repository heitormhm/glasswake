"""The derived plane may communicate governed truth. It may never create it."""

from __future__ import annotations

import pytest

from hackathon.fleet import GoldenPathRunner
from hackathon.google_stack.derived_plane import (
    DerivedIntelligencePlane,
    DerivedOutputUnavailable,
    executive_script,
    require_sealed_receipt,
)


@pytest.fixture(scope="module")
def sealed():
    return GoldenPathRunner().generate_snapshots()["receipt_complete"]


class ExplodingClient:
    """Every derived model is down."""

    class models:
        @staticmethod
        def predict(**_):
            raise RuntimeError("Lyria unavailable")

        @staticmethod
        def generate_content(**_):
            raise RuntimeError("TTS unavailable")

        @staticmethod
        def generate_videos(**_):
            raise RuntimeError("Veo unavailable")


def test_derived_output_requires_an_independently_verified_receipt():
    for view in ({}, {"receipt": None}, {"receipt": {"status": "PENDING"}}):
        with pytest.raises(DerivedOutputUnavailable):
            require_sealed_receipt(view)


def test_the_script_is_assembled_from_receipt_fields_not_written_by_a_model(sealed):
    script = executive_script(sealed)
    # Every number is read off governed state, so it cannot drift from the receipt.
    assert "30 days to 14 days" in script
    assert "5 dependent surfaces" in script
    assert "7 were safely skipped" in script
    assert "passed 5 of 5 postconditions" in script
    assert executive_script(sealed) == script  # deterministic


def test_total_derived_outage_is_fail_soft_and_never_invalidates_the_receipt(sealed, monkeypatch):
    def _down(self, prompt):
        raise RuntimeError("Lyria unavailable")

    monkeypatch.setattr(DerivedIntelligencePlane, "_lyria_predict", _down)
    plane = DerivedIntelligencePlane(client=ExplodingClient())

    outputs = (
        plane.audio_brief(sealed),
        plane.voice_brief(sealed),
        plane.incident_replay(sealed),
    )
    for output in outputs:
        assert output.available is False
        assert output.reason
        # Reported, never raised.
        assert output.projection()["authority"]["failure_mode"] == "fail_soft"
        assert output.projection()["authority"]["receipt_invalidation"] == "impossible"

    # The receipt is untouched by the outage.
    assert sealed["receipt"]["status"] == "VERIFIED"
    assert sealed["verification"]["status"] == "VERIFIED"


def test_derived_plane_cannot_mutate_canonical_state(sealed, monkeypatch):
    monkeypatch.setattr(
        DerivedIntelligencePlane, "_lyria_predict", lambda self, prompt: "ZmFrZQ=="
    )
    before = GoldenPathRunner().generate_snapshots()["receipt_complete"]
    plane = DerivedIntelligencePlane(client=ExplodingClient())
    plane.audio_brief(sealed)
    plane.voice_brief(sealed)
    plane.incident_replay(sealed)
    after = GoldenPathRunner().generate_snapshots()["receipt_complete"]

    assert after == before
    assert after["receipt"]["receipt_hash"] == before["receipt"]["receipt_hash"]


def test_every_derived_projection_declares_zero_authority(sealed, monkeypatch):
    monkeypatch.setattr(
        DerivedIntelligencePlane, "_lyria_predict", lambda self, prompt: "ZmFrZQ=="
    )
    plane = DerivedIntelligencePlane(client=ExplodingClient())
    projection = plane.audio_brief(sealed).projection()
    authority = projection["authority"]

    assert authority["input"] == "read_only"
    assert authority["canonical_mutation"] == "prohibited"
    assert authority["authority_escalation"] == "prohibited"
    assert projection["provenance"]["derived_from"] == "sealed_receipt"
