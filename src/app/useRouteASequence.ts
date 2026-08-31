import { useCallback, useEffect, useState } from 'react'
import { snapshots as fixtureSnapshots } from './fixtures'
import type { RouteATransportErrorCode } from './routeAClient'
import type { HackathonView } from './types'

export type RouteASourcePreference = 'auto' | 'api' | 'fixture'

export type RouteADataSourceState =
  | {
      kind: 'loading'
      source: 'fixture'
      label: 'Validating Route A'
      detail: string
      apiBaseUrl: string
    }
  | {
      kind: 'live'
      source: 'api'
      label: 'Local API validated'
      detail: string
      apiBaseUrl: string
      contractHash: string
      healthMode: string
      statesValidated: number
      checkedAt: string
    }
  | {
      kind: 'fallback'
      source: 'fixture'
      label: 'Fixture fallback'
      detail: string
      apiBaseUrl: string
      errorCode: Exclude<RouteATransportErrorCode, 'REQUEST_CANCELLED'> | 'UNKNOWN_ERROR'
    }
  | {
      kind: 'fixture'
      source: 'fixture'
      label: 'Frozen fixture'
      detail: string
      apiBaseUrl: string
    }

interface RouteASequenceState {
  snapshots: HackathonView[]
  dataSource: RouteADataSourceState
}

interface UseRouteASequenceOptions {
  preference: RouteASourcePreference
  apiBaseUrl?: string
}

const defaultApiBaseUrl = import.meta.env.VITE_ROUTE_A_BASE_URL?.trim() || 'http://127.0.0.1:8080'

const transportErrorCodes = new Set<RouteATransportErrorCode>([
  'API_UNAVAILABLE',
  'TIMEOUT',
  'HTTP_ERROR',
  'INVALID_JSON',
  'SCHEMA_MISMATCH',
  'SEQUENCE_MISMATCH',
  'REQUEST_CANCELLED',
])

const fallbackDetail: Record<Exclude<RouteATransportErrorCode, 'REQUEST_CANCELLED'> | 'UNKNOWN_ERROR', string> = {
  API_UNAVAILABLE: 'Route A is offline. The frozen, validated S0–S8 sequence remains active.',
  TIMEOUT: 'Route A did not answer in time. The frozen, validated S0–S8 sequence remains active.',
  HTTP_ERROR: 'Route A returned an unsuccessful response. The frozen sequence remains active.',
  INVALID_JSON: 'Route A returned unreadable JSON. The payload was rejected before adaptation.',
  SCHEMA_MISMATCH: 'Route A failed the frozen HackathonView schema. No incompatible data was rendered.',
  SEQUENCE_MISMATCH: 'Route A changed a canonical S0–S8 invariant. The deterministic sequence remains active.',
  UNKNOWN_ERROR: 'Route A could not be validated. The deterministic sequence remains active.',
}

function initialState(preference: RouteASourcePreference, apiBaseUrl: string): RouteASequenceState {
  if (preference === 'fixture') {
    return {
      snapshots: fixtureSnapshots,
      dataSource: {
        kind: 'fixture',
        source: 'fixture',
        label: 'Frozen fixture',
        detail: 'Network transport is disabled by the explicit source=fixture selection.',
        apiBaseUrl,
      },
    }
  }
  return {
    snapshots: fixtureSnapshots,
    dataSource: {
      kind: 'loading',
      source: 'fixture',
      label: 'Validating Route A',
      detail: 'Previewing the frozen fixture while the local API contract is checked.',
      apiBaseUrl,
    },
  }
}

export function parseRouteASourcePreference(search: string): RouteASourcePreference {
  const source = new URLSearchParams(search).get('source')
  return source === 'api' || source === 'fixture' ? source : 'auto'
}

export function useRouteASequence({
  preference,
  apiBaseUrl = defaultApiBaseUrl,
}: UseRouteASequenceOptions) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<RouteASequenceState>(() => initialState(preference, apiBaseUrl))

  useEffect(() => {
    if (preference === 'fixture') {
      setState(initialState(preference, apiBaseUrl))
      return
    }

    const controller = new AbortController()
    setState({
      snapshots: fixtureSnapshots,
      dataSource: {
        kind: 'loading',
        source: 'fixture',
        label: 'Validating Route A',
        detail: 'Previewing the frozen fixture while the local API contract is checked.',
        apiBaseUrl,
      },
    })

    void import('./routeAClient')
      .then(({ loadRouteASequence }) => loadRouteASequence({ apiBaseUrl, signal: controller.signal }))
      .then((connection) => {
        if (controller.signal.aborted) return
        setState({
          snapshots: connection.snapshots,
          dataSource: {
            kind: 'live',
            source: 'api',
            label: 'Local API validated',
            detail: `${connection.metadata.statesValidated}/9 canonical states passed schema and sequence validation.`,
            ...connection.metadata,
          },
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const candidateCode = typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : undefined
        const code = typeof candidateCode === 'string'
          && transportErrorCodes.has(candidateCode as RouteATransportErrorCode)
          && candidateCode !== 'REQUEST_CANCELLED'
          ? candidateCode as Exclude<RouteATransportErrorCode, 'REQUEST_CANCELLED'>
          : 'UNKNOWN_ERROR'
        setState({
          snapshots: fixtureSnapshots,
          dataSource: {
            kind: 'fallback',
            source: 'fixture',
            label: 'Fixture fallback',
            detail: fallbackDetail[code],
            apiBaseUrl,
            errorCode: code,
          },
        })
      })

    return () => controller.abort()
  }, [apiBaseUrl, attempt, preference])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  return { ...state, retry }
}
