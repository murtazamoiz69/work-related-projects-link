import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import { DuplicateWeeksModal } from '../../components/DuplicateWeeksModal'
import { isBlankWeek } from '../workoutPlan.types'
import {
  useDuplicateWorkoutWeek,
  useSaveWorkoutDay,
  useSwapWorkoutDays,
  useWorkoutWeekQuery,
} from '../useWorkoutPlan'
import { WorkoutDayRow } from './WorkoutDayRow'

/** The programme's workout plan. One week at a time, seven days down the page,
 *  each expanding into the session for that day. Same rhythm as the diet tab
 *  next door — pick a week on the rail, author it, carry it forward with
 *  Duplicate — because a nutritionist moving between the two shouldn't have to
 *  learn a second way of working. */
export function WorkoutPlanTab({
  totalWeeks,
  activeWeek,
  setActiveWeek,
}: {
  totalWeeks: number
  activeWeek: number
  setActiveWeek: (n: number) => void
}) {
  const [openDay, setOpenDay] = useState<number | null>(null)
  const [duplicateOpen, setDuplicateOpen] = useState(false)

  const weekQuery = useWorkoutWeekQuery(activeWeek)
  const saveDay = useSaveWorkoutDay()
  const swapDays = useSwapWorkoutDays()
  const duplicate = useDuplicateWorkoutWeek()

  const week = weekQuery.data
  const days = week?.days ?? []
  const counts = {
    workout: days.filter((d) => d.type === 'workout').length,
    cardio: days.filter((d) => d.type === 'cardio').length,
  }

  return (
    <>
      <div className="prog-week-rail">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
          <button
            key={w}
            className={`pw-week-chip${w === activeWeek ? ' active' : ''}`}
            onClick={() => {
              setActiveWeek(w)
              setOpenDay(null)
            }}
          >
            Week {w}
          </button>
        ))}
      </div>

      <section className="panel diet-sheet-panel">
        <div className="panel-head diet-sheet-head">
          <div>
            <h2>Week {activeWeek} workout plan</h2>
            <p className="panel-sub">
              {week && !isBlankWeek(week)
                ? `${counts.workout} training day${counts.workout === 1 ? '' : 's'} · ${counts.cardio} cardio · ${7 - counts.workout - counts.cardio} rest`
                : 'Seven days, one session each — open a day to write it.'}
            </p>
          </div>

          <div className="diet-sheet-actions">
            <button
              className="btn-secondary diet-duplicate-btn"
              onClick={() => setDuplicateOpen(true)}
              disabled={weekQuery.isPending || weekQuery.isError}
            >
              <Icon name="copy" />
              Duplicate
            </button>
          </div>
        </div>

        {weekQuery.isPending ? (
          <div className="diet-sheet-loading">
            <span className="skel skel-wide" />
            <span className="skel" />
            <span className="skel" />
            <span className="skel skel-narrow" />
          </div>
        ) : weekQuery.isError ? (
          <div className="clients-empty is-error" role="alert">
            <Icon name="alert-triangle" />
            <p>{apiErrorMessage(weekQuery.error)}</p>
            <button
              className="link-btn clients-empty-retry"
              onClick={() => weekQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {week && isBlankWeek(week) ? (
              <p className="diet-sheet-empty-note">
                <Icon name="info" />
                No sessions for this week yet. Open a day and write it, or go to
                a week that has one and use <strong>Duplicate</strong> to copy
                the whole week across.
              </p>
            ) : null}
            <div className="wp-day-list">
              {days.map((day) => (
                <WorkoutDayRow
                  key={day.dayNum}
                  day={day}
                  weekNum={activeWeek}
                  expanded={openDay === day.dayNum}
                  onToggle={() =>
                    setOpenDay((prev) =>
                      prev === day.dayNum ? null : day.dayNum,
                    )
                  }
                  onSave={(next) =>
                    saveDay.mutate({ weekNum: activeWeek, ...next })
                  }
                  onSwap={(fromDay, toDay) =>
                    swapDays.mutate({ weekNum: activeWeek, fromDay, toDay })
                  }
                  otherDays={days.filter((d) => d.dayNum !== day.dayNum)}
                  editorContext=""
                  swapPending={swapDays.isPending}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {duplicateOpen ? (
        <DuplicateWeeksModal
          title="Duplicate this week"
          intro={
            <>
              Copy all seven days of <strong>Week {activeWeek}</strong> — their
              names, types and sessions — into the weeks you pick. Anything
              already saved in those weeks is replaced.
            </>
          }
          fromWeek={activeWeek}
          totalWeeks={totalWeeks}
          pending={duplicate.isPending}
          onClose={() => setDuplicateOpen(false)}
          onConfirm={(weeks) =>
            duplicate.mutate(
              { fromWeek: activeWeek, toWeeks: weeks },
              {
                onSuccess: () => setDuplicateOpen(false),
                onError: (error) => showToast(apiErrorMessage(error)),
              },
            )
          }
        />
      ) : null}
    </>
  )
}
