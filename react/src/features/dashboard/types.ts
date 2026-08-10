import type { Client } from '@/features/clients'

export type KpiCounts = {
  total: number
  newToday: number
  mealsLogged: number
  workoutsLogged: number
}

export type WeekDayTier =
  'done' | 'partial' | 'missed' | 'empty' | 'not-joined' | 'joined-today'

export type WeekDay = {
  daysAgo: number
  isToday: boolean
  tier: WeekDayTier
  popover: string
  /** 'Mon' — opens the tooltip, since the dot itself carries no label. */
  dayLabel: string
  /** 'Jul 27' — used in the tooltip. */
  dateLabel: string
  /** '27' — swapped in under the dot when the date toggle is on. */
  dateShort: string
}

export type AttentionRow = {
  client: Client
  index: number
  icon: string
  text: string
}

export type UpcomingExpiry = { client: Client; daysLeft: number }

export type ClientProgressSeries = { values: number[]; headline: number }

export type ClientProgress = {
  ticks: string[]
  tips: string[]
  activeClients: number
  meals: ClientProgressSeries
  workouts: ClientProgressSeries
}

export type HeroCounts = {
  chatRequests: number
  needAttention: number
  progressReviews: number
  renewals: number
}

export type AttnFilterDef = {
  key: string
  label: string
  icon: string
}
