import { Icon } from '@/components/atoms/Icon'

/** The "Save to…" week checklist, sitting beside the editor rather than behind
 *  a Save button — the nutritionist can see and change the target weeks while
 *  still writing the sheet. Replaces the old SaveToWeeksModal: same presets
 *  and the same checkbox list, just inline. Shared by the global and per-user
 *  diet tabs. */
export function WeekSaveTargets({
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
  const allWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)

  const sameSet = (a: number[]) =>
    a.length === selected.length && a.every((w) => selected.includes(w))

  const presets: { key: string; label: string; weeks: number[] }[] = [
    { key: 'this', label: 'This week', weeks: [currentWeek] },
    { key: 'all', label: 'All weeks', weeks: allWeeks },
  ]

  return (
    <div className="diet-weeks-col">
      <span className="diet-weeks-col-label">Save to</span>

      <div className="save-weeks-presets">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            className="save-weeks-preset"
            aria-pressed={sameSet(p.weeks)}
            onClick={() => onSelect(p.weeks)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="dup-sheet-weeks">
        {allWeeks.map((week) => {
          const checked = selected.includes(week)
          const isCurrent = week === currentWeek
          return (
            <label
              key={week}
              className={`dup-sheet-week${checked ? ' is-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(week)}
              />
              <span className="dup-sheet-week-label">Week {week}</span>
              {isCurrent ? (
                <span className="save-weeks-editing">editing</span>
              ) : null}
              {checked ? (
                <Icon name="check" className="dup-sheet-week-check" />
              ) : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}
