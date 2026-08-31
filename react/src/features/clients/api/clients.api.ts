// Clients service — the stable interface the UI (via React Query hooks)
// consumes. It calls the shared HTTP client; whether the response comes from
// MSW mocks or a real backend is decided at the transport layer and is
// invisible here and above. The one job left in this module is mapping the wire
// DTO (ISO dates) to the domain `Client` (Date). See docs/api-guidelines.md.
import { get, patch } from '@/lib/api/client'
import type { Paginated } from '@/lib/api/types'
import type { Client } from '../types'
import type {
  ClientDto,
  ClientsSummaryDto,
  ExtendClientExpiryBody,
  ListClientsParams,
  PaginatedClientsDto,
  UpdateClientAccessBody,
} from './clients.types'

/** The one boundary that maps a wire DTO (ISO strings) to the domain model
 *  (`Date`). Everything above the api layer works with `Client`, never `ClientDto`. */
export function toClient(dto: ClientDto): Client {
  return {
    ...dto,
    expiryDate: new Date(dto.expiryDate),
    joinDate: new Date(dto.joinDate),
  }
}

/** `GET /clients` — filtered, sorted, paginated roster. */
export async function listClients(
  params: ListClientsParams = {},
  signal?: AbortSignal,
): Promise<Paginated<Client>> {
  const dto = await get<PaginatedClientsDto>('/clients', { params, signal })
  return { ...dto, items: dto.items.map(toClient) }
}

/** `GET /clients/summary` — roster counts for the summary cards. */
export async function getClientsSummary(
  signal?: AbortSignal,
): Promise<ClientsSummaryDto> {
  return get<ClientsSummaryDto>('/clients/summary', { signal })
}

/** `PATCH /clients/:id/access` — enable/disable a user's program access. */
export async function updateClientAccess(
  id: string,
  body: UpdateClientAccessBody,
): Promise<Client> {
  const dto = await patch<ClientDto>(`/clients/${id}/access`, body)
  return toClient(dto)
}

/** `PATCH /clients/:id/expiry` — extend a user's program to a new expiry. */
export async function extendClientExpiry(
  id: string,
  body: ExtendClientExpiryBody,
): Promise<Client> {
  const dto = await patch<ClientDto>(`/clients/${id}/expiry`, body)
  return toClient(dto)
}
