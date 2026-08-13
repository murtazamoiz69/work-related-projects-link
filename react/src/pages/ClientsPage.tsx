import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { CONVERSATIONS } from '@/features/chat'
import { showToast } from '@/lib/toast'
import {
  clientHaystack,
  daysUntil,
  useClientsStore,
  type Client,
} from '@/features/clients'
import { ClientTableRow } from '@/features/clients/components/ClientRosterViews'
import {
  UserSummaryCards,
  type ExpiryFilter,
} from '@/features/clients/components/UserSummaryCards'
import { ExtendProgramModal } from '@/features/clients/components/ExtendProgramModal'

const PAGE_SIZE = 12

type StatusFilter = 'all' | 'active' | 'disabled'

export function ClientsPage() {
  const navigate = useNavigate()
  const clients = useClientsStore((s) => s.clients)
  const setClients = useClientsStore((s) => s.setClients)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')
  const [page, setPage] = useState(1)

  const [toggleTarget, setToggleTarget] = useState<Client | null>(null)
  const [extendTarget, setExtendTarget] = useState<Client | null>(null)

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = clients.filter((c) => {
      if (statusFilter === 'active' && !c.accessEnabled) return false
      if (statusFilter === 'disabled' && c.accessEnabled) return false
      if (expiryFilter !== 'all') {
        const d = daysUntil(c.expiryDate)
        if (expiryFilter === 'expiring-soon' && !(d >= 0 && d <= 14))
          return false
        if (expiryFilter === 'expired' && d >= 0) return false
        if (expiryFilter === 'active' && d <= 14) return false
      }
      if (q && !clientHaystack(c).includes(q)) return false
      return true
    })
    // Soonest-expiring users surface first, so the roster answers "who needs
    // action" before anything else.
    return [...filtered].sort(
      (a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate),
    )
  }, [clients, search, statusFilter, expiryFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, expiryFilter])

  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = list.slice(start, start + PAGE_SIZE)
  const hasFilters =
    statusFilter !== 'all' || expiryFilter !== 'all' || search.trim().length > 0
  const noResults = total === 0

  const countLabel = noResults
    ? 'No users match your filters'
    : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}${
        hasFilters ? ' matching users' : ' users'
      }`

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setExpiryFilter('all')
    setPage(1)
  }

  const conversationIdFor = (client: Client) =>
    CONVERSATIONS.find((c) => c.client.id === client.id)?.id

  const openChat = (client: Client) => {
    navigate({ to: '/chat', search: { c: conversationIdFor(client) } })
  }

  const manageUser = (client: Client) => {
    navigate({
      to: '/chat',
      search: { c: conversationIdFor(client), plan: true },
    })
  }

  const callClient = (client: Client) => {
    showToast(`Calling ${client.name}…`)
  }

  const emailClient = (client: Client) => {
    showToast(`Emailing ${client.name}…`)
  }

  const confirmToggle = () => {
    if (!toggleTarget) return
    const next = !toggleTarget.accessEnabled
    setClients((prev) =>
      prev.map((c) =>
        c.id === toggleTarget.id ? { ...c, accessEnabled: next } : c,
      ),
    )
    showToast(`${toggleTarget.name} ${next ? 'enabled' : 'disabled'}`)
    setToggleTarget(null)
  }

  return (
    <>
      <Topbar
        title="Users"
        subtitle="Manage users, program access and status."
      />
      <main className="content">
        <UserSummaryCards clients={clients} />

        <section className="panel clients-toolbar">
          <div className="clients-toolbar-row">
            <div className="clients-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search users by name or email…"
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
              <select
                className="select-range"
                aria-label="Filter by plan expiry"
                value={expiryFilter}
                onChange={(e) =>
                  setExpiryFilter(e.target.value as ExpiryFilter)
                }
              >
                <option value="all">All</option>
                <option value="expiring-soon">Expiring soon</option>
                <option value="expired">Expired</option>
                <option value="active">Active</option>
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
              <table className="client-table user-table">
                <colgroup>
                  <col style={{ width: '19.5%' }} />
                  <col style={{ width: '19.5%' }} />
                  <col style={{ width: '19.5%' }} />
                  <col style={{ width: '19.5%' }} />
                  <col style={{ width: '230px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Plan expiry</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((c) => (
                    <ClientTableRow
                      key={c.id}
                      client={c}
                      onOpenChat={openChat}
                      onManage={manageUser}
                      onExtend={setExtendTarget}
                      onCall={callClient}
                      onEmail={emailClient}
                      onRequestToggle={setToggleTarget}
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

      {extendTarget ? (
        <ExtendProgramModal
          client={extendTarget}
          onClose={() => setExtendTarget(null)}
          onExtended={(newExpiry) => {
            setClients((prev) =>
              prev.map((c) =>
                c.id === extendTarget.id ? { ...c, expiryDate: newExpiry } : c,
              ),
            )
          }}
        />
      ) : null}

      {toggleTarget ? (
        <ConfirmDialog
          title={toggleTarget.accessEnabled ? 'Disable user?' : 'Enable user?'}
          message={
            toggleTarget.accessEnabled
              ? 'This will prevent the user from accessing the program. Their data and progress will be preserved.'
              : 'This user will regain access to the program.'
          }
          confirmText={
            toggleTarget.accessEnabled ? 'Disable user' : 'Enable user'
          }
          danger={toggleTarget.accessEnabled}
          onConfirm={confirmToggle}
          onClose={() => setToggleTarget(null)}
        />
      ) : null}
    </>
  )
}
