import { Icon } from '@/components/atoms/Icon'
import { formatJoinDate } from '@/features/clients'
import type { Program } from '../types'
import { PhotoTriplet } from './atoms'

/** Photos sub-tab: a card per submitted week, each with the front/side/back triplet. */
export function JourneyPhotos({ program }: { program: Program }) {
  const submitted = program.weeks.filter((w) => w.submitted)
  if (submitted.length === 0) {
    return (
      <div className="journey-empty">
        <Icon name="image-off" />
        <p>No progress photos uploaded for this program yet.</p>
      </div>
    )
  }
  return (
    <>
      <p className="journey-tab-sub">
        Front · side · back, captured each weekly check-in.
      </p>
      <div className="photo-week-grid">
        {submitted.map((w) => (
          <div className="photo-week-card" key={w.week}>
            <div className="photo-week-head">
              <span className="photo-week-title">Week {w.week}</span>
              <span className="photo-week-date">{formatJoinDate(w.date)}</span>
            </div>
            <PhotoTriplet photos={w.photos} />
          </div>
        ))}
      </div>
    </>
  )
}
