// Shared lookups + UI types for the Plan Workspace React tree.
import type {
  ClinicalProfile,
  Workspace,
  WsDietDay,
  WsWorkout,
  WsWorkoutDay,
} from './types'

export function getDay(
  ws: Workspace,
  weekNum: number,
  dayNum: number,
): WsWorkoutDay | null {
  const w = ws.workoutWeeks.find((x) => x.weekNum === weekNum)
  return w ? (w.days.find((d) => d.dayNum === dayNum) ?? null) : null
}

// A day's primary workout OR one of its extra sessions.
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
  return w ? (w.days.find((d) => d.dayNum === dayNum) ?? null) : null
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
  | {
      kind: 'workoutEditor'
      weekNum: number
      dayNum: number
      wid: string | null
    }
  | {
      kind: 'workoutPreview'
      weekNum: number
      dayNum: number
      wid: string | null
    }
  | { kind: 'editPlan' }
  | { kind: 'publish' }
  // Hover-triggered Diet Plan library actions — Import shows the picker
  // drawer scoped to a week or single day; Save shows the day-checklist
  // save modal (week) or the plain name-prompt (day).
  | { kind: 'libraryImportWeek'; weekNum: number }
  | { kind: 'libraryImportDay'; weekNum: number; dayNum: number }
  | { kind: 'librarySaveWeek'; weekNum: number }
  | { kind: 'librarySaveDay'; weekNum: number; dayNum: number }

/** A pending confirmation. The plan is live to the user, so anything that
 *  removes or restructures their plan goes through this first. */
export type PwConfirm = {
  title: string
  /** What is about to change, in the user's terms. */
  message: string
  confirmText: string
  danger?: boolean
  onConfirm: () => void
}

// Context passed to the three tab components.
export type PwCtx = {
  profile: ClinicalProfile
  ws: Workspace
  activeWeek: number
  setActiveWeek: (n: number) => void
  currentWeek: number
  refresh: () => void
  openModal: (m: PwModal) => void
  /** Gate a destructive or structural edit behind a confirmation dialog. */
  confirm: (c: PwConfirm) => void
}
