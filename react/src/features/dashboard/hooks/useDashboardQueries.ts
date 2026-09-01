// Read hooks for the dashboard panels. Each panel owns its own query so a slow
// or failed panel doesn't block the others.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
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

export function useNeedsAttentionQuery(filter: string) {
  return useQuery({
    queryKey: dashboardKeys.needsAttention(filter),
    queryFn: ({ signal }) => getNeedsAttention(filter, signal),
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
