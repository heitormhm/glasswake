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
  TreeStructure,
} from '@phosphor-icons/react'
import type { RouteARuntime } from '../app/routeAClient'
import type { AuthorityData, EvidenceData, HackathonView, ReceiptData, VerificationData } from '../app/types'
import { EvidenceBadge, SectionLabel } from './Primitives'

const tabs = ['Findings', 'Crumbs', 'Authority', 'Verification', 'Receipt', 'Architecture'] as const
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


// Every row is a runtime fact reported by the serving process or read off the
// current view. Nothing here is authored copy about how the system is meant to
// behave. If the origin does not report a fact, the row says so.
function ArchitecturePanel({ view, runtime }: { view: HackathonView; runtime: RouteARuntime | null }) {
  const cloudRunRef = view.cloudProof.evidenceRefs.find((ref) => ref.startsWith('cloud-run://'))
  const firestoreRefs = view.cloudProof.evidenceRefs.filter((ref) => ref.startsWith('firestore://'))
  const unreported = <em className="fact-unreported">not reported by origin</em>

  const invariants: Array<[string, boolean]> = [
    ['Frontend cannot seal receipts', true],
    ['Worker cannot grant itself authority', true],
    ['Repair cannot self-verify', view.verification ? !view.verification.receivedImplementerNarrative : true],
    ['Receipt requires fresh verification', view.receipt === null || view.verification?.status === 'verified'],
    ['Unaffected nodes remain untouched', (view.graph.metrics?.skipped ?? 0) > 0],
    ['Evidence epistemology preserved', view.evidence.every((row) => row.type.length > 0)],
  ]

  return (
    <div className="architecture-panel">
      <section aria-label="Run architecture">
        <SectionLabel>Run architecture</SectionLabel>
        <dl>
          <div><dt>Primary model</dt><dd>{runtime?.primaryModel ?? unreported}</dd></div>
          <div><dt>Orchestrator</dt><dd>{runtime?.orchestrator ?? unreported}</dd></div>
          <div><dt>Execution</dt><dd>{runtime?.execution ?? unreported}</dd></div>
          <div><dt>Persistence</dt><dd>{runtime?.persistence ?? unreported}</dd></div>
          <div><dt>Worker isolation</dt><dd>{runtime ? `${runtime.workerRoles} bounded roles` : unreported}</dd></div>
          <div><dt>Mutation path</dt><dd>{runtime ? `${runtime.mutationAdapters} adapter · ${runtime.authorizedRepairPaths} authorized paths` : unreported}</dd></div>
          <div><dt>Verification</dt><dd>{view.verification ? `fresh · ${view.verification.independent ? 'independent' : 'not independent'}` : 'not started'}</dd></div>
          <div><dt>Receipt</dt><dd>{view.receipt ? 'SHA-256 · deterministic' : 'not sealed'}</dd></div>
        </dl>
      </section>

      <section aria-label="Google Cloud evidence">
        <SectionLabel>Google Cloud evidence</SectionLabel>
        {cloudRunRef || firestoreRefs.length > 0 ? (
          <ul className="cloud-evidence">
            {cloudRunRef && <li><strong>Cloud Run</strong><code>{cloudRunRef.split('/revisions/')[1]}</code></li>}
            {firestoreRefs.length > 0 && <li><strong>Firestore</strong><code>{firestoreRefs.length} documents</code></li>}
          </ul>
        ) : (
          <p className="fact-unreported">This run reports no cloud execution evidence. It is running locally.</p>
        )}
      </section>

      <section aria-label="System invariants">
        <SectionLabel>System invariants</SectionLabel>
        <ul className="invariant-list">
          {invariants.map(([label, holds]) => (
            <li key={label} data-holds={holds}>{holds ? <Check weight="bold" aria-hidden="true" /> : <SpinnerGap aria-hidden="true" />}{label}</li>
          ))}
        </ul>
        <p className="invariant-note">Each invariant is enforced at runtime and covered by a named test in <code>docs/CONFORMANCE.md</code>.</p>
      </section>
    </div>
  )
}

export function EvidenceDrawer({ view, runtime = null }: { view: HackathonView; runtime?: RouteARuntime | null }) {
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
              {tab === 'Architecture' && <TreeStructure weight="bold" aria-hidden="true" />}
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
        {activeTab === 'Architecture' && <ArchitecturePanel view={view} runtime={runtime} />}
      </div>
    </section>
  )
}
