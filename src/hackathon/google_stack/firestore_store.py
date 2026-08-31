from __future__ import annotations

import copy
from typing import Any, Protocol


class RunStore(Protocol):
    def persist_view(self, view: dict[str, Any]) -> list[str]: ...


class InMemoryRunStore:
    def __init__(self) -> None:
        self.documents: dict[str, dict[str, Any]] = {}

    def persist_view(self, view: dict[str, Any]) -> list[str]:
        run_id = view["run"]["run_id"]
        self.documents[f"runs/{run_id}"] = copy.deepcopy(view)
        return [f"memory://runs/{run_id}"]


class FirestoreRunStore:
    """Server-side Firestore projection; clients receive no write authority."""

    def __init__(self, client: Any) -> None:
        self.client = client

    @classmethod
    def from_default_client(cls) -> FirestoreRunStore:
        try:
            from google.cloud import firestore
        except ImportError as exc:
            raise RuntimeError("Install the google extra to enable Firestore.") from exc
        return cls(firestore.Client())

    def _set(self, collection: str, document_id: str, value: dict[str, Any]) -> str:
        self.client.collection(collection).document(document_id).set(copy.deepcopy(value))
        return f"firestore://{collection}/{document_id}"

    def persist_view(self, view: dict[str, Any]) -> list[str]:
        refs = []
        run_id = view["run"]["run_id"]
        refs.append(self._set("runs", run_id, view["run"]))
        if view["change_event"] is not None:
            refs.append(
                self._set(
                    "change_events", view["change_event"]["event_id"], view["change_event"]
                )
            )
        for agent in view["agents"]:
            refs.append(self._set("agent_catalog", agent["agent_id"], agent))
        for crumb in view["crumbs"]:
            refs.append(self._set("crumbs", crumb["crumb_id"], crumb))
        for finding in view["findings"]:
            refs.append(self._set("findings", finding["finding_id"], finding))
        if view["receipt"] is not None:
            refs.append(self._set("receipts", view["receipt"]["receipt_id"], view["receipt"]))
        refs.append(self._set("run_views", run_id, view))
        return refs

