import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import { CALORIE_BANDS, type CalorieBand } from '../dietPlan.types'
import {
  useDuplicateMasterSheet,
  useMasterSheetQuery,
  useSaveMasterSheet,
} from '../useDietPlan'
import { DuplicateSheetModal } from './DuplicateSheetModal'

const AUTOSAVE_MS = 900

/** The global diet plan. One master sheet per week per calorie band: pick the
 *  week on the rail, the band in the dropdown, and author the day — slot by
 *  slot, with portion-based choices — in the editor. */
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
  const [duplicateOpen, setDuplicateOpen] = useState(false)

  const sheetQuery = useMasterSheetQuery(activeWeek, band)
  const saveSheet = useSaveMasterSheet()
  const duplicate = useDuplicateMasterSheet()

  // The editor is the source of truth while typing; the query result seeds it
  // whenever the week or band changes.
  const [draft, setDraft] = useState('')
  // The editor's own serialisation of the loaded sheet — the only valid thing
  // to compare `draft` against (see RichTextEditor's onSeeded).
  const [baseline, setBaseline] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const sheetBody = sheetQuery.data?.body
  useEffect(() => {
    if (sheetBody === undefined) return
    setDraft(sheetBody)
    setBaseline(null) // unknown until the editor reports it back
  }, [sheetBody, activeWeek, band])

  // Autosave: the nutritionist edits prose, and a Save button on a document
  // this long is a trap — the rest of the Programs page already autosaves.
  //
  // "Needs saving" is derived, not tracked with a dirty flag: a flag gets
  // tripped by the editor's own programmatic content changes, and swapping week
  // or band re-seeds the document — which briefly looked like a user edit and
  // autosaved an empty sheet over the master plan. Both sides here come from
  // the editor, so a re-seed leaves them equal and nothing is saved.
  const needsSave = baseline !== null && draft !== baseline
  useEffect(() => {
    if (!needsSave) return
    const t = setTimeout(() => {
      saveSheet.mutate(
        { weekNum: activeWeek, band, body: draft },
        {
          onSuccess: () => {
            setSaved(true)
            clearTimeout(savedTimer.current)
            savedTimer.current = setTimeout(() => setSaved(false), 1600)
          },
        },
      )
    }, AUTOSAVE_MS)
    return () => clearTimeout(t)
    // saveSheet is a stable mutation object; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, needsSave, activeWeek, band])

  useEffect(() => () => clearTimeout(savedTimer.current), [])

  return (
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
              One sheet per calorie band, followed for the whole day — must
              haves plus portion-based choices for each slot.
            </p>
          </div>

          <div className="diet-sheet-actions">
            <label className="diet-band-picker">
              <span className="diet-band-label">Daily target</span>
              <select
                className="select-range"
                aria-label="Calorie band"
                value={band}
                onChange={(e) => setBand(Number(e.target.value) as CalorieBand)}
              >
                {CALORIE_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b} kcal
                  </option>
                ))}
              </select>
            </label>

            <span
              className={`settings-saved-indicator${saved ? ' show' : ''}`}
              aria-live="polite"
            >
              <Icon name="check" />
              Saved
            </span>

            <button
              className="btn-secondary diet-duplicate-btn"
              onClick={() => setDuplicateOpen(true)}
              disabled={sheetQuery.isPending || sheetQuery.isError}
            >
              <Icon name="copy" />
              Duplicate
            </button>
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
            {/* Only week 1 is seeded — the rest are authored or copied across
                with Duplicate, so an empty week says which. */}
            {!sheetBody?.trim() ? (
              <p className="diet-sheet-empty-note">
                <Icon name="info" />
                No plan for this week yet. Write it here, or open a week that
                has one and use <strong>Duplicate</strong> to copy it across.
              </p>
            ) : null}
            <LazyRichTextEditor
              ariaLabel={`Week ${activeWeek} diet plan, ${band} kcal`}
              value={draft}
              onChange={setDraft}
              // Adopt the editor's serialisation as BOTH the draft and the
              // baseline, so an untouched document compares exactly equal. Seeding
              // only the baseline would leave the draft holding the raw stored
              // string, which differs from the editor's rendering of it — and the
              // autosave would fire on open with nobody having typed anything.
              onSeeded={(html) => {
                setBaseline(html)
                setDraft(html)
              }}
            />
          </>
        )}
      </section>

      {duplicateOpen ? (
        <DuplicateSheetModal
          fromWeek={activeWeek}
          band={band}
          totalWeeks={totalWeeks}
          pending={duplicate.isPending}
          onClose={() => setDuplicateOpen(false)}
          onConfirm={(weeks) =>
            duplicate.mutate(
              { fromWeek: activeWeek, band, toWeeks: weeks },
              {
                onSuccess: () => setDuplicateOpen(false),
                onError: (error) => showToast(apiErrorMessage(error)),
              },
            )
          }
        />
      ) : null}
    </>
  )
}
