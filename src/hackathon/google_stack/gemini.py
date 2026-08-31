from __future__ import annotations

import json
import os
from typing import Any

from ..structured_output import GEMINI_FINDING_SCHEMA, parse_gemini_finding

DEFAULT_GEMINI_MODEL = "gemini-3.7-flash"


class GeminiStructuredReviewer:
    """Meaningful structured Gemini step with fail-closed post-validation."""

    def __init__(self, *, client: Any | None = None, model: str | None = None) -> None:
        self._client = client
        self.model = model or os.getenv("GLASSWAKE_GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

    def _client_or_default(self) -> Any:
        if self._client is not None:
            return self._client
        try:
            from google import genai
        except ImportError as exc:
            raise RuntimeError("Install the google extra to enable Gemini.") from exc
        self._client = genai.Client()
        return self._client

    def review(self, evidence: dict[str, Any]) -> dict[str, Any]:
        prompt = (
            "Classify this Northstar policy-surface evidence. Return only the configured "
            "structured response. Evidence: "
            + json.dumps(evidence, ensure_ascii=False, sort_keys=True)
        )
        response = self._client_or_default().models.generate_content(
            model=self.model,
            contents=prompt,
            config={
                "temperature": 0,
                "response_mime_type": "application/json",
                "response_json_schema": GEMINI_FINDING_SCHEMA,
            },
        )
        parsed = getattr(response, "parsed", None)
        if hasattr(parsed, "model_dump"):
            parsed = parsed.model_dump()
        payload = parsed if parsed is not None else response.text
        return parse_gemini_finding(payload)

