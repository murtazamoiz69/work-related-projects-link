// Dashboard derivations — ported verbatim from V2 dashboard.js. Everything is
// derived deterministically from CLIENTS_DATA (seeded), so numbers agree across
// the app without shared runtime state.
import { CLIENTS_DATA, type Client } from '@/features/clients'
import { pick, seededRandom } from '@/lib/seed'
import type {
  AttentionRow,
  AttnFilterDef,
  ClientProgress,
  HeroCounts,
  KpiCounts,
  UpcomingExpiry,
  WeekDay,
  WeekDayTier,
} from './types'

const DASH_PROBLEM_POOL = [
  'Skipped their last 3 scheduled workouts',
  'Weight has plateaued for 3 weeks',
  'No reply after your last follow-up',
  'Flagged a health concern in their last message',
  "Hasn't touched their meal plan this week",
  'Missed two check-ins in a row',
]

type ActionType = 'chat-request' | 'progress-submitted' | 'renewal-due'
const DASH_ACTION_TYPES: ActionType[] = [
  'chat-request',
  'progress-submitted',
  'renewal-due',
]
const DASH_ACTION_META: Record<ActionType, { icon: string; label: string }> = {
  'chat-request': { icon: 'message-circle', label: 'Chat Requests' },
  'progress-submitted': { icon: 'clipboard-check', label: 'Progress Reviews' },
  'renewal-due': { icon: 'credit-card', label: 'Renewals' },
}

function dashClientSeed(index: number): number {
  return (index + 1) * 17.23 + 5
}

function deriveActionReason(index: number, type: ActionType): string {
  const seed = dashClientSeed(index)
  if (type === 'chat-request') {
    const hoursAgo = 1 + Math.floor(seededRandom(seed * 50) * 11)
    const verb =
      seededRandom(seed * 51) < 0.5 ? 'Requested a chat' : 'Sent a new message'
    return `${verb} ${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago — awaiting your reply`
  }
  if (type === 'progress-submitted') {
    const reasons = [
      "Submitted this week's check-in — progress has been slow",
      'Logged a check-in, but adherence keeps dropping',
      "Weekly progress is in — the numbers aren't moving",
      "Checked in, but hasn't hit their targets in weeks",
    ]
    return pick(reasons, seed * 52)
  }
  if (type === 'renewal-due') {
    const daysLeft = 1 + Math.floor(seededRandom(seed * 54) * 6)
    return daysLeft <= 2
      ? `Plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — no renewal booked`
      : `Plan renews in ${daysLeft} days`
  }
  return ''
}

type Problems = {
  problems: string[]
  immediateAction: { type: ActionType } | null
}

function deriveClientProblems(client: Client, index: number): Problems {
  const seed = dashClientSeed(index)
  const eligible =
    client.status === 'attention' ||
    (client.status === 'new' && seededRandom(seed * 30) < 0.25) ||
    (client.status === 'paused' && seededRandom(seed * 31) < 0.2)
  if (!eligible) return { problems: [], immediateAction: null }

  const problems: string[] = []
  if (client.checkInDays != null && client.checkInDays >= 4) {
    problems.push(`No check-in for ${client.checkInDays} days`)
  } else if (client.checkInDays != null && client.checkInDays >= 2) {
    problems.push(`Hasn't logged meals in ${client.checkInDays} days`)
  }
  if (client.adherence != null && client.adherence < 45) {
    problems.push('Barely logging meals or workouts this week')
  } else if (
    client.adherence != null &&
    client.adherence < 65 &&
    seededRandom(seed * 32) < 0.6
  ) {
    problems.push('Inconsistent with meals and workouts')
  }
  if (problems.length < 2 && seededRandom(seed * 33) < 0.7) {
    problems.push(pick(DASH_PROBLEM_POOL, seed * 34))
  }
  if (!problems.length) problems.push(pick(DASH_PROBLEM_POOL, seed * 34))

  const typeRoll = seededRandom(seed * 35)
  const immediateAction = {
    type: (typeRoll < 0.45
      ? 'chat-request'
      : typeRoll < 0.7
        ? 'progress-submitted'
        : 'renewal-due') as ActionType,
  }
  return { problems, immediateAction }
}

type EligibleClient = { client: Client; index: number } & Problems

