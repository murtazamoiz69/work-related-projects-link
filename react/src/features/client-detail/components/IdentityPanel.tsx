import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import { STATUS_LABEL, formatJoinDate, type Client } from '@/features/clients'

/** Identity header: avatar, name + status, meta line, and the message / call /
 *  generate-report actions. */
export function IdentityPanel({ client }: { client: Client }) {
  const navigate = useNavigate()
  return (
    <section className="panel identity-panel">
      <div className="identity-row">
        <Avatar initials={client.initials} color={client.color} size="lg" />
        <div className="identity-info">
          <div className="identity-name-row">
            <h1>{client.name}</h1>
            <span className={`status-pill status-${client.status}`}>
              {STATUS_LABEL[client.status]}
            </span>
          </div>
          <p className="identity-meta">
            {client.age} · {client.gender} · {client.program} · Joined{' '}
            {formatJoinDate(client.joinDate)}
          </p>
        </div>
        <div className="identity-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate({ to: '/chat' })}
          >
            <Icon name="message-circle" />
            Message
          </button>
          <button
            className="icon-btn"
            title="Call"
            onClick={() => showToast(`Calling ${client.name}…`)}
          >
            <Icon name="phone" />
          </button>
          <button
            className="icon-btn"
            title="Generate report (PDF)"
            onClick={() => window.print()}
          >
            <Icon name="file-down" />
          </button>
        </div>
      </div>
    </section>
  )
}
