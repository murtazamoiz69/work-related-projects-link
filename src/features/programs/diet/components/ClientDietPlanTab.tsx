import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { LazyRichTextEditor } from '@/components/molecules/LazyRichTextEditor'
import { apiErrorMessage } from '@/lib/api/errors'
import type { Client } from '@/features/clients'
import {
  useClientDietPlanQuery,
  useSaveClientDietPlanToWeeks,
} from '../useDietPlan'
import { CopyToWeeksDropdown } from './CopyToWeeksDropdown'

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

  const plan = planQuery.data
  const planBody = plan?.body
  useEffect(() => {
    if (planBody === undefined) return
    setDraft(planBody)
  }, [planBody, activeWeek])

  // The weeks Save will write to for this user, defaulting back to just the
  // week being viewed whenever it changes.
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([activeWeek])
  useEffect(() => {
    setSelectedWeeks([activeWeek])
  }, [activeWeek])
  const toggleWeek = (week: number) =>
    setSelectedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week],
    )

  const profile = plan?.profile ?? client.dietProfile
  // Read off the plan, not the client: this workspace is opened with whatever
  // client object the surface that opened it happened to hold, and that one
  // doesn't refetch when the sign-off (or the band) changes.
  const currentBand = profile?.band ?? 1600
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
          <CopyToWeeksDropdown
            totalWeeks={totalWeeks}
            currentWeek={activeWeek}
            selected={selectedWeeks}
            onToggle={toggleWeek}
            onSelect={setSelectedWeeks}
          />
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
                — Save writes it to the weeks picked in Copy to weeks.
              </p>
              <button
                className="btn-primary"
                disabled={!selectedWeeks.length || saveToWeeks.isPending}
                onClick={() =>
                  saveToWeeks.mutate({ body: draft, weeks: selectedWeeks })
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
  )
}
