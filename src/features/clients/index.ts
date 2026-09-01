export type { Client, ClientStatus } from './types'
export { CLIENTS_DATA, STATUS_LABEL, PROGRAM_PLAN } from './data'
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
  updateClientAccess,
  extendClientExpiry,
  toClient,
} from './api/clients.api'
export { toClientDto } from './api/clients.mock'
export type {
  ListClientsParams,
  ClientsSearch,
  ClientStatusFilter,
  ClientExpiryFilter,
  ClientDto,
  ClientsSummaryDto,
  PaginatedClientsDto,
} from './api/clients.types'

// Query / mutation hooks (the only surface pages should use for data)
export {
  useClientsQuery,
  useClientsSummaryQuery,
} from './hooks/useClientsQuery'
export {
  useUpdateClientAccess,
  useExtendClientExpiry,
} from './hooks/useClientMutations'
