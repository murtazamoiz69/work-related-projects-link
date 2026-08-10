import { useState } from 'react'
import {
  ACTIVITY_KIND_DEFS,
  filterActivityItems,
} from '../components/ActivityLogList'
import type { ChatActivityItem, ChatActivityKind } from '../types'

/** Owns the Activity log's filter state — kind, per-kind sub-category, free
 *  text, and date range — for both places it's used (the Plan Workspace's
 *  Activity tab and the chat's "View all activity" modal), so the two stay
 *  behaviourally identical without copy-pasted state logic.
 *
 *  Kinds are multi-select and combinable (Meals and Workouts can both be
 *  active at once, so "Breakfast meals and Push workouts together" is one
 *  filter, not two separate views) — picking a sub-category for a kind
 *  counts as that kind being active even before its own chip is toggled. */
export function useActivityFilters(
  items: ChatActivityItem[],
  subjectName: string,
) {
  const [toggledKinds, setToggledKinds] = useState<ChatActivityKind[]>([])
  const [categoriesByKind, setCategoriesByKind] = useState<
    Partial<Record<ChatActivityKind, string[]>>
  >({})
  const [search, setSearch] = useState('')
  // Same 7/30/90-day windows as the Dashboard's User Progress analytics, so
  // the date filter reads as the same control everywhere it shows up.
  const [rangeDays, setRangeDays] = useState(30)

  const isKindActive = (kind: ChatActivityKind) =>
    toggledKinds.includes(kind) || (categoriesByKind[kind]?.length ?? 0) > 0

  const toggleKind = (kind: ChatActivityKind) => {
    if (isKindActive(kind)) {
      setToggledKinds((prev) => prev.filter((k) => k !== kind))
      setCategoriesByKind((prev) => ({ ...prev, [kind]: [] }))
    } else {
      setToggledKinds((prev) => [...prev, kind])
    }
  }

  const toggleCategory = (kind: ChatActivityKind, category: string) => {
    setCategoriesByKind((prev) => {
      const current = prev[kind] ?? []
      return {
        ...prev,
        [kind]: current.includes(category)
          ? current.filter((c) => c !== category)
          : [...current, category],
      }
    })
  }

  const clearCategories = (kind: ChatActivityKind) => {
    setCategoriesByKind((prev) => ({ ...prev, [kind]: [] }))
  }

  const clearAll = () => {
    setToggledKinds([])
    setCategoriesByKind({})
  }

  const activeKinds = ACTIVITY_KIND_DEFS.map((d) => d.key).filter(
    isKindActive,
  )

  const total = filterActivityItems(items, { rangeDays }).length
  const filterActive = activeKinds.length > 0 || search.trim() !== ''
  const filtered = filterActivityItems(items, {
    kinds: activeKinds,
    categoriesByKind,
    search,
    rangeDays,
  })
  const activeKindLabels = activeKinds
    .map((k) => ACTIVITY_KIND_DEFS.find((d) => d.key === k)?.label)
    .filter((label): label is string => !!label)
    .join(' + ')
    .toLowerCase()
  const emptyMessage = !total
    ? `No activity in the last ${rangeDays} days`
    : search.trim()
      ? `No results for "${search.trim()}"`
      : activeKinds.length
        ? `No ${activeKindLabels} logged for ${subjectName} in the last ${rangeDays} days`
        : `No activity logged for ${subjectName} in the last ${rangeDays} days`

  return {
    activeKinds,
    isKindActive,
    toggleKind,
    categoriesByKind,
    toggleCategory,
    clearCategories,
    clearAll,
    search,
    setSearch,
    rangeDays,
    setRangeDays,
    total,
    filtered,
    filterActive,
    emptyMessage,
  }
}
