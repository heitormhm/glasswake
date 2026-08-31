import type {
  AgentData,
  AgentStatus,
  AuthorityData,
  EvidenceData,
  EvidenceType,
  HackathonView,
  ImpactNodeData,
  MissionStage,
  NodeState,
  ReceiptData,
  VerificationData,
} from './types'
import { snapshotKeys } from './types'

type RawNodeStatus = 'UNTOUCHED' | 'AFFECTED' | 'CURRENT' | 'STALE' | 'REPAIRING' | 'VERIFIED' | 'BLOCKED'

export interface RawHackathonView {
  run: { run_id: string; phase: string; started_at: string; fixture: true }
  change_event: null | { event_id: string; subject: string; before: number; after: number; source: string; evidence_label: EvidenceType }
  watchzone_summary: {
    total_nodes: number
    affected_nodes: number
    skipped_nodes: number
    dispatched_agents: number
    affected_node_ids: string[]
    selective_work_reduction: number
  }
  nodes: Array<{
    node_id: string
    display_name: string
    kind: 'policy' | 'database' | 'surface' | 'mission' | 'unrelated'
    agent_id: string | null
    affected: boolean
    status: RawNodeStatus
  }>
  edges: Array<{ source: string; target: string; relation: string }>
  agents: Array<{
    agent_id: string
    display_name: string
    owner: string
    domain: string
    purpose: string
    allowed_tools: string[]
    allowed_data_scopes: string[]
    authority_ceiling: string
    input_schema: string
    output_schema: string
    status: AgentStatus
    version: string
  }>
  findings: Array<{
    finding_id: string
    agent_id: string
    node_id: string
    disposition: string
    evidence_label: EvidenceType
    evidence_refs: string[]
    expected_value: number
    observed_value: number
    stale: boolean
  }>
  crumbs: Array<{
    crumb_id: string
    kind: string
    evidence_label: EvidenceType
    source_agent_id: string
    statement: string
    evidence_refs: string[]
    content_hash: string
    can_grant_authority: false
  }>
  authority: null | {
    allowed_paths: string[]
    decision: AuthorityData['policyResult']
    evidence_refs: string[]
    reason: string
    repair_brief_id: string
    rollback_required: boolean
  }
  repair: null | {
    repair_id: string
    status: string
    applied_paths: string[]
    before: Record<string, number>
    after: Record<string, number>
    rollback_available: boolean
    synthetic_only: boolean
  }
  verification: null | {
    verification_id: string
    fresh_run: boolean
    independent: boolean
    received_implementer_narrative: boolean
    status: string
    checks: Array<{ node_id: string; expected: unknown; observed: unknown; passed: boolean }>
  }
  receipt: null | {
    receipt_id: string
    issued_at: string
    status: string
    regression_result: string
    postconditions: Array<{ node_id: string; expected: unknown; observed: unknown; passed: boolean }>
    before: Record<string, number>
    after: Record<string, number>
    frozen_input_hash: string
    frozen_result_hash: string
    receipt_hash: string
  }
  cloud_proof: { cloud_run: boolean; firestore: boolean; evidence_refs: string[] }
}

const screenLabels = [
  'S0 · Baseline',
  'S1 · Change detected',
  'S2 · Impact scoped',
  'S3 · Fleet dispatched',
  'S4 · Stale surfaces found',
  'S5 · Authority ready',
  'S6 · Repair applied',
  'S7 · Fresh verification',
  'S8 · Receipt complete',
] as const

const runStatuses = [
  'BASELINE',
  'CHANGE DETECTED',
  'IMPACT SCOPED',
  'FLEET RUNNING',
  'REVIEW REQUIRED',
  'AUTHORITY READY',
  'REPAIR APPLIED',
  'FRESH VERIFIED',
  'RECEIPT SEALED',
] as const

const missionLabels: MissionStage['label'][] = ['Detect', 'Scope', 'Dispatch', 'Review', 'Repair', 'Verify', 'Receipt']
const missionActiveBySnapshot = [0, 1, 2, 3, 3, 4, 5, 5, 7]

const nodePositions: Record<string, { x: number; y: number }> = {
  'policy.returns_window': { x: 55, y: 168 },
  'db.return_window_days': { x: 245, y: 60 },
  'storefront.product_return_badge': { x: 430, y: 42 },
  'storefront.checkout_help': { x: 615, y: 38 },
  'support.returns_answer': { x: 615, y: 148 },
  'mission.return_policy_compliance': { x: 805, y: 168 },
  'catalog.product_name': { x: 245, y: 292 },
  'catalog.product_price': { x: 430, y: 238 },
  'inventory.stock_status': { x: 430, y: 342 },
  'shipping.delivery_estimate': { x: 615, y: 320 },
  'marketing.hero_banner': { x: 805, y: 40 },
  'analytics.conversion_event': { x: 805, y: 300 },
}

