from __future__ import annotations

from collections import defaultdict, deque
from typing import Any

from .agent_catalog import CATALOG_BY_ID


SUBJECT_TO_NODE = {"policy.returns_window_days": "policy.returns_window"}


def select_watchzone(
    dependencies: dict[str, Any], subject: str
) -> tuple[list[str], dict[str, Any]]:
    try:
        source_node = SUBJECT_TO_NODE[subject]
    except KeyError as exc:
        raise ValueError(f"Unsupported change subject: {subject}") from exc

    nodes = dependencies["nodes"]
    node_ids = {node["node_id"] for node in nodes}
    if source_node not in node_ids:
        raise ValueError(f"Dependency source node missing: {source_node}")

    graph: dict[str, list[str]] = defaultdict(list)
    for edge in dependencies["edges"]:
        graph[edge["source"]].append(edge["target"])

    affected: list[str] = []
    seen = {source_node}
    queue = deque(sorted(graph[source_node]))
    while queue:
        node_id = queue.popleft()
        if node_id in seen:
            continue
        seen.add(node_id)
        affected.append(node_id)
        queue.extend(sorted(graph[node_id]))

    assignments = {
        node["agent_id"]
        for node in nodes
        if node["node_id"] in affected and node["agent_id"] is not None
    }
    unknown_agents = assignments - CATALOG_BY_ID.keys()
    if unknown_agents:
        raise ValueError(f"Affected nodes reference unknown agents: {sorted(unknown_agents)}")

    total = len(nodes)
    affected_count = len(affected)
    summary = {
        "total_nodes": total,
        "affected_nodes": affected_count,
        "skipped_nodes": total - affected_count,
        "dispatched_agents": len(assignments),
        "affected_node_ids": affected,
        "selective_work_reduction": round((total - affected_count) / total, 6),
    }
    return affected, summary


def node_projection(
    dependencies: dict[str, Any],
    affected_node_ids: list[str],
    statuses: dict[str, str] | None = None,
) -> list[dict[str, Any]]:
    affected = set(affected_node_ids)
    current = statuses or {}
    return [
        {
            **node,
            "affected": node["node_id"] in affected,
            "status": current.get(
                node["node_id"], "AFFECTED" if node["node_id"] in affected else "UNTOUCHED"
            ),
        }
        for node in dependencies["nodes"]
    ]

