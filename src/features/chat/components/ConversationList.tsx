import { Icon } from '@/components/atoms/Icon'
import { Avatar } from '@/components/atoms/Avatar'
import { timeAgoShort } from '../data'
import type { ConversationSummary } from '../api/chat.types'
import type { ChatTab } from '../types'

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

// Pinned float to the top, then most-recent message first — matches the
// original conversationsForTab ordering, on summaries.
function summariesForTab(
  tab: ChatTab,
  all: ConversationSummary[],
): ConversationSummary[] {
  const base =
    tab === 'inbox'
      ? all
      : tab === 'new'
        ? all.filter((c) => c.client.status === 'new')
        : tab === 'starred'
          ? all.filter((c) => c.starred)
          : all.filter((c) => c.status === tab)
  return base.slice().sort((a, b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1
    return b.lastMessage.time.getTime() - a.lastMessage.time.getTime()
  })
}

function filterSummaries(
  list: ConversationSummary[],
  query: string,
): ConversationSummary[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (c) =>
      c.client.name.toLowerCase().includes(q) ||
      c.lastMessage.text.toLowerCase().includes(q),
  )
}

function ConvoCard({
  c,
  selected,
  onSelect,
  onToggleStar,
}: {
  c: ConversationSummary
  selected: boolean
  onSelect: (id: string) => void
  onToggleStar: (id: string, starred: boolean) => void
}) {
  const preview =
    (c.lastMessage.hasAttachment ? '📎 ' : '') + c.lastMessage.text
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
                  onToggleStar(c.id, !c.starred)
                }}
              >
                <Icon name="star" />
              </button>
              <span className="convo-time">
                {timeAgoShort(c.lastMessage.time)}
              </span>
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
  summaries,
  loading,
  tab,
  query,
  selectedId,
  onTab,
  onQuery,
  onSelect,
  onToggleStar,
}: {
  summaries: ConversationSummary[]
  loading: boolean
  tab: ChatTab
  query: string
  selectedId: string | null
  onTab: (t: ChatTab) => void
  onQuery: (q: string) => void
  onSelect: (id: string) => void
  onToggleStar: (id: string, starred: boolean) => void
}) {
  const list = filterSummaries(summariesForTab(tab, summaries), query)
  const hasStarred = summaries.some((c) => c.starred)
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
          const tabConvos = summariesForTab(t.id, summaries)
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
        {loading ? (
          <li className="convo-empty" aria-busy="true">
            <span className="skel skel-wide" />
          </li>
        ) : list.length ? (
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
