import { Icon } from '@/components/atoms/Icon'
import type { Client } from '@/features/clients'
import type { ClientDetail } from '../types'
import { Chip } from './atoms'

/** Overview tab: Nourish AI's summary + the client-details stat grid & chips. */
export function OverviewTab({
  client,
  detail,
}: {
  client: Client
  detail: ClientDetail
}) {
  const stats: Array<[string, string]> = [
    ['Height', `${detail.heightCm} cm`],
    ['Weight', `${detail.weightKg} kg`],
    ['Target Weight', `${detail.targetWeightKg} kg`],
    ['BMI', detail.bmi],
    ['Activity Level', detail.activityLevel],
    ['Weekly Commitment', `${detail.weeklyCommitment} days/week`],
  ]

  return (
    <>
      <section className="panel ai-box">
        <div className="panel-head">
          <div>
            <h2>
              <Icon name="bot" className="inline-icon" /> Nourish AI's Summary
            </h2>
            <p className="panel-sub">AI-generated overview · based on the last 30 days</p>
          </div>
        </div>
        <ul className="ai-summary-text">
          {detail.aiSummary.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Client Details</h2>
          </div>
        </div>
        <div className="detail-stat-grid">
          {stats.map(([label, value]) => (
            <div className="detail-stat" key={label}>
              <span className="detail-stat-label">{label}</span>
              <span className="detail-stat-value">{value}</span>
            </div>
          ))}
        </div>
        <div className="detail-chip-groups">
          <div className="detail-chip-group">
            <span className="detail-chip-label">Goals</span>
            <div className="detail-chip-row">
              {client.goals.map((g) => (
                <Chip text={g} key={g} />
              ))}
            </div>
          </div>
          <div className="detail-chip-group">
            <span className="detail-chip-label">Diet</span>
            <div className="detail-chip-row">
              <Chip text={client.diet} extraClass="client-tag-diet" />
            </div>
          </div>
          <div className="detail-chip-group">
            <span className="detail-chip-label">Allergies</span>
            <div className="detail-chip-row">
              {detail.allergies.map((a) => (
                <Chip text={a} extraClass={a === 'None' ? 'client-tag-diet' : ''} key={a} />
              ))}
            </div>
          </div>
          <div className="detail-chip-group">
            <span className="detail-chip-label">Medical Conditions</span>
            <div className="detail-chip-row">
              {detail.medicalConditions.map((m) => (
                <Chip text={m} extraClass={m === 'None' ? 'client-tag-diet' : ''} key={m} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
