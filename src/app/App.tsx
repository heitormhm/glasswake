import { useMemo, useState } from 'react'
import { ControlPlane } from '../components/ControlPlane'
import { NorthstarStore } from '../components/Storefront'
import { getSnapshot } from './fixtures'

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
  const snapshot = useMemo(() => getSnapshot(snapshotIndex), [snapshotIndex])
  const path = window.location.pathname

  const selectSnapshot = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(8, nextIndex))
    setSnapshotIndex(safeIndex)
    window.localStorage.setItem(fixtureStorageKey, String(safeIndex))
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('state', String(safeIndex))
    window.history.replaceState({}, '', nextUrl)
  }

  if (path === '/store' || path.startsWith('/store/')) {
    return <NorthstarStore path={path} snapshot={snapshot} />
  }

  return <ControlPlane snapshot={snapshot} onSelectSnapshot={selectSnapshot} />
}
