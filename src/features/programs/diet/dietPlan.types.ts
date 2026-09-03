// The diet-plan model for Diwali Glow.
//
// The shape here is deliberately different from the old per-day meal grid it
// replaces. A fat-loss programme runs on a calorie deficit, so the plan is
// organised by *daily intake target* rather than by dish: a user is placed in a
// calorie band at onboarding (from their BMR and estimated burn), and the band
// decides which master sheet they follow for the whole six weeks.
//
// A sheet is not a menu of finished dishes. It maps out the day slot by slot —
// waking up, pre-breakfast, breakfast, pre-workout, and so on — and inside each
// slot lists portion-based choices that hit the same macro target, so a protein
// requirement can be met by a stated amount of chicken *or* lentils *or* eggs.
// That is why the body is rich text and not a structured meal list: the sheet
// carries must-haves, swap options, portions and recipe links together, and it
// is what the AI engine reads when it tailors a user's copy.

/** Daily intake targets a user can be placed in, in kcal. Prototype set. */
export const CALORIE_BANDS = [1200, 1400, 1600, 1800, 2000] as const

export type CalorieBand = (typeof CALORIE_BANDS)[number]

export function isCalorieBand(value: unknown): value is CalorieBand {
  return CALORIE_BANDS.some((b) => b === value)
}

/** The three onboarding answers that narrow a master sheet down to one user's
 *  copy. The AI engine filters the sheet's own content against these — it never
 *  invents food that isn't on the master plan. */
export type LifeStage = 'male' | 'female' | 'lactating'

export const MEDICAL_CONDITIONS = [
  'Diabetes',
  'PCOS',
  'Thyroid',
  'Hypertension',
  'Uric Acid',
] as const

export type MedicalCondition = (typeof MEDICAL_CONDITIONS)[number]

export const DIETARY_PREFERENCES = [
  'Non-veg',
  'Veg',
  'Vegan',
  'Eggitarian',
] as const

export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number]

/** Everything captured at onboarding that shapes a user's diet plan. */
export type DietProfile = {
  band: CalorieBand
  lifeStage: LifeStage
  conditions: MedicalCondition[]
  preference: DietaryPreference
}

/** One master sheet: the plan for a single week at a single calorie band.
 *  `body` is the rich-text document (HTML) authored by the nutritionist. */
export type DietPlanSheet = {
  weekNum: number
  band: CalorieBand
  body: string
  updatedAt: Date
}

/** A user's own copy — the master sheet for their week and band, narrowed by
 *  their profile. `edited` flags a sheet the nutritionist has hand-adjusted, so
 *  the UI can say the copy no longer tracks the master. */
export type ClientDietPlan = {
  clientId: string
  weekNum: number
  profile: DietProfile
  body: string
  edited: boolean
  updatedAt: Date
  /** What the engine did to the master sheet to produce this — shown to the
   *  nutritionist so the tailoring is legible rather than magic. */
  appliedFilters: string[]
  /** Whether a nutritionist has signed this plan off. Carried on the plan and
   *  not read off the client record: the surfaces that show a plan don't all
   *  hold a fresh client, and a sign-off that doesn't visibly land is worse
   *  than no sign-off at all. */
  review: PlanReviewStatus
  reviewedAt: Date | null
}

/** Whether a nutritionist has actually looked at the plan the engine produced
 *  for a user. A newly onboarded user's plan is filtered automatically, and
 *  until someone has read it, it is a machine's first guess — so it sits in
 *  review rather than going out. Signing it off is a deliberate click. */
export const PLAN_REVIEW_STATUSES = ['in-review', 'reviewed'] as const

export type PlanReviewStatus = (typeof PLAN_REVIEW_STATUSES)[number]

export function isPlanReviewStatus(value: unknown): value is PlanReviewStatus {
  return PLAN_REVIEW_STATUSES.some((s) => s === value)
}

/** Roster label for each state. Short on purpose — it renders as a chip beside
 *  the user's name. */
export const PLAN_REVIEW_LABEL: Record<PlanReviewStatus, string> = {
  'in-review': 'In review',
  reviewed: 'Reviewed',
}
