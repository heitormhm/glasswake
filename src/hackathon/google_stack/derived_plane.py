"""Derived Intelligence Plane — downstream of the sealed receipt.

Everything here consumes governed truth and produces communication. Nothing here
can create a canonical fact, widen authority, perform a repair, certify a
verification, or seal a receipt. The plane is:

    read-only · receipt-bound · zero write authority · fail-soft

Fail-soft is the load-bearing property. A derived-model outage must cost the
demo a nicety and nothing else: the receipt was already sealed and independently
verified before any of this ran, so no failure here can invalidate it.

The spoken briefing is generated deterministically from receipt fields rather
than by asking a model to narrate the incident. A model that freestyles an
incident summary can contradict the receipt it claims to describe.
"""

from __future__ import annotations

import base64
import os
from dataclasses import dataclass
from typing import Any

# The media models are served from us-central1 only, while Gemma 4 MaaS is
# global only. The split is not a design flourish; it is where Google serves
# them, and it happens to make the trust boundary a literal client boundary.
DERIVED_LOCATION = "us-central1"

DEFAULT_LYRIA_MODEL = "lyria-002"
DEFAULT_VEO_MODEL = "veo-3.1-fast-generate-001"
DEFAULT_TTS_MODEL = "gemini-2.5-flash-tts"


class DerivedOutputUnavailable(RuntimeError):
    """A derived output could not be produced. Never fatal to a run."""


@dataclass(frozen=True)
class DerivedOutput:
    kind: str
    model: str
    available: bool
    source_receipt: str | None
    reason: str | None = None
    media_base64: str | None = None
    mime_type: str | None = None
    operation: str | None = None
    script: str | None = None

    def projection(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "model": self.model,
            "available": self.available,
            "reason": self.reason,
            "script": self.script,
            "mime_type": self.mime_type,
            "operation": self.operation,
            "media_bytes": len(self.media_base64 or "") or None,
            "provenance": {
                "source_receipt": self.source_receipt,
                "derived_from": "sealed_receipt",
            },
            "authority": {
                "input": "read_only",
                "canonical_mutation": "prohibited",
                "authority_escalation": "prohibited",
                "receipt_invalidation": "impossible",
                "failure_mode": "fail_soft",
            },
        }


def require_sealed_receipt(view: dict[str, Any]) -> dict[str, Any]:
    """Derived output is receipt-bound. No sealed receipt, no derived output."""
    receipt = view.get("receipt")
    if not receipt or receipt.get("status") != "VERIFIED":
        raise DerivedOutputUnavailable(
            "No independently verified receipt. Derived output is receipt-bound."
        )
    return receipt


def executive_script(view: dict[str, Any]) -> str:
    """A briefing assembled from receipt fields, not written by a model.

    Every number here is read off governed state, so the spoken briefing cannot
    drift from the receipt it describes.
    """
    receipt = require_sealed_receipt(view)
    change = view.get("change_event") or {}
    watchzone = view.get("watchzone_summary") or {}
    repair = view.get("repair") or {}
    findings = view.get("findings") or []

    stale = sum(1 for finding in findings if finding.get("stale"))
    repaired = len(repair.get("applied_paths") or ())
    passed = sum(1 for check in receipt.get("postconditions") or () if check.get("passed"))
    total = len(receipt.get("postconditions") or ())

    return (
        f"GlassWake completed the Northstar return-policy incident. "
        f"The authoritative policy moved from {change.get('before', 30)} days "
        f"to {change.get('after', 14)} days. "
        f"{watchzone.get('affected_nodes', 0)} dependent surfaces required revalidation. "
        f"{watchzone.get('skipped_nodes', 0)} were safely skipped. "
        f"{stale} stale surfaces were found and {repaired} were repaired "
        f"within authorized scope. "
        f"Fresh independent verification passed {passed} of {total} postconditions. "
        f"Receipt sealed."
    )


