// Plan Workspace API contracts. The workspace is a single per-client entity.
// Only two fields carry dates: profile.programStart and each version's date.
import type { ClinicalProfile, PlanVersion, Workspace } from '../types'

export type ClinicalProfileDto = Omit<ClinicalProfile, 'programStart'> & {
  programStart: string
}

export type PlanVersionDto = Omit<PlanVersion, 'date'> & { date: string }

export type WorkspaceDto = Omit<Workspace, 'profile' | 'versions'> & {
  profile: ClinicalProfileDto
  versions: PlanVersionDto[]
}
