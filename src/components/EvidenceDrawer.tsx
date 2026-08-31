import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Check,
  ClipboardText,
  Fingerprint,
  LockKey,
  MagnifyingGlass,
  Receipt,
  ShieldCheck,
  SpinnerGap,
} from '@phosphor-icons/react'
import type { AuthorityData, EvidenceData, HackathonView, ReceiptData, VerificationData } from '../app/types'
import { EvidenceBadge, SectionLabel } from './Primitives'

const tabs = ['Findings', 'Crumbs', 'Authority', 'Verification', 'Receipt'] as const
type EvidenceTab = (typeof tabs)[number]

function preferredTab(view: HackathonView): EvidenceTab {
  if (view.receipt) return 'Receipt'
  if (view.verification) return 'Verification'
  if (view.authority) return 'Authority'
  if (view.triggerCrumb && view.index <= 2) return 'Crumbs'
  return 'Findings'
}

function EvidenceRows({ rows }: { rows: EvidenceData[] }) {
  if (!rows.length) {
    return (
      <div className="drawer-empty">
        <MagnifyingGlass aria-hidden="true" />
        <div><strong>No findings yet</strong><span>Evidence appears only after a specialist observes it.</span></div>
      </div>
    )
  }

  return (
    <ol className="evidence-list" aria-label="Structured evidence">
      {rows.map((row) => (
        <li key={row.id} className="evidence-row">
          <EvidenceBadge type={row.type} />
          <div className="evidence-copy">
            <strong>{row.statement}</strong>
            <span>{row.source}</span>
          </div>
          <time>{row.timestamp ?? 'Not supplied'}</time>
          <button type="button" className="icon-button" aria-label={`Copy evidence identifier ${row.id}`} title={row.id}>
            <ClipboardText aria-hidden="true" />
          </button>
        </li>
      ))}
    </ol>
  )
}

function CrumbsPanel({ view }: { view: HackathonView }) {
  if (!view.triggerCrumb) {
    return <div className="drawer-empty"><Fingerprint aria-hidden="true" /><div><strong>No trigger crumb</strong><span>The baseline has not observed a source change.</span></div></div>
  }
  return (
    <div className="crumb-detail">
      <div className="crumb-rail"><span /><span /><span /></div>
      <div><SectionLabel>Trigger crumb</SectionLabel><h3>{view.triggerCrumb.label}</h3></div>
      <dl>
        <div><dt>Source</dt><dd>Policy Service</dd></div>
        <div><dt>Identifier</dt><dd>{view.triggerCrumb.id}</dd></div>
        <div><dt>Observed</dt><dd>{view.triggerCrumb.timestamp ?? 'Run context'}</dd></div>
      </dl>
    </div>
  )
}

function AuthorityPanel({ authority }: { authority: AuthorityData | null }) {
  if (!authority) {
    return <div className="drawer-empty"><LockKey aria-hidden="true" /><div><strong>No repair proposed</strong><span>Authority is evaluated only after stale surfaces are proven.</span></div></div>
  }
  return (
    <article className="authority-gate" aria-label="Authority decision">
      <div className="authority-summary">
        <div className="authority-icon"><ShieldCheck weight="duotone" aria-hidden="true" /></div>
        <div><SectionLabel>Backend policy decision</SectionLabel><h3>{authority.proposedRepair}</h3><p>{authority.provenance}</p></div>
        <span className="decision-code"><Check weight="bold" aria-hidden="true" />{authority.policyResult}</span>
      </div>
      <div className="authority-scope">
        <div><span>Authority ceiling</span><strong>{authority.authorityCeiling}</strong></div>
        <div><span>Proposed action</span><strong className="mono">{authority.proposedAction}</strong></div>
        <div><span>Rollback</span><strong>{authority.rollbackAvailable ? 'Available' : 'Unavailable'}</strong></div>
      </div>
      <div className="surface-scope" aria-label="Surfaces in repair scope">
        {authority.surfaces.map((surface) => (
          <div key={surface.id}><Check aria-hidden="true" /><span><strong>{surface.label}</strong><small>{surface.id}</small></span></div>
        ))}
      </div>
      <p className="independence-note"><Fingerprint aria-hidden="true" />{authority.independenceReminder}</p>
    </article>
  )
}

