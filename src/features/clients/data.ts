// Client roster — ported from V2 clients.js. 15 hand-authored named clients, of
// which COHORT_IDS picks the ten who are actually on Diwali Glow, so the same
// person reads consistently everywhere in the prototype.
import { daysAgo } from '@/lib/seed'
import type { DietProfile } from '@/features/programs/diet/dietPlan.types'
import type { Client, ClientAccessState, ClientStatus } from './types'

export const STATUS_LABEL: Record<ClientStatus, string> = {
  active: 'Active',
  attention: 'Needs Attention',
  paused: 'Paused',
  new: 'New',
}

export const PROGRAM_PLAN: Record<string, string> = {
  'Weight Loss': '12-Week Weight Loss Kickstart',
  'Diabetes Management': 'Diabetes-Friendly Meal Plan',
  'Prenatal Nutrition': 'Prenatal Nutrition Essentials',
  'Muscle Gain': 'Muscle Gain Progressive Plan',
  'General Wellness': 'General Wellness Starter',
  'Post-Surgery Recovery': 'Post-Surgery Recovery Nutrition',
  'Endurance Training': 'Endurance Base Building',
  'Body Recomposition': 'Body Recomposition Plan',
  'Sports Nutrition': 'Athlete Performance Plan',
  'PCOS Management': 'PCOS Balance Plan',
  'Cardiac Health': 'Cardiac Health Nutrition',
}

// `plan`, `conversationId` and the diet-plan sign-off are all derived in the
// final map below, so the seed rows don't carry them.
type NamedClient = Omit<
  Client,
  | 'plan'
  | 'conversationId'
  | 'dietReview'
  | 'dietReviewedAt'
  | 'accessState'
  | 'signedInAt'
>

