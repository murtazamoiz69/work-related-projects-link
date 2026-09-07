// Query + mutation hooks for the workout plan. Components use these; nothing
// below the hook layer is imported by a component.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import {
  addWorkoutDay,
  getClientWorkoutPlan,
  getWorkoutPlan,
  resetClientWorkoutDay,
  saveClientWorkoutDays,
  saveWorkoutDays,
} from './workoutPlan.api'
import type { SaveWorkoutDaysBody } from './workoutPlan.api.types'

export const workoutPlanKeys = {
  all: ['workout-plan'] as const,
  master: () => ['workout-plan', 'master'] as const,
  client: (clientId: string) => ['workout-plan', 'client', clientId] as const,
}

export function useWorkoutPlanQuery() {
  return useQuery({
    queryKey: workoutPlanKeys.master(),
    queryFn: ({ signal }) => getWorkoutPlan(signal),
  })
}

/** Save the edited day to the days the nutritionist picked. */
export function useSaveWorkoutDays() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SaveWorkoutDaysBody) => saveWorkoutDays(body),
    onSuccess: (_plan, body) => {
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.master() })
      // Every user who hasn't had a day edited reads through to the programme.
      queryClient.invalidateQueries({ queryKey: ['workout-plan', 'client'] })
      const n = body.days.length
      showToast(`Saved to ${n} day${n === 1 ? '' : 's'}`)
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useAddWorkoutDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => addWorkoutDay(),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.master() })
      queryClient.invalidateQueries({ queryKey: ['workout-plan', 'client'] })
      showToast(`Day ${plan.days.length} added`)
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useClientWorkoutPlanQuery(clientId: string) {
  return useQuery({
    queryKey: workoutPlanKeys.client(clientId),
    queryFn: ({ signal }) => getClientWorkoutPlan(clientId, signal),
  })
}

export function useSaveClientWorkoutDays(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SaveWorkoutDaysBody) =>
      saveClientWorkoutDays(clientId, body),
    onSuccess: (_plan, body) => {
      queryClient.invalidateQueries({
        queryKey: workoutPlanKeys.client(clientId),
      })
      const n = body.days.length
      showToast(`Saved to ${n} day${n === 1 ? '' : 's'} for this user`)
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useResetClientWorkoutDay(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (day: number) => resetClientWorkoutDay(clientId, day),
    onSuccess: (_plan, day) => {
      queryClient.invalidateQueries({
        queryKey: workoutPlanKeys.client(clientId),
      })
      showToast(`Day ${day} is back on the programme's plan`)
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}
