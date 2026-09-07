// Client-detail service — the "At a glance" tracker data, derived server-side
// (in the mock today) and mapped from wire DTO (ISO dates) to domain (Date).
import { get } from '@/lib/api/client'
import type { ClientDetail } from '../types'
import type { ClientDetailDto } from './detail.types'

export function toClientDetail(dto: ClientDetailDto): ClientDetail {
  return {
    ...dto,
    // Defensive against a backend that omits per-program weekly check-ins:
    // the At-a-glance tracker rebuilds daily logs from a seed regardless, so an
    // empty/absent `weeks` array must not crash the ISO→Date mapping.
    programs: (dto.programs ?? []).map((p) => ({
      ...p,
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
      weeks: (p.weeks ?? []).map((w) => ({ ...w, date: new Date(w.date) })),
    })),
  }
}

export async function getClientDetail(
  id: string,
  signal?: AbortSignal,
): Promise<ClientDetail> {
  const dto = await get<ClientDetailDto>(`/clients/${id}/detail`, { signal })
  return toClientDetail(dto)
}
