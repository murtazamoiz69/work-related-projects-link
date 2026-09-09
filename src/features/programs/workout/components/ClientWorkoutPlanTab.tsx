import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import { useUnsavedEdits } from '@/store/useUnsavedEdits'
import { ReviewTag } from '../../components/ReviewTag'
import { isApiError } from '@/lib/api/types'
import type { Client } from '@/features/clients'
import {
  useClientWorkoutPlanQuery,
  useResetClientWorkoutDay,
  useSaveClientWorkoutDays,
} from '../useWorkoutPlan'
import { SaveToDaysModal } from './SaveToDaysModal'

/** One user's workout plan — the programme's run of days, as this user sees it.
 *  Same layout as the programme tab; what changes is whose plan it is. There is
 *  no filtering: a day starts as the programme's day verbatim and only diverges
 *  when a nutritionist edits it for this user, which the "edited" chip says out
 *  loud and Reset undoes. The day count follows the programme (no Add day). */
export function ClientWorkoutPlanTab({ client }: { client: Client }) {
  const planQuery = useClientWorkoutPlanQuery(client.id)
  const saveDays = useSaveClientWorkoutDays(client.id)
  const resetDay = useResetClientWorkoutDay(client.id)

  const days = planQuery.data?.days ?? []
  const [activeDay, setActiveDay] = useState(1)
  const [saveOpen, setSaveOpen] = useState(false)

  const current = days.find((d) => d.dayNum === activeDay)
  const edited = current?.edited ?? false
  const [draft, setDraft] = useState('')
  const setDirty = useUnsavedEdits((s) => s.setDirty)
  const currentBody = current?.body
  useEffect(() => {
    if (currentBody === undefined) return
    setDraft(currentBody)
  }, [currentBody, activeDay])

  const firstName = client.name.split(' ')[0]

  // Same unsaved-edit flag as the diet tab (OP-4).
  useEffect(() => {
    const isDirty = currentBody !== undefined && draft !== currentBody
    setDirty(
      'client-workout',
      isDirty ? `${firstName}'s Day ${activeDay} workout` : null,
    )
    return () => setDirty('client-workout', null)
  }, [draft, currentBody, activeDay, firstName, setDirty])

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
            {d.edited ? <span className="wp-day-edited-dot" /> : null}
          </button>
        ))}
      </div>

      <section className="pw-section diet-sheet-panel">
        <div className="panel-head diet-sheet-head">
          <div>
            <h2>
              Day {activeDay} workout
              <ReviewTag status={client.dietReview} />
            </h2>
            <p className="panel-sub">
              {edited
                ? `Edited for ${firstName} — this day no longer follows the programme.`
                : `The programme's Day ${activeDay}, as ${firstName} sees it. Anything you change here applies to them only.`}
            </p>
          </div>

          {edited ? (
            <div className="diet-sheet-actions">
              <button
                className="btn-secondary diet-duplicate-btn"
                disabled={resetDay.isPending}
                onClick={() => resetDay.mutate(activeDay)}
              >
                <Icon name="rotate-ccw" />
                Reset to programme
              </button>
            </div>
          ) : null}
        </div>

        {planQuery.isPending ? (
          <div className="diet-sheet-loading">
            <span className="skel skel-wide" />
            <span className="skel" />
            <span className="skel" />
          </div>
        ) : planQuery.isError &&
          isApiError(planQuery.error) &&
          planQuery.error.kind === 'not-found' ? (
          <p className="diet-sheet-empty-note">
            <Icon name="info" />
            {firstName} doesn’t have a workout plan yet — it’s set once they
            finish onboarding.
          </p>
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
                The programme has no session for this day yet. Write one here
                for {firstName}, or fill the day in Programs first so everyone
                gets it.
              </p>
            ) : null}
            <LazyRichTextEditor
              ariaLabel={`Day ${activeDay} workout for ${client.name}`}
              value={draft}
              onChange={setDraft}
            />

            <div className="diet-save-bar">
              <p className="diet-save-hint">
                Editing{' '}
                <b>
                  {firstName}&apos;s Day {activeDay}
                </b>{' '}
                — Save writes it to the days you pick.
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
              Save the day you just edited for <strong>{firstName}</strong> into
              the days you pick. Only this user is affected.
            </>
          }
          onClose={() => setSaveOpen(false)}
          onConfirm={(chosen) =>
            saveDays.mutate(
              { body: draft, days: chosen },
              { onSuccess: () => setSaveOpen(false) },
            )
          }
        />
      ) : null}
    </>
  )
}
