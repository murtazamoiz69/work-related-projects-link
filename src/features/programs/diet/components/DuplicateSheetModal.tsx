import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Modal } from '@/components/molecules/Modal'
import type { CalorieBand } from '../dietPlan.types'

/** "Duplicate" — copy this week's sheet onto other weeks of the same calorie
 *  band. Same-band only by design: the portions on a 1200 kcal sheet don't
 *  mean anything on an 1800 kcal week, so the band is fixed to the source and
 *  shown rather than offered. */
export function DuplicateSheetModal({
  fromWeek,
  band,
  totalWeeks,
  pending,
  onClose,
  onConfirm,
}: {
  fromWeek: number
  band: CalorieBand
  totalWeeks: number
  pending: boolean
  onClose: () => void
  onConfirm: (weeks: number[]) => void
}) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter(
    (w) => w !== fromWeek,
  )
  const [selected, setSelected] = useState<number[]>([])

  const toggle = (week: number) =>
    setSelected((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week],
    )

  const allSelected = selected.length === weeks.length

  return (
    <Modal
      title="Duplicate this plan"
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!selected.length || pending}
            onClick={() => onConfirm(selected)}
          >
            {pending
              ? 'Copying…'
              : `Copy to ${selected.length} week${selected.length === 1 ? '' : 's'}`}
          </button>
        </>
      }
    >
      <p className="dup-sheet-intro">
        Copy the <strong>Week {fromWeek}</strong> plan for the{' '}
        <strong>{band} kcal</strong> band into the weeks you pick. Anything
        already saved in those weeks is replaced.
      </p>

      <div className="dup-sheet-head">
        <span className="dup-sheet-count">
          {selected.length} of {weeks.length} selected
        </span>
        <button
          className="link-btn"
          onClick={() => setSelected(allSelected ? [] : weeks)}
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>

      <div className="dup-sheet-weeks">
        {weeks.map((week) => {
          const checked = selected.includes(week)
          return (
            <label
              key={week}
              className={`dup-sheet-week${checked ? ' is-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(week)}
              />
              <span className="dup-sheet-week-label">Week {week}</span>
              {checked ? (
                <Icon name="check" className="dup-sheet-week-check" />
              ) : null}
            </label>
          )
        })}
      </div>
    </Modal>
  )
}
