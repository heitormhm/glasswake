import type {
  AgentData,
  AgentStatus,
  EvidenceData,
  HackathonView,
  ImpactNodeData,
  MissionStage,
  NodeState,
  SnapshotKey,
} from './types'
import { snapshotKeys } from './types'

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
  'VERIFYING',
  'RECEIPT SEALED',
] as const

const summaries = [
  'Returns policy · 30 days everywhere',
  'Returns policy · 30 → 14 days',
  '5 affected · 7 safely skipped',
  '3 relevant specialists dispatched',
  '2 stale storefront surfaces found',
  'Repair constrained to fixture surfaces',
  '2 fixture surfaces repaired · proof pending',
  'Fresh verification · independent pass',
  'Reality changed · fleet caught up',
] as const

const graphPositions: Array<Omit<ImpactNodeData, 'state'>> = [
  { id: 'policy', label: 'Authoritative policy', kind: 'policy', x: 70, y: 176 },
  { id: 'policy-db', label: 'Policy database', kind: 'database', x: 255, y: 76 },
  { id: 'catalog', label: 'Product catalog', kind: 'catalog', x: 438, y: 76 },
  { id: 'bag-page', label: 'Navy bag page', kind: 'surface', x: 625, y: 35 },
  { id: 'checkout-help', label: 'Checkout help', kind: 'surface', x: 625, y: 145 },
  { id: 'support-kb', label: 'Support knowledge', kind: 'surface', x: 438, y: 232 },
  { id: 'inventory', label: 'Product inventory', kind: 'database', x: 255, y: 298 },
  { id: 'shipping', label: 'Shipping rule', kind: 'policy', x: 438, y: 342 },
  { id: 'marketing', label: 'Marketing page', kind: 'surface', x: 625, y: 310 },
  { id: 'receipt-store', label: 'Receipt store', kind: 'proof', x: 812, y: 56 },
  { id: 'verifier', label: 'Verifier', kind: 'proof', x: 812, y: 185 },
  { id: 'mission', label: 'Compliance mission', kind: 'system', x: 812, y: 318 },
]

const graphEdges: Array<[string, string]> = [
  ['policy', 'policy-db'],
  ['policy', 'support-kb'],
  ['policy-db', 'catalog'],
  ['catalog', 'bag-page'],
  ['catalog', 'checkout-help'],
  ['catalog', 'inventory'],
  ['policy', 'shipping'],
  ['catalog', 'marketing'],
  ['bag-page', 'verifier'],
  ['checkout-help', 'verifier'],
  ['verifier', 'receipt-store'],
  ['receipt-store', 'mission'],
]

const missionActiveBySnapshot = [0, 1, 2, 3, 3, 4, 5, 5, 7]
const missionLabels: MissionStage['label'][] = [
  'Detect',
  'Scope',
  'Dispatch',
  'Review',
  'Repair',
  'Verify',
  'Receipt',
]

function missionFor(index: number): MissionStage[] {
  if (index === 8) return missionLabels.map((label) => ({ label, status: 'completed' }))
  const active = missionActiveBySnapshot[index]
  return missionLabels.map((label, position) => ({
    label,
    status: position < active ? 'completed' : position === active ? 'active' : 'queued',
  }))
}

function nodeStateFor(id: string, index: number): NodeState {
  const scoped = new Set(['policy', 'policy-db', 'catalog', 'bag-page', 'checkout-help'])
  if (index === 0) return id === 'policy' || id === 'policy-db' ? 'verified' : 'unaffected'
  if (index === 1) return id === 'policy' ? 'affected' : 'unaffected'
  if (index === 2 || index === 3) return scoped.has(id) ? 'affected' : 'unaffected'
  if (index === 4 || index === 5) {
    if (id === 'bag-page' || id === 'checkout-help') return 'stale'
    if (id === 'policy' || id === 'policy-db') return 'verified'
    if (id === 'catalog') return 'affected'
    return 'unaffected'
  }
  if (index === 6) return scoped.has(id) ? 'verified' : 'unaffected'
  if (index === 7) return scoped.has(id) || id === 'verifier' ? 'verifying' : 'unaffected'
  if (index === 8) {
    if (scoped.has(id) || id === 'verifier' || id === 'receipt-store' || id === 'mission') return 'verified'
    return 'unaffected'
  }
  return 'unaffected'
}

