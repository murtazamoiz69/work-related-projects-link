// Derives a rich, seeded profile from the base Client record — ported from
// V2 client-detail.js (and the chat-photo helpers from clients.js). Deterministic
// per client id, so the same person reads consistently everywhere.
import { daysAgo, pick, seededRandom } from '@/lib/seed'
import { CLIENTS_DATA, type Client } from '@/features/clients'
import type {
  ChecklistItem,
  ClientDetail,
  DeltaTone,
  InternalNote,
  JourneyMetric,
  Measurements,
  Photos,
  Program,
  ProgramWeek,
  TimelineEntry,
  WeekStatus,
} from './types'

const ACTIVITY_LEVELS = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
  'Athlete',
]
const ALLERGY_POOL = ['Peanuts', 'Shellfish', 'Dairy', 'Gluten', 'Eggs', 'Soy']
const MEDICAL_POOL = [
  'Diabetes',
  'Hypertension',
  'PCOS',
  'Thyroid',
  'High cholesterol',
  'IBS',
]

// Coach-assigned program identities the seeded history rotates through.
const PROGRAM_BLUEPRINTS = [
  { name: 'Foundations Reset', phase: 'Foundations · Beginner' },
  { name: '12-Week Fat Loss Reset', phase: 'Strength · Fat Loss' },
  { name: 'Metabolic Balance Block', phase: 'Metabolic · Nutrition' },
  { name: 'Summer Lean-Out Challenge', phase: 'Strength · Intermediate' },
  { name: 'Strength & Recomp Phase', phase: 'Strength · Advanced' },
  { name: 'Endurance Base Block', phase: 'Conditioning · Endurance' },
  { name: 'Maintenance & Habits', phase: 'Maintenance · Lifestyle' },
  { name: 'Progressive Overload Block', phase: 'Strength · Hypertrophy' },
]

const COACH_NOTE_POOL = [
  'Great consistency this week — measurements are trending the right way.',
  'Nice waist reduction. Keep protein steady on training days.',
  'Scale held flat but the photos show real recomposition — that is progress.',
  'Strong check-in. Let us nudge hydration up a little next week.',
  'Energy and adherence both up — keep this rhythm going.',
  'Small bump after the weekend, nothing to worry about. Stay the course.',
]

const NOTE_AUTHORS = [
  'Sarah Nolan',
  'Priya Anand, RD (covering)',
  'James Okoro, RD',
]
const NOTE_TEMPLATES = [
  'Client mentioned scheduling conflicts on weekday mornings — consider shifting check-in reminders later in the day.',
  'Flagged mild knee discomfort during last call — avoiding high-impact cardio until follow-up.',
  'Really responsive over chat — prefers quick voice notes over long text replies.',
  'Requested more variety in meal suggestions — has expressed some flavor fatigue with current rotation.',
  'Family event coming up next month — pre-planned a flexible day into the schedule already.',
]

// Reused for the Adherence tab's per-week drill-in checklist.
export const MEAL_ITEMS_BASE: ChecklistItem[] = [
  { name: 'Breakfast', detail: 'High-protein oats with berries' },
  { name: 'Lunch', detail: 'bowl with greens & grain' },
  { name: 'Dinner', detail: 'Grilled protein with roasted vegetables' },
  { name: 'Snack', detail: 'Greek yogurt & almonds' },
]
export const WORKOUT_ITEMS: ChecklistItem[] = [
  { name: 'Mon — Full-body strength' },
  { name: 'Tue — Mobility & core' },
  { name: 'Thu — Cardio & conditioning' },
  { name: 'Sat — Lower-body strength' },
]

// ---------------------------------------------------------------------
// Chat-photo helpers (ported from clients.js). A mock photo attachment
// renders a consistent placeholder image (deterministic per seed).
// ---------------------------------------------------------------------
const ATTACHMENT_BY_PROGRAM: Record<string, { type: 'file' | 'image' }> = {
  'Diabetes Management': { type: 'file' },
  'Weight Loss': { type: 'image' },
  'Muscle Gain': { type: 'image' },
  'Body Recomposition': { type: 'image' },
  'Cardiac Health': { type: 'file' },
}

