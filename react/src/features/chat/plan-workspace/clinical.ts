// Clinical profile derivation + safety/conflict engine — ported from V2's
// plan-workspace.js. Every food/exercise the workspace proposes is filtered
// against the client's allergies, medical and dietary restrictions — a
// conflicting item can never be introduced.
import { pick, seededRandom } from '@/lib/seed'
import type { Client } from '@/features/clients'
import {
  EXERCISE_LIBRARY,
  mealById,
  mealsByCategory,
} from '@/features/programs'
import type { Exercise, Meal, MealSlot } from '@/features/programs'
import type { ClinicalProfile, Conflict, WsTargets } from './types'

// ===================== Constant pools =====================
const CUISINES = [
  'North Indian',
  'South Indian',
  'Mediterranean',
  'Continental',
  'East Asian',
  'Middle Eastern',
  'Mexican',
]
const BUDGETS = ['Budget-friendly', 'Moderate', 'Premium']
const MEAL_TIMINGS = [
  '3 meals / day',
  '3 meals + 2 snacks',
  'Intermittent fasting (16:8)',
  '5 small meals',
]
const WORKOUT_LOCATIONS = ['Home', 'Gym']
const HOME_EQUIPMENT = [
  'Dumbbells',
  'Resistance bands',
  'Yoga mat',
  'Kettlebell',
  'Pull-up bar',
]
const GYM_EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Kettlebell',
  'Bodyweight',
]
const PREFERRED_TIMES = [
  'Early morning',
  'Mid-morning',
  'Lunchtime',
  'Evening',
  'Late night',
]
const INJURY_POOL = [
  'Lower back strain',
  'Left knee (meniscus)',
  'Right shoulder impingement',
  'Wrist tendinitis',
  'Ankle sprain (healed)',
]
const SUPPLEMENT_POOL = [
  'Whey protein',
  'Creatine monohydrate',
  'Omega-3',
  'Multivitamin',
  'Magnesium',
]
const FOOD_LIKES = [
  'Paneer',
  'Eggs',
  'Oats',
  'Berries',
  'Chicken',
  'Rice',
  'Avocado',
  'Sweet potato',
  'Greek yogurt',
  'Lentils',
]
const FOOD_DISLIKES = [
  'Mushrooms',
  'Broccoli',
  'Tofu',
  'Beetroot',
  'Olives',
  'Bell pepper',
  'Cottage cheese',
]
const ALLERGY_POOL_WS = [
  'Peanuts',
  'Shellfish',
  'Dairy',
  'Gluten',
  'Eggs',
  'Soy',
]
const INTOLERANCE_POOL = [
  'Lactose',
  'Gluten sensitivity',
  'FODMAPs',
  'Caffeine',
]
const MEDICAL_POOL_WS = [
  'Type 2 Diabetes',
  'Hypertension',
  'PCOS',
  'Hypothyroidism',
  'High cholesterol',
  'IBS',
]
const ACTIVITY_LEVELS_WS = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
  'Athlete',
]

// Ingredient keyword tables — used to detect what a meal actually contains so
// nothing conflicting with a restriction is ever recommended.
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  Peanuts: ['peanut'],
  Shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish'],
  Dairy: ['yogurt', 'cheese', 'milk', 'feta', 'cottage', 'whey', 'butter'],
  Gluten: ['bread', 'tortilla', 'wheat', 'wrap', 'granola', 'pasta', 'oats'],
  Eggs: ['egg'],
  Soy: ['soy', 'tofu', 'edamame', 'tempeh'],
}
const INTOLERANCE_KEYWORDS: Record<string, string[]> = {
  Lactose: ['yogurt', 'cheese', 'milk', 'feta', 'cottage', 'whey', 'butter'],
  'Gluten sensitivity': [
    'bread',
    'tortilla',
    'wheat',
    'wrap',
    'granola',
    'pasta',
    'oats',
  ],
  FODMAPs: ['onion', 'garlic', 'wheat', 'apple', 'lentil', 'chickpea'],
  Caffeine: ['coffee', 'espresso'],
}
const MEAT_KEYWORDS = ['chicken', 'beef', 'turkey', 'pork', 'lamb', 'bacon']
const FISH_KEYWORDS = ['salmon', 'cod', 'tuna', 'fish', 'shrimp', 'prawn']
const ANIMAL_KEYWORDS = [
  ...MEAT_KEYWORDS,
  ...FISH_KEYWORDS,
  'yogurt',
  'cheese',
  'milk',
  'feta',
  'cottage',
  'egg',
  'honey',
  'whey',
  'butter',
]
const PORK_KEYWORDS = ['pork', 'bacon', 'ham']

