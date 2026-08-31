import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { snapshots } from './fixtures'
import { loadRouteASequence } from './routeAClient'

vi.mock('./routeAClient', () => ({
  loadRouteASequence: vi.fn(),
}))

const loadRouteASequenceMock = vi.mocked(loadRouteASequence)
const liveConnection = {
  snapshots,
  metadata: {
    apiBaseUrl: 'http://127.0.0.1:8080',
    contractHash: 'ed44e8765577ed5e82f3e25551869fb757169cad197fad54e4ea00084c43c3b8',
    healthMode: 'deterministic_fixture',
    statesValidated: 9,
    checkedAt: '2026-08-31T16:00:00.000Z',
  },
  runtime: {
    primaryModel: 'gemini-3.7-flash',
    orchestrator: 'Google ADK',
    execution: 'Local process',
    revision: null,
    persistence: 'In-memory',
    vertexAi: false,
    workerRoles: 5,
    mutationAdapters: 1,
    authorizedRepairPaths: 3,
  },
}

describe('Route A to Route B application boundary', () => {
  beforeEach(() => {
    loadRouteASequenceMock.mockReset()
    vi.unstubAllGlobals()
    window.localStorage.clear()
    window.history.replaceState({}, '', '/control-plane?state=8')
  })

  it('shows a fixture preview while validating and then identifies the live local API', async () => {
    loadRouteASequenceMock.mockResolvedValue(liveConnection)
    render(<App />)

    expect(screen.getByText('Validating Route A')).toBeInTheDocument()
    expect(screen.getByText('Reality changed. The fleet caught up.')).toBeInTheDocument()
    expect(await screen.findByText('Local API validated')).toBeInTheDocument()
    expect(screen.getByText('9/9 canonical states passed schema and sequence validation.')).toBeInTheDocument()
    expect(screen.getByText('API-validated projection')).toBeInTheDocument()
  })

  it('keeps the canonical fixture visible and names a schema mismatch explicitly', async () => {
    loadRouteASequenceMock.mockRejectedValue({ code: 'SCHEMA_MISMATCH' })
    render(<App />)

    expect(await screen.findByText('Fixture fallback')).toBeInTheDocument()
    expect(screen.getByText('SCHEMA_MISMATCH')).toBeInTheDocument()
    expect(screen.getByText('Route A failed the frozen HackathonView schema. No incompatible data was rendered.')).toBeInTheDocument()
    expect(screen.getByText('5 of 5 postconditions passed')).toBeInTheDocument()
  })

  it('retries from explicit fallback and recovers without reloading the page', async () => {
    loadRouteASequenceMock
      .mockRejectedValueOnce({ code: 'API_UNAVAILABLE' })
      .mockResolvedValueOnce(liveConnection)
    render(<App />)

    const retry = await screen.findByRole('button', { name: 'Retry API' })
    fireEvent.click(retry)

    await waitFor(() => expect(loadRouteASequenceMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Local API validated')).toBeInTheDocument()
  })

  it('does not call the network in explicit fixture mode and preserves the source in navigation', () => {
    window.history.replaceState({}, '', '/control-plane?state=5&source=fixture')
    render(<App />)

    expect(screen.getByText('Frozen fixture')).toBeInTheDocument()
    expect(loadRouteASequenceMock).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Inspect surface' })).toHaveAttribute('href', '/store?state=5&source=fixture')
  })

  it('opens a Route A run, rewinds to baseline, and shows the run identity', async () => {
    loadRouteASequenceMock.mockResolvedValue(liveConnection)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        run_id: 'gw-run-abc123def456',
        mode: 'replay_of_recorded_run',
        cursor: 0,
        status: 'running',
        total_phases: 9,
        executed_at: '2026-08-31T18:00:00.000Z',
        execution_ms: 4.25,
        events: [{ seq: 0, phase: 'idle', at: '2026-08-31T18:00:00.000Z' }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)

    expect(screen.getByText('Not started')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /Run GlassWake/ }))

    expect(await screen.findByText('gw-run-abc123def456')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:8080/v1/demo/runs')
    // The run starts at the baseline even though the URL asked for S8.
    expect(screen.getByText('Returns policy · 30 days everywhere')).toBeInTheDocument()
    expect(screen.queryByTestId('receipt-panel')).not.toBeInTheDocument()
  })

  it('falls back to honest local playback when Route A will not open a run', async () => {
    loadRouteASequenceMock.mockResolvedValue(liveConnection)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /Run GlassWake/ }))

    expect(await screen.findByText('No backend run')).toBeInTheDocument()
    expect(screen.getByText(/Route A did not open a run/)).toBeInTheDocument()
  })

  it('resets a started run back to the unstarted baseline', async () => {
    loadRouteASequenceMock.mockResolvedValue(liveConnection)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /Run GlassWake/ }))
    expect(await screen.findByText('No backend run')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
    expect(screen.getByText('Not started')).toBeInTheDocument()
    expect(screen.getByText('Returns policy · 30 days everywhere')).toBeInTheDocument()
  })

  it('names Cloud Run as the origin only when the backend supplies its own revision evidence', async () => {
    const revision = 'glasswake-kanon-pulse-00004-w8k'
    loadRouteASequenceMock.mockResolvedValue({
      ...liveConnection,
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,
        cloudProof: {
          cloudRun: true,
          firestore: true,
          evidenceRefs: [`cloud-run://glasswake-kanon-pulse/revisions/${revision}`],
        },
      })),
    })
    render(<App />)

    expect(await screen.findByText('Cloud Run validated')).toBeInTheDocument()
    expect(screen.getByText(`9/9 canonical states passed schema and sequence validation on revision ${revision}.`)).toBeInTheDocument()
    expect(screen.getByText('Cloud Run')).toBeInTheDocument()
    expect(screen.getByText(revision)).toBeInTheDocument()
    expect(screen.queryByText('Local API')).not.toBeInTheDocument()
  })

  it('keeps calling a local origin local when no cloud evidence is supplied', async () => {
    loadRouteASequenceMock.mockResolvedValue(liveConnection)
    render(<App />)

    expect(await screen.findByText('Local API validated')).toBeInTheDocument()
    expect(screen.getByText('Local API')).toBeInTheDocument()
    expect(screen.queryByText('Cloud Run validated')).not.toBeInTheDocument()
  })
})
