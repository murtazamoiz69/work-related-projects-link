import { Avatar } from '@/components/atoms/Avatar'
import { Modal } from '@/components/molecules/Modal'
import { apiErrorMessage } from '@/lib/api/errors'
import type { Nutritionist } from '../types'
import { useNutritionistMembersQuery } from '../hooks/useNutritionistsQuery'

// Read-only — clicking a member here doesn't manage them; the Users section
// owns status/progress/expiry for every individual user.
export function NutritionistMembersModal({
  nutritionist,
  onClose,
}: {
  nutritionist: Nutritionist
  onClose: () => void
}) {
  const {
    data: members,
    isPending,
    isError,
    error,
  } = useNutritionistMembersQuery(nutritionist.id)

  return (
    <Modal
      title={`${nutritionist.name}'s members`}
      onClose={onClose}
      cardClassName="nutritionist-members-card"
    >
      {isPending ? (
        <ul className="nutritionist-members-list" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="ct-client">
              <span
                className="skel"
                style={{ width: 28, height: 28, borderRadius: '50%' }}
              />
              <span className="ct-client-id">
                <span className="skel skel-wide" />
                <span className="skel skel-narrow" />
              </span>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <p className="panel-sub" role="alert">
          {apiErrorMessage(error)}
        </p>
      ) : members && members.length ? (
        <>
          <p className="panel-sub">
            {members.length} user{members.length === 1 ? '' : 's'} assigned
          </p>
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
        </>
      ) : (
        <p className="panel-sub">No users assigned yet.</p>
      )}
    </Modal>
  )
}
