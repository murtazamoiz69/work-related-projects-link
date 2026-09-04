import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import { CALORIE_BANDS, type CalorieBand } from '../dietPlan.types'
import { useMasterSheetQuery, useSaveMasterSheetToWeeks } from '../useDietPlan'
import { SaveToWeeksModal } from './SaveToWeeksModal'

/** The global diet plan. One master sheet per week per category (calorie band):
 *  pick the category on top, then the week, then author the day — slot by slot,
 *  with portion-based choices — in the editor. Save writes the sheet to the
 *  weeks the nutritionist picks (this week, all, or any set). */
export function DietPlanTab({
  totalWeeks,
  activeWeek,
  setActiveWeek,
}: {
  totalWeeks: number
  activeWeek: number
  setActiveWeek: (n: number) => void
}) {
  const [band, setBand] = useState<CalorieBand>(1600)
  const [saveOpen, setSaveOpen] = useState(false)

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

  return (
    <>
      {/* Top tier: the category. Pick the category, then the week, then author
          the sheet — the category drives which master sheet the weeks belong to. */}
      <div className="diet-band-rail">
        <span className="diet-band-rail-label">Category</span>
        <div className="diet-band-tabs" role="tablist" aria-label="Category">
          {CALORIE_BANDS.map((b) => (
            <button
              key={b}
              role="tab"
              aria-selected={b === band}
              className={`diet-band-tab${b === band ? ' active' : ''}`}
              onClick={() => setBand(b)}
            >
              {b} <small>kcal</small>
            </button>
          ))}
        </div>
      </div>

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
              One sheet per category, followed for the whole day — must haves
              plus portion-based choices for each slot.
            </p>
          </div>
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
            {/* Only week 1 is seeded — the rest are authored or saved across, so
                an empty week says which. */}
            {!sheetBody?.trim() ? (
              <p className="diet-sheet-empty-note">
                <Icon name="info" />
                No plan for this week yet. Write it here, then{' '}
                <strong>Save</strong> it across the weeks it applies to.
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
                — Save writes it to the weeks you pick.
              </p>
              <button
                className="btn-primary"
                onClick={() => setSaveOpen(true)}
                disabled={saveToWeeks.isPending}
              >
                <Icon name="check" />
                Save
              </button>
            </div>
          </>
        )}
      </section>

      {saveOpen ? (
        <SaveToWeeksModal
          currentWeek={activeWeek}
          totalWeeks={totalWeeks}
          pending={saveToWeeks.isPending}
          intro={
            <>
              Save the <strong>{band} kcal</strong> plan you just edited into
              the weeks you pick. Anything already in those weeks is replaced.
            </>
          }
          onClose={() => setSaveOpen(false)}
          onConfirm={(weeks) =>
            saveToWeeks.mutate(
              { band, body: draft, weeks },
              { onSuccess: () => setSaveOpen(false) },
            )
          }
        />
      ) : null}
    </>
  )
}
