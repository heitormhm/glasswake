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
})
