import Ajv2020, { type ErrorObject } from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import routeAViewSchema from '../../contracts/hackathon_view.schema.json'
import { adaptRouteAView, type RawHackathonView } from './routeAAdapter'
import type { HackathonView } from './types'

export const canonicalRouteAStates = [
  'idle',
  'change_detected',
  'impacted_nodes_selected',
  'agents_running',
  'findings_complete',
  'authority_review',
  'repair_applied',
  'fresh_verification',
  'receipt_complete',
] as const

const expectedPhases = [
  'IDLE',
  'DETECTED',
  'SCOPED',
  'RUNNING',
  'FINDINGS_COMPLETE',
  'AUTHORITY_REVIEW',
  'REPAIRED',
  'VERIFYING',
  'COMPLETE',
] as const

export const canonicalReceiptHash = 'sha256:69eef0a35654db8410cee5e09f1afd178df6438c43f691d71c25280c5c873f9b'
export const canonicalContractHash = 'ed44e8765577ed5e82f3e25551869fb757169cad197fad54e4ea00084c43c3b8'

export type RouteATransportErrorCode =
  | 'API_UNAVAILABLE'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'INVALID_JSON'
  | 'SCHEMA_MISMATCH'
  | 'SEQUENCE_MISMATCH'
  | 'REQUEST_CANCELLED'

export class RouteATransportError extends Error {
  readonly code: RouteATransportErrorCode

  constructor(code: RouteATransportErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RouteATransportError'
    this.code = code
  }
}

export interface RouteAConnection {
  snapshots: HackathonView[]
  metadata: {
    apiBaseUrl: string
    contractHash: string
    healthMode: string
    statesValidated: number
    checkedAt: string
  }
}

export interface RouteAClientOptions {
  apiBaseUrl: string
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  timeoutMs?: number
}

const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validateRawHackathonView = ajv.compile<RawHackathonView>(routeAViewSchema)

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, '')
}

function schemaErrorSummary(errors: ErrorObject[] | null | undefined): string {
  if (!errors?.length) return 'The payload did not match HackathonView.'
  return errors
    .slice(0, 3)
    .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
    .join('; ')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function fetchJson(
  fetchImpl: typeof fetch,
  url: string,
  signal: AbortSignal,
): Promise<unknown> {
  let response: Response
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (signal.aborted) {
      throw new RouteATransportError('REQUEST_CANCELLED', 'The Route A request was cancelled.', { cause: error })
    }
    throw new RouteATransportError('API_UNAVAILABLE', 'The local Route A API could not be reached.', { cause: error })
  }

  if (!response.ok) {
    throw new RouteATransportError('HTTP_ERROR', `Route A returned HTTP ${response.status}.`)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new RouteATransportError('INVALID_JSON', 'Route A returned a non-JSON response.', { cause: error })
  }
}

function assertHealth(value: unknown): { contractHash: string; healthMode: string } {
  if (!isRecord(value) || value.status !== 'ok' || typeof value.mode !== 'string') {
    throw new RouteATransportError('SCHEMA_MISMATCH', 'The Route A health response is incompatible.')
  }
  if (typeof value.contract_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(value.contract_sha256)) {
    throw new RouteATransportError('SCHEMA_MISMATCH', 'The Route A contract hash is missing or invalid.')
  }
  if (value.contract_sha256 !== canonicalContractHash) {
    throw new RouteATransportError('SCHEMA_MISMATCH', 'Route A is serving a different HackathonView contract.')
  }
  return { contractHash: value.contract_sha256, healthMode: value.mode }
}

function assertStateCatalog(value: unknown): void {
  if (!isRecord(value)) {
    throw new RouteATransportError('SCHEMA_MISMATCH', 'The Route A state catalog is incompatible.')
  }
  const states = value.states
  if (!Array.isArray(states) || !states.every((state) => typeof state === 'string')) {
    throw new RouteATransportError('SCHEMA_MISMATCH', 'The Route A state catalog is incompatible.')
  }
  const missing = canonicalRouteAStates.filter((state) => !states.includes(state))
  if (missing.length > 0) {
    throw new RouteATransportError('SEQUENCE_MISMATCH', `Route A is missing canonical states: ${missing.join(', ')}.`)
  }
}

