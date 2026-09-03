// Query + mutation hooks for the diet plans. Components use these; nothing
// below the hook layer is imported by a component.
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import {
  duplicateMasterSheet,
  getClientDietPlan,
  getMasterSheet,
  saveClientDietPlan,
  saveMasterSheet,
  updateClientBand,
  updateClientReview,
} from './dietPlan.api'
import type { CalorieBand, PlanReviewStatus } from './dietPlan.types'

export const dietPlanKeys = {
  all: ['diet-plan'] as const,
  master: (weekNum: number, band: CalorieBand) =>
    ['diet-plan', 'master', weekNum, band] as const,
  masterAll: () => ['diet-plan', 'master'] as const,
  client: (clientId: string, weekNum: number) =>
    ['diet-plan', 'client', clientId, weekNum] as const,
  clientAll: (clientId: string) => ['diet-plan', 'client', clientId] as const,
}

export function useMasterSheetQuery(weekNum: number, band: CalorieBand) {
  return useQuery({
    queryKey: dietPlanKeys.master(weekNum, band),
    queryFn: ({ signal }) => getMasterSheet(weekNum, band, signal),
    // Hold the current sheet on screen while the next week/band loads. Without
    // it the editor unmounts on every switch, which throws away the cursor and
    // makes the panel flash through a skeleton for a local mock response.
    placeholderData: keepPreviousData,
  })
}

export function useSaveMasterSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      weekNum,
      band,
      body,
    }: {
      weekNum: number
      band: CalorieBand
      body: string
    }) => saveMasterSheet({ weekNum, band, body }),
    onSuccess: (sheet) => {
      queryClient.invalidateQueries({
        queryKey: dietPlanKeys.master(sheet.weekNum, sheet.band),
      })
      // Every user on this band derives from the sheet that just changed.
      queryClient.invalidateQueries({ queryKey: ['diet-plan', 'client'] })
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useDuplicateMasterSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fromWeek,
      band,
      toWeeks,
    }: {
      fromWeek: number
      band: CalorieBand
      toWeeks: number[]
    }) => duplicateMasterSheet({ fromWeek, band, toWeeks }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: dietPlanKeys.masterAll() })
      queryClient.invalidateQueries({ queryKey: ['diet-plan', 'client'] })
      const n = result.weeks.length
      showToast(
        n
          ? `Copied to ${n} week${n === 1 ? '' : 's'} on the ${result.band} kcal plan`
          : 'Nothing to copy — those weeks were already the source',
      )
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useClientDietPlanQuery(clientId: string, weekNum: number) {
  return useQuery({
    queryKey: dietPlanKeys.client(clientId, weekNum),
    queryFn: ({ signal }) => getClientDietPlan(clientId, weekNum, signal),
    placeholderData: keepPreviousData,
  })
}

export function useSaveClientDietPlan(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ weekNum, body }: { weekNum: number; body: string }) =>
      saveClientDietPlan(clientId, weekNum, { body }),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({
        queryKey: dietPlanKeys.client(clientId, plan.weekNum),
      })
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useUpdateClientBand(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (band: CalorieBand) => updateClientBand(clientId, { band }),
    onSuccess: (client) => {
      // The roster shows the band as a chip, and every week of this user's plan
      // is re-derived from the new band's master sheets.
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({
        queryKey: dietPlanKeys.clientAll(clientId),
      })
      showToast(
        `${client.name} moved to the ${client.dietProfile?.band} kcal plan — back in review`,
      )
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

/** Sign a user's filtered plan off, or send it back into review. The roster
 *  shows the resulting tag, so the whole clients cache is invalidated. */
export function useUpdateClientReview(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: PlanReviewStatus) =>
      updateClientReview(clientId, { status }),
    onSuccess: (client) => {
      // The roster chip and the plan itself both report the sign-off.
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({
        queryKey: dietPlanKeys.clientAll(clientId),
      })
      showToast(
        client.dietReview === 'reviewed'
          ? `${client.name.split(' ')[0]}'s plan is reviewed and ready`
          : `${client.name.split(' ')[0]}'s plan is back in review`,
      )
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}
