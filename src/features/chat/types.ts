import type { Client } from '@/features/clients'

export type ConversationStatus = 'waiting' | 'active'
export type HandledBy = 'ai' | 'nutritionist'
export type MessageFrom = 'client' | 'ai' | 'coach' | 'system'

export type ChatAttachment = {
  type: 'image' | 'file'
  name: string
  dataUrl?: string
  /** Human-readable size for document cards, e.g. '248 KB'. */
  size?: string
}

export type ChatMessage = {
  from: MessageFrom
  text: string
  time: Date
  attachment: ChatAttachment | null
}

/** Escalations are raised to the nutritionist from the user's side. Three
 *  weights, worked highest-first (see ./escalations.ts).
 *  ASSUMPTION: no backend contract exists for escalations yet. This is a mock
 *  contract served only by the chat MSW handlers (chat is never switched to the
 *  live backend); reconcile the shape when the real endpoint lands. */
export type EscalationSeverity = 'soft' | 'medium' | 'high'

export type Escalation = {
  id: string
  severity: EscalationSeverity
  /** One line naming what was raised, e.g. "Reported chest tightness". */
  title: string
  /** The user's own words, or the detector's reason. */
  detail: string
  raisedAt: Date
  resolved: boolean
  resolvedAt: Date | null
  /** Display name of whoever resolved it. */
  resolvedBy: string | null
}

export type ConversationInsights = {
  mealPct: number
  workoutDone: boolean
  workoutsCompleted: number
  workoutsTotal: number
}

export type ChatNoteAttachment = { name: string; type: string }

export type ChatNote = {
  author: string
  text: string
  days: number
  attachment?: ChatNoteAttachment | null
}

export type ChatUpload = {
  date: Date
}

export type ChatActivityKind =
  'checkin' | 'meal' | 'workout' | 'weight' | 'photo'

export type ChatActivityDelta = { text: string; direction: 'up' | 'down' }

export type ChatActivityItem = {
  kind: ChatActivityKind
  icon: string
  title: string
  detail: string
  time: Date
  photos?: string[]
  delta?: ChatActivityDelta
  // A scheduled (not-yet-happened) meal or workout from the plan, rendered
  // distinctly in the "View all activity" log's upcoming days.
  upcoming?: boolean
  // Meal slot ('Breakfast'/'Lunch'/'Snack'/'Dinner') or workout muscle group
  // ('Push'/'Pull'/'Legs'/…) — the activity log's sub-filter narrows within
  // a kind on this. Undefined for kinds that don't have a sub-category.
  category?: string
}

export type Conversation = {
  id: string
  client: Client
  status: ConversationStatus
  handledBy: HandledBy
  messages: ChatMessage[]
  unread: number
  starred: boolean
  insights: ConversationInsights
  flags: string[]
  notes: ChatNote[]
  uploads: ChatUpload[]
  activity: ChatActivityItem[]
  chatSummary: string[]
  escalations: Escalation[]
  liveSimulated: boolean
}

export type ChatTab = 'inbox' | 'waiting' | 'active' | 'new' | 'starred'
export type ProfileSectionId = 'notes' | 'medical' | 'activity'
