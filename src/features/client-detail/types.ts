// Client-detail domain model — a rich, seeded profile derived from the base
// Client record, mirroring V2 client-detail.js. The centrepiece is the
// "Program Journey": a run of programs, each a series of weekly check-ins.

export type WeekStatus = 'done' | 'current' | 'upcoming' | 'missed'

export type Measurements = { chest: number; waist: number; hips: number }

/** Each slot is a presence flag, or a data-URI string for a real chat photo. */
export type Photos = Record<'front' | 'side' | 'back', boolean | string>

export type ProgramWeek = {
  week: number
  date: Date
  status: WeekStatus
  submitted: boolean
  weightKg: number | null
  measurements: Measurements | null
  photos: Photos | null
  dietPct: number | null
  workoutPct: number | null
  coachNote: string | null
}

export type Program = {
  id: string
  name: string
  phase: string
  goal: string
  coach: string
  totalWeeks: number
  currentWeek: number
  startDate: Date
  endDate: Date
  status: 'active' | 'completed'
  weeks: ProgramWeek[]
  weeksLogged: number
  consistency: number | null
  streak: number
  startWeight: number | null
  latestWeight: number | null
  weightChange: number | null
  waistChange: number | null
}

export type NoteAttachment = { name: string; type: string }

export type InternalNote = {
  author: string
  text: string
  /** When the note was written (ISO). The authoritative age — `days` is a
   *  legacy fallback for records that predate this field. */
  createdAt?: string
  /** @deprecated Relative age in days-ago. Frozen at write time; use
   *  `createdAt`. Kept for backward compatibility with older stored notes. */
  days: number
  attachment?: NoteAttachment | null
}

export type TimelineEntry = { text: string; days: number }

export type ClientDetail = {
  heightCm: number
  weightKg: number
  targetWeightKg: number
  bmi: string
  activityLevel: string
  weeklyCommitment: number
  allergies: string[]
  medicalConditions: string[]
  notes: InternalNote[]
  timeline: TimelineEntry[]
  aiSummary: string[]
  programs: Program[]
}

export type JourneyMetric = 'weight' | 'waist' | 'chest' | 'hips'
export type DeltaTone = 'good' | 'bad' | 'flat'
export type ChecklistItem = { name: string; detail?: string }