const surfaceLabels: Record<string, string> = {
  'storefront.product_return_badge': 'Navy bag product policy',
  'storefront.checkout_help': 'Checkout help policy',
  'support.returns_answer': 'Support returns answer',
}

const statusMap: Record<RawNodeStatus, NodeState> = {
  UNTOUCHED: 'unaffected',
  AFFECTED: 'affected',
  CURRENT: 'verified',
  STALE: 'stale',
  REPAIRING: 'repairing',
  VERIFIED: 'verified',
  BLOCKED: 'blocked',
}

function missionFor(index: number): MissionStage[] {
  if (index === 8) return missionLabels.map((label) => ({ label, status: 'completed' }))
  const active = missionActiveBySnapshot[index]
  return missionLabels.map((label, position) => ({
    label,
    status: position < active ? 'completed' : position === active ? 'active' : 'queued',
  }))
}

function mapNodeKind(node: RawHackathonView['nodes'][number]): ImpactNodeData['kind'] {
  if (node.kind === 'policy') return 'policy'
  if (node.kind === 'database') return 'database'
  if (node.kind === 'surface') return 'surface'
  if (node.kind === 'mission') return 'system'
  if (node.node_id.startsWith('catalog.')) return 'catalog'
  if (node.node_id.startsWith('inventory.')) return 'database'
  if (node.node_id.startsWith('shipping.')) return 'policy'
  if (node.node_id.startsWith('marketing.')) return 'surface'
  return 'system'
}

function adaptNodes(raw: RawHackathonView): ImpactNodeData[] {
  return raw.nodes.map((node) => ({
    id: node.node_id,
    label: surfaceLabels[node.node_id] ?? node.display_name,
    kind: mapNodeKind(node),
    state: statusMap[node.status],
    ...(nodePositions[node.node_id] ?? { x: 0, y: 0 }),
  }))
}

function evidenceFor(raw: RawHackathonView): EvidenceData[] {
  return raw.findings.map((finding) => ({
    id: finding.finding_id,
    type: finding.evidence_label,
    statement: `${surfaceLabels[finding.node_id] ?? finding.node_id} observed ${finding.observed_value}; expected ${finding.expected_value}.`,
    source: finding.evidence_refs[0] ?? finding.node_id,
    timestamp: null,
  }))
}

function agentTask(raw: RawHackathonView, agent: RawHackathonView['agents'][number], evidenceCount: number): string {
  if (agent.status === 'IDLE') return 'Awaiting relevant change'
  if (agent.status === 'DISPATCHED') return `${agent.domain} projection queued`
  if (agent.status === 'RUNNING') return `Inspecting ${agent.domain}`
  if (agent.status === 'FOUND') return `${evidenceCount} structured findings recorded`
  if (agent.status === 'WAITING_REVIEW') return 'Evidence ready for authority review'
  if (agent.status === 'BLOCKED') return 'Blocked by authority policy'
  if (agent.agent_id === 'independent-verifier') return 'Fresh verification complete'
  if (raw.run.phase === 'COMPLETE') return 'Postcondition retained'
  return 'Evidence projection verified'
}

function agentModality(agent: RawHackathonView['agents'][number]): AgentData['modality'] {
  if (agent.agent_id === 'change-sentinel') return 'EVENT'
  if (agent.agent_id === 'policy-auditor') return 'POLICY'
  if (agent.agent_id === 'data-auditor') return 'DATA'
  if (agent.agent_id === 'independent-verifier') return 'FRESH RUN'
  return 'BROWSER'
}

function adaptAgents(raw: RawHackathonView): AgentData[] {
  return raw.agents.map((agent) => {
    const findingCount = raw.findings.filter((finding) => finding.agent_id === agent.agent_id).length
    const evidenceCount = findingCount
      + raw.crumbs.filter((crumb) => crumb.source_agent_id === agent.agent_id).length
    return {
      id: agent.agent_id,
      name: agent.display_name,
      status: agent.status,
      task: agentTask(raw, agent, findingCount),
      evidenceCount,
      modality: agentModality(agent),
      authority: agent.authority_ceiling.replaceAll('_', ' '),
    }
  })
}

function adaptAuthority(raw: RawHackathonView): AuthorityData | null {
  if (!raw.authority) return null
  return {
    proposedRepair: raw.authority.reason,
    surfaces: raw.authority.allowed_paths.map((path) => ({ label: surfaceLabels[path] ?? path, id: path })),
    evidenceRefs: raw.authority.evidence_refs,
    authorityCeiling: `${raw.authority.allowed_paths.length} named synthetic paths only`,
    proposedAction: raw.authority.repair_brief_id,
    policyResult: raw.authority.decision,
    rollbackAvailable: raw.repair?.rollback_available ?? raw.authority.rollback_required,
    provenance: `Backend authority projection · ${raw.authority.repair_brief_id}`,
    independenceReminder: 'Fresh verifier receives fixture state and frozen postconditions only.',
  }
}

