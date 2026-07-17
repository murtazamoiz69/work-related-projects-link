import { useEffect, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'

type ModalProps = {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  cardClassName?: string
}

/** Overlay modal — the `.modal-overlay > .modal-card` pattern from V2.
 *  Closes on overlay click and Escape. */
export function Modal({
  title,
  onClose,
  children,
  footer,
  cardClassName,
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`modal-card${cardClassName ? ` ${cardClassName}` : ''}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}