// injury -> exercise muscle groups that could be aggravated
export const INJURY_MUSCLE_RISK: Record<string, string[]> = {
  shoulder: ['Shoulders', 'Chest'],
  knee: ['Legs'],
  back: ['Back', 'Legs'],
  wrist: ['Arms', 'Chest'],
  ankle: ['Legs', 'Cardio'],
}

// ===================== Small helpers =====================
function subset(
  pool: string[],
  seedBase: number,
  chanceNone: number,
  maxCount: number,
): string[] {
  if (seededRandom(seedBase) < chanceNone) return []
  const count =
    1 +
    (seededRandom(seedBase + 1) > 0.6 ? 1 : 0) +
    (maxCount > 2 && seededRandom(seedBase + 2) > 0.8 ? 1 : 0)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const v = pick(pool, seedBase + 3 + i * 3)
    if (!out.includes(v)) out.push(v)
  }
  return out
}
export function ingredientsText(meal: Meal): string {
  return (meal.ingredients || []).join(' ').toLowerCase()
}

// Per-ingredient keyword match with plant-alternative exclusions so "almond
// milk" / "coconut milk" / "almond butter" are NOT flagged as dairy.
const PLANT_QUALIFIERS =
  /(almond|soy|oat|coconut|rice|cashew|peanut|plant|hemp|pea)\b/
function mealHasKeyword(meal: Meal, keywords: string[]): boolean {
  const list = (meal.ingredients || []).map((s) => s.toLowerCase())
  return list.some((ing) =>
    keywords.some((k) => {
      if (!ing.includes(k)) return false
      if ((k === 'milk' || k === 'butter') && PLANT_QUALIFIERS.test(ing))
        return false
      return true
    }),
  )
}

// ===================== Clinical profile derivation =====================
export function deriveClinicalProfile(client: Client): ClinicalProfile {
  const idNum = parseInt(String(client.id).replace('c-', ''), 10) || 1
  const seed = idNum * 7.13 + 3

  const heightCm = 150 + Math.floor(seededRandom(seed * 1.7 + 1) * 45)
  const weightKg =
    client.gender === 'Male'
      ? 68 + Math.floor(seededRandom(seed * 2.3 + 2) * 35)
      : 54 + Math.floor(seededRandom(seed * 2.3 + 2) * 32)
  const wantsLoseFat = client.goals.includes('Lose fat')
  const wantsBuildMuscle = client.goals.includes('Build muscle')
  const targetWeightKg = wantsLoseFat
    ? weightKg - (5 + Math.floor(seededRandom(seed * 3.1) * 10))
    : wantsBuildMuscle
      ? weightKg + (2 + Math.floor(seededRandom(seed * 3.1) * 6))
      : weightKg
  const bmi = +(weightKg / (heightCm / 100) ** 2).toFixed(1)

  const startWeight = wantsLoseFat
    ? weightKg + 4
    : wantsBuildMuscle
      ? weightKg - 3
      : weightKg + 1
  const weightLog = Array.from({ length: 8 }, (_, i) => {
    const tt = i / 7
    return (
      Math.round(
        (startWeight +
          (weightKg - startWeight) * tt +
          (seededRandom(seed * 9 + i) - 0.5) * 0.8) *
          10,
      ) / 10
    )
  })

  const diet = (client.diet || '').toLowerCase()
  const isVegan = diet.includes('vegan')
  const isVegetarian = isVegan || diet.includes('vegetarian')
  const isPescatarian = diet.includes('pescatarian')
  const isHalal = diet.includes('halal')
  const isJain = diet.includes('jain')

  const tenureDays = Math.max(
    1,
    Math.round((Date.now() - client.joinDate.getTime()) / (24 * 3600 * 1000)),
  )
  const currentWeek = Math.max(1, Math.ceil(tenureDays / 7))

  const female = client.gender === 'Female'
  const pregnancy =
    female && client.program === 'Prenatal Nutrition'
      ? 'Pregnant — 2nd trimester'
      : female && seededRandom(seed * 30) < 0.08
        ? 'Breastfeeding'
        : null

  const goal = client.program

  return {
    name: client.name,
    initials: client.initials,
    color: client.color,
    status: client.status,
    age: client.age,
    gender: client.gender,
    heightCm,
    weightKg,
    bmi,
    goal,
    activityLevel: pick(ACTIVITY_LEVELS_WS, seed * 4.7),
    targetWeightKg,
    programStart: client.joinDate,
    currentWeek,
    program: client.program,
    allergies: subset(ALLERGY_POOL_WS, seed * 5.3, 0.45, 2),
    foodIntolerances: subset(INTOLERANCE_POOL, seed * 5.9, 0.6, 2),
    medicalConditions:
      client.program === 'Diabetes Management'
        ? ['Type 2 Diabetes']
        : client.program === 'PCOS Management'
          ? ['PCOS']
          : client.program === 'Cardiac Health'
            ? ['Hypertension', 'High cholesterol']
            : subset(MEDICAL_POOL_WS, seed * 6.1, 0.55, 2),
    injuries: subset(INJURY_POOL, seed * 6.7, 0.6, 1),
    pregnancy,
    dietLabel: client.diet,
    isVegan,
    isVegetarian,
    isPescatarian,
    isHalal,
    isJain,
    foodLikes: subset(FOOD_LIKES, seed * 8.1, 0, 3).slice(0, 3),
    foodDislikes: subset(FOOD_DISLIKES, seed * 8.7, 0.2, 2),
    cuisine: pick(CUISINES, seed * 9.3),
    budget: pick(BUDGETS, seed * 9.9),
    mealTiming: pick(MEAL_TIMINGS, seed * 10.5),
    location: pick(WORKOUT_LOCATIONS, seed * 11.1),
    workoutDuration: pick(['30 min', '45 min', '60 min'], seed * 11.7),
    workoutDifficulty: goal === 'Muscle Gain' ? 'Intermediate' : 'Beginner',
    preferredTime: pick(PREFERRED_TIMES, seed * 12.3),
    physicalLimitations: subset(
      [
        'None reported',
        'Limited overhead mobility',
        'Avoid high-impact jumping',
      ],
      seed * 12.9,
      0.5,
      1,
    ),
    weightLog,
    complianceScore: client.adherence,
    missedCheckIns:
      client.checkInDays == null
        ? 0
        : client.status === 'attention'
          ? 3
          : Math.floor(seededRandom(seed * 13.5) * 2),
    waistTrend: -(Math.round(seededRandom(seed * 14.1) * 40) / 10),
    photoCount: 1 + Math.floor(seededRandom(seed * 14.7) * 4),
    tenureDays,
    _seed: seed,
  }
}

