"""The action is real or it is not. These tests decide which."""

from __future__ import annotations

import os
import threading

import pytest
import uvicorn
from fastapi.testclient import TestClient

from hackathon.external_action import (
    AUTHORIZED_SURFACE,
    AuthorityRefused,
    ExternalActionRequest,
    NorthstarActionBroker,
    authorize,
)
from services.northstar_sandbox.main import STORE
from services.northstar_sandbox.main import app as sandbox_app

TOKEN = "test-sandbox-token"


@pytest.fixture(autouse=True)
def _token(monkeypatch):
    monkeypatch.setenv("NORTHSTAR_DEMO_ACTION_TOKEN", TOKEN)
    STORE.reset()


@pytest.fixture(scope="module")
def sandbox_url():
    """A genuinely separate process boundary: a real socket, real HTTP."""
    os.environ["NORTHSTAR_DEMO_ACTION_TOKEN"] = TOKEN
    config = uvicorn.Config(sandbox_app, host="127.0.0.1", port=8099, log_level="error")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    for _ in range(100):
        if server.started:
            break
        threading.Event().wait(0.05)
    yield "http://127.0.0.1:8099"
    server.should_exit = True
    thread.join(timeout=5)


def _request(**overrides) -> ExternalActionRequest:
    base = dict(
        run_id="GW-DEMO-001",
        actor_id="storefront-auditor",
        target_surface_id=AUTHORIZED_SURFACE,
        product_id="NST-BAG-001",
        new_return_window_days=14,
        authority_grant_id="repair_brief_returns_001",
    )
    return ExternalActionRequest(**{**base, **overrides})


# --- Sandbox service ------------------------------------------------------

def test_sandbox_starts_at_thirty_and_rejects_unauthenticated_mutation():
    client = TestClient(sandbox_app)
    assert client.get("/api/v1/products/NST-BAG-001").json()["return_window_days"] == 30

    unauth = client.post(
        "/api/v1/actions/update-return-policy",
        json={
            "product_id": "NST-BAG-001",
            "new_return_window_days": 14,
            "reason": "r",
            "glasswake_run_id": "x",
            "authority_grant_id": "y",
        },
        headers={"Idempotency-Key": "k"},
    )
    assert unauth.status_code == 401
    # Rejected means unchanged.
    assert client.get("/api/v1/products/NST-BAG-001").json()["return_window_days"] == 30


def test_sandbox_requires_idempotency_key_and_replays_instead_of_reapplying():
    client = TestClient(sandbox_app)
    headers = {"Authorization": f"Bearer {TOKEN}", "Idempotency-Key": "GW-DEMO-001:x:14"}
    body = {
        "product_id": "NST-BAG-001",
        "new_return_window_days": 14,
        "reason": "policy_drift_repair",
        "glasswake_run_id": "GW-DEMO-001",
        "authority_grant_id": "grant",
    }
    # Authenticated but keyless: rejected. (Unauthenticated callers 401 first,
    # so credential checks never leak validation detail.)
    keyless = client.post(
        "/api/v1/actions/update-return-policy",
        json=body,
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    assert keyless.status_code == 400

    first = client.post("/api/v1/actions/update-return-policy", json=body, headers=headers).json()
    assert first["status"] == "APPLIED"
    assert (first["previous_return_window_days"], first["current_return_window_days"]) == (30, 14)
    assert first["version_after"] == 2

    second = client.post("/api/v1/actions/update-return-policy", json=body, headers=headers).json()
    assert second["status"] == "ALREADY_APPLIED"
    assert second["action_id"] == first["action_id"]
    # A retry must not bump the version again.
    assert client.get("/api/v1/products/NST-BAG-001").json()["version"] == 2


def test_sandbox_never_echoes_the_credential():
    client = TestClient(sandbox_app)
    response = client.post(
        "/api/v1/actions/update-return-policy",
        json={
            "product_id": "NST-BAG-001",
            "new_return_window_days": 14,
            "reason": "r",
            "glasswake_run_id": "run",
            "authority_grant_id": "grant",
        },
        headers={"Authorization": f"Bearer {TOKEN}", "Idempotency-Key": "k1"},
    )
    assert TOKEN not in response.text


# --- Authority ------------------------------------------------------------

@pytest.mark.parametrize(
    "overrides",
    [
        {"target_surface_id": "policy.returns_window"},
        {"target_surface_id": "db.return_window_days"},
        {"product_id": "NST-MUG-004"},
        {"new_return_window_days": 999},
        {"authority_grant_id": ""},
    ],
)
def test_authority_refuses_out_of_scope_actions(overrides):
    with pytest.raises(AuthorityRefused):
        authorize(_request(**overrides))


def test_a_refused_action_produces_zero_writes(sandbox_url):
    broker = NorthstarActionBroker(base_url=sandbox_url, token=TOKEN)
    before = broker.read_product()["return_window_days"]

    result = broker.apply(_request(target_surface_id="policy.returns_window"))

    assert result.status == "REJECTED"
    assert result.action_id is None
    assert broker.read_product()["return_window_days"] == before


# --- The end-to-end proof -------------------------------------------------

def test_external_action_crosses_a_real_boundary_and_is_proven_by_fresh_read(sandbox_url):
    """The most important test in the MVP.

    A separate process, over HTTP, with a credential, mutated and then
    independently re-read.
    """
    broker = NorthstarActionBroker(base_url=sandbox_url, token=TOKEN)
    broker._post("/api/v1/demo/reset", {}, "reset")
    assert broker.read_product()["return_window_days"] == 30

    result = broker.apply(_request())
    assert result.status == "APPLIED"
    assert result.action_id and result.action_id.startswith("northstar_action_")
    assert result.observed_response["previous_return_window_days"] == 30
    assert result.observed_response["current_return_window_days"] == 14

    # The action's own response is not proof. Re-read the external system.
    verification = broker.verify_fresh(14)
    assert verification.result == "PASS"
    assert verification.observed == 14
    assert verification.projection()["trusted_action_response"] is False

    # And the state really changed on the other side of the boundary.
    assert broker.read_product()["return_window_days"] == 14


def test_verification_fails_closed_when_the_external_system_is_unreachable():
    broker = NorthstarActionBroker(base_url="http://127.0.0.1:9", token=TOKEN)
    verification = broker.verify_fresh(14)
    assert verification.result == "FAIL"
    assert verification.observed is None
    assert "Fresh read failed" in (verification.reason or "")
