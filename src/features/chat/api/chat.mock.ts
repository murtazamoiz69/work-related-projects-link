// Stateful mock "backend" for conversations. Seeded from the same CONVERSATIONS
// data the rest of the app derives from (mapped to DTO), but kept as an
// independent in-session store so chat mutations (send / star / handoff / note)
// don't mutate the shared seed the not-yet-migrated Plan Workspace still reads.
// Reset with resetChatStore() in tests.
import { toClientDto } from '@/features/clients'
import { CONVERSATIONS } from '../data'
import type { Conversation, HandledBy } from '../types'
import type {
  AddNoteBody,
  ConversationDto,
  ConversationSummaryDto,
  SendMessageBody,
} from './chat.types'

function toConversationDto(c: Conversation): ConversationDto {
  return {
    id: c.id,
    client: toClientDto(c.client),
    status: c.status,
    handledBy: c.handledBy,
    messages: c.messages.map((m) => ({ ...m, time: m.time.toISOString() })),
    unread: c.unread,
    starred: c.starred,
    insights: c.insights,
    flags: c.flags,
    notes: c.notes,
    uploads: c.uploads.map((u) => ({ date: u.date.toISOString() })),
    activity: c.activity.map((a) => ({ ...a, time: a.time.toISOString() })),
    chatSummary: c.chatSummary,
  }
}

let store = new Map<string, ConversationDto>()

function seed(): void {
  store = new Map(
    CONVERSATIONS.map((c) => [
      c.id,
      structuredClone(toConversationDto(c)) as ConversationDto,
    ]),
  )
}
seed()

export function resetChatStore(): void {
  seed()
}

function summaryOf(c: ConversationDto): ConversationSummaryDto {
  const last = c.messages[c.messages.length - 1]
  return {
    id: c.id,
    client: c.client,
    status: c.status,
    handledBy: c.handledBy,
    unread: c.unread,
    starred: c.starred,
    lastMessage: {
      text: last?.text ?? '',
      time: last?.time ?? new Date(0).toISOString(),
      hasAttachment: Boolean(last?.attachment),
    },
  }
}

export function listConversationSummaries(): ConversationSummaryDto[] {
  return [...store.values()].map(summaryOf)
}

export function getConversationDto(id: string): ConversationDto | undefined {
  return store.get(id)
}

export function addMessageDto(
  id: string,
  from: 'coach' | 'system',
  body: SendMessageBody,
): ConversationDto | undefined {
  const c = store.get(id)
  if (!c) return undefined
  c.messages.push({
    from,
    text: body.text,
    time: new Date().toISOString(),
    attachment: body.attachment,
  })
  if (from === 'coach') c.unread = 0
  return c
}

export function patchConversationDto(
  id: string,
  patch: { starred?: boolean; unread?: number },
): ConversationDto | undefined {
  const c = store.get(id)
  if (!c) return undefined
  if (patch.starred !== undefined) c.starred = patch.starred
  if (patch.unread !== undefined) c.unread = patch.unread
  return c
}

export function setHandoffDto(
  id: string,
  handledBy: HandledBy,
): ConversationDto | undefined {
  const c = store.get(id)
  if (!c) return undefined
  c.handledBy = handledBy
  c.messages.push({
    from: 'system',
    text:
      handledBy === 'nutritionist'
        ? 'Sarah Nolan took over this conversation'
        : 'Handed the conversation back to Nourish AI',
    time: new Date().toISOString(),
    attachment: null,
  })
  return c
}

export function addNoteDto(
  id: string,
  body: AddNoteBody,
): ConversationDto | undefined {
  const c = store.get(id)
  if (!c) return undefined
  c.notes.unshift({
    author: 'Sarah Nolan',
    text: body.text,
    days: 0,
    attachment: body.attachment ?? null,
  })
  return c
}