function VerificationPanel({ verification }: { verification: VerificationData | null }) {
  if (!verification) {
    return <div className="drawer-empty"><Fingerprint aria-hidden="true" /><div><strong>Fresh pass not started</strong><span>The verifier remains isolated from repair evidence.</span></div></div>
  }
  const complete = verification.status === 'verified'
  return (
    <article className={`verification-panel${complete ? ' verification-complete' : ''}`}>
      <div className="verification-mark">
        {complete ? <Check weight="bold" aria-hidden="true" /> : <SpinnerGap className="semantic-spin" aria-hidden="true" />}
      </div>
      <div className="verification-main">
        <SectionLabel>Independent verifier · fresh run</SectionLabel>
        <h3>{verification.label}</h3>
        <p>Run {verification.runId} · independent {verification.independent ? 'confirmed' : 'not confirmed'} · implementer narrative {verification.receivedImplementerNarrative ? 'received' : 'not received'}.</p>
      </div>
      <div className="verification-progress">
        <span>{verification.checksComplete} / {verification.checksTotal} checks</span>
        <div><i style={{ width: `${(verification.checksComplete / verification.checksTotal) * 100}%` }} /></div>
      </div>
    </article>
  )
}

function ReceiptPanel({ receipt }: { receipt: ReceiptData | null }) {
  if (!receipt) {
    return <div className="drawer-empty"><Receipt aria-hidden="true" /><div><strong>No receipt yet</strong><span>Closure appears only after fresh verification passes.</span></div></div>
  }
  return (
    <article className="receipt-panel" data-testid="receipt-panel">
      <div className="receipt-seal"><ShieldCheck weight="duotone" aria-hidden="true" /></div>
      <div className="receipt-copy"><SectionLabel>Run closed · independently verified</SectionLabel><h3>{receipt.headline}</h3><p>{receipt.changedFact}</p></div>
      <div className="before-after" aria-label="Before and after policy">
        <span>{receipt.before}</span><ArrowRight aria-hidden="true" /><strong>{receipt.after}</strong>
      </div>
      <dl className="receipt-metrics">
        <div><dt>Revalidated</dt><dd>{receipt.surfacesRevalidated}</dd></div>
        <div><dt>Stale found</dt><dd>{receipt.staleSurfacesFound}</dd></div>
        <div><dt>Repairs</dt><dd>{receipt.repairsApplied}</dd></div>
        <div><dt>Skipped</dt><dd>{receipt.skippedNodes}</dd></div>
      </dl>
      <div className="receipt-hash"><Fingerprint aria-hidden="true" /><span>{receipt.verificationResult}</span><code>{receipt.receiptHash.slice(0, 17)}…{receipt.receiptHash.slice(-4)}</code></div>
    </article>
  )
}

export function EvidenceDrawer({ view }: { view: HackathonView }) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>(() => preferredTab(view))
  useEffect(() => setActiveTab(preferredTab(view)), [view.index])

  return (
    <section className={`evidence-drawer drawer-state-${view.snapshot}`} aria-labelledby="evidence-heading">
      <div className="drawer-tabs-row">
        <div className="drawer-title"><SectionLabel>Evidence ledger</SectionLabel><h2 id="evidence-heading">Proof, not narration</h2></div>
        <div className="drawer-tabs" role="tablist" aria-label="Evidence views">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'Findings' && view.evidence.length > 0 && <span>{view.evidence.length}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="drawer-content" role="tabpanel" aria-label={`${activeTab} panel`}>
        {activeTab === 'Findings' && <EvidenceRows rows={view.evidence} />}
        {activeTab === 'Crumbs' && <CrumbsPanel view={view} />}
        {activeTab === 'Authority' && <AuthorityPanel authority={view.authority} />}
        {activeTab === 'Verification' && <VerificationPanel verification={view.verification} />}
        {activeTab === 'Receipt' && <ReceiptPanel receipt={view.receipt} />}
      </div>
    </section>
  )
}
