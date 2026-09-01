import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Backdrop } from '@/components/molecules/Backdrop'

/** Shared confirmation dialog. Escape cancels, focus starts on Cancel so the
 *  safe choice is the one a stray Enter picks, and focus returns to whatever
 *  opened it. Layers on .modal-overlay, so it sits above the Plan Workspace. */
export function ConfirmDialog({
  title,
  message,
  note,
  confirmText = 'Confirm',
  danger = false,
  onConfirm,
  onClose,
  overlayClassName = 'modal-overlay',
}: {
  title: string
  message: ReactNode
  /** Secondary line, e.g. what the user will see as a result. */
  note?: ReactNode
  confirmText?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
  /** Overlay classes. Pass `'modal-overlay pw-modal-overlay'` to layer above a
   *  Plan-Workspace drawer/modal. */
  overlayClassName?: string
}) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // This dialog is the topmost layer whenever it is open, so it takes the
      // key before the workspace's own Escape handler can close the workspace.
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <Backdrop className={overlayClassName} onClose={onClose}>
      <div
        className="modal-card confirm-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={`confirm-dialog-icon${danger ? ' is-danger' : ''}`}>
          <Icon name={danger ? 'trash-2' : 'users'} />
        </div>
        <h3 className="confirm-dialog-title" id={titleId}>
          {title}
        </h3>
        <p className="confirm-dialog-message">{message}</p>
        {note ? <p className="confirm-dialog-note">{note}</p> : null}
        <div className="confirm-dialog-actions">
          <button className="link-btn" onClick={onClose} ref={cancelRef}>
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
    </Backdrop>
  )
}
