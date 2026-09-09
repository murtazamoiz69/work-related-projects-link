// Stateful mock "backend" for conversations. Seeded from the same CONVERSATIONS
// data the rest of the app derives from (mapped to DTO), but kept as an
// independent in-session store so chat mutations (send / star / handoff / note)
// don't mutate the shared seed the not-yet-migrated Plan Workspace still reads.
// Reset with resetChatStore() in tests.
import { toClient, toClientDto } from '@/features/clients'
import { findClientDto } from '@/features/clients/api/clients.mock'
import type { ClientDto } from '@/features/clients'
import { CONVERSATIONS, buildConversation } from '../data'
import type { Conversation, EscalationSeverity, HandledBy } from '../types'
import type {
  AddNoteBody,
  ConversationDto,
  ConversationSummaryDto,
  ConversationTab,
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
    escalations: c.escalations.map((e) => ({
      ...e,
      raisedAt: e.raisedAt.toISOString(),
      resolvedAt: e.resolvedAt ? e.resolvedAt.toISOString() : null,
    })),
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

/** Highest-severity unresolved escalation, oldest-first within a severity —
 *  the same ordering ../escalations.ts applies on the domain side, computed
 *  here so the list row never has to fetch a whole conversation to render its
 *  tag. */
function topEscalationOf(
  c: ConversationDto,
): ConversationSummaryDto['topEscalation'] {
  const rank: Record<EscalationSeverity, number> = {
    high: 3,
    medium: 2,
    soft: 1,
  }
  const open = c.escalations.filter((e) => !e.resolved)
  if (!open.length) return null
  const top = [...open].sort((a, b) => {
    const bySeverity = (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0)
    if (bySeverity !== 0) return bySeverity
    return Date.parse(a.raisedAt) - Date.parse(b.raisedAt)
  })[0]
  return { id: top.id, severity: top.severity }
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
    topEscalation: topEscalationOf(c),
  }
}

export function listConversationSummaries(): ConversationSummaryDto[] {
  return [...store.values()].map(withCurrentClient).map(summaryOf)
}

// Server-computed conversation-list tabs + badge counts, over the whole store.
// A `predicate` per tab mirrors the list's own filtering; `total`/`unread` are
// counts, not a page. Pinned is included only when something is pinned, matching
// the UI's conditional tab. Real backend owns this so a paginated list still
// gets correct badges.
export function conversationTabs(): ConversationTab[] {
  const all = [...store.values()]
  const count = (predicate: (c: ConversationDto) => boolean): number =>
    all.filter(predicate).length
  const unread = (predicate: (c: ConversationDto) => boolean): number =>
    all.filter((c) => predicate(c) && c.unread > 0).length

  const defs: { tab: ConversationTab; when?: boolean }[] = [
    { tab: mkTab('inbox', 'All', () => true) },
    { tab: mkTab('waiting', 'Needs Attention', (c) => c.status === 'waiting') },
    // Always present, even at zero. A tab that appears only once something is
    // pinned leaves the star with nowhere to point, and the destination
    // shifting position as the count changes is worse than an empty tab.
    { tab: mkTab('starred', 'Pinned', (c) => c.starred) },
    { tab: mkTab('new', 'New', (c) => c.client.status === 'new') },
    { tab: mkTab('active', 'Active', (c) => c.status === 'active') },
  ]
  return defs.filter((d) => d.when !== false).map((d) => d.tab)

  function mkTab(
    id: ConversationTab['id'],
    label: string,
    predicate: (c: ConversationDto) => boolean,
  ): ConversationTab {
    return { id, label, total: count(predicate), unread: unread(predicate) }
  }
}

/** The chat store keeps its own copy of the client record so chat mutations
 *  don't write into the clients seed. That copy goes stale the moment the
 *  clients store changes — a diet-plan sign-off, an access change — so refresh
 *  it on read. A real backend joins the current user row server-side; this is
 *  the mock standing in for that. */
function withCurrentClient(c: ConversationDto): ConversationDto {
  const current = findClientDto(c.client.id)
  return current ? { ...c, client: current } : c
}

export function getConversationDto(id: string): ConversationDto | undefined {
  const c = store.get(id)
  return c ? withCurrentClient(c) : undefined
}

/** Open a thread for a user the clients mock just created, so their row's
 *  "Open chat" / "Manage" actions resolve instead of 404-ing. Called by the
 *  clients POST handlers — the real backend would do this server-side at
 *  creation time and hand back the `conversationId` it minted. */
export function createConversationForClient(client: ClientDto): void {
  const conversation = buildConversation(toClient(client), store.size)
  const dto = toConversationDto(conversation)
  store.set(dto.id, dto)
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

export function resolveEscalationDto(
  id: string,
  escalationId: string,
  resolved: boolean,
): ConversationDto | undefined {
  const c = store.get(id)
  if (!c) return undefined
  const e = c.escalations.find((x) => x.id === escalationId)
  if (!e) return undefined
  e.resolved = resolved
  e.resolvedAt = resolved ? new Date().toISOString() : null
  e.resolvedBy = resolved ? 'Sarah Nolan' : null
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
