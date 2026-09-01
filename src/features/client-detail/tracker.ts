// Daily fitness/nutrition tracker — the per-day log behind the Program tab's
// stat row, trend charts, and calendar. Deterministic per client + program,
// same seeded-mock philosophy as the rest of client-detail/data.ts.
import { seededRandom } from '@/lib/seed'
import type { Client } from '@/features/clients'
import type { ChatActivityItem } from '@/features/chat'
import { MEAL_SLOTS } from '@/features/programs'
import type { ClientDetail, Program } from './types'

// Every day's plan has the same meal slots (Breakfast/Lunch/Snack/Dinner), so
// "meals missed" is simply the slots that never got a log against them.
export const MEALS_PER_DAY = MEAL_SLOTS.length

// The two training slots the daily log already tracks per day — the strength
// workout and the post-workout cardio. Counting them as fixed slots (rather
// than a separate seeded schedule) keeps "N missed" agreeing with the
// panel's own "Not logged" chips for Workout / PW Cardio.
export const SESSIONS_PER_DAY = 2

// Local-time date key (matching chat/data.ts's own item.time.toDateString()
// grouping) — not toISOString(), which is UTC and would silently shift the
// tracker's local-midnight-normalized dates back a day in any positive-UTC
// timezone, misaligning them against the real activity log's timestamps.
export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type DailyLog = {
  date: Date
  calEaten: number | null
  calBurned: number | null
  steps: number | null
  hydrationL: number | null
  workout: boolean
  cardio: boolean
  // Slot-level counts behind calEaten / workout+cardio, so the day panel can
  // say "2 of 4 meals logged, 2 missed" rather than only a kcal total. Logged
  // never exceeds planned — a session that happened was, by definition, on
  // the plan.
  mealsLogged: number
  mealsPlanned: number
  workoutsLogged: number
  workoutsPlanned: number
  weightKg: number | null
  // The weight to actually show/use for this day: the real logged value if
  // there is one, otherwise the most recent prior weigh-in carried forward —
  // a client's weight doesn't reset to "unknown" just because they skipped a
  // weigh-in, it stays whatever it last was until a new one changes it.
  weightKgCarried: number | null
}

export type TrackerTargets = {
  calEaten: number
  calBurned: number
  steps: number
  hydrationL: number
  weightGoalKg: number
}

export type ProgramTracker = {
  days: DailyLog[]
  targets: TrackerTargets
}

