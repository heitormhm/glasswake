import type { Icon, IconProps } from '@phosphor-icons/react'
import {
  Browser,
  CheckCircle,
  Database,
  FileText,
  Fingerprint,
  Package,
  SealCheck,
  ShieldCheck,
} from '@phosphor-icons/react'
import type { AgentStatus, EvidenceType, ImpactNodeData, NodeState } from '../app/types'

const nodeIcons: Record<ImpactNodeData['kind'], Icon> = {
  policy: FileText,
  database: Database,
  catalog: Package,
  surface: Browser,
  system: ShieldCheck,
  proof: Fingerprint,
}

export function NodeIcon({ kind, ...props }: { kind: ImpactNodeData['kind'] } & IconProps) {
  const Component = nodeIcons[kind]
  return <Component aria-hidden="true" weight="regular" {...props} />
}

const nodeStateLabels: Record<NodeState, string> = {
  unaffected: 'Unaffected',
  affected: 'Affected',
  stale: 'Stale',
  repairing: 'Repairing',
  verifying: 'Verifying',
  verified: 'Verified',
  blocked: 'Blocked',
}

export function NodeStateMark({ state }: { state: NodeState }) {
  return (
    <span className={`node-state-mark state-${state}`} aria-label={nodeStateLabels[state]}>
      {state === 'verified' ? <CheckCircle weight="fill" aria-hidden="true" /> : <span aria-hidden="true" />}
    </span>
  )
}

export function StatusPill({ status }: { status: AgentStatus }) {
  return (
    <span className={`status-pill status-${status.toLowerCase()}`}>
      <span className="status-shape" aria-hidden="true" />
      {status.replace('_', ' ')}
    </span>
  )
}

export function EvidenceBadge({ type }: { type: EvidenceType }) {
  return (
    <span className={`evidence-badge evidence-${type.toLowerCase()}`}>
      {type === 'VERIFIED' && <SealCheck weight="fill" aria-hidden="true" />}
      {type}
    </span>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>
}
