// Mock backend for client detail: runs the deriveDetail logic (server-side in a
// real backend) and serializes it to the wire DTO.
import type { Client } from '@/features/clients'
import { deriveDetail } from '../data'
import type { ClientDetailDto } from './detail.types'

export function clientDetailDto(client: Client): ClientDetailDto {
  const d = deriveDetail(client)
  return {
    ...d,
    programs: d.programs.map((p) => ({
      ...p,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      weeks: p.weeks.map((w) => ({ ...w, date: w.date.toISOString() })),
    })),
  }
}
