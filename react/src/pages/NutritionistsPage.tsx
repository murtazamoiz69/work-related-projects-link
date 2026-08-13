import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { showToast } from '@/lib/toast'
import { daysAgo } from '@/lib/seed'
import { useAuthStore } from '@/store/useAuthStore'
import {
  nutritionistHaystack,
  useNutritionistsStore,
  type Nutritionist,
} from '@/features/nutritionists'
import { NutritionistTableRow } from '@/features/nutritionists/components/NutritionistTableRow'
import {
  NutritionistFormModal,
  type NutritionistFormValues,
} from '@/features/nutritionists/components/NutritionistFormModal'
import { NutritionistMembersModal } from '@/features/nutritionists/components/NutritionistMembersModal'

const PAGE_SIZE = 12

type StatusFilter = 'all' | 'active' | 'disabled'

const AVATAR_COLORS = [
  '#2F5D50',
  '#55789D',
  '#AF5688',
  '#8A5FBF',
  '#A3672E',
  '#3C8260',
  '#4A7A9D',
  '#786CA4',
  '#39816E',
  '#BE4F70',
]

function initialsFor(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || 'N'
  )
}

// Super Admin's one added page — same roster pattern as the Users section
// (search, status filter, table, toggle + confirm, pagination), just
// pointed at nutritionists instead of users.
export function NutritionistsPage() {
  const navigate = useNavigate()
  const isSuperAdmin =
    useAuthStore((s) => s.activeProfile.role) === 'Super Admin'
  const nutritionists = useNutritionistsStore((s) => s.nutritionists)
  const setNutritionists = useNutritionistsStore((s) => s.setNutritionists)

  // The route's beforeLoad guard only runs on navigation, not on a live
  // profile switch while already here — this catches that case too, so
  // switching back to Nutritionist mid-visit leaves this page immediately.
  useEffect(() => {
    if (!isSuperAdmin) navigate({ to: '/' })
  }, [isSuperAdmin, navigate])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Nutritionist | null>(null)
  const [membersTarget, setMembersTarget] = useState<Nutritionist | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Nutritionist | null>(null)

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = nutritionists.filter((n) => {
      if (statusFilter === 'active' && !n.accessEnabled) return false
      if (statusFilter === 'disabled' && n.accessEnabled) return false
      if (q && !nutritionistHaystack(n).includes(q)) return false
      return true
    })
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [nutritionists, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = list.slice(start, start + PAGE_SIZE)
  const hasFilters = statusFilter !== 'all' || search.trim().length > 0
  const noResults = total === 0

  const countLabel = noResults
    ? 'No nutritionists match your filters'
    : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}${
        hasFilters ? ' matching nutritionists' : ' nutritionists'
      }`

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPage(1)
  }

  const confirmToggle = () => {
    if (!toggleTarget) return
    const next = !toggleTarget.accessEnabled
    setNutritionists((prev) =>
      prev.map((n) =>
        n.id === toggleTarget.id ? { ...n, accessEnabled: next } : n,
      ),
    )
    showToast(`${toggleTarget.name} ${next ? 'enabled' : 'disabled'}`)
    setToggleTarget(null)
  }

  const addNutritionist = (values: NutritionistFormValues) => {
    const nutritionist: Nutritionist = {
      id: `nut-new-${Date.now()}`,
      name: values.name,
      initials: initialsFor(values.name),
      color:
        AVATAR_COLORS[nutritionists.length % AVATAR_COLORS.length] ?? '#2F5D50',
      email: values.email,
      qualification: values.qualification,
      experienceYears: values.experienceYears,
      joinDate: daysAgo(0),
      memberIds: [],
      accessEnabled: true,
    }
    setNutritionists((prev) => [nutritionist, ...prev])
  }

  const saveEdit = (values: NutritionistFormValues) => {
    if (!editTarget) return
    setNutritionists((prev) =>
      prev.map((n) =>
        n.id === editTarget.id
          ? {
              ...n,
              name: values.name,
              initials: initialsFor(values.name),
              email: values.email,
              qualification: values.qualification,
              experienceYears: values.experienceYears,
            }
          : n,
      ),
    )
  }

  if (!isSuperAdmin) return null

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="clients-filters">
              <select
                className="select-range"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
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

          {noResults ? (
            <div className="clients-empty">
              <Icon name="user-x" />
              <p>No nutritionists match your filters</p>
              <button className="link-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="clients-table-wrap">
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
                  {pageItems.map((n) => (
                    <NutritionistTableRow
                      key={n.id}
                      nutritionist={n}
                      onCall={(nut) => showToast(`Calling ${nut.name}…`)}
                      onEmail={(nut) => showToast(`Emailing ${nut.name}…`)}
                      onRequestToggle={setToggleTarget}
                      onEdit={setEditTarget}
                      onViewMembers={setMembersTarget}
                    />
                  ))}
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Icon name="chevron-left" />
              </button>
              <button
                className="icon-btn sm"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
          onSave={addNutritionist}
        />
      ) : null}

      {editTarget ? (
        <NutritionistFormModal
          nutritionist={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={saveEdit}
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
