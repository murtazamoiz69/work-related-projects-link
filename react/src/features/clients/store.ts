import { create } from 'zustand'
import { CLIENTS_DATA } from './data'
import type { Client } from './types'

// Same rev-bump pattern as features/programs/store.ts: `commit()` re-renders
// after an in-place mutation (toggling access, extending expiry), while
// `setClients()` swaps the array reference (add / remove).
type ClientsState = {
  clients: Client[]
  rev: number
  commit: () => void
  setClients: (next: Client[] | ((prev: Client[]) => Client[])) => void
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: CLIENTS_DATA,
  rev: 0,
  commit: () => set((s) => ({ rev: s.rev + 1 })),
  setClients: (next) =>
    set((s) => ({
      clients: typeof next === 'function' ? next(s.clients) : next,
      rev: s.rev + 1,
    })),
}))