const NAMED_CLIENTS: NamedClient[] = [
  {
    id: 'c-1',
    name: 'Priya Sharma',
    initials: 'PS',
    color: '#C44F3F',
    age: 34,
    gender: 'Female',
    email: 'priya@email.com',
    program: 'Weight Loss',
    status: 'attention',
    accessEnabled: true,
    expiryDate: daysAgo(-95),
    adherence: 42,
    checkInDays: 4,
    joinDate: daysAgo(118),
    goals: ['Lose fat', 'Build discipline'],
    diet: 'Low carb',
  },
  {
    id: 'c-2',
    name: 'Marcus Chen',
    initials: 'MC',
    color: '#3B6FA6',
    age: 51,
    gender: 'Male',
    email: 'marcus.chen@email.com',
    program: 'Diabetes Management',
    status: 'attention',
    accessEnabled: true,
    expiryDate: daysAgo(-140),
    adherence: 58,
    checkInDays: 1,
    joinDate: daysAgo(210),
    goals: ['Improve health'],
    diet: 'Mediterranean',
  },
  {
    id: 'c-3',
    name: 'Elena Rodriguez',
    initials: 'ER',
    color: '#8A5FBF',
    age: 29,
    gender: 'Female',
    email: 'elena.rodriguez@email.com',
    program: 'Prenatal Nutrition',
    status: 'attention',
    accessEnabled: true,
    expiryDate: daysAgo(-75),
    adherence: 66,
    checkInDays: 2,
    joinDate: daysAgo(58),
    goals: ['Improve health', 'More energy'],
    diet: 'Vegetarian',
  },
  {
    id: 'c-4',
    name: 'James Okafor',
    initials: 'JO',
    color: '#3C8260',
    age: 26,
    gender: 'Male',
    email: 'james.okafor@email.com',
    program: 'Muscle Gain',
    status: 'active',
    accessEnabled: true,
    expiryDate: daysAgo(-160),
    adherence: 92,
    checkInDays: 0,
    joinDate: daysAgo(150),
    goals: ['Build muscle'],
    diet: 'High protein',
  },
  {
    id: 'c-5',
    name: 'Aisha Patel',
    initials: 'AP',
    color: '#A3672E',
    age: 38,
    gender: 'Female',
    email: 'aisha.patel@email.com',
    program: 'General Wellness',
    status: 'attention',
    accessEnabled: true,
    expiryDate: daysAgo(-110),
    adherence: 40,
    checkInDays: 3,
    joinDate: daysAgo(96),
    goals: ['Improve health', 'Better sleep'],
    diet: 'Vegan',
  },
  {
    id: 'c-6',
    name: 'Tom Wilson',
    initials: 'TW',
    color: '#5C6862',
    age: 61,
    gender: 'Male',
    email: 'tom.wilson@email.com',
    program: 'Post-Surgery Recovery',
    status: 'active',
    accessEnabled: false,
    expiryDate: daysAgo(-200),
    adherence: 75,
    checkInDays: 0,
    joinDate: daysAgo(380),
    goals: ['Improve health'],
    diet: 'Gluten-free',
  },
  {
    id: 'c-7',
    name: 'Diana Foster',
    initials: 'DF',
    color: '#5D7C62',
    age: 45,
    gender: 'Female',
    email: 'diana.foster@email.com',
    program: 'Weight Loss',
    status: 'active',
    accessEnabled: true,
    expiryDate: daysAgo(-60),
    adherence: 88,
    checkInDays: 1,
    joinDate: daysAgo(2015),
    goals: ['Lose fat'],
    diet: 'Mediterranean',
  },
  {
    id: 'c-8',
    name: 'Robert Kim',
    initials: 'RK',
    color: '#4A7A9D',
    age: 55,
    gender: 'Male',
    email: 'robert.kim@email.com',
    program: 'Diabetes Management',
    status: 'active',
    accessEnabled: true,
    expiryDate: daysAgo(-180),
    adherence: 90,
    checkInDays: 0,
    joinDate: daysAgo(245),
    goals: ['Improve health'],
    diet: 'Low carb',
  },
  {
    id: 'c-9',
    name: 'Nadia Hussain',
    initials: 'NH',
    color: '#AF5688',
    age: 31,
    gender: 'Female',
    email: 'nadia.hussain@email.com',
    program: 'Endurance Training',
    status: 'active',
    accessEnabled: true,
    expiryDate: daysAgo(-1),
    adherence: 95,
    checkInDays: 0,
    joinDate: daysAgo(180),
    goals: ['More energy', 'Build discipline'],
    diet: 'High protein',
  },
  {
    id: 'c-10',
    name: 'Leo Martinez',
    initials: 'LM',
    color: '#A65D3F',
    age: 33,
    gender: 'Male',
    email: 'leo.martinez@email.com',
    program: 'Body Recomposition',
    status: 'active',
    accessEnabled: true,
    expiryDate: daysAgo(-130),
    adherence: 89,
    checkInDays: 1,
    joinDate: daysAgo(120),
    goals: ['Lose fat', 'Build muscle'],
    diet: 'High protein',
  },
  {
    id: 'c-11',
    name: 'Sofia Martins',
    initials: 'SM',
    color: '#457C89',
    age: 24,
    gender: 'Female',
    email: 'sofia.martins@email.com',
    program: 'General Wellness',
    status: 'new',
    accessEnabled: true,
    expiryDate: daysAgo(-45),
    adherence: null,
    checkInDays: null,
    joinDate: daysAgo(0),
    goals: ['Improve health'],
    diet: 'Eats everything',
  },
  {
    id: 'c-12',
    name: 'Grace Liu',
    initials: 'GL',
    color: '#786CA4',
    age: 41,
    gender: 'Female',
    email: 'grace.liu@email.com',
    program: 'Weight Loss',
    status: 'active',
    accessEnabled: true,
    expiryDate: daysAgo(20),
    adherence: 70,
    checkInDays: 2,
    joinDate: daysAgo(14),
    goals: ['Lose fat'],
    diet: 'Pescatarian',
  },
  {
    id: 'c-13',
    name: 'Daniel Osei',
    initials: 'DO',
    color: '#39816E',
    age: 22,
    gender: 'Male',
    email: 'daniel.osei@email.com',
    program: 'Sports Nutrition',
    status: 'active',
    accessEnabled: true,
    expiryDate: daysAgo(-220),
    adherence: 85,
    checkInDays: 0,
    joinDate: daysAgo(88),
    goals: ['Build muscle', 'More energy'],
    diet: 'High protein',
  },
  {
    id: 'c-14',
    name: 'Meera Krishnan',
    initials: 'MK',
    color: '#BE4F70',
    age: 27,
    gender: 'Female',
    email: 'meera.krishnan@email.com',
    program: 'PCOS Management',
    status: 'paused',
    accessEnabled: true,
    expiryDate: daysAgo(-100),
    adherence: 72,
    checkInDays: 2,
    joinDate: daysAgo(145),
    goals: ['Improve health'],
    diet: 'Low carb',
  },
  {
    id: 'c-15',
    name: 'Carlos Vega',
    initials: 'CV',
    color: '#55789D',
    age: 58,
    gender: 'Male',
    email: 'carlos.vega@email.com',
    program: 'Cardiac Health',
    status: 'attention',
    accessEnabled: false,
    expiryDate: daysAgo(-260),
    adherence: 55,
    checkInDays: 5,
    joinDate: daysAgo(270),
    goals: ['Improve health'],
    diet: 'Mediterranean',
  },
]

export const COLOR_POOL = [
  '#C44F3F',
  '#3B6FA6',
  '#8A5FBF',
  '#3C8260',
  '#A3672E',
  '#5C6862',
  '#5D7C62',
  '#4A7A9D',
  '#AF5688',
  '#A65D3F',
  '#457C89',
  '#786CA4',
  '#39816E',
  '#BE4F70',
  '#55789D',
]
/** The assignable program names, in `PROGRAM_PLAN` order. Also what the mock
 *  backend offers as the "Add User" plan dropdown (`GET /clients/programs`). */
