import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/atoms/Icon'
import type { Broadcast } from '../types'

export type BroadcastMenuAction =
  'edit' | 'duplicate' | 'delete' | 'publish-now' | 'cancel-schedule'

// Same fixed/portalled context-menu recipe as ProgramActionsMenu — positioned
// off the trigger button and rendered to <body> so the table's scroll wrapper
// can't clip it.
export function BroadcastActionsMenu({
  broadcast,
  onAction,
}: {
  broadcast: Broadcast
  onAction: (action: BroadcastMenuAction) => void
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

  const run = (action: BroadcastMenuAction) => {
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
              {broadcast.status !== 'published' ? (
                <button onClick={() => run('edit')}>Edit</button>
              ) : null}
              {broadcast.status === 'scheduled' ? (
                <button onClick={() => run('publish-now')}>Publish Now</button>
              ) : null}
              {broadcast.status === 'scheduled' ? (
                <button onClick={() => run('cancel-schedule')}>
                  Cancel Schedule
                </button>
              ) : null}
              <button onClick={() => run('duplicate')}>Duplicate</button>
              {broadcast.status === 'draft' ? (
                <button className="danger" onClick={() => run('delete')}>
                  Delete
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
