import type { Client } from '@/features/clients'

export type ConversationStatus = 'waiting' | 'active'
export type HandledBy = 'ai' | 'nutritionist'
export type MessageFrom = 'client' | 'ai' | 'coach' | 'system' | 'broadcast'

export type ChatAttachment = {
  type: 'image' | 'file'
  name: string
  dataUrl?: string
  /** Human-readable size for document cards, e.g. '248 KB'. */
  size?: string
}

/** An attachment the nutritionist has pinned out of the conversation so it
 * stays findable later, independent of how far the chat has scrolled. */
export type SavedItem = {
  id: string
  attachment: ChatAttachment
  /** When the user sent it. */
  sentAt: Date
  /** When the nutritionist pinned it. */
  savedAt: Date
  savedBy: string
}

export type ChatMessage = {
  from: MessageFrom
  text: string
  time: Date
  attachment: ChatAttachment | null
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
  'checkin' | 'meal' | 'workout' | 'weight' | 'photo' | 'saved'

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
  /** Attachments pinned by the nutritionist, newest first. */
  saved: SavedItem[]
  chatSummary: string[]
  liveSimulated: boolean
}

export type ChatTab = 'inbox' | 'waiting' | 'active' | 'new' | 'starred'
export type ProfileSectionId = 'notes' | 'medical' | 'activity'
