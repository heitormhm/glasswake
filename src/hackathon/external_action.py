"""Bounded external action against the Northstar sandbox.

The chain this module exists to keep separate:

    model proposal  !=  authority grant  !=  executed action  !=  proof

The broker holds no opinion about whether an action is justified. It executes
exactly one allowlisted capability, only when handed a grant that a
deterministic authority check produced, and it never treats the target's own
"status": "APPLIED" as proof. Proof is a fresh read performed afterwards.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal

from .repair_policy import ALLOWED_REPAIR_PATHS

CAPABILITY = "UPDATE_STOREFRONT_RETURN_POLICY"
TARGET_SYSTEM = "NORTHSTAR_SANDBOX"

# The single surface this capability may touch, and the single product. Widening
# either is an authority change, not a configuration change.
AUTHORIZED_SURFACE = "storefront.product_return_badge"
AUTHORIZED_PRODUCT = "NST-BAG-001"
AUTHORIZED_TARGET_VALUE = 14

ActionStatus = Literal["APPLIED", "ALREADY_APPLIED", "REJECTED", "FAILED"]


class AuthorityRefused(RuntimeError):
    """The action was refused before any request left this process."""


@dataclass(frozen=True)
class ExternalActionRequest:
    run_id: str
    actor_id: str
    target_surface_id: str
    product_id: str
    new_return_window_days: int
    authority_grant_id: str
    capability: str = CAPABILITY
    target_system: str = TARGET_SYSTEM

    @property
    def idempotency_key(self) -> str:
        return f"{self.run_id}:{self.target_surface_id}:{self.new_return_window_days}"


@dataclass(frozen=True)
class ExternalActionResult:
    status: ActionStatus
    request: ExternalActionRequest
    attempted_at: str
    action_id: str | None = None
    external_reference: str | None = None
    observed_response: dict[str, Any] = field(default_factory=dict)
    reason: str | None = None

    def projection(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "target_system": self.request.target_system,
            "capability": self.request.capability,
            "surface_id": self.request.target_surface_id,
            "product_id": self.request.product_id,
            "before": self.observed_response.get("previous_return_window_days"),
            "after": self.observed_response.get("current_return_window_days"),
            "action_id": self.action_id,
            "external_reference": self.external_reference,
            "idempotency_key": self.request.idempotency_key,
            "authority_grant_id": self.request.authority_grant_id,
            "attempted_at": self.attempted_at,
            "reason": self.reason,
            "boundary": "cross_service_https",
        }


def authorize(request: ExternalActionRequest) -> None:
    """Deterministic. No model is consulted, and nothing here is advisory.

    Every rejection happens before a request is built, so a refused action
    produces zero writes rather than a write that is later regretted.
    """
    if request.capability != CAPABILITY:
        raise AuthorityRefused(f"Capability {request.capability!r} is not allowlisted.")
    if request.target_system != TARGET_SYSTEM:
        raise AuthorityRefused(f"Target system {request.target_system!r} is not allowlisted.")
    if request.target_surface_id not in ALLOWED_REPAIR_PATHS:
        raise AuthorityRefused(
            f"Surface {request.target_surface_id!r} is outside the repair allowlist."
        )
    if request.target_surface_id != AUTHORIZED_SURFACE:
        raise AuthorityRefused(
            f"Surface {request.target_surface_id!r} is not the authorized external surface."
        )
    if request.product_id != AUTHORIZED_PRODUCT:
        raise AuthorityRefused(f"Product {request.product_id!r} is not authorized.")
    if request.new_return_window_days != AUTHORIZED_TARGET_VALUE:
        raise AuthorityRefused(
            f"Value {request.new_return_window_days!r} is outside the authorized grant."
        )
    if not request.authority_grant_id:
        raise AuthorityRefused("No authority grant supplied.")


@dataclass(frozen=True)
class FreshVerification:
    """The result of re-reading the external system after the mutation."""

    result: Literal["PASS", "FAIL"]
    expected: int
    observed: int | None
    verified_at: str
    verifier: str = "northstar_fresh_read"
    reason: str | None = None

    def projection(self) -> dict[str, Any]:
        return {
            "verifier": self.verifier,
            "target_surface_id": AUTHORIZED_SURFACE,
            "expected_return_window_days": self.expected,
            "observed_return_window_days": self.observed,
            "result": self.result,
            "verified_at": self.verified_at,
            "reason": self.reason,
            "trusted_action_response": False,
        }


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class NorthstarActionBroker:
    """Executes one capability against one external service."""

    def __init__(self, *, base_url: str | None = None, token: str | None = None) -> None:
        self.base_url = (base_url or os.getenv("NORTHSTAR_BASE_URL", "http://127.0.0.1:8081")).rstrip("/")
        self._token = token or os.getenv("NORTHSTAR_DEMO_ACTION_TOKEN", "")

    def _post(self, path: str, payload: dict[str, Any], idempotency_key: str) -> dict[str, Any]:
        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json",
                "Idempotency-Key": idempotency_key,
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.load(response)

    def read_product(self, product_id: str = AUTHORIZED_PRODUCT) -> dict[str, Any]:
        request = urllib.request.Request(
            f"{self.base_url}/api/v1/products/{product_id}",
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.load(response)

    def apply(self, request: ExternalActionRequest) -> ExternalActionResult:
        attempted_at = _now()
        try:
            authorize(request)
        except AuthorityRefused as exc:
            # Refused before the network. This is the zero-write path.
            return ExternalActionResult(
                status="REJECTED",
                request=request,
                attempted_at=attempted_at,
                reason=str(exc),
            )

        try:
            response = self._post(
                "/api/v1/actions/update-return-policy",
                {
                    "product_id": request.product_id,
                    "new_return_window_days": request.new_return_window_days,
                    "reason": "policy_drift_repair",
                    "glasswake_run_id": request.run_id,
                    "authority_grant_id": request.authority_grant_id,
                },
                request.idempotency_key,
            )
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
            return ExternalActionResult(
                status="FAILED",
                request=request,
                attempted_at=attempted_at,
                reason=f"{type(exc).__name__}: {exc}"[:200],
            )

        return ExternalActionResult(
            status="ALREADY_APPLIED" if response.get("status") == "ALREADY_APPLIED" else "APPLIED",
            request=request,
            attempted_at=attempted_at,
            action_id=response.get("action_id"),
            external_reference=f"northstar://actions/{response.get('action_id')}",
            observed_response=response,
        )

    def verify_fresh(self, expected: int = AUTHORIZED_TARGET_VALUE) -> FreshVerification:
        """Re-read the external system. The action's own response is not proof.

        Fails closed: an unreadable target is a failed verification, never an
        assumed success.
        """
        try:
            product = self.read_product()
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
            return FreshVerification(
                result="FAIL",
                expected=expected,
                observed=None,
                verified_at=_now(),
                reason=f"Fresh read failed: {type(exc).__name__}",
            )
        observed = product.get("return_window_days")
        return FreshVerification(
            result="PASS" if observed == expected else "FAIL",
            expected=expected,
            observed=observed,
            verified_at=_now(),
        )
