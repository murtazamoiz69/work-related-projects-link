import { create } from 'zustand'

const SIDEBAR_KEY = 'sidebarCollapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  } catch {
    return false
  }
}

type UiState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: readCollapsed(),
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed
    try {
      localStorage.setItem(SIDEBAR_KEY, String(next))
    } catch {
      /* ignore */
    }
    set({ sidebarCollapsed: next })
  },
}))
