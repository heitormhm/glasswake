import { describe, expect, it, vi } from 'vitest'
import { rawSnapshots } from './fixtures'
import {
  canonicalContractHash,
  canonicalReceiptHash,
  canonicalRouteAStates,
  loadRouteASequence,
} from './routeAClient'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function routeAFetch(overrides: Partial<Record<(typeof canonicalRouteAStates)[number], unknown>> = {}) {
  const byState = Object.fromEntries(
    canonicalRouteAStates.map((state, index) => [state, overrides[state] ?? rawSnapshots[index]]),
  )
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    if (url.pathname === '/v1/healthz') {
      return jsonResponse({ status: 'ok', mode: 'deterministic_fixture', contract_sha256: canonicalContractHash })
    }
    if (url.pathname === '/v1/demo/snapshots') {
      return jsonResponse({ states: [...canonicalRouteAStates, 'loopguard_recovery'], count: 10 })
    }
    const state = url.pathname.split('/').at(-1)
    if (state && state in byState) return jsonResponse(byState[state])
    return jsonResponse({ detail: 'not found' }, 404)
  }) as unknown as typeof fetch
}

describe('Route A local transport', () => {
  it('validates and adapts the complete S0–S8 API sequence', async () => {
    const fetchImpl = routeAFetch()
    const connection = await loadRouteASequence({ apiBaseUrl: 'http://127.0.0.1:8080/', fetchImpl })

    expect(connection.snapshots).toHaveLength(9)
    expect(connection.snapshots.map((snapshot) => snapshot.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(connection.snapshots[8].receipt?.receiptHash).toBe(canonicalReceiptHash)
    expect(connection.snapshots[7].receipt).toBeNull()
    expect(connection.snapshots[7].verification?.receivedImplementerNarrative).toBe(false)
    expect(connection.metadata).toMatchObject({
      apiBaseUrl: 'http://127.0.0.1:8080',
      contractHash: canonicalContractHash,
      healthMode: 'deterministic_fixture',
      statesValidated: 9,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(11)
  })

  it('fails closed when one state violates the frozen JSON schema', async () => {
    const invalid = structuredClone(rawSnapshots[4]) as unknown as Record<string, unknown>
    delete (invalid.run as Record<string, unknown>).fixture

    await expect(loadRouteASequence({
      apiBaseUrl: 'http://127.0.0.1:8080',
      fetchImpl: routeAFetch({ findings_complete: invalid }),
    })).rejects.toMatchObject({ code: 'SCHEMA_MISMATCH' })
  })

  it('fails closed when health advertises a different contract hash', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      if (url.pathname === '/v1/healthz') {
        return jsonResponse({
          status: 'ok',
          mode: 'deterministic_fixture',
          contract_sha256: '0'.repeat(64),
        })
      }
      return routeAFetch()(input)
    }) as unknown as typeof fetch

    await expect(loadRouteASequence({
      apiBaseUrl: 'http://127.0.0.1:8080',
      fetchImpl,
    })).rejects.toMatchObject({ code: 'SCHEMA_MISMATCH' })
  })

  it('fails closed when a schema-valid response changes the canonical receipt', async () => {
    const invalid = structuredClone(rawSnapshots[8])
    if (!invalid.receipt) throw new Error('The canonical S8 fixture must include a receipt.')
    invalid.receipt.receipt_hash = `sha256:${'0'.repeat(64)}`

    await expect(loadRouteASequence({
      apiBaseUrl: 'http://127.0.0.1:8080',
      fetchImpl: routeAFetch({ receipt_complete: invalid }),
    })).rejects.toMatchObject({ code: 'SEQUENCE_MISMATCH' })
  })

  it('classifies an unreachable API without leaking transport details into presentation data', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('connection refused')
    }) as unknown as typeof fetch

    await expect(loadRouteASequence({
      apiBaseUrl: 'http://127.0.0.1:8080',
      fetchImpl,
    })).rejects.toMatchObject({ code: 'API_UNAVAILABLE' })
  })
})
