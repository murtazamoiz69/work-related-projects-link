// Dashboard API contracts. All read-only aggregates. Rows embed a client so the
// existing panels (and ClientActions) get a full domain Client after mapping;
// KpiCounts / ClientProgress / WeekDay / AttnFilterDef carry no dates, so their
// DTO and domain shapes are identical.
import type { Client } from '@/features/clients'
import type { ClientDto } from '@/features/clients/api/clients.types'
import type {
  AttnFilterDef,
  ClientProgress,
  KpiCounts,
  WeekDay,
} from '../types'

// ---- Needs Attention ----

export type AttentionItemDto = {
  client: ClientDto
  icon: string
  text: string
  week: WeekDay[]
}

export type AttentionItem = {
  client: Client
  icon: string
  text: string
  week: WeekDay[]
}

export type NeedsAttentionDto = {
  rows: AttentionItemDto[]
  counts: Record<string, number>
  filters: AttnFilterDef[]
  weekRange: string
}

export type NeedsAttention = {
  rows: AttentionItem[]
  counts: Record<string, number>
  filters: AttnFilterDef[]
  weekRange: string
}

// ---- Upcoming expiry ----

export type ExpiryItemDto = { client: ClientDto; daysLeft: number }
export type ExpiryItem = { client: Client; daysLeft: number }

// ---- Request params ----

export type ClientProgressParams = {
  range: number
  program: string
}

// Re-exported for callers that only import from the api layer.
export type { KpiCounts, ClientProgress }