function assertCanonicalSequence(rawSnapshots: RawHackathonView[]): void {
  rawSnapshots.forEach((raw, index) => {
    if (raw.run.phase !== expectedPhases[index]) {
      throw new RouteATransportError(
        'SEQUENCE_MISMATCH',
        `State ${canonicalRouteAStates[index]} reported phase ${raw.run.phase}; expected ${expectedPhases[index]}.`,
      )
    }
    if (raw.watchzone_summary.total_nodes !== 12 || raw.nodes.length !== 12) {
      throw new RouteATransportError('SEQUENCE_MISMATCH', `State ${canonicalRouteAStates[index]} did not preserve the 12-node demo graph.`)
    }
    const scoped = index >= 2
    const expectedAffected = scoped ? 5 : 0
    const expectedSkipped = scoped ? 7 : 12
    const expectedAgents = scoped ? 3 : 0
    if (
      raw.watchzone_summary.affected_nodes !== expectedAffected
      || raw.watchzone_summary.skipped_nodes !== expectedSkipped
      || raw.watchzone_summary.dispatched_agents !== expectedAgents
    ) {
      throw new RouteATransportError('SEQUENCE_MISMATCH', `State ${canonicalRouteAStates[index]} changed the frozen watchzone counters.`)
    }
    if ((index < 8 && raw.receipt !== null) || (index === 8 && raw.receipt === null)) {
      throw new RouteATransportError('SEQUENCE_MISMATCH', 'The receipt appeared outside the canonical S8 boundary.')
    }
    if ((index < 7 && raw.verification !== null) || (index >= 7 && raw.verification === null)) {
      throw new RouteATransportError('SEQUENCE_MISMATCH', 'Fresh verification appeared outside the canonical S7–S8 boundary.')
    }
  })

  if (rawSnapshots[8].receipt?.receipt_hash !== canonicalReceiptHash) {
    throw new RouteATransportError('SEQUENCE_MISMATCH', 'The final receipt hash does not match the frozen demo contract.')
  }
}

export async function loadRouteASequence({
  apiBaseUrl,
  fetchImpl = fetch,
  signal,
  timeoutMs = 5_000,
}: RouteAClientOptions): Promise<RouteAConnection> {
  const baseUrl = normalizeBaseUrl(apiBaseUrl)
  const controller = new AbortController()
  let timedOut = false
  const abortFromCaller = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', abortFromCaller, { once: true })
  const timeout = window.setTimeout(() => {
    timedOut = true
    controller.abort(new DOMException('Route A request timed out.', 'TimeoutError'))
  }, timeoutMs)

  try {
    const [healthPayload, catalogPayload] = await Promise.all([
      fetchJson(fetchImpl, `${baseUrl}/healthz`, controller.signal),
      fetchJson(fetchImpl, `${baseUrl}/v1/demo/snapshots`, controller.signal),
    ])
    const health = assertHealth(healthPayload)
    assertStateCatalog(catalogPayload)

    const payloads = await Promise.all(
      canonicalRouteAStates.map((state) => fetchJson(fetchImpl, `${baseUrl}/v1/demo/snapshots/${state}`, controller.signal)),
    )
    const rawSnapshots = payloads.map((payload, index) => {
      if (!validateRawHackathonView(payload)) {
        throw new RouteATransportError(
          'SCHEMA_MISMATCH',
          `${canonicalRouteAStates[index]} failed HackathonView validation: ${schemaErrorSummary(validateRawHackathonView.errors)}.`,
        )
      }
      return payload
    })
    assertCanonicalSequence(rawSnapshots)

    return {
      snapshots: rawSnapshots.map((raw, index) => adaptRouteAView(raw, index)),
      metadata: {
        apiBaseUrl: baseUrl,
        contractHash: health.contractHash,
        healthMode: health.healthMode,
        statesValidated: rawSnapshots.length,
        checkedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    if (timedOut) {
      throw new RouteATransportError('TIMEOUT', `Route A did not respond within ${timeoutMs}ms.`, { cause: error })
    }
    if (signal?.aborted) {
      throw new RouteATransportError('REQUEST_CANCELLED', 'The Route A request was cancelled.', { cause: error })
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}
