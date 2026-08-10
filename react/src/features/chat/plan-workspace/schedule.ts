// Plan Workspace scheduling helpers — status (Completed/Upcoming) is derived
// purely from the scheduled date+time vs. now, which also gates editing.
// Ported from V2's plan-workspace.js (scheduledDateTime / isUpcoming / …).
import type { ClinicalProfile, Workspace } from './types'

export function scheduledDateTime(
  programStart: Date,
  weekNum: number,
  dayNum: number,
  timeStr: string,
): Date {
  const date = new Date(programStart)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + (weekNum - 1) * 7 + (dayNum - 1))
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  date.setHours(h || 0, m || 0, 0, 0)
  return date
}

export function isUpcoming(
  programStart: Date,
  weekNum: number,
  dayNum: number,
  timeStr: string,
): boolean {
  return scheduledDateTime(programStart, weekNum, dayNum, timeStr) >= new Date()
}

export function roundToNext15(date: Date): string {
  const d = new Date(date)
  d.setSeconds(0, 0)
  const m = d.getMinutes()
  d.setMinutes(m + ((15 - (m % 15)) % 15 || 15))
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function todayWeekDay(
  profile: ClinicalProfile,
  ws: Workspace,
): { weekNum: number; dayNum: number } {
  const totalWeeks = ws.workoutWeeks.length
  const totalDays = totalWeeks * 7
  const offset = Math.min(Math.max(profile.tenureDays - 1, 0), totalDays - 1)
  return { weekNum: Math.floor(offset / 7) + 1, dayNum: (offset % 7) + 1 }
}

export function workoutDayDate(
  programStart: Date,
  weekNum: number,
  dayNum: number,
): string {
  const date = new Date(programStart)
  date.setDate(date.getDate() + (weekNum - 1) * 7 + (dayNum - 1))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toDateInputValue(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
