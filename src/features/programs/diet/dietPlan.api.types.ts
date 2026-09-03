// Diet-plan API contracts — wire shapes (ISO dates) for the master sheets and
// the per-user copies. The api module maps these to the domain types in
// dietPlan.types.ts.
import type {
  CalorieBand,
  DietProfile,
  MedicalCondition,
  DietaryPreference,
  LifeStage,
  PlanReviewStatus,
} from './dietPlan.types'

/** A user's onboarding answers as they travel on the wire. */
export type DietProfileDto = {
  band: CalorieBand
  lifeStage: LifeStage
  conditions: MedicalCondition[]
  preference: DietaryPreference
}

export type DietPlanSheetDto = {
  weekNum: number
  band: CalorieBand
  /** Rich-text body (HTML). */
  body: string
  updatedAt: string
}

export type ClientDietPlanDto = {
  clientId: string
  weekNum: number
  profile: DietProfileDto
  body: string
  edited: boolean
  appliedFilters: string[]
  updatedAt: string
  /** Sign-off state, stamped onto every read from the client record. */
  review: PlanReviewStatus
  reviewedAt: string | null
}

// ---- Requests ----

export type SaveMasterSheetBody = {
  weekNum: number
  band: CalorieBand
  body: string
}

// ASSUMPTION: duplication is same-band only. Copying a 1200 kcal sheet onto an
// 1800 kcal week would carry the wrong portions, so the band is taken from the
// source rather than accepted as a target.
export type DuplicateSheetBody = {
  fromWeek: number
  band: CalorieBand
  toWeeks: number[]
}

export type DuplicateSheetResultDto = {
  band: CalorieBand
  /** Weeks actually written — out-of-range or self-targets are dropped. */
  weeks: number[]
}

export type SaveClientPlanBody = {
  body: string
}

export type UpdateClientBandBody = {
  band: CalorieBand
}

export type UpdateClientReviewBody = {
  status: PlanReviewStatus
}

export type { CalorieBand, DietProfile }
