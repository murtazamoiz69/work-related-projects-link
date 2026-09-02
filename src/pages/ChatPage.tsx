import { useEffect, useMemo, useRef, useState } from 'react'
import { Topbar } from '@/components/organisms/Topbar'
import type { Client } from '@/features/clients'
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
  const [tab, setTab] = useState<ChatTab>('inbox')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId ?? null,
  )
  const [planClient, setPlanClient] = useState<Client | null>(null)
  const [programClient, setProgramClient] = useState<Client | null>(null)

  const listQuery = useConversationsQuery()
  // Stable identity: the empty-fallback would otherwise be a new [] each render,
  // re-triggering the default-selection effect below.
  const listData = listQuery.data
  const summaries = useMemo(() => listData ?? [], [listData])
  const tabsQuery = useConversationTabsQuery()
  const markRead = useMarkRead()
  const setStar = useSetStar()

  useEffect(() => {
    document.body.classList.add('chat-page')
    return () => document.body.classList.remove('chat-page')
  }, [])

  // Default selection once the list loads — honour a valid ?c=, else the most
  // recent conversation.
  useEffect(() => {
    if (!summaries.length) return
    if (selectedId && summaries.some((s) => s.id === selectedId)) return
    const first = mostRecent(summaries)
    if (first) setSelectedId(first.id)
  }, [summaries, selectedId])

  const detailQuery = useConversationQuery(selectedId)
  const current = detailQuery.data ?? null

  // Opening a conversation clears its unread.
  useEffect(() => {
    if (current && current.unread) markRead.mutate(current.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  // Arriving via "Manage Plan" opens the workspace as soon as we have the
  // client for ?c= — from the loaded detail, or the list summary if that lands
  // first — so we don't wait on the slower of the two.
  const planTarget =
    current?.client ??
    (selectedId
      ? summaries.find((s) => s.id === selectedId)?.client
      : undefined)
  const planOpened = useRef(false)
  useEffect(() => {
    if (openPlanWorkspace && planTarget && !planOpened.current) {
      planOpened.current = true
      setPlanClient(planTarget)
    }
  }, [openPlanWorkspace, planTarget])

  // Until that overlay is up, don't paint the chat behind it — arriving via
  // Manage Plan should go straight to the workspace, not flash the inbox first.
  const openingPlan = openPlanWorkspace && !planClient

  return (
    <>
      {/* The thread header names who you're talking to, so the Topbar carries
          only the account chip here. */}
      <Topbar />
      <main className="content chat-content">
        {openingPlan ? (
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
          onClose={() => setPlanClient(null)}
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
