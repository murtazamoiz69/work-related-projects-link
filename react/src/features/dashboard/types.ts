import type { Client } from '@/features/clients'

export type KpiCounts = {
  total: number
  newToday: number
  mealsLogged: number
  workoutsLogged: number
}

export type WeekDayTier = 'done' | 'partial' | 'missed' | 'empty'

export type WeekDay = {
  daysAgo: number
  isToday: boolean
  tier: WeekDayTier
  popover: string
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
