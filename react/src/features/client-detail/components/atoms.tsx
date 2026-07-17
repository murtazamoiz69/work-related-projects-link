import { Icon } from '@/components/atoms/Icon'
import type { DeltaTone, Photos } from '../types'
import { miniBarTier } from '../data'

/** A diet/chip tag — the `.client-tag` atom from V2. */
export function Chip({ text, extraClass }: { text: string; extraClass?: string }) {
  return (
    <span className={`client-tag${extraClass ? ` ${extraClass}` : ''}`}>{text}</span>
  )
}

/** An all-time stat card, optionally tinted good/bad. */
export function StatCard({
  value,
  label,
  tone,
}: {
  value: string | number
  label: string
  tone?: DeltaTone
}) {
  return (
    <div className={`alltime-stat${tone ? ` tone-${tone}` : ''}`}>
      <span className="alltime-stat-value">{value}</span>
      <span className="alltime-stat-label">{label}</span>
    </div>
  )
}

/** A single labelled adherence bar (Diet / Workout). */
export function MiniBar({ pct, kind }: { pct: number | null; kind: string }) {
  if (pct == null) {
    return (
      <div className="mini-bar">
        <span className="mini-bar-label">{kind}</span>
        <div className="mini-bar-track">
          <div className="mini-bar-fill is-empty" />
        </div>
        <span className="mini-bar-val">—</span>
      </div>
    )
  }
  const tier = miniBarTier(pct)
  return (
    <div className="mini-bar">
      <span className="mini-bar-label">{kind}</span>
      <div className="mini-bar-track">
        <div className={`mini-bar-fill tier-${tier}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="mini-bar-val">{pct}%</span>
    </div>
  )
}

const PHOTO_SLOTS: Array<'front' | 'side' | 'back'> = ['front', 'side', 'back']

/** Front / side / back progress-photo triplet. A real chat-attached photo is a
 *  data URI; the rest of the seeded data is a presence flag → placeholder icon. */
export function PhotoTriplet({
  photos,
  size,
}: {
  photos: Photos | null
  size?: 'sm' | ''
}) {
  return (
    <div className={`photo-triplet${size ? ` ${size}` : ''}`}>
      {PHOTO_SLOTS.map((s) => {
        const val = photos ? photos[s] : false
        const label = s[0].toUpperCase() + s.slice(1)
        return (
          <div className="photo-slot" key={s}>
            {typeof val === 'string' ? (
              <img className="upload-thumb" src={val} alt={`${s} progress photo`} />
            ) : (
              <div className={`upload-thumb${val ? '' : ' is-missing'}`}>
                <Icon name={val ? 'image' : 'image-off'} />
              </div>
            )}
            <span className="photo-slot-label">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