export const SUPPLEMENT_POOL_EXPORT = SUPPLEMENT_POOL

export function equipmentFor(profile: ClinicalProfile): string[] {
  return profile.location === 'Home'
    ? HOME_EQUIPMENT.concat('Bodyweight')
    : GYM_EQUIPMENT
}
export function equipmentAllowed(
  profile: ClinicalProfile,
  equipment: string,
): boolean {
  if (equipment === 'Bodyweight') return true
  const list = equipmentFor(profile).map((e) => e.toLowerCase())
  return list.includes(equipment.toLowerCase())
}

// ===================== Conflict guards =====================
export function mealConflicts(
  meal: Meal,
  profile: ClinicalProfile,
): Conflict[] {
  const out: Conflict[] = []
  profile.allergies.forEach((a) => {
    if (mealHasKeyword(meal, ALLERGEN_KEYWORDS[a] || [a.toLowerCase()]))
      out.push({ level: 'hard', reason: `Contains ${a} (allergy)` })
  })
  profile.foodIntolerances.forEach((it) => {
    if (mealHasKeyword(meal, INTOLERANCE_KEYWORDS[it] || [it.toLowerCase()]))
      out.push({
        level: 'soft',
        reason: `Contains ${it.toLowerCase()} (intolerance)`,
      })
  })
  if (profile.isVegan && mealHasKeyword(meal, ANIMAL_KEYWORDS))
    out.push({ level: 'hard', reason: 'Not vegan' })
  else if (
    profile.isVegetarian &&
    mealHasKeyword(meal, [...MEAT_KEYWORDS, ...FISH_KEYWORDS])
  )
    out.push({ level: 'hard', reason: 'Not vegetarian' })
  else if (profile.isPescatarian && mealHasKeyword(meal, MEAT_KEYWORDS))
    out.push({ level: 'hard', reason: 'Contains meat' })
  if (profile.isHalal && mealHasKeyword(meal, PORK_KEYWORDS))
    out.push({ level: 'hard', reason: 'Not halal (pork)' })
  profile.foodDislikes.forEach((d) => {
    if (mealHasKeyword(meal, [d.toLowerCase()]))
      out.push({ level: 'soft', reason: `Client dislikes ${d.toLowerCase()}` })
  })
  return out
}
export function mealHardConflict(
  meal: Meal,
  profile: ClinicalProfile,
): boolean {
  return mealConflicts(meal, profile).some((c) => c.level === 'hard')
}

