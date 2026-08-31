import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getSnapshot } from '../app/fixtures'
import { NorthstarStore } from './Storefront'

describe('Northstar storefront fixture', () => {
  it('renders the stale product policy before authorized repair', () => {
    render(<NorthstarStore path="/store/product/NST-BAG-001" snapshot={getSnapshot(5)} />)
    expect(screen.getByText('Returns accepted within 30 days')).toBeInTheDocument()
    expect(screen.getByText('surface://store/product/NST-BAG-001')).toBeInTheDocument()
  })

  it('renders 14 days after the fixture repair is applied', () => {
    render(<NorthstarStore path="/store/product/NST-BAG-001" snapshot={getSnapshot(6)} />)
    expect(screen.getByText('Returns accepted within 14 days')).toBeInTheDocument()
  })

  it('keeps checkout help aligned to the same observable fixture state', () => {
    render(<NorthstarStore path="/store/checkout-help" snapshot={getSnapshot(8)} />)
    expect(screen.getByText('Returns accepted within 14 days')).toBeInTheDocument()
    expect(screen.getByText('surface://store/checkout-help')).toBeInTheDocument()
  })

  it('preserves the live API source across store, product, help, and control-plane links', () => {
    const { rerender } = render(
      <NorthstarStore
        path="/store"
        snapshot={getSnapshot(8)}
        sourcePreference="api"
        transportSource="api"
      />,
    )

    expect(screen.getByRole('link', { name: 'View Navy Commuter Bag' })).toHaveAttribute(
      'href',
      '/store/product/NST-BAG-001?state=8&source=api',
    )
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/store/checkout-help?state=8&source=api',
    )
    expect(screen.getByRole('link', { name: /GlassWake control plane/i })).toHaveAttribute(
      'href',
      '/control-plane?state=8&source=api',
    )
    expect(screen.getByText('Route A API-validated commerce projection.')).toBeInTheDocument()

    rerender(
      <NorthstarStore
        path="/store/checkout-help"
        snapshot={getSnapshot(8)}
        sourcePreference="api"
        transportSource="api"
      />,
    )
    expect(screen.getByRole('link', { name: /View Navy Commuter Bag/i })).toHaveAttribute(
      'href',
      '/store/product/NST-BAG-001?state=8&source=api',
    )
  })

  it('makes the authoritative-versus-storefront divergence readable on the product surface', () => {
    render(<NorthstarStore path="/store/product/NST-BAG-001" snapshot={getSnapshot(5)} />)
    const divergence = screen.getByText('STALE').closest('.policy-divergence')!
    expect(divergence.getAttribute('data-diverged')).toBe('true')
    expect(divergence).toHaveTextContent('Authoritative policy14 days')
    expect(divergence).toHaveTextContent('This surface30 days')
  })

  it('reports the surface as matching once the authorized repair has landed', () => {
    render(<NorthstarStore path="/store/product/NST-BAG-001" snapshot={getSnapshot(6)} />)
    expect(screen.queryByText('STALE')).not.toBeInTheDocument()
    expect(screen.getByText('Matches · 14 days')).toBeInTheDocument()
  })
})
