// Mutation hooks for the clients roster. Each invalidates the clients queries
// on success (so the list + summary refetch) and surfaces feedback via toast.
// Validation errors on extend are left for the form to map onto its field; the
// hook still reports other failures.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import { extendClientExpiry, updateClientAccess } from '../api/clients.api'
import { clientKeys } from '../api/clients.keys'
import { formatFullDate } from '../utils'

export function useUpdateClientAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateClientAccess(id, { enabled }),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
      showToast(
        `${client.name} ${client.accessEnabled ? 'enabled' : 'disabled'}`,
      )
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useExtendClientExpiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, expiryDate }: { id: string; expiryDate: string }) =>
      extendClientExpiry(id, { expiryDate }),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
      showToast(
        `Program extended successfully — ${client.name}'s program now ends on ${formatFullDate(
          client.expiryDate,
        )}.`,
      )
    },
    // Errors are handled by the caller (the form maps validation onto its field
    // and toasts anything else).
  })
}
