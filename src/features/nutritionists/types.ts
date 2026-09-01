export type Nutritionist = {
  id: string
  name: string
  initials: string
  color: string
  email: string
  qualification: string
  experienceYears: number
  joinDate: Date
  /** Informational only — the users this nutritionist currently manages.
   *  Not editable from here; the Users section owns assignment. */
  memberIds: string[]
  accessEnabled: boolean
}
