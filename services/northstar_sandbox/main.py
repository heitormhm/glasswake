"""Northstar Supply — a synthetic merchant sandbox.

A separate service with its own state, deployed independently of GlassWake.
The business is fictional; the boundary is not. GlassWake cannot reach this
state except over authenticated HTTP, which is the point: a repair that never
leaves the runtime is a state transition, not an action.

The mutation endpoint is deliberately narrow. It updates one field on one
product. It is not a generic write API, because an agent holding a generic
write API has effectively unbounded authority no matter what the caller
intends.
"""

from __future__ import annotations

import hashlib
import os
import threading
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Northstar Supply Sandbox", version="1.0.0")

BASELINE_RETURN_WINDOW_DAYS = 30
CANONICAL_PRODUCT_ID = "NST-BAG-001"
MIN_RETURN_WINDOW_DAYS = 1
MAX_RETURN_WINDOW_DAYS = 365


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class _Store:
    """Process-local merchant state.

    ponytail: in-memory, single instance (maxScale=1). The demo needs state to
    outlive a request, not a region. Firestore if this ever scales.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.products = {
                CANONICAL_PRODUCT_ID: {
                    "product_id": CANONICAL_PRODUCT_ID,
                    "name": "Navy Commuter Bag",
                    "return_window_days": BASELINE_RETURN_WINDOW_DAYS,
                    "version": 1,
                    "updated_at": _now(),
                }
            }
            self.applied: dict[str, dict[str, Any]] = {}
            self.action_log: list[dict[str, Any]] = []


STORE = _Store()


def _require_action_token(authorization: str | None) -> None:
    """The read surface is open inside the sandbox; the write surface is not."""
    expected = os.getenv("NORTHSTAR_DEMO_ACTION_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="Sandbox action token is not configured.")
    supplied = (authorization or "").removeprefix("Bearer ").strip()
    if not supplied or supplied != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing action credential.")


class UpdateReturnPolicy(BaseModel):
    product_id: str
    new_return_window_days: int = Field(ge=MIN_RETURN_WINDOW_DAYS, le=MAX_RETURN_WINDOW_DAYS)
    reason: str
    glasswake_run_id: str
    authority_grant_id: str


@app.get("/healthz")
def healthz() -> dict[str, Any]:
    return {"status": "ok", "service": "northstar-sandbox"}


@app.get("/api/v1/products/{product_id}")
def read_product(product_id: str) -> dict[str, Any]:
    product = STORE.products.get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Unknown product.")
    return product


@app.get("/api/v1/action-log")
def action_log(run_id: str | None = None) -> dict[str, Any]:
    entries = STORE.action_log
    if run_id:
        entries = [entry for entry in entries if entry["glasswake_run_id"] == run_id]
    return {"count": len(entries), "actions": entries}


@app.post("/api/v1/actions/update-return-policy")
def update_return_policy(
    request: UpdateReturnPolicy,
    authorization: str | None = Header(default=None),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> dict[str, Any]:
    _require_action_token(authorization)
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required.")

    product = STORE.products.get(request.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Unknown product.")

    with STORE._lock:
        # A retry must not produce a second side effect. Replay the recorded
        # outcome instead of re-applying it.
        previous = STORE.applied.get(idempotency_key)
        if previous is not None:
            return {**previous, "status": "ALREADY_APPLIED"}

        version_before = product["version"]
        value_before = product["return_window_days"]
        product["return_window_days"] = request.new_return_window_days
        product["version"] = version_before + 1
        product["updated_at"] = _now()

        result = {
            "action_id": f"northstar_action_{uuid.uuid4().hex[:12]}",
            "status": "APPLIED",
            "idempotency_key": idempotency_key,
            "product_id": request.product_id,
            "previous_return_window_days": value_before,
            "current_return_window_days": request.new_return_window_days,
            "version_before": version_before,
            "version_after": product["version"],
            "applied_at": product["updated_at"],
            "glasswake_run_id": request.glasswake_run_id,
            "authority_grant_id": request.authority_grant_id,
            "reason": request.reason,
            # Never echo the credential. A short digest is enough to correlate.
            "credential_fingerprint": hashlib.sha256(
                (os.getenv("NORTHSTAR_DEMO_ACTION_TOKEN") or "").encode()
            ).hexdigest()[:12],
        }
        STORE.applied[idempotency_key] = result
        STORE.action_log.append(result)
        return result


@app.post("/api/v1/demo/reset")
def reset_demo(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _require_action_token(authorization)
    STORE.reset()
    return {
        "status": "RESET",
        "product": STORE.products[CANONICAL_PRODUCT_ID],
        "reset_at": _now(),
    }
