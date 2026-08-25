import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { PhotoLightbox } from '@/components/molecules/PhotoLightbox'
import { MEAL_SLOTS, WORKOUT_TEMPLATES } from '@/features/programs'
import { formatDateSep, formatTime, isToday } from '../data'
import type { ChatActivityItem, ChatActivityKind } from '../types'

type DayGroup = { key: string; label: string; items: ChatActivityItem[] }
type LightboxState = { photos: string[]; index: number }

// The kinds the filter bar shows a dedicated chip for, most-common-first, so
// a client who mostly just logs meals doesn't have to scan past other chips
// to find the one with the count on it. Check-ins still show up under "All"
// and in the table below — they just don't get their own chip, since they're
// rare enough not to earn one. The label and icon here are what the filter
// chip shows; individual entries keep their own more-specific icon
// regardless of which chip (or "All") they're grouped under.
export const ACTIVITY_KIND_DEFS: ReadonlyArray<{
  key: ChatActivityKind
  label: string
  icon: string
}> = [
  { key: 'meal', label: 'Meals', icon: 'utensils' },
  { key: 'workout', label: 'Workouts', icon: 'dumbbell' },
  { key: 'weight', label: 'Weigh-ins', icon: 'scale' },
  { key: 'photo', label: 'Photos', icon: 'image' },
]

/** The sub-categories worth a second row of chips once a kind is active —
 *  meals split by slot, workouts by muscle group. Pulled from the same
 *  source data the plan itself is built from (MEAL_SLOTS, WORKOUT_TEMPLATES)
 *  rather than a hand-kept list, so a new meal slot or workout template can
 *  never drift out of sync with the filter. Kinds not listed here (weigh-ins,
 *  photos) don't get a sub-row — there's nothing to split them by. */
export const ACTIVITY_SUBCATEGORIES: Partial<
  Record<ChatActivityKind, readonly string[]>
> = {
  meal: MEAL_SLOTS,
  workout: [...new Set(WORKOUT_TEMPLATES.map((t) => t.muscle))],
}

/** What actually gets rendered: never upcoming, optionally narrowed to one
 *  or more kinds (combinable — Meals and Workouts can both be active at
 *  once), each optionally narrowed further to its own sub-categories, one
 *  lookback window, and/or text-matched on title + detail. The single choke
 *  point for "what counts" so a filter bar's own counts can never drift from
 *  what the list underneath it ends up showing. */
export function filterActivityItems(
  items: ChatActivityItem[],
  {
    kinds,
    categoriesByKind,
    search,
    rangeDays,
  }: {
    /** Multi-select — an item passes if its kind is any one of these.
     *  Empty/undefined means no kind restriction ("All"). */
    kinds?: ChatActivityKind[]
    /** Per-kind sub-category multi-select, e.g. { meal: ['Breakfast'] }.
     *  Only checked for a kind that's also in `kinds`; a kind present here
     *  with an empty array is unrestricted within that kind. */
    categoriesByKind?: Partial<Record<ChatActivityKind, string[]>>
    search?: string
    rangeDays?: number
  } = {},
): ChatActivityItem[] {
  const q = search?.trim().toLowerCase()
  const since = rangeDays
    ? Date.now() - rangeDays * 24 * 60 * 60 * 1000
    : null
  return items.filter((it) => {
    if (it.upcoming) return false
    if (kinds?.length) {
      if (!kinds.includes(it.kind)) return false
      const cats = categoriesByKind?.[it.kind]
      if (cats?.length && (!it.category || !cats.includes(it.category)))
        return false
    }
    if (since != null && it.time.getTime() < since) return false
    if (q && !`${it.title} ${it.detail}`.toLowerCase().includes(q))
      return false
    return true
  })
}

// This is a log of what happened, not a look-ahead: upcoming/scheduled items
// (meals and workouts the plan has queued for the next few days, tagged
// `upcoming` in the data) are dropped before grouping via the same
// filterActivityItems() a filter bar's counts are built from, and the
// remaining, actually-logged days run most-recent-first. A caller that has
// already narrowed `items` to one kind/search term (filterActivityItems
// again) just gets that narrower set grouped the same way.
function groupByDay(items: ChatActivityItem[]): DayGroup[] {
  const completed = filterActivityItems(items)
  const sorted = [...completed].sort(
    (a, b) => b.time.getTime() - a.time.getTime(),
  )
  const groups: DayGroup[] = []
  sorted.forEach((item) => {
    const key = item.time.toDateString()
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, label: formatDateSep(item.time), items: [item] })
  })
  return groups
}

