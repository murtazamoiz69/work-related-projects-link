import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import {
  useClientsQuery,
  useClientsSummaryQuery,
  useUpdateClientAccess,
  type Client,
  type ClientExpiryFilter,
  type ClientReviewFilter,
  type ClientStatusFilter,
  type ClientsSearch,
  type ListClientsParams,
} from '@/features/clients'
import { ClientTableRow } from '@/features/clients/components/ClientRosterViews'
import { UserSummaryCards } from '@/features/clients/components/UserSummaryCards'
import { ExtendProgramModal } from '@/features/clients/components/ExtendProgramModal'
import { AddUserChoiceModal } from '@/features/clients/components/AddUserChoiceModal'
import { ClientFormModal } from '@/features/clients/components/ClientFormModal'
import { BulkUploadModal } from '@/features/clients/components/BulkUploadModal'

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
            <span className="skel skel-narrow" />
          </td>
          <td>
            <span className="skel" />
          </td>
          <td>
            <span className="skel" />
          </td>
          <td>
            <span className="skel" />
          </td>
          <td>
            <span className="skel skel-narrow" />
          </td>
        </tr>
      ))}
    </>
  )
}

export function ClientsPage({ search }: { search: ClientsSearch }) {
  const navigate = useNavigate()

  // URL is the source of truth for filters / pagination.
  const q = search.q ?? ''
  const status: ClientStatusFilter = search.status ?? 'all'
  const expiry: ClientExpiryFilter = search.expiry ?? 'all'
  const review: ClientReviewFilter = search.review ?? 'all'
  const page = search.page ?? 1

  const [searchInput, setSearchInput] = useState(q)
  const [toggleTarget, setToggleTarget] = useState<Client | null>(null)
  const [extendTarget, setExtendTarget] = useState<Client | null>(null)

  // "Add User" is a two-step flow: the chooser, then whichever path was picked.
  const [addStep, setAddStep] = useState<
    'choice' | 'individual' | 'bulk' | null
  >(null)

  // Keep the input in sync when the URL q changes from outside (back/forward,
  // Clear filters).
  useEffect(() => {
    setSearchInput(q)
  }, [q])

  // Debounce the search box into the URL so the roster query doesn't refetch on
  // every keystroke.
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === q) return
    const t = setTimeout(() => {
      navigate({
        to: '/clients',
        search: (prev) => ({
          ...prev,
          q: trimmed || undefined,
          page: undefined,
        }),
      })
    }, 250)
    return () => clearTimeout(t)
  }, [searchInput, q, navigate])

  const params: ListClientsParams = useMemo(
    () => ({
      search: q || undefined,
      status,
      expiry,
      review,
      page,
      pageSize: PAGE_SIZE,
    }),
    [q, status, expiry, review, page],
  )

  const clientsQuery = useClientsQuery(params)
  const summaryQuery = useClientsSummaryQuery()
  const updateAccess = useUpdateClientAccess()

  const data = clientsQuery.data
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE

  const hasFilters =
    status !== 'all' ||
    expiry !== 'all' ||
    review !== 'all' ||
    q.trim().length > 0
  const showError = clientsQuery.isError && !data
  const showSkeleton = clientsQuery.isPending
  const noResults = !showSkeleton && !showError && total === 0

  const countLabel = noResults
    ? 'No users match your filters'
    : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}${
        hasFilters ? ' matching users' : ' users'
      }`

  const updateSearch = (patch: Partial<ClientsSearch>) => {
    navigate({ to: '/clients', search: (prev) => ({ ...prev, ...patch }) })
  }

  const goToPage = (n: number) => updateSearch({ page: n > 1 ? n : undefined })

  const clearFilters = () => {
    setSearchInput('')
    navigate({ to: '/clients', search: {} })
  }

  const openChat = (client: Client) => {
    navigate({ to: '/chat', search: { c: client.conversationId } })
  }

  const manageUser = (client: Client) => {
    navigate({
      to: '/chat',
      search: { c: client.conversationId, plan: true },
    })
  }

  const callClient = (client: Client) => showToast(`Calling ${client.name}…`)
  const emailClient = (client: Client) => showToast(`Emailing ${client.name}…`)

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
        title="Users"
        subtitle="Manage users, program access and status."
        actions={
          <button className="btn-primary" onClick={() => setAddStep('choice')}>
            <Icon name="plus" />
            Add User
          </button>
        }
      />
      <main className="content">
        <UserSummaryCards
          summary={summaryQuery.data}
          loading={summaryQuery.isPending}
        />

        <section className="panel clients-toolbar">
          <div className="clients-toolbar-row">
            <div className="clients-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search users by name or email…"
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
                        : (e.target.value as ClientStatusFilter),
                    page: undefined,
                  })
                }
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <select
                className="select-range"
                aria-label="Filter by plan expiry"
                value={expiry}
                onChange={(e) =>
                  updateSearch({
                    expiry:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as ClientExpiryFilter),
                    page: undefined,
                  })
                }
              >
                <option value="all">All</option>
                <option value="expiring-soon">Expiring soon</option>
                <option value="expired">Expired</option>
                <option value="active">Active</option>
              </select>
              {/* Whose filtered diet plan is still waiting on a nutritionist.
                  A queue, not a status — hence its own filter rather than a
                  column nobody would sort by. */}
              <select
                className="select-range"
                aria-label="Filter by plan review"
                value={review}
                onChange={(e) =>
                  updateSearch({
                    review:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as ClientReviewFilter),
                    page: undefined,
                  })
                }
              >
                <option value="all">All plans</option>
                <option value="in-review">In review</option>
                <option value="reviewed">Reviewed</option>
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

          {showError ? (
            <div className="clients-empty is-error" role="alert">
              <Icon name="alert-triangle" />
              <p>{apiErrorMessage(clientsQuery.error)}</p>
              <button
                className="link-btn clients-empty-retry"
                onClick={() => clientsQuery.refetch()}
              >
                Try again
              </button>
            </div>
          ) : noResults ? (
            <div className="clients-empty">
              <Icon name="user-x" />
              <p>No users match your filters</p>
              <button className="link-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            </div>
          ) : (
            <div
              className="clients-table-wrap"
              aria-busy={clientsQuery.isFetching || undefined}
            >
              <table className="client-table user-table">
                <colgroup>
                  <col style={{ width: '21%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '230px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Assigned to</th>
                    <th>Plan expiry</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {showSkeleton ? (
                    <SkeletonRows />
                  ) : (
                    items.map((c) => (
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

      {extendTarget ? (
        <ExtendProgramModal
          client={extendTarget}
          onClose={() => setExtendTarget(null)}
        />
      ) : null}

      {addStep === 'choice' ? (
        <AddUserChoiceModal
          onClose={() => setAddStep(null)}
          onChooseIndividual={() => setAddStep('individual')}
          onChooseBulk={() => setAddStep('bulk')}
        />
      ) : null}

      {addStep === 'individual' ? (
        <ClientFormModal onClose={() => setAddStep(null)} />
      ) : null}

      {addStep === 'bulk' ? (
        <BulkUploadModal onClose={() => setAddStep(null)} />
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
