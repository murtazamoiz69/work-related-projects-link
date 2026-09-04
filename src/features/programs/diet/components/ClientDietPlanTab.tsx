import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import { formatFullDate, type Client } from '@/features/clients'
import {
  useClientDietPlanQuery,
  useSaveClientDietPlanToWeeks,
  useUpdateClientReview,
} from '../useDietPlan'
import { SaveToWeeksModal } from './SaveToWeeksModal'

/** One user's diet plan for a week — the master sheet for their category
 *  (calorie band), narrowed by their onboarding answers. Same shape as the
 *  global tab on purpose: a nutritionist moving between the two shouldn't have
 *  to relearn anything. The category is fixed per user (set at onboarding, not
 *  switchable here); what's added is the filters that were applied and the
 *  review sign-off. */
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
  const updateReview = useUpdateClientReview(client.id)

  const [saveOpen, setSaveOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const plan = planQuery.data
  const planBody = plan?.body
  useEffect(() => {
    if (planBody === undefined) return
    setDraft(planBody)
  }, [planBody, activeWeek])

  const profile = plan?.profile ?? client.dietProfile
  // The user's category is fixed here — it's set at onboarding and not changed
  // from this screen.
  const currentBand = profile?.band ?? 1600
  // Read off the plan, not the client: this workspace is opened with whatever
  // client object the surface that opened it happened to hold, and that one
  // doesn't refetch when the sign-off changes.
  const reviewed = plan?.review === 'reviewed'
  const firstName = client.name.split(' ')[0]

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
            <h2>Week {activeWeek} diet plan</h2>
            <p className="panel-sub">
              Drawn from the {profile?.band ?? '—'} kcal master sheet and
              narrowed to {firstName}. Edits here apply to this user only.
            </p>
          </div>
        </div>

        <ReviewBar
          firstName={firstName}
          reviewed={reviewed}
          reviewedAt={plan?.reviewedAt ?? null}
          pending={updateReview.isPending}
          onToggle={() =>
            updateReview.mutate(reviewed ? 'in-review' : 'reviewed')
          }
        />

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
                yet. Add one here for {firstName}, or fill the week in Programs
                first.
              </p>
            ) : null}
            <LazyRichTextEditor
              ariaLabel={`Week ${activeWeek} diet plan for ${client.name}`}
              value={draft}
              onChange={setDraft}
              onSeeded={setDraft}
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
              Save the plan you just edited for <strong>{firstName}</strong>{' '}
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

/** The sign-off gate. A user's plan is filtered by the engine the moment they
 *  onboard, so "there is a plan" and "someone has read the plan" are different
 *  facts — this is the second one. Until it's ticked the plan sits in review
 *  and the Users roster says so, which is how a nutritionist finds the people
 *  still waiting on them. */
function ReviewBar({
  firstName,
  reviewed,
  reviewedAt,
  pending,
  onToggle,
}: {
  firstName: string
  reviewed: boolean
  reviewedAt: Date | null
  pending: boolean
  onToggle: () => void
}) {
  return (
    <div className={`diet-review-bar${reviewed ? ' is-reviewed' : ''}`}>
      <Icon name={reviewed ? 'check-circle-2' : 'clock'} />
      <div className="diet-review-copy">
        <strong>{reviewed ? 'Reviewed' : 'Review in progress'}</strong>
        <p>
          {reviewed
            ? `Signed off${reviewedAt ? ` on ${formatFullDate(reviewedAt)}` : ''} — ${firstName} can see this plan.`
            : `The engine filtered this plan from the master sheet. ${firstName} won't see it until you've read it through and marked it reviewed.`}
        </p>
      </div>
      <button
        className={reviewed ? 'btn-secondary' : 'btn-primary'}
        disabled={pending}
        onClick={onToggle}
      >
        {reviewed ? null : <Icon name="check" />}
        {reviewed ? 'Reopen review' : 'Reviewed'}
      </button>
    </div>
  )
}
