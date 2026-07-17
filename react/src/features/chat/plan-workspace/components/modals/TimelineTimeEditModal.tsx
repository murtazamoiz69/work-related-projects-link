import { useState } from 'react'
import { showToast } from '@/lib/toast'
import { formatTime12, pushVersion, resolveMeal } from '../../plan'
import { isUpcoming, roundToNext15, todayWeekDay } from '../../schedule'
import { getDay, getDietDay } from '../../context'
import { PwModalShell } from './PwModalShell'
import type { ClinicalProfile, Workspace } from '../../types'

export function TimelineTimeEditModal({
  ws,
  profile,
  itemKind,
  weekNum,
  dayNum,
  itemId,
  refresh,
  onClose,
}: {
  ws: Workspace
  profile: ClinicalProfile
  itemKind: 'workout' | 'extraWorkout' | 'meal'
  weekNum: number
  dayNum: number
  itemId: string | null
  refresh: () => void
  onClose: () => void
}) {
  let current = '07:00'
  let title = ''
  if (itemKind === 'workout') {
    const d = getDay(ws, weekNum, dayNum)
    if (d?.workout) {
      current = d.workout.time || '07:00'
      title = d.workout.name
    }
  } else if (itemKind === 'extraWorkout') {
    const d = getDay(ws, weekNum, dayNum)
    const wk = (d?.extraWorkouts || []).find((x) => x.uid === itemId)
    if (wk) {
      current = wk.time || '07:00'
      title = wk.name
    }
  } else {
    const day = getDietDay(ws, weekNum, dayNum)
    const entry = day?.meals.find((x) => x.uid === itemId)
    if (entry) {
      const meal = resolveMeal(ws, entry.mealId)
      current = entry.time
      title = meal ? meal.name : entry.slot
    }
  }

  const [time, setTime] = useState(current)
  const today = todayWeekDay(profile, ws)
  const isToday = today.weekNum === weekNum && today.dayNum === dayNum

  const save = () => {
    if (!time) return
    if (!isUpcoming(profile.programStart, weekNum, dayNum, time)) {
      showToast('Pick a time later than now — items must stay upcoming')
      return
    }
    if (itemKind === 'workout') {
      const d = getDay(ws, weekNum, dayNum)
      if (d?.workout) {
        d.workout.time = time
        pushVersion(ws, 'Changed workout time', 'Sarah Nolan', `${d.label} workout moved to ${formatTime12(time)}`)
      }
    } else if (itemKind === 'extraWorkout') {
      const d = getDay(ws, weekNum, dayNum)
      const wk = (d?.extraWorkouts || []).find((x) => x.uid === itemId)
      if (wk) wk.time = time
      pushVersion(ws, 'Changed workout time', 'Sarah Nolan', `${wk ? wk.name : 'Session'} moved to ${formatTime12(time)}`)
    } else {
      const dietDay = getDietDay(ws, weekNum, dayNum)
      const entry = dietDay?.meals.find((x) => x.uid === itemId)
      if (entry) entry.time = time
      const meal = entry ? resolveMeal(ws, entry.mealId) : null
      pushVersion(ws, 'Changed meal time', 'Sarah Nolan', `${dietDay ? dietDay.label : ''}: ${meal ? meal.name : 'meal'} moved to ${formatTime12(time)}`)
    }
    refresh()
    onClose()
  }

  return (
    <PwModalShell
      title={`Change time · ${title}`}
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <label className="pw-modal-field">
        Time
        <input
          type="time"
          value={time}
          min={isToday ? roundToNext15(new Date()) : undefined}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
    </PwModalShell>
  )
}
