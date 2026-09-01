import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import {
  changePassword,
  getNotificationPrefs,
  getPracticeDetails,
  updateNotificationPrefs,
  updatePracticeDetails,
} from '../api/settings.api'
import { settingsKeys } from '../api/settings.keys'
import type { NotificationPrefs, PracticeDetails } from '../api/settings.types'

// ---- Notification preferences ----

export function useNotificationPrefsQuery() {
  return useQuery({
    queryKey: settingsKeys.notificationPrefs(),
    queryFn: ({ signal }) => getNotificationPrefs(signal),
  })
}

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient()
  const key = settingsKeys.notificationPrefs()
  return useMutation({
    mutationFn: (prefs: NotificationPrefs) => updateNotificationPrefs(prefs),
    // Optimistic: flip the toggle immediately, roll back on failure.
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<NotificationPrefs>(key)
      queryClient.setQueryData(key, next)
      return { prev }
    },
    onError: (error, _next, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
      showToast(apiErrorMessage(error))
    },
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
  })
}

// ---- Practice details ----

export function usePracticeQuery() {
  return useQuery({
    queryKey: settingsKeys.practice(),
    queryFn: ({ signal }) => getPracticeDetails(signal),
  })
}

export function useUpdatePractice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (practice: PracticeDetails) => updatePracticeDetails(practice),
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKeys.practice(), saved)
      showToast('Practice details updated')
    },
  })
}

// ---- Password ----

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
