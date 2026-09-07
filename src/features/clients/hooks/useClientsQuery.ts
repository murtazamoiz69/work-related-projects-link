// Read hooks for the clients roster. Components consume these, never the api
// module or the HTTP client. `keepPreviousData` holds the current page visible
// while the next one loads (no flash of an empty table between pages); the
// query's `signal` is forwarded so navigating away aborts the request.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getClientPrograms,
  getClientsSummary,
  listClients,
} from '../api/clients.api'
import { clientKeys } from '../api/clients.keys'
import type { ListClientsParams } from '../api/clients.types'

export function useClientsQuery(
  params: ListClientsParams,
  opts?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: ({ signal }) => listClients(params, signal),
    placeholderData: keepPreviousData,
    enabled: opts?.enabled,
  })
}

export function useClientsSummaryQuery() {
  return useQuery({
    queryKey: clientKeys.summary(),
    queryFn: ({ signal }) => getClientsSummary(signal),
  })
}

/** The assignable plans for the Add User form's dropdown and the bulk
 *  importer's plan-name column. Reference data that doesn't change as the
 *  roster does, hence `staleTime: Infinity` — it's fetched once per session
 *  even though a roster mutation invalidates the whole `['clients']` subtree. */
export function useClientProgramsQuery() {
  return useQuery({
    queryKey: clientKeys.programs(),
    queryFn: ({ signal }) => getClientPrograms(signal),
    staleTime: Infinity,
  })
}
