export type ClientStatus = 'active' | 'attention' | 'paused' | 'new'

export type Client = {
  id: string
  name: string
  initials: string
  color: string
  age: number
  gender: 'Female' | 'Male'
  email: string
  program: string
  plan: string
  status: ClientStatus
  /** Program access — the single-program Users page's Active/Disabled toggle.
   *  Independent of `status`, which tracks engagement, not access. */
  accessEnabled: boolean
  /** When this user's program access expires. Drives the Users page's Plan
   *  expiry column and urgency tiering. */
  expiryDate: Date
  adherence: number | null
  checkInDays: number | null
  joinDate: Date
  goals: string[]
  diet: string
}
