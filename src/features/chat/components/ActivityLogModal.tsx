import { useEffect, useId, useRef } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Backdrop } from '@/components/molecules/Backdrop'
import { ActivityFilterBar } from './ActivityFilterBar'
import { ActivityLogList } from './ActivityLogList'
import { useActivityFilters } from '../hooks/useActivityFilters'
import type { ChatActivityItem } from '../types'

// Range + volume of what's on screen, so the header says what this log
// actually covers instead of only whose it is. Matches ActivityLogList's own
// filter (logged only, nothing upcoming) so this count is never higher than
// the number of rows actually below it.
function summarize(items: ChatActivityItem[]): string {
  const logged = items.filter((i) => !i.upcoming)
  if (!logged.length) return 'No activity logged yet'

  const times = logged.map((i) => i.time.getTime())
  const fmt = (t: number) =>
    new Date(t).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  const from = fmt(Math.min(...times))
  const to = fmt(Math.max(...times))
  const range = from === to ? from : `${from} to ${to}`
  return `${logged.length} ${logged.length === 1 ? 'entry' : 'entries'} · ${range}`
}

export function ActivityLogModal({
  clientName,
  items,
  onClose,
}: {
  clientName: string
  items: ChatActivityItem[]
  onClose: () => void
}) {
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Same filter set as the Plan Workspace's Activity tab (kind chips, sub-
  // category, search, date range) — this modal is the other place a
  // nutritionist reads a client's full activity log, so it should offer the
  // same way to narrow it rather than a stripped-down one-off.
  const filters = useActivityFilters(items, clientName)

  // Dialog behaviour the overlay-click alone didn't cover: Escape closes,
  // focus starts inside and is returned to whatever opened the modal, Tab
  // stays within the card, and the page behind it stops scrolling.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // The photo lightbox opens on top of this modal and listens for
        // Escape on the same document node, where stopPropagation between
        // two listeners on one node does nothing. Let the topmost layer
        // take the key so one Escape doesn't dismiss both at once.
        if (document.querySelector('.photo-lightbox-overlay')) return
        onClose()
        return
      }
      if (e.key !== 'Tab' || !cardRef.current) return
      const focusable = cardRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <Backdrop className="modal-overlay" onClose={onClose}>
      <div
        className="modal-card activity-log-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={cardRef}
      >
        <div className="modal-head">
          <div className="activity-log-headings">
            <h3 id={titleId}>
              <Icon name="activity" className="inline-icon" />
              {clientName}’s Activity
            </h3>
            <p className="activity-log-subtitle">
              {filters.filterActive
                ? `${filters.filtered.length} of ${filters.total} ${filters.total === 1 ? 'entry' : 'entries'}`
                : summarize(items)}
            </p>
          </div>
          <div className="activity-log-head-actions">
            <div className="clients-search activity-head-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search activity…"
                autoComplete="off"
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
              />
            </div>
            <button
              className="icon-btn sm"
              onClick={onClose}
              aria-label="Close activity log"
              ref={closeRef}
            >
              <Icon name="x" />
            </button>
          </div>
        </div>
        <div className="activity-log-filters">
          <ActivityFilterBar
            items={items}
            activeKinds={filters.activeKinds}
            isKindActive={filters.isKindActive}
            onToggleKind={filters.toggleKind}
            onClearAll={filters.clearAll}
            categoriesByKind={filters.categoriesByKind}
            onToggleCategory={filters.toggleCategory}
            onClearCategories={filters.clearCategories}
            search={filters.search}
            rangeDays={filters.rangeDays}
            onRangeChange={filters.setRangeDays}
          />
        </div>
        <div className="activity-log-body">
          <ActivityLogList
            items={filters.filtered}
            emptyMessage={filters.emptyMessage}
          />
        </div>
      </div>
    </Backdrop>
  )
}
