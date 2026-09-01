// Load + persist a client's plan workspace.
//
// The workspace is loaded once and then edited IN PLACE by the tabs/modals
// (unchanged from the pre-API design). savePlan persists the whole workspace
// but deliberately does NOT write the result back into the cache: keeping the
// same object identity means open editor modals holding refs into `ws` stay
// valid across a save. No in-session refetch (staleTime) keeps it stable.
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import type { Workspace } from '../types'
import { getPlan, savePlan } from '../api/plan.api'
import { planKeys } from '../api/plan.keys'

export function usePlanQuery(clientId: string) {
  return useQuery({
    queryKey: planKeys.detail(clientId),
    queryFn: ({ signal }) => getPlan(clientId, signal),
    staleTime: Infinity,
  })
}

export function useSavePlan(clientId: string) {
  return useMutation({
    mutationFn: (ws: Workspace) => savePlan(clientId, ws),
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}
