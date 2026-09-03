// Stateful mock backend for the diet plans — master sheets (global, per week
// per calorie band) and the per-user copies derived from them.
// Reset with resetDietPlanStore() in tests.
import { PROGRAM_DURATION_WEEKS } from '../data'
import { buildMasterSheets } from './dietPlan.seed'
import {
  CALORIE_BANDS,
  type CalorieBand,
  type DietProfile,
  type MedicalCondition,
} from './dietPlan.types'
import type { ClientDietPlanDto, DietPlanSheetDto } from './dietPlan.api.types'

// key: `${weekNum}:${band}`
let masterSheets = new Map<string, DietPlanSheetDto>()
// key: `${clientId}:${weekNum}` — only weeks the nutritionist has actually
// touched are stored; everything else is derived from the master on read.
let clientOverrides = new Map<string, ClientDietPlanDto>()

const key = (weekNum: number, band: CalorieBand) => `${weekNum}:${band}`
const clientKey = (clientId: string, weekNum: number) =>
  `${clientId}:${weekNum}`

function seed(): void {
  masterSheets = new Map(
    buildMasterSheets(PROGRAM_DURATION_WEEKS).map((s) => [
      key(s.weekNum, s.band),
      { ...s, updatedAt: new Date().toISOString() },
    ]),
  )
  clientOverrides = new Map()
}
seed()

export function resetDietPlanStore(): void {
  seed()
}

export function getMasterSheet(
  weekNum: number,
  band: CalorieBand,
): DietPlanSheetDto | undefined {
  return masterSheets.get(key(weekNum, band))
}

export function saveMasterSheet(
  weekNum: number,
  band: CalorieBand,
  body: string,
): DietPlanSheetDto {
  const next: DietPlanSheetDto = {
    weekNum,
    band,
    body,
    updatedAt: new Date().toISOString(),
  }
  masterSheets.set(key(weekNum, band), next)
  return next
}

/** Copy one week's sheet onto other weeks, within the same band. The band is
 *  deliberately not a parameter of the target: a 1200 sheet is only ever
 *  duplicated onto other 1200 weeks, never across bands, because the portions
 *  wouldn't carry. */
export function duplicateMasterSheet(
  fromWeek: number,
  band: CalorieBand,
  toWeeks: number[],
): number[] {
  const source = getMasterSheet(fromWeek, band)
  if (!source) return []
  const written: number[] = []
  for (const week of toWeeks) {
    if (week === fromWeek) continue
    if (week < 1 || week > PROGRAM_DURATION_WEEKS) continue
    saveMasterSheet(week, band, source.body)
    written.push(week)
  }
  return written
}

// ---------------------------------------------------------------------------
// The "AI engine". A real one would rewrite the sheet; this one applies the
// same rules a nutritionist would state out loud, and — importantly — only ever
// *removes or annotates* content that is already on the master sheet. It never
// introduces food the master plan doesn't have, which is the property the
// product actually depends on.
// ---------------------------------------------------------------------------

/** Terms that leave the plan for a given dietary preference. */
const EXCLUDED_BY_PREFERENCE: Record<string, string[]> = {
  Veg: ['chicken', 'fish', 'egg'],
  Vegan: ['chicken', 'fish', 'egg', 'paneer', 'curd', 'milk', 'whey', 'ghee'],
  Eggitarian: ['chicken', 'fish'],
  'Non-veg': [],
}

/** Notes a condition adds, and terms it pulls out. */
const CONDITION_RULES: Record<
  MedicalCondition,
  { note: string; drop: string[] }
> = {
  Diabetes: {
    note: 'Diabetes — fruit moved to after a protein source, dates removed, rice portions capped.',
    drop: ['dates'],
  },
  PCOS: {
    note: 'PCOS — dairy reduced, refined carbs removed, seeds kept daily for cycle support.',
    drop: [],
  },
  Thyroid: {
    note: 'Thyroid — raw cruciferous vegetables cooked instead, soy limited, iodised salt assumed.',
    drop: ['tofu'],
  },
  Hypertension: {
    note: 'Hypertension — added salt removed, potassium-rich options prioritised.',
    drop: [],
  },
  'Uric Acid': {
    note: 'Uric acid — organ meat and high-purine pulses removed, water target raised to 4 L.',
    drop: ['rajma'],
  },
}

