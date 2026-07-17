import { useEffect, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'

// V2's openPwModal — a centered modal that renders above the full-screen plan
// workspace overlay (`.modal-overlay.pw-modal-overlay`).
export function PwModalShell({
  title,
  onClose,
  footer,
  cardClassName,
  children,
}: {
  title: ReactNode
  onClose: () => void
  footer?: ReactNode
  cardClassName?: string
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay pw-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`modal-card pw-modal-card${cardClassName ? ` ${cardClassName}` : ''}`}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body pw-modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}
