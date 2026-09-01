// Dashboard service — read-only aggregate endpoints. Maps embedded ClientDto ->
// domain Client so the panels (and ClientActions) work with real Client objects.
import { get } from '@/lib/api/client'
import { toClient } from '@/features/clients'
import type { ClientProgress, KpiCounts } from '../types'
import type {
  AttentionItem,
  AttentionItemDto,
  ExpiryItem,
  ExpiryItemDto,
  NeedsAttention,
  NeedsAttentionDto,
} from './dashboard.types'

export async function getKpis(signal?: AbortSignal): Promise<KpiCounts> {
  return get<KpiCounts>('/dashboard/kpis', { signal })
}

export async function getNeedsAttention(
  filter: string,
  signal?: AbortSignal,
): Promise<NeedsAttention> {
  const dto = await get<NeedsAttentionDto>('/dashboard/needs-attention', {
    params: { filter },
    signal,
  })
  const rows: AttentionItem[] = dto.rows.map((r: AttentionItemDto) => ({
    ...r,
    client: toClient(r.client),
  }))
  return { ...dto, rows }
}

export async function getUpcomingExpirations(
  signal?: AbortSignal,
): Promise<ExpiryItem[]> {
  const dto = await get<ExpiryItemDto[]>('/dashboard/upcoming-expirations', {
    signal,
  })
  return dto.map((e) => ({ client: toClient(e.client), daysLeft: e.daysLeft }))
}

export async function getClientProgress(
  range: number,
  program: string,
  signal?: AbortSignal,
): Promise<ClientProgress> {
  return get<ClientProgress>('/dashboard/client-progress', {
    params: { range, program },
    signal,
  })
}

export async function getDashboardPrograms(
  signal?: AbortSignal,
): Promise<string[]> {
  const res = await get<{ programs: string[] }>('/dashboard/programs', {
    signal,
  })
  return res.programs
}
