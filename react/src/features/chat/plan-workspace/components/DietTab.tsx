import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import { mealConflicts } from '../clinical'
import { formatTime12, pushVersion, resolveMeal, wsDailyTotals } from '../plan'
import { getDietDay } from '../context'
import type { PwCtx } from '../context'
import type { MealEntry } from '@/features/programs'
import type { WsDietDay } from '../types'

// Approximate menu width, used only to keep a menu opened off the last chip in
// the rail from hanging past the right edge of the viewport.
const LIB_MENU_WIDTH = 200

// "Import from Library" / "Save to Library", scoped to whichever week or day
// it's anchored inside, as a hover-opened dropdown: the wrapper (a week chip or
// a day label) is the trigger, and the menu drops beneath it. It used to be an
// inline CSS reveal that grew the two buttons in place, which reflowed the
// whole week rail every time the pointer crossed a chip.
//
// The menu is `position: fixed` off the trigger's box rather than absolute
// because .pw-week-rail scrolls horizontally (overflow-x:auto, which forces
// overflow-y:auto too) and would clip an absolutely-positioned popover. Fixed
// isn't clipped by ancestor overflow, and it stays in DOM order — unlike a
// portal — so Tab still reaches both buttons straight from the chip.
function LibraryHoverMenu({
  className,
  children,
  onImport,
  onSave,
  hasOwnAffordance,
}: {
  className: string
  children: ReactNode
  onImport: () => void
  onSave: () => void
  /** The week chip renders its own chevron inline, inside the pill, rather
   *  than take this component's default trailing one — so it doesn't end up
   *  with two. Day labels aren't a boxed tag, so they keep the default. */
  hasOwnAffordance?: boolean
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const closeTimer = useRef<number | null>(null)

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const open = (el: HTMLElement) => {
    cancelClose()
    const rect = el.getBoundingClientRect()
    setPos({
      top: rect.bottom + 6,
      left: Math.max(
        8,
        Math.min(rect.left, window.innerWidth - LIB_MENU_WIDTH - 12),
      ),
    })
  }
  // Grace period so the pointer can cross the gap from trigger to menu without
  // the menu vanishing mid-move. Tabbing from the chip into the menu relies on
  // the same delay: blur fires, then focus re-opens before the timer lands.
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setPos(null), 140)
  }

  useEffect(() => cancelClose, [])

  // Fixed coordinates go stale the moment anything scrolls under the menu, and
  // the week rail scrolls — so dismiss rather than chase the trigger.
  useEffect(() => {
    if (!pos) return
    const dismiss = () => setPos(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPos(null)
    }
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('keydown', onKey)
    }
  }, [pos])

  const act = (run: () => void) => (e: ReactMouseEvent) => {
    e.stopPropagation()
    cancelClose()
    setPos(null)
    run()
  }

  return (
    // Hover/focus-triggered library menu. The pointer handlers are mirrored by
    // onFocus/onBlur, so keyboard users get the same menu; the trigger wraps
    // arbitrary children (some interactive), so it stays a span rather than a
    // nested button.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      className={`pw-lib-trigger${pos ? ' open' : ''}${className ? ` ${className}` : ''}`}
      onMouseEnter={(e) => open(e.currentTarget)}
      onMouseLeave={scheduleClose}
      onFocus={(e) => open(e.currentTarget)}
      onBlur={scheduleClose}
    >
      {children}
      {/* The only visual difference between a trigger that opens this menu and
          one that's just inert (Workout Plan's week chips) used to be whether
          you happened to hover it. This chevron makes "has options" something
          you can see, not something you have to discover — dim at rest, full
          opacity on hover/focus, and pinned on (.open) while its menu is
          actually showing. Skipped when the trigger already drew its own. */}
      {hasOwnAffordance ? null : (
        <Icon
          name="chevron-down"
          size={14}
          className="pw-lib-trigger-affordance"
        />
      )}
      {pos ? (
        <span
          className="pw-lib-menu"
          role="menu"
          tabIndex={-1}
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <button
            type="button"
            role="menuitem"
            className="pw-lib-menu-btn"
            onClick={act(onImport)}
          >
            <Icon name="download" size={13} />
            Import from Library
          </button>
          <button
            type="button"
            role="menuitem"
            className="pw-lib-menu-btn"
            onClick={act(onSave)}
          >
            <Icon name="save" size={13} />
            Save to Library
          </button>
        </span>
      ) : null}
    </span>
  )
}

