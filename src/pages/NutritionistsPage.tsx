import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  useNutritionistsQuery,
  useUpdateNutritionistAccess,
  type ListNutritionistsParams,
  type Nutritionist,
  type NutritionistStatusFilter,
  type NutritionistsSearch,
} from '@/features/nutritionists'
import { NutritionistTableRow } from '@/features/nutritionists/components/NutritionistTableRow'
import { NutritionistFormModal } from '@/features/nutritionists/components/NutritionistFormModal'
import { NutritionistMembersModal } from '@/features/nutritionists/components/NutritionistMembersModal'

const PAGE_SIZE = 12

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <tr key={i}>
          <td>
            <span className="skel skel-wide" />
          </td>
          <td>
            <span className="skel" />
          </td>
          <td>
            <span className="skel skel-narrow" />
          </td>
          <td>
            <span className="skel skel-narrow" />
          </td>
          <td>
            <span className="skel skel-narrow" />
          </td>
          <td>
            <span className="skel skel-narrow" />
          </td>
          <td>
            <span className="skel skel-narrow" />
          </td>
        </tr>
      ))}
    </>
  )
}

// Every nutritionist can manage the others — same roster pattern as the Users
// section, pointed at nutritionists. Data flows through the nutritionists api
// via query hooks; no component touches HTTP.
export function NutritionistsPage({ search }: { search: NutritionistsSearch }) {
  const navigate = useNavigate()

  const q = search.q ?? ''
  const status: NutritionistStatusFilter = search.status ?? 'all'
  const page = search.page ?? 1

  const [searchInput, setSearchInput] = useState(q)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Nutritionist | null>(null)
  const [membersTarget, setMembersTarget] = useState<Nutritionist | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Nutritionist | null>(null)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === q) return
    const t = setTimeout(() => {
      navigate({
        to: '/nutritionists',
        // Built from this route's own typed search rather than the reducer's
        // `prev`, which is the union across every route and carries a wider
        // `status` than this one accepts.
        search: {
          status: search.status,
          q: trimmed || undefined,
          page: undefined,
        },
      })
    }, 250)
    return () => clearTimeout(t)
  }, [searchInput, q, navigate, search.status])

  const params: ListNutritionistsParams = useMemo(
    () => ({ search: q || undefined, status, page, pageSize: PAGE_SIZE }),
    [q, status, page],
  )

  const nutritionistsQuery = useNutritionistsQuery(params)
  const updateAccess = useUpdateNutritionistAccess()

  const data = nutritionistsQuery.data
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE

  const hasFilters = status !== 'all' || q.trim().length > 0
  const showError = nutritionistsQuery.isError && !data
  const showSkeleton = nutritionistsQuery.isPending
  const noResults = !showSkeleton && !showError && total === 0

  const countLabel = noResults
    ? 'No nutritionists match your filters'
    : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}${
        hasFilters ? ' matching nutritionists' : ' nutritionists'
      }`

  const updateSearch = (patch: Partial<NutritionistsSearch>) => {
    // Built from this route's own search rather than the reducer's `prev`,
    // which is the union across every route and carries a wider `status`.
    const next: NutritionistsSearch = {
      q: search.q,
      status: search.status,
      page: search.page,
      ...patch,
    }
    navigate({ to: '/nutritionists', search: next })
  }

  const goToPage = (n: number) => updateSearch({ page: n > 1 ? n : undefined })

  const clearFilters = () => {
    setSearchInput('')
    navigate({ to: '/nutritionists', search: {} })
  }

  const confirmToggle = () => {
    if (!toggleTarget) return
    updateAccess.mutate({
      id: toggleTarget.id,
      enabled: !toggleTarget.accessEnabled,
    })
    setToggleTarget(null)
  }

  return (
    <>
      <Topbar
        title="Nutritionists"
        subtitle="Manage nutritionists and the users they oversee."
        actions={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Icon name="plus" />
            Add nutritionist
          </button>
        }
      />
      <main className="content">
        <section className="panel clients-toolbar">
          <div className="clients-toolbar-row">
            <div className="clients-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search nutritionists by name or email…"
                autoComplete="off"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="clients-filters">
              <select
                className="select-range"
                aria-label="Filter by status"
                value={status}
                onChange={(e) =>
                  updateSearch({
                    status:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as NutritionistStatusFilter),
                    page: undefined,
                  })
                }
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </section>

        <section className="panel clients-panel">
          <div className="panel-head">
            <div>
              <h2>Nutritionist Roster</h2>
              <p className="panel-sub">{countLabel}</p>
            </div>
          </div>

          {showError ? (
            <div className="clients-empty is-error" role="alert">
              <Icon name="alert-triangle" />
              <p>{apiErrorMessage(nutritionistsQuery.error)}</p>
              <button
                className="link-btn clients-empty-retry"
                onClick={() => nutritionistsQuery.refetch()}
              >
                Try again
              </button>
            </div>
          ) : noResults ? (
            <div className="clients-empty">
              <Icon name="user-x" />
              <p>No nutritionists match your filters</p>
              <button className="link-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            </div>
          ) : (
            <div
              className="clients-table-wrap"
              aria-busy={nutritionistsQuery.isFetching || undefined}
            >
              <table className="client-table nutritionist-table">
                <colgroup>
                  <col style={{ width: '14.1%' }} />
                  <col style={{ width: '14.1%' }} />
                  <col style={{ width: '14.1%' }} />
                  <col style={{ width: '14.1%' }} />
                  <col style={{ width: '14.1%' }} />
                  <col style={{ width: '14.1%' }} />
                  <col style={{ width: '160px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Qualification</th>
                    <th>Experience</th>
                    <th>Joined date</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {showSkeleton ? (
                    <SkeletonRows />
                  ) : (
                    items.map((n) => (
                      <NutritionistTableRow
                        key={n.id}
                        nutritionist={n}
                        onRequestToggle={setToggleTarget}
                        onEdit={setEditTarget}
                        onViewMembers={setMembersTarget}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="clients-pagination">
            <span className="clients-page-info">
              Page {currentPage} of {totalPages}
            </span>
            <div className="pagination-btns">
              <button
                className="icon-btn sm"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
              >
                <Icon name="chevron-left" />
              </button>
              <button
                className="icon-btn sm"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              >
                <Icon name="chevron-right" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {addOpen ? (
        <NutritionistFormModal
          nutritionist={null}
          onClose={() => setAddOpen(false)}
        />
      ) : null}

      {editTarget ? (
        <NutritionistFormModal
          nutritionist={editTarget}
          onClose={() => setEditTarget(null)}
        />
      ) : null}

      {membersTarget ? (
        <NutritionistMembersModal
          nutritionist={membersTarget}
          onClose={() => setMembersTarget(null)}
        />
      ) : null}

      {toggleTarget ? (
        <ConfirmDialog
          title={
            toggleTarget.accessEnabled
              ? 'Disable nutritionist?'
              : 'Enable nutritionist?'
          }
          message={
            toggleTarget.accessEnabled
              ? 'This will prevent them from accessing the platform. Their data will be preserved and can be re-enabled later.'
              : 'They will regain access to the platform.'
          }
          confirmText={
            toggleTarget.accessEnabled
              ? 'Disable nutritionist'
              : 'Enable nutritionist'
          }
          danger={toggleTarget.accessEnabled}
          onConfirm={confirmToggle}
          onClose={() => setToggleTarget(null)}
        />
      ) : null}
    </>
  )
}
