// Mutations for the global program. updateProgram is the autosave path (the
// page's "Saved" pill is the success signal, so no toast on success — but a
// failure must not be silent). Availability toggling toasts on success.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import type { TrainingProgram } from '../types'
import { updateProgram, updateProgramAvailability } from '../api/programs.api'
import { programKeys } from '../api/programs.keys'

export function useUpdateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (program: TrainingProgram) => updateProgram(program),
    onSuccess: (saved) => {
      queryClient.setQueryData(programKeys.detail(), saved)
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useUpdateProgramAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => updateProgramAvailability(enabled),
    onSuccess: (saved) => {
      queryClient.setQueryData(programKeys.detail(), saved)
      showToast(saved.enabled ? 'Program enabled' : 'Program disabled')
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}
