// Chat service — conversations list/detail + message/note/handoff/flag
// mutations through the shared HTTP client. Maps wire DTOs (ISO dates,
// ClientDto) to domain shapes (Date, Client).
import { get, patch, post } from '@/lib/api/client'
import { toClient } from '@/features/clients'
import type { Conversation, HandledBy } from '../types'
import type {
  AddNoteBody,
  ConversationDto,
  ConversationSummary,
  ConversationSummaryDto,
  ConversationTab,
  PatchConversationBody,
  SendMessageBody,
} from './chat.types'

export function toConversation(dto: ConversationDto): Conversation {
  return {
    id: dto.id,
    client: toClient(dto.client),
    status: dto.status,
    handledBy: dto.handledBy,
    messages: dto.messages.map((m) => ({ ...m, time: new Date(m.time) })),
    unread: dto.unread,
    starred: dto.starred,
    insights: dto.insights,
    flags: dto.flags,
    notes: dto.notes,
    uploads: dto.uploads.map((u) => ({ date: new Date(u.date) })),
    activity: dto.activity.map((a) => ({ ...a, time: new Date(a.time) })),
    chatSummary: dto.chatSummary,
    // Client-side realtime-sim bookkeeping — not backend state.
    liveSimulated: false,
  }
}

function toSummary(dto: ConversationSummaryDto): ConversationSummary {
  return {
    ...dto,
    client: toClient(dto.client),
    lastMessage: {
      ...dto.lastMessage,
      time: new Date(dto.lastMessage.time),
    },
  }
}

export async function getConversations(
  signal?: AbortSignal,
): Promise<ConversationSummary[]> {
  const dtos = await get<ConversationSummaryDto[]>('/conversations', { signal })
  return dtos.map(toSummary)
}

// The list's tab chips + badge counts, computed server-side. No date fields, so
// this is a straight read (no DTO mapping).
export async function getConversationTabs(
  signal?: AbortSignal,
): Promise<ConversationTab[]> {
  return get<ConversationTab[]>('/conversations/tabs', { signal })
}

export async function getConversation(
  id: string,
  signal?: AbortSignal,
): Promise<Conversation> {
  const dto = await get<ConversationDto>(`/conversations/${id}`, { signal })
  return toConversation(dto)
}

export async function sendMessage(
  id: string,
  body: SendMessageBody,
): Promise<Conversation> {
  const dto = await post<ConversationDto>(`/conversations/${id}/messages`, body)
  return toConversation(dto)
}

export async function patchConversation(
  id: string,
  body: PatchConversationBody,
): Promise<Conversation> {
  const dto = await patch<ConversationDto>(`/conversations/${id}`, body)
  return toConversation(dto)
}

export async function setHandoff(
  id: string,
  handledBy: HandledBy,
): Promise<Conversation> {
  const dto = await patch<ConversationDto>(`/conversations/${id}/handoff`, {
    handledBy,
  })
  return toConversation(dto)
}

export async function addNote(
  id: string,
  body: AddNoteBody,
): Promise<Conversation> {
  const dto = await post<ConversationDto>(`/conversations/${id}/notes`, body)
  return toConversation(dto)
}
