import type React from 'react'
import type { WeekDay } from '@/features/dashboard'

// The strip always runs Sunday → Saturday, so index 0 is always Sunday and the
// repeated S/S and T/T are told apart by position.
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

/** The weekday-letter row, sized to land in the exact same seven columns as
 *  the dot rows below it (same dot width + gap as WeekDots at the matching
 *  `size`). Rendered once above a stack of WeekDots rows — e.g. the Catch Up
 *  table's "Weekly Progress" column header — rather than repeating the
 *  letters under every row's own dots. `flex-shrink: 0` on each letter (in
 *  CSS) matters here as much as the shared width/gap values: WeekDots' own
 *  dots never shrink either, so if the letters did, a narrow column would
 *  silently drift the header out of step with the rows under it. */
export function WeekDayHeader({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div className={`week-day-header week-day-header-${size}`}>
      {WEEKDAY_LETTERS.map((letter, i) => (
        // Index, not the letter, is the key: S and T each appear twice.
        <span key={i}>{letter}</span>
      ))}
    </div>
  )
}

// The seven-dot week strip, used by the Dashboard's Catch Up table to show a
// client's daily status at a glance. `size` tunes dot and gap, matching
// WeekDayHeader's column width at the same `size` so a header row and
// however many dot rows stack under it read as one aligned grid instead of
// each row re-deriving its own spacing.
//
// Today gets no ring — the strip is a colour readout, and which column is today
// is fixed by the Sun-Sat run plus the date range in the heading. The tooltip
// and aria-label still say "(Today)" explicitly.
export function WeekDots({
  days,
  size = 'md',
  onDotEnter,
  onDotLeave,
}: {
  days: WeekDay[]
  size?: 'sm' | 'md'
  onDotEnter?: (e: React.MouseEvent, text: string) => void
  onDotLeave?: () => void
}) {
  return (
    <div className={`week-dots week-dots-${size}`}>
      {days.map((d) => (
        <span
          key={d.daysAgo}
          className={`week-dot tier-${d.tier}`}
          // The hover tooltip is pointer-only, so the same text is exposed
          // to assistive tech here rather than being lost with the pointer.
          role="img"
          aria-label={d.popover.replace(/\n/g, '. ')}
          onMouseEnter={
            onDotEnter ? (e) => onDotEnter(e, d.popover) : undefined
          }
          onMouseLeave={onDotLeave}
        />
      ))}
    </div>
  )
}
