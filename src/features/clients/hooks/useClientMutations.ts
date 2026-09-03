// Mutation hooks for the clients roster. Each invalidates the clients queries
// on success (so the list + summary refetch) and surfaces feedback via toast.
// Validation errors on extend are left for the form to map onto its field; the
// hook still reports other failures.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import {
  bulkCreateClients,
  createClient,
  extendClientExpiry,
  updateClientAccess,
} from '../api/clients.api'
import { clientKeys } from '../api/clients.keys'
import type {
  BulkCreateClientsBody,
  CreateClientBody,
} from '../api/clients.types'
import { formatFullDate } from '../utils'

/** "Add individually". Validation failures are left to the form (it maps
 *  `fields` onto its inputs and toasts anything else), matching how
 *  `useExtendClientExpiry` and the nutritionist form already split this. */
export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateClientBody) => createClient(body),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
      showToast(`${client.name} added`)
    },
  })
}

/** "Bulk upload". Used twice by the importer: once with `dryRun` to build the
 *  preview (no toast, no invalidation — nothing changed server-side), then
 *  again to commit. Only the committing call reports and refetches. */
export function useBulkCreateClients() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: BulkCreateClientsBody) => bulkCreateClients(body),
    onSuccess: (result, body) => {
      if (body.dryRun) return
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
      const n = result.created.length
      const skipped = result.skipped.length
      showToast(
        `${n} user${n === 1 ? '' : 's'} imported successfully` +
          (skipped ? ` — ${skipped} skipped` : ''),
      )
    },
    onError: (error, body) => {
      if (body.dryRun) return
      showToast(apiErrorMessage(error))
    },
  })
}

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
