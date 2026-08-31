import idle from '../../fixtures/hackathon_view/00_idle.json'
import changeDetected from '../../fixtures/hackathon_view/01_change_detected.json'
import impactScoped from '../../fixtures/hackathon_view/02_impacted_nodes_selected.json'
import agentsRunning from '../../fixtures/hackathon_view/03_agents_running.json'
import findingsComplete from '../../fixtures/hackathon_view/04_findings_complete.json'
import authorityReview from '../../fixtures/hackathon_view/05_authority_review.json'
import repairApplied from '../../fixtures/hackathon_view/06_repair_applied.json'
import freshVerification from '../../fixtures/hackathon_view/07_fresh_verification.json'
import receiptComplete from '../../fixtures/hackathon_view/08_receipt_complete.json'
import { adaptRouteAView, type RawHackathonView } from './routeAAdapter'

const rawSnapshots = [
  idle,
  changeDetected,
  impactScoped,
  agentsRunning,
  findingsComplete,
  authorityReview,
  repairApplied,
  freshVerification,
  receiptComplete,
] as unknown as RawHackathonView[]

export function getSnapshot(index: number) {
  const safeIndex = Math.max(0, Math.min(rawSnapshots.length - 1, Math.round(index)))
  return adaptRouteAView(rawSnapshots[safeIndex], safeIndex)
}

export const snapshots = rawSnapshots.map((raw, index) => adaptRouteAView(raw, index))