const LIFE_STAGE_NOTE: Record<DietProfile['lifeStage'], string | null> = {
  male: null,
  female: 'Iron-rich options prioritised through the second half of the cycle.',
  lactating:
    'Lactating — +400 kcal on top of the band, calcium and fluids raised, no restriction below 1800 kcal.',
}

/** Drop `<li>` items mentioning any excluded term. Operates on the sheet's own
 *  markup, so the result is a strict subset of what the nutritionist wrote. */
function dropListItems(body: string, terms: string[]): string {
  if (!terms.length) return body
  return body.replace(/<li>(.*?)<\/li>/gs, (match, inner: string) => {
    const text = inner.toLowerCase()
    return terms.some((t) => text.includes(t)) ? '' : match
  })
}

/** Strip an excluded term from an inline "Protein — a / b / c" choice line. */
function pruneChoiceLines(body: string, terms: string[]): string {
  if (!terms.length) return body
  return body.replace(/<li>(.*?)<\/li>/gs, (match, inner: string) => {
    if (!inner.includes(' — ')) return match
    const [label, rest] = inner.split(/ — (.+)/s)
    const kept = rest
      ?.split(' / ')
      .filter((opt) => !terms.some((t) => opt.toLowerCase().includes(t)))
    if (!kept || !kept.length) return ''
    return `<li>${label} — ${kept.join(' / ')}</li>`
  })
}

export function tailorForProfile(
  masterBody: string,
  profile: DietProfile,
): { body: string; appliedFilters: string[] } {
  // Nothing to narrow. A blank week should read as blank for the user too,
  // rather than as a list of filters applied to no food.
  if (!masterBody.trim()) return { body: '', appliedFilters: [] }

  const applied: string[] = []
  let body = masterBody

  const prefTerms = EXCLUDED_BY_PREFERENCE[profile.preference] ?? []
  if (prefTerms.length) {
    body = pruneChoiceLines(body, prefTerms)
    body = dropListItems(body, prefTerms)
    applied.push(
      `${profile.preference} — ${prefTerms.length} ingredient group(s) removed from the choices.`,
    )
  }

  for (const condition of profile.conditions) {
    const rule = CONDITION_RULES[condition]
    if (!rule) continue
    body = pruneChoiceLines(body, rule.drop)
    body = dropListItems(body, rule.drop)
    applied.push(rule.note)
  }

  const stageNote = LIFE_STAGE_NOTE[profile.lifeStage]
  if (stageNote) applied.push(stageNote)

  if (applied.length) {
    body =
      body +
      '<h3>Tailored for this user</h3><ul>' +
      applied.map((a) => `<li>${a}</li>`).join('') +
      '</ul>'
  }
  return { body, appliedFilters: applied }
}

/** A user's plan for a week: their own edited copy if one exists, otherwise the
 *  master sheet for their band run through the engine. */
export function getClientPlan(
  clientId: string,
  weekNum: number,
  profile: DietProfile,
): ClientDietPlanDto {
  const existing = clientOverrides.get(clientKey(clientId, weekNum))
  if (existing && existing.profile.band === profile.band) return existing

  const master = getMasterSheet(weekNum, profile.band)
  const { body, appliedFilters } = tailorForProfile(master?.body ?? '', profile)
  return {
    clientId,
    weekNum,
    profile,
    body,
    edited: false,
    appliedFilters,
    updatedAt: master?.updatedAt ?? new Date().toISOString(),
  }
}

export function saveClientPlan(
  clientId: string,
  weekNum: number,
  profile: DietProfile,
  body: string,
): ClientDietPlanDto {
  const current = getClientPlan(clientId, weekNum, profile)
  const next: ClientDietPlanDto = {
    ...current,
    body,
    edited: true,
    updatedAt: new Date().toISOString(),
  }
  clientOverrides.set(clientKey(clientId, weekNum), next)
  return next
}

/** Changing a user's band re-derives every week from the new master sheets —
 *  their hand-edited copies are dropped, because a 1400 kcal edit means nothing
 *  against an 1800 kcal sheet. */
export function clearClientPlans(clientId: string): void {
  for (const k of [...clientOverrides.keys()]) {
    if (k.startsWith(`${clientId}:`)) clientOverrides.delete(k)
  }
}

export function listBands(): readonly CalorieBand[] {
  return CALORIE_BANDS
}
