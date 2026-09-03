import { create } from 'zustand'
import { getAccessToken, setAccessToken } from '@/lib/api/auth'
import { DEFAULT_PROFILE, type Profile } from '@/features/shell/data'

const PROFILE_KEY = 'activeProfile'

function readProfile(): Profile {
  try {
    const stored = sessionStorage.getItem(PROFILE_KEY)
    if (stored) return JSON.parse(stored) as Profile
  } catch {
    /* sessionStorage unavailable — fall back to default */
  }
  return DEFAULT_PROFILE
}

function persistProfile(profile: Profile): void {
  try {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    /* ignore */
  }
}

type AuthState = {
  isAuthenticated: boolean
  activeProfile: Profile
  /** Sign in: persist the access token and the session profile. */
  login: (profile: Profile, token: string) => void
  logout: () => void
  /** Persist edits from Settings › Profile. */
  updateProfile: (profile: Profile) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // Authentication is now driven by the presence of an access token, set at
  // login and cleared on logout / a 401 (see lib/api/client.ts).
  isAuthenticated: getAccessToken() != null,
  activeProfile: readProfile(),
  login: (profile, token) => {
    setAccessToken(token)
    persistProfile(profile)
    set({ isAuthenticated: true, activeProfile: profile })
  },
  logout: () => {
    setAccessToken(null)
    set({ isAuthenticated: false })
  },
  updateProfile: (profile) => {
    persistProfile(profile)
    set({ activeProfile: profile })
  },
}))

/** Read auth state outside React (e.g. router beforeLoad guards). */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated
}