function dashEligibleClients(): EligibleClient[] {
  return CLIENTS_DATA.map((c, i) => ({
    client: c,
    index: i,
    ...deriveClientProblems(c, i),
  })).filter((x) => x.immediateAction)
}

const NEEDS_ATTN_ICON: Record<string, string> = {
  'chat-request': 'message-circle',
  'renewal-due': 'calendar-clock',
  'profile-update': 'user-round',
}

function deriveNeedsAttentionReason(index: number): {
  type: string
  icon: string
  text: string
} {
  const seed = dashClientSeed(index)
  const typeRoll = seededRandom(seed * 70)
  const type =
    typeRoll < 0.4
      ? 'chat-request'
      : typeRoll < 0.7
        ? 'renewal-due'
        : 'profile-update'

  let text: string
  if (type === 'chat-request') {
    const hoursAgo = 1 + Math.floor(seededRandom(seed * 71) * 11)
    const verb =
      seededRandom(seed * 72) < 0.5 ? 'Requested a chat' : 'Sent a new message'
    text = `${verb} ${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago — awaiting your reply`
  } else if (type === 'renewal-due') {
    const daysLeft = 1 + Math.floor(seededRandom(seed * 73) * 6)
    text =
      daysLeft <= 2
        ? `Plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — no renewal booked`
        : `Plan renewal due in ${daysLeft} days`
  } else {
    const kind =
      seededRandom(seed * 74) < 0.5
        ? 'weight & body measurements'
        : 'allergy & medical information'
    text = `Updated ${kind}`
  }
  return { type, icon: NEEDS_ATTN_ICON[type], text }
}

export function buildNeedsAttentionList(): AttentionRow[] {
  return dashEligibleClients().map(({ client, index }) => ({
    client,
    index,
    ...deriveNeedsAttentionReason(index),
  }))
}

function dashConversationStatus(client: Client): 'waiting' | 'active' {
  return client.status === 'attention' ||
    client.status === 'new' ||
    client.status === 'paused'
    ? 'waiting'
    : 'active'
}

function dashRenewalDaysLeft(index: number): number {
  const seed = dashClientSeed(index)
  return 1 + Math.floor(seededRandom(seed * 80) * 45)
}

function dashDaysSinceJoined(client: Client): number {
  return Math.floor(
    (Date.now() - client.joinDate.getTime()) / (24 * 60 * 60 * 1000),
  )
}

type FilterInternal = AttnFilterDef & {
  match: (c: Client, i: number) => boolean
  reason: (c: Client, i: number) => { icon: string; text: string }
}

const NEEDS_ATTN_FILTERS: FilterInternal[] = [
  {
    key: 'needs-attention',
    label: 'Needs Attention',
    icon: 'message-circle',
    match: (c) => dashConversationStatus(c) === 'waiting',
    reason: (_c, i) => {
      const seed = dashClientSeed(i)
      const hoursAgo = 1 + Math.floor(seededRandom(seed * 71) * 11)
      const verb =
        seededRandom(seed * 72) < 0.5
          ? 'Requested a chat'
          : 'Sent a new message'
      return {
        icon: 'message-circle',
        text: `${verb} ${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago — awaiting your reply`,
      }
    },
  },
  {
    key: 'new-this-week',
    label: 'New This Week',
    icon: 'user-plus',
    match: (c) => dashDaysSinceJoined(c) < 7,
    reason: (c) => {
      const d = dashDaysSinceJoined(c)
      return {
        icon: 'user-plus',
        text:
          d <= 0 ? 'Joined today' : `Joined ${d} day${d === 1 ? '' : 's'} ago`,
      }
    },
  },
  {
    key: 'missed-workout-yesterday',
    label: 'Missed Workout Yesterday',
    icon: 'dumbbell',
    match: (c, i) => c.checkInDays != null && !dashWorkoutLoggedYesterday(c, i),
    reason: () => ({
      icon: 'dumbbell',
      text: "Missed yesterday's scheduled workout",
    }),
  },
  {
    key: 'missed-diet-yesterday',
    label: 'Missed Diet Yesterday',
    icon: 'utensils',
    match: (c, i) => c.checkInDays != null && !dashMealLoggedYesterday(c, i),
    reason: () => ({
      icon: 'utensils',
      text: "Didn't log any meals yesterday",
    }),
  },
  {
    key: 'logged-meal-today',
    label: 'Logged Meal Today',
    icon: 'utensils',
    match: (c, i) => dashMealLoggedToday(c, i),
    reason: () => ({ icon: 'utensils', text: 'Logged a meal today' }),
  },
  {
    key: 'logged-workout-today',
    label: 'Logged Workout Today',
    icon: 'dumbbell',
    match: (c, i) => dashWorkoutLoggedToday(c, i),
    reason: () => ({ icon: 'dumbbell', text: 'Logged a workout today' }),
  },
]

