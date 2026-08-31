import {
  ArrowClockwise,
  ArrowRight,
  ArrowsInSimple,
  ArrowsOutSimple,
  Browser,
  CaretRight,
  Check,
  Circle,
  CloudCheck,
  CloudSlash,
  Fingerprint,
  Pause,
  Play,
  Pulse,
  ShieldChevron,
  SkipForward,
  WaveSine,
} from '@phosphor-icons/react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { goldenRunPhaseLabels, type GoldenRunMode, type GoldenRunState } from '../app/demoRun'
import { demoHref } from '../app/navigation'
import type { AgentData, HackathonView, MissionStage } from '../app/types'
import type { RouteARuntime } from '../app/routeAClient'
import type { RouteASourcePreference } from '../app/useRouteASequence'
import { EvidenceDrawer } from './EvidenceDrawer'
import { ImpactMap } from './ImpactMap'
import { SectionLabel, StatusPill } from './Primitives'

function cloudRunRevision(view: HackathonView): string | null {
  const ref = view.cloudProof.evidenceRefs.find((value) => value.startsWith('cloud-run://'))
  return ref?.split('/revisions/')[1] ?? null
}

function TopBar({
  view,
  sourcePreference,
  transportSource,
}: {
  view: HackathonView
  sourcePreference: RouteASourcePreference
  transportSource: 'api' | 'fixture'
}) {
  return (
    <header className="topbar">
      <div className="wordmark"><span className="brand-mark"><WaveSine weight="bold" aria-hidden="true" /></span><strong>GlassWake</strong></div>
      <span className="fixture-badge">SYNTHETIC ENTERPRISE FIXTURE</span>
      <div className="run-summary"><span>Golden Run</span><strong>{view.summary}</strong></div>
      <div className="topbar-actions">
        {view.cloudProof.cloudRun
          ? <span className="cloud-proof" title={view.cloudProof.evidenceRefs.filter((ref) => ref.startsWith('cloud-run://')).join(' ')}><CloudCheck weight="bold" aria-hidden="true" />Cloud Run{cloudRunRevision(view) ? <code>{cloudRunRevision(view)}</code> : null}</span>
          : <span className="local-proof" title="No cloud execution data supplied"><CloudSlash aria-hidden="true" />{transportSource === 'api' ? 'Local API' : 'Local fixture'}</span>}
        <a href={demoHref('/store', view.index, sourcePreference)} className="surface-link"><Browser aria-hidden="true" />Inspect surface</a>
        <span className={`run-status run-status-${view.index}`}><Pulse aria-hidden="true" />{view.runStatus}</span>
      </div>
    </header>
  )
}

function ChangeCard({ view }: { view: HackathonView }) {
  const changed = view.policy.authoritativeDays !== view.policy.previousDays
  return (
    <article className={`change-card${changed ? ' change-active' : ''}`}>
      <SectionLabel>Cause</SectionLabel>
      <h2>{view.policy.name}</h2>
      <div className="policy-delta">
        <span>{view.policy.previousDays}<small>days</small></span>
        {changed ? <><ArrowRight weight="bold" aria-label="changed to" /><strong>{view.policy.authoritativeDays}<small>days</small></strong></> : <em>baseline everywhere</em>}
      </div>
      <dl className="change-meta">
        <div><dt>Source</dt><dd>{view.policy.source}</dd></div>
        <div><dt>{changed ? 'Detected' : 'State'}</dt><dd>{view.detectedAt ?? 'Current'}</dd></div>
      </dl>
    </article>
  )
}

function MissionMark({ status }: { status: MissionStage['status'] }) {
  if (status === 'completed') return <Check weight="bold" aria-hidden="true" />
  if (status === 'active') return <Pulse weight="bold" aria-hidden="true" />
  return <Circle weight="fill" aria-hidden="true" />
}

