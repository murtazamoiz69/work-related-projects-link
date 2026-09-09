import type { PlanReviewStatus } from '../diet/dietPlan.types'

/** The sign-off state of a user's plan, as a small tag beside the plan
 *  heading. It answers "can this user see what I am looking at?" at the point
 *  of editing, rather than only in the chat header or on the roster.
 *
 *  Blue for outstanding, green for signed off — the same two colours the
 *  roster chip uses, so one state reads the same everywhere. */
export function ReviewTag({ status }: { status: PlanReviewStatus }) {
  const reviewed = status === 'reviewed'
  return (
    <span
      className={`plan-review-tag${reviewed ? ' is-reviewed' : ' is-pending'}`}
      title={
        reviewed
          ? 'Reviewed — this user can see this plan'
          : 'Needs review — this user cannot see this plan yet'
      }
    >
      {reviewed ? 'Reviewed' : 'Needs review'}
    </span>
  )
}