function adaptVerification(raw: RawHackathonView): VerificationData | null {
  if (!raw.verification) return null
  const passed = raw.verification.checks.filter((check) => check.passed).length
  const verified = raw.verification.status === 'VERIFIED'
  return {
    status: verified ? 'verified' : 'running',
    label: verified ? 'Fresh verification passed' : 'Fresh verification running',
    runId: raw.verification.verification_id,
    checksComplete: passed,
    checksTotal: raw.verification.checks.length,
    startedAt: raw.run.started_at,
    independent: raw.verification.independent,
    receivedImplementerNarrative: raw.verification.received_implementer_narrative,
  }
}

function adaptReceipt(raw: RawHackathonView): ReceiptData | null {
  if (!raw.receipt || !raw.change_event) return null
  const staleSurfacesFound = raw.findings.filter((finding) => finding.stale).length
  const repairsApplied = raw.repair?.applied_paths.length ?? 0
  const passed = raw.receipt.postconditions.filter((postcondition) => postcondition.passed).length
  return {
    headline: 'Reality changed. The fleet caught up.',
    changedFact: `Returns policy · ${raw.change_event.before} days → ${raw.change_event.after} days`,
    surfacesRevalidated: raw.receipt.postconditions.length,
    staleSurfacesFound,
    repairsApplied,
    verificationResult: `${passed} of ${raw.receipt.postconditions.length} postconditions passed`,
    skippedNodes: raw.watchzone_summary.skipped_nodes,
    receiptHash: raw.receipt.receipt_hash,
    before: `${raw.change_event.before}-day returns`,
    after: `${raw.change_event.after}-day returns`,
  }
}

function summaryFor(raw: RawHackathonView, index: number): string {
  const stale = raw.findings.filter((finding) => finding.stale).length
  const allowed = raw.authority?.allowed_paths.length ?? 0
  const applied = raw.repair?.applied_paths.length ?? 0
  const passed = raw.verification?.checks.filter((check) => check.passed).length ?? 0
  const totalChecks = raw.verification?.checks.length ?? 0
  return [
    'Returns policy · 30 days everywhere',
    'Returns policy · 30 → 14 days',
    `${raw.watchzone_summary.affected_nodes} affected · ${raw.watchzone_summary.skipped_nodes} safely skipped`,
    `${raw.watchzone_summary.dispatched_agents} relevant specialists dispatched`,
    `${stale} stale surfaces found`,
    `${allowed} paths constrained by authority`,
    `${applied} synthetic fixture paths repaired`,
    `Fresh verification · ${passed}/${totalChecks} checks passed`,
    'Reality changed · fleet caught up',
  ][index]
}

export function adaptRouteAView(raw: RawHackathonView, index: number): HackathonView {
  const event = raw.change_event
  const trigger = raw.crumbs.find((crumb) => crumb.kind === 'TRIGGER')
  const storefrontDays = raw.repair?.after['storefront.product_return_badge'] ?? 30
  const detectedAt = event ? new Date(raw.run.started_at).toISOString().slice(11, 19) : null
  return {
    schemaVersion: 'hackathon-view-v1.presentation',
    sourcePhase: raw.run.phase,
    snapshot: snapshotKeys[index],
    index,
    screenLabel: screenLabels[index],
    runStatus: runStatuses[index],
    summary: summaryFor(raw, index),
    detectedAt,
    policy: {
      name: 'RETURNS POLICY',
      source: 'Policy Service',
      previousDays: 30,
      authoritativeDays: event?.after === 14 ? 14 : 30,
      storefrontDays: storefrontDays === 14 ? 14 : 30,
    },
    mission: missionFor(index),
    graph: {
      label: 'Demo graph',
      nodes: adaptNodes(raw),
      edges: raw.edges.map((edge) => [edge.source, edge.target] as [string, string]),
      metrics: index >= 2 ? {
        totalNodes: raw.watchzone_summary.total_nodes,
        affected: raw.watchzone_summary.affected_nodes,
        skipped: raw.watchzone_summary.skipped_nodes,
        agentsDispatched: raw.watchzone_summary.dispatched_agents,
      } : null,
    },
    agents: adaptAgents(raw),
    evidence: evidenceFor(raw),
    triggerCrumb: trigger ? { id: trigger.crumb_id, label: trigger.statement, timestamp: null } : null,
    authority: adaptAuthority(raw),
    verification: adaptVerification(raw),
    receipt: adaptReceipt(raw),
    cloudProof: {
      cloudRun: raw.cloud_proof.cloud_run,
      firestore: raw.cloud_proof.firestore,
      evidenceRefs: raw.cloud_proof.evidence_refs,
    },
  }
}
