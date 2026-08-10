import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { Icon } from '@/components/atoms/Icon'
import {
  ACTIVITY_KIND_DEFS,
  ACTIVITY_SUBCATEGORIES,
  filterActivityItems,
} from './ActivityLogList'
import type { ChatActivityItem, ChatActivityKind } from '../types'

/** A kind chip that carries its own sub-category dropdown — same idea as
 *  the Diet Plan's week chip, which draws its own "has more options"
 *  chevron inside the pill rather than a detached mark beside it. Clicking
 *  the chip body toggles the kind on/off (combinable with any other kind);
 *  clicking the chevron opens a multi-select menu of that kind's own
 *  sub-categories, styled as `.prog-meta-chip.tpl-cat-chip` pills — the
 *  same tag Workout Plan's own template picker uses — with a Reset link so
 *  clearing a kind's sub-selection doesn't mean un-toggling every tag. */
function KindChipWithMenu({
  label,
  count,
  active,
  onToggle,
  options,
  selected,
  onToggleOption,
  onReset,
}: {
  label: string
  count: number
  active: boolean
  onToggle: () => void
  options: readonly string[]
  selected: string[]
  onToggleOption: (option: string) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  return (
    <div className="chip-filter-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`chip-filter${active ? ' active' : ''}`}
        onClick={onToggle}
      >
        {label}
        <span className="chip-count">{count}</span>
        <Icon
          name="chevron-down"
          size={13}
          className="chip-filter-chevron"
          onClick={(e: ReactMouseEvent) => {
            e.stopPropagation()
            setOpen((o) => !o)
          }}
        />
      </button>
      {open ? (
        <div className="activity-subfilter-menu">
          <div className="activity-subfilter-menu-head">
            <span>{label} type</span>
            {selected.length ? (
              <button type="button" className="link-btn" onClick={onReset}>
                Reset
              </button>
            ) : null}
          </div>
          <div className="tpl-picker-chips">
            {options.map((opt) => (
              <button
                type="button"
                key={opt}
                className={`prog-meta-chip tpl-cat-chip${selected.includes(opt) ? ' is-active' : ''}`}
                onClick={() => onToggleOption(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** The kind chips plus the date-range select, in one row — search stays up
 *  in the panel head beside the title (same placement as the Dashboard's
 *  Catch Up panel), but the range picker sits here, right-aligned against
 *  the chips it filters. Every chip looks and behaves the same way (toggle
 *  on/off, combinable with its neighbours); the two that have
 *  sub-categories (Meals, Workouts) just also carry their own dropdown,
 *  rather than one detached trigger living apart from the row it filters. */
export function ActivityFilterBar({
  items,
  activeKinds,
  isKindActive,
  onToggleKind,
  onClearAll,
  categoriesByKind,
  onToggleCategory,
  onClearCategories,
  search,
  rangeDays,
  onRangeChange,
}: {
  /** Full, unfiltered activity (upcoming items are fine here — counts exclude
   *  them internally via filterActivityItems). */
  items: ChatActivityItem[]
  activeKinds: ChatActivityKind[]
  isKindActive: (kind: ChatActivityKind) => boolean
  onToggleKind: (kind: ChatActivityKind) => void
  onClearAll: () => void
  categoriesByKind: Partial<Record<ChatActivityKind, string[]>>
  onToggleCategory: (kind: ChatActivityKind, category: string) => void
  onClearCategories: (kind: ChatActivityKind) => void
  /** Read-only here: search narrows every chip's count too, not just the one
   *  currently selected, so typing "chicken" immediately shows 6 Meals and 0
   *  of everything else before a single chip is clicked. The input itself is
   *  owned by the panel head. */
  search: string
  rangeDays: number
  onRangeChange: (days: number) => void
}) {
  const countFor = (kind?: ChatActivityKind) =>
    filterActivityItems(items, {
      kinds: kind ? [kind] : undefined,
      search,
      rangeDays,
    }).length

  return (
    <div className="activity-filter-bar">
      <div className="activity-filter-chips">
        <button
          type="button"
          className={`chip-filter${activeKinds.length === 0 ? ' active' : ''}`}
          onClick={onClearAll}
        >
          All
          <span className="chip-count">{countFor()}</span>
        </button>
        {ACTIVITY_KIND_DEFS.map((def) => {
          const subcategories = ACTIVITY_SUBCATEGORIES[def.key]
          if (subcategories?.length) {
            return (
              <KindChipWithMenu
                key={def.key}
                label={def.label}
                count={countFor(def.key)}
                active={isKindActive(def.key)}
                onToggle={() => onToggleKind(def.key)}
                options={subcategories}
                selected={categoriesByKind[def.key] ?? []}
                onToggleOption={(opt) => onToggleCategory(def.key, opt)}
                onReset={() => onClearCategories(def.key)}
              />
            )
          }
          return (
            <button
              type="button"
              key={def.key}
              className={`chip-filter${isKindActive(def.key) ? ' active' : ''}`}
              onClick={() => onToggleKind(def.key)}
            >
              {def.label}
              <span className="chip-count">{countFor(def.key)}</span>
            </button>
          )
        })}
      </div>
      <select
        className="select-range"
        value={rangeDays}
        onChange={(e) => onRangeChange(Number(e.target.value))}
        aria-label="Date range"
      >
        <option value={7}>Last 7 days</option>
        <option value={30}>Last 30 days</option>
        <option value={90}>Last 90 days</option>
      </select>
    </div>
  )
}
