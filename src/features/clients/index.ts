export type { Client, ClientStatus } from './types'
export { CLIENTS_DATA, STATUS_LABEL, PROGRAM_PLAN, PROGRAMS } from './data'
export {
  formatCheckIn,
  formatJoinDate,
  adherenceTier,
  clientHaystack,
  daysUntil,
  expiryUrgency,
  expiryLabel,
  formatFullDate,
  formatPeriodDate,
  type AdherenceTier,
  type ExpiryUrgency,
} from './utils'

// API layer
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
} from './api/clients.api'
export { toClientDto } from './api/clients.mock'
export type {
  ListClientsParams,
  ClientsSearch,
  ClientStatusFilter,
  ClientExpiryFilter,
  ClientReviewFilter,
  ClientDto,
  ClientsSummaryDto,
  PaginatedClientsDto,
  CreateClientBody,
  BulkCreateClientsBody,
  BulkCreateClientsDto,
  SkippedClientRow,
} from './api/clients.types'

// Query / mutation hooks (the only surface pages should use for data)
export {
  useClientsQuery,
  useClientsSummaryQuery,
  useClientProgramsQuery,
} from './hooks/useClientsQuery'
export {
  useUpdateClientAccess,
  useExtendClientExpiry,
  useCreateClient,
  useBulkCreateClients,
} from './hooks/useClientMutations'