type AgentSeed = Omit<AgentData, 'status' | 'task' | 'evidenceCount'>

const agentSeeds: AgentSeed[] = [
  { id: 'sentinel', name: 'Change Sentinel', modality: 'EVENT', authority: 'Observe only' },
  { id: 'policy-auditor', name: 'Policy Auditor', modality: 'POLICY', authority: 'Read policy' },
  { id: 'data-auditor', name: 'Data Auditor', modality: 'DATA', authority: 'Read records' },
  { id: 'storefront-auditor', name: 'Storefront Auditor', modality: 'BROWSER', authority: 'Inspect surfaces' },
  { id: 'verifier-agent', name: 'Independent Verifier', modality: 'FRESH RUN', authority: 'Verify only' },
]

function agentState(id: string, index: number): Pick<AgentData, 'status' | 'task' | 'evidenceCount'> {
  const idle = { status: 'IDLE' as AgentStatus, task: 'Awaiting relevant change', evidenceCount: 0 }
  if (id === 'sentinel') {
    if (index === 0) return idle
    if (index === 1) return { status: 'RUNNING', task: 'Comparing policy source', evidenceCount: 1 }
    if (index <= 4) return { status: 'FOUND', task: 'Change crumb recorded', evidenceCount: 2 }
    return { status: 'SAFE_PARK', task: 'Observation complete', evidenceCount: 2 }
  }
  if (id === 'policy-auditor') {
    if (index < 2) return idle
    if (index === 2) return { status: 'DISPATCHED', task: 'Policy source queued', evidenceCount: 0 }
    if (index === 3) return { status: 'RUNNING', task: 'Checking source policy', evidenceCount: 1 }
    if (index <= 7) return { status: 'VERIFIED', task: 'Source is current', evidenceCount: 2 }
    return { status: 'SAFE_PARK', task: 'Postcondition retained', evidenceCount: 2 }
  }
  if (id === 'data-auditor') {
    if (index < 2) return idle
    if (index === 2) return { status: 'DISPATCHED', task: 'Policy DB queued', evidenceCount: 0 }
    if (index === 3) return { status: 'RUNNING', task: 'Reading policy record', evidenceCount: 1 }
    if (index <= 7) return { status: 'VERIFIED', task: 'Record stores 14 days', evidenceCount: 2 }
    return { status: 'SAFE_PARK', task: 'Postcondition retained', evidenceCount: 2 }
  }
  if (id === 'storefront-auditor') {
    if (index < 2) return idle
    if (index === 2) return { status: 'DISPATCHED', task: '2 surfaces queued', evidenceCount: 0 }
    if (index === 3) return { status: 'RUNNING', task: 'Inspecting storefront', evidenceCount: 1 }
    if (index === 4) return { status: 'FOUND', task: '2 stale surfaces found', evidenceCount: 3 }
    if (index === 5) return { status: 'WAITING_REVIEW', task: 'Repair scope prepared', evidenceCount: 4 }
    if (index <= 7) return { status: 'VERIFIED', task: 'Fixture repair applied', evidenceCount: 5 }
    return { status: 'SAFE_PARK', task: 'Repair evidence sealed', evidenceCount: 5 }
  }
  if (index < 7) return idle
  if (index === 7) return { status: 'RUNNING', task: 'Fresh verification pass', evidenceCount: 2 }
  return { status: 'VERIFIED', task: 'All postconditions pass', evidenceCount: 4 }
}

const baseEvidence: EvidenceData[] = [
  {
    id: 'EV-POL-014',
    type: 'DECLARED',
    statement: 'Authoritative returns policy is 14 days.',
    source: 'Policy Service / returns.standard',
    timestamp: '12:04:18.104',
  },
  {
    id: 'EV-DB-221',
    type: 'OBSERVED',
    statement: 'Policy record stores return_window_days = 14.',
    source: 'Policy DB / policy.returns.v4',
    timestamp: '12:04:21.772',
  },
  {
    id: 'EV-WEB-843',
    type: 'OBSERVED',
    statement: 'Navy Commuter Bag page still renders 30 days.',
    source: 'Storefront / NST-BAG-001',
    timestamp: '12:04:27.406',
  },
  {
    id: 'EV-WEB-847',
    type: 'OBSERVED',
    statement: 'Checkout help still renders 30 days.',
    source: 'Storefront / checkout-help',
    timestamp: '12:04:28.119',
  },
  {
    id: 'EV-AUTH-31',
    type: 'APPROVED',
    statement: 'Repair limited to two synthetic fixture surfaces.',
    source: 'Authority policy / GW-DEMO-04',
    timestamp: '12:04:31.004',
  },
  {
    id: 'EV-VER-91',
    type: 'VERIFIED',
    statement: 'Fresh pass observed 14 days on both repaired surfaces.',
    source: 'Independent Verifier / run VR-92A7',
    timestamp: '12:04:39.608',
  },
]

