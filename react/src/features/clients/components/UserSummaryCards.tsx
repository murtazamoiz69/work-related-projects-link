import type { Client } from '../types'
import { daysUntil } from '../utils'

export type ExpiryFilter = 'all' | 'expiring-soon' | 'expired' | 'active'

export function UserSummaryCards({ clients }: { clients: Client[] }) {
  const total = clients.length
  const active = clients.filter((c) => c.accessEnabled).length
  const expiringSoon = clients.filter((c) => {
    const d = daysUntil(c.expiryDate)
    return d >= 0 && d <= 14
  }).length
  const expired = clients.filter((c) => daysUntil(c.expiryDate) < 0).length

  return (
    <div className="users-summary-grid" aria-label="User status summary">
      <div className="users-summary-card">
        <span className="users-summary-value">{total}</span>
        <span className="users-summary-label">Total users</span>
      </div>
      <div className="users-summary-card accent-green">
        <span className="users-summary-value">{active}</span>
        <span className="users-summary-label">Active</span>
      </div>
      <div className="users-summary-card accent-amber">
        <span className="users-summary-value">{expiringSoon}</span>
        <span className="users-summary-label">Expiring soon</span>
      </div>
      <div className="users-summary-card accent-red">
        <span className="users-summary-value">{expired}</span>
        <span className="users-summary-label">Expired</span>
      </div>
    </div>
  )
}