export const ATTN_FILTER_DEFS: AttnFilterDef[] = NEEDS_ATTN_FILTERS.map(
  (d) => ({
    key: d.key,
    label: d.label,
    icon: d.icon,
  }),
)

export function dashFilterCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  NEEDS_ATTN_FILTERS.forEach((def) => {
    counts[def.key] = CLIENTS_DATA.reduce(
      (n, c, i) => n + (def.match(c, i) ? 1 : 0),
      0,
    )
  })
  return counts
}

export function buildFilteredAttentionList(
  activeKeys: string[],
): AttentionRow[] {
  const defs = NEEDS_ATTN_FILTERS.filter((d) => activeKeys.includes(d.key))
  const out: AttentionRow[] = []
  CLIENTS_DATA.forEach((c, i) => {
    const matched = defs.find((d) => d.match(c, i))
    if (matched) out.push({ client: c, index: i, ...matched.reason(c, i) })
  })
  return out
}

function buildActionQueue(): Record<
  ActionType,
  { icon: string; label: string; items: { client: Client; reason: string }[] }
> {
  const eligible = dashEligibleClients()
  const groups = {} as Record<
    ActionType,
    { icon: string; label: string; items: { client: Client; reason: string }[] }
  >
  DASH_ACTION_TYPES.forEach((type) => {
    groups[type] = { ...DASH_ACTION_META[type], items: [] }
  })
  eligible.forEach(({ client, index, immediateAction }) => {
    if (!immediateAction) return
    const reason = deriveActionReason(index, immediateAction.type)
    groups[immediateAction.type].items.push({ client, reason })
  })
  return groups
}

export function buildHeroCounts(): HeroCounts {
  const queue = buildActionQueue()
  return {
    chatRequests: queue['chat-request'].items.length,
    needAttention: CLIENTS_DATA.filter((c) => c.status === 'attention').length,
    progressReviews: queue['progress-submitted'].items.length,
    renewals: queue['renewal-due'].items.length,
  }
}

export function buildUpcomingExpirations(): UpcomingExpiry[] {
  return CLIENTS_DATA.map((client, index) => ({
    client,
    daysLeft: dashRenewalDaysLeft(index),
  }))
    .filter(({ daysLeft }) => daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8)
}

function dashMealLoggedToday(client: Client, index: number): boolean {
  if (client.checkInDays == null) return false
  const seed = dashClientSeed(index)
  return seededRandom(seed * 60) < (client.checkInDays === 0 ? 0.85 : 0.12)
}
function dashWorkoutLoggedToday(client: Client, index: number): boolean {
  if (client.checkInDays == null) return false
  const seed = dashClientSeed(index)
  return seededRandom(seed * 61) < (client.checkInDays === 0 ? 0.7 : 0.08)
}
function dashMealLoggedYesterday(client: Client, index: number): boolean {
  if (client.checkInDays == null) return false
  const seed = dashClientSeed(index)
  return seededRandom(seed * 62) < (client.checkInDays <= 1 ? 0.85 : 0.12)
}
function dashWorkoutLoggedYesterday(client: Client, index: number): boolean {
  if (client.checkInDays == null) return false
  const seed = dashClientSeed(index)
  return seededRandom(seed * 63) < (client.checkInDays <= 1 ? 0.7 : 0.08)
}

function dashWorkoutStatusForDay(
  client: Client,
  index: number,
  daysAgo: number,
): boolean | null {
  if (client.checkInDays == null) return null
  if (daysAgo === 0) return dashWorkoutLoggedToday(client, index)
  if (daysAgo === 1) return dashWorkoutLoggedYesterday(client, index)
  const seed = dashClientSeed(index)
  return (
    seededRandom(seed * 91 + daysAgo * 3.7) <
    (client.checkInDays <= daysAgo ? 0.75 : 0.15)
  )
}

