// Read hooks for the clients roster. Components consume these, never the api
// module or the HTTP client. `keepPreviousData` holds the current page visible
// while the next one loads (no flash of an empty table between pages); the
// query's `signal` is forwarded so navigating away aborts the request.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getClientsSummary, listClients } from '../api/clients.api'
import { clientKeys } from '../api/clients.keys'
import type { ListClientsParams } from '../api/clients.types'

export function useClientsQuery(params: ListClientsParams) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: ({ signal }) => listClients(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useClientsSummaryQuery() {
  return useQuery({
    queryKey: clientKeys.summary(),
    queryFn: ({ signal }) => getClientsSummary(signal),
  })
}
