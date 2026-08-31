from __future__ import annotations

import copy
import os
import time
from collections import OrderedDict
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

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


def _health_payload() -> dict[str, Any]:
    return {
        "status": "ok",
        "mode": "deterministic_fixture",
        "contract_sha256": schema_sha256(),
    }


@app.get("/healthz")
def healthz() -> dict[str, Any]:
    """Container-level health, reachable locally and inside the image.

    Not reachable over the Cloud Run URL: Google's frontend answers /healthz
    itself with a 404 that never arrives at the container. Clients must use
    /v1/healthz instead.
    """
    return _health_payload()


@app.get("/v1/healthz")
def healthz_v1() -> dict[str, Any]:
    """The health path clients use. Identical payload, but not intercepted."""
    return _health_payload()


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


def _cloud_run_ref() -> str | None:
    """The Cloud Run revision serving this process, or None when running locally.

    K_SERVICE and K_REVISION are injected by Cloud Run itself, so their presence
    is the runtime's own evidence rather than a claim the application makes.
    """
    service_name = os.getenv("K_SERVICE")
    revision = os.getenv("K_REVISION")
    if service_name and revision:
        return f"cloud-run://{service_name}/revisions/{revision}"
    return None


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

    cloud_ref = _cloud_run_ref()
    if cloud_ref:
        view["cloud_proof"]["cloud_run"] = True
        view["cloud_proof"]["evidence_refs"].append(cloud_ref)
    return view


@app.post("/v1/gemini/review")
def gemini_review(evidence: dict[str, Any]) -> dict[str, Any]:
    try:
        return GeminiStructuredReviewer().review(evidence)
    except (RuntimeError, StructuredOutputError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc



# --- Golden run lifecycle -------------------------------------------------
#
# A run is one real execution of GoldenPathRunner. The nine canonical phases
# are produced by that single execution, so stepping through them is replay of
# a recorded run, not nine independent live computations. The API says so
# explicitly in `mode` so the demo never overstates what it is doing.

GOLDEN_PHASES = SNAPSHOT_STATES[:9]
_MAX_RUNS = 32

# ponytail: process-local run store, single-instance only (maxScale=1).
# Move to Firestore if the service ever scales past one instance.
_runs: OrderedDict[str, dict[str, Any]] = OrderedDict()


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _run_or_404(run_id: str) -> dict[str, Any]:
    try:
        return _runs[run_id]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown run.") from exc


def _projection(run: dict[str, Any]) -> dict[str, Any]:
    cursor = run["cursor"]
    phase = GOLDEN_PHASES[cursor]
    view = run["views"][phase]

    # The receipt is closure, and closure is only earned by an independent
    # fresh verification that already happened. Enforce that ordering here so a
    # pipeline reordering fails loudly instead of sealing a receipt early.
    if view.get("receipt") is not None:
        verified = any(
            event["phase"] == "fresh_verification" for event in run["events"]
        )
        if not verified:
            raise HTTPException(
                status_code=500,
                detail="Receipt exposed before fresh verification was recorded.",
            )

    return {
        "run_id": run["run_id"],
        "mode": "replay_of_recorded_run",
        "status": "complete" if cursor == len(GOLDEN_PHASES) - 1 else "running",
        "cursor": cursor,
        "phase": phase,
        "total_phases": len(GOLDEN_PHASES),
        "executed_at": run["executed_at"],
        "execution_ms": run["execution_ms"],
        "events": run["events"],
        "view": view,
    }


def _attach_cloud_proof(views: dict[str, dict[str, Any]]) -> None:
    """Carry the run's Google Cloud evidence onto every phase of that run.

    The control plane reads cloud_proof off whichever phase is on screen, so the
    evidence has to travel with all nine of them, not just the receipt. Firestore
    persistence is best-effort: a write failure costs the run its persistence
    evidence, never the run itself.
    """
    cloud_ref = _cloud_run_ref()

    firestore_refs: list[str] = []
    if os.getenv("GLASSWAKE_STORE") == "firestore":
        try:
            firestore_refs = FirestoreRunStore.from_default_client().persist_view(
                copy.deepcopy(views["receipt_complete"])
            )
        except Exception:
            firestore_refs = []

    for view in views.values():
        proof = view["cloud_proof"]
        if cloud_ref:
            proof["cloud_run"] = True
            proof["evidence_refs"].append(cloud_ref)
        if firestore_refs:
            proof["firestore"] = True
            proof["evidence_refs"].extend(firestore_refs)


@app.post("/v1/demo/runs")
def create_run() -> dict[str, Any]:
    executed_at = _now()
    started = time.perf_counter()
    views = _snapshots()
    execution_ms = round((time.perf_counter() - started) * 1000, 3)

    _attach_cloud_proof(views)

    run_id = f"gw-run-{uuid4().hex[:12]}"
    _runs[run_id] = {
        "run_id": run_id,
        "executed_at": executed_at,
        "execution_ms": execution_ms,
        "views": views,
        "cursor": 0,
        "events": [{"seq": 0, "phase": GOLDEN_PHASES[0], "at": _now()}],
    }
    while len(_runs) > _MAX_RUNS:
        _runs.popitem(last=False)
    return _projection(_runs[run_id])


@app.get("/v1/demo/runs/{run_id}")
def read_run(run_id: str) -> dict[str, Any]:
    return _projection(_run_or_404(run_id))


@app.post("/v1/demo/runs/{run_id}/advance")
def advance_run(run_id: str) -> dict[str, Any]:
    run = _run_or_404(run_id)
    if run["cursor"] < len(GOLDEN_PHASES) - 1:
        run["cursor"] += 1
        run["events"].append(
            {"seq": run["cursor"], "phase": GOLDEN_PHASES[run["cursor"]], "at": _now()}
        )
    return _projection(run)
