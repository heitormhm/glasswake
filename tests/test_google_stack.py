from __future__ import annotations

from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient

from hackathon.fleet import GoldenPathRunner
from hackathon.google_stack.firestore_store import FirestoreRunStore
from hackathon.google_stack.gemini import GeminiStructuredReviewer
from services.cloud_api.main import app


class FakeDocument:
    def __init__(self, records, collection, document_id):
        self.records = records
        self.collection = collection
        self.document_id = document_id

    def set(self, value):
        self.records[(self.collection, self.document_id)] = value


class FakeCollection:
    def __init__(self, records, name):
        self.records = records
        self.name = name

    def document(self, document_id):
        return FakeDocument(self.records, self.name, document_id)


class FakeFirestoreClient:
    def __init__(self):
        self.records = {}

    def collection(self, name):
        return FakeCollection(self.records, name)


def test_firestore_adapter_persists_required_collections_without_network():
    view = GoldenPathRunner().generate_snapshots()["receipt_complete"]
    client = FakeFirestoreClient()
    refs = FirestoreRunStore(client).persist_view(view)
    collections = {collection for collection, _ in client.records}
    required = {
        "runs",
        "change_events",
        "agent_catalog",
        "crumbs",
        "findings",
        "receipts",
        "run_views",
    }
    assert required <= collections
    assert "firestore://runs/run_demo_001" in refs
    persisted_hash = client.records[("receipts", "receipt_returns_001")]["receipt_hash"]
    assert persisted_hash == view["receipt"]["receipt_hash"]


@dataclass
class FakeGeminiResponse:
    parsed: dict
    text: str = ""


class FakeGeminiModels:
    def __init__(self):
        self.call = None

    def generate_content(self, **kwargs):
        self.call = kwargs
        return FakeGeminiResponse(
            parsed={
                "node_id": "storefront.product_return_badge",
                "disposition": "VALID",
                "observed_value": 30,
                "expected_value": 14,
                "evidence_label": "OBSERVED",
                "rationale": "The synthetic surface is stale.",
            }
        )


class FakeGeminiClient:
    def __init__(self):
        self.models = FakeGeminiModels()


def test_gemini_adapter_uses_structured_schema_without_live_call():
    client = FakeGeminiClient()
    result = GeminiStructuredReviewer(client=client, model="gemini-3.7-flash").review(
        {"surface": "product", "observed": 30, "expected": 14}
    )
    assert result["node_id"] == "storefront.product_return_badge"
    assert client.models.call["model"] == "gemini-3.7-flash"
    assert client.models.call["config"]["response_mime_type"] == "application/json"
    assert client.models.call["config"]["response_json_schema"]["additionalProperties"] is False


def test_adk_agent_tree_builds_when_google_extra_is_installed():
    pytest.importorskip("google.adk")
    from hackathon.google_stack.adk_app import build_adk_root_agent

    root = build_adk_root_agent(model="gemini-3.7-flash")
    assert root.name == "change_sentinel"
    assert {agent.name for agent in root.sub_agents} == {
        "policy_auditor",
        "data_auditor",
        "storefront_auditor",
        "independent_verifier",
    }


def test_cloud_api_local_mock_replay():
    client = TestClient(app)
    health = client.get("/healthz")
    assert health.status_code == 200
    assert health.json()["mode"] == "deterministic_fixture"
    replay = client.post("/v1/demo/replay")
    assert replay.status_code == 200
    view = replay.json()
    assert view["receipt"]["status"] == "VERIFIED"
    assert view["cloud_proof"] == {"cloud_run": False, "firestore": False, "evidence_refs": []}


def test_golden_run_advances_and_never_seals_a_receipt_before_fresh_verification():
    client = TestClient(app)
    created = client.post("/v1/demo/runs")
    assert created.status_code == 200
    run = created.json()
    run_id = run["run_id"]

    assert run["mode"] == "replay_of_recorded_run"
    assert run["cursor"] == 0
    assert run["phase"] == "idle"
    assert run["status"] == "running"
    assert run["view"]["receipt"] is None

    seen_verification = False
    for expected_cursor in range(1, run["total_phases"]):
        step = client.post(f"/v1/demo/runs/{run_id}/advance").json()
        assert step["cursor"] == expected_cursor
        if step["view"]["receipt"] is not None:
            assert seen_verification, "receipt appeared before fresh verification"
        if step["phase"] == "fresh_verification":
            seen_verification = True

    assert step["phase"] == "receipt_complete"
    assert step["status"] == "complete"
    assert step["view"]["receipt"]["status"] == "VERIFIED"
    assert [event["seq"] for event in step["events"]] == list(range(9))

    # Advancing past the end is a no-op, not an error or a wrap-around.
    assert client.post(f"/v1/demo/runs/{run_id}/advance").json()["cursor"] == 8
    assert client.get(f"/v1/demo/runs/{run_id}").json()["phase"] == "receipt_complete"
    assert client.get("/v1/demo/runs/gw-run-missing").status_code == 404


def test_run_carries_cloud_evidence_on_every_phase_when_cloud_run_injects_it(monkeypatch):
    monkeypatch.setenv("K_SERVICE", "glasswake-kanon-pulse")
    monkeypatch.setenv("K_REVISION", "glasswake-kanon-pulse-00002-q6v")
    monkeypatch.setenv("GLASSWAKE_STORE", "memory")
    client = TestClient(app)

    run = client.post("/v1/demo/runs").json()
    expected = "cloud-run://glasswake-kanon-pulse/revisions/glasswake-kanon-pulse-00002-q6v"

    assert run["view"]["cloud_proof"]["cloud_run"] is True
    assert expected in run["view"]["cloud_proof"]["evidence_refs"]

    # The control plane reads proof off whichever phase is on screen, so the
    # evidence must survive every advance, not just the opening frame.
    for _ in range(8):
        step = client.post(f"/v1/demo/runs/{run['run_id']}/advance").json()
        assert step["view"]["cloud_proof"]["cloud_run"] is True
        assert expected in step["view"]["cloud_proof"]["evidence_refs"]


def test_run_claims_no_cloud_evidence_when_running_locally(monkeypatch):
    monkeypatch.delenv("K_SERVICE", raising=False)
    monkeypatch.delenv("K_REVISION", raising=False)
    monkeypatch.setenv("GLASSWAKE_STORE", "memory")

    run = TestClient(app).post("/v1/demo/runs").json()
    assert run["view"]["cloud_proof"] == {
        "cloud_run": False,
        "firestore": False,
        "evidence_refs": [],
    }

