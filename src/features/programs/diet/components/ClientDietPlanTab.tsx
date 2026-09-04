import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import { formatFullDate, type Client } from '@/features/clients'
import { CALORIE_BANDS, type CalorieBand } from '../dietPlan.types'
import {
  useClientDietPlanQuery,
  useSaveClientDietPlanToWeeks,
  useUpdateClientBand,
  useUpdateClientReview,
} from '../useDietPlan'
import { SaveToWeeksModal } from './SaveToWeeksModal'

/** One user's diet plan for a week — the master sheet for their category
 *  (calorie band), narrowed by their onboarding answers. Same shape as the
 *  global tab on purpose: a nutritionist moving between the two shouldn't have
 *  to relearn anything. What's added here is the category control, the filters
 *  that were applied, and the review sign-off. */
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
  const updateBand = useUpdateClientBand(client.id)
  const updateReview = useUpdateClientReview(client.id)

  const [saveOpen, setSaveOpen] = useState(false)

  // The category is a staged edit, not a live one: moving a user between
  // categories swaps the master sheet under all six of their weeks and drops
  // anything hand-written for them, which is too much to happen on the way past
  // a tab. The pick is held until Save changes commits it.
  const [pendingBand, setPendingBand] = useState<CalorieBand | null>(null)

  const [draft, setDraft] = useState('')

  const plan = planQuery.data
  const planBody = plan?.body
  useEffect(() => {
    if (planBody === undefined) return
    setDraft(planBody)
  }, [planBody, activeWeek])

  const profile = plan?.profile ?? client.dietProfile
  const currentBand = profile?.band ?? 1600
  const selectedBand = pendingBand ?? currentBand
  const bandChanged = selectedBand !== currentBand
  // Read off the plan, not the client: this workspace is opened with whatever
  // client object the surface that opened it happened to hold, and that one
  // doesn't refetch when the sign-off changes.
  const reviewed = plan?.review === 'reviewed'
  const firstName = client.name.split(' ')[0]

  return (
    <>
      {/* Top tier: the user's category. Unlike the global tab, picking a
          different category here is a staged, destructive change — the tab reads
          as pending (dashed) and the committed one keeps a "current" marker until
          Save changes re-derives every week. */}
      <div className="diet-band-rail">
        <span className="diet-band-rail-label">Category</span>
        <div className="diet-band-tabs" role="tablist" aria-label="Category">
          {CALORIE_BANDS.map((b) => {
            const isSelected = b === selectedBand
            const isCurrent = b === currentBand
            return (
              <button
                key={b}
                role="tab"
                aria-selected={isSelected}
                disabled={updateBand.isPending}
                className={`diet-band-tab${isSelected ? ' active' : ''}${
                  isSelected && bandChanged ? ' pending' : ''
                }`}
                onClick={() => setPendingBand(b === currentBand ? null : b)}
              >
                {b} <small>kcal</small>
                {isCurrent && bandChanged ? (
                  <span className="band-current">current</span>
                ) : null}
              </button>
            )
          })}
        </div>
        {bandChanged ? (
          <button
            className="btn-primary diet-band-save"
            disabled={updateBand.isPending}
            onClick={() =>
              updateBand.mutate(selectedBand, {
                onSuccess: () => setPendingBand(null),
              })
            }
          >
            <Icon name="check" />
            {updateBand.isPending ? 'Saving…' : 'Save changes'}
          </button>
        ) : null}
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

        {bandChanged ? (
          <p className="diet-band-pending-note" role="status">
            <Icon name="alert-triangle" />
            Moving {firstName} to the {selectedBand} kcal category re-derives
            all {totalWeeks} weeks from that master sheet and drops anything
            edited for them here. Nothing changes until you save.
          </p>
        ) : null}

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
