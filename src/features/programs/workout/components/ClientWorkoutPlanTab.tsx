import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { apiErrorMessage } from '@/lib/api/errors'
import type { Client } from '@/features/clients'
import { isBlankWeek } from '../workoutPlan.types'
import {
  useClientWorkoutWeekQuery,
  useResetClientWorkoutWeek,
  useSaveClientWorkoutDay,
  useSwapClientWorkoutDays,
} from '../useWorkoutPlan'
import { WorkoutDayRow } from './WorkoutDayRow'

/** One user's workout week. Deliberately the same layout as the programme tab —
 *  what changes is whose plan it is.
 *
 *  Unlike the diet plan there is no filtering here: a user starts on the
 *  programme's week exactly as written, and only diverges when a nutritionist
 *  edits it for them. Once that happens the week stops tracking the programme,
 *  which the banner says out loud and the reset button undoes. */
export function ClientWorkoutPlanTab({
  client,
  totalWeeks,
  activeWeek,
  setActiveWeek,
}: {
  client: Client
  totalWeeks: number
  activeWeek: number
  setActiveWeek: (n: number) => void
}) {
  const [openDay, setOpenDay] = useState<number | null>(null)

  const weekQuery = useClientWorkoutWeekQuery(client.id, activeWeek)
  const saveDay = useSaveClientWorkoutDay(client.id)
  const swapDays = useSwapClientWorkoutDays(client.id)
  const resetWeek = useResetClientWorkoutWeek(client.id)

  const week = weekQuery.data
  const days = week?.days ?? []
  const firstName = client.name.split(' ')[0]

  return (
    <>
      <div className="pw-week-rail">
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

      <section className="pw-section diet-sheet-panel">
        <div className="panel-head diet-sheet-head">
          <div>
            <h2>Week {activeWeek} workout plan</h2>
            <p className="panel-sub">
              {week?.edited
                ? `Edited for ${firstName} — this week no longer follows the programme.`
                : `The programme's week ${activeWeek}, as ${firstName} sees it. Anything you change here applies to them only.`}
            </p>
          </div>

          {week?.edited ? (
            <div className="diet-sheet-actions">
              <span className="diet-filter-chip is-edited">
                <Icon name="pencil" />
                Edited for this user
              </span>
              <button
                className="btn-secondary diet-duplicate-btn"
                disabled={resetWeek.isPending}
                onClick={() => resetWeek.mutate(activeWeek)}
              >
                <Icon name="rotate-ccw" />
                Reset to programme
              </button>
            </div>
          ) : null}
        </div>

        {weekQuery.isPending ? (
          <div className="diet-sheet-loading">
            <span className="skel skel-wide" />
            <span className="skel" />
            <span className="skel" />
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
                The programme has no sessions for week {activeWeek} yet. Write
                them here for {firstName}, or fill the week in Programs first so
                everyone gets them.
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
                  editorContext={` for ${client.name}`}
                  swapPending={swapDays.isPending}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