function MealCard({
  ctx,
  weekNum,
  day,
  entry,
}: {
  ctx: PwCtx
  weekNum: number
  day: WsDietDay
  entry: MealEntry
}) {
  const meal = resolveMeal(ctx.ws, entry.mealId)
  if (!meal) return null
  const conflicts = mealConflicts(meal, ctx.profile)
  const risky = conflicts.some((c) => c.level === 'hard')

  // Removing a meal takes food off a plan the user is eating from, so it asks
  // first. Adding and swapping stay immediate.
  const clear = () => {
    ctx.confirm({
      title: 'Remove this meal?',
      message: `"${meal.name}" will be taken off ${entry.slot} on ${day.label}, Week ${weekNum}.`,
      confirmText: 'Remove meal',
      danger: true,
      onConfirm: applyClear,
    })
  }

  const applyClear = () => {
    const dietDay = getDietDay(ctx.ws, weekNum, day.dayNum)
    if (!dietDay) return
    dietDay.meals = dietDay.meals.filter((e) => e.uid !== entry.uid)
    pushVersion(
      ctx.ws,
      `Removed ${entry.slot}`,
      'Sarah Nolan',
      `Wk${weekNum} ${day.label}: ${meal.name} removed`,
    )
    ctx.refresh()
    showToast('Meal removed')
  }

  const openSwap = () =>
    ctx.openModal({
      kind: 'mealPicker',
      weekNum,
      dayNum: day.dayNum,
      entryUid: entry.uid,
      enforceUpcoming: false,
    })

  return (
    <div
      className={`meal-card${risky ? ' risk' : ''}`}
      title="View & swap"
      role="button"
      tabIndex={0}
      onClick={openSwap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openSwap()
        }
      }}
    >
      <span className="meal-card-slot">
        <span>
          {entry.slot}
          {conflicts.length ? (
            <span
              className="meal-card-flag"
              title={`${conflicts.map((c) => c.reason).join('; ')} — info only, not restricted`}
            >
              <Icon name="alert-triangle" size={11} />
            </span>
          ) : null}
        </span>
        <span className="meal-card-time">{formatTime12(entry.time)}</span>
      </span>
      <span className="meal-card-thumb">
        <Icon name="utensils" />
      </span>
      <span className="meal-card-name">{meal.name}</span>
      <span className="meal-card-macros">
        {meal.calories} kcal · P{meal.protein} C{meal.carbs} F{meal.fat}
      </span>
      <div className="meal-card-actions">
        <button
          className="icon-btn sm danger"
          title="Remove meal"
          onClick={(e) => {
            e.stopPropagation()
            clear()
          }}
        >
          <Icon name="trash-2" />
        </button>
      </div>
    </div>
  )
}

function DayRow({
  ctx,
  weekNum,
  day,
}: {
  ctx: PwCtx
  weekNum: number
  day: WsDietDay
}) {
  const totals = wsDailyTotals(ctx.ws, day)
  const sorted = day.meals.slice().sort((a, b) => a.time.localeCompare(b.time))
  return (
    <div className="diet-day-card">
      <div className="diet-day-head">
        <LibraryHoverMenu
          className="diet-day-label"
          onImport={() =>
            ctx.openModal({
              kind: 'libraryImportDay',
              weekNum,
              dayNum: day.dayNum,
            })
          }
          onSave={() =>
            ctx.openModal({
              kind: 'librarySaveDay',
              weekNum,
              dayNum: day.dayNum,
            })
          }
        >
          {day.label}
          {day.cheat ? <span className="pw-cheat-tag">Refeed</span> : null}
        </LibraryHoverMenu>
        <div className="diet-day-head-right">
          <span className="diet-day-totals">
            {totals.calories} kcal · P{totals.protein}g · C{totals.carbs}g · F
            {totals.fat}g
          </span>
          <button
            className="link-btn"
            onClick={() =>
              ctx.openModal({
                kind: 'mealPicker',
                weekNum,
                dayNum: day.dayNum,
                entryUid: null,
                enforceUpcoming: false,
              })
            }
          >
            <Icon name="plus" />
            Add meal
          </button>
        </div>
      </div>
      <div className="diet-meal-row pw-diet-meal-row">
        {sorted.length ? (
          sorted.map((e) => (
            <MealCard
              key={e.uid}
              ctx={ctx}
              weekNum={weekNum}
              day={day}
              entry={e}
            />
          ))
        ) : (
          <p className="pw-muted">No meals yet — add one.</p>
        )}
      </div>
    </div>
  )
}

export function DietTab({ ctx }: { ctx: PwCtx }) {
  const week = ctx.ws.dietWeeks.find((w) => w.weekNum === ctx.activeWeek)
  const railRef = useRef<HTMLDivElement>(null)

  // Same as Workout Plan's rail: land on this tab with the ongoing week
  // already scrolled into view instead of buried in a 13+ week strip.
  useEffect(() => {
    railRef.current
      ?.querySelector('.pw-week-chip.current')
      ?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  return (
    <>
      <div className="pw-week-rail" ref={railRef}>
        {ctx.ws.dietWeeks.map((w) => (
          <LibraryHoverMenu
            key={w.weekNum}
            className="pw-week-chip-wrap"
            hasOwnAffordance
            onImport={() =>
              ctx.openModal({ kind: 'libraryImportWeek', weekNum: w.weekNum })
            }
            onSave={() =>
              ctx.openModal({ kind: 'librarySaveWeek', weekNum: w.weekNum })
            }
          >
            <button
              className={`pw-week-chip${w.weekNum === ctx.activeWeek ? ' active' : ''}${w.weekNum === ctx.currentWeek ? ' current' : ''}`}
              onClick={() => ctx.setActiveWeek(w.weekNum)}
            >
              Week {w.weekNum}
              {/* Drawn here, inside the pill, rather than left to hang beside
                  it — the chevron is part of the tag's own content now, not a
                  detached mark floating next to it. */}
              <Icon
                name="chevron-down"
                size={14}
                className="pw-lib-trigger-affordance"
              />
            </button>
          </LibraryHoverMenu>
        ))}
      </div>
      <div className="pw-week-detail">
        <div className="pw-week-detail-head">
          <span className="pw-week-detail-title">
            Week {ctx.activeWeek}
            {ctx.activeWeek === ctx.currentWeek ? (
              <span className="pw-current-tag">Current</span>
            ) : null}
          </span>
        </div>
        <div className="pw-day-list">
          {week
            ? week.days.map((d) => (
                <DayRow
                  key={d.dayNum}
                  ctx={ctx}
                  weekNum={ctx.activeWeek}
                  day={d}
                />
              ))
            : null}
        </div>
      </div>
    </>
  )
}
