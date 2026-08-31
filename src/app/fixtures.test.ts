import { describe, expect, it } from 'vitest'
import { getSnapshot, snapshots } from './fixtures'

describe('HackathonView golden fixtures', () => {
  it('provides exactly nine canonical snapshots', () => {
    expect(snapshots).toHaveLength(9)
    expect(snapshots.map((view) => view.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('keeps baseline policy consistent before the source change', () => {
    const baseline = getSnapshot(0)
    expect(baseline.policy.authoritativeDays).toBe(30)
    expect(baseline.policy.storefrontDays).toBe(30)
    expect(baseline.triggerCrumb).toBeNull()
  })

  it('projects stale surfaces and their compliance mission only after findings complete', () => {
    const stale = getSnapshot(4)
    const staleIds = stale.graph.nodes.filter((node) => node.state === 'stale').map((node) => node.id)
    expect(staleIds).toEqual([
      'storefront.product_return_badge',
      'storefront.checkout_help',
      'support.returns_answer',
      'mission.return_policy_compliance',
    ])
    expect(stale.receipt).toBeNull()
    expect(stale.verification).toBeNull()
  })

  it('never treats repair as final verification', () => {
    const repair = getSnapshot(6)
    expect(repair.policy.storefrontDays).toBe(14)
    expect(repair.receipt).toBeNull()
    expect(repair.verification).toBeNull()
  })

  it('separates fresh verification from the repair phase without implementer narrative', () => {
    const verifying = getSnapshot(7)
    expect(verifying.verification?.status).toBe('verified')
    expect(verifying.verification?.independent).toBe(true)
    expect(verifying.verification?.receivedImplementerNarrative).toBe(false)
    expect(verifying.receipt).toBeNull()
  })

  it('renders a receipt only after every postcondition passes', () => {
    const complete = getSnapshot(8)
    expect(complete.verification?.status).toBe('verified')
    expect(complete.receipt?.verificationResult).toBe('5 of 5 postconditions passed')
    expect(complete.cloudProof).toEqual({ cloudRun: false, firestore: false, evidenceRefs: [] })
  })
})
