import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { showToast } from '@/lib/toast'
import {
  BroadcastConfirmDialog,
  BroadcastSummaryCards,
  BroadcastTableRow,
  broadcastSummary,
  deliverBroadcast,
  useBroadcastsStore,
} from '@/features/broadcasts'
import type { Broadcast, BroadcastMenuAction } from '@/features/broadcasts'

type SortKey = 'recent' | 'oldest' | 'scheduled' | 'title'
const PAGE_SIZE = 10

export function BroadcastsListPage() {
  const navigate = useNavigate()
  const broadcasts = useBroadcastsStore((s) => s.broadcasts)
  const setBroadcasts = useBroadcastsStore((s) => s.setBroadcasts)
  const commit = useBroadcastsStore((s) => s.commit)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<SortKey>('recent')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<Broadcast | null>(null)

  const summary = useMemo(() => broadcastSummary(broadcasts), [broadcasts])
  const anyBroadcastsAtAll = summary.total > 0

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = broadcasts.filter((b) => {
      if (b.trashed) return false
      // The Draft status is a retired, internal-only value (see
      // BroadcastStatus) — it must never surface in this grid.
      if (b.status === 'draft') return false
      if (status !== 'all' && b.status !== status) return false
      if (q && !b.title.toLowerCase().includes(q)) return false
      return true
    })
    const sorted = [...filtered]
    switch (sort) {
      case 'oldest':
        sorted.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime())
        break
      case 'scheduled':
        sorted.sort((a, b) => {
          const at = a.scheduleDate
            ? new Date(a.scheduleDate).getTime()
            : Infinity
          const bt = b.scheduleDate
            ? new Date(b.scheduleDate).getTime()
            : Infinity
          return at - bt
        })
        break
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        sorted.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime())
    }
    return sorted
  }, [broadcasts, search, status, sort])

  useEffect(() => {
    setPage(1)
  }, [search, status, sort])

  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = list.slice(start, start + PAGE_SIZE)
  const noResults = total === 0
  const hasFilters = status !== 'all' || search.trim().length > 0

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
  }

  const goCreate = () =>
    navigate({ to: '/broadcast/$broadcastId', params: { broadcastId: 'new' } })

  const handleAction = (action: BroadcastMenuAction, b: Broadcast) => {
    const name = b.title.trim() || 'Untitled Broadcast'
    if (action === 'edit') {
      navigate({
        to: '/broadcast/$broadcastId',
        params: { broadcastId: b.id },
        search: { edit: true },
      })
    } else if (action === 'duplicate') {
      const copy = JSON.parse(JSON.stringify(b)) as Broadcast
      copy.id = `bc-copy-${Date.now()}`
      copy.title = `Copy of "${name}"`
      copy.status = 'draft'
      copy.timing = 'now'
      copy.scheduleDate = ''
      copy.scheduleTime = ''
      copy.createdDate = new Date()
      copy.updatedDate = new Date()
      setBroadcasts((prev) => [copy, ...prev])
      showToast(`Duplicated “${name}”`)
    } else if (action === 'delete') {
      setConfirmDelete(b)
    } else if (action === 'publish-now') {
      b.status = 'published'
      b.timing = 'now'
      b.updatedDate = new Date()
      deliverBroadcast(b)
      commit()
      showToast(`“${name}” published`)
    } else if (action === 'cancel-schedule') {
      b.status = 'draft'
      b.timing = 'now'
      b.scheduleDate = ''
      b.scheduleTime = ''
      b.updatedDate = new Date()
      commit()
      showToast(`“${name}” schedule canceled — moved back to Draft`)
    }
  }

  return (
    <>
      <Topbar
        title="Broadcast Messages"
        subtitle="Manage and schedule broadcast messages for your users."
      />
      <main className="content">
        <BroadcastSummaryCards summary={summary} />

        <section className="panel programs-toolbar">
          <div className="programs-toolbar-row">
            <div className="clients-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search by Broadcast Title"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="clients-filters">
              <select
                className="select-range"
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
              <select
                className="select-range"
                aria-label="Sort broadcasts"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="recent">Recently Created</option>
                <option value="oldest">Oldest First</option>
                <option value="scheduled">Scheduled Date</option>
                <option value="title">Broadcast Title (A–Z)</option>
              </select>
            </div>

            <button className="btn-primary" onClick={goCreate}>
              <Icon name="plus" />
              Create Broadcast
            </button>
          </div>
        </section>

        <section className="panel programs-panel">
          <div className="panel-head">
            <div>
              <h2>All Broadcasts</h2>
              <p className="panel-sub">
                {noResults
                  ? 'No broadcasts match your filters'
                  : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total} broadcasts`}
              </p>
            </div>
          </div>

          {!anyBroadcastsAtAll ? (
            <div className="clients-empty">
              <Icon name="megaphone" />
              <p className="clients-empty-title">No Broadcasts Yet</p>
              <p>Create your first broadcast to send messages to your users.</p>
              <button className="btn-primary" onClick={goCreate}>
                <Icon name="plus" />
                Create Broadcast
              </button>
            </div>
          ) : noResults ? (
            <div className="clients-empty">
              <Icon name="search-x" />
              <p>No broadcasts match your filters</p>
              {hasFilters ? (
                <button className="link-btn" onClick={clearFilters}>
                  Clear all filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="clients-table-wrap">
              <table className="client-table prog-table broadcasts-table">
                <thead>
                  <tr>
                    <th>Broadcast Title</th>
                    <th>Template</th>
                    <th>Audience</th>
                    <th>Recipients</th>
                    <th>Scheduled On</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((b) => (
                    <BroadcastTableRow
                      key={b.id}
                      broadcast={b}
                      onAction={handleAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!noResults ? (
            <div className="clients-pagination">
              <span className="clients-page-info">
                Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of{' '}
                {total} broadcasts
              </span>
              <div className="pagination-btns">
                <button
                  className="btn-secondary sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Icon name="chevron-left" />
                  Previous
                </button>
                <button
                  className="btn-secondary sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <Icon name="chevron-right" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      {confirmDelete ? (
        <BroadcastConfirmDialog
          title="Delete this broadcast?"
          message={`"${confirmDelete.title.trim() || 'Untitled Broadcast'}" will be permanently removed.`}
          confirmText="Delete"
          danger
          onConfirm={() => {
            setBroadcasts((prev) =>
              prev.filter((x) => x.id !== confirmDelete.id),
            )
            showToast('Broadcast deleted')
          }}
          onClose={() => setConfirmDelete(null)}
        />
      ) : null}
    </>
  )
}
