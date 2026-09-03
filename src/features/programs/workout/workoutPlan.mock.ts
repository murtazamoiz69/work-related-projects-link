// Stateful mock backend for the workout plan — the programme's weeks and the
// per-user copies derived from them. Reset with resetWorkoutPlanStore().
//
// The shape mirrors the diet mock next door with one deliberate difference:
// there is no filtering engine. A user's week starts as an exact copy of the
// programme's week and only diverges when a nutritionist edits it for them, so
// an untouched user reads straight through to the master.
import { PROGRAM_DURATION_WEEKS } from '../data'
import { buildBlankDays, buildMasterWeeks } from './workoutPlan.seed'
import type { WorkoutDaySheet } from './workoutPlan.types'
import type {
  ClientWorkoutWeekDto,
  SaveWorkoutDayBody,
  WorkoutWeekSheetDto,
} from './workoutPlan.api.types'

// key: weekNum
let masterWeeks = new Map<number, WorkoutWeekSheetDto>()
// key: `${clientId}:${weekNum}` — only weeks a nutritionist has actually
// touched are stored; everything else reads through to the master.
let clientWeeks = new Map<string, ClientWorkoutWeekDto>()

const clientKey = (clientId: string, weekNum: number) =>
  `${clientId}:${weekNum}`

/** Days are value objects here — copy them rather than handing out the stored
 *  array, so a caller mutating a response can't reach into the store. */
function cloneDays(days: WorkoutDaySheet[]): WorkoutDaySheet[] {
  return days.map((d) => ({ ...d }))
}

function seed(): void {
  masterWeeks = new Map(
    buildMasterWeeks(PROGRAM_DURATION_WEEKS).map((w) => [
      w.weekNum,
      { ...w, updatedAt: new Date().toISOString() },
    ]),
  )
  clientWeeks = new Map()
}
seed()

export function resetWorkoutPlanStore(): void {
  seed()
}

export function getMasterWeek(
  weekNum: number,
): WorkoutWeekSheetDto | undefined {
  const week = masterWeeks.get(weekNum)
  return week ? { ...week, days: cloneDays(week.days) } : undefined
}

function writeMasterWeek(
  weekNum: number,
  days: WorkoutDaySheet[],
): WorkoutWeekSheetDto {
  const next: WorkoutWeekSheetDto = {
    weekNum,
    days: cloneDays(days),
    updatedAt: new Date().toISOString(),
  }
  masterWeeks.set(weekNum, next)
  return { ...next, days: cloneDays(next.days) }
}

export function saveMasterDay(
  body: SaveWorkoutDayBody,
): WorkoutWeekSheetDto | undefined {
  const week = masterWeeks.get(body.weekNum)
  if (!week) return undefined
  const days = week.days.map((d) =>
    d.dayNum === body.dayNum
      ? {
          dayNum: d.dayNum,
          label: body.label,
          type: body.type,
          body: body.body,
        }
      : { ...d },
  )
  return writeMasterWeek(body.weekNum, days)
}

/** Swap two days inside a week. The day *numbers* stay put — Monday is still
 *  Monday — and everything else about the two days trades places. */
function swapDays(
  days: WorkoutDaySheet[],
  fromDay: number,
  toDay: number,
): WorkoutDaySheet[] | undefined {
  const a = days.find((d) => d.dayNum === fromDay)
  const b = days.find((d) => d.dayNum === toDay)
  if (!a || !b || fromDay === toDay) return undefined
  return days.map((d) => {
    if (d.dayNum === fromDay) return { ...b, dayNum: fromDay }
    if (d.dayNum === toDay) return { ...a, dayNum: toDay }
    return { ...d }
  })
}

export function swapMasterDays(
  weekNum: number,
  fromDay: number,
  toDay: number,
): WorkoutWeekSheetDto | undefined {
  const week = masterWeeks.get(weekNum)
  if (!week) return undefined
  const days = swapDays(week.days, fromDay, toDay)
  if (!days) return undefined
  return writeMasterWeek(weekNum, days)
}

/** Copy one week's seven days onto other weeks. Self-targets and weeks outside
 *  the programme are dropped rather than erroring — the caller gets back the
 *  list of weeks actually written. */
export function duplicateMasterWeek(
  fromWeek: number,
  toWeeks: number[],
): number[] {
  const source = masterWeeks.get(fromWeek)
  if (!source) return []
  const written: number[] = []
  for (const week of toWeeks) {
    if (week === fromWeek) continue
    if (week < 1 || week > PROGRAM_DURATION_WEEKS) continue
    writeMasterWeek(week, source.days)
    written.push(week)
  }
  return written
}

// ---------------------------------------------------------------------------
// Per-user copies
// ---------------------------------------------------------------------------

/** A user's week: their own copy if a nutritionist has edited one, otherwise
 *  the programme's week verbatim. */
export function getClientWeek(
  clientId: string,
  weekNum: number,
): ClientWorkoutWeekDto {
  const existing = clientWeeks.get(clientKey(clientId, weekNum))
  if (existing) return { ...existing, days: cloneDays(existing.days) }

  const master = masterWeeks.get(weekNum)
  return {
    clientId,
    weekNum,
    days: cloneDays(master?.days ?? buildBlankDays()),
    edited: false,
    updatedAt: master?.updatedAt ?? new Date().toISOString(),
  }
}

function writeClientWeek(
  clientId: string,
  weekNum: number,
  days: WorkoutDaySheet[],
): ClientWorkoutWeekDto {
  const next: ClientWorkoutWeekDto = {
    clientId,
    weekNum,
    days: cloneDays(days),
    edited: true,
    updatedAt: new Date().toISOString(),
  }
  clientWeeks.set(clientKey(clientId, weekNum), next)
  return { ...next, days: cloneDays(next.days) }
}

export function saveClientDay(
  clientId: string,
  body: SaveWorkoutDayBody,
): ClientWorkoutWeekDto {
  const current = getClientWeek(clientId, body.weekNum)
  const days = current.days.map((d) =>
    d.dayNum === body.dayNum
      ? {
          dayNum: d.dayNum,
          label: body.label,
          type: body.type,
          body: body.body,
        }
      : d,
  )
  return writeClientWeek(clientId, body.weekNum, days)
}

export function swapClientDays(
  clientId: string,
  weekNum: number,
  fromDay: number,
  toDay: number,
): ClientWorkoutWeekDto | undefined {
  const current = getClientWeek(clientId, weekNum)
  const days = swapDays(current.days, fromDay, toDay)
  if (!days) return undefined
  return writeClientWeek(clientId, weekNum, days)
}

/** Throw away this user's version of a week and go back to the programme's. */
export function resetClientWeek(
  clientId: string,
  weekNum: number,
): ClientWorkoutWeekDto {
  clientWeeks.delete(clientKey(clientId, weekNum))
  return getClientWeek(clientId, weekNum)
}
