// Tracks whether anything on screen has edits that have not been saved.
//
// Plan content autosaves on a debounce (BR-15), which leaves a real window
// where a keystroke is on screen but not yet persisted — and closing the
// workspace or logging out inside that window silently discards it. Editors
// register here while their draft differs from what was loaded, and the exit
// paths (workspace close, log out, tab close) ask before throwing it away.
//
// Keyed rather than a single boolean so two editors can be open at once and one
// clearing itself does not un-flag the other.
import { create } from 'zustand'

type UnsavedEditsState = {
  dirty: Record<string, string>
  /** Register (or clear) an editor's unsaved state. `label` names it in the
   *  warning; passing `null` clears the key. */
  setDirty: (key: string, label: string | null) => void
  hasUnsaved: () => boolean
  /** What is unsaved, for the confirmation copy. */
  labels: () => string[]
}

export const useUnsavedEdits = create<UnsavedEditsState>((set, get) => ({
  dirty: {},
  setDirty: (key, label) =>
    set((s) => {
      const next = { ...s.dirty }
      if (label === null) {
        if (!(key in next)) return s
        delete next[key]
      } else {
        if (next[key] === label) return s
        next[key] = label
      }
      return { dirty: next }
    }),
  hasUnsaved: () => Object.keys(get().dirty).length > 0,
  labels: () => Object.values(get().dirty),
}))

/** Read outside React — the log-out handlers and the beforeunload listener are
 *  not components. */
export function hasUnsavedEdits(): boolean {
  return useUnsavedEdits.getState().hasUnsaved()
}

export function unsavedEditLabels(): string[] {
  return useUnsavedEdits.getState().labels()
}

export function clearUnsavedEdits(): void {
  useUnsavedEdits.setState({ dirty: {} })
}
