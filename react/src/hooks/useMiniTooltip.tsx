import { useState, type MouseEvent, type ReactNode } from 'react'

type TooltipState = { text: string; left: number; top: number }

/** V2's shared `.mini-tooltip` — a fixed-position hover tooltip anchored to the
 *  hovered element's bounding box (so it's never clipped by scroll ancestors). */
export function useMiniTooltip(): {
  show: (e: MouseEvent, text: string) => void
  hide: () => void
  tooltip: ReactNode
} {
  const [state, setState] = useState<TooltipState | null>(null)

  const show = (e: MouseEvent, text: string) => {
    const r = e.currentTarget.getBoundingClientRect()
    setState({ text, left: r.left + r.width / 2, top: r.top - 8 })
  }
  const hide = () => setState(null)

  const tooltip = state ? (
    <div
      className="mini-tooltip show"
      style={{ left: state.left, top: state.top }}
    >
      {state.text}
    </div>
  ) : null

  return { show, hide, tooltip }
}