// The actual photo, not a stand-in for one. Every attached photo gets its
// own thumbnail (no "+N" truncation) so each is directly clickable, and each
// opens the full-size lightbox. Sized to be legible as an image rather than
// as an icon-sized chip.
function ActivityPhotos({
  photos,
  label,
  onOpen,
}: {
  photos: string[]
  // What the photos are of, so each thumbnail's accessible name distinguishes
  // it from the others instead of every button reading "View photo".
  label: string
  onOpen: (index: number) => void
}) {
  return (
    <div className="activity-log-photos">
      {photos.map((src, i) => (
        <button
          type="button"
          className="activity-log-photo-btn"
          key={i}
          onClick={() => onOpen(i)}
          aria-label={
            photos.length > 1
              ? `View photo ${i + 1} of ${photos.length}: ${label}`
              : `View photo: ${label}`
          }
        >
          {/* No loading="lazy": these are inline data URIs, so there is no
              network request to defer, and deferring them leaves the
              thumbnail boxes empty until the decode is forced. */}
          <img src={src} alt="" />
        </button>
      ))}
    </div>
  )
}

// The day-grouped activity table itself, shared by the Chat panel's "View
// all activity" modal and the Client 360 profile's Activity tab so both
// surfaces read the exact same log the exact same way: newest day first,
// nothing that hasn't happened yet. Scrolls to Today whenever `active` turns
// true — with newest-first order that's normally already the top of the
// list, so this mainly matters when nothing has been logged today yet.
export function ActivityLogList({
  items,
  active = true,
  emptyMessage = 'No activity logged yet',
}: {
  items: ChatActivityItem[]
  active?: boolean
  /** Shown in place of the table when there's nothing to group. A filter bar
   *  passes something more specific than the default ("No meals logged for
   *  Tom yet", "No results for 'x'") so an empty filtered view doesn't read
   *  the same as a client with no history at all. */
  emptyMessage?: ReactNode
}) {
  const groups = groupByDay(items)
  const todayRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  useEffect(() => {
    if (active) todayRef.current?.scrollIntoView({ block: 'start' })
  }, [active])

  // Drops the day header's shadow while it is resting in flow, so the shadow
  // only reads as depth once the header is pinned with rows moving under it.
  // The one-pixel negative top margin is what makes a pinned header report a
  // ratio below 1. Deliberately an IntersectionObserver rather than a scroll
  // listener, and deliberately subtractive: the shadow is the CSS default, so
  // a header still reads as a layer if this never runs.
  useEffect(() => {
    const scroller = rootRef.current?.closest('.activity-log-body')
    if (!scroller) return
    const heads = scroller.querySelectorAll('.activity-log-day-head')
    if (!heads.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle('is-at-rest', e.intersectionRatio >= 1)
        })
      },
      { root: scroller, rootMargin: '-1px 0px 0px 0px', threshold: [1] },
    )
    heads.forEach((h) => io.observe(h))
    return () => {
      io.disconnect()
      heads.forEach((h) => h.classList.remove('is-at-rest'))
    }
  }, [groups.length])

  if (!groups.length) {
    return (
      <div className="checklist-rest">
        <Icon name="activity" />
        <span>{emptyMessage}</span>
      </div>
    )
  }

  return (
    <>
      {groups.map((g, gi) => {
        const dayIsToday = isToday(g.items[0].time)
        return (
          <div
            className="activity-log-day"
            key={g.key}
            ref={(node) => {
              if (dayIsToday) todayRef.current = node
              // Any day element will do as the handle for finding the
              // scroll container; the first one is always present.
              if (gi === 0) rootRef.current = node
            }}
          >
            <div className="activity-log-day-head">
              <span className="activity-log-day-label">{g.label}</span>
              <span className="activity-log-day-count">
                {g.items.length} {g.items.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <table className="activity-log-table">
              <thead>
                <tr>
                  <th className="activity-log-col-time">Time</th>
                  <th className="activity-log-col-activity">Activity</th>
                  <th className="activity-log-col-detail">Details</th>
                  <th className="activity-log-col-photo">
                    Photo / Info &amp; Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((it, i) => (
                  <tr key={i}>
                    <td className="activity-log-time activity-log-col-time">
                      {formatTime(it.time)}
                    </td>
                    <td className="activity-log-col-activity">
                      <span className="activity-log-activity">
                        <span className="activity-log-icon">
                          <Icon name={it.icon} />
                        </span>
                        <span className="activity-log-title">{it.title}</span>
                      </span>
                    </td>
                    <td className="activity-log-detail activity-log-col-detail">
                      {it.detail || (
                        <span className="activity-log-dash">-</span>
                      )}
                    </td>
                    <td className="activity-log-col-photo">
                      {it.photos && it.photos.length ? (
                        <ActivityPhotos
                          photos={it.photos}
                          label={it.title}
                          onOpen={(index) =>
                            setLightbox({ photos: it.photos ?? [], index })
                          }
                        />
                      ) : it.delta ? (
                        <span
                          className={`activity-delta ${it.delta.direction}`}
                        >
                          {it.delta.text}
                        </span>
                      ) : it.kind === 'workout' ? (
                        <span className="activity-log-completed-tag">
                          <Icon name="check-circle-2" />
                          Completed
                        </span>
                      ) : (
                        <span className="activity-log-dash">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      {lightbox ? (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onNavigate={(index) =>
            setLightbox((cur) => (cur ? { ...cur, index } : cur))
          }
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </>
  )
}
