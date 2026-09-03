import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import type { Client } from '@/features/clients'
import { CALORIE_BANDS, type CalorieBand } from '../dietPlan.types'
import {
  useClientDietPlanQuery,
  useSaveClientDietPlan,
  useUpdateClientBand,
} from '../useDietPlan'

const AUTOSAVE_MS = 900

/** One user's diet plan for a week — the master sheet for their calorie band,
 *  narrowed by their onboarding answers. Same shape as the global tab on
 *  purpose: a nutritionist moving between the two shouldn't have to relearn
 *  anything. What's added here is the band control and the filters that were
 *  applied, so the tailoring is visible rather than magic. */
export function ClientDietPlanTab({
  client,
  totalWeeks,
  activeWeek,
  setActiveWeek,
}: {
  client: Client
  totalWeeks: number
  activeWeek: number
  setActiveWeek: (n: number) => void
}) {
  const planQuery = useClientDietPlanQuery(client.id, activeWeek)
  const savePlan = useSaveClientDietPlan(client.id)
  const updateBand = useUpdateClientBand(client.id)

  const [draft, setDraft] = useState('')
  const [baseline, setBaseline] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const plan = planQuery.data
  const planBody = plan?.body
  useEffect(() => {
    if (planBody === undefined) return
    setDraft(planBody)
    setBaseline(null)
  }, [planBody, activeWeek])

  // Derived rather than flagged — see the note in DietPlanTab. Re-seeding the
  // editor (new week, or a band change that re-derives the plan) must never
  // read as a user edit, or it would autosave over the user's plan and mark it
  // hand-edited when nobody touched it.
  const needsSave = baseline !== null && draft !== baseline
  useEffect(() => {
    if (!needsSave) return
    const t = setTimeout(() => {
      savePlan.mutate(
        { weekNum: activeWeek, body: draft },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, needsSave, activeWeek])

  useEffect(() => () => clearTimeout(savedTimer.current), [])

  const profile = plan?.profile ?? client.dietProfile

  return (
    <>
      <div className="pw-week-rail">
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

      <section className="pw-section diet-sheet-panel">
        <div className="panel-head diet-sheet-head">
          <div>
            <h2>Week {activeWeek} diet plan</h2>
            <p className="panel-sub">
              Drawn from the {profile?.band ?? '—'} kcal master sheet and
              narrowed to {client.name.split(' ')[0]}. Edits here apply to this
              user only.
            </p>
          </div>

          <div className="diet-sheet-actions">
            <label className="diet-band-picker">
              <span className="diet-band-label">Daily target</span>
              <select
                className="select-range"
                aria-label="Calorie band"
                value={profile?.band ?? 1600}
                disabled={updateBand.isPending}
                onChange={(e) =>
                  updateBand.mutate(Number(e.target.value) as CalorieBand)
                }
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
          </div>
        </div>

        {profile ? (
          <div className="diet-filter-row">
            <span className="diet-filter-chip">
              <Icon name="user-round" />
              {profile.lifeStage === 'lactating'
                ? 'Lactating'
                : profile.lifeStage === 'male'
                  ? 'Male'
                  : 'Female'}
            </span>
            <span className="diet-filter-chip">
              <Icon name="salad" />
              {profile.preference}
            </span>
            {profile.conditions.map((c) => (
              <span key={c} className="diet-filter-chip is-medical">
                <Icon name="heart-pulse" />
                {c}
              </span>
            ))}
            {plan?.edited ? (
              <span className="diet-filter-chip is-edited">
                <Icon name="pencil" />
                Edited for this user
              </span>
            ) : null}
          </div>
        ) : null}

        {planQuery.isPending ? (
          <div className="diet-sheet-loading">
            <span className="skel skel-wide" />
            <span className="skel" />
            <span className="skel" />
          </div>
        ) : planQuery.isError ? (
          <div className="clients-empty is-error" role="alert">
            <Icon name="alert-triangle" />
            <p>{apiErrorMessage(planQuery.error)}</p>
            <button
              className="link-btn clients-empty-retry"
              onClick={() => planQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {!planBody?.trim() ? (
              <p className="diet-sheet-empty-note">
                <Icon name="info" />
                The {profile?.band} kcal master sheet has no plan for this week
                yet. Add one here for {client.name.split(' ')[0]}, or fill the
                week in Programs first.
              </p>
            ) : null}
            <LazyRichTextEditor
              ariaLabel={`Week ${activeWeek} diet plan for ${client.name}`}
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
    </>
  )
}
