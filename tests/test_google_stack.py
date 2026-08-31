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
