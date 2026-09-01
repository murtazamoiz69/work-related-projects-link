import type { HTMLAttributes, ReactNode } from 'react'

type BackdropProps = {
  /** Called when the backdrop itself (not its children) is clicked. */
  onClose: () => void
  children: ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick'>

/**
 * Shared modal / drawer / lightbox backdrop.
 *
 * Clicking the backdrop surface — but not the panel inside it — closes the
 * layer. This is a pointer-only convenience: every consumer already wires an
 * Escape handler and renders a visible Close button, and the panel itself is a
 * focus-trapped `role="dialog"`. So the backdrop deliberately has no keyboard
 * handler, and the a11y lint exception for that decision lives here, in one
 * audited place, instead of being scattered across ~15 overlays.
 *
 * Extra props (className, role, aria-*) are forwarded to the backdrop div.
 */
export function Backdrop({ onClose, children, ...rest }: BackdropProps) {
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      {...rest}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {children}
    </div>
  )
}
