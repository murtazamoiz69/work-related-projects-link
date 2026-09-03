// Public surface of the clients api layer. Consumers (React Query hooks, next
// phase) import from here; the real transport swap stays invisible to them.
export {
  listClients,
  getClientsSummary,
  getClientPrograms,
  createClient,
  bulkCreateClients,
  updateClientAccess,
  extendClientExpiry,
  toClient,
  type BulkCreateClientsResult,
} from './clients.api'
export type {
  ListClientsParams,
  UpdateClientAccessBody,
  ExtendClientExpiryBody,
  CreateClientBody,
  BulkCreateClientsBody,
  SkippedClientRow,
  ClientDto,
  ClientsSummaryDto,
  ClientProgramsDto,
  PaginatedClientsDto,
  BulkCreateClientsDto,
  ClientStatusFilter,
  ClientExpiryFilter,
  ClientReviewFilter,
} from './clients.types'
export {
  CLIENT_FIXTURES,
  clientsScenarios,
  filterClientFixtures,
  summarizeClientFixtures,
  resetClientStore,
} from './clients.mock'