export const PROGRAMS = Object.keys(PROGRAM_PLAN)

// Diwali Glow runs with a focused cohort of ten. These ten are the entire
// roster of the app — Users, Chat, the Dashboard and every nutritionist
// caseload all derive from this array, so there is no one anywhere who isn't
// on the programme. The picks are deliberate rather than the first ten: between
// them they cover every state the UI has to render — disabled access (Tom,
// Carlos), a plan expiring tomorrow (Nadia), an expired one (Grace), a brand-new
// user with no adherence history yet (Sofia), a paused one (Meera), both
// genders, and programmes that exercise the diet plan's medical filters
// (Prenatal, PCOS, Cardiac Health).
const COHORT_IDS = [
  'c-1',
  'c-2',
  'c-3',
  'c-4',
  'c-6',
  'c-9',
  'c-11',
  'c-12',
  'c-14',
  'c-15',
]

// Onboarding answers per user. In the real product these fall out of the
// onboarding questionnaire — BMR and estimated burn decide the band, and the
// three filter answers come straight from the form. Seeded here so the cohort
// exercises every branch of the diet engine: both a lactating and a male
// profile, each dietary preference, and the conditions that actually change a
// plan (Elena is prenatal, Meera has PCOS, Carlos is cardiac).
const DIET_PROFILES: Record<string, DietProfile> = {
  'c-1': { band: 1400, lifeStage: 'female', conditions: [], preference: 'Veg' },
  'c-2': {
    band: 1800,
    lifeStage: 'male',
    conditions: ['Diabetes'],
    preference: 'Non-veg',
  },
  'c-3': {
    band: 2000,
    lifeStage: 'lactating',
    conditions: [],
    preference: 'Eggitarian',
  },
  'c-4': {
    band: 2000,
    lifeStage: 'male',
    conditions: [],
    preference: 'Non-veg',
  },
  'c-6': {
    band: 1600,
    lifeStage: 'male',
    conditions: ['Hypertension'],
    preference: 'Veg',
  },
  'c-9': {
    band: 1600,
    lifeStage: 'female',
    conditions: [],
    preference: 'Non-veg',
  },
  'c-11': {
    band: 1400,
    lifeStage: 'female',
    conditions: [],
    preference: 'Vegan',
  },
  'c-12': {
    band: 1200,
    lifeStage: 'female',
    conditions: [],
    preference: 'Veg',
  },
  'c-14': {
    band: 1400,
    lifeStage: 'female',
    conditions: ['PCOS', 'Thyroid'],
    preference: 'Eggitarian',
  },
  'c-15': {
    band: 1800,
    lifeStage: 'male',
    conditions: ['Hypertension', 'Uric Acid'],
    preference: 'Non-veg',
  },
}

// How long a user counts as newly onboarded for the purposes of the diet-plan
// sign-off. Everyone inside the window is seeded as still-in-review: their plan
// was filtered automatically at onboarding and nobody has read it yet, which is
// exactly the state the Users page's review filter exists to surface.
const REVIEW_GRACE_DAYS = 21

export const CLIENTS_DATA: Client[] = COHORT_IDS.map((id) => {
  const row = NAMED_CLIENTS.find((c) => c.id === id)
  if (!row) throw new Error(`Cohort id ${id} is not in NAMED_CLIENTS`)
  return row
}).map((c, i): Client => {
  const daysOnProgram = Math.round(
    (Date.now() - c.joinDate.getTime()) / 86_400_000,
  )
  const inReview = c.status === 'new' || daysOnProgram <= REVIEW_GRACE_DAYS
  // Three-state access. A user who has never opened the app is still Invited;
  // 'new' clients that joined in the last few days stand in for that here.
  const neverSignedIn = c.status === 'new' && daysOnProgram <= 3
  const accessState: ClientAccessState = !c.accessEnabled
    ? 'disabled'
    : neverSignedIn
      ? 'invited'
      : 'active'
  return {
    accessState,
    // Their first mobile sign-in — null while the invitation is outstanding.
    signedInAt: neverSignedIn
      ? null
      : new Date(c.joinDate.getTime() + 86_400_000),
    dietProfile: DIET_PROFILES[c.id],
    ...c,
    // A contact number for the roster's "Call" action. Fictional 555 range; a
    // real backend supplies the user's own.
    phone: c.phone ?? `+1 (555) 01${String(i).padStart(2, '0')}`,
    plan: PROGRAM_PLAN[c.program],
    // The chat thread is keyed by the client id today; exposed as its own field
    // so consumers don't hardcode that assumption.
    conversationId: c.id,
    dietReview: inReview ? 'in-review' : 'reviewed',
    // Signed off a few days after they joined — near enough for a seed, and it
    // gives the roster chip a real date to show.
    dietReviewedAt: inReview
      ? null
      : new Date(c.joinDate.getTime() + 2 * 86_400_000),
  }
})
