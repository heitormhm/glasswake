import {
  ArrowRight,
  Browser,
  CaretLeft,
  CaretRight,
  Check,
  Circle,
  CloudSlash,
  Fingerprint,
  Pulse,
  ShieldChevron,
  WaveSine,
} from '@phosphor-icons/react'
import type { AgentData, HackathonView, MissionStage } from '../app/types'
import { snapshotKeys } from '../app/types'
import { EvidenceDrawer } from './EvidenceDrawer'
import { ImpactMap } from './ImpactMap'
import { SectionLabel, StatusPill } from './Primitives'

function TopBar({ view }: { view: HackathonView }) {
  return (
    <header className="topbar">
      <div className="wordmark"><span className="brand-mark"><WaveSine weight="bold" aria-hidden="true" /></span><strong>GlassWake</strong></div>
      <span className="fixture-badge">SYNTHETIC ENTERPRISE FIXTURE</span>
      <div className="run-summary"><span>Golden Run</span><strong>{view.summary}</strong></div>
      <div className="topbar-actions">
        {!view.cloudProof.cloudRun && !view.cloudProof.firestore && <span className="local-proof" title="No cloud execution data supplied"><CloudSlash aria-hidden="true" />Local fixture</span>}
        <a href={`/store?state=${view.index}`} className="surface-link"><Browser aria-hidden="true" />Inspect surface</a>
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

function DemoFixtureControls({ current, onSelect }: { current: number; onSelect: (index: number) => void }) {
  return (
    <footer className="fixture-controls" aria-label="Developer fixture sequencer">
      <div className="fixture-context"><span>DEMO SEQUENCER</span><strong>{`S${current}`}</strong></div>
      <button type="button" onClick={() => onSelect(current - 1)} disabled={current === 0}><CaretLeft aria-hidden="true" />Previous</button>
      <div className="state-track" role="group" aria-label="Golden screen states">
        {snapshotKeys.map((key, index) => (
          <button
            type="button"
            key={key}
            className={index === current ? 'active' : index < current ? 'complete' : ''}
            aria-current={index === current ? 'step' : undefined}
            aria-label={`Show S${index}: ${key.replaceAll('_', ' ')}`}
            title={key.replaceAll('_', ' ')}
            onClick={() => onSelect(index)}
          >
            {index < current ? <Check aria-hidden="true" /> : `S${index}`}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onSelect(current + 1)} disabled={current === 8}>Next<CaretRight aria-hidden="true" /></button>
      <span className="fixture-note"><CloudSlash aria-hidden="true" />Fixture-only projection</span>
    </footer>
  )
}

export function ControlPlane({ snapshot, onSelectSnapshot }: { snapshot: HackathonView; onSelectSnapshot: (index: number) => void }) {
  return (
    <main className={`control-plane snapshot-${snapshot.snapshot}`}>
      <TopBar view={snapshot} />
      <div className="control-grid">
        <ChangeMissionRail view={snapshot} />
        <ImpactMap view={snapshot} />
        <FleetRail view={snapshot} />
      </div>
      <EvidenceDrawer view={snapshot} />
      <DemoFixtureControls current={snapshot.index} onSelect={onSelectSnapshot} />
    </main>
  )
}
