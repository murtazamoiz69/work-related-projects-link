// Type-only import: the diet model belongs to the programs feature, and
// importing it as a type leaves no runtime edge from clients -> programs (which
// would close a cycle, since programs/data.ts reads CLIENTS_DATA).
import type {
  DietProfile,
  PlanReviewStatus,
} from '@/features/programs/diet/dietPlan.types'

export type ClientStatus = 'active' | 'attention' | 'paused' | 'new'

/** Access to the programme, in three states rather than a boolean.
 *  `invited` — enrolled and the invitation has gone out, but the user has not
 *  signed in yet. `active` — signed in and using the app. `disabled` — access
 *  withdrawn. A user cannot go straight from invited to active from the panel;
 *  only their first sign-in does that. */
export type ClientAccessState = 'invited' | 'active' | 'disabled'

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
  /** The three-state access model. `accessEnabled` is kept as the derived
   *  boolean (`accessState !== 'disabled'`) so existing call sites still read. */
  accessState: ClientAccessState
  /** When the user first signed in to the mobile app; null while invited. */
  signedInAt: Date | null
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
  /** Whether a nutritionist has signed off on the diet plan the engine filtered
   *  for this user. Everyone starts in review — the filtering is automatic, so
   *  until a person has read the result nobody has checked it. */
  dietReview: PlanReviewStatus
  /** When it was signed off. `null` while the plan is still in review. */
  dietReviewedAt: Date | null
}
