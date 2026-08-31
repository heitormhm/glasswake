export const snapshotKeys = [
  'baseline',
  'change_detected',
  'impact_scoped',
  'agents_running',
  'stale_found',
  'authority_ready',
  'repair_applied',
  'verifying',
  'receipt_complete',
] as const

export type SnapshotKey = (typeof snapshotKeys)[number]
export type NodeState =
  | 'unaffected'
  | 'affected'
  | 'stale'
  | 'repairing'
  | 'verifying'
  | 'verified'
  | 'blocked'

export type AgentStatus =
  | 'IDLE'
  | 'DISPATCHED'
  | 'RUNNING'
  | 'FOUND'
  | 'WAITING_REVIEW'
  | 'VERIFIED'
  | 'SAFE_PARK'
  | 'BLOCKED'

export type MissionStatus = 'completed' | 'active' | 'queued' | 'blocked'
export type EvidenceType = 'OBSERVED' | 'DECLARED' | 'INFERRED' | 'APPROVED' | 'VERIFIED'

export interface MissionStage {
  label: 'Detect' | 'Scope' | 'Dispatch' | 'Review' | 'Repair' | 'Verify' | 'Receipt'
  status: MissionStatus
}

/**
 * What the run did to this node, kept after the run closes so the final frame
 * still tells the story instead of turning uniformly green.
 */
export type NodeOutcome = 'repaired' | 'verified' | 'skipped'

export interface ImpactNodeData {
  id: string
  label: string
  kind: 'policy' | 'database' | 'catalog' | 'surface' | 'system' | 'proof'
  state: NodeState
  outcome: NodeOutcome | null
  x: number
  y: number
}

export interface AgentData {
  id: string
  name: string
  status: AgentStatus
  task: string
  evidenceCount: number
  modality: 'EVENT' | 'POLICY' | 'DATA' | 'BROWSER' | 'FRESH RUN'
  authority: string
}

export interface EvidenceData {
  id: string
  type: EvidenceType
  statement: string
  source: string
  timestamp: string | null
  confidence?: number
}

export interface AuthorityData {
  proposedRepair: string
  surfaces: Array<{ label: string; id: string }>
  evidenceRefs: string[]
  authorityCeiling: string
  proposedAction: string
  policyResult: 'OK' | 'REPAIR_1' | 'REPAIR_2' | 'ASK_USER' | 'BLOCK'
  rollbackAvailable: boolean
  provenance: string
  independenceReminder: string
}

export interface VerificationData {
  status: 'not_started' | 'running' | 'verified'
  label: string
  runId: string
  checksComplete: number
  checksTotal: number
  startedAt?: string
  independent: boolean
  receivedImplementerNarrative: boolean
}

export interface ReceiptData {
  headline: string
  changedFact: string
  surfacesRevalidated: number
  staleSurfacesFound: number
  repairsApplied: number
  verificationResult: string
  skippedNodes: number
  receiptHash: string
  before: string
  after: string
}

export interface HackathonView {
  schemaVersion: 'hackathon-view-v1.presentation'
  sourcePhase: string
  snapshot: SnapshotKey
  index: number
  screenLabel: string
  runStatus: string
  summary: string
  detectedAt: string | null
  policy: {
    name: string
    source: string
    previousDays: 30
    authoritativeDays: 30 | 14
    storefrontDays: 30 | 14
  }
  mission: MissionStage[]
  graph: {
    label: 'Demo graph'
    nodes: ImpactNodeData[]
    edges: Array<[string, string]>
    metrics: null | {
      totalNodes: number
      affected: number
      skipped: number
      agentsDispatched: number
    }
  }
  agents: AgentData[]
  evidence: EvidenceData[]
  triggerCrumb: null | {
    id: string
    label: string
    timestamp: string | null
  }
  authority: AuthorityData | null
  verification: VerificationData | null
  receipt: ReceiptData | null
  cloudProof: {
    cloudRun: boolean
    firestore: boolean
    evidenceRefs: string[]
  }
}
