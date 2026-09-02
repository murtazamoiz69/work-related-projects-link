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

// Step 1 — the Catch Up chips' metadata, independent of which chip is active:
// the chip definitions, their badge counts, the week-range label, and the
// server's default chip. The client fetches this first, then requests rows for
// `defaultKey` (or whichever chip the user picks) — so it never has to name a
// filter it hasn't been told exists. No date fields, so DTO == domain.
export type AttentionFilters = {
  filters: AttnFilterDef[]
  counts: Record<string, number>
  defaultKey: string
  weekRange: string
}

// Step 2 — the rows for one chip. The rows themselves are the payload; the
// chip metadata came from AttentionFilters.
export type NeedsAttentionDto = { rows: AttentionItemDto[] }
export type NeedsAttention = { rows: AttentionItem[] }

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
