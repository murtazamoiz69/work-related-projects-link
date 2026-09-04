// Stateful mock backend for the workout plan — the programme's flat run of days
// and the per-user copies derived from them. Reset with resetWorkoutPlanStore().
//
// A user's day starts as an exact copy of the programme's day and only diverges
// when a nutritionist edits it for them, so an untouched user reads straight
// through to the master. Only edited days are stored per user.
import { buildBlankDay, buildSeedDays } from './workoutPlan.seed'
import type {
  ClientWorkoutPlanDto,
  SaveWorkoutDaysBody,
  WorkoutDayDto,
  WorkoutPlanDto,
} from './workoutPlan.api.types'

let masterDays: WorkoutDayDto[] = []
let masterUpdatedAt = new Date().toISOString()
// key: `${clientId}:${dayNum}` — only days a nutritionist has actually edited
// for a user are stored; every other day reads through to the master.
const clientDayKey = (clientId: string, dayNum: number) =>
  `${clientId}:${dayNum}`
let clientDays = new Map<string, WorkoutDayDto>()

function clone(days: WorkoutDayDto[]): WorkoutDayDto[] {
  return days.map((d) => ({ ...d }))
}

function seed(): void {
  masterDays = buildSeedDays()
  masterUpdatedAt = new Date().toISOString()
  clientDays = new Map()
}
seed()

export function resetWorkoutPlanStore(): void {
  seed()
}

// ---------------------------------------------------------------------------
// Programme (global)
// ---------------------------------------------------------------------------

export function getMasterPlan(): WorkoutPlanDto {
  return { days: clone(masterDays), updatedAt: masterUpdatedAt }
}

/** Write the edited day's `type` + `body` to every day in `days` (the Save's
 *  apply-to-days). Days outside the plan are ignored. */
export function saveMasterDays(body: SaveWorkoutDaysBody): WorkoutPlanDto {
  const targets = new Set(body.days)
  masterDays = masterDays.map((d) =>
    targets.has(d.dayNum)
      ? { dayNum: d.dayNum, type: body.type, body: body.body }
      : d,
  )
  masterUpdatedAt = new Date().toISOString()
  return getMasterPlan()
}

/** Append a new blank day at the end of the run. */
export function addMasterDay(): WorkoutPlanDto {
  const nextNum = masterDays.reduce((m, d) => Math.max(m, d.dayNum), 0) + 1
  masterDays = [...masterDays, buildBlankDay(nextNum)]
  masterUpdatedAt = new Date().toISOString()
  return getMasterPlan()
}

// ---------------------------------------------------------------------------
// Per-user copies
// ---------------------------------------------------------------------------

/** A user's plan: the programme's days, each overlaid with this user's edit if
 *  one exists (and flagged `edited` when it does). The day count follows the
 *  programme — a user's plan has exactly the programme's days. */
export function getClientPlan(clientId: string): ClientWorkoutPlanDto {
  return {
    clientId,
    days: masterDays.map((master) => {
      const override = clientDays.get(clientDayKey(clientId, master.dayNum))
      return override
        ? { ...override, edited: true }
        : { ...master, edited: false }
    }),
    updatedAt: masterUpdatedAt,
  }
}

/** Save the edited day's `type` + `body` to the chosen days, for this user
 *  only. Only days that exist in the programme are written. */
export function saveClientDays(
  clientId: string,
  body: SaveWorkoutDaysBody,
): ClientWorkoutPlanDto {
  const exists = new Set(masterDays.map((d) => d.dayNum))
  for (const dayNum of body.days) {
    if (!exists.has(dayNum)) continue
    clientDays.set(clientDayKey(clientId, dayNum), {
      dayNum,
      type: body.type,
      body: body.body,
    })
  }
  return getClientPlan(clientId)
}

/** Drop this user's edit for one day and go back to the programme's day. */
export function resetClientDay(
  clientId: string,
  dayNum: number,
): ClientWorkoutPlanDto {
  clientDays.delete(clientDayKey(clientId, dayNum))
  return getClientPlan(clientId)
}
