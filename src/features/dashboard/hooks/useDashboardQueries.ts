// Read hooks for the dashboard panels. Each panel owns its own query so a slow
// or failed panel doesn't block the others.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getAttentionFilters,
  getClientProgress,
  getDashboardPrograms,
  getKpis,
  getNeedsAttention,
  getUpcomingExpirations,
} from '../api/dashboard.api'
import { dashboardKeys } from '../api/dashboard.keys'

export function useKpisQuery() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: ({ signal }) => getKpis(signal),
  })
}

// Step 1: the chip metadata. The panel seeds its active chip from the
// `defaultKey` this returns, then drives step 2.
export function useAttentionFiltersQuery() {
  return useQuery({
    queryKey: dashboardKeys.attentionFilters(),
    queryFn: ({ signal }) => getAttentionFilters(signal),
  })
}

// Step 2: rows for the active chip. Disabled until a key is known (from step 1
// or a user click), so we never request rows without a valid filter.
export function useNeedsAttentionQuery(filter: string | null) {
  return useQuery({
    queryKey: dashboardKeys.needsAttention(filter ?? ''),
    queryFn: ({ signal }) => getNeedsAttention(filter as string, signal),
    enabled: filter !== null,
    placeholderData: keepPreviousData,
  })
}

export function useUpcomingExpiryQuery() {
  return useQuery({
    queryKey: dashboardKeys.upcomingExpirations(),
    queryFn: ({ signal }) => getUpcomingExpirations(signal),
  })
}

export function useClientProgressQuery(range: number, program: string) {
  return useQuery({
    queryKey: dashboardKeys.clientProgress(range, program),
    queryFn: ({ signal }) => getClientProgress(range, program, signal),
    placeholderData: keepPreviousData,
  })
}

export function useDashboardProgramsQuery() {
  return useQuery({
    queryKey: dashboardKeys.programs(),
    queryFn: ({ signal }) => getDashboardPrograms(signal),
  })
}