function dashDayCounts(
  index: number,
  daysAgo: number,
  workoutDone: boolean | null,
  mealDone: boolean | null,
): {
  workoutsScheduled: number
  workoutsCompleted: number
  mealsScheduled: number
  mealsCompleted: number
} {
  const seed = dashClientSeed(index) + daysAgo * 2.7
  const workoutsScheduled = seededRandom(seed * 98) < 0.3 ? 2 : 1
  const mealsScheduled = seededRandom(seed * 100) < 0.4 ? 4 : 3
  const workoutsCompleted =
    workoutDone === null
      ? 0
      : workoutDone
        ? workoutsScheduled
        : Math.floor(seededRandom(seed * 99) * workoutsScheduled)
  // mealDone comes from the same dashMealLoggedToday/Yesterday booleans the
  // Catch Up "Missed/Logged Diet" filters match against — false must mean
  // zero meals logged, never a randomized partial count, or a client could
  // land in "Missed Diet Yesterday" while still showing a done/partial dot.
  const mealsCompleted =
    mealDone === null || mealDone === false
      ? 0
      : Math.min(
          mealsScheduled,
          Math.max(1, Math.round(seededRandom(seed * 101) * mealsScheduled)),
        )
  return {
    workoutsScheduled,
    workoutsCompleted,
    mealsScheduled,
    mealsCompleted,
  }
}

function dashDayPopoverText(
  client: Client,
  index: number,
  daysAgo: number,
  workoutDone: boolean | null,
  mealDone: boolean | null,
): string {
  const counts = dashDayCounts(index, daysAgo, workoutDone, mealDone)
  return `${client.plan}\nWorkouts: ${counts.workoutsCompleted}/${counts.workoutsScheduled}\nMeals: ${counts.mealsCompleted}/${counts.mealsScheduled}`
}

export function dashWeeklyProgress(client: Client, index: number): WeekDay[] {
  const joinedDaysAgo = dashDaysSinceJoined(client)
  const joinedToday = joinedDaysAgo === 0
  const daysSinceSunday = new Date().getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const daysAgo = daysSinceSunday - i
    const isFuture = daysAgo < 0
    const beforeJoined = !isFuture && daysAgo > joinedDaysAgo
    // A client who joined today has no activity to show yet on their join
    // day itself — distinct from the (grey) days before they existed as a
    // client at all, and from ordinary missed/partial/done days.
    const isJoinDay = !isFuture && !beforeJoined && joinedToday && daysAgo === 0
    const done =
      isFuture || beforeJoined || isJoinDay
        ? null
        : dashWorkoutStatusForDay(client, index, daysAgo)
    const mealDone =
      isFuture || beforeJoined || isJoinDay
        ? null
        : dashMealStatusForDay(client, index, daysAgo)
    const counts = dashDayCounts(index, daysAgo, done, mealDone)
    const nothingDone =
      counts.workoutsCompleted <= 0 && counts.mealsCompleted <= 0
    const everythingDone =
      counts.workoutsCompleted >= counts.workoutsScheduled &&
      counts.mealsCompleted >= counts.mealsScheduled
    const tier: WeekDayTier = isFuture
      ? 'empty'
      : beforeJoined
        ? 'not-joined'
        : isJoinDay
          ? 'joined-today'
          : nothingDone
            ? 'missed'
            : everythingDone
              ? 'done'
              : 'partial'
    // The calendar date this dot stands for, derived from the same daysAgo
    // offset the tiers are built from so the label can never disagree with
    // the data underneath it.
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - daysAgo)
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dateLabel = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    const status = isFuture
      ? "Upcoming, hasn't happened yet"
      : beforeJoined
        ? 'Before they joined the program'
        : isJoinDay
          ? `${client.name.split(' ')[0]} joined today, no activity yet`
          : dashDayPopoverText(client, index, daysAgo, done, mealDone)
    // The dots carry no visible weekday, so the tooltip opens with the day and
    // date — on hover it's the only place either is spelled out.
    const popover = `${dayLabel}, ${dateLabel}${isToday(daysAgo) ? ' (Today)' : ''}\n${status}`

    return {
      daysAgo,
      isToday: daysAgo === 0,
      tier,
      popover,
      dayLabel,
      dateLabel,
      dateShort: String(date.getDate()),
    }
  })
}

