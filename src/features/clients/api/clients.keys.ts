// React Query keys for the clients feature. Centralized so queries and the
// mutations that invalidate them can't drift apart.
import type { ListClientsParams } from './clients.types'

export const clientKeys = {
  all: ['clients'] as const,
  list: (params: ListClientsParams) => ['clients', 'list', params] as const,
  summary: () => ['clients', 'summary'] as const,
}
