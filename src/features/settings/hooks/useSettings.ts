// Query + mutation hooks for Settings › Profile.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import {
  getStaffProfile,
  updateStaffProfile,
  uploadProfileImage,
} from '../api/settings.api'
import type { StaffProfile } from '../api/settings.types'

export const settingsKeys = {
  profile: () => ['settings', 'profile'] as const,
}

export function useStaffProfileQuery() {
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn: ({ signal }) => getStaffProfile(signal),
    staleTime: 30_000,
  })
}

export function useUpdateStaffProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateStaffProfile,
    onSuccess: (profile: StaffProfile) => {
      queryClient.setQueryData(settingsKeys.profile(), profile)
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

/** Upload a chosen photo; the page holds the returned key until Save persists
 *  it with the rest of the profile. */
export function useUploadProfileImage() {
  return useMutation({ mutationFn: uploadProfileImage })
}
