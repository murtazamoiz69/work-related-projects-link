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
import type { ExpiryItemDto, NeedsAttentionDto } from './dashboard.types'

export function kpisDto(): KpiCounts {
  return buildKpiCounts()
}

export function needsAttentionDto(filter: string): NeedsAttentionDto {
  const rows = buildFilteredAttentionList([filter]).map((r) => ({
    client: toClientDto(r.client),
    icon: r.icon,
    text: r.text,
    week: dashWeeklyProgress(r.client, r.index),
  }))
  return {
    rows,
    counts: dashFilterCounts(),
    filters: ATTN_FILTER_DEFS,
    weekRange: dashCurrentWeekRangeLabel(),
  }
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
