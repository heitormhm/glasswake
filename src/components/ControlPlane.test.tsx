import { render, screen } from '@testing-library/react'
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
})