function isToday(daysAgo: number): boolean {
  return daysAgo === 0
}

export function dashCurrentWeekRangeLabel(): string {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  const sameMonth = sunday.getMonth() === saturday.getMonth()
  const start = sunday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const end = saturday.toLocaleDateString(
    'en-US',
    sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' },
  )
  return `${start} – ${end}`
}

export function buildKpiCounts(): KpiCounts {
  const total = CLIENTS_DATA.length
  const dayMs = 24 * 60 * 60 * 1000
  const newToday = CLIENTS_DATA.filter(
    (c) => Date.now() - c.joinDate.getTime() < dayMs,
  ).length
  const mealsLogged = CLIENTS_DATA.filter((c, i) =>
    dashMealLoggedToday(c, i),
  ).length
  const workoutsLogged = CLIENTS_DATA.filter((c, i) =>
    dashWorkoutLoggedToday(c, i),
  ).length
  return { total, newToday, mealsLogged, workoutsLogged }
}

function dashMealStatusForDay(
  client: Client,
  index: number,
  daysAgo: number,
): boolean | null {
  if (client.checkInDays == null) return null
  if (daysAgo === 0) return dashMealLoggedToday(client, index)
  if (daysAgo === 1) return dashMealLoggedYesterday(client, index)
  const seed = dashClientSeed(index)
  return (
    seededRandom(seed * 92 + daysAgo * 4.1) <
    (client.checkInDays <= daysAgo ? 0.75 : 0.15)
  )
}

type StatusFn = (c: Client, i: number, daysAgo: number) => boolean | null

function dashCohortPctForWindow(
  statusFn: StatusFn,
  startDaysAgo: number,
  endDaysAgo: number,
  program: string,
): number {
  let hit = 0
  let total = 0
  CLIENTS_DATA.forEach((c, idx) => {
    if (program !== 'all' && c.program !== program) return
    const joinedDaysAgo = dashDaysSinceJoined(c)
    for (let offset = startDaysAgo; offset <= endDaysAgo; offset++) {
      if (offset > joinedDaysAgo) continue
      const status = statusFn(c, idx, offset)
      if (status === null) continue
      total += 1
      if (status) hit += 1
    }
  })
  return total ? Math.round((hit / total) * 100) : 0
}

type Window = {
  startDaysAgo: number
  endDaysAgo: number
  tick: string
  tip: string
}

function dashClientProgressWindows(rangeDays: number): Window[] {
  if (rangeDays <= 7) {
    return Array.from({ length: rangeDays }, (_, i) => {
      const daysAgo = rangeDays - 1 - i
      const d = new Date()
      d.setDate(d.getDate() - daysAgo)
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      return {
        startDaysAgo: daysAgo,
        endDaysAgo: daysAgo,
        tick: label,
        tip: label,
      }
    })
  }
  const weekCount = Math.ceil(rangeDays / 7)
  const windows: Window[] = []
  for (let b = weekCount - 1; b >= 0; b--) {
    const startDaysAgo = b * 7
    const endDaysAgo = Math.min(startDaysAgo + 6, rangeDays - 1)
    const weekNum = weekCount - b
    windows.push({
      startDaysAgo,
      endDaysAgo,
      tick: `W${weekNum}`,
      tip: `Week ${weekNum}`,
    })
  }
  return windows
}

function dashCohortSeries(
  statusFn: StatusFn,
  windows: Window[],
  program: string,
): number[] {
  return windows.map((w) =>
    dashCohortPctForWindow(statusFn, w.startDaysAgo, w.endDaysAgo, program),
  )
}

export function buildClientProgress(
  rangeDays: number,
  program = 'all',
): ClientProgress {
  const windows = dashClientProgressWindows(rangeDays)
  const meals = dashCohortSeries(dashMealStatusForDay, windows, program)
  const workouts = dashCohortSeries(dashWorkoutStatusForDay, windows, program)
  return {
    ticks: windows.map((w) => w.tick),
    tips: windows.map((w) => w.tip),
    activeClients: CLIENTS_DATA.filter(
      (c) =>
        c.status !== 'paused' && (program === 'all' || c.program === program),
    ).length,
    meals: { values: meals, headline: meals[meals.length - 1] },
    workouts: { values: workouts, headline: workouts[workouts.length - 1] },
  }
}
