import type { BroadcastDraftFields } from './types'

// sessionStorage (not localStorage): this is a short-lived hand-off for the
// "Create Template" round trip, not something that should survive between
// sessions or leak into a saved broadcast if the user never comes back.
const PREFIX = 'nourish_broadcast_draft:'

export function saveDraftCache(id: string, fields: BroadcastDraftFields): void {
  try {
    sessionStorage.setItem(PREFIX + id, JSON.stringify(fields))
  } catch {
    /* storage unavailable — the round trip just won't restore */
  }
}

export function loadDraftCache(id: string): BroadcastDraftFields | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + id)
    if (!raw) return null
    return JSON.parse(raw) as BroadcastDraftFields
  } catch {
    return null
  }
}

export function clearDraftCache(id: string): void {
  try {
    sessionStorage.removeItem(PREFIX + id)
  } catch {
    /* ignore */
  }
}
