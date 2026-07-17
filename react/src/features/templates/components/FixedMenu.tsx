import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/atoms/Icon'

// V2's openFixedContextMenu: the menu is positioned fixed off the trigger's
// bounding box and portalled to <body> so the card/table scroll wrappers (which
// clip overflow) can't cut it off. `children` is a render prop receiving a
// `close` callback so items can dismiss the menu after acting.
export function FixedMenu({
  icon = 'more-vertical',
  title = 'More',
  className = 'icon-btn sm',
  children,
}: {
  icon?: string
  title?: string
  className?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  })

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        className={className}
        title={title}
        aria-label={title}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <Icon name={icon} />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="context-menu fixed-context-menu"
              style={{ position: 'fixed', top: pos.top, right: pos.right }}
              onClick={(e) => e.stopPropagation()}
            >
              {children(() => setOpen(false))}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
