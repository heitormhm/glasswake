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
}

describe('Route A to Route B application boundary', () => {
  beforeEach(() => {
    loadRouteASequenceMock.mockReset()
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
})
