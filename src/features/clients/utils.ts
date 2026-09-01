import type { Client } from './types'

export function formatCheckIn(days: number | null | undefined): string {
  if (days === null || days === undefined) return '—'
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export function formatJoinDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export type AdherenceTier = 'good' | 'warn' | 'low'

export function adherenceTier(pct: number): AdherenceTier {
  if (pct >= 80) return 'good'
  if (pct >= 50) return 'warn'
  return 'low'
}

export function clientHaystack(c: Client): string {
  return `${c.name} ${c.email} ${c.program} ${c.diet} ${c.goals.join(' ')}`.toLowerCase()
}

/** Calendar-day difference between now and `date` — negative once past. */
export function daysUntil(date: Date): number {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

export type ExpiryUrgency = 'normal' | 'attention' | 'warning' | 'expired'

/** Users page thresholds: >14d normal, 7-14d attention, 0-7d warning, past expired. */
export function expiryUrgency(daysLeft: number): ExpiryUrgency {
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 7) return 'warning'
  if (daysLeft <= 14) return 'attention'
  return 'normal'
}

export function expiryLabel(daysLeft: number): string {
  if (daysLeft < 0) return 'Expired'
  if (daysLeft === 0) return 'Expires today'
  if (daysLeft === 1) return '1 day left'
  return `${daysLeft} days left`
}

/** "August 24, 2026" — the Users page's full expiry date format. */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** "August 24" — used for the Extend modal's "period" range (no year/comma). */
export function formatPeriodDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}
