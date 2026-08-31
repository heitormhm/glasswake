import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getSnapshot } from '../app/fixtures'
import { ControlPlane } from './ControlPlane'

describe('ControlPlane critical projections', () => {
  it('shows three proven stale surfaces and the stale compliance mission at S4', () => {
    const { container } = render(<ControlPlane snapshot={getSnapshot(4)} onSelectSnapshot={vi.fn()} />)
    expect(container.querySelectorAll('[data-node-state="stale"]')).toHaveLength(4)
    expect(screen.getByText('3 stale surfaces found')).toBeInTheDocument()
    expect(screen.queryByTestId('receipt-panel')).not.toBeInTheDocument()
  })

  it('shows backend authority provenance without a local approval action', () => {
    render(<ControlPlane snapshot={getSnapshot(5)} onSelectSnapshot={vi.fn()} />)
    expect(screen.getByText('Backend authority projection · repair_brief_returns_001')).toBeInTheDocument()
    expect(screen.getByText('REPAIR_1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('shows the sealed receipt in the canonical final frame', () => {
    render(<ControlPlane snapshot={getSnapshot(8)} onSelectSnapshot={vi.fn()} />)
    expect(screen.getByText('Reality changed. The fleet caught up.')).toBeInTheDocument()
    expect(screen.getByText('5 of 5 postconditions passed')).toBeInTheDocument()
    expect(screen.getByTestId('receipt-panel')).toBeInTheDocument()
  })

  it('keeps the run history readable in the final frame instead of going uniformly green', () => {
    const { container } = render(<ControlPlane snapshot={getSnapshot(8)} onSelectSnapshot={vi.fn()} />)
    expect(container.querySelectorAll('[data-node-outcome="repaired"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-node-outcome="verified"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-node-outcome="skipped"]')).toHaveLength(6)
  })

  it('carries no outcome history before a repair has actually been applied', () => {
    const { container } = render(<ControlPlane snapshot={getSnapshot(5)} onSelectSnapshot={vi.fn()} />)
    expect(container.querySelectorAll('[data-node-outcome]')).toHaveLength(0)
  })

  it('names the run phases semantically rather than as S-numbers', () => {
    render(<ControlPlane snapshot={getSnapshot(3)} onSelectSnapshot={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Phase 4: Fleet dispatched' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phase 9: Receipt sealed' })).toBeInTheDocument()
  })

  it('reports architecture facts from the origin and never invents them', () => {
    const runtime = {
      primaryModel: 'gemini-3.7-flash',
      orchestrator: 'Google ADK',
      execution: 'Cloud Run',
      revision: 'glasswake-kanon-pulse-00005-6dd',
      persistence: 'Firestore',
      vertexAi: true,
      workerRoles: 5,
      mutationAdapters: 1,
      authorizedRepairPaths: 3,
    }
    render(<ControlPlane snapshot={getSnapshot(8)} onSelectSnapshot={vi.fn()} runtime={runtime} />)
    fireEvent.click(screen.getByRole('tab', { name: /Architecture/ }))

    expect(screen.getByText('gemini-3.7-flash')).toBeInTheDocument()
    expect(screen.getByText('Google ADK')).toBeInTheDocument()
    expect(screen.getByText('1 adapter · 3 authorized paths')).toBeInTheDocument()
    expect(screen.getByText('Repair cannot self-verify')).toBeInTheDocument()
  })

  it('says the origin reported nothing rather than showing a plausible default', () => {
    render(<ControlPlane snapshot={getSnapshot(8)} onSelectSnapshot={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: /Architecture/ }))

    expect(screen.getAllByText('not reported by origin').length).toBeGreaterThan(0)
    expect(screen.queryByText('Google ADK')).not.toBeInTheDocument()
    expect(screen.getByText(/reports no cloud execution evidence/)).toBeInTheDocument()
  })

  it('offers the executive brief only at the sealed receipt and states its zero authority', () => {
    render(<ControlPlane snapshot={getSnapshot(8)} onSelectSnapshot={vi.fn()} apiBaseUrl="http://127.0.0.1:8080" />)
    expect(screen.getByRole('button', { name: /Listen/ })).toBeInTheDocument()
    expect(screen.getByText('receipt-bound')).toBeInTheDocument()
    expect(screen.getByText('cannot mutate state')).toBeInTheDocument()
    expect(screen.getByText(/assembled from receipt fields, not written by a model/)).toBeInTheDocument()
  })

  it('reports an unavailable derived output without disturbing the receipt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<ControlPlane snapshot={getSnapshot(8)} onSelectSnapshot={vi.fn()} apiBaseUrl="http://127.0.0.1:8080" />)

    fireEvent.click(screen.getByRole('button', { name: /Listen/ }))
    expect(await screen.findByText(/Derived output unavailable/)).toBeInTheDocument()
    // The receipt is still sealed and still shown.
    expect(screen.getByTestId('receipt-panel')).toBeInTheDocument()
    expect(screen.getByText('5 of 5 postconditions passed')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
