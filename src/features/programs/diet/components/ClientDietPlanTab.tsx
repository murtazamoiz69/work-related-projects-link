import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import { useUnsavedEdits } from '@/store/useUnsavedEdits'
import { ReviewTag } from '../../components/ReviewTag'
import { isApiError } from '@/lib/api/types'
import type { Client } from '@/features/clients'
import {
  useClientDietPlanQuery,
  useSaveClientDietPlanToWeeks,
} from '../useDietPlan'
import { SaveToWeeksModal } from './SaveToWeeksModal'

/** One user's diet plan for a week — the master sheet for their category
 *  (calorie band), narrowed by their onboarding answers. Same shape as the
 *  global tab on purpose: a nutritionist moving between the two shouldn't have
 *  to relearn anything. The category is fixed per user (set at onboarding, not
 *  switchable here); what's added beyond the global tab is the filters that
 *  were applied. The review sign-off itself is handled from Chat now (a
 *  banner above the thread), not from this tab. */
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
  const saveToWeeks = useSaveClientDietPlanToWeeks(client.id)

  const [draft, setDraft] = useState('')
  const [saveOpen, setSaveOpen] = useState(false)
  const setDirty = useUnsavedEdits((s) => s.setDirty)

  const plan = planQuery.data
  const planBody = plan?.body
  useEffect(() => {
    if (planBody === undefined) return
    setDraft(planBody)
  }, [planBody, activeWeek])

  const profile = plan?.profile ?? client.dietProfile
  // Read off the plan, not the client: this workspace is opened with whatever
  // client object the surface that opened it happened to hold, and that one
  // doesn't refetch when the sign-off (or the band) changes.
  const currentBand = profile?.band ?? 1600
  const firstName = client.name.split(' ')[0]

  // Flag the draft while it differs from what was loaded, so closing the
  // workspace or logging out inside the autosave window asks first (OP-4).
  useEffect(() => {
    const isDirty = planBody !== undefined && draft !== planBody
    setDirty(
      'client-diet',
      isDirty ? `${firstName}'s Week ${activeWeek} diet plan` : null,
    )
    return () => setDirty('client-diet', null)
  }, [draft, planBody, activeWeek, firstName, setDirty])

  return (
    <>
      {/* The user's category is fixed — one band, set at onboarding, shown
          read-only. Unlike the global tab there is no category switcher here. */}
      <div className="diet-band-rail">
        <span className="diet-band-rail-label">Category</span>
        <span
          className="diet-band-fixed"
          title="Set from this user's onboarding"
        >
          {currentBand} <small>kcal</small>
        </span>
      </div>

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
            <h2>
              Week {activeWeek} diet plan
              <ReviewTag status={client.dietReview} />
            </h2>
            <p className="panel-sub">
              Drawn from the {profile?.band ?? '—'} kcal master sheet and
              narrowed to {firstName}. Edits here apply to this user only.
            </p>
          </div>
        </div>

        {/* The life stage, dietary preference and medical conditions used to
            repeat here as chips. They are already on the User Context rail to
            the left, so the row was the same facts twice. Only the
            edited-for-this-user state is genuinely about the sheet. */}
        {plan?.edited ? (
          <div className="diet-filter-row">
            <span className="diet-filter-chip is-edited">
              <Icon name="pencil" />
              Edited for this user
            </span>
          </div>
        ) : null}

        {planQuery.isPending ? (
          <div className="diet-sheet-loading">
            <span className="skel skel-wide" />
            <span className="skel" />
            <span className="skel" />
          </div>
        ) : planQuery.isError &&
          isApiError(planQuery.error) &&
          planQuery.error.kind === 'not-found' ? (
          <p className="diet-sheet-empty-note">
            <Icon name="info" />
            {firstName} doesn’t have a diet plan yet — it’s set once they finish
            onboarding and get a calorie band.
          </p>
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
                yet. Add one here for {firstName}, or fill the week in Programs
                first.
              </p>
            ) : null}
            <LazyRichTextEditor
              ariaLabel={`Week ${activeWeek} diet plan for ${client.name}`}
              value={draft}
              onChange={setDraft}
            />

            <div className="diet-save-bar">
              <p className="diet-save-hint">
                Editing{' '}
                <b>
                  {firstName}&apos;s Week {activeWeek}
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
              Save the week you just edited for <strong>{firstName}</strong>{' '}
              into the weeks you pick. Only this user is affected.
            </>
          }
          onClose={() => setSaveOpen(false)}
          onConfirm={(weeks) =>
            saveToWeeks.mutate(
              { body: draft, weeks },
              { onSuccess: () => setSaveOpen(false) },
            )
          }
        />
      ) : null}
    </>
  )
}
