import { useMemo, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import {
  EXERCISE_LIBRARY,
  WORKOUT_TEMPLATES,
  buildWorkout,
  exerciseById,
  makeSlot,
  templateEquipment,
  templateMuscles,
} from '../../data'
import type { Workout, WorkoutSlot } from '../../types'

// Template picker for a rest day — search + type chips + muscle/equipment
// filters, a preview pane with editable sets/reps/rest before committing.
export function WorkoutTemplatePickerModal({
  dayLabel,
  difficulty,
  onCommit,
  onClose,
}: {
  dayLabel: string
  difficulty: string
  onCommit: (workout: Workout) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [muscle, setMuscle] = useState('all')
  const [equipment, setEquipment] = useState('all')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [slotsCache, setSlotsCache] = useState<Record<number, WorkoutSlot[]>>({})

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

  const visibleTemplates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return WORKOUT_TEMPLATES.map((t, idx) => ({ t, idx })).filter(({ t }) => {
      if (q && !t.name.toLowerCase().includes(q)) return false
      if (type !== 'all' && t.muscle !== type) return false
      if (muscle !== 'all' && !templateMuscles(t).includes(muscle)) return false
      if (equipment !== 'all' && !templateEquipment(t).includes(equipment))
        return false
      return true
    })
  }, [query, type, muscle, equipment])

  const selectTemplate = (idx: number) => {
    setActiveIndex(idx)
    setSlotsCache((prev) => {
      if (prev[idx]) return prev
      const seed = (Date.now() % 100000) + idx * 991
      const built = WORKOUT_TEMPLATES[idx].exerciseIds.map((id, i) =>
        makeSlot(id, seed, i),
      )
      return { ...prev, [idx]: built }
    })
  }

  const activeSlots =
    activeIndex == null ? [] : (slotsCache[activeIndex] ?? [])
  const addDisabled = activeIndex == null || activeSlots.length === 0

  const updatePreview = (
    i: number,
    field: 'sets' | 'reps' | 'rest',
    value: string,
  ) => {
    if (activeIndex == null) return
    setSlotsCache((prev) => {
      const list = (prev[activeIndex] ?? []).map((s, idx) =>
        idx === i
          ? {
              ...s,
              [field]:
                field === 'sets' ? Math.max(1, Number(value) || 1) : value,
            }
          : s,
      )
      return { ...prev, [activeIndex]: list }
    })
  }

  const removePreview = (i: number) => {
    if (activeIndex == null) return
    setSlotsCache((prev) => {
      const list = (prev[activeIndex] ?? []).filter((_, idx) => idx !== i)
      return { ...prev, [activeIndex]: list }
    })
  }

  const commit = () => {
    if (activeIndex == null || activeSlots.length === 0) return
    const built = buildWorkout(activeIndex, difficulty, Date.now() % 100000)
    built.exercises = activeSlots.map((s) => ({ ...s }))
    onCommit(built)
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card tpl-picker-card pw-tpl-picker">
        <div className="modal-head">
          <h3>Add workout · {dayLabel}</h3>
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
            {visibleTemplates.length ? (
              visibleTemplates.map(({ t, idx }) => (
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
                      </span>
                    </span>
                  </button>
                </li>
              ))
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
                  {activeSlots.length === 1 ? '' : 's'}. Remove any you don't
                  want, and sets/reps/rest are editable — the exercises
                  themselves come from the admin catalog.
                </p>
                <div className="pw-preview-ex-list">
                  {activeSlots.length ? (
                    activeSlots.map((slot, i) => {
                      const ex = exerciseById(slot.exerciseId)
                      if (!ex) return null
                      return (
                        <div className="pw-preview-ex-row" key={slot.uid}>
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
                                  onClick={() => removePreview(i)}
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
                                    updatePreview(i, 'sets', e.target.value)
                                  }
                                />
                              </label>
                              <label className="pw-edit-field">
                                Reps
                                <input
                                  type="text"
                                  value={slot.reps}
                                  onChange={(e) =>
                                    updatePreview(i, 'reps', e.target.value)
                                  }
                                />
                              </label>
                              <label className="pw-edit-field">
                                Rest
                                <input
                                  type="text"
                                  value={slot.rest}
                                  onChange={(e) =>
                                    updatePreview(i, 'rest', e.target.value)
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
          <button className="btn-primary" disabled={addDisabled} onClick={commit}>
            Add to {dayLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
