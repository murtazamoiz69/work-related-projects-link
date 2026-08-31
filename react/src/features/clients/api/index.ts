// Public surface of the clients api layer. Consumers (React Query hooks, next
// phase) import from here; the real transport swap stays invisible to them.
export {
  listClients,
  getClientsSummary,
  updateClientAccess,
  extendClientExpiry,
  toClient,
} from './clients.api'
export type {
  ListClientsParams,
  UpdateClientAccessBody,
  ExtendClientExpiryBody,
  ClientDto,
  ClientsSummaryDto,
  PaginatedClientsDto,
  ClientStatusFilter,
  ClientExpiryFilter,
} from './clients.types'
export {
  CLIENT_FIXTURES,
  clientsScenarios,
  filterClientFixtures,
  summarizeClientFixtures,
} from './clients.mock'
