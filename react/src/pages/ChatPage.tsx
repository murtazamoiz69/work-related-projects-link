import { useEffect, useMemo, useReducer, useState } from 'react'
import { Topbar } from '@/components/organisms/Topbar'
import type { Client } from '@/features/clients'
import {
  CONVERSATIONS,
  conversationsForTab,
  filterConversations,
} from '@/features/chat/data'
import { ConversationList } from '@/features/chat/components/ConversationList'
import { MessageThread } from '@/features/chat/components/MessageThread'
import { ClientOverview } from '@/features/chat/components/ClientOverview'
import { PlanWorkspaceOverlay } from '@/features/chat/plan-workspace'
import type { ChatTab } from '@/features/chat/types'

export function ChatPage({
  initialConversationId,
}: {
  initialConversationId?: string
}) {
  const [tab, setTab] = useState<ChatTab>('inbox')
  const [query, setQuery] = useState('')
  const [, refresh] = useReducer((x: number) => x + 1, 0)
  const [planClient, setPlanClient] = useState<Client | null>(null)

  const initialId = useMemo(() => {
    if (initialConversationId && CONVERSATIONS.some((c) => c.id === initialConversationId))
      return initialConversationId
    const first = filterConversations(conversationsForTab('inbox'), '')[0] ?? CONVERSATIONS[0]
    return first ? first.id : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selectedId, setSelectedId] = useState<string | null>(initialId)

  useEffect(() => {
    document.body.classList.add('chat-page')
    return () => document.body.classList.remove('chat-page')
  }, [])

  // Opening a conversation clears its unread state.
  useEffect(() => {
    const convo = CONVERSATIONS.find((c) => c.id === selectedId)
    if (convo && convo.unread) {
      convo.unread = 0
      refresh()
    }
  }, [selectedId])

  const current = CONVERSATIONS.find((c) => c.id === selectedId) ?? null

  const selectConversation = (id: string) => {
    const convo = CONVERSATIONS.find((c) => c.id === id)
    if (!convo) return
    convo.unread = 0
    setSelectedId(id)
  }

  const toggleStar = (id: string) => {
    const convo = CONVERSATIONS.find((c) => c.id === id)
    if (convo) {
      convo.starred = !convo.starred
      refresh()
    }
  }

  return (
    <>
      <Topbar title="Chat" subtitle="Every client conversation, live with Nourish AI" />
      <main className="content chat-content">
        <div className="chat-shell">
          <ConversationList
            tab={tab}
            query={query}
            selectedId={selectedId}
            onTab={setTab}
            onQuery={setQuery}
            onSelect={selectConversation}
            onToggleStar={toggleStar}
          />

          {current ? (
            <MessageThread
              key={`thread-${current.id}`}
              convo={current}
              refresh={refresh}
              onManagePlan={() => setPlanClient(current.client)}
            />
          ) : (
            <section className="chat-center-col" />
          )}

          {current ? (
            <ClientOverview
              key={`overview-${current.id}`}
              convo={current}
              onManagePlan={() => setPlanClient(current.client)}
              refresh={refresh}
            />
          ) : (
            <aside className="chat-right-col">
              <div className="chat-right-scroll" />
            </aside>
          )}
        </div>
      </main>

      {planClient ? (
        <PlanWorkspaceOverlay client={planClient} onClose={() => setPlanClient(null)} />
      ) : null}
    </>
  )
}
