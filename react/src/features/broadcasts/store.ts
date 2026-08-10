import { create } from 'zustand'
import { BROADCASTS, saveBroadcasts } from './data'
import type { Broadcast } from './types'

// Same shape as useTemplatesStore: `commit()` persists + bumps `rev` after an
// in-place mutation (publish now / cancel schedule), `setBroadcasts()` swaps
// the array reference for create / duplicate / delete.
type BroadcastsState = {
  broadcasts: Broadcast[]
  rev: number
  commit: () => void
  setBroadcasts: (
    next: Broadcast[] | ((prev: Broadcast[]) => Broadcast[]),
  ) => void
}

export const useBroadcastsStore = create<BroadcastsState>((set, get) => ({
  broadcasts: BROADCASTS,
  rev: 0,
  commit: () => {
    saveBroadcasts(get().broadcasts)
    set((s) => ({ rev: s.rev + 1 }))
  },
  setBroadcasts: (next) =>
    set((s) => {
      const broadcasts = typeof next === 'function' ? next(s.broadcasts) : next
      saveBroadcasts(broadcasts)
      return { broadcasts, rev: s.rev + 1 }
    }),
}))
