// Query + mutation hooks for the workout plan. Components use these; nothing
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
  duplicateWorkoutWeek,
  getClientWorkoutWeek,
  getWorkoutWeek,
  resetClientWorkoutWeek,
  saveClientWorkoutDay,
  saveWorkoutDay,
  swapClientWorkoutDays,
  swapWorkoutDays,
} from './workoutPlan.api'
import type {
  SaveWorkoutDayBody,
  SwapWorkoutDaysBody,
} from './workoutPlan.api.types'

export const workoutPlanKeys = {
  all: ['workout-plan'] as const,
  master: (weekNum: number) => ['workout-plan', 'master', weekNum] as const,
  masterAll: () => ['workout-plan', 'master'] as const,
  client: (clientId: string, weekNum: number) =>
    ['workout-plan', 'client', clientId, weekNum] as const,
  clientAll: (clientId: string) =>
    ['workout-plan', 'client', clientId] as const,
}

export function useWorkoutWeekQuery(weekNum: number) {
  return useQuery({
    queryKey: workoutPlanKeys.master(weekNum),
    queryFn: ({ signal }) => getWorkoutWeek(weekNum, signal),
    // Hold the current week on screen while the next one loads, so the day
    // list doesn't collapse through a skeleton on every click of the rail.
    placeholderData: keepPreviousData,
  })
}

export function useSaveWorkoutDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SaveWorkoutDayBody) => saveWorkoutDay(body),
    onSuccess: (week) => {
      queryClient.invalidateQueries({
        queryKey: workoutPlanKeys.master(week.weekNum),
      })
      // Every user who hasn't had this week edited for them reads straight
      // through to the programme's copy.
      queryClient.invalidateQueries({ queryKey: ['workout-plan', 'client'] })
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useSwapWorkoutDays() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SwapWorkoutDaysBody) => swapWorkoutDays(body),
    onSuccess: (week) => {
      queryClient.invalidateQueries({
        queryKey: workoutPlanKeys.master(week.weekNum),
      })
      queryClient.invalidateQueries({ queryKey: ['workout-plan', 'client'] })
      showToast('Days swapped')
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useDuplicateWorkoutWeek() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fromWeek,
      toWeeks,
    }: {
      fromWeek: number
      toWeeks: number[]
    }) => duplicateWorkoutWeek({ fromWeek, toWeeks }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.masterAll() })
      queryClient.invalidateQueries({ queryKey: ['workout-plan', 'client'] })
      const n = result.weeks.length
      showToast(
        n
          ? `Copied to ${n} week${n === 1 ? '' : 's'}`
          : 'Nothing to copy — those weeks were already the source',
      )
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useClientWorkoutWeekQuery(clientId: string, weekNum: number) {
  return useQuery({
    queryKey: workoutPlanKeys.client(clientId, weekNum),
    queryFn: ({ signal }) => getClientWorkoutWeek(clientId, weekNum, signal),
    placeholderData: keepPreviousData,
  })
}

export function useSaveClientWorkoutDay(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SaveWorkoutDayBody) =>
      saveClientWorkoutDay(clientId, body),
    onSuccess: (week) => {
      queryClient.invalidateQueries({
        queryKey: workoutPlanKeys.client(clientId, week.weekNum),
      })
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useSwapClientWorkoutDays(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SwapWorkoutDaysBody) =>
      swapClientWorkoutDays(clientId, body),
    onSuccess: (week) => {
      queryClient.invalidateQueries({
        queryKey: workoutPlanKeys.client(clientId, week.weekNum),
      })
      showToast('Days swapped for this user')
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useResetClientWorkoutWeek(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (weekNum: number) => resetClientWorkoutWeek(clientId, weekNum),
    onSuccess: (week) => {
      queryClient.invalidateQueries({
        queryKey: workoutPlanKeys.client(clientId, week.weekNum),
      })
      showToast(`Week ${week.weekNum} is back on the programme's plan`)
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}
