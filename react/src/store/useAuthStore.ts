import { create } from 'zustand'
import { SWITCH_PROFILES, type Profile } from '@/features/shell/data'

const AUTH_KEY = 'isAuthenticated'
const PROFILE_KEY = 'activeProfile'

function readAuth(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === 'true'
  } catch {
    return false
  }
}

function readProfile(): Profile {
  try {
    const stored = sessionStorage.getItem(PROFILE_KEY)
    if (stored) return JSON.parse(stored) as Profile
  } catch {
    /* sessionStorage unavailable — fall back to default */
  }
  return SWITCH_PROFILES[0]
}

type AuthState = {
  isAuthenticated: boolean
  activeProfile: Profile
  login: () => void
  logout: () => void
  switchProfile: (profile: Profile) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: readAuth(),
  activeProfile: readProfile(),
  login: () => {
    try {
      sessionStorage.setItem(AUTH_KEY, 'true')
    } catch {
      /* ignore */
    }
    set({ isAuthenticated: true })
  },
  logout: () => {
    try {
      sessionStorage.removeItem(AUTH_KEY)
    } catch {
      /* ignore */
    }
    set({ isAuthenticated: false })
  },
  switchProfile: (profile) => {
    try {
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch {
      /* ignore */
    }
    set({ activeProfile: profile })
  },
}))

/** Read auth state outside React (e.g. router beforeLoad guards). */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated
}
