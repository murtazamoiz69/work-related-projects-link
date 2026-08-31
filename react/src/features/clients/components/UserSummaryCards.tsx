import type { ClientsSummaryDto } from '../api/clients.types'

const EMPTY: ClientsSummaryDto = {
  total: 0,
  active: 0,
  disabled: 0,
  expiringSoon: 0,
  expired: 0,
}

export function UserSummaryCards({
  summary,
  loading,
}: {
  summary: ClientsSummaryDto | undefined
  loading?: boolean
}) {
  const s = summary ?? EMPTY
  // Show a dash until the counts arrive, rather than a misleading zero.
  const show = (n: number) => (summary ? n : loading ? '—' : n)

  return (
    <div
      className="users-summary-grid"
      aria-label="User status summary"
      aria-busy={loading || undefined}
    >
      <div className="users-summary-card">
        <span className="users-summary-value">{show(s.total)}</span>
        <span className="users-summary-label">Total users</span>
      </div>
      <div className="users-summary-card accent-green">
        <span className="users-summary-value">{show(s.active)}</span>
        <span className="users-summary-label">Active</span>
      </div>
      <div className="users-summary-card accent-amber">
        <span className="users-summary-value">{show(s.expiringSoon)}</span>
        <span className="users-summary-label">Expiring soon</span>
      </div>
      <div className="users-summary-card accent-red">
        <span className="users-summary-value">{show(s.expired)}</span>
        <span className="users-summary-label">Expired</span>
      </div>
    </div>
  )
}
