import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { WeekSaveTargets } from './WeekSaveTargets'

/** The week checklist, collapsed behind a "Copy to weeks" button instead of
 *  sitting beside the editor — frees the editor to run full width. The
 *  checklist itself (WeekSaveTargets: presets + multi-select checkboxes) is
 *  unchanged, just relocated into this popover. */
export function CopyToWeeksDropdown({
  totalWeeks,
  currentWeek,
  selected,
  onToggle,
  onSelect,
}: {
  totalWeeks: number
  currentWeek: number
  selected: number[]
  onToggle: (week: number) => void
  onSelect: (weeks: number[]) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="diet-copy-wrap">
      <button
        type="button"
        className="btn-secondary sm diet-copy-btn"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="clipboard-copy" size={15} />
        Copy to weeks
        <Icon
          name="chevron-down"
          size={14}
          className={`diet-copy-chevron${open ? ' is-open' : ''}`}
        />
      </button>

      {open ? (
        <div className="diet-copy-dropdown">
          <WeekSaveTargets
            totalWeeks={totalWeeks}
            currentWeek={currentWeek}
            selected={selected}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        </div>
      ) : null}
    </div>
  )
}
