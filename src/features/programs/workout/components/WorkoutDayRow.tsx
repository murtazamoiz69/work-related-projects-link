import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import {
  WORKOUT_DAY_TYPES,
  WORKOUT_DAY_TYPE_ICON,
  WORKOUT_DAY_TYPE_LABEL,
  isBlankDay,
  weekdayName,
  type WorkoutDaySheet,
  type WorkoutDayType,
} from '../workoutPlan.types'

const AUTOSAVE_MS = 900

/** One day of a week: a collapsed summary row that expands into the editor for
 *  that day's session. Collapsed by default because a week is seven of these
 *  and the shape of the week — what's a lifting day, what's cardio, what's off
 *  — is the thing a nutritionist reads first.
 *
 *  The day's name, its type and its session all save together on the same
 *  debounce: renaming "Push Day" to "Upper Body" and rewriting the exercises
 *  under it are one edit as far as the person doing it is concerned. */
export function WorkoutDayRow({
  day,
  weekNum,
  expanded,
  onToggle,
  onSave,
  onSwap,
  otherDays,
  editorContext,
  swapPending,
}: {
  day: WorkoutDaySheet
  weekNum: number
  expanded: boolean
  onToggle: () => void
  onSave: (next: {
    dayNum: number
    label: string
    type: WorkoutDayType
    body: string
  }) => void
  onSwap: (fromDay: number, toDay: number) => void
  /** The other six days, for the swap picker. */
  otherDays: WorkoutDaySheet[]
  /** Distinguishes the global editor from a user's, for screen readers. */
  editorContext: string
  swapPending: boolean
}) {
  const [label, setLabel] = useState(day.label)
  const [type, setType] = useState<WorkoutDayType>(day.type)
  const [draft, setDraft] = useState(day.body)
  // The editor's own serialisation of the loaded session — the only valid thing
  // to compare `draft` against (see RichTextEditor's onSeeded).
  const [baseline, setBaseline] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // A swap, a duplicate or another session's save replaces this day underneath
  // us. Re-seed from the server copy and drop the baseline until the editor
  // reports the new one.
  useEffect(() => {
    setLabel(day.label)
    setType(day.type)
    setDraft(day.body)
    setBaseline(null)
  }, [day.label, day.type, day.body, day.dayNum, weekNum])

  // Derived rather than flagged, for the reason spelled out in DietPlanTab:
  // a dirty flag gets tripped by the editor's own programmatic content changes,
  // and re-seeding a day would then autosave it straight back — writing an
  // empty session over a real one on a week switch.
  const dirtyBody = baseline !== null && draft !== baseline
  const needsSave = dirtyBody || label !== day.label || type !== day.type

  useEffect(() => {
    if (!needsSave) return
    const t = setTimeout(() => {
      onSave({ dayNum: day.dayNum, label, type, body: draft })
      setSaved(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 1600)
    }, AUTOSAVE_MS)
    return () => clearTimeout(t)
    // onSave is recreated per render by the parent; depending on it would make
    // this fire on every render instead of on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSave, label, type, draft, day.dayNum])

  useEffect(() => () => clearTimeout(savedTimer.current), [])

  const blank = isBlankDay(day)
  const weekday = weekdayName(day.dayNum)
  const summary =
    label.trim() || (blank ? 'Not set' : WORKOUT_DAY_TYPE_LABEL[type])

  return (
    <div
      className={`wp-day${expanded ? ' is-open' : ''}${blank ? ' is-blank' : ''}`}
    >
      <div className="wp-day-head">
        <button
          className="wp-day-toggle"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} />
          <span className="wp-day-weekday">{weekday}</span>
          <span className={`wp-type-chip is-${type}`}>
            <Icon name={WORKOUT_DAY_TYPE_ICON[type]} />
            {WORKOUT_DAY_TYPE_LABEL[type]}
          </span>
          <span className="wp-day-name">{summary}</span>
        </button>

        <span
          className={`settings-saved-indicator${saved ? ' show' : ''}`}
          aria-live="polite"
        >
          <Icon name="check" />
          Saved
        </span>

        {/* Swapping is a picker rather than a drag: a week is seven rows, any
            of which may be open with an editor inside it, and dragging over
            that is both fiddly and unreachable from a keyboard. */}
        <label className="wp-swap">
          <select
            className="select-range"
            aria-label={`Swap ${weekday} with another day`}
            value=""
            disabled={swapPending}
            onChange={(e) => {
              const toDay = Number(e.target.value)
              if (toDay) onSwap(day.dayNum, toDay)
            }}
          >
            <option value="">Swap with…</option>
            {otherDays.map((d) => (
              <option key={d.dayNum} value={d.dayNum}>
                {weekdayName(d.dayNum)}
                {d.label.trim() ? ` — ${d.label}` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {expanded ? (
        <div className="wp-day-body">
          <div className="wp-day-fields">
            <label className="wp-field">
              <span className="wp-field-label">Session name</span>
              <input
                type="text"
                placeholder="Push Day, Zone 2 Cardio, Rest Day…"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="wp-field wp-field-type">
              <span className="wp-field-label">Day type</span>
              <select
                className="select-range"
                value={type}
                onChange={(e) => setType(e.target.value as WorkoutDayType)}
              >
                {WORKOUT_DAY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {WORKOUT_DAY_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <LazyRichTextEditor
            ariaLabel={`${weekday} session, week ${weekNum}${editorContext}`}
            value={draft}
            onChange={setDraft}
            // Adopt the editor's serialisation as BOTH the draft and the
            // baseline, so an untouched session compares exactly equal and
            // merely opening a day never writes anything.
            onSeeded={(html) => {
              setBaseline(html)
              setDraft(html)
            }}
          />
          <p className="wp-day-hint">
            <Icon name="play-circle" />
            Put the demo video beside each exercise — select the text and use
            the link button in the toolbar.
          </p>
        </div>
      ) : null}
    </div>
  )
}
