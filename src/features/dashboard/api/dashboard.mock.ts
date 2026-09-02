// Mock "backend" for the dashboard. Wraps the existing deterministic builders
// (features/dashboard/data.ts — now server-side logic) and serializes them to
// the wire DTOs, embedding clients as ClientDto and computing the weekly-dot
// data server-side so the panels no longer need the builders or client indices.
import { CLIENTS_DATA, toClientDto } from '@/features/clients'
import {
  ATTN_FILTER_DEFS,
  buildClientProgress,
  buildFilteredAttentionList,
  buildKpiCounts,
  buildUpcomingExpirations,
  dashCurrentWeekRangeLabel,
  dashFilterCounts,
  dashWeeklyProgress,
} from '../data'
import type { ClientProgress, KpiCounts } from '../types'
import type {
  AttentionFilters,
  ExpiryItemDto,
  NeedsAttentionDto,
} from './dashboard.types'

export function kpisDto(): KpiCounts {
  return buildKpiCounts()
}

// Step 1: the Catch Up chip metadata. `defaultKey` is the server's choice of
// which chip opens first (the first defined one), so the client doesn't hardcode
// a filter key.
export function attentionFiltersDto(): AttentionFilters {
  return {
    filters: ATTN_FILTER_DEFS,
    counts: dashFilterCounts(),
    defaultKey: ATTN_FILTER_DEFS[0].key,
    weekRange: dashCurrentWeekRangeLabel(),
  }
}

// Step 2: the rows for one chip.
export function needsAttentionDto(filter: string): NeedsAttentionDto {
  const rows = buildFilteredAttentionList([filter]).map((r) => ({
    client: toClientDto(r.client),
    icon: r.icon,
    text: r.text,
    week: dashWeeklyProgress(r.client, r.index),
  }))
  return { rows }
}

export function upcomingExpirationsDto(): ExpiryItemDto[] {
  return buildUpcomingExpirations().map((e) => ({
    client: toClientDto(e.client),
    daysLeft: e.daysLeft,
  }))
}

export function clientProgressDto(
  range: number,
  program: string,
): ClientProgress {
  return buildClientProgress(range, program)
}

export function programOptions(): string[] {
  return Array.from(new Set(CLIENTS_DATA.map((c) => c.program))).sort()
}
