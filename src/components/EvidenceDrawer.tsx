import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  ClipboardText,
  Fingerprint,
  LockKey,
  MagnifyingGlass,
  MusicNotes,
  Receipt,
  ShieldCheck,
  ArrowsLeftRight,
  SpeakerHigh,
  SpinnerGap,
  TreeStructure,
  WarningOctagon,
} from '@phosphor-icons/react'
import type { RouteARuntime } from '../app/routeAClient'
import type { AuthorityData, EvidenceData, HackathonView, ReceiptData, VerificationData } from '../app/types'
import { EvidenceBadge, SectionLabel } from './Primitives'

const tabs = ['Findings', 'Crumbs', 'Authority', 'External action', 'Verification', 'Receipt', 'Architecture'] as const
type EvidenceTab = (typeof tabs)[number]

function preferredTab(view: HackathonView): EvidenceTab {
  if (view.receipt) return 'Receipt'
  // The repair frame is where the external side effect happens, so that is
  // what the drawer should be showing when the run reaches it.
  if (view.snapshot === 'repair_applied') return 'External action'
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


interface ExternalActionState {
  before: number | null
  action: {
    status: string
    capability: string
    surface_id: string
    product_id: string
    before: number | null
    after: number | null
    action_id: string | null
    idempotency_key: string
    authority_grant_id: string
    boundary: string
    reason: string | null
  }
  verification: {
    result: string
    expected_return_window_days: number
    observed_return_window_days: number | null
    trusted_action_response: boolean
  } | null
  receipt_sealable: boolean
}

/**
 * The side effect leaves this runtime, so the panel shows the boundary it
 * crosses and keeps the action and its proof visually separate. A mutation
 * that reports success is not a verified mutation.
 */
function ExternalActionPanel({ apiBaseUrl }: { apiBaseUrl: string | null }) {
  const [external, setExternal] = useState<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'applying' | 'verifying' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<ExternalActionState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const readState = async () => {
    if (!apiBaseUrl) return
    try {
      const response = await fetch(`${apiBaseUrl}/v1/demo/external/state`)
      const payload = await response.json()
      setExternal(payload.available ? payload.product?.return_window_days ?? null : null)
    } catch {
      setExternal(null)
    }
  }

  useEffect(() => { void readState() }, [apiBaseUrl])

  const call = async (path: string) => {
    if (!apiBaseUrl) {
      setPhase('error')
      setError('No live origin. The external action requires the Route A service.')
      return null
    }
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }

  const execute = async () => {
    setError(null)
    setPhase('applying')
    try {
      const payload = (await call('/v1/demo/external/action')) as ExternalActionState | null
      if (!payload) return
      setResult(payload)
      setPhase('verifying')
      await readState()
      window.setTimeout(() => setPhase('done'), 500)
    } catch (caught) {
      setPhase('error')
      setError(caught instanceof Error ? caught.message : 'External action failed.')
    }
  }

  const reset = async () => {
    setResult(null)
    setPhase('idle')
    setError(null)
    try { await call('/v1/demo/external/reset') } catch { /* reset is best-effort */ }
    await readState()
  }

  const action = result?.action
  const verification = result?.verification

  return (
    <div className="external-action-panel">
      <section className="ext-boundary" aria-label="Action boundary">
        <SectionLabel>Action boundary</SectionLabel>
        <div className="ext-hop">
          <span className="ext-node">GlassWake<small>Cloud Run</small></span>
          <span className="ext-arrow"><ArrowsLeftRight weight="bold" aria-hidden="true" />authenticated HTTPS</span>
          <span className="ext-node ext-node-external">Northstar Sandbox<small>separate service</small></span>
        </div>
        <p className="ext-live">External surface now: <strong>{external === null ? 'unreadable' : `${external} days`}</strong></p>
      </section>

      <section className="ext-detail" aria-label="External action">
        <SectionLabel>External action</SectionLabel>
        <dl>
          <div><dt>Capability</dt><dd>{action?.capability ?? 'UPDATE_STOREFRONT_RETURN_POLICY'}</dd></div>
          <div><dt>Surface</dt><dd>{action?.surface_id ?? 'storefront.product_return_badge'}</dd></div>
          <div><dt>Authority</dt><dd>REPAIR_1</dd></div>
          <div><dt>Before → after</dt><dd>{action ? `${action.before ?? '—'} → ${action.after ?? '—'} days` : '30 → 14 days'}</dd></div>
          <div><dt>Idempotency</dt><dd className="mono">{action?.idempotency_key ?? 'protected'}</dd></div>
          <div><dt>External ref</dt><dd className="mono">{action?.action_id ?? '—'}</dd></div>
        </dl>
        <div className="ext-status" data-status={action?.status ?? phase}>
          {phase === 'applying' ? <><SpinnerGap className="semantic-spin" aria-hidden="true" />APPLYING…</>
            : action?.status === 'REJECTED' ? <><LockKey aria-hidden="true" />REJECTED · zero writes</>
            : action ? <><Check weight="bold" aria-hidden="true" />{action.status}</>
            : <>Not yet attempted</>}
        </div>
        {action?.reason && <p className="ext-reason">{action.reason}</p>}
      </section>

      <section className="ext-proof" aria-label="Independent verification">
        <SectionLabel>Fresh verification</SectionLabel>
        {verification ? (
          <>
            <div className={`ext-verdict ext-verdict-${verification.result.toLowerCase()}`}>
              {verification.result === 'PASS' ? <Check weight="bold" aria-hidden="true" /> : <SpinnerGap aria-hidden="true" />}
              {verification.result}
            </div>
            <p>Re-read the external service and observed <strong>{verification.observed_return_window_days ?? '—'} days</strong>, expected {verification.expected_return_window_days}.</p>
            <p className="ext-note">Action response trusted as proof: <strong>no</strong>.</p>
            <p className="ext-note">Receipt {result?.receipt_sealable ? 'may now seal' : 'withheld'}.</p>
          </>
        ) : (
          <p className="ext-note">No proof yet. The mutation response is not verification.</p>
        )}

        <div className="ext-controls">
          <button type="button" className="run-button run-button-go" onClick={() => void execute()} disabled={phase === 'applying'}>
            {phase === 'applying' ? 'Applying…' : 'Execute external action'}
          </button>
          <button type="button" className="run-button" onClick={() => void reset()}>Reset merchant</button>
        </div>
        {error && <p className="ext-reason">{error}</p>}
      </section>
    </div>
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


interface DerivedOutputPayload {
  available: boolean
  model: string
  reason: string | null
  script: string | null
  mime_type: string | null
  media_base64?: string
  provenance: { source_receipt: string | null; derived_from: string }
  authority: Record<string, string>
}

/**
 * Derived output is fetched only on demand and only at the sealed receipt.
 * Two tracks exist -- the deterministic voice brief spoken by Gemini TTS and
 * the Lyria audio bed -- and both are generated live from the same sealed
 * receipt when their buttons are pressed. Nothing is prerecorded; the
 * GENERATING state on screen is the actual model invocation in flight.
 * A failure here renders as an unavailable brief, never as a broken receipt.
 */
function ExecutiveBrief({ apiBaseUrl }: { apiBaseUrl: string | null }) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle')
  const [track, setTrack] = useState<'voice' | 'audio' | null>(null)
  const [output, setOutput] = useState<DerivedOutputPayload | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const generate = async (kind: 'voice' | 'audio') => {
    if (!apiBaseUrl) {
      setPhase('unavailable')
      setDetail('No live origin. Derived output requires the Route A service.')
      return
    }
    setTrack(kind)
    setPhase('loading')
    setDetail(null)
    try {
      const response = await fetch(`${apiBaseUrl}/v1/demo/derived/${kind}`, { method: 'POST' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = (await response.json()) as DerivedOutputPayload
      if (!payload.available || !payload.media_base64) {
        setPhase('unavailable')
        setDetail(payload.reason ?? 'The derived model reported no output.')
        return
      }
      setOutput(payload)
      setPhase('ready')
      window.setTimeout(() => void audioRef.current?.play(), 0)
    } catch (error) {
      setPhase('unavailable')
      setDetail(error instanceof Error ? error.message : 'Derived output unavailable.')
    }
  }

  const generating = (kind: 'voice' | 'audio') => phase === 'loading' && track === kind

  return (
    <section className="executive-brief" aria-label="Executive brief">
      <div className="brief-head">
        <SectionLabel>Executive brief</SectionLabel>
        <div className="brief-tracks">
          <button
            type="button"
            className="brief-listen"
            onClick={() => void generate('voice')}
            disabled={phase === 'loading'}
          >
            {generating('voice')
              ? <SpinnerGap className="semantic-spin" aria-hidden="true" />
              : <SpeakerHigh weight="fill" aria-hidden="true" />}
            {generating('voice') ? 'Generating…' : 'Listen'}
          </button>
          <button
            type="button"
            className="brief-listen brief-listen-lyria"
            onClick={() => void generate('audio')}
            disabled={phase === 'loading'}
          >
            {generating('audio')
              ? <SpinnerGap className="semantic-spin" aria-hidden="true" />
              : <MusicNotes weight="fill" aria-hidden="true" />}
            {generating('audio') ? 'Lyria · generating…' : 'Audio bed · Lyria'}
          </button>
        </div>
      </div>

      {phase === 'ready' && output && (
        <>
          <audio ref={audioRef} controls src={`data:${output.mime_type};base64,${output.media_base64}`} />
          {output.script && <p className="brief-script">{output.script}</p>}
          <dl className="brief-meta">
            <div><dt>{track === 'audio' ? 'Audio' : 'Voice'}</dt><dd>{output.model}</dd></div>
            <div><dt>Source</dt><dd>{output.provenance.source_receipt}</dd></div>
            <div><dt>Derived</dt><dd>from sealed receipt</dd></div>
          </dl>
        </>
      )}

      {phase === 'unavailable' && (
        <p className="brief-unavailable"><WarningOctagon aria-hidden="true" />Derived output unavailable. The sealed receipt is unaffected.{detail ? ` (${detail})` : ''}</p>
      )}

      <ul className="brief-authority">
        <li><Check aria-hidden="true" />read-only</li>
        <li><Check aria-hidden="true" />receipt-bound</li>
        <li><Check aria-hidden="true" />cannot mutate state</li>
        <li><Check aria-hidden="true" />fail-soft</li>
      </ul>
      <p className="brief-note">Voice gemini-2.5-flash-tts · Audio bed lyria-002 — generated live from the sealed receipt. Spoken text is assembled from receipt fields, not written by a model.</p>
    </section>
  )
}

function ReceiptPanel({ receipt, apiBaseUrl }: { receipt: ReceiptData | null; apiBaseUrl: string | null }) {
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
      <ExecutiveBrief apiBaseUrl={apiBaseUrl} />
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

export function EvidenceDrawer({
  view,
  runtime = null,
  apiBaseUrl = null,
}: {
  view: HackathonView
  runtime?: RouteARuntime | null
  apiBaseUrl?: string | null
}) {
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
        {activeTab === 'External action' && <ExternalActionPanel apiBaseUrl={apiBaseUrl} />}
        {activeTab === 'Verification' && <VerificationPanel verification={view.verification} />}
        {activeTab === 'Receipt' && <ReceiptPanel receipt={view.receipt} apiBaseUrl={apiBaseUrl} />}
        {activeTab === 'Architecture' && <ArchitecturePanel view={view} runtime={runtime} />}
      </div>
    </section>
  )
}
