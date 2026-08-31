import { useMemo, useState } from 'react'
import { ControlPlane } from '../components/ControlPlane'
import { DataSourceStatus } from '../components/DataSourceStatus'
import { NorthstarStore } from '../components/Storefront'
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

  const selectSnapshot = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(8, nextIndex))
    setSnapshotIndex(safeIndex)
    window.localStorage.setItem(fixtureStorageKey, String(safeIndex))
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('state', String(safeIndex))
    window.history.replaceState({}, '', nextUrl)
  }

  const useApi = () => {
    setSourcePreference('api')
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('source', 'api')
    window.history.replaceState({}, '', nextUrl)
  }

  const transportStatus = <DataSourceStatus state={dataSource} onRetry={retry} onUseApi={useApi} />

  if (path === '/store' || path.startsWith('/store/')) {
    return (
      <NorthstarStore
        path={path}
        snapshot={snapshot}
        sourcePreference={sourcePreference}
        transportSource={dataSource.source}
        transportStatus={transportStatus}
      />
    )
  }

  return (
    <ControlPlane
      snapshot={snapshot}
      onSelectSnapshot={selectSnapshot}
      sourcePreference={sourcePreference}
      transportSource={dataSource.source}
      transportStatus={transportStatus}
    />
  )
}
