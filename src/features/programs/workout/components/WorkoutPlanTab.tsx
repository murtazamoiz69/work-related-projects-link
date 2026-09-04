import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  WORKOUT_DAY_TYPES,
  WORKOUT_DAY_TYPE_LABEL,
  type WorkoutDayType,
} from '../workoutPlan.types'
import {
  useAddWorkoutDay,
  useSaveWorkoutDays,
  useWorkoutPlanQuery,
} from '../useWorkoutPlan'
import { SaveToDaysModal } from './SaveToDaysModal'

/** The programme's workout plan: a flat run of days — Day 1, Day 2, … — each a
 *  rich-text session tagged workout / cardio / rest. Pick a day, author it, and
 *  Save writes it to the days you pick; "Add day" extends the run as far as the
 *  programme needs. */
export function WorkoutPlanTab() {
  const planQuery = useWorkoutPlanQuery()
  const saveDays = useSaveWorkoutDays()
  const addDay = useAddWorkoutDay()

  const days = planQuery.data?.days ?? []
  const [activeDay, setActiveDay] = useState(1)
  const [saveOpen, setSaveOpen] = useState(false)

  const current = days.find((d) => d.dayNum === activeDay)
  const [draft, setDraft] = useState('')
  const [draftType, setDraftType] = useState<WorkoutDayType>('workout')
  const currentBody = current?.body
  const currentType = current?.type
  useEffect(() => {
    if (currentBody === undefined) return
    setDraft(currentBody)
    setDraftType(currentType ?? 'rest')
  }, [currentBody, currentType, activeDay])

  return (
    <>
      <div className="prog-week-rail wp-day-rail">
        {days.map((d) => (
          <button
            key={d.dayNum}
            className={`pw-week-chip${d.dayNum === activeDay ? ' active' : ''}`}
            onClick={() => setActiveDay(d.dayNum)}
          >
            Day {d.dayNum}
          </button>
        ))}
        <button
          className="wp-add-day"
          onClick={() => addDay.mutate()}
          disabled={addDay.isPending || planQuery.isPending}
        >
          <Icon name="plus" />
          Add day
        </button>
      </div>

      <section className="panel diet-sheet-panel">
        <div className="panel-head diet-sheet-head">
          <div>
            <h2>Day {activeDay} workout</h2>
            <p className="panel-sub">
              One session per day — warm-up, the main set, and a finisher.
            </p>
          </div>

          <label className="wp-type-picker">
            <span className="diet-band-label">Type</span>
            <select
              className="select-range"
              aria-label="Day type"
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as WorkoutDayType)}
            >
              {WORKOUT_DAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WORKOUT_DAY_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {planQuery.isPending ? (
          <div className="diet-sheet-loading">
            <span className="skel skel-wide" />
            <span className="skel" />
            <span className="skel" />
            <span className="skel skel-narrow" />
          </div>
        ) : planQuery.isError ? (
          <div className="clients-empty is-error" role="alert">
            <Icon name="alert-triangle" />
            <p>{apiErrorMessage(planQuery.error)}</p>
            <button
              className="link-btn clients-empty-retry"
              onClick={() => planQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {!currentBody?.trim() ? (
              <p className="diet-sheet-empty-note">
                <Icon name="info" />
                No session for this day yet. Write it here, then{' '}
                <strong>Save</strong> it to the days it applies to.
              </p>
            ) : null}
            <LazyRichTextEditor
              ariaLabel={`Day ${activeDay} workout`}
              value={draft}
              onChange={setDraft}
              onSeeded={setDraft}
            />

            <div className="diet-save-bar">
              <p className="diet-save-hint">
                Editing <b>Day {activeDay}</b> — Save writes it to the days you
                pick.
              </p>
              <button
                className="btn-primary"
                onClick={() => setSaveOpen(true)}
                disabled={saveDays.isPending}
              >
                <Icon name="check" />
                Save
              </button>
            </div>
          </>
        )}
      </section>

      {saveOpen ? (
        <SaveToDaysModal
          currentDay={activeDay}
          totalDays={days.length}
          pending={saveDays.isPending}
          intro={
            <>
              Save the <strong>Day {activeDay}</strong> session you just edited
              into the days you pick. Anything already on those days is
              replaced.
            </>
          }
          onClose={() => setSaveOpen(false)}
          onConfirm={(chosen) =>
            saveDays.mutate(
              { type: draftType, body: draft, days: chosen },
              { onSuccess: () => setSaveOpen(false) },
            )
          }
        />
      ) : null}
    </>
  )
}
