from __future__ import annotations

import copy
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from hackathon.agent_catalog import catalog_projection
from hackathon.contracts import schema_sha256
from hackathon.fleet import SNAPSHOT_STATES, GoldenPathRunner
from hackathon.google_stack.firestore_store import FirestoreRunStore, InMemoryRunStore
from hackathon.google_stack.gemini import GeminiStructuredReviewer
from hackathon.structured_output import StructuredOutputError

app = FastAPI(title="GlassWake Route A", version="0.1.0")
allowed_origins = [
    origin.strip()
    for origin in os.getenv("GLASSWAKE_CORS_ORIGINS", "http://127.0.0.1:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


def _snapshots() -> dict[str, dict[str, Any]]:
    return GoldenPathRunner().generate_snapshots()


@app.get("/healthz")
def healthz() -> dict[str, Any]:
    return {
        "status": "ok",
        "mode": "deterministic_fixture",
        "contract_sha256": schema_sha256(),
    }


@app.get("/v1/agent-catalog")
def agent_catalog() -> dict[str, Any]:
    return {"version": "1.0.0", "agents": catalog_projection()}


@app.get("/v1/demo/snapshots")
def list_snapshots() -> dict[str, Any]:
    return {"states": list(SNAPSHOT_STATES), "count": len(SNAPSHOT_STATES)}


@app.get("/v1/demo/snapshots/{state}")
def get_snapshot(state: str) -> dict[str, Any]:
    snapshots = _snapshots()
    try:
        return snapshots[state]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown golden snapshot state.") from exc


@app.post("/v1/demo/replay")
def replay() -> dict[str, Any]:
    view = copy.deepcopy(_snapshots()["receipt_complete"])
    store_mode = os.getenv("GLASSWAKE_STORE", "memory")
    if store_mode == "memory":
        InMemoryRunStore().persist_view(view)
    elif store_mode == "firestore":
        try:
            refs = FirestoreRunStore.from_default_client().persist_view(view)
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Firestore persistence failed.") from exc
        view["cloud_proof"]["firestore"] = True
        view["cloud_proof"]["evidence_refs"].extend(refs)
    else:
        raise HTTPException(status_code=500, detail="Unsupported GLASSWAKE_STORE mode.")

    service_name = os.getenv("K_SERVICE")
    revision = os.getenv("K_REVISION")
    if service_name and revision:
        view["cloud_proof"]["cloud_run"] = True
        view["cloud_proof"]["evidence_refs"].append(
            f"cloud-run://{service_name}/revisions/{revision}"
        )
    return view


@app.post("/v1/gemini/review")
def gemini_review(evidence: dict[str, Any]) -> dict[str, Any]:
    try:
        return GeminiStructuredReviewer().review(evidence)
    except (RuntimeError, StructuredOutputError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

