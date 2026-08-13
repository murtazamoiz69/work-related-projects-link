import { Avatar } from '@/components/atoms/Avatar'
import { Modal } from '@/components/molecules/Modal'
import { CLIENTS_DATA } from '@/features/clients'
import type { Nutritionist } from '../types'

// Read-only — clicking a member here doesn't manage them; the Users section
// owns status/progress/expiry for every individual user.
export function NutritionistMembersModal({
  nutritionist,
  onClose,
}: {
  nutritionist: Nutritionist
  onClose: () => void
}) {
  const members = nutritionist.memberIds
    .map((id) => CLIENTS_DATA.find((c) => c.id === id))
    .filter((c): c is (typeof CLIENTS_DATA)[number] => Boolean(c))

  return (
    <Modal
      title={`${nutritionist.name}'s members`}
      onClose={onClose}
      cardClassName="nutritionist-members-card"
    >
      <p className="panel-sub">
        {members.length} user{members.length === 1 ? '' : 's'} assigned
      </p>
      {members.length ? (
        <ul className="nutritionist-members-list">
          {members.map((c) => (
            <li key={c.id} className="ct-client">
              <Avatar initials={c.initials} color={c.color} size="sm" />
              <span className="ct-client-id">
                <span className="ct-name">{c.name}</span>
                <span className="ct-sub">{c.email}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-sub">No users assigned yet.</p>
      )}
    </Modal>
  )
}
