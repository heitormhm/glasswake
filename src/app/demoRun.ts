import { useCallback, useEffect, useRef, useState } from 'react'

// The golden run is one real backend execution. Route A records its nine
// canonical phases in a single pass, so the control plane replays a recorded
// run rather than watching nine independent live computations. Every label
// here says exactly that; nothing claims more than the backend performed.

export const goldenRunPhaseLabels = [
  'Baseline',
  'Change detected',
  'Impact scoped',
  'Fleet dispatched',
  'Stale surfaces found',
  'Authority ready',
  'Repair applied',
  'Fresh verification',
  'Receipt sealed',
] as const

export const goldenRunPhaseCount = goldenRunPhaseLabels.length

export interface GoldenRunEvent {
  seq: number
  phase: string
  at: string
}

export interface GoldenRunState {
  runId: string
  cursor: number
  status: 'running' | 'complete'
  totalPhases: number
  executedAt: string
  executionMs: number
  events: GoldenRunEvent[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function adaptRunPayload(payload: unknown): GoldenRunState {
  if (
    !isRecord(payload)
    || typeof payload.run_id !== 'string'
    || typeof payload.cursor !== 'number'
    || typeof payload.executed_at !== 'string'
    || !Array.isArray(payload.events)
  ) {
    throw new Error('The Route A run response is incompatible.')
  }
  return {
    runId: payload.run_id,
    cursor: payload.cursor,
    status: payload.status === 'complete' ? 'complete' : 'running',
    totalPhases: typeof payload.total_phases === 'number' ? payload.total_phases : goldenRunPhaseCount,
    executedAt: payload.executed_at,
    executionMs: typeof payload.execution_ms === 'number' ? payload.execution_ms : 0,
    events: payload.events.filter(isRecord).map((event) => ({
      seq: Number(event.seq),
      phase: String(event.phase),
      at: String(event.at),
    })),
  }
}

async function postRun(url: string, fetchImpl: typeof fetch, signal?: AbortSignal): Promise<GoldenRunState> {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`Route A returned HTTP ${response.status}.`)
  return adaptRunPayload(await response.json())
}

export function createGoldenRun(apiBaseUrl: string, fetchImpl: typeof fetch = fetch, signal?: AbortSignal) {
  return postRun(`${apiBaseUrl.replace(/\/$/, '')}/v1/demo/runs`, fetchImpl, signal)
}

export function advanceGoldenRun(
  apiBaseUrl: string,
  runId: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
) {
  return postRun(`${apiBaseUrl.replace(/\/$/, '')}/v1/demo/runs/${runId}/advance`, fetchImpl, signal)
}

/**
 * `backend` means Route A opened a run and is stamping every phase transition.
 * `local` means the run endpoint was unreachable, so the already-validated
 * sequence is played back in the browser with no run identity to show.
 */
export type GoldenRunMode = 'idle' | 'backend' | 'local'

export interface UseGoldenRunOptions {
  apiBaseUrl: string
  cursor: number
  onCursor: (cursor: number) => void
  enabled?: boolean
  stepMs?: number
  fetchImpl?: typeof fetch
}

export function useGoldenRun({
  apiBaseUrl,
  cursor,
  onCursor,
  enabled = true,
  stepMs = 2400,
  fetchImpl,
}: UseGoldenRunOptions) {
  const [mode, setMode] = useState<GoldenRunMode>('idle')
  const [run, setRun] = useState<GoldenRunState | null>(null)
  const [playing, setPlaying] = useState(false)
  const [starting, setStarting] = useState(false)

  const cursorRef = useRef(cursor)
  cursorRef.current = cursor
  const modeRef = useRef(mode)
  modeRef.current = mode
  const runRef = useRef(run)
  runRef.current = run
  const onCursorRef = useRef(onCursor)
  onCursorRef.current = onCursor

  const step = useCallback(async () => {
    const current = cursorRef.current
    if (current >= goldenRunPhaseCount - 1) {
      setPlaying(false)
      return
    }

    const activeRun = runRef.current
    if (modeRef.current === 'backend' && activeRun) {
      try {
        const next = await advanceGoldenRun(apiBaseUrl, activeRun.runId, fetchImpl ?? fetch)
        setRun(next)
        onCursorRef.current(next.cursor)
        if (next.status === 'complete') setPlaying(false)
        return
      } catch {
        // Route A dropped mid-run. Finish the sequence locally and stop
        // claiming a backend run is still stamping the transitions.
        setMode('local')
        setRun(null)
      }
    }

    const next = current + 1
    onCursorRef.current(next)
    if (next >= goldenRunPhaseCount - 1) setPlaying(false)
  }, [apiBaseUrl, fetchImpl])

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => void step(), stepMs)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, step, stepMs])

  const start = useCallback(async () => {
    setStarting(true)
    try {
      if (enabled) {
        try {
          const created = await createGoldenRun(apiBaseUrl, fetchImpl ?? fetch)
          setMode('backend')
          setRun(created)
          onCursorRef.current(created.cursor)
          setPlaying(true)
          return
        } catch {
          // Fall through to local playback rather than blocking the demo.
        }
      }
      setMode('local')
      setRun(null)
      onCursorRef.current(0)
      setPlaying(true)
    } finally {
      setStarting(false)
    }
  }, [apiBaseUrl, enabled, fetchImpl])

  const pause = useCallback(() => setPlaying(false), [])

  const next = useCallback(() => {
    setPlaying(false)
    void step()
  }, [step])

  const reset = useCallback(() => {
    setPlaying(false)
    setMode('idle')
    setRun(null)
    onCursorRef.current(0)
  }, [])

  return { mode, run, playing, starting, start, pause, next, reset }
}