export function exerciseIssues(
  ex: Exercise,
  profile: ClinicalProfile,
): Conflict[] {
  const out: Conflict[] = []
  profile.injuries.forEach((inj) => {
    const key = Object.keys(INJURY_MUSCLE_RISK).find((k) =>
      inj.toLowerCase().includes(k),
    )
    if (key && INJURY_MUSCLE_RISK[key].includes(ex.muscle))
      out.push({ level: 'hard', reason: `May aggravate ${inj.toLowerCase()}` })
  })
  if (!equipmentAllowed(profile, ex.equipment))
    out.push({
      level: 'soft',
      reason: `Needs ${ex.equipment} (not available at ${profile.location.toLowerCase()})`,
    })
  return out
}
export function exerciseHardIssue(
  ex: Exercise,
  profile: ClinicalProfile,
): boolean {
  return exerciseIssues(ex, profile).some((c) => c.level === 'hard')
}

// ---- Safe pickers (never return a conflicting item) ----
export function pickSafeMeal(
  category: MealSlot,
  profile: ClinicalProfile,
  avoidId: string | null,
  preferHigherKcal?: boolean | null,
): Meal {
  let pool = mealsByCategory(category).filter(
    (m) => m.id !== avoidId && !mealHardConflict(m, profile),
  )
  if (!pool.length)
    pool = mealsByCategory(category).filter(
      (m) => !mealHardConflict(m, profile),
    )
  if (!pool.length) {
    const fallback = mealById(mealsByCategory(category)[0].id)
    return fallback ?? mealsByCategory(category)[0]
  }
  const clean = pool.filter((m) => mealConflicts(m, profile).length === 0)
  const base = clean.length ? clean : pool
  const liked = base.filter((m) =>
    profile.foodLikes.some((l) => ingredientsText(m).includes(l.toLowerCase())),
  )
  const from = liked.length ? liked : base
  if (preferHigherKcal != null) {
    const sorted = from
      .slice()
      .sort((a, b) =>
        preferHigherKcal ? b.calories - a.calories : a.calories - b.calories,
      )
    return sorted[0]
  }
  return pick(
    from,
    profile._seed + category.length * 7 + (avoidId ? avoidId.length : 0),
  )
}
export function pickAltExercise(
  ex: Exercise,
  profile: ClinicalProfile,
  avoidIds: string[],
): Exercise {
  const avoid = new Set(avoidIds || [])
  const pool = EXERCISE_LIBRARY.filter(
    (e) =>
      e.id !== ex.id &&
      !avoid.has(e.id) &&
      !exerciseHardIssue(e, profile) &&
      equipmentAllowed(profile, e.equipment),
  )
  const sameMuscle = pool.filter((e) => e.muscle === ex.muscle)
  const from = sameMuscle.length
    ? sameMuscle
    : pool.length
      ? pool
      : EXERCISE_LIBRARY.filter((e) => e.equipment === 'Bodyweight')
  return (
    from[
      Math.floor(seededRandom(profile._seed + ex.id.length * 3) * from.length)
    ] || from[0]
  )
}

// ===================== Nutrition targets =====================
export function computeTargets(profile: ClinicalProfile): WsTargets {
  const s = profile.gender === 'Male' ? 5 : -161
  const bmr =
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + s
  const factor =
    (
      {
        Sedentary: 1.2,
        'Lightly active': 1.375,
        'Moderately active': 1.55,
        'Very active': 1.725,
        Athlete: 1.9,
      } as Record<string, number>
    )[profile.activityLevel] || 1.4
  let cals = Math.round(bmr * factor)
  if (profile.goal === 'Weight Loss' || profile.goal === 'Body Recomposition')
    cals -= 400
  if (profile.goal === 'Muscle Gain') cals += 300
  cals = Math.round(cals / 10) * 10
  return {
    calories: cals,
    protein: Math.round(
      profile.weightKg * (profile.goal === 'Muscle Gain' ? 2.0 : 1.6),
    ),
    carbs: Math.round((cals * 0.4) / 4),
    fat: Math.round((cals * 0.28) / 9),
    water: Math.max(2, Math.round(profile.weightKg * 0.033 * 10) / 10),
    phase:
      profile.goal === 'Weight Loss'
        ? 'Fat Loss'
        : profile.goal === 'Muscle Gain'
          ? 'Muscle Gain'
          : 'General',
  }
}
