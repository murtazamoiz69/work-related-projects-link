import { daysAgo, pick, seededRandom } from '@/lib/seed'
import { CLIENTS_DATA, PROGRAM_PLAN, formatCheckIn } from '@/features/clients'
import type { Client } from '@/features/clients'
import { TEMPLATES, TEMPLATE_AUTHORS } from '@/features/templates'
import type {
  AudienceOption,
  AudienceType,
  Broadcast,
  BroadcastStatus,
  RepeatUnit,
} from './types'

export const AUDIENCE_OPTIONS: AudienceOption[] = [
  { value: 'all', label: 'All Users' },
  { value: 'selected', label: 'Selected Users' },
  { value: 'program', label: 'Program' },
  { value: 'goals', label: 'Goals' },
]

export function audienceLabel(type: AudienceType): string {
  return AUDIENCE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

export function programNames(): string[] {
  return Object.keys(PROGRAM_PLAN)
}

// Distinct client goals, sourced from live client data rather than a fixed
// pool so the list can never drift out of sync with what clients actually have.
export function distinctGoals(): string[] {
  const set = new Set<string>()
  CLIENTS_DATA.forEach((c) => c.goals.forEach((g) => set.add(g)))
  return Array.from(set).sort()
}

type AudienceSelection = {
  type: AudienceType
  program: string
  goal: string
  selectedIds: Set<string>
}

// The actual clients matching the current audience definition — backs both
// the live recipient count and the "who is this" names list.
export function recipientClients(sel: AudienceSelection): Client[] {
  switch (sel.type) {
    case 'all':
      return CLIENTS_DATA
    case 'selected':
      return CLIENTS_DATA.filter((c) => sel.selectedIds.has(c.id))
    case 'program':
      return sel.program
        ? CLIENTS_DATA.filter((c) => c.program === sel.program)
        : []
    case 'goals':
      return sel.goal
        ? CLIENTS_DATA.filter((c) => c.goals.includes(sel.goal))
        : []
  }
}

export function recipientCount(sel: AudienceSelection): number {
  switch (sel.type) {
    case 'all':
      return CLIENTS_DATA.length
    case 'selected':
      return sel.selectedIds.size
    case 'program':
      if (!sel.program) return 0
      return CLIENTS_DATA.filter((c) => c.program === sel.program).length
    case 'goals':
      if (!sel.goal) return 0
      return CLIENTS_DATA.filter((c) => c.goals.includes(sel.goal)).length
  }
}

// 1–30 for Day, 1–52 for Week, 1–12 for Month.
export function repeatCountOptions(unit: RepeatUnit): number[] {
  const max = unit === 'day' ? 30 : unit === 'week' ? 52 : 12
  return Array.from({ length: max }, (_, i) => i + 1)
}

const REPEAT_UNIT_LABEL: Record<RepeatUnit, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
}

export function repeatUnitLabel(unit: RepeatUnit, count: number): string {
  const base = REPEAT_UNIT_LABEL[unit]
  return count === 1 ? base : `${base}s`
}

// ===================== Broadcast roster =====================

const BROADCAST_TITLE_POOL = [
  'Welcome Batch',
  'Weekly Motivation',
  'Diet Reminder',
  'Check-in Reminder',
  'Program Kickoff',
  'Holiday Notice',
  'Progress Celebration',
  'Hydration Reminder',
  'Workout Challenge',
  'Renewal Notice',
  'New Program Announcement',
  'Appointment Reminder',
]

const SCHEDULE_TIME_POOL = ['09:00', '10:00', '14:00', '17:30']
const REPEAT_UNITS: RepeatUnit[] = ['day', 'week', 'month']

function randomAudience(seed: number): {
  type: AudienceType
  program: string
  goal: string
  recipientCount: number
} {
  const roll = seededRandom(seed)
  if (roll < 0.3) {
    return {
      type: 'all',
      program: '',
      goal: '',
      recipientCount: 400 + Math.floor(seededRandom(seed * 2) * 700),
    }
  }
  if (roll < 0.65) {
    return {
      type: 'program',
      program: pick(programNames(), seed * 3),
      goal: '',
      recipientCount: 30 + Math.floor(seededRandom(seed * 4) * 250),
    }
  }
  if (roll < 0.85) {
    return {
      type: 'goals',
      program: '',
      goal: pick(distinctGoals(), seed * 5),
      recipientCount: 10 + Math.floor(seededRandom(seed * 6) * 120),
    }
  }
  return {
    type: 'selected',
    program: '',
    goal: '',
    recipientCount: 2 + Math.floor(seededRandom(seed * 7) * 30),
  }
}

// Deterministic shuffle so the fixed 12/30 status split (matching the
// summary-card example counts exactly) doesn't read as visibly grouped.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 7.13) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const BROADCAST_COUNT = 42
const SCHEDULED_COUNT = 12

// Broadcasts are never seeded as drafts — the Draft status only exists as a
// latent internal value (see BroadcastStatus) that the UI no longer surfaces.
function statusSequence(): BroadcastStatus[] {
  const seq: BroadcastStatus[] = [
    ...Array<BroadcastStatus>(SCHEDULED_COUNT).fill('scheduled'),
    ...Array<BroadcastStatus>(BROADCAST_COUNT - SCHEDULED_COUNT).fill(
      'published',
    ),
  ]
  return seededShuffle(seq, 17)
}

function isoDateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildBroadcast(index: number, status: BroadcastStatus): Broadcast {
  const seed = index * 11.7 + 3
  const template = pick(TEMPLATES, seed * 1.3)
  const audience = randomAudience(seed * 2.1)
  const createdDate = daysAgo(Math.floor(seededRandom(seed * 3.7) * 60))

  let scheduleDate = ''
  let scheduleTime = ''
  if (status === 'scheduled') {
    scheduleDate = isoDateOffset(Math.floor(seededRandom(seed * 4.9) * 14))
    scheduleTime = pick(SCHEDULE_TIME_POOL, seed * 5.3)
  } else if (status === 'published') {
    scheduleDate = isoDateOffset(
      -(1 + Math.floor(seededRandom(seed * 4.9) * 45)),
    )
    scheduleTime = pick(SCHEDULE_TIME_POOL, seed * 5.3)
  }

  return {
    id: `bc-${index + 1}`,
    title: pick(BROADCAST_TITLE_POOL, seed * 6.1),
    templateId: template.id,
    audienceType: audience.type,
    program: audience.program,
    goal: audience.goal,
    selectedClientIds:
      audience.type === 'selected'
        ? CLIENTS_DATA.slice(0, audience.recipientCount).map((c) => c.id)
        : [],
    recipientCount: audience.recipientCount,
    timing: status === 'scheduled' ? 'later' : 'now',
    scheduleMode: 'datetime',
    scheduleDate,
    scheduleTime,
    repeatUnit: pick(REPEAT_UNITS, seed * 7.7),
    repeatCount: 1 + Math.floor(seededRandom(seed * 8.3) * 6),
    status,
    trashed: false,
    createdBy: pick(TEMPLATE_AUTHORS, seed * 9.1),
    createdDate,
    updatedDate: createdDate,
  }
}

export function seedBroadcasts(): Broadcast[] {
  return statusSequence().map((status, i) => buildBroadcast(i, status))
}

// Build a blank draft for the "new broadcast" composer flow.
export function buildBlankBroadcast(): Broadcast {
  const now = new Date()
  return {
    id: `bc-${Date.now()}`,
    title: '',
    templateId: '',
    audienceType: 'all',
    program: '',
    goal: '',
    selectedClientIds: [],
    recipientCount: CLIENTS_DATA.length,
    timing: 'now',
    scheduleMode: 'datetime',
    scheduleDate: isoDateOffset(1),
    scheduleTime: '09:00',
    repeatUnit: 'day',
    repeatCount: 7,
    status: 'draft',
    trashed: false,
    createdBy: 'Sarah Nolan',
    createdDate: now,
    updatedDate: now,
  }
}

export type BroadcastSummary = {
  total: number
  scheduled: number
  published: number
}

// Draft-status broadcasts (a latent internal value — see BroadcastStatus)
// are excluded here the same way trashed ones are, so nothing ever surfaces
// the retired Draft concept through the summary cards or the grid below.
export function broadcastSummary(list: Broadcast[]): BroadcastSummary {
  const active = list.filter((b) => !b.trashed && b.status !== 'draft')
  return {
    total: active.length,
    scheduled: active.filter((b) => b.status === 'scheduled').length,
    published: active.filter((b) => b.status === 'published').length,
  }
}

function formatTimeLabel(hhmm: string): string {
  if (!hhmm) return ''
  const [hStr, mStr] = hhmm.split(':')
  const h = Number(hStr)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr} ${period}`
}

// "—" for drafts, "Today • 9:00 AM" / "in 5 days" style for scheduled
// (future), and formatCheckIn's "Yesterday" / "N days ago" for published
// (past) — matching the roster's example rows exactly. A "Rule" schedule has
// no fixed date (it fires relative to each client's own activation date), so
// it reads as "After 7 Days" instead.
export function formatScheduledOn(b: Broadcast): string {
  if (b.status === 'scheduled' && b.scheduleMode === 'rule') {
    return `After ${b.repeatCount} ${repeatUnitLabel(b.repeatUnit, b.repeatCount)}`
  }
  if (b.status === 'draft' || !b.scheduleDate) return '—'
  const target = new Date(`${b.scheduleDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (24 * 3600 * 1000),
  )
  const time = formatTimeLabel(b.scheduleTime)

  if (b.status === 'published') {
    return formatCheckIn(Math.max(0, -diffDays))
  }
  if (diffDays === 0) return time ? `Today • ${time}` : 'Today'
  if (diffDays === 1) return time ? `Tomorrow • ${time}` : 'Tomorrow'
  const label = target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  return time ? `${label} • ${time}` : label
}

// ===================== Session persistence =====================
// v2: bumped when `scheduleMode` was added to the Broadcast shape, so any
// pre-existing localStorage data (missing the field) is reseeded instead of
// silently loading in a broken shape.
const BROADCASTS_STORAGE_KEY = 'nourish_broadcasts_v2'
const BROADCAST_DATE_KEYS = ['createdDate', 'updatedDate']

function reviveBroadcastDates(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(reviveBroadcastDates)
    return
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    Object.keys(obj).forEach((k) => {
      if (BROADCAST_DATE_KEYS.includes(k) && typeof obj[k] === 'string') {
        obj[k] = new Date(obj[k] as string)
      } else {
        reviveBroadcastDates(obj[k])
      }
    })
  }
}

export function saveBroadcasts(broadcasts: Broadcast[]): void {
  try {
    localStorage.setItem(BROADCASTS_STORAGE_KEY, JSON.stringify(broadcasts))
  } catch {
    /* storage unavailable — edits just won't survive a reload */
  }
}

function loadStoredBroadcasts(): Broadcast[] | null {
  try {
    const raw = localStorage.getItem(BROADCASTS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    reviveBroadcastDates(parsed)
    return parsed as Broadcast[]
  } catch {
    return null
  }
}

// The session's broadcasts — restored from localStorage or freshly seeded.
export const BROADCASTS: Broadcast[] =
  loadStoredBroadcasts() ?? seedBroadcasts()

export function broadcastById(id: string): Broadcast | undefined {
  return BROADCASTS.find((b) => b.id === id)
}
