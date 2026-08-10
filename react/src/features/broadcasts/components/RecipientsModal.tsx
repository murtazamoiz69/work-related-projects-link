import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import type { Client } from '@/features/clients'

// Reuses the Assign Users modal's list styling — same "avatar + name +
// program" row shape, just without the checkbox since nothing here is
// selectable.
export function RecipientsModal({
  clients,
  onClose,
}: {
  clients: Client[]
  onClose: () => void
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card assign-modal-card">
        <div className="modal-head">
          <h3>
            <Icon name="users" className="inline-icon" /> Recipients (
            {clients.length})
          </h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <ul className="assign-client-list">
          {clients.length ? (
            clients.map((c) => (
              <li key={c.id}>
                <div className="assign-client-row">
                  <Avatar initials={c.initials} color={c.color} size="sm" />
                  <span className="assign-client-body">
                    <span className="assign-client-name">{c.name}</span>
                    <span className="assign-client-sub">{c.program}</span>
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="assign-empty">No users match this audience yet</li>
          )}
        </ul>
      </div>
    </div>
  )
}
