import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import { CALORIE_BANDS, type CalorieBand } from '../dietPlan.types'
import { useMasterSheetQuery, useSaveMasterSheetToWeeks } from '../useDietPlan'
import { CopyToWeeksDropdown } from './CopyToWeeksDropdown'

/** The global diet plan. Pick the category first — nothing else shows until
 *  one is chosen, since every sheet belongs to exactly one band. Then pick the
 *  week to load (to see what's already there) and author the day slot by
 *  slot in a full-width editor. "Copy to weeks" (top right) is where you pick
 *  which weeks Save Changes writes to — collapsed by default so the editor
 *  keeps the room. */
export function DietPlanTab({
  totalWeeks,
  activeWeek,
  setActiveWeek,
}: {
  totalWeeks: number
  activeWeek: number
  setActiveWeek: (n: number) => void
}) {
  const [band, setBand] = useState<CalorieBand | null>(null)

  const sheetQuery = useMasterSheetQuery(activeWeek, band)
  const saveToWeeks = useSaveMasterSheetToWeeks()

  // The editor is the source of truth while typing; the query result seeds it
  // whenever the week or band changes.
  const [draft, setDraft] = useState('')
  const sheetBody = sheetQuery.data?.body
  useEffect(() => {
    if (sheetBody === undefined) return
    setDraft(sheetBody)
  }, [sheetBody, activeWeek, band])

  // The weeks Save will write to. Defaults back to "just the week you're
  // looking at" whenever the band or that week changes, same default the old
  // Save dialog used.
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([activeWeek])
  useEffect(() => {
    setSelectedWeeks([activeWeek])
  }, [activeWeek, band])
  const toggleWeek = (week: number) =>
    setSelectedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week],
    )

  return (
    <>
      {/* First tier: the category. Nothing below appears until one is picked
          — every sheet, and every week checkbox beside it, belongs to a band. */}
      <div className="diet-band-rail">
        <label className="wp-type-picker">
          <span className="diet-band-rail-label">Category</span>
          <select
            className="select-range"
            aria-label="Category"
            value={band ?? ''}
            onChange={(e) =>
              setBand(
                e.target.value ? (Number(e.target.value) as CalorieBand) : null,
              )
            }
          >
            <option value="">Select a category…</option>
            {CALORIE_BANDS.map((b) => (
              <option key={b} value={b}>
                {b} kcal
              </option>
            ))}
          </select>
        </label>
      </div>

      {band === null ? (
        <div className="clients-empty">
          <Icon name="info" />
          <p>Pick a category above to open its plan.</p>
        </div>
      ) : (
        <>
          <div className="prog-week-rail">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
              <button
                key={w}
                className={`pw-week-chip${w === activeWeek ? ' active' : ''}`}
                onClick={() => setActiveWeek(w)}
              >
                Week {w}
              </button>
            ))}
          </div>

          <section className="panel diet-sheet-panel">
            <div className="panel-head diet-sheet-head">
              <div>
                <h2>Week {activeWeek} diet plan</h2>
                <p className="panel-sub">
                  One sheet per category, followed for the whole day — must
                  haves plus portion-based choices for each slot.
                </p>
              </div>
              <CopyToWeeksDropdown
                totalWeeks={totalWeeks}
                currentWeek={activeWeek}
                selected={selectedWeeks}
                onToggle={toggleWeek}
                onSelect={setSelectedWeeks}
              />
            </div>

            {sheetQuery.isPending ? (
              <div className="diet-sheet-loading">
                <span className="skel skel-wide" />
                <span className="skel" />
                <span className="skel" />
                <span className="skel skel-narrow" />
              </div>
            ) : sheetQuery.isError ? (
              <div className="clients-empty is-error" role="alert">
                <Icon name="alert-triangle" />
                <p>{apiErrorMessage(sheetQuery.error)}</p>
                <button
                  className="link-btn clients-empty-retry"
                  onClick={() => sheetQuery.refetch()}
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {!sheetBody?.trim() ? (
                  <p className="diet-sheet-empty-note">
                    <Icon name="info" />
                    No plan for this week yet. Write it here, then pick which
                    weeks to copy it to before saving.
                  </p>
                ) : null}

                <LazyRichTextEditor
                  ariaLabel={`Week ${activeWeek} diet plan, ${band} kcal`}
                  value={draft}
                  onChange={setDraft}
                  onSeeded={setDraft}
                />

                <div className="diet-save-bar">
                  <p className="diet-save-hint">
                    Editing{' '}
                    <b>
                      Week {activeWeek} · {band} kcal
                    </b>{' '}
                    — Save writes it to the weeks picked in Copy to weeks.
                  </p>
                  <button
                    className="btn-primary"
                    disabled={!selectedWeeks.length || saveToWeeks.isPending}
                    onClick={() =>
                      saveToWeeks.mutate({
                        band,
                        body: draft,
                        weeks: selectedWeeks,
                      })
                    }
                  >
                    <Icon name="check" />
                    {saveToWeeks.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </>
  )
}
