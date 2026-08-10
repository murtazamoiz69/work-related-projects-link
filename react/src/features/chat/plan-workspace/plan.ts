// Plan builder, versioning, validation and the reachable mutation primitives —
// ported from V2's plan-workspace.js. buildWorkoutWeeks / buildDietWeek /
// toMealEntries mirror the (module-private) Programs builders so the workspace
// produces the same per-week shape as the rest of the app.
import { pick, seededRandom } from '@/lib/seed'
import type { Client } from '@/features/clients'
import {
  buildWorkout,
  exerciseById,
  mealById,
  mealsByCategory,
  MEAL_SLOTS,
  newMealEntry,
} from '@/features/programs'
import type { Meal, MealEntry } from '@/features/programs'
import type { MealTemplate, TemplateDietDay } from '@/features/meal-templates'
import {
  computeTargets,
  equipmentAllowed,
  exerciseHardIssue,
  exerciseIssues,
  mealConflicts,
  mealHardConflict,
  pickAltExercise,
  pickSafeMeal,
  SUPPLEMENT_POOL_EXPORT,
} from './clinical'
import type {
  ClinicalProfile,
  MealTotalsLike,
  PlanSnapshot,
  PwWarning,
  Workspace,
  WsDietDay,
  WsDietWeek,
  WsWorkout,
  WsWorkoutWeek,
} from './types'

// Local subset helper (matches clinical.subset but for the supplements roll).
function subset(
  pool: string[],
  seedBase: number,
  chanceNone: number,
  maxCount: number,
): string[] {
  if (seededRandom(seedBase) < chanceNone) return []
  const count =
    1 +
    (seededRandom(seedBase + 1) > 0.6 ? 1 : 0) +
    (maxCount > 2 && seededRandom(seedBase + 2) > 0.8 ? 1 : 0)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const v = pick(pool, seedBase + 3 + i * 3)
    if (!out.includes(v)) out.push(v)
  }
  return out
}

export const WEEKDAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const DEFAULT_MEAL_TIMES: Record<string, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  snack: '16:30',
  dinner: '20:00',
}

// ---- Workout builders (mirror the Programs module's private buildWorkoutWeeks) ----
const DAY_PATTERN_A: Array<number | null> = [0, 5, 1, 5, 2, 3, null]
const DAY_PATTERN_B: Array<number | null> = [1, 5, 2, 5, 0, 4, null]
const DELOAD_DAY_PATTERN: Array<number | null> = [5, 4, null, 5, 4, null, null]

function buildWorkoutWeeks(
  durationWeeks: number,
  difficulty: string,
  seed: number,
): WsWorkoutWeek[] {
  return Array.from({ length: durationWeeks }, (_, wi) => {
    const weekNum = wi + 1
    const isDeload = weekNum % 4 === 0
    const pattern = isDeload
      ? DELOAD_DAY_PATTERN
      : weekNum % 2 === 1
        ? DAY_PATTERN_A
        : DAY_PATTERN_B
    const days = pattern.map((templateIdx, di) => {
      const isRest = templateIdx === null
      const workout: WsWorkout | null = isRest
        ? null
        : buildWorkout(
            templateIdx,
            isDeload ? 'Light' : difficulty,
            seed * 3.1 + wi * 7.7 + di * 1.9,
          )
      return {
        dayNum: di + 1,
        label: WEEKDAY_LABELS[di],
        type: isRest ? ('rest' as const) : ('workout' as const),
        workout,
        extraWorkouts: [] as WsWorkout[],
      }
    })
    return { weekNum, days }
  })
}

// ---- Diet builders ----
function buildDietWeekSlots(
  seed: number,
): Array<{ dayNum: number; label: string; meals: Record<string, string> }> {
  return WEEKDAY_LABELS.map((label, di) => {
    const meals: Record<string, string> = {}
    MEAL_SLOTS.forEach((slot, si) => {
      const pool = mealsByCategory(slot)
      meals[slot.toLowerCase()] = pick(pool, seed * (si + 2) + di * 3.3).id
    })
    return { dayNum: di + 1, label, meals }
  })
}
function toMealEntries(mealsObj: Record<string, string>): MealEntry[] {
  return MEAL_SLOTS.filter((slot) => mealsObj[slot.toLowerCase()]).map((slot) =>
    newMealEntry(mealsObj[slot.toLowerCase()], slot),
  )
}

