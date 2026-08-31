import { useCallback, useMemo, useState } from 'react'
import { ControlPlane } from '../components/ControlPlane'
import { DataSourceStatus } from '../components/DataSourceStatus'
import { NorthstarStore } from '../components/Storefront'
import { useGoldenRun } from './demoRun'
import { getSnapshot } from './fixtures'
import {
  parseRouteASourcePreference,
  useRouteASequence,
  type RouteASourcePreference,
} from './useRouteASequence'

const fixtureStorageKey = 'glasswake.fixture.state'

function parseFixtureIndex(): number {
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('state')
  const fromStorage = window.localStorage.getItem(fixtureStorageKey)
  const candidate = Number(fromQuery ?? fromStorage ?? 0)
  return Number.isFinite(candidate) ? Math.max(0, Math.min(8, Math.round(candidate))) : 0
}

export function App() {
  const [snapshotIndex, setSnapshotIndex] = useState(parseFixtureIndex)
  const [sourcePreference, setSourcePreference] = useState<RouteASourcePreference>(() => (
    parseRouteASourcePreference(window.location.search)
  ))
  const { snapshots, dataSource, retry } = useRouteASequence({ preference: sourcePreference })
  const snapshot = useMemo(() => snapshots[snapshotIndex] ?? getSnapshot(snapshotIndex), [snapshotIndex, snapshots])
  const path = window.location.pathname

  const selectSnapshot = useCallback((nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(8, nextIndex))
    setSnapshotIndex(safeIndex)
    window.localStorage.setItem(fixtureStorageKey, String(safeIndex))
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('state', String(safeIndex))
    window.history.replaceState({}, '', nextUrl)
  }, [])

  const goldenRun = useGoldenRun({
    apiBaseUrl: dataSource.apiBaseUrl,
    cursor: snapshotIndex,
    onCursor: selectSnapshot,
    enabled: sourcePreference !== 'fixture',
  })

  // A manual jump is the operator taking over; never leave autoplay running
  // underneath a hand-picked phase.
  const selectSnapshotManually = useCallback((nextIndex: number) => {
    goldenRun.pause()
    selectSnapshot(nextIndex)
  }, [goldenRun, selectSnapshot])

  const useApi = () => {
    setSourcePreference('api')
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('source', 'api')
    window.history.replaceState({}, '', nextUrl)
  }

  const transportStatus = <DataSourceStatus state={dataSource} onRetry={retry} onUseApi={useApi} />

  // Name the origin the same way everywhere; the storefront must not say
  // "Live API" while the control plane says "Cloud Run".
  const originLabel = dataSource.kind === 'live'
    ? (dataSource.cloudRun ? 'Cloud Run' : 'Live API')
    : 'Fixture'

  if (path === '/store' || path.startsWith('/store/')) {
    return (
      <NorthstarStore
        path={path}
        snapshot={snapshot}
        sourcePreference={sourcePreference}
        transportSource={dataSource.source}
        transportStatus={transportStatus}
        originLabel={originLabel}
      />
    )
  }

  return (
    <ControlPlane
      snapshot={snapshot}
      onSelectSnapshot={selectSnapshotManually}
      sourcePreference={sourcePreference}
      transportSource={dataSource.source}
      transportStatus={transportStatus}
      runMode={goldenRun.mode}
      run={goldenRun.run}
      playing={goldenRun.playing}
      starting={goldenRun.starting}
      onRunStart={() => void goldenRun.start()}
      onRunPause={goldenRun.pause}
      onRunNext={goldenRun.next}
      onRunReset={goldenRun.reset}
    />
  )
}
