import { useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import type { TrainingProgram, Workout, WorkoutDay } from '../../types'
import { WeekRail } from './atoms'
import { resolveActiveWeek } from './weekUtils'
import { WorkoutEditorModal } from './WorkoutEditorModal'
import { WorkoutTemplatePickerModal } from './WorkoutTemplatePickerModal'

type EditorTarget = { weekNum: number; dayNum: number }

export function WorkoutPlanTab({
  program: p,
  activeWeek,
  setActiveWeek,
  flashSaved,
}: {
  program: TrainingProgram
  activeWeek: number
  setActiveWeek: (n: number) => void
  flashSaved: () => void
}) {
  const [editor, setEditor] = useState<EditorTarget | null>(null)
  const [templatePicker, setTemplatePicker] = useState<EditorTarget | null>(
    null,
  )
  const dragDay = useRef<number | null>(null)

  const resolvedWeek = resolveActiveWeek(p.workoutWeeks, activeWeek)
  const week = p.workoutWeeks.find((w) => w.weekNum === resolvedWeek)
  const workoutCount = week
    ? week.days.filter((d) => d.type === 'workout').length
    : 0

  const findDay = (t: EditorTarget): WorkoutDay | undefined =>
    p.workoutWeeks
      .find((w) => w.weekNum === t.weekNum)
      ?.days.find((d) => d.dayNum === t.dayNum)

  const handleCardAction = (
    action: 'edit' | 'duplicate' | 'delete',
    weekNum: number,
    dayNum: number,
  ) => {
    const wk = p.workoutWeeks.find((w) => w.weekNum === weekNum)
    const day = wk?.days.find((d) => d.dayNum === dayNum)
    if (!wk || !day) return
    if (action === 'edit') {
      setEditor({ weekNum, dayNum })
      return
    }
    if (action === 'delete') {
      day.type = 'rest'
      day.workout = null
      flashSaved()
      showToast('Workout removed — day is now a rest day')
      return
    }
    if (action === 'duplicate') {
      const restDay = wk.days.find((d) => d.type === 'rest' && d.dayNum !== dayNum)
      if (!restDay) {
        showToast('No rest day available this week to duplicate into')
        return
      }
      const clone = JSON.parse(JSON.stringify(day.workout)) as Workout
      clone.uid = `wk-${Math.round(Math.random() * 1000000)}`
      clone.exercises.forEach((s) => {
        s.uid = `slot-${s.exerciseId}-${Math.round(Math.random() * 100000)}`
      })
      restDay.type = 'workout'
      restDay.workout = clone
      flashSaved()
      showToast(`Duplicated to ${restDay.label}`)
    }
  }

  const onDropDay = (toDayNum: number) => {
    const fromDayNum = dragDay.current
    dragDay.current = null
    if (!week || fromDayNum == null || fromDayNum === toDayNum) return
    const dayA = week.days.find((d) => d.dayNum === fromDayNum)
    const dayB = week.days.find((d) => d.dayNum === toDayNum)
    if (!dayA || !dayB) return
    const tmpType = dayA.type
    const tmpWorkout = dayA.workout
    dayA.type = dayB.type
    dayA.workout = dayB.workout
    dayB.type = tmpType
    dayB.workout = tmpWorkout
    flashSaved()
    showToast('Days swapped')
  }

  const editorDay = editor ? findDay(editor) : null

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Workout Plan</h2>
            <p className="panel-sub">
              Organized by week — drag a day onto another to swap them
            </p>
          </div>
        </div>
        <WeekRail
          weeks={p.workoutWeeks}
          activeWeek={resolvedWeek}
          onSelect={setActiveWeek}
        />
        <div className="prog-week-detail">
          <div className="prog-week-detail-head">
            <span className="pw-week-detail-title">Week {resolvedWeek}</span>
            <span className="pw-week-detail-meta">
              {workoutCount} workout{workoutCount === 1 ? '' : 's'} ·{' '}
              {7 - workoutCount} rest day{7 - workoutCount === 1 ? '' : 's'}
            </span>
          </div>
          <div className="wk-day-list">
            {week
              ? week.days.map((day) => (
                  <div
                    className="wk-day-row"
                    key={day.dayNum}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      onDropDay(day.dayNum)
                    }}
                  >
                    <span className="wk-day-label">{day.label}</span>
                    {day.type === 'rest' || !day.workout ? (
                      <div
                        className="wk-rest-card"
                        draggable
                        onDragStart={() => {
                          dragDay.current = day.dayNum
                        }}
                      >
                        <Icon name="moon" />
                        <span>Rest Day</span>
                        <button
                          className="link-btn"
                          onClick={() =>
                            setTemplatePicker({
                              weekNum: resolvedWeek,
                              dayNum: day.dayNum,
                            })
                          }
                        >
                          Add workout
                        </button>
                      </div>
                    ) : (
                      <div
                        className="workout-card"
                        draggable
                        onDragStart={() => {
                          dragDay.current = day.dayNum
                        }}
                      >
                        <span className="drag-handle" title="Drag to reorder">
                          <Icon name="grip-vertical" />
                        </span>
                        <div
                          className="workout-card-body"
                          onClick={() =>
                            handleCardAction('edit', resolvedWeek, day.dayNum)
                          }
                        >
                          <span className="workout-card-name">
                            {day.workout.name}
                          </span>
                          <div className="workout-card-meta">
                            <span>
                              <Icon name="clock" />
                              {day.workout.estimatedMinutes} min
                            </span>
                            <span>
                              <Icon name="bar-chart-2" />
                              {day.workout.difficulty}
                            </span>
                            <span>
                              <Icon name="flame" />
                              {day.workout.caloriesBurn} kcal
                            </span>
                            <span>
                              <Icon name="list" />
                              {day.workout.exercises.length} exercises
                            </span>
                          </div>
                        </div>
                        <div className="workout-card-actions">
                          <button
                            className="icon-btn sm"
                            title="Edit"
                            onClick={() =>
                              handleCardAction('edit', resolvedWeek, day.dayNum)
                            }
                          >
                            <Icon name="pencil" />
                          </button>
                          <button
                            className="icon-btn sm"
                            title="Duplicate to next rest day"
                            onClick={() =>
                              handleCardAction(
                                'duplicate',
                                resolvedWeek,
                                day.dayNum,
                              )
                            }
                          >
                            <Icon name="copy" />
                          </button>
                          <button
                            className="icon-btn sm danger"
                            title="Delete"
                            onClick={() =>
                              handleCardAction('delete', resolvedWeek, day.dayNum)
                            }
                          >
                            <Icon name="trash-2" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>

      {editor && editorDay && editorDay.workout ? (
        <WorkoutEditorModal
          workout={editorDay.workout}
          weekNum={editor.weekNum}
          dayLabel={editorDay.label}
          onSave={() => {
            setEditor(null)
            flashSaved()
          }}
          onClose={() => setEditor(null)}
        />
      ) : null}

      {templatePicker
        ? (() => {
            const day = findDay(templatePicker)
            if (!day) return null
            return (
              <WorkoutTemplatePickerModal
                dayLabel={day.label}
                difficulty={p.difficulty}
                onCommit={(built) => {
                  day.type = 'workout'
                  day.workout = built
                  setTemplatePicker(null)
                  flashSaved()
                }}
                onClose={() => setTemplatePicker(null)}
              />
            )
          })()
        : null}
    </>
  )
}
