// Shared lookups + UI types for the Plan Workspace React tree.
import type { ClinicalProfile, Workspace, WsDietDay, WsWorkout, WsWorkoutDay } from './types'

export function getDay(
  ws: Workspace,
  weekNum: number,
  dayNum: number,
): WsWorkoutDay | null {
  const w = ws.workoutWeeks.find((x) => x.weekNum === weekNum)
  return w ? w.days.find((d) => d.dayNum === dayNum) ?? null : null
}

// A day's primary workout OR one of its extra (Timeline-only) sessions.
export function getWorkoutRef(
  ws: Workspace,
  weekNum: number,
  dayNum: number,
  wid: string | null,
): WsWorkout | null {
  const day = getDay(ws, weekNum, dayNum)
  if (!day) return null
  if (day.workout && (!wid || day.workout.uid === wid)) return day.workout
  return (day.extraWorkouts || []).find((w) => w.uid === wid) ?? null
}

export function getDietDay(
  ws: Workspace,
  weekNum: number,
  dayNum: number,
): WsDietDay | null {
  const w = ws.dietWeeks.find((x) => x.weekNum === weekNum)
  return w ? w.days.find((d) => d.dayNum === dayNum) ?? null : null
}

// The full-screen workspace's modal overlays (rendered above the shell).
export type PwModal =
  | {
      kind: 'mealPicker'
      weekNum: number
      dayNum: number
      entryUid: string | null
      enforceUpcoming: boolean
    }
  | { kind: 'workoutTemplatePicker'; weekNum: number; dayNum: number }
  | { kind: 'workoutEditor'; weekNum: number; dayNum: number; wid: string | null }
  | {
      kind: 'workoutPreview'
      weekNum: number
      dayNum: number
      wid: string | null
    }
  | { kind: 'timelineAddChooser'; weekNum: number; dayNum: number }
  | {
      kind: 'timelineTimeEdit'
      itemKind: 'workout' | 'extraWorkout' | 'meal'
      weekNum: number
      dayNum: number
      itemId: string | null
    }
  | { kind: 'editPlan' }
  | { kind: 'publish' }

// Context passed to the three tab components.
export type PwCtx = {
  profile: ClinicalProfile
  ws: Workspace
  activeWeek: number
  setActiveWeek: (n: number) => void
  currentWeek: number
  refresh: () => void
  openModal: (m: PwModal) => void
}
