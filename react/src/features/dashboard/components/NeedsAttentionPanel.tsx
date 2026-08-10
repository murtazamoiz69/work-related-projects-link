import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { CONVERSATIONS } from '@/features/chat'
import { Icon } from '@/components/atoms/Icon'
import { ClientActions } from '@/components/molecules/ClientActions'
import { WeekDayHeader, WeekDots } from '@/components/molecules/WeekDots'
import { useMiniTooltip } from '@/hooks/useMiniTooltip'
import {
  ATTN_FILTER_DEFS,
  buildFilteredAttentionList,
  dashCurrentWeekRangeLabel,
  dashFilterCounts,
  dashWeeklyProgress,
} from '../data'

const PAGE_SIZE = 8

export function NeedsAttentionPanel() {
  const [activeFilter, setActiveFilter] = useState('needs-attention')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollOnCollapse = useRef(false)
  const { show, hide, tooltip } = useMiniTooltip()

  // Scrolling here has to wait until *after* the collapsed (shorter) list
  // has actually committed to the DOM — scrolling before that targets the
  // still-expanded layout and lands short, stranding the user mid-page.
  useEffect(() => {
    if (!showAll && scrollOnCollapse.current) {
      scrollOnCollapse.current = false
      panelRef.current?.scrollIntoView({ block: 'start' })
    }
  }, [showAll])

  const counts = useMemo(() => dashFilterCounts(), [])
  const weekRange = useMemo(() => dashCurrentWeekRangeLabel(), [])

  const matches = useMemo(() => {
    const all = buildFilteredAttentionList([activeFilter])
    const q = search.trim().toLowerCase()
    return q
      ? all.filter((row) => row.client.name.toLowerCase().includes(q))
      : all
  }, [activeFilter, search])
  const shown = showAll ? matches : matches.slice(0, PAGE_SIZE)

  const selectFilter = (key: string) => {
    setActiveFilter(key)
    setShowAll(false)
  }

  // Collapsing the list shrinks the page above wherever the user had
  // scrolled to, leaving them stranded over unrelated content further down
  // — scroll back to the panel once it's actually collapsed (see the effect
  // above) so they land somewhere sensible instead.
  const collapse = () => {
    scrollOnCollapse.current = true
    setShowAll(false)
  }

  return (
    <div className="panel needs-attention" ref={panelRef}>
      <div className="panel-head">
        <div>
          <h2>Catch Up</h2>
          <p className="panel-sub">
            Users with an open chat request, unread messages, or recent activity
          </p>
        </div>
        {/* Search sits in the head, opposite the title, rather than in the
            filter row: it acts on the whole panel, and out of the chip row it
            no longer competes with the chips for one line. */}
        <div className="clients-search attn-head-search">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search by user name…"
            autoComplete="off"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowAll(false)
            }}
          />
        </div>
      </div>

      <div className="attn-filter-bar">
        {ATTN_FILTER_DEFS.map((chip) => (
          <button
            key={chip.key}
            className={`chip-filter${activeFilter === chip.key ? ' active' : ''}`}
            onClick={() => selectFilter(chip.key)}
          >
            {chip.label}
            <span className="chip-count">{counts[chip.key]}</span>
          </button>
        ))}
      </div>

      <div className="clients-table-wrap">
        <table className="client-table attn-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Why They&apos;re Here</th>
              {/* One weekday-letter row here instead of every row repeating
                  its own — every row's dots below line up under these same
                  seven columns (WeekDayHeader and WeekDots share the same
                  default 'md' column geometry). */}
              <th className="th-week">
                <div className="th-week-inner">
                  <span>
                    Weekly Progress{' '}
                    <span className="th-note">({weekRange})</span>
                  </span>
                  <WeekDayHeader />
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.length ? (
              shown.map(({ client, index, icon, text }) => {
                const week = dashWeeklyProgress(client, index)
                return (
                  <tr key={client.id}>
                    <td>
                      <div className="ct-client">
                        <Avatar
                          initials={client.initials}
                          color={client.color}
                          size="sm"
                        />
                        <div className="ct-client-id">
                          <span className="ct-name">{client.name}</span>
                          <span className="ct-sub">{client.program}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {/* The reason is the row's headline, so it's the thing
                          you click. Every reason here — an unanswered chat, a
                          missed workout, a logged meal — is answered on the
                          client's chat thread, which is also where the row's
                          message button goes. A real Link (not an onClick) so
                          middle-click and "open in new tab" behave. */}
                      <Link
                        to="/chat"
                        search={{
                          c: CONVERSATIONS.find(
                            (cv) => cv.client.id === client.id,
                          )?.id,
                        }}
                        className="attn-why"
                        title={`Open ${client.name}'s chat`}
                      >
                        <Icon name={icon} />
                        {text}
                      </Link>
                    </td>
                    <td>
                      <WeekDots
                        days={week}
                        onDotEnter={show}
                        onDotLeave={hide}
                      />
                    </td>
                    <td>
                      <ClientActions client={client} />
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={4}>
                  <p className="pw-muted">No users match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!showAll && matches.length > shown.length ? (
        <button className="link-btn view-all" onClick={() => setShowAll(true)}>
          Show all {matches.length} users <Icon name="arrow-right" />
        </button>
      ) : showAll && matches.length > PAGE_SIZE ? (
        <button className="link-btn view-all" onClick={collapse}>
          Show fewer users
        </button>
      ) : (
        <p className="pw-muted view-all">
          {matches.length} user{matches.length === 1 ? '' : 's'} match
          {matches.length === 1 ? 'es' : ''} your filters
        </p>
      )}

      {tooltip}
    </div>
  )
}
