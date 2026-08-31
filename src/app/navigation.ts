import type { RouteASourcePreference } from './useRouteASequence'

export function demoHref(path: string, state: number, source: RouteASourcePreference = 'auto'): string {
  const params = new URLSearchParams({ state: String(state) })
  if (source !== 'auto') params.set('source', source)
  return `${path}?${params.toString()}`
}
