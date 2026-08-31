import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getSnapshot } from '../app/fixtures'
import { ControlPlane } from './ControlPlane'

describe('ControlPlane critical projections', () => {
  it('shows the two proven stale storefront surfaces at S4', () => {
    const { container } = render(<ControlPlane snapshot={getSnapshot(4)} onSelectSnapshot={vi.fn()} />)
    expect(container.querySelectorAll('[data-node-state="stale"]')).toHaveLength(2)
    expect(screen.getByText('2 stale surfaces found')).toBeInTheDocument()
    expect(screen.queryByTestId('receipt-panel')).not.toBeInTheDocument()
  })

  it('shows backend authority provenance without a local approval action', () => {
    render(<ControlPlane snapshot={getSnapshot(5)} onSelectSnapshot={vi.fn()} />)
    expect(screen.getByText('Pre-authorized demo policy · GW-DEMO-04')).toBeInTheDocument()
    expect(screen.getByText('REPAIR_1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('shows the sealed receipt in the canonical final frame', () => {
    render(<ControlPlane snapshot={getSnapshot(8)} onSelectSnapshot={vi.fn()} />)
    expect(screen.getByText('Reality changed. The fleet caught up.')).toBeInTheDocument()
    expect(screen.getByText('4 of 4 postconditions passed')).toBeInTheDocument()
    expect(screen.getByTestId('receipt-panel')).toBeInTheDocument()
  })
})
