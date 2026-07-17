import { create } from 'zustand'

type ShellState = {
  helpOpen: boolean
  broadcastOpen: boolean
  openHelp: () => void
  closeHelp: () => void
  openBroadcast: () => void
  closeBroadcast: () => void
}

export const useShellStore = create<ShellState>((set) => ({
  helpOpen: false,
  broadcastOpen: false,
  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
  openBroadcast: () => set({ broadcastOpen: true }),
  closeBroadcast: () => set({ broadcastOpen: false }),
}))
