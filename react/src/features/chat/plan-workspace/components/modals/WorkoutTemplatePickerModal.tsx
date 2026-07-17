import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import {
  buildWorkout,
  EXERCISE_LIBRARY,
  exerciseById,
  makeSlot,
  templateEquipment,
  templateMuscles,
  WORKOUT_TEMPLATES,
} from '@/features/programs'
import type { WorkoutSlot } from '@/features/programs'
import {
  equipmentAllowed,
  exerciseHardIssue,
  exerciseIssues,
  pickAltExercise,
} from '../../clinical'
import { defaultWorkoutTime, pushVersion } from '../../plan'
import { isUpcoming, roundToNext15, todayWeekDay } from '../../schedule'
import { getDay } from '../../context'
import type { ClinicalProfile, Workspace, WsWorkout } from '../../types'

export function WorkoutTemplatePickerModal({
  ws,
  profile,
  weekNum,
  dayNum,
  refresh,
  onClose,
}: {
  ws: Workspace
  profile: ClinicalProfile
  weekNum: number
  dayNum: number
  refresh: () => void
  onClose: () => void
}) {
  const day = getDay(ws, weekNum, dayNum)
  const types = useMemo(
    () => [...new Set(WORKOUT_TEMPLATES.map((t) => t.muscle))],
    [],
  )
  const muscles = useMemo(
    () => [...new Set(EXERCISE_LIBRARY.map((e) => e.muscle))].sort(),
    [],
  )
  const equipmentList = useMemo(
    () => [...new Set(EXERCISE_LIBRARY.map((e) => e.equipment))].sort(),
    [],
  )
  const today = todayWeekDay(profile, ws)
  const isToday = today.weekNum === weekNum && today.dayNum === dayNum
  const initialTime = (() => {
    const dft = defaultWorkoutTime(profile)
    return !isUpcoming(profile.programStart, weekNum, dayNum, dft)
      ? roundToNext15(new Date())
      : dft
  })()

  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [muscle, setMuscle] = useState('all')
  const [equipment, setEquipment] = useState('all')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [time, setTime] = useState(initialTime)
  const [slotsCache, setSlotsCache] = useState<Record<number, WorkoutSlot[]>>(
    {},
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()
  const visible = WORKOUT_TEMPLATES.map((t, idx) => ({ t, idx })).filter(
    ({ t }) => {
      if (q && !t.name.toLowerCase().includes(q)) return false
      if (type !== 'all' && t.muscle !== type) return false
      if (muscle !== 'all' && !templateMuscles(t).includes(muscle)) return false
      if (equipment !== 'all' && !templateEquipment(t).includes(equipment))
        return false
      return true
    },
  )

  const selectTemplate = (idx: number) => {
    setActiveIndex(idx)
    setSlotsCache((prev) => {
      if (prev[idx]) return prev
      const seed =
        profile._seed + idx * 991 + Math.round(Math.random() * 100000)
      return {
        ...prev,
        [idx]: WORKOUT_TEMPLATES[idx].exerciseIds.map((id, i) =>
          makeSlot(id, seed, i),
        ),
      }
    })
  }
  const activeSlots = activeIndex != null ? (slotsCache[activeIndex] ?? []) : []

  const updateSlot = (
    i: number,
    field: 'sets' | 'reps' | 'rest',
    value: string,
  ) => {
    if (activeIndex == null) return
    setSlotsCache((prev) => {
      const slots = (prev[activeIndex] ?? []).map((s, idx) =>
        idx === i
          ? {
              ...s,
              [field]:
                field === 'sets'
                  ? Math.max(1, parseInt(value, 10) || 1)
                  : value,
            }
          : s,
      )
      return { ...prev, [activeIndex]: slots }
    })
  }
  const removeSlot = (i: number) => {
    if (activeIndex == null) return
    setSlotsCache((prev) => {
      const slots = (prev[activeIndex] ?? []).filter((_, idx) => idx !== i)
      return { ...prev, [activeIndex]: slots }
    })
  }

  const addDisabled = activeIndex == null || activeSlots.length === 0

  const commit = () => {
    if (activeIndex == null || !activeSlots.length || !day) return
    if (time && !isUpcoming(profile.programStart, weekNum, dayNum, time)) {
      showToast('Pick a time later than now — items must stay upcoming')
      return
    }
    const built: WsWorkout = buildWorkout(
      activeIndex,
      profile.workoutDifficulty,
      profile._seed + Math.round(Math.random() * 100000),
    )
    built.exercises = activeSlots.map((s) => ({ ...s }))
    built.exercises.forEach((slot) => {
      const ex = exerciseById(slot.exerciseId)
      if (
        ex &&
        (exerciseHardIssue(ex, profile) ||
          !equipmentAllowed(profile, ex.equipment))
      ) {
        const alt = pickAltExercise(
          ex,
          profile,
          built.exercises.map((s) => s.exerciseId),
        )
        if (alt) slot.exerciseId = alt.id
      }
    })
    built.time = time || initialTime
    if (day.workout) {
      day.extraWorkouts = day.extraWorkouts || []
      day.extraWorkouts.push(built)
      pushVersion(
        ws,
        `Added extra ${day.label} workout`,
        'Sarah Nolan',
        `${built.name} added as an additional session`,
      )
    } else {
      day.type = 'workout'
      day.workout = built
      pushVersion(
        ws,
        `Added ${day.label} workout`,
        'Sarah Nolan',
        `${built.name} added from the workout catalog`,
      )
    }
    refresh()
    onClose()
  }

  return (
    <div
      className="modal-overlay pw-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card tpl-picker-card pw-tpl-picker">
        <div className="modal-head">
          <h3>Add workout · {day?.label}</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="tpl-picker-toolbar">
          <div className="chat-list-search tpl-picker-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Search workouts…"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="pw-modal-field pw-picker-select">
            Muscle
            <select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
              <option value="all">All muscles</option>
              {muscles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="pw-modal-field pw-picker-select">
            Equipment
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
            >
              <option value="all">All equipment</option>
              {equipmentList.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </label>
          <label className="pw-modal-field pw-picker-select">
            Time
            <input
              type="time"
              value={time}
              min={isToday ? roundToNext15(new Date()) : undefined}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <div className="tpl-picker-chips">
          <button
            className={`prog-meta-chip tpl-cat-chip${type === 'all' ? ' is-active' : ''}`}
            onClick={() => setType('all')}
          >
            All types
          </button>
          {types.map((ty) => (
            <button
              key={ty}
              className={`prog-meta-chip tpl-cat-chip${type === ty ? ' is-active' : ''}`}
              onClick={() => setType(ty)}
            >
              {ty}
            </button>
          ))}
        </div>
        <div className="tpl-picker-body">
          <ul className="tpl-picker-list">
            {visible.length ? (
              visible.map(({ t, idx }) => {
                const risky = t.exerciseIds.filter((id) => {
                  const ex = exerciseById(id)
                  return (
                    ex &&
                    (exerciseHardIssue(ex, profile) ||
                      !equipmentAllowed(profile, ex.equipment))
                  )
                }).length
                return (
                  <li key={idx}>
                    <button
                      className={`tpl-picker-row${idx === activeIndex ? ' is-active' : ''}`}
                      onClick={() => selectTemplate(idx)}
                    >
                      <span className="tpl-picker-row-swatch">
                        <Icon name="dumbbell" />
                      </span>
                      <span className="tpl-picker-row-body">
                        <span className="tpl-picker-row-title">{t.name}</span>
                        <span className="tpl-picker-row-sub">
                          {t.exerciseIds.length} exercises ·{' '}
                          {templateMuscles(t).join(', ')}
                          {risky ? ` · ${risky} to auto-swap` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })
            ) : (
              <li className="assign-empty">No workouts match</li>
            )}
          </ul>
          <div className="tpl-picker-preview">
            {activeIndex == null ? (
              <div className="tpl-picker-empty-preview">
                <Icon name="mouse-pointer-click" />
                <span>Select a workout to preview</span>
              </div>
            ) : (
              <div className="tpl-preview-body pw-preview-body">
                <h4>{WORKOUT_TEMPLATES[activeIndex].name}</h4>
                <p className="pw-muted">
                  {activeSlots.length} exercise
                  {activeSlots.length === 1 ? '' : 's'}. Remove any you
                  don&apos;t want, and sets/reps/rest are editable — the
                  exercises themselves come from the admin catalog.
                </p>
                <div className="pw-preview-ex-list">
                  {activeSlots.length ? (
                    activeSlots.map((slot, i) => {
                      const ex = exerciseById(slot.exerciseId)
                      if (!ex) return null
                      const issues = exerciseIssues(ex, profile)
                      const risky = issues.some((x) => x.level === 'hard')
                      return (
                        <div
                          key={slot.uid}
                          className={`pw-preview-ex-row${risky ? ' risk' : ''}`}
                          title={
                            risky
                              ? `${issues.map((x) => x.reason).join('; ')} — will be auto-swapped`
                              : undefined
                          }
                        >
                          <div className="pw-view-ex-media">
                            <Icon name="play-circle" />
                          </div>
                          <div className="pw-view-ex-body">
                            <div className="pw-edit-ex-head">
                              <span className="pw-view-ex-name">{ex.name}</span>
                              <div className="pw-edit-ops">
                                <button
                                  className="icon-btn xs"
                                  title="Remove — won't be added to this workout"
                                  onClick={() => removeSlot(i)}
                                >
                                  <Icon name="trash-2" />
                                </button>
                              </div>
                            </div>
                            <div className="pw-ex-tags">
                              <span className="pw-ex-tag">{ex.muscle}</span>
                              <span className="pw-ex-tag alt">
                                {ex.equipment}
                              </span>
                            </div>
                            <p className="pw-view-ex-desc">{ex.instructions}</p>
                            <div className="pw-edit-ex-fields">
                              <label className="pw-edit-field">
                                Sets
                                <input
                                  type="number"
                                  min={1}
                                  max={8}
                                  value={slot.sets}
                                  onChange={(e) =>
                                    updateSlot(i, 'sets', e.target.value)
                                  }
                                />
                              </label>
                              <label className="pw-edit-field">
                                Reps
                                <input
                                  type="text"
                                  value={slot.reps}
                                  onChange={(e) =>
                                    updateSlot(i, 'reps', e.target.value)
                                  }
                                />
                              </label>
                              <label className="pw-edit-field">
                                Rest
                                <input
                                  type="text"
                                  value={slot.rest}
                                  onChange={(e) =>
                                    updateSlot(i, 'rest', e.target.value)
                                  }
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="pw-muted">
                      All exercises removed — pick another workout or add
                      exercises after saving.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button
            className="btn-primary"
            disabled={addDisabled}
            onClick={commit}
          >
            Add to {day?.label}
          </button>
        </div>
      </div>
    </div>
  )
}
