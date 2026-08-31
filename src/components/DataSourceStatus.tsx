import {
  ArrowsClockwise,
  CloudCheck,
  Database,
  FileCode,
  WarningOctagon,
} from '@phosphor-icons/react'
import type { RouteADataSourceState } from '../app/useRouteASequence'

function SourceIcon({ state }: { state: RouteADataSourceState }) {
  if (state.kind === 'live') return <CloudCheck weight="duotone" aria-hidden="true" />
  if (state.kind === 'fallback') return <WarningOctagon weight="duotone" aria-hidden="true" />
  if (state.kind === 'fixture') return <FileCode weight="duotone" aria-hidden="true" />
  return <Database weight="duotone" aria-hidden="true" />
}

export function DataSourceStatus({
  state,
  onRetry,
  onUseApi,
}: {
  state: RouteADataSourceState
  onRetry: () => void
  onUseApi: () => void
}) {
  const action = state.kind === 'fixture' ? onUseApi : onRetry
  const actionLabel = state.kind === 'fixture'
    ? 'Connect API'
    : state.kind === 'live'
      ? 'Refresh API'
      : 'Retry API'

  return (
    <section
      className={`transport-rail transport-${state.kind}`}
      aria-live="polite"
      aria-busy={state.kind === 'loading'}
      data-transport-state={state.kind}
    >
      <div className="transport-identity">
        <span className="transport-icon"><SourceIcon state={state} /></span>
        <div><span>Data source</span><strong>{state.label}</strong></div>
      </div>

      {state.kind === 'loading' ? (
        <div className="transport-loading-copy" aria-label={state.detail}>
          <span />
          <span />
        </div>
      ) : (
        <p>{state.detail}</p>
      )}

      <div className="transport-facts">
        {state.kind === 'live' ? (
          <>
            <span><i className="source-dot" />API</span>
            <code title={state.contractHash}>{state.contractHash.slice(0, 10)}</code>
          </>
        ) : state.kind === 'fallback' ? (
          <><span><i className="source-dot" />FIXTURE</span><code>{state.errorCode}</code></>
        ) : state.kind === 'fixture' ? (
          <><span><i className="source-dot" />FIXTURE</span><code>S0–S8</code></>
        ) : (
          <><span><i className="source-dot" />CHECKING</span><code>SCHEMA 2020-12</code></>
        )}
      </div>

      <button type="button" className="transport-action" onClick={action} disabled={state.kind === 'loading'}>
        <ArrowsClockwise weight="bold" aria-hidden="true" />
        {actionLabel}
      </button>
    </section>
  )
}
