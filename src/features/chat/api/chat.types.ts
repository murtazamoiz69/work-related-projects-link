// Chat API contracts. The list endpoint returns lightweight summaries; the
// detail endpoint returns a full conversation. Wire dates are ISO strings.
import type { Client } from '@/features/clients'
import type { ClientDto } from '@/features/clients/api/clients.types'
import type {
  ChatActivityItem,
  ChatAttachment,
  ChatMessage,
  ChatNote,
  ChatNoteAttachment,
  ChatTab,
  ConversationInsights,
  ConversationStatus,
  Escalation,
  EscalationSeverity,
  HandledBy,
} from '../types'

// ---- Wire (DTO) shapes ----
export type ChatMessageDto = Omit<ChatMessage, 'time'> & { time: string }
export type ChatActivityItemDto = Omit<ChatActivityItem, 'time'> & {
  time: string
}
export type EscalationDto = Omit<Escalation, 'raisedAt' | 'resolvedAt'> & {
  raisedAt: string
  resolvedAt: string | null
}

export type ConversationDto = {
  id: string
  client: ClientDto
  status: ConversationStatus
  handledBy: HandledBy
  messages: ChatMessageDto[]
  unread: number
  starred: boolean
  insights: ConversationInsights
  flags: string[]
  notes: ChatNote[]
  uploads: { date: string }[]
  activity: ChatActivityItemDto[]
  chatSummary: string[]
  escalations: EscalationDto[]
}

export type ConversationSummaryDto = {
  id: string
  client: ClientDto
  status: ConversationStatus
  handledBy: HandledBy
  unread: number
  starred: boolean
  lastMessage: { text: string; time: string; hasAttachment: boolean }
  /** Highest-priority unresolved escalation, or null when there are none. The
   *  list row's tag is driven by this so it always matches the first row of the
   *  Insights rail. */
  topEscalation: { id: string; severity: EscalationSeverity } | null
}

// ---- Domain (after mapping) ----
export type ConversationSummary = {
  id: string
  client: Client
  status: ConversationStatus
  handledBy: HandledBy
  unread: number
  starred: boolean
  lastMessage: { text: string; time: Date; hasAttachment: boolean }
  topEscalation: { id: string; severity: EscalationSeverity } | null
}

// Conversation-list tab, server-computed: which tabs to show (Pinned only when
// something is pinned), their labels, and the badge counts. No date fields, so
// the wire and domain shapes are identical (see getConversationTabs). `id` is a
// ChatTab so the client drives its active-tab filtering off it.
export type ConversationTab = {
  id: ChatTab
  label: string
  total: number
  unread: number
}

// ---- Request bodies ----
export type SendMessageBody = {
  text: string
  attachment: ChatAttachment | null
}

export type AddNoteBody = {
  text: string
  attachment?: ChatNoteAttachment | null
}

export type PatchConversationBody = {
  starred?: boolean
  /** Set to 0 to mark the conversation read. */
  unread?: number
}

export type HandoffBody = {
  handledBy: HandledBy
}