function placeholderPhotoDataUri(seed: number): string {
  const hue = Math.floor(seededRandom(seed) * 360)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" viewBox="0 0 240 300">` +
    `<rect width="240" height="300" fill="hsl(${hue},48%,42%)"/>` +
    `<circle cx="120" cy="112" r="42" fill="rgba(255,255,255,.82)"/>` +
    `<path d="M56 236c0-38 28-64 64-64s64 26 64 64" fill="rgba(255,255,255,.82)"/>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function clientChatPhotoDataUri(client: Client): string | null {
  const index = CLIENTS_DATA.findIndex((c) => c.id === client.id)
  if (index === -1) return null
  const seed = (index + 1) * 17.23 + 5
  const attachPool = ATTACHMENT_BY_PROGRAM[client.program]
  if (!attachPool || attachPool.type !== 'image') return null
  if (seededRandom(seed * 4) >= 0.4) return null
  return placeholderPhotoDataUri(seed * 4.6)
}

function pickSubset(
  pool: string[],
  seedBase: number,
  chanceNone: number,
): string[] {
  if (seededRandom(seedBase) < chanceNone) return ['None']
  const count = seededRandom(seedBase + 1) > 0.7 ? 2 : 1
  const items: string[] = []
  for (let i = 0; i < count; i++) {
    const v = pick(pool, seedBase + 2 + i * 3)
    if (!items.includes(v)) items.push(v)
  }
  return items
}

const clampPct = (v: number): number =>
  Math.max(40, Math.min(99, Math.round(v)))

// ---------------------------------------------------------------------
// Program-history builder — the heart of the page.
// ---------------------------------------------------------------------
function buildProgramHistory(
  client: Client,
  seed: number,
): { programs: Program[]; heightCm: number; endWeight: number } {
  const tenureDays = Math.max(
    30,
    Math.round((Date.now() - client.joinDate.getTime()) / (24 * 3600 * 1000)),
  )
  const goalLoseFat = client.goals.includes('Lose fat')
  const goalGain = client.goals.includes('Build muscle')
  const baseAdh = client.adherence ?? 68

  // Roughly one program per ~13-week block of tenure.
  const programCount =
    client.status === 'new'
      ? 1
      : Math.max(1, Math.min(16, Math.round(tenureDays / 95)))

  // Endpoint (today) body metrics, then a whole-history trajectory back from them.
  const heightCm = 150 + Math.floor(seededRandom(seed * 1.7 + 1) * 45)
  const endWeight =
    client.gender === 'Male'
      ? 70 + Math.floor(seededRandom(seed * 2.3 + 2) * 30)
      : 55 + Math.floor(seededRandom(seed * 2.3 + 2) * 28)
  const drift = goalLoseFat
    ? 7 + programCount * 1.1
    : goalGain
      ? -(3 + programCount * 0.8)
      : 2
  const startWeight = Math.round((endWeight + drift) * 10) / 10
  const endWaist = Math.round(0.42 * endWeight + 0.18 * heightCm)
  const endChest = Math.round(endWaist + 6 + seededRandom(seed * 3) * 4)
  const endHips = Math.round(endWaist + 8 + seededRandom(seed * 4) * 4)

  // frac: 0 = join date (oldest), 1 = today.
  function metricsAtFrac(frac: number): { weight: number } & Measurements {
    const weight = startWeight + (endWeight - startWeight) * frac
    const dW = weight - endWeight
    return {
      weight: Math.round(weight * 10) / 10,
      waist: Math.round((endWaist + dW * 0.55) * 10) / 10,
      chest: Math.round((endChest + dW * 0.45) * 10) / 10,
      hips: Math.round((endHips + dW * 0.4) * 10) / 10,
    }
  }

  function buildProgram(
    pIndex: number,
    startDaysAgo: number,
    totalWeeks: number,
    isActive: boolean,
    currentWeek: number,
  ): Program {
    const bp =
      PROGRAM_BLUEPRINTS[
        Math.floor(
          seededRandom(seed * (pIndex + 5) * 1.7) * PROGRAM_BLUEPRINTS.length,
        ) % PROGRAM_BLUEPRINTS.length
      ]
    const weeks: ProgramWeek[] = []
    for (let w = 1; w <= totalWeeks; w++) {
      const weekDaysAgo = startDaysAgo - (w - 1) * 7
      const weekDate = daysAgo(weekDaysAgo) // negative → a future check-in date
      const frac = Math.max(
        0,
        Math.min(1, (tenureDays - weekDaysAgo) / tenureDays),
      )

      let status: WeekStatus
      let submitted: boolean
      if (isActive) {
        if (w < currentWeek) {
          status = 'done'
          submitted = true
        } else if (w === currentWeek) {
          status = 'current'
          submitted = false
        } else {
          status = 'upcoming'
          submitted = false
        }
      } else {
        submitted = seededRandom(seed * (pIndex * 13 + 3) + w * 1.3) > 0.12 // ~12% missed
        status = submitted ? 'done' : 'missed'
      }

      let weightKg: number | null = null
      let measurements: Measurements | null = null
      let photos: Photos | null = null
      let dietPct: number | null = null
      let workoutPct: number | null = null
      let coachNote: string | null = null
      if (submitted) {
        const met = metricsAtFrac(frac)
        const noise = seededRandom(seed * (pIndex + w) + 1.1) - 0.5
        weightKg = Math.round((met.weight + noise * 0.7) * 10) / 10
        measurements = {
          chest: Math.round((met.chest + noise * 0.6) * 10) / 10,
          waist: Math.round((met.waist + noise * 0.6) * 10) / 10,
          hips: Math.round((met.hips + noise * 0.5) * 10) / 10,
        }
        photos = {
          front: true,
          side: seededRandom(seed * (w + 2) + pIndex) > 0.05,
          back: seededRandom(seed * (w + 3) + pIndex) > 0.12,
        }
        dietPct = clampPct(
          baseAdh + (seededRandom(seed * (w + 4) + pIndex) - 0.5) * 28,
        )
        workoutPct = clampPct(
          baseAdh + (seededRandom(seed * (w + 5) + pIndex) - 0.5) * 32,
        )
        if (w === totalWeeks && !isActive) {
          coachNote =
            'Program complete — a real step forward. Ready for the next phase.'
        } else if (seededRandom(seed * (w + 6) + pIndex) > 0.5) {
          coachNote = pick(COACH_NOTE_POOL, seed * (w + 7) + pIndex)
        }
      }
      weeks.push({
        week: w,
        date: weekDate,
        status,
        submitted,
        weightKg,
        measurements,
        photos,
        dietPct,
        workoutPct,
        coachNote,
      })
    }

    // A photo the client attached in chat reads as a real check-in photo:
    // it fills a slot on their most recent submitted week of the active program.
    if (isActive) {
      const lastSubmitted = [...weeks]
        .reverse()
        .find((wk) => wk.submitted && wk.photos)
      const chatPhoto = lastSubmitted && clientChatPhotoDataUri(client)
      if (lastSubmitted && lastSubmitted.photos && chatPhoto) {
        const slots: Array<'front' | 'side' | 'back'> = [
          'front',
          'side',
          'back',
        ]
        const slot = slots.find((s) => lastSubmitted.photos?.[s]) ?? 'front'
        lastSubmitted.photos[slot] = chatPhoto
      }
    }

    const logged = weeks.filter((w) => w.submitted && w.weightKg != null)
    const dueSoFar = isActive ? Math.max(currentWeek - 1, 0) : totalWeeks
    const first = logged[0]
    const last = logged[logged.length - 1]
    // Trailing on-time streak.
    let streak = 0
    for (let w = weeks.length - 1; w >= 0; w--) {
      if (weeks[w].status === 'current' || weeks[w].status === 'upcoming')
        continue
      if (weeks[w].submitted) streak++
      else break
    }
    return {
      id: `prog-${client.id}-${pIndex}`,
      name: bp.name,
      phase: bp.phase,
      goal: client.goals.join(' · '),
      coach: 'Sarah Nolan',
      totalWeeks,
      currentWeek: isActive ? currentWeek : totalWeeks,
      startDate: daysAgo(startDaysAgo),
      endDate: daysAgo(startDaysAgo - totalWeeks * 7),
      status: isActive ? 'active' : 'completed',
      weeks,
      weeksLogged: logged.length,
      consistency:
        dueSoFar > 0 ? Math.round((logged.length / dueSoFar) * 100) : null,
      streak,
      startWeight: first ? first.weightKg : null,
      latestWeight: last ? last.weightKg : null,
      weightChange:
        first && last && first.weightKg != null && last.weightKg != null
          ? Math.round((last.weightKg - first.weightKg) * 10) / 10
          : null,
      waistChange:
        first && last && first.measurements && last.measurements
          ? Math.round(
              (last.measurements.waist - first.measurements.waist) * 10,
            ) / 10
          : null,
    }
  }

  // Active program: today sits partway through it.
  const activeTotalWeeks = 10 + Math.floor(seededRandom(seed * 5) * 4) // 10–13
  let currentWeek =
    client.status === 'new' ? 1 : 3 + Math.floor(seededRandom(seed * 6) * 7) // 3–9
  currentWeek = Math.min(currentWeek, activeTotalWeeks)
  let activeStartDaysAgo =
    (currentWeek - 1) * 7 + Math.floor(seededRandom(seed * 7) * 6)
  activeStartDaysAgo = Math.min(activeStartDaysAgo, tenureDays)

  const active = buildProgram(
    0,
    activeStartDaysAgo,
    activeTotalWeeks,
    true,
    currentWeek,
  )

  // Previous programs fill [join, active-start], oldest → newest, then reversed.
  const prev: Program[] = []
  const prevCount = programCount - 1
  if (prevCount > 0) {
    const span = tenureDays - activeStartDaysAgo
    const block = span / prevCount
    for (let i = 0; i < prevCount; i++) {
      const pStartDaysAgo = Math.round(tenureDays - i * block)
      const pWeeks = Math.max(8, Math.min(13, Math.round(block / 7)))
      prev.push(buildProgram(i + 1, pStartDaysAgo, pWeeks, false, pWeeks))
    }
  }
  prev.reverse() // newest previous first

  const programs = [active, ...prev]

  return { programs, heightCm, endWeight }
}

export function deriveDetail(client: Client): ClientDetail {
  const idNum = parseInt(String(client.id).replace('c-', ''), 10) || 1
  const seed = idNum * 7.13 + 3

  const hist = buildProgramHistory(client, seed)
  const heightCm = hist.heightCm
  const weightKg = hist.programs[0].latestWeight ?? hist.endWeight

  const wantsLoseFat = client.goals.includes('Lose fat')
  const wantsBuildMuscle = client.goals.includes('Build muscle')
  const targetWeightKg = wantsLoseFat
    ? weightKg - (5 + Math.floor(seededRandom(seed * 3.1 + 3) * 10))
    : wantsBuildMuscle
      ? weightKg + (2 + Math.floor(seededRandom(seed * 3.1 + 3) * 6))
      : weightKg
  const bmi = (weightKg / (heightCm / 100) ** 2).toFixed(1)

  const activityLevel = pick(ACTIVITY_LEVELS, seed * 4.7 + 4)
  const weeklyCommitment = 2 + Math.floor(seededRandom(seed * 10.1 + 10) * 5)
  const allergies = pickSubset(ALLERGY_POOL, seed * 5.3 + 5, 0.55)
  const medicalConditions = pickSubset(MEDICAL_POOL, seed * 6.1 + 6, 0.5)
  const tenureDays = Math.round(
    (Date.now() - client.joinDate.getTime()) / (24 * 3600 * 1000),
  )

  // ---- Internal notes ----
  const noteCount = 2 + (seededRandom(seed * 40.1 + 1) > 0.6 ? 1 : 0)
  const notes: InternalNote[] = Array.from({ length: noteCount }, (_, i) => ({
    author: pick(NOTE_AUTHORS, seed * 41 + i * 3),
    text: pick(NOTE_TEMPLATES, seed * 43 + i * 5),
    days: Math.floor(2 + seededRandom(seed * 45 + i) * 20),
  })).sort((a, b) => a.days - b.days)

  // ---- Cross-program activity log ----
  const timeline: TimelineEntry[] = []
  if (client.status !== 'new') {
    timeline.push({
      text: `${client.name} logged weight — ${weightKg}kg`,
      days: client.checkInDays ?? 0,
    })
    timeline.push({
      text:
        client.status === 'attention'
          ? `${client.name} missed a scheduled check-in`
          : `${client.name} completed a weekly check-in`,
      days: (client.checkInDays ?? 0) + 1,
    })
    timeline.push({
      text: `${client.name} uploaded progress photos`,
      days: (client.checkInDays ?? 0) + 2,
    })
    timeline.push({
      text: 'Nourish AI answered a question in chat',
      days: (client.checkInDays ?? 0) + 4,
    })
  }
  timeline.push({
    text: `${client.name} joined Nourish with Nourish AI`,
    days: tenureDays,
  })

  // ---- AI summary ----
  const goalsText = client.goals.join(' and ').toLowerCase()
  let aiSummary: string[]
  if (client.status === 'attention') {
    aiSummary = [
      `Adherence has dropped to ${client.adherence}% — last check-in was ${formatCheckInLower(client.checkInDays)}.`,
      `On the ${client.program} program, working toward ${goalsText}.`,
      `A quick check-in from you could help get them back on track before it slips further.`,
    ]
  } else if (client.status === 'new') {
    aiSummary = [
      `Just joined and hasn't started their plan yet.`,
      `Signed up for ${client.program}, working toward ${goalsText}.`,
      `Reach out to welcome them and confirm their plan preferences before their first check-in.`,
    ]
  } else if (client.status === 'paused') {
    aiSummary = [
      `Plan is currently paused.`,
      `Before pausing, they were working toward ${goalsText} on the ${client.program} program.`,
      `Consider a re-engagement message to see if they're ready to pick back up.`,
    ]
  } else {
    aiSummary = [
      `${client.adherence}% adherence, with a check-in ${formatCheckInLower(client.checkInDays)}.`,
      `On track with the ${client.program} program, progressing toward ${goalsText}.`,
    ]
  }

  return {
    heightCm,
    weightKg,
    targetWeightKg,
    bmi,
    activityLevel,
    weeklyCommitment,
    allergies,
    medicalConditions,
    notes,
    timeline,
    aiSummary,
    programs: hist.programs,
  }
}

