from __future__ import annotations

from .models import AgentDefinition, AgentStatus


AGENT_CATALOG: tuple[AgentDefinition, ...] = (
    AgentDefinition(
        agent_id="change-sentinel",
        display_name="Change Sentinel",
        owner="GlassWake",
        domain="orchestration",
        purpose="Accept one frozen change event, issue one TriggerCrumb and dispatch specialists.",
        allowed_tools=("fixture.read", "watchzone.project", "fleet.dispatch"),
        allowed_data_scopes=("northstar.change_event", "northstar.dependencies"),
        authority_ceiling="DISPATCH_ONLY",
        input_schema="northstar.change_event.v1",
        output_schema="glasswake.trigger_crumb.v1",
    ),
    AgentDefinition(
        agent_id="policy-auditor",
        display_name="Policy Agent",
        owner="E-commerce Operations",
        domain="policy",
        purpose="Read the authoritative returns-policy fixture and return structured evidence.",
        allowed_tools=("fixture.read",),
        allowed_data_scopes=("northstar.policy",),
        authority_ceiling="EVIDENCE_ONLY",
        input_schema="northstar.policy.v1",
        output_schema="glasswake.finding.v1",
    ),
    AgentDefinition(
        agent_id="data-auditor",
        display_name="Data Agent",
        owner="Data Platform",
        domain="database",
        purpose="Compare the synthetic policy database with the authoritative policy.",
        allowed_tools=("fixture.read",),
        allowed_data_scopes=("northstar.database", "northstar.policy"),
        authority_ceiling="EVIDENCE_ONLY",
        input_schema="northstar.database.v1",
        output_schema="glasswake.finding.v1",
    ),
    AgentDefinition(
        agent_id="storefront-auditor",
        display_name="Storefront Agent",
        owner="Digital Commerce",
        domain="customer-surfaces",
        purpose="Inspect product, checkout and support surfaces for stale policy claims.",
        allowed_tools=("fixture.read", "dom_aria.inspect"),
        allowed_data_scopes=("northstar.storefront", "northstar.support", "northstar.products"),
        authority_ceiling="EVIDENCE_ONLY",
        input_schema="northstar.surface_bundle.v1",
        output_schema="glasswake.finding.v1",
    ),
    AgentDefinition(
        agent_id="independent-verifier",
        display_name="Independent Verifier",
        owner="Risk and Controls",
        domain="verification",
        purpose="Run frozen postconditions from a fresh fixture copy without diagnosis narrative.",
        allowed_tools=("fixture.read_fresh", "postcondition.evaluate"),
        allowed_data_scopes=("northstar.repaired_fixture", "northstar.postconditions"),
        authority_ceiling="VERIFY_ONLY",
        input_schema="glasswake.frozen_verification_mission.v1",
        output_schema="glasswake.verification.v1",
    ),
)

CATALOG_BY_ID = {agent.agent_id: agent for agent in AGENT_CATALOG}


def catalog_projection(
    statuses: dict[str, AgentStatus] | None = None,
) -> list[dict[str, object]]:
    current = statuses or {}
    return [
        agent.to_projection(current.get(agent.agent_id, AgentStatus.IDLE))
        for agent in AGENT_CATALOG
    ]