function MissionStepper({ mission }: { mission: MissionStage[] }) {
  return (
    <nav className="mission-stepper" aria-label="Mission progression">
      <SectionLabel>Mission</SectionLabel>
      <ol>
        {mission.map((stage, index) => (
          <li key={stage.label} className={`mission-${stage.status}`} aria-current={stage.status === 'active' ? 'step' : undefined}>
            <span className="mission-index">{String(index + 1).padStart(2, '0')}</span>
            <i><MissionMark status={stage.status} /></i>
            <strong>{stage.label}</strong>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function ChangeMissionRail({ view }: { view: HackathonView }) {
  return (
    <aside className="change-rail" aria-label="Change and mission">
      <ChangeCard view={view} />
      {view.triggerCrumb && (
        <div className="rail-crumb"><Fingerprint aria-hidden="true" /><div><span>Trigger crumb</span><strong>{view.triggerCrumb.id}</strong></div></div>
      )}
      <MissionStepper mission={view.mission} />
    </aside>
  )
}

function AgentCard({ agent, verifier }: { agent: AgentData; verifier?: boolean }) {
  return (
    <article className={`agent-card${verifier ? ' verifier-card' : ''}`} data-agent-id={agent.id}>
      <div className="agent-title"><span className="agent-role-mark">{verifier ? <Fingerprint aria-hidden="true" /> : <ShieldChevron aria-hidden="true" />}</span><h3>{agent.name}</h3><StatusPill status={agent.status} /></div>
      <p>{agent.task}</p>
      <dl>
        <div><dt>Evidence</dt><dd>{agent.evidenceCount}</dd></div>
        <div><dt>Modality</dt><dd>{agent.modality}</dd></div>
        <div><dt>Ceiling</dt><dd>{agent.authority}</dd></div>
      </dl>
    </article>
  )
}

function FleetRail({ view }: { view: HackathonView }) {
  const activeStatuses = new Set(['DISPATCHED', 'RUNNING', 'FOUND', 'WAITING_REVIEW', 'BLOCKED'])
  const activeCount = view.agents.filter((agent) => activeStatuses.has(agent.status)).length
  return (
    <aside className="fleet-rail" aria-labelledby="fleet-heading">
      <header className="fleet-heading"><div><SectionLabel>Actors</SectionLabel><h2 id="fleet-heading">Agent fleet</h2></div><span>{activeCount} active</span></header>
      <div className="agent-list">
        {view.agents.map((agent) => <AgentCard key={agent.id} agent={agent} verifier={agent.id === 'independent-verifier'} />)}
      </div>
    </aside>
  )
}

function RunIdentity({ mode, run }: { mode: GoldenRunMode; run: GoldenRunState | null }) {
  if (mode === 'backend' && run) {
    return (
      <div className="run-identity run-identity-backend">
        <span>Route A run</span>
        <strong>{run.runId}</strong>
        <small>{`executed ${run.executedAt.slice(11, 19)}Z · ${run.executionMs.toFixed(1)}ms · replaying ${run.events.length}/${run.totalPhases} recorded phases`}</small>
      </div>
    )
  }
  if (mode === 'local') {
    return (
      <div className="run-identity run-identity-local">
        <span>Local playback</span>
        <strong>No backend run</strong>
        <small>Route A did not open a run. The validated sequence is replaying in the browser.</small>
      </div>
    )
  }
  return (
    <div className="run-identity run-identity-idle">
      <span>Golden run</span>
      <strong>Not started</strong>
      <small>Run GlassWake to open a Route A run and replay its recorded phases.</small>
    </div>
  )
}

function RunDeck({
  current,
  onSelect,
  transportSource,
  runMode,
  run,
  playing,
  starting,
  onStart,
  onPause,
  onNext,
  onReset,
  focusMode,
  onToggleFocus,
}: {
  current: number
  onSelect: (index: number) => void
  transportSource: 'api' | 'fixture'
  runMode: GoldenRunMode
  run: GoldenRunState | null
  playing: boolean
  starting: boolean
  onStart: () => void
  onPause: () => void
  onNext: () => void
  onReset: () => void
  focusMode: boolean
  onToggleFocus: () => void
}) {
  const started = runMode !== 'idle'
  const complete = current === goldenRunPhaseLabels.length - 1

  return (
    <footer className="run-deck" aria-label="Golden run controls">
      <div className="run-deck-primary">
        {playing ? (
          <button type="button" className="run-button run-button-pause" onClick={onPause}>
            <Pause weight="fill" aria-hidden="true" />Pause
          </button>
        ) : (
          <button type="button" className="run-button run-button-go" onClick={onStart} disabled={starting}>
            <Play weight="fill" aria-hidden="true" />
            {starting ? 'Opening run…' : started ? 'Resume run' : 'Run GlassWake'}
          </button>
        )}
        <button type="button" className="run-button" onClick={onNext} disabled={complete}>
          <SkipForward weight="bold" aria-hidden="true" />Next
        </button>
        <button type="button" className="run-button" onClick={onReset} disabled={!started && current === 0}>
          <ArrowClockwise weight="bold" aria-hidden="true" />Reset
        </button>
        <button type="button" className="run-button" onClick={onToggleFocus} aria-pressed={focusMode}>
          {focusMode ? <ArrowsInSimple weight="bold" aria-hidden="true" /> : <ArrowsOutSimple weight="bold" aria-hidden="true" />}
          {focusMode ? 'Exit focus' : 'Focus'}
        </button>
        <RunIdentity mode={runMode} run={run} />
      </div>

      <ol className="phase-track" aria-label="Golden run phases">
        {goldenRunPhaseLabels.map((label, index) => {
          const stamped = run?.events.find((event) => event.seq === index)
          return (
            <li key={label} className={index === current ? 'active' : index < current ? 'complete' : ''}>
              <button
                type="button"
                aria-current={index === current ? 'step' : undefined}
                aria-label={`Phase ${index + 1}: ${label}`}
                onClick={() => onSelect(index)}
              >
                <span className="phase-index">{index < current ? <Check aria-hidden="true" /> : String(index + 1).padStart(2, '0')}</span>
                <span className="phase-label">{label}</span>
                <span className="phase-stamp">{stamped ? `${stamped.at.slice(11, 19)}Z` : `S${index}`}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <p className="run-deck-note">
        <CloudSlash aria-hidden="true" />
        {transportSource === 'api' ? 'API-validated projection' : 'Fixture projection'}
        <span>S0–S8 remain the internal fixture aliases.</span>
      </p>
    </footer>
  )
}

export function ControlPlane({
  snapshot,
  onSelectSnapshot,
  sourcePreference = 'auto',
  transportSource = 'fixture',
  transportStatus,
  runMode = 'idle',
  run = null,
  playing = false,
  starting = false,
  onRunStart = () => {},
  onRunPause = () => {},
  onRunNext = () => {},
  onRunReset = () => {},
  runtime = null,
  apiBaseUrl = null,
}: {
  snapshot: HackathonView
  onSelectSnapshot: (index: number) => void
  sourcePreference?: RouteASourcePreference
  transportSource?: 'api' | 'fixture'
  transportStatus?: ReactNode
  runMode?: GoldenRunMode
  run?: GoldenRunState | null
  playing?: boolean
  starting?: boolean
  onRunStart?: () => void
  onRunPause?: () => void
  onRunNext?: () => void
  onRunReset?: () => void
  runtime?: RouteARuntime | null
  apiBaseUrl?: string | null
}) {
  // Focus mode exists for one audience: a camera. It trades the side rails for
  // a full-width map and a larger drawer so a single stage is legible on video.
  const [focusMode, setFocusMode] = useState(false)

  return (
    <main className={`control-plane snapshot-${snapshot.snapshot}${transportStatus ? ' with-transport' : ''}${focusMode ? ' focus-mode' : ''}`}>
      <TopBar view={snapshot} sourcePreference={sourcePreference} transportSource={transportSource} />
      {transportStatus}
      <div className="control-grid">
        <ChangeMissionRail view={snapshot} />
        <ImpactMap view={snapshot} />
        <FleetRail view={snapshot} />
      </div>
      <EvidenceDrawer view={snapshot} runtime={runtime} apiBaseUrl={apiBaseUrl} />
      <RunDeck
        current={snapshot.index}
        onSelect={onSelectSnapshot}
        transportSource={transportSource}
        runMode={runMode}
        run={run}
        playing={playing}
        starting={starting}
        onStart={onRunStart}
        onPause={onRunPause}
        onNext={onRunNext}
        onReset={onRunReset}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((value) => !value)}
      />
    </main>
  )
}