export function formatTime12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${period}`
}

// ===================== Custom (edited) meals =====================
export function resolveMeal(ws: Workspace, id: string): Meal | undefined {
  return (
    (ws.customMeals && ws.customMeals.find((m) => m.id === id)) || mealById(id)
  )
}
export function wsDailyTotals(ws: Workspace, day: WsDietDay): MealTotalsLike {
  return day.meals.reduce<MealTotalsLike>(
    (acc, entry) => {
      const m = resolveMeal(ws, entry.mealId)
      if (!m) return acc
      acc.calories += m.calories
      acc.protein += m.protein
      acc.carbs += m.carbs
      acc.fat += m.fat
      acc.fiber += m.fiber || 0
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  )
}

// ===================== Timeline defaults =====================
const DEFAULT_WORKOUT_TIME_BY_PREF: Record<string, string> = {
  'Early morning': '06:30',
  'Mid-morning': '09:30',
  Lunchtime: '12:30',
  Evening: '18:00',
  'Late night': '21:00',
}
export function defaultWorkoutTime(profile: ClinicalProfile): string {
  return DEFAULT_WORKOUT_TIME_BY_PREF[profile.preferredTime] || '07:00'
}

// ===================== Build a client's plan =====================
function buildClientPlan(client: Client, profile: ClinicalProfile): Workspace {
  const seed = profile._seed
  const difficulty = profile.workoutDifficulty
  const weeksToBuild = Math.min(Math.max(profile.currentWeek, 4), 13)
  const workoutWeeks = buildWorkoutWeeks(weeksToBuild, difficulty, seed)
  // Personalize workouts: swap any exercise that hard-conflicts with an injury
  // OR needs unavailable equipment for a safe/available alternative.
  workoutWeeks.forEach((w) =>
    w.days.forEach((d) => {
      if (!d.workout) return
      d.workout.exercises.forEach((slot) => {
        const ex = exerciseById(slot.exerciseId)
        if (
          ex &&
          (exerciseHardIssue(ex, profile) ||
            !equipmentAllowed(profile, ex.equipment))
        ) {
          const alt = pickAltExercise(
            ex,
            profile,
            d.workout ? d.workout.exercises.map((s) => s.exerciseId) : [],
          )
          if (alt) slot.exerciseId = alt.id
        }
      })
    }),
  )
  const wTime = defaultWorkoutTime(profile)
  workoutWeeks.forEach((w) =>
    w.days.forEach((d) => {
      if (d.workout) d.workout.time = wTime
      d.extraWorkouts = []
    }),
  )

  // Personalize meals: rotate through the safe options per category (round-robin).
  const rotation: Record<string, Meal[]> = {}
  MEAL_SLOTS.forEach((slot) => {
    const clean = mealsByCategory(slot).filter(
      (m) => mealConflicts(m, profile).length === 0,
    )
    const hardSafe = mealsByCategory(slot).filter(
      (m) => !mealHardConflict(m, profile),
    )
    rotation[slot] = clean.length
      ? clean
      : hardSafe.length
        ? hardSafe
        : mealsByCategory(slot)
  })
  const dietWeeks: WsDietWeek[] = workoutWeeks.map((w, wi) => {
    const slots = buildDietWeekSlots(seed + wi * 517)
    const days: WsDietDay[] = slots.map((day, di) => {
      MEAL_SLOTS.forEach((slot) => {
        const key = slot.toLowerCase()
        const meal = mealById(day.meals[key])
        const options = rotation[slot]
        if (!meal || mealConflicts(meal, profile).length > 0) {
          day.meals[key] = options[di % options.length].id
        }
      })
      return {
        dayNum: day.dayNum,
        label: day.label,
        meals: toMealEntries(day.meals),
      }
    })
    return { weekNum: w.weekNum, days }
  })

  const targets = computeTargets(profile)
  return {
    workoutWeeks,
    dietWeeks,
    targets,
    supplements: subset(SUPPLEMENT_POOL_EXPORT, seed * 40, 0.4, 2),
    hydrationGoal: targets.water,
    planName: client.plan || profile.program,
    planDescription: '',
    published: false,
    versions: [],
    profile,
  }
}

// ===================== Workspace store =====================
const WORKSPACE_STATE: Record<string, Workspace> = {}

export function getWorkspace(
  client: Client,
  profile: ClinicalProfile,
): Workspace {
  if (!WORKSPACE_STATE[client.id]) {
    const ws = buildClientPlan(client, profile)
    pushVersion(
      ws,
      'Initial plan',
      'Sarah Nolan',
      'Generated from user profile & goals',
      true,
    )
    WORKSPACE_STATE[client.id] = ws
  }
  return WORKSPACE_STATE[client.id]
}

// ===================== Versioning =====================
function snapshotPlan(ws: Workspace): PlanSnapshot {
  return JSON.parse(
    JSON.stringify({
      workoutWeeks: ws.workoutWeeks,
      dietWeeks: ws.dietWeeks,
      targets: ws.targets,
      supplements: ws.supplements,
      hydrationGoal: ws.hydrationGoal,
    }),
  ) as PlanSnapshot
}
export function pushVersion(
  ws: Workspace,
  label: string,
  editedBy: string,
  summary: string,
  isInitial?: boolean,
): void {
  const n = ws.versions.length + 1
  ws.versions.unshift({
    id: `v${n}`,
    num: n,
    label,
    editedBy: editedBy || 'Sarah Nolan',
    date: new Date(),
    summary,
    snapshot: snapshotPlan(ws),
    isInitial: !!isInitial,
  })
}

// ===================== Safety guardrails =====================
export function validatePlan(
  profile: ClinicalProfile,
  ws: Workspace,
): PwWarning[] {
  const warnings: PwWarning[] = []
  const seen: Record<string, number> = {}
  ws.dietWeeks.forEach((w) =>
    w.days.forEach((day) => {
      day.meals.forEach((entry) => {
        const meal = resolveMeal(ws, entry.mealId)
        if (!meal) return
        mealConflicts(meal, profile).forEach((c) => {
          warnings.push({
            level: c.level,
            kind: 'diet',
            text: `Wk${w.weekNum} ${day.label} ${entry.slot}: ${meal.name} — ${c.reason}`,
            fix: `Swap to a safe ${entry.slot.toLowerCase()}`,
            week: w.weekNum,
            day: day.dayNum,
            entryUid: entry.uid,
          })
        })
        seen[meal.id] = (seen[meal.id] || 0) + 1
      })
    }),
  )
  Object.entries(seen).forEach(([id, count]) => {
    if (count >= 10) {
      const m = mealById(id)
      warnings.push({
        level: 'soft',
        kind: 'variety',
        text: `“${m ? m.name : 'A meal'}” repeats ${count}× across the program — low variety`,
        fix: 'Diversify meals',
      })
    }
  })
  const cals = ws.targets.calories
  const floor = profile.gender === 'Male' ? 1500 : 1200
  if (cals < floor)
    warnings.push({
      level: 'hard',
      kind: 'calories',
      text: `Target ${cals} kcal is below the safe floor (${floor})`,
      fix: `Raise to at least ${floor} kcal`,
    })
  if (cals > 3500)
    warnings.push({
      level: 'soft',
      kind: 'calories',
      text: `Target ${cals} kcal is unusually high`,
      fix: 'Review calorie target',
    })
  if (ws.targets.protein < profile.weightKg * 1.2)
    warnings.push({
      level: 'soft',
      kind: 'macros',
      text: `Protein (${ws.targets.protein}g) is low for ${profile.weightKg}kg body weight`,
      fix: 'Increase protein target',
    })
  ws.workoutWeeks.forEach((w) =>
    w.days.forEach((d) => {
      if (!d.workout) return
      d.workout.exercises.forEach((slot) => {
        const ex = exerciseById(slot.exerciseId)
        if (!ex) return
        exerciseIssues(ex, profile).forEach((c) => {
          warnings.push({
            level: c.level,
            kind: 'workout',
            text: `Wk${w.weekNum} ${d.label}: ${ex.name} — ${c.reason}`,
            fix: c.reason.startsWith('Needs')
              ? 'Swap to available equipment'
              : 'Swap to a safe exercise',
          })
        })
      })
    }),
  )
  ws.workoutWeeks.forEach((w) => {
    if (!w.days.some((d) => d.type === 'rest'))
      warnings.push({
        level: 'soft',
        kind: 'recovery',
        text: `Week ${w.weekNum} has no rest day`,
        fix: 'Add a recovery day',
      })
  })
  if (!ws.hydrationGoal)
    warnings.push({
      level: 'soft',
      kind: 'hydration',
      text: 'No hydration goal set',
      fix: 'Add a daily water goal',
    })
  return warnings
}

// ===================== Mutation primitives (reachable from the UI) =====================
export function autoFixDietConflicts(
  ws: Workspace,
  profile: ClinicalProfile,
): number {
  let fixed = 0
  ws.dietWeeks.forEach((w) =>
    w.days.forEach((day) =>
      day.meals.forEach((entry) => {
        const meal = resolveMeal(ws, entry.mealId)
        if (meal && mealHardConflict(meal, profile)) {
          entry.mealId = pickSafeMeal(entry.slot, profile, meal.id).id
          fixed++
        }
      }),
    ),
  )
  if (fixed)
    pushVersion(
      ws,
      'Auto-fixed conflicts',
      'Sarah Nolan',
      `Replaced ${fixed} conflicting meal${fixed > 1 ? 's' : ''}`,
    )
  return fixed
}
export function autoFixWorkoutConflicts(
  ws: Workspace,
  profile: ClinicalProfile,
): number {
  let fixed = 0
  ws.workoutWeeks.forEach((w) =>
    w.days.forEach((d) => {
      if (!d.workout) return
      d.workout.exercises.forEach((slot) => {
        const ex = exerciseById(slot.exerciseId)
        if (ex && exerciseHardIssue(ex, profile)) {
          const alt = pickAltExercise(
            ex,
            profile,
            d.workout ? d.workout.exercises.map((s) => s.exerciseId) : [],
          )
          if (alt) {
            slot.exerciseId = alt.id
            fixed++
          }
        }
      })
    }),
  )
  if (fixed)
    pushVersion(
      ws,
      'Swapped unsafe exercises',
      'Sarah Nolan',
      `Replaced ${fixed} exercise${fixed > 1 ? 's' : ''} for safety`,
    )
  return fixed
}

// Builds a fresh, safe-filtered diet week to keep dietWeeks in sync with a new
// workout week (used by generateEmptyWeek on program extension).
function buildDietWeekFor(profile: ClinicalProfile, seed: number): WsDietDay[] {
  const slots = buildDietWeekSlots(seed)
  return slots.map((day) => {
    MEAL_SLOTS.forEach((slot) => {
      const key = slot.toLowerCase()
      const meal = mealById(day.meals[key])
      if (meal && mealHardConflict(meal, profile))
        day.meals[key] = pickSafeMeal(slot, profile, meal.id).id
    })
    return {
      dayNum: day.dayNum,
      label: day.label,
      meals: toMealEntries(day.meals),
    }
  })
}
export function generateEmptyWeek(
  ws: Workspace,
  profile: ClinicalProfile,
): number {
  const last = ws.workoutWeeks[ws.workoutWeeks.length - 1]
  const weekNum = last ? last.weekNum + 1 : 1
  const days = WEEKDAY_LABELS.map((label, i) => ({
    dayNum: i + 1,
    label,
    type: 'rest' as const,
    workout: null,
    extraWorkouts: [] as WsWorkout[],
  }))
  ws.workoutWeeks.push({ weekNum, days })
  ws.dietWeeks.push({
    weekNum,
    days: buildDietWeekFor(profile, profile._seed + weekNum * 517),
  })
  return weekNum
}

// ===================== Meal template library =====================
// Extracts the given week's diet days (filtered to `includeDayNums`) into
// the generic per-weekday shape a MealTemplate stores. Used by both the
// week-save modal (checklist of all 7 days) and the day-save action (a
// single-dayNum set), so a template's day count always matches exactly
// what the nutritionist chose to include.
export function extractWeekAsTemplateDays(
  ws: Workspace,
  weekNum: number,
  includeDayNums: Set<number>,
): TemplateDietDay[] {
  const week = ws.dietWeeks.find((w) => w.weekNum === weekNum)
  if (!week) return []
  return week.days
    .filter((d) => includeDayNums.has(d.dayNum))
    .map((d) => ({
      dayNum: d.dayNum,
      label: d.label,
      meals: d.meals.map((m) => ({ ...m })),
    }))
}

// Applies a Week template's 7 days onto the matching weekdays of one week,
// replacing Monday–Sunday. Regenerates fresh meal uids so the applied
// entries never collide with any other day/client.
export function applyMealTemplateToWeek(
  ws: Workspace,
  weekNum: number,
  template: MealTemplate,
): void {
  const week = ws.dietWeeks.find((w) => w.weekNum === weekNum)
  if (!week) return
  let daysChanged = 0
  template.days.forEach((td) => {
    const day = week.days.find((d) => d.dayNum === td.dayNum)
    if (!day) return
    day.meals = td.meals.map((m) => newMealEntry(m.mealId, m.slot, m.time))
    daysChanged++
  })
  if (daysChanged) {
    pushVersion(
      ws,
      'Applied meal template',
      'Sarah Nolan',
      `"${template.name}" applied to Week ${weekNum} (Monday–Sunday)`,
    )
  }
}

// Applies a Day template onto a single chosen weekday of the target week —
// a Day template's own dayNum is just wherever it happened to be saved from,
// so it's ignored here in favor of the day the nutritionist actually picked.
export function applyMealTemplateToDay(
  ws: Workspace,
  weekNum: number,
  targetDayNum: number,
  template: MealTemplate,
): void {
  const week = ws.dietWeeks.find((w) => w.weekNum === weekNum)
  const day = week?.days.find((d) => d.dayNum === targetDayNum)
  const source = template.days[0]
  if (!day || !source) return
  day.meals = source.meals.map((m) => newMealEntry(m.mealId, m.slot, m.time))
  pushVersion(
    ws,
    'Applied meal template',
    'Sarah Nolan',
    `"${template.name}" applied to Wk${weekNum} ${day.label}`,
  )
}

export { DEFAULT_MEAL_TIMES }
