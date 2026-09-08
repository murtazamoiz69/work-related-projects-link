// Escalations raised to the nutritionist from a user's conversation.
//
// Three severities. Ordering is severity first, then arrival — oldest first
// within a severity, because two escalations of equal weight are worked in the
// order they came in. `topActive` is the single escalation that drives both the
// conversation-list tag and the first row of the Insights rail, so those two
// can never disagree.
import type { Escalation, EscalationSeverity } from './types'

/** Higher wins. Kept as a lookup rather than an ordered array so an unknown
 *  severity from the wire sorts last instead of throwing. */
const SEVERITY_RANK: Record<EscalationSeverity, number> = {
  high: 3,
  medium: 2,
  soft: 1,
}

export const ESCALATION_LABEL: Record<EscalationSeverity, string> = {
  high: 'High priority',
  medium: 'Medium priority',
  soft: 'Soft priority',
}

/** Short form for the conversation-list tag, where the row is 280px wide. */
export const ESCALATION_TAG_LABEL: Record<EscalationSeverity, string> = {
  high: 'High escalation',
  medium: 'Medium escalation',
  soft: 'Soft escalation',
}

function rank(s: EscalationSeverity): number {
  return SEVERITY_RANK[s] ?? 0
}

/** Severity descending, then oldest-first within a severity. Unresolved always
 *  above resolved, so a resolved High does not outrank an open Soft. */
export function sortEscalations(list: readonly Escalation[]): Escalation[] {
  return [...list].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
    const bySeverity = rank(b.severity) - rank(a.severity)
    if (bySeverity !== 0) return bySeverity
    return a.raisedAt.getTime() - b.raisedAt.getTime()
  })
}

export function activeEscalations(list: readonly Escalation[]): Escalation[] {
  return sortEscalations(list.filter((e) => !e.resolved))
}

/** The escalation the conversation is judged by: highest severity, earliest
 *  raised. Null once everything is resolved. */
export function topActiveEscalation(
  list: readonly Escalation[],
): Escalation | null {
  return activeEscalations(list)[0] ?? null
}

export function countActive(list: readonly Escalation[]): number {
  return list.reduce((n, e) => (e.resolved ? n : n + 1), 0)
}
