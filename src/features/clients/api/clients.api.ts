// Clients service — the stable interface the UI (via React Query hooks)
// consumes. It calls the shared HTTP client; whether the response comes from
// MSW mocks or a real backend is decided at the transport layer and is
// invisible here and above. The one job left in this module is mapping the wire
// DTO (ISO dates) to the domain `Client` (Date). See docs/api-guidelines.md.
import { get, patch, post } from '@/lib/api/client'
import type { Paginated } from '@/lib/api/types'
import type { Client } from '../types'
import type {
  BulkCreateClientsBody,
  BulkCreateClientsDto,
  ClientDto,
  ClientProgramsDto,
  ClientsSummaryDto,
  CreateClientBody,
  ExtendClientExpiryBody,
  ListClientsParams,
  PaginatedClientsDto,
  SkippedClientRow,
  UpdateClientAccessBody,
} from './clients.types'

/** Bulk import, in domain terms — `created` mapped, `skipped` passed through
 *  (its `row` indexes the submitted array, which is the caller's own list). */
export type BulkCreateClientsResult = {
  created: Client[]
  skipped: SkippedClientRow[]
}

/** The one boundary that maps a wire DTO (ISO strings) to the domain model
 *  (`Date`). Everything above the api layer works with `Client`, never `ClientDto`. */
export function toClient(dto: ClientDto): Client {
  return {
    ...dto,
    expiryDate: new Date(dto.expiryDate),
    joinDate: new Date(dto.joinDate),
    dietReviewedAt: dto.dietReviewedAt ? new Date(dto.dietReviewedAt) : null,
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

/** `GET /clients/programs` — the plans "Add User" may assign. */
export async function getClientPrograms(
  signal?: AbortSignal,
): Promise<string[]> {
  const dto = await get<ClientProgramsDto>('/clients/programs', { signal })
  return dto.programs
}

/** `POST /clients` — add one user. Rejects with a `validation` ApiError whose
 *  `fields` map onto the Add User form. */
export async function createClient(body: CreateClientBody): Promise<Client> {
  const dto = await post<ClientDto>('/clients', body)
  return toClient(dto)
}

/** `POST /clients/bulk` — import many. With `dryRun` nothing is persisted and
 *  the result is purely the per-row verdict the importer previews. */
export async function bulkCreateClients(
  body: BulkCreateClientsBody,
): Promise<BulkCreateClientsResult> {
  const dto = await post<BulkCreateClientsDto>('/clients/bulk', body)
  return { created: dto.created.map(toClient), skipped: dto.skipped }
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
