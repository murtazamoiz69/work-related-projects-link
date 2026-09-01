import { create } from 'zustand'

type ShellState = {
  helpOpen: boolean
  openHelp: () => void
  closeHelp: () => void
}

export const useShellStore = create<ShellState>((set) => ({
  helpOpen: false,
  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
}))
