// Hydrate the app-shell profile (sidebar chip + avatar) from the server once the
// user is in the authed shell, so it reflects the real signed-in user rather
// than the login-response snapshot or a stale persisted profile. This reuses the
// Settings › Profile query, so the sidebar and Settings share one cache entry
// and never disagree. Mounted only inside AppLayout, which is authed-only.
import { useEffect } from 'react'
import { useStaffProfileQuery } from '@/features/settings'
import { useAuthStore } from '@/store/useAuthStore'

export function useSyncActiveProfile(): void {
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const { data } = useStaffProfileQuery()

  useEffect(() => {
    if (!data) return
    updateProfile({
      name: data.name,
      initials: data.initials,
      color: data.color,
      email: data.email,
      phone: data.phone ?? undefined,
      bio: data.bio ?? undefined,
      photo: data.profileImageUrl ?? undefined,
    })
  }, [data, updateProfile])
}
