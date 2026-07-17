import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ClientActions } from '@/components/molecules/ClientActions'
import { useMiniTooltip } from '@/hooks/useMiniTooltip'
import {
  ATTN_FILTER_DEFS,
  buildFilteredAttentionList,
  buildNeedsAttentionList,
  dashCurrentWeekRangeLabel,
  dashFilterCounts,
  dashWeeklyProgress,
} from '../data'
import type { AttentionRow } from '../types'

export function NeedsAttentionPanel() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(['needs-attention']),
  )
  const { show, hide, tooltip } = useMiniTooltip()

  const counts = useMemo(() => dashFilterCounts(), [])
  const weekRange = useMemo(() => dashCurrentWeekRangeLabel(), [])

  const filtered = activeFilters.size > 0
  const matches: AttentionRow[] = filtered
    ? buildFilteredAttentionList([...activeFilters])
    : buildNeedsAttentionList()
  const shown = matches.slice(0, filtered ? 8 : 6)

  const toggle = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="panel needs-attention">
      <div className="panel-head">
        <div>
          <h2>Catch Up</h2>
          <p className="panel-sub">
            Clients with an open chat request, unread messages, or recent
            activity
          </p>
        </div>
      </div>

      <div className="attn-filter-bar">
        {ATTN_FILTER_DEFS.map((chip) => (
          <button
            key={chip.key}
            className={`chip-filter${activeFilters.has(chip.key) ? ' active' : ''}`}
            onClick={() => toggle(chip.key)}
          >
            {chip.label}
            <span className="chip-count">{counts[chip.key]}</span>
          </button>
        ))}
        {activeFilters.size > 0 ? (
          <button
            className="link-btn attn-filter-clear"
            onClick={() => setActiveFilters(new Set())}
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="clients-table-wrap">
        <table className="client-table attn-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Why They&apos;re Here</th>
              <th>
                Weekly Progress <span className="th-note">({weekRange})</span>
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
                      <div className="attn-why">
                        <Icon name={icon} />
                        {text}
                      </div>
                    </td>
                    <td>
                      <div className="week-dots">
                        {week.map((d) => (
                          <span
                            key={d.daysAgo}
                            className={`week-dot tier-${d.tier}${d.isToday ? ' is-today' : ''}`}
                            onMouseEnter={(e) => show(e, d.popover)}
                            onMouseLeave={hide}
                          />
                        ))}
                      </div>
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
                  <p className="pw-muted">
                    No clients match {filtered ? 'these filters' : 'right now'}.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!filtered ? (
        <Link className="link-btn view-all" to="/clients">
          View all {matches.length} clients needing attention{' '}
          <Icon name="arrow-right" />
        </Link>
      ) : (
        <p className="pw-muted view-all">
          {matches.length} client{matches.length === 1 ? '' : 's'} match
          {matches.length === 1 ? 'es' : ''} your filters
        </p>
      )}

      {tooltip}
    </div>
  )
}
