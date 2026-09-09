export type Nutritionist = {
  id: string
  name: string
  initials: string
  color: string
  email: string
  /** Contact number in +91 form. Optional so records that predate the field
   *  still map; the roster's Call action is disabled without one. */
  phone?: string
  qualification: string
  experienceYears: number
  joinDate: Date
  /** Informational only — the users this nutritionist currently manages.
   *  Not editable from here; the Users section owns assignment. */
  memberIds: string[]
  accessEnabled: boolean
}
