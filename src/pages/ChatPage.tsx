import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Topbar } from '@/components/organisms/Topbar'
import { useClientsQuery, type Client } from '@/features/clients'
import { ConversationList } from '@/features/chat/components/ConversationList'
import { MessageThread } from '@/features/chat/components/MessageThread'
import { ClientOverview } from '@/features/chat/components/ClientOverview'
import { PlanWorkspaceOverlay } from '@/features/chat/plan-workspace'
import { ProgramProgressModal } from '@/features/chat/components/ProgramProgressModal'
import {
  useConversationQuery,
  useConversationsQuery,
  useConversationTabsQuery,
  useMarkRead,
  useSetStar,
} from '@/features/chat/hooks/useConversations'
import type { ConversationSummary } from '@/features/chat/api/chat.types'
import type { ChatTab } from '@/features/chat/types'

// Pinned first, then most-recent message — the default inbox ordering.
function mostRecent(
  summaries: ConversationSummary[],
): ConversationSummary | undefined {
  return [...summaries].sort((a, b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1
    return b.lastMessage.time.getTime() - a.lastMessage.time.getTime()
  })[0]
}

export function ChatPage({
  initialConversationId,
  openPlanWorkspace,
}: {
  initialConversationId?: string
  openPlanWorkspace?: boolean
}) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ChatTab>('inbox')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId ?? null,
  )
  const [planClient, setPlanClient] = useState<Client | null>(null)
  const [programClient, setProgramClient] = useState<Client | null>(null)
  const [planEverOpened, setPlanEverOpened] = useState(false)

  // Arriving from the Users page ("Manage Plan"): ?c= is the REAL client's
  // `conversationId`, not a mock conversation id. This page is then only a host
  // for the plan overlay — its own chat concerns (list, tabs, selected
  // conversation) stay dormant the whole time, so ?c= is never used to fetch a
  // (mock) conversation. Closing the overlay navigates back to /clients.
  const arrivingForPlan = Boolean(openPlanWorkspace)
  const chatIdle = !arrivingForPlan

  const listQuery = useConversationsQuery({ enabled: chatIdle })
  // Stable identity: the empty-fallback would otherwise be a new [] each render,
  // re-triggering the default-selection effect below.
  const listData = listQuery.data
  const summaries = useMemo(() => listData ?? [], [listData])
  const tabsQuery = useConversationTabsQuery({ enabled: chatIdle })
  const markRead = useMarkRead()
  const setStar = useSetStar()

  useEffect(() => {
    document.body.classList.add('chat-page')
    return () => document.body.classList.remove('chat-page')
  }, [])

  // Resolve the plan's client from the LIVE roster by conversationId — never
  // off the mock conversation, which opened the workspace against the wrong id.
  const planRosterQuery = useClientsQuery(
    { pageSize: 100 },
    { enabled: arrivingForPlan && !planEverOpened },
  )
  const realPlanClient =
    arrivingForPlan && selectedId
      ? planRosterQuery.data?.items.find((c) => c.conversationId === selectedId)
      : undefined
  useEffect(() => {
    if (arrivingForPlan && realPlanClient && !planEverOpened) {
      setPlanEverOpened(true)
      setPlanClient(realPlanClient)
    }
  }, [arrivingForPlan, realPlanClient, planEverOpened])

  // The roster loaded (or failed) and there's no client for this ?c= — surface
  // it instead of hanging on the "opening…" skeleton forever.
  const planLookupFailed =
    arrivingForPlan &&
    !planEverOpened &&
    !!selectedId &&
    (planRosterQuery.isError || (planRosterQuery.isSuccess && !realPlanClient))

  // Default selection once the list loads — honour a valid ?c=, else the most
  // recent conversation.
  useEffect(() => {
    if (!chatIdle) return
    if (!summaries.length) return
    if (selectedId && summaries.some((s) => s.id === selectedId)) return
    const first = mostRecent(summaries)
    if (first) setSelectedId(first.id)
  }, [summaries, selectedId, chatIdle])

  const detailQuery = useConversationQuery(chatIdle ? selectedId : null)
  const current = detailQuery.data ?? null

  // Opening a conversation clears its unread.
  useEffect(() => {
    if (current && current.unread) markRead.mutate(current.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  // Show the neutral placeholder only for the *first* open — the gap before the
  // overlay appears. Once it has opened, closing it (planClient back to null)
  // must reveal the conversation behind it, not the placeholder again.
  const openingPlan =
    arrivingForPlan && !planClient && !planEverOpened && !planLookupFailed

  return (
    <>
      {/* The thread header names who you're talking to, so the Topbar carries
          only the account chip here. */}
      <Topbar />
      <main className="content chat-content">
        {planLookupFailed ? (
          <div className="chat-shell chat-shell-opening">
            <div className="clients-empty is-error" role="alert">
              <p>We couldn’t open the plan for that user.</p>
              <button
                className="link-btn"
                onClick={() => navigate({ to: '/clients' })}
              >
                Back to Users
              </button>
            </div>
          </div>
        ) : openingPlan ? (
          <div
            className="chat-shell chat-shell-opening"
            aria-busy="true"
            aria-label="Opening plan workspace"
          >
            <span className="skel" style={{ width: 220, height: 16 }} />
          </div>
        ) : (
          <div className="chat-shell">
            <ConversationList
              summaries={summaries}
              tabs={tabsQuery.data ?? []}
              loading={listQuery.isPending}
              tab={tab}
              query={query}
              selectedId={selectedId}
              onTab={setTab}
              onQuery={setQuery}
              onSelect={setSelectedId}
              onToggleStar={(id, starred) => setStar.mutate({ id, starred })}
            />

            {current ? (
              <MessageThread
                key={`thread-${current.id}`}
                convo={current}
                onManagePlan={() => setPlanClient(current.client)}
                onViewProgram={() => setProgramClient(current.client)}
              />
            ) : (
              <section className="chat-center-col" />
            )}

            {current ? (
              <ClientOverview key={`overview-${current.id}`} convo={current} />
            ) : (
              <aside className="chat-right-col">
                <div className="chat-right-scroll" />
              </aside>
            )}
          </div>
        )}
      </main>

      {planClient ? (
        <PlanWorkspaceOverlay
          client={planClient}
          onClose={() => {
            setPlanClient(null)
            // Came from the Users page — go back there, not to a mock chat.
            if (arrivingForPlan) navigate({ to: '/clients' })
          }}
        />
      ) : null}

      {programClient ? (
        <ProgramProgressModal
          client={programClient}
          onClose={() => setProgramClient(null)}
        />
      ) : null}
    </>
  )
}
