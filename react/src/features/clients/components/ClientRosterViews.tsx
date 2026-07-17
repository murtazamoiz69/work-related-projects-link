import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ClientActions } from '@/components/molecules/ClientActions'
import type { Client } from '../types'
import { STATUS_LABEL } from '../data'
import { adherenceTier, formatCheckIn, formatJoinDate } from '../utils'

function AdherenceCell({ client }: { client: Client }) {
  if (client.adherence === null)
    return <span className="adherence-empty">—</span>
  const tier = adherenceTier(client.adherence)
  return (
    <div className="adherence-cell">
      <div className="adherence-bar">
        <div
          className={`adherence-fill adherence-${tier}`}
          style={{ width: `${client.adherence}%` }}
        />
      </div>
      <span className="adherence-pct">{client.adherence}%</span>
    </div>
  )
}

export function ClientTableRow({ client }: { client: Client }) {
  return (
    <tr>
      <td>
        <div className="ct-client">
          <Avatar initials={client.initials} color={client.color} size="sm" />
          <span className="ct-client-id">
            <span className="ct-name">{client.name}</span>
            <span className="ct-sub">
              {client.age} · {client.gender}
            </span>
          </span>
        </div>
      </td>
      <td>{client.program}</td>
      <td>
        <AdherenceCell client={client} />
      </td>
      <td>{formatCheckIn(client.checkInDays)}</td>
      <td>{client.plan}</td>
      <td>{formatJoinDate(client.joinDate)}</td>
      <td>
        <ClientActions client={client} viewIcon="eye" />
      </td>
    </tr>
  )
}

export function ClientCard({ client }: { client: Client }) {
  return (
    <article className="client-card">
      <div className="client-card-top">
        <Avatar initials={client.initials} color={client.color} />
        <div className="client-card-id">
          <span className="client-card-name">{client.name}</span>
          <span className="client-card-meta">
            {client.age} · {client.gender} · {client.program}
          </span>
        </div>
        <span className={`status-pill status-${client.status}`}>
          {STATUS_LABEL[client.status]}
        </span>
      </div>
      <div className="client-card-stats">
        <div className="ccs-item">
          <span className="ccs-value">
            {client.adherence !== null ? `${client.adherence}%` : '—'}
          </span>
          <span className="ccs-label">Adherence</span>
        </div>
        <div className="ccs-item">
          <span className="ccs-value">{formatCheckIn(client.checkInDays)}</span>
          <span className="ccs-label">Last check-in</span>
        </div>
      </div>
      <div className="client-card-tags">
        {client.goals.map((g) => (
          <span className="client-tag" key={g}>
            {g}
          </span>
        ))}
        <span className="client-tag client-tag-diet">{client.diet}</span>
      </div>
      <div className="client-card-foot">
        <span className="client-card-plan">
          <Icon name="clipboard-list" />
          {client.plan}
        </span>
        <div className="client-card-actions">
          <ClientActions client={client} viewIcon="eye" />
        </div>
      </div>
    </article>
  )
}