function dayRange(start: Date, end: Date): Date[] {
  const out: Date[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const last = new Date(end)
  last.setHours(0, 0, 0, 0)
  while (cur <= last) {
    out.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// Real, already-logged activity (meals/workouts/weight from the Chat
// "User Activity" log) always wins over generated data for the days it
// covers — the tracker must never contradict what that log already shows.
// The log only spans a short recent window (today back ~8 days, per
// ACTIVITY_SPAN_DAYS in chat/data.ts), so this only overrides the tail end
// of a longer program; everything before that window stays generated.
function realDataFromActivity(activity: ChatActivityItem[]): {
  windowKeys: Set<string>
  calEatenByDate: Map<string, number>
  mealCountByDate: Map<string, number>
  workoutCountByDate: Map<string, number>
  weightByDate: Map<string, number>
} {
  const windowKeys = new Set<string>()
  const calEatenByDate = new Map<string, number>()
  const mealCountByDate = new Map<string, number>()
  const workoutCountByDate = new Map<string, number>()
  const weightByDate = new Map<string, number>()
  activity.forEach((item) => {
    if (item.upcoming) return
    const key = dateKey(item.time)
    windowKeys.add(key)
    if (item.kind === 'meal') {
      mealCountByDate.set(key, (mealCountByDate.get(key) ?? 0) + 1)
      const match = item.detail.match(/(\d+)\s*kcal/)
      if (match) {
        calEatenByDate.set(
          key,
          (calEatenByDate.get(key) ?? 0) + Number(match[1]),
        )
      }
    } else if (item.kind === 'workout') {
      workoutCountByDate.set(key, (workoutCountByDate.get(key) ?? 0) + 1)
    } else if (item.kind === 'weight') {
      const match = item.detail.match(/(\d+(?:\.\d+)?)\s*kg\s*$/)
      if (match) weightByDate.set(key, Number(match[1]))
    }
  })
  return {
    windowKeys,
    calEatenByDate,
    mealCountByDate,
    workoutCountByDate,
    weightByDate,
  }
}

export function buildProgramTracker(
  client: Client,
  detail: ClientDetail,
  program: Program,
  seed: number,
  activity: ChatActivityItem[] = [],
): ProgramTracker {
  const today = new Date()
  const end = program.endDate < today ? program.endDate : today
  const dates = dayRange(program.startDate, end)
  const real = realDataFromActivity(activity)

  const calEatenTarget = 1400 + Math.floor(seededRandom(seed * 11) * 900)
  const calBurnedTarget =
    calEatenTarget + 400 + Math.floor(seededRandom(seed * 12) * 300)
  const stepsTarget = 8000 + Math.floor(seededRandom(seed * 13) * 4000)
  const hydrationTarget =
    Math.round((1.5 + seededRandom(seed * 14) * 1.5) * 10) / 10
  const weightGoalKg = detail.targetWeightKg

  // How likely this client is to log anything at all, driven by their overall
  // adherence — then three flat per-client rolls (not per-day) decide whether
  // they track weight/workouts/cardio at all, so a gap reads as a real habit
  // rather than random daily noise.
  const baseAdh = (client.adherence ?? 55) / 100
  const logsWeight = seededRandom(seed * 15) < Math.min(0.85, baseAdh + 0.15)
  const logsWorkout = seededRandom(seed * 16) < Math.min(0.8, baseAdh + 0.1)
  const logsCardio = seededRandom(seed * 17) < Math.min(0.7, baseAdh + 0.05)
  const weighInDow = Math.floor(seededRandom(seed * 18) * 7)

  let runningWeight =
    detail.weightKg + (weightGoalKg < detail.weightKg ? 2 : -2)

  const days: DailyLog[] = dates.map((date, i) => {
    const s = seed * 100 + i * 3.7

    const eatenChance = Math.min(0.95, baseAdh + 0.25)
    const calEaten =
      seededRandom(s * 1.3) < eatenChance
        ? Math.round(calEatenTarget * (0.55 + seededRandom(s * 1.4) * 0.65))
        : null

    const burnedChance = Math.min(0.9, baseAdh + 0.15)
    const calBurned =
      seededRandom(s * 2.3) < burnedChance
        ? Math.round(calBurnedTarget * (0.6 + seededRandom(s * 2.4) * 0.7))
        : null

    const stepsChance = Math.min(0.85, baseAdh + 0.1)
    const steps =
      seededRandom(s * 3.3) < stepsChance
        ? Math.round(stepsTarget * (0.4 + seededRandom(s * 3.4) * 1.1))
        : null

    const hydrationChance = Math.min(0.9, baseAdh + 0.2)
    const hydrationL =
      seededRandom(s * 4.3) < hydrationChance
        ? Math.round(
            hydrationTarget * (0.5 + seededRandom(s * 4.4) * 0.9) * 100,
          ) / 100
        : null

    const workout = logsWorkout && seededRandom(s * 5.3) < 0.5
    const cardio = logsCardio && seededRandom(s * 6.3) < 0.4

    // How many of the day's four meal slots got logged. Tied to calEaten so
    // the two can't disagree: no intake logged means no meals logged, and a
    // logged intake always accounts for at least one slot.
    const mealsLoggedGen =
      calEaten == null
        ? 0
        : 1 + Math.floor(seededRandom(s * 8.3) * baseAdh * MEALS_PER_DAY)

    let weightKg: number | null = null
    if (
      logsWeight &&
      date.getDay() === weighInDow &&
      seededRandom(s * 7.3) < 0.8
    ) {
      runningWeight +=
        (weightGoalKg - runningWeight) * 0.08 +
        (seededRandom(s * 7.9) - 0.5) * 0.6
      weightKg = Math.round(runningWeight * 10) / 10
    }

    // Any day the real activity log actually covers overrides the generated
    // guess for calories eaten / workout / weight — including overriding to
    // "not logged" when the log covers that day but shows nothing, since
    // that's real information too, not just an absence of a signal.
    const key = dateKey(date)
    const inWindow = real.windowKeys.has(key)
    const finalCalEaten = inWindow
      ? (real.calEatenByDate.get(key) ?? null)
      : calEaten
    const realWorkouts = real.workoutCountByDate.get(key) ?? 0
    const finalWorkout = inWindow ? realWorkouts > 0 : workout
    const finalWeightKg = inWindow
      ? (real.weightByDate.get(key) ?? null)
      : weightKg

    const mealsLogged = inWindow
      ? (real.mealCountByDate.get(key) ?? 0)
      : mealsLoggedGen
    // Cardio stays generated even inside the activity window (the log has no
    // cardio-specific entries), so it's counted the same way in both cases.
    const workoutsLogged = (finalWorkout ? 1 : 0) + (cardio ? 1 : 0)

    return {
      date,
      calEaten: finalCalEaten,
      calBurned,
      steps,
      hydrationL,
      workout: finalWorkout,
      cardio,
      mealsLogged: Math.min(MEALS_PER_DAY, mealsLogged),
      mealsPlanned: MEALS_PER_DAY,
      workoutsLogged,
      workoutsPlanned: SESSIONS_PER_DAY,
      weightKg: finalWeightKg,
      weightKgCarried: finalWeightKg,
    }
  })

  // Carry the last known weigh-in forward over any gaps — the Daily Log
  // Coverage calendar should read "what did we last know their weight to
  // be" rather than "not logged" for every day between weigh-ins.
  let lastKnownWeight: number | null = null
  days.forEach((d) => {
    if (d.weightKg != null) lastKnownWeight = d.weightKg
    d.weightKgCarried = lastKnownWeight
  })

  return {
    days,
    targets: {
      calEaten: calEatenTarget,
      calBurned: calBurnedTarget,
      steps: stepsTarget,
      hydrationL: hydrationTarget,
      weightGoalKg,
    },
  }
}

// ===================== Stat row helpers =====================

export type MetricStatus = 'good' | 'warn' | 'bad' | 'none'

export type NumericStat = {
  // Mean of every logged day so far — the headline number reads as a
  // till-date progress overview rather than whatever happened on the single
  // most recent day, so it agrees in scope with the adherence bar beside it.
  average: number | null
  target: number
  daysLogged: number
  totalDays: number
  consistencyPct: number | null
  status: MetricStatus
}

// A day only counts toward "consistency" once it's actually logged — this
// mirrors the reference dashboard's "≥ floor, of logged days" semantics
// rather than penalizing days that were simply never tracked.
export function numericStat(
  values: (number | null)[],
  target: number,
  floorRatio = 0.9,
): NumericStat {
  const totalDays = values.length
  const logged = values.filter((v): v is number => v != null)
  const daysLogged = logged.length
  // Left unrounded here so callers with sub-integer units (hydration's
  // litres) don't lose precision to a premature Math.round; whole-number
  // metrics (kcal, steps) round at their own display site instead.
  const average = daysLogged
    ? logged.reduce((a, b) => a + b, 0) / daysLogged
    : null
  const floor = target * floorRatio
  const consistencyPct = daysLogged
    ? Math.round((logged.filter((v) => v >= floor).length / daysLogged) * 100)
    : null
  let status: MetricStatus
  if (daysLogged === 0) status = 'none'
  else if (average !== null && average >= target) status = 'good'
  else if (average !== null && average >= target * 0.7) status = 'warn'
  else status = 'bad'
  return { average, target, daysLogged, totalDays, consistencyPct, status }
}

export type PresenceStat = {
  pct: number
  daysLogged: number
  totalDays: number
  status: MetricStatus
}

export function presenceStat(flags: boolean[]): PresenceStat {
  const totalDays = flags.length
  const daysLogged = flags.filter(Boolean).length
  const pct = totalDays ? Math.round((daysLogged / totalDays) * 100) : 0
  const status: MetricStatus =
    daysLogged === 0 ? 'none' : pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad'
  return { pct, daysLogged, totalDays, status }
}

export type WeightStat = {
  latest: number | null
  goal: number
  daysLogged: number
  totalDays: number
  status: MetricStatus
}

export function weightStat(
  tracker: ProgramTracker,
  fallback: number,
): WeightStat {
  const values = tracker.days.map((d) => d.weightKg)
  const totalDays = values.length
  const logged = values.filter((v): v is number => v != null)
  const daysLogged = logged.length
  const latest = daysLogged ? logged[logged.length - 1] : fallback
  const goal = tracker.targets.weightGoalKg
  let status: MetricStatus
  if (daysLogged === 0) status = 'none'
  else if (Math.abs(latest - goal) <= 1) status = 'good'
  else if (Math.abs(latest - goal) <= 4) status = 'warn'
  else status = 'bad'
  return { latest, goal, daysLogged, totalDays, status }
}
