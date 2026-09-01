// Programs API contracts. The program is a single global entity (no list), so
// there is no pagination here. Wire dates are ISO strings; the api.ts mapper
// converts them to/from the domain model's `Date`s.
import type { ProgramMember, TrainingProgram } from '../types'

export type ProgramMemberDto = Omit<ProgramMember, 'assignedDate'> & {
  assignedDate: string
}

export type TrainingProgramDto = Omit<
  TrainingProgram,
  'createdDate' | 'updatedDate' | 'members'
> & {
  createdDate: string
  updatedDate: string
  members: ProgramMemberDto[]
}

export type UpdateProgramAvailabilityBody = {
  enabled: boolean
}
