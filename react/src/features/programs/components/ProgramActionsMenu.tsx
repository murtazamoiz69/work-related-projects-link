import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/atoms/Icon'
import type { TrainingProgram } from '../types'

export type ProgramMenuAction =
  | 'edit'
  | 'duplicate'
  | 'toggle-publish'
  | 'archive'
  | 'delete'

// V2's openFixedContextMenu: the menu is positioned fixed off the trigger's
// bounding box and portalled to <body> so the card/table scroll wrappers (which
// clip overflow) can't cut it off.
export function ProgramActionsMenu({
  program,
  onAction,
}: {
  program: TrainingProgram
  onAction: (action: ProgramMenuAction) => void
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

  const run = (action: ProgramMenuAction) => {
    setOpen(false)
    onAction(action)
  }

  return (
    <>
      <button
        ref={btnRef}
        className="icon-btn sm"
        title="More"
        aria-label="More actions"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <Icon name="more-vertical" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="context-menu fixed-context-menu"
              style={{ position: 'fixed', top: pos.top, right: pos.right }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => run('edit')}>Edit Program</button>
              <button onClick={() => run('duplicate')}>Duplicate</button>
              <button onClick={() => run('toggle-publish')}>
                {program.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => run('archive')}>
                {program.status === 'archived' ? 'Restore' : 'Archive'}
              </button>
              <button className="danger" onClick={() => run('delete')}>
                Delete
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
