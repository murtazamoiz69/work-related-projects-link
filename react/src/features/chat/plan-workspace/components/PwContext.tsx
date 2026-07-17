import { type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatJoinDate } from '@/features/clients'
import { equipmentFor } from '../clinical'
import type { ClinicalProfile } from '../types'

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

function Section({
  keyId,
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  keyId: string
  icon: string
  title: string
  open: boolean
  onToggle: (key: string) => void
  children: ReactNode
}) {
  return (
    <div className={`pw-ctx-section${open ? ' open' : ''}`}>
      <button className="pw-ctx-head" onClick={() => onToggle(keyId)}>
        <Icon name={icon} />
        <span>{title}</span>
        <Icon name="chevron-down" className="pw-ctx-chev" />
      </button>
      {open ? <div className="pw-ctx-body">{children}</div> : null}
    </div>
  )
}

export function PwContext({
  profile,
  openSections,
  onToggle,
}: {
  profile: ClinicalProfile
  openSections: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  const p = profile
  const diet = [p.dietLabel]
  if (p.isVegan) diet.push('Vegan')
  else if (p.isVegetarian) diet.push('Vegetarian')
  if (p.isHalal) diet.push('Halal')
  if (p.isJain) diet.push('Jain')
  const dietTypes = diet.filter((v, i, a) => a.indexOf(v) === i)

  return (
    <>
      <div className="pw-ctx-title">
        <Icon name="user-round" />
        Client Context
      </div>

      <Section
        keyId="profile"
        icon="id-card"
        title="Profile"
        open={openSections.has('profile')}
        onToggle={onToggle}
      >
        <Kv label="Age" value={p.age} />
        <Kv label="Gender" value={p.gender} />
        <Kv label="Height" value={`${p.heightCm} cm`} />
        <Kv label="Weight" value={`${p.weightKg} kg`} />
        <Kv label="BMI" value={p.bmi} />
        <Kv label="Goal" value={p.goal} />
        <Kv label="Activity" value={p.activityLevel} />
        <Kv label="Target weight" value={`${p.targetWeightKg} kg`} />
        <Kv label="Program start" value={formatJoinDate(p.programStart)} />
        <Kv label="Current week" value={`Week ${p.currentWeek}`} />
      </Section>

      <Section
        keyId="medical"
        icon="heart-pulse"
        title="Medical Information"
        open={openSections.has('medical')}
        onToggle={onToggle}
      >
        <span className="pw-sub-label">Allergies</span>
        <RiskChips arr={p.allergies} empty="No known allergies" />
        <span className="pw-sub-label">Food intolerances</span>
        <RiskChips arr={p.foodIntolerances} />
        <span className="pw-sub-label">Medical conditions</span>
        <RiskChips arr={p.medicalConditions} />
        {p.pregnancy ? (
          <>
            <span className="pw-sub-label">Pregnancy / Breastfeeding</span>
            <div className="pw-chip-row">
              <span className="pw-chip risk">{p.pregnancy}</span>
            </div>
          </>
        ) : null}
      </Section>

      <Section
        keyId="diet"
        icon="salad"
        title="Dietary Preferences"
        open={openSections.has('diet')}
        onToggle={onToggle}
      >
        <span className="pw-sub-label">Diet type</span>
        <Chips arr={dietTypes} />
        <span className="pw-sub-label">Likes</span>
        <Chips arr={p.foodLikes} />
        <span className="pw-sub-label">Dislikes</span>
        <RiskChips arr={p.foodDislikes} empty="None" />
        <Kv label="Cuisine" value={p.cuisine} />
        <Kv label="Budget" value={p.budget} />
        <Kv label="Meal timing" value={p.mealTiming} />
      </Section>

      <Section
        keyId="workout"
        icon="dumbbell"
        title="Workout Preferences"
        open={openSections.has('workout')}
        onToggle={onToggle}
      >
        <Kv label="Location" value={p.location} />
        <Kv label="Equipment" value={equipmentFor(p).slice(0, 3).join(', ')} />
        <Kv label="Duration" value={p.workoutDuration} />
        <Kv label="Preferred time" value={p.preferredTime} />
        <span className="pw-sub-label">Physical limitations</span>
        <RiskChips arr={p.physicalLimitations} empty="None" />
      </Section>
    </>
  )
}
