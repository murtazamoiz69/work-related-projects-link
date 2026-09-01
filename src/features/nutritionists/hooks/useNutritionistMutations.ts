// Mutation hooks for the nutritionists roster. Each invalidates the roster on
// success and surfaces feedback via toast. The form maps validation errors onto
// its fields; the access toggle reports any failure itself.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import {
  createNutritionist,
  updateNutritionist,
  updateNutritionistAccess,
} from '../api/nutritionists.api'
import { nutritionistKeys } from '../api/nutritionists.keys'
import type { NutritionistFormBody } from '../api/nutritionists.types'

export function useCreateNutritionist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: NutritionistFormBody) => createNutritionist(body),
    onSuccess: (nutritionist) => {
      queryClient.invalidateQueries({ queryKey: nutritionistKeys.all })
      showToast(`${nutritionist.name} added`)
    },
  })
}

export function useUpdateNutritionist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: NutritionistFormBody }) =>
      updateNutritionist(id, body),
    onSuccess: (nutritionist) => {
      queryClient.invalidateQueries({ queryKey: nutritionistKeys.all })
      showToast(`${nutritionist.name} updated`)
    },
  })
}

export function useUpdateNutritionistAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateNutritionistAccess(id, { enabled }),
    onSuccess: (nutritionist) => {
      queryClient.invalidateQueries({ queryKey: nutritionistKeys.all })
      showToast(
        `${nutritionist.name} ${nutritionist.accessEnabled ? 'enabled' : 'disabled'}`,
      )
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}
