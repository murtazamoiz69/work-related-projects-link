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
  return `${c.name} ${c.program} ${c.diet} ${c.goals.join(' ')}`.toLowerCase()
}