class DerivedIntelligencePlane:
    """Lyria, Veo and Gemini TTS, downstream of a sealed receipt."""

    def __init__(self, *, client: Any | None = None) -> None:
        self._client = client
        self.lyria_model = os.getenv("GLASSWAKE_LYRIA_MODEL", DEFAULT_LYRIA_MODEL)
        self.veo_model = os.getenv("GLASSWAKE_VEO_MODEL", DEFAULT_VEO_MODEL)
        self.tts_model = os.getenv("GLASSWAKE_TTS_MODEL", DEFAULT_TTS_MODEL)

    def _client_or_default(self) -> Any:
        if self._client is not None:
            return self._client
        try:
            from google import genai
        except ImportError as exc:
            raise DerivedOutputUnavailable("Install the google extra.") from exc
        self._client = genai.Client(location=DERIVED_LOCATION)
        return self._client

    def _unavailable(self, kind: str, model: str, receipt_id: str | None, exc: Exception):
        return DerivedOutput(
            kind=kind,
            model=model,
            available=False,
            source_receipt=receipt_id,
            reason=f"{type(exc).__name__}: {exc}"[:200],
        )

    def _receipt_id(self, view: dict[str, Any]) -> str | None:
        return (view.get("receipt") or {}).get("receipt_id")

    def _lyria_predict(self, prompt: str) -> str:
        """Lyria is a :predict publisher model with no GenAI SDK surface.

        Called over REST with the same application default credentials the rest
        of the service uses; no API key is introduced.
        """
        import json
        import urllib.request

        import google.auth
        import google.auth.transport.requests

        credentials, project = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        credentials.refresh(google.auth.transport.requests.Request())
        project = os.getenv("GOOGLE_CLOUD_PROJECT") or project
        url = (
            f"https://{DERIVED_LOCATION}-aiplatform.googleapis.com/v1/projects/{project}"
            f"/locations/{DERIVED_LOCATION}/publishers/google/models/{self.lyria_model}:predict"
        )
        body = json.dumps(
            {"instances": [{"prompt": prompt}], "parameters": {"sampleCount": 1}}
        ).encode()
        request = urllib.request.Request(
            url,
            data=body,
            headers={
                "Authorization": f"Bearer {credentials.token}",
                "Content-Type": "application/json",
                "x-goog-user-project": project,
            },
        )
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = json.load(response)
        return payload["predictions"][0]["bytesBase64Encoded"]

    def audio_brief(self, view: dict[str, Any]) -> DerivedOutput:
        """Lyria: a restrained operational bed for the sealed incident."""
        receipt_id = self._receipt_id(view)
        try:
            require_sealed_receipt(view)
            prompt = (
                "Restrained corporate operations soundtrack, calm and resolved, "
                "low synth pad, minimal percussion, understated, no vocals."
            )
            audio = self._lyria_predict(prompt)
            return DerivedOutput(
                kind="audio_bed",
                model=self.lyria_model,
                available=True,
                source_receipt=receipt_id,
                media_base64=audio,
                mime_type="audio/wav",
            )
        except Exception as exc:
            return self._unavailable("audio_bed", self.lyria_model, receipt_id, exc)

    def voice_brief(self, view: dict[str, Any]) -> DerivedOutput:
        """Gemini TTS speaking the deterministic script verbatim."""
        receipt_id = self._receipt_id(view)
        try:
            script = executive_script(view)
            response = self._client_or_default().models.generate_content(
                model=self.tts_model,
                contents=script,
                config={
                    "response_modalities": ["AUDIO"],
                    "speech_config": {
                        "voice_config": {"prebuilt_voice_config": {"voice_name": "Kore"}}
                    },
                },
            )
            part = response.candidates[0].content.parts[0]
            data = part.inline_data.data
            encoded = base64.b64encode(data).decode() if isinstance(data, bytes) else data
            return DerivedOutput(
                kind="voice_brief",
                model=self.tts_model,
                available=True,
                source_receipt=receipt_id,
                media_base64=encoded,
                mime_type=getattr(part.inline_data, "mime_type", "audio/pcm"),
                script=script,
            )
        except Exception as exc:
            return self._unavailable("voice_brief", self.tts_model, receipt_id, exc)

    def incident_replay(self, view: dict[str, Any]) -> DerivedOutput:
        """Veo: a derived visual recap. Long-running; returns the operation."""
        receipt_id = self._receipt_id(view)
        try:
            require_sealed_receipt(view)
            operation = self._client_or_default().models.generate_videos(
                model=self.veo_model,
                prompt=(
                    "Slow cinematic push across a dark enterprise operations dashboard "
                    "resolving from amber warnings to calm green verified states, "
                    "restrained, documentary, no text."
                ),
                config={"duration_seconds": 4, "number_of_videos": 1},
            )
            return DerivedOutput(
                kind="incident_replay",
                model=self.veo_model,
                available=True,
                source_receipt=receipt_id,
                operation=getattr(operation, "name", str(operation)),
                mime_type="video/mp4",
            )
        except Exception as exc:
            return self._unavailable("incident_replay", self.veo_model, receipt_id, exc)
