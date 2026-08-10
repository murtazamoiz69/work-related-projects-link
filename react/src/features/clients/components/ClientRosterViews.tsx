import { Avatar } from '@/components/atoms/Avatar'
import { ClientActions } from '@/components/molecules/ClientActions'
import type { Client } from '../types'
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
      <td>{formatJoinDate(client.joinDate)}</td>
      <td>
        <ClientActions client={client} showManagePlan />
      </td>
    </tr>
  )
}