function evidenceFor(index: number): EvidenceData[] {
  if (index === 0) return []
  if (index <= 2) return baseEvidence.slice(0, 1)
  if (index === 3) return baseEvidence.slice(0, 2)
  if (index === 4) return baseEvidence.slice(0, 4)
  if (index <= 6) return baseEvidence.slice(0, 5)
  return baseEvidence
}

export function getSnapshot(index: number): HackathonView {
  const safeIndex = Math.max(0, Math.min(snapshotKeys.length - 1, Math.round(index)))
  const snapshot = snapshotKeys[safeIndex] as SnapshotKey
  const repaired = safeIndex >= 6

  return {
    schemaVersion: 'route-b.fixture.v2',
    snapshot,
    index: safeIndex,
    screenLabel: screenLabels[safeIndex],
    runStatus: runStatuses[safeIndex],
    summary: summaries[safeIndex],
    detectedAt: safeIndex >= 1 ? '12:04:18' : null,
    policy: {
      name: 'RETURNS POLICY',
      source: 'Policy Service',
      previousDays: 30,
      authoritativeDays: safeIndex >= 1 ? 14 : 30,
      storefrontDays: repaired ? 14 : 30,
    },
    mission: missionFor(safeIndex),
    graph: {
      label: 'Demo graph',
      nodes: graphPositions.map((node) => ({ ...node, state: nodeStateFor(node.id, safeIndex) })),
      edges: graphEdges,
      metrics:
        safeIndex >= 2
          ? { totalNodes: 12, affected: 5, skipped: 7, agentsDispatched: safeIndex >= 3 ? 3 : 0 }
          : null,
    },
    agents: agentSeeds.map((agent) => ({ ...agent, ...agentState(agent.id, safeIndex) })),
    evidence: evidenceFor(safeIndex),
    triggerCrumb:
      safeIndex >= 1
        ? { id: 'CR-7A91', label: 'Policy value changed · 30 → 14 days', timestamp: '12:04:18.104' }
        : null,
    authority:
      safeIndex >= 5
        ? {
            proposedRepair: 'Update two stale policy statements from 30 to 14 days.',
            surfaces: [
              { label: 'Navy Commuter Bag product page', id: 'surface://store/product/NST-BAG-001' },
              { label: 'Checkout help policy panel', id: 'surface://store/checkout-help' },
            ],
            evidenceRefs: ['EV-POL-014', 'EV-WEB-843', 'EV-WEB-847'],
            authorityCeiling: 'Synthetic fixture surfaces only',
            proposedAction: 'PATCH_FIXTURE_COPY',
            policyResult: 'REPAIR_1',
            rollbackAvailable: true,
            provenance: 'Pre-authorized demo policy · GW-DEMO-04',
            independenceReminder: 'Independent Verifier receives a fresh post-repair view.',
          }
        : null,
    verification:
      safeIndex >= 7
        ? {
            status: safeIndex === 7 ? 'running' : 'verified',
            label: safeIndex === 7 ? 'Fresh verification running' : 'Fresh verification passed',
            runId: 'VR-92A7',
            checksComplete: safeIndex === 7 ? 2 : 4,
            checksTotal: 4,
            startedAt: '12:04:36.221',
          }
        : null,
    receipt:
      safeIndex === 8
        ? {
            headline: 'Reality changed. The fleet caught up.',
            changedFact: 'Returns policy · 30 days → 14 days',
            surfacesRevalidated: 5,
            staleSurfacesFound: 2,
            repairsApplied: 2,
            verificationResult: '4 of 4 postconditions passed',
            skippedNodes: 7,
            receiptHash: 'sha256:8b17a4c02ec951a77bb49d0c',
            before: '30-day returns',
            after: '14-day returns',
          }
        : null,
    cloudProof: null,
  }
}

export const snapshots = snapshotKeys.map((_, index) => getSnapshot(index))
