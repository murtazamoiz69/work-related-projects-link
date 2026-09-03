// Type-only import: the diet model belongs to the programs feature, and
// importing it as a type leaves no runtime edge from clients -> programs (which
// would close a cycle, since programs/data.ts reads CLIENTS_DATA).
import type { DietProfile } from '@/features/programs/diet/dietPlan.types'

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
  /** The onboarding answers that place this user in a calorie band and narrow
   *  the master diet sheet down to their own copy. Captured at onboarding;
   *  the band is adjustable later from Manage Plan as their burn changes. */
  dietProfile?: DietProfile
}
