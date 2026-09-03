export type ClientStatus = 'active' | 'attention' | 'paused' | 'new'

export type Client = {
  id: string
  /** The client's chat thread — used to open their conversation. Supplied by
   *  the API (today it equals `id`, but callers must not assume that). */
  conversationId: string
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
  /** Contact number — collected by "Add User" (individual or bulk import).
   *  Absent on the original seed roster, so optional. */
  phone?: string
  /** The nutritionist whose caseload this user is on. Assigned by the backend
   *  at creation (balanced across the team) and embedded in the roster
   *  response, so the Users table can show it without a second request. */
  assignedNutritionist?: {
    id: string
    name: string
    initials: string
    color: string
  } | null
}
