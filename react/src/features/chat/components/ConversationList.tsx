import { Icon } from '@/components/atoms/Icon'
import { Avatar } from '@/components/atoms/Avatar'
import { conversationsForTab, filterConversations, timeAgoShort } from '../data'
import type { ChatTab, Conversation } from '../types'

const BASE_TABS: { id: ChatTab; label: string }[] = [
  { id: 'inbox', label: 'All' },
  { id: 'waiting', label: 'Needs Attention' },
  { id: 'new', label: 'New' },
  { id: 'active', label: 'Active' },
]
const STARRED_TAB: { id: ChatTab; label: string } = {
  id: 'starred',
  label: 'Pinned',
}

function ConvoCard({
  c,
  selected,
  onSelect,
  onToggleStar,
}: {
  c: Conversation
  selected: boolean
  onSelect: (id: string) => void
  onToggleStar: (id: string) => void
}) {
  const last = c.messages[c.messages.length - 1]
  const preview = (last.attachment ? '📎 ' : '') + last.text
  const needsNutritionist = c.status === 'waiting'
  return (
    <li>
      <div
        className={`convo-card${selected ? ' selected' : ''}${c.unread ? ' unread' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(c.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(c.id)
          }
        }}
      >
        <span className="convo-avatar-wrap">
          <Avatar
            initials={c.client.initials}
            color={c.client.color}
            size="sm"
          />
          {c.unread ? <span className="convo-unread-dot" /> : null}
        </span>
        <span className="convo-body">
          <span className="convo-row1">
            <span className="convo-name">{c.client.name}</span>
            <span className="convo-row1-right">
              <button
                className={`convo-star${c.starred ? ' starred' : ''}`}
                title={c.starred ? 'Unpin from top' : 'Pin to top'}
                aria-label={
                  c.starred ? 'Unpin conversation' : 'Pin conversation'
                }
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStar(c.id)
                }}
              >
                <Icon name="star" />
              </button>
              <span className="convo-time">{timeAgoShort(last.time)}</span>
            </span>
          </span>
          <span className="convo-preview">{preview}</span>
          <span className="convo-row3">
            <span
              className={`convo-tag ${needsNutritionist ? 'convo-tag-needs' : 'convo-tag-ai'}`}
            >
              {needsNutritionist ? (
                <>
                  <Icon name="user-round" />
                  Needs nutritionist
                </>
              ) : (
                <>
                  <Icon name="bot" />
                  AI is talking
                </>
              )}
            </span>
          </span>
        </span>
      </div>
    </li>
  )
}

export function ConversationList({
  tab,
  query,
  selectedId,
  onTab,
  onQuery,
  onSelect,
  onToggleStar,
}: {
  tab: ChatTab
  query: string
  selectedId: string | null
  onTab: (t: ChatTab) => void
  onQuery: (q: string) => void
  onSelect: (id: string) => void
  onToggleStar: (id: string) => void
}) {
  const list = filterConversations(conversationsForTab(tab), query)
  const hasStarred = conversationsForTab('starred').length > 0
  const tabs = hasStarred
    ? [BASE_TABS[0], BASE_TABS[1], STARRED_TAB, BASE_TABS[2], BASE_TABS[3]]
    : BASE_TABS

  return (
    <aside className="chat-list-col">
      <div className="chat-list-search">
        <Icon name="search" />
        <input
          type="text"
          placeholder="Search conversations…"
          autoComplete="off"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>

      <div className="chat-tabs" role="tablist">
        {tabs.map((t) => {
          const tabConvos = conversationsForTab(t.id)
          const total = tabConvos.length
          const unread = tabConvos.filter((c) => c.unread).length
          return (
            <button
              key={t.id}
              className={`chat-tab${tab === t.id ? ' active' : ''}`}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTab(t.id)}
            >
              {t.label}
              <span className="chat-tab-total">{total}</span>
              {unread > 0 && unread < total ? (
                <span className="chat-tab-count">{unread}</span>
              ) : null}
            </button>
          )
        })}
      </div>

      <ul className="chat-convo-list">
        {list.length ? (
          list.map((c) => (
            <ConvoCard
              key={c.id}
              c={c}
              selected={c.id === selectedId}
              onSelect={onSelect}
              onToggleStar={onToggleStar}
            />
          ))
        ) : (
          <li className="convo-empty">
            <Icon name="search-x" />
            <span>No conversations match</span>
          </li>
        )}
      </ul>
    </aside>
  )
}
