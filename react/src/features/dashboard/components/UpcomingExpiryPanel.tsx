import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ClientActions } from '@/components/molecules/ClientActions'
import { buildUpcomingExpirations } from '../data'

export function UpcomingExpiryPanel() {
  const rows = useMemo(() => buildUpcomingExpirations(), [])

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Upcoming Plan Expiry</h2>
          <p className="panel-sub">Plans expiring in the next 7 days</p>
        </div>
      </div>
      <div className="clients-table-wrap">
        <table className="client-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map(({ client, daysLeft }) => {
                const tier =
                  daysLeft <= 2
                    ? 'due-urgent'
                    : daysLeft <= 5
                      ? 'due-soon'
                      : 'due-ok'
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
                      <div className="plan-type">
                        <Icon name="credit-card" />
                        Plan Renewal
                      </div>
                    </td>
                    <td>
                      <span className={`due-badge ${tier}`}>
                        {daysLeft} day{daysLeft === 1 ? '' : 's'}
                      </span>
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
                  <p className="pw-muted">Nothing due in the next 7 days.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Link className="link-btn view-all" to="/clients">
        View all users <Icon name="arrow-right" />
      </Link>
    </section>
  )
}
