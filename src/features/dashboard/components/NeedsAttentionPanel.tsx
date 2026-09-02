import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ClientActions } from '@/components/molecules/ClientActions'
import { WeekDayHeader, WeekDots } from '@/components/molecules/WeekDots'
import { apiErrorMessage } from '@/lib/api/errors'
import { useMiniTooltip } from '@/hooks/useMiniTooltip'
import { useNeedsAttentionQuery } from '../hooks/useDashboardQueries'

const PAGE_SIZE = 8

export function NeedsAttentionPanel() {
  const [activeFilter, setActiveFilter] = useState('needs-attention')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollOnCollapse = useRef(false)
  const { show, hide, tooltip } = useMiniTooltip()

  const { data, isPending, isError, error, refetch, isFetching } =
    useNeedsAttentionQuery(activeFilter)

  // Scrolling here has to wait until *after* the collapsed (shorter) list
  // has actually committed to the DOM — scrolling before that targets the
  // still-expanded layout and lands short, stranding the user mid-page.
  useEffect(() => {
    if (!showAll && scrollOnCollapse.current) {
      scrollOnCollapse.current = false
      panelRef.current?.scrollIntoView({ block: 'start' })
    }
  }, [showAll])

  const filters = data?.filters ?? []
  const counts = data?.counts ?? {}
  const weekRange = data?.weekRange ?? ''

  const matches = useMemo(() => {
    const all = data?.rows ?? []
    const q = search.trim().toLowerCase()
    return q
      ? all.filter((row) => row.client.name.toLowerCase().includes(q))
      : all
  }, [data, search])
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
        {filters.map((chip) => (
          <button
            key={chip.key}
            className={`chip-filter${activeFilter === chip.key ? ' active' : ''}`}
            onClick={() => selectFilter(chip.key)}
          >
            {chip.label}
            <span className="chip-count">{counts[chip.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="clients-table-wrap" aria-busy={isFetching || undefined}>
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
            {isPending ? (
              <tr>
                <td colSpan={4}>
                  <p className="pw-muted" aria-busy="true">
                    Loading…
                  </p>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4}>
                  <p className="pw-muted" role="alert">
                    {apiErrorMessage(error)}{' '}
                    <button className="link-btn" onClick={() => refetch()}>
                      Try again
                    </button>
                  </p>
                </td>
              </tr>
            ) : shown.length ? (
              shown.map(({ client, icon, text, week }) => (
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
                    {/* The reason is the row's headline, so it's the thing you
                        click — every reason is answered on the client's chat
                        thread. A real Link (not an onClick) so middle-click and
                        "open in new tab" behave. */}
                    <Link
                      to="/chat"
                      search={{ c: client.conversationId }}
                      className="attn-why"
                      title={`Open ${client.name}'s chat`}
                    >
                      <Icon name={icon} />
                      {text}
                    </Link>
                  </td>
                  <td>
                    <WeekDots days={week} onDotEnter={show} onDotLeave={hide} />
                  </td>
                  <td>
                    <ClientActions client={client} />
                  </td>
                </tr>
              ))
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

      {!isPending && !isError ? (
        !showAll && matches.length > shown.length ? (
          <button
            className="link-btn view-all"
            onClick={() => setShowAll(true)}
          >
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
        )
      ) : null}

      {tooltip}
    </div>
  )
}
