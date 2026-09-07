// Programs API contracts. The program is a single global entity (no list), so
// there is no pagination here. Wire dates are ISO strings; the api.ts mapper
// converts them to/from the domain model's `Date`s.
//
// Workout and diet content are NOT on this object — they are authored as rich
// text under `/program/workout-plan` and `/program/diet-plan`. See
// docs/api/programs.md.

/** `GET /program` / `PUT /program` response — the single global program. */
export type ProgramDto = {
  id: string
  name: string
  description: string
  durationWeeks: number
  enabled: boolean
  /** Server-computed; the client must not count another resource for it. */
  enrolledCount: number
  createdAt: string
  updatedAt: string
}

/** `PUT /program` body — the editable program details (autosave sends all of it). */
export type UpdateProgramBody = {
  name: string
  description: string
  durationWeeks: number
}

/** `PATCH /program/availability` body. */
export type UpdateProgramAvailabilityBody = {
  enabled: boolean
}
