// Clients service — the stable interface the UI (and, next, the React Query
// hooks) consume. Today it resolves from the in-memory fixtures via the mock
// transport; when MSW + axios land it swaps these internals for real requests
// (`api.get('/clients', …)`) without changing a single signature or caller.
// See docs/api-guidelines.md.
import { mockError, mockOk } from '@/lib/api/mock'
import type { Paginated } from '@/lib/api/types'
import type { Client } from '../types'
import {
  CLIENT_FIXTURES,
  filterClientFixtures,
  summarizeClientFixtures,
} from './clients.mock'
import type {
  ClientDto,
  ClientsSummaryDto,
  ExtendClientExpiryBody,
  ListClientsParams,
  UpdateClientAccessBody,
} from './clients.types'

const DEFAULT_PAGE_SIZE = 12

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
): Promise<Paginated<Client>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const matched = filterClientFixtures(params)
  const start = (page - 1) * pageSize
  const items = matched.slice(start, start + pageSize).map(toClient)
  return mockOk({ items, total: matched.length, page, pageSize })
}

/** `GET /clients/summary` — roster counts for the summary cards. */
export async function getClientsSummary(): Promise<ClientsSummaryDto> {
  return mockOk(summarizeClientFixtures())
}

/** `PATCH /clients/:id/access` — enable/disable a user's program access. */
export async function updateClientAccess(
  id: string,
  body: UpdateClientAccessBody,
): Promise<Client> {
  const dto = CLIENT_FIXTURES.find((c) => c.id === id)
  if (!dto) return mockError('not-found', 'User not found.')
  return mockOk(toClient({ ...dto, accessEnabled: body.enabled }))
}

/** `PATCH /clients/:id/expiry` — extend a user's program to a new expiry. */
export async function extendClientExpiry(
  id: string,
  body: ExtendClientExpiryBody,
): Promise<Client> {
  const dto = CLIENT_FIXTURES.find((c) => c.id === id)
  if (!dto) return mockError('not-found', 'User not found.')

  const next = new Date(body.expiryDate)
  const isFuture = !Number.isNaN(next.getTime()) && next.getTime() > Date.now()
  if (!isFuture) {
    return mockError('validation', 'The program could not be extended.', {
      fields: { expiryDate: 'Expiry must be a valid date in the future.' },
    })
  }
  return mockOk(toClient({ ...dto, expiryDate: body.expiryDate }))
}
