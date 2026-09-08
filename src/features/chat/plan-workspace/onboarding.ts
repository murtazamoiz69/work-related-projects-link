// The onboarding questionnaire and the energy maths it feeds.
//
// Source: "Activity and diet calculation" (client document). Seven questions —
// four on activity, one dietary preference, one 6-week weight-loss target, one
// on health issues — plus the height/weight already captured on the profile.
// The chain is:
//
//   BMR  ->  PAL (from the activity answers)  ->  TDEE = BMR x PAL
//   ->  minus the deficit for the chosen target  ->  daily intake
//
// ASSUMPTION: no backend serves these answers yet. The values shown in the
// Plan Workspace are derived client-side from the seeded client record; swap
// the derivation for the real onboarding payload when it exists.

export const STEP_BANDS = [
  '<3,000',
  '3,000–6,000',
  '6,000–8,000',
  '8,000–10,000',
  '>10,000',
] as const
export type StepBand = (typeof STEP_BANDS)[number]

export const LIFESTYLES = [
  'Mostly sitting',
  'Mixed sitting + standing/walking',
  'Mostly standing/walking',
  'Physically demanding',
] as const
export type Lifestyle = (typeof LIFESTYLES)[number]

export const EXERCISE_FREQUENCIES = [
  '0 days',
  '1–2 days',
  '3–4 days',
  '5–6 days',
] as const
export type ExerciseFrequency = (typeof EXERCISE_FREQUENCIES)[number]

export const INTENSITIES = ['Light', 'Moderate', 'Vigorous'] as const
export type Intensity = (typeof INTENSITIES)[number]

/** Physical Activity Level. TDEE = BMR x PAL. */
export type Pal = 1.2 | 1.35 | 1.5 | 1.65 | 1.8

export const PAL_LABEL: Record<Pal, string> = {
  1.2: 'Sedentary',
  1.35: 'Low active',
  1.5: 'Moderate',
  1.65: 'Active',
  1.8: 'Very active',
}

// One row per lifestyle, one column per exercise frequency, one table per step
// band — transcribed from the five tables in the source document.
const PAL_MATRIX: Record<StepBand, Record<Lifestyle, [Pal, Pal, Pal, Pal]>> = {
  '<3,000': {
    'Mostly sitting': [1.2, 1.35, 1.35, 1.5],
    'Mixed sitting + standing/walking': [1.2, 1.35, 1.35, 1.5],
    'Mostly standing/walking': [1.35, 1.35, 1.5, 1.5],
    'Physically demanding': [1.35, 1.5, 1.5, 1.65],
  },
  '3,000–6,000': {
    'Mostly sitting': [1.2, 1.35, 1.5, 1.5],
    'Mixed sitting + standing/walking': [1.35, 1.35, 1.5, 1.65],
    'Mostly standing/walking': [1.35, 1.5, 1.5, 1.65],
    'Physically demanding': [1.5, 1.5, 1.65, 1.65],
  },
  '6,000–8,000': {
    'Mostly sitting': [1.35, 1.5, 1.5, 1.65],
    'Mixed sitting + standing/walking': [1.5, 1.5, 1.65, 1.65],
    'Mostly standing/walking': [1.5, 1.5, 1.65, 1.8],
    'Physically demanding': [1.5, 1.65, 1.65, 1.8],
  },
  '8,000–10,000': {
    'Mostly sitting': [1.5, 1.5, 1.65, 1.65],
    'Mixed sitting + standing/walking': [1.5, 1.65, 1.65, 1.8],
    'Mostly standing/walking': [1.65, 1.65, 1.8, 1.8],
    'Physically demanding': [1.65, 1.65, 1.8, 1.8],
  },
  '>10,000': {
    'Mostly sitting': [1.5, 1.65, 1.8, 1.8],
    'Mixed sitting + standing/walking': [1.5, 1.65, 1.8, 1.8],
    'Mostly standing/walking': [1.65, 1.8, 1.8, 1.8],
    'Physically demanding': [1.8, 1.8, 1.8, 1.8],
  },
}

export function palFor(
  steps: StepBand,
  lifestyle: Lifestyle,
  frequency: ExerciseFrequency,
): Pal {
  const col = EXERCISE_FREQUENCIES.indexOf(frequency)
  return PAL_MATRIX[steps][lifestyle][col === -1 ? 0 : col]
}

/** Mifflin-St Jeor, the formula behind the BMR calculator the document links
 *  to. Rounded to whole kcal — the downstream numbers are estimates. */
export function bmrFor(input: {
  gender: 'Female' | 'Male'
  weightKg: number
  heightCm: number
  age: number
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age
  return Math.round(input.gender === 'Male' ? base + 5 : base - 161)
}

export const WEIGHT_LOSS_PLANS = [
  { kg: 2, label: 'Flexible diet', deficit: 400 },
  { kg: 3, label: 'Disciplined diet', deficit: 650 },
  { kg: 4, label: 'Aggressive diet', deficit: 800 },
  { kg: 5, label: 'Restrictive diet', deficit: 1100 },
] as const
export type WeightLossPlan = (typeof WEIGHT_LOSS_PLANS)[number]

/** The floor a derived intake may not go below. */
export const MIN_DAILY_INTAKE = 1300

export type WeightLossOutcome = {
  /** What the user asked for. */
  requested: WeightLossPlan
  /** What they can safely have — the same plan, or the nearest gentler one. */
  applied: WeightLossPlan
  targetIntake: number
  /** True when the request was stepped down to hold the intake floor. */
  downgraded: boolean
}

/** Applies the deficit for the requested 6-week target, then the safety rule:
 *  if the resulting intake falls below the floor, step down to the next less
 *  aggressive plan until it doesn't. The gentlest plan is returned even if it
 *  still misses the floor — that case needs a human, not a quieter number. */
export function resolveWeightLoss(
  tdee: number,
  requestedKg: number,
): WeightLossOutcome {
  const requested =
    WEIGHT_LOSS_PLANS.find((p) => p.kg === requestedKg) ?? WEIGHT_LOSS_PLANS[0]
  let applied = requested
  for (let i = WEIGHT_LOSS_PLANS.indexOf(applied); i >= 0; i--) {
    applied = WEIGHT_LOSS_PLANS[i]
    if (tdee - applied.deficit >= MIN_DAILY_INTAKE) break
  }
  return {
    requested,
    applied,
    targetIntake: tdee - applied.deficit,
    downgraded: applied.kg !== requested.kg,
  }
}

export const HEALTH_ISSUES = [
  'PCOS',
  'Thyroid',
  'Diabetes',
  'Hypertension',
  'High Cholesterol',
  'High Uric acid',
] as const

export const DIETARY_PREFERENCES = [
  'Non-vegetarian',
  'Eggetarian',
  'Pescatarian',
  'Vegetarian',
  'Vegan',
] as const
