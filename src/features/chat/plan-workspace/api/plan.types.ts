// Plan Workspace API contracts. The workspace is a single per-client entity.
// The wire model matches the backend `Workspace` schema: `profile.programStart`
// and each version's `date` are ISO strings, `profile.bmi` is a string, and the
// nullable profile measurements can come back `null` for a partly-onboarded
// client (the domain mapper in plan.api.ts coerces them).
import type { ClinicalProfile, PlanVersion, Workspace } from '../types'

export type ClinicalProfileDto = Omit<
  ClinicalProfile,
  | 'programStart'
  | 'bmi'
  | 'age'
  | 'gender'
  | 'heightCm'
  | 'weightKg'
  | 'targetWeightKg'
> & {
  programStart: string
  bmi: string | null
  age: number | null
  gender: 'Female' | 'Male' | null
  heightCm: number | null
  weightKg: number | null
  targetWeightKg: number | null
  /** Mock-only, absent on the real wire; kept in the type so the mock's own
   *  DTO round-trips without a strip step. */
  _seed?: number
}

export type PlanVersionDto = Omit<PlanVersion, 'date'> & { date: string }

export type WorkspaceDto = Omit<Workspace, 'profile' | 'versions'> & {
  profile: ClinicalProfileDto
  versions: PlanVersionDto[]
}