// formatCheckIn lowercased — the AI summary reads it mid-sentence.
function formatCheckInLower(days: number | null | undefined): string {
  if (days === null || days === undefined) return '—'
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

// ---------------------------------------------------------------------
// Small presentation helpers
// ---------------------------------------------------------------------
export function fmtDelta(v: number | null, unit: string): string {
  if (v == null) return '—'
  const s = v > 0 ? `+${v}` : `${v}`
  return `${s}${unit}`
}

export function deltaTone(v: number | null, lowerIsBetter: boolean): DeltaTone {
  if (v == null || v === 0) return 'flat'
  const good = lowerIsBetter ? v < 0 : v > 0
  return good ? 'good' : 'bad'
}

export function miniBarTier(pct: number): 'good' | 'ok' | 'low' {
  return pct >= 80 ? 'good' : pct >= 60 ? 'ok' : 'low'
}

// "Jul 1 – 7" (or "Jun 29 – Jul 5" across a month boundary) for a week rail chip.
export function weekChipDateRangeLabel(endDate: Date): string {
  const start = new Date(endDate)
  start.setDate(start.getDate() - 6)
  const sameMonth = start.getMonth() === endDate.getMonth()
  const startFmt = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const endFmt = endDate.toLocaleDateString(
    'en-US',
    sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' },
  )
  return `${startFmt} – ${endFmt}`
}

// Default open week for the timeline: the current week, else the last submitted.
export function jtCurrentWeek(p: Program): number {
  const cur = p.weeks.find((w) => w.status === 'current')
  if (cur) return cur.week
  const lastSubmitted = [...p.weeks].reverse().find((w) => w.submitted)
  return lastSubmitted ? lastSubmitted.week : p.weeks[0].week
}

export const JT_STATUS: Record<WeekStatus, { label: string; tone: string }> = {
  done: { label: 'Submitted', tone: 'done' },
  current: { label: 'Current week', tone: 'current' },
  upcoming: { label: 'Upcoming', tone: 'upcoming' },
  missed: { label: 'Missed', tone: 'missed' },
}

export const JOURNEY_METRIC_COLOR: Record<JourneyMetric, string> = {
  weight: '#2F9E6E',
  waist: '#5B7FA6',
  chest: '#C77F3B',
  hips: '#8A5FBF',
}

export function checklistDoneCount(pct: number | null, total: number): number {
  return pct == null ? 0 : Math.round((pct / 100) * total)
}
