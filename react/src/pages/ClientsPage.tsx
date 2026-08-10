import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { CLIENTS_DATA, clientHaystack } from '@/features/clients'
import { ClientTableRow } from '@/features/clients/components/ClientRosterViews'

const PAGE_SIZE = 12

export function ClientsPage() {
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('all')
  const [sort, setSort] = useState('adherence-asc')
  const [page, setPage] = useState(1)

  const programs = useMemo(
    () => Array.from(new Set(CLIENTS_DATA.map((c) => c.program))).sort(),
    [],
  )

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = CLIENTS_DATA.filter((c) => {
      if (program !== 'all' && c.program !== program) return false
      if (q && !clientHaystack(c).includes(q)) return false
      return true
    })
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'recent':
          return b.joinDate.getTime() - a.joinDate.getTime()
        case 'adherence-desc':
          return (b.adherence ?? -1) - (a.adherence ?? -1)
        case 'adherence-asc':
          return (a.adherence ?? 999) - (b.adherence ?? 999)
        case 'checkin':
          return (a.checkInDays ?? 999) - (b.checkInDays ?? 999)
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }, [search, program, sort])

  useEffect(() => {
    setPage(1)
  }, [search, program, sort])

  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = list.slice(start, start + PAGE_SIZE)
  const hasFilters = program !== 'all' || search.trim().length > 0
  const noResults = total === 0

  const countLabel = noResults
    ? 'No users match your filters'
    : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}${
        hasFilters ? ' matching users' : ' users · 428 total in your caseload'
      }`

  const clearFilters = () => {
    setSearch('')
    setProgram('all')
    setPage(1)
  }

  return (
    <>
      <Topbar
        title="Users"
        subtitle="Your full caseload, synced from each user's Nourish AI profile"
      />
      <main className="content">
        <section className="panel clients-toolbar">
          <div className="clients-toolbar-row">
            <div className="clients-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search by name, program, or diet…"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="clients-filters">
              <select
                className="select-range"
                aria-label="Filter by program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              >
                <option value="all">All Programs</option>
                {programs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                className="select-range"
                aria-label="Sort users"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="name">Name A–Z</option>
                <option value="recent">Recently joined</option>
                <option value="adherence-desc">Adherence: High to Low</option>
                <option value="adherence-asc">Adherence: Low to High</option>
                <option value="checkin">Last check-in</option>
              </select>
            </div>
          </div>
        </section>

        <section className="panel clients-panel">
          <div className="panel-head">
            <div>
              <h2>User Roster</h2>
              <p className="panel-sub">{countLabel}</p>
            </div>
          </div>

          {noResults ? (
            <div className="clients-empty">
              <Icon name="user-x" />
              <p>No users match your filters</p>
              <button className="link-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="clients-table-wrap">
              <table className="client-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Program</th>
                    <th>Adherence</th>
                    <th>Last Check-in</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((c) => (
                    <ClientTableRow key={c.id} client={c} />
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
    </>
  )
}
