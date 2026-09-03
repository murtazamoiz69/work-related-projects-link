import { Icon } from '@/components/atoms/Icon'
import { Modal } from '@/components/molecules/Modal'

/** First step of "Add User" — picks between the individual form and the
 * bulk-Excel importer. A chooser modal rather than a dropdown menu, so it
 * matches how every other multi-step flow in this app (Extend, the plan
 * pickers) already opens: a centered `Modal`, not an anchored popover. */
export function AddUserChoiceModal({
  onClose,
  onChooseIndividual,
  onChooseBulk,
}: {
  onClose: () => void
  onChooseIndividual: () => void
  onChooseBulk: () => void
}) {
  return (
    <Modal title="Add User" onClose={onClose}>
      <p className="add-user-choice-intro">
        How would you like to add users to the program?
      </p>
      <div className="add-user-choice-options">
        <button
          type="button"
          className="add-user-choice-card"
          onClick={onChooseIndividual}
        >
          <span className="add-user-choice-icon">
            <Icon name="user-plus" />
          </span>
          <span className="add-user-choice-body">
            <span className="add-user-choice-title">Add individually</span>
            <span className="add-user-choice-desc">
              Enter one user&apos;s name, email, phone and plan details.
            </span>
          </span>
          <Icon name="chevron-right" className="add-user-choice-chev" />
        </button>
        <button
          type="button"
          className="add-user-choice-card"
          onClick={onChooseBulk}
        >
          <span className="add-user-choice-icon">
            <Icon name="upload" />
          </span>
          <span className="add-user-choice-body">
            <span className="add-user-choice-title">Bulk upload</span>
            <span className="add-user-choice-desc">
              Import many users at once from an Excel file.
            </span>
          </span>
          <Icon name="chevron-right" className="add-user-choice-chev" />
        </button>
      </div>
    </Modal>
  )
}
