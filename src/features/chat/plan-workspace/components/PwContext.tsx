import { type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatJoinDate } from '@/features/clients'
import { PAL_LABEL } from '../onboarding'
import type { ClinicalProfile, UserContext } from '../types'

function Kv({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="pw-kv">
      <span className="pw-kv-l">{label}</span>
      <span className="pw-kv-v">{value}</span>
    </div>
  )
}

function Chips({ arr, empty }: { arr: string[]; empty?: string }) {
  return arr && arr.length ? (
    <div className="pw-chip-row">
      {arr.map((a, i) => (
        <span className="pw-chip" key={`${a}-${i}`}>
          {a}
        </span>
      ))}
    </div>
  ) : (
    <span className="pw-muted">{empty || 'None'}</span>
  )
}

function RiskChips({ arr, empty }: { arr: string[]; empty?: string }) {
  return arr && arr.length ? (
    <div className="pw-chip-row">
      {arr.map((a, i) => (
        <span className="pw-chip risk" key={`${a}-${i}`}>
          {a}
        </span>
      ))}
    </div>
  ) : (
    <span className="pw-muted">{empty || 'None reported'}</span>
  )
}

/** Every card carries its own freshness line: a weight logged this morning and
 *  an allergy noted in March are not the same age, and one date for the whole
 *  rail would hide that. */
function UpdatedAs({ date }: { date: Date }) {
  return <p className="pw-updated-as">Updated as of {formatJoinDate(date)}</p>
}

function Section({
  keyId,
  icon,
  title,
  open,
  onToggle,
  updatedAt,
  children,
}: {
  keyId: string
  icon: string
  title: string
  open: boolean
  onToggle: (key: string) => void
  updatedAt: Date
  children: ReactNode
}) {
  return (
    <div className={`pw-ctx-section${open ? ' open' : ''}`}>
      <button className="pw-ctx-head" onClick={() => onToggle(keyId)}>
        <Icon name={icon} />
        <span>{title}</span>
        <Icon name="chevron-down" className="pw-ctx-chev" />
      </button>
      {open ? (
        <div className="pw-ctx-body">
          {children}
          <UpdatedAs date={updatedAt} />
        </div>
      ) : null}
    </div>
  )
}

export function PwContext({
  profile,
  context,
  durationWeeks,
  openSections,
  onToggle,
}: {
  profile: ClinicalProfile
  /** Onboarding answers, starting point and per-card freshness — derived
   *  client-side, not carried on the plan's wire profile. */
  context: UserContext
  /** The programme's own length, from the programme record. */
  durationWeeks: number
  openSections: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  const p = profile
  const c = context
  const o = c.onboarding
  const wl = o.weightLoss

  return (
    <>
      <div className="pw-ctx-title">
        <Icon name="user-round" />
        User Context
      </div>

      <Section
        keyId="profile"
        icon="id-card"
        title="Profile"
        open={openSections.has('profile')}
        onToggle={onToggle}
        updatedAt={c.updatedAt.profile}
      >
        <Kv label="Name" value={p.name} />
        <Kv label="Email" value={c.email} />
        <Kv label="Age" value={p.age} />
        <Kv label="Gender" value={p.gender} />
        <Kv label="Program" value={p.program} />
        <Kv label="Duration" value={`${durationWeeks} weeks`} />

        {/* Where they started. Held apart from the live figures above so the
            two are never mistaken for each other. */}
        <span className="pw-sub-label">Starting point</span>
        <Kv label="Starting height" value={`${c.startingPoint.heightCm} cm`} />
        <Kv label="Starting weight" value={`${c.startingPoint.weightKg} kg`} />
        <p className="pw-updated-as">
          Recorded {formatJoinDate(c.startingPoint.recordedAt)}
        </p>
      </Section>

      <Section
        keyId="onboarding"
        icon="clipboard-list"
        title="Onboarding"
        open={openSections.has('onboarding')}
        onToggle={onToggle}
        updatedAt={c.updatedAt.onboarding}
      >
        <Kv label="Height" value={`${p.heightCm} cm`} />
        <Kv label="Weight" value={`${p.weightKg} kg`} />
        <Kv label="Steps each day" value={o.stepBand} />
        <Kv label="Lifestyle" value={o.lifestyle} />
        <Kv label="Exercise" value={o.exerciseFrequency} />
        <Kv label="Intensity" value={o.intensity} />
        <Kv label="BMR" value={`${o.bmr.toLocaleString()} kcal`} />
        <Kv
          label="TDEE"
          value={`${o.tdee.toLocaleString()} kcal · PAL ${o.pal} (${PAL_LABEL[o.pal]})`}
        />
        <Kv
          label="Weight loss"
          value={`${wl.applied.kg} kg in 6 weeks · ${wl.applied.label}`}
        />
        {/* The safety rule from the calculation spec: an intake under the
            floor is not served — the client is moved to the gentler plan. */}
        {wl.downgraded ? (
          <p className="pw-updated-as pw-updated-warn">
            Requested {wl.requested.kg} kg ({wl.requested.label}) would fall
            below the minimum intake — moved to {wl.applied.kg} kg.
          </p>
        ) : null}
      </Section>

      <Section
        keyId="diet"
        icon="salad"
        title="Dietary Preference"
        open={openSections.has('diet')}
        onToggle={onToggle}
        updatedAt={c.updatedAt.diet}
      >
        <span className="pw-sub-label">Onboarding</span>
        <Chips arr={[o.dietaryPreference]} />
        <span className="pw-sub-label">Allergy / intolerances</span>
        <RiskChips
          arr={[...p.allergies, ...p.foodIntolerances]}
          empty="None reported"
        />
      </Section>

      <Section
        keyId="medical"
        icon="heart-pulse"
        title="Medical Information"
        open={openSections.has('medical')}
        onToggle={onToggle}
        updatedAt={c.updatedAt.medical}
      >
        <span className="pw-sub-label">Medical condition</span>
        <RiskChips
          arr={[...p.medicalConditions, ...o.healthIssues].filter(
            (v, i, a) => a.indexOf(v) === i,
          )}
        />
        <span className="pw-sub-label">Injuries</span>
        <RiskChips arr={p.injuries} />
        <span className="pw-sub-label">Episode (symptom / acute)</span>
        {c.episode ? (
          <div className="pw-chip-row">
            <span className="pw-chip risk">{c.episode}</span>
          </div>
        ) : (
          <span className="pw-muted">None reported</span>
        )}
        <span className="pw-sub-label">Physiological state</span>
        {p.pregnancy ? (
          <div className="pw-chip-row">
            <span className="pw-chip risk">{p.pregnancy}</span>
          </div>
        ) : (
          <span className="pw-muted">None reported</span>
        )}
      </Section>
    </>
  )
}
