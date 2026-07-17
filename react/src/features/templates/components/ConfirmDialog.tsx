import { Icon } from '@/components/atoms/Icon'

// Reusable confirmation dialog — ported from V2's openConfirmDialog.
export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  confirmText?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card confirm-dialog-card">
        <div className={`confirm-dialog-icon${danger ? ' is-danger' : ''}`}>
          <Icon name={danger ? 'trash-2' : 'help-circle'} />
        </div>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className={
              danger ? 'btn-primary confirm-dialog-danger-btn' : 'btn-primary'
            }
            onClick={() => {
              onClose()
              onConfirm()
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
