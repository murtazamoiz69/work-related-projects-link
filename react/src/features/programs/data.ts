// Programs data model — ported from V2's programs-data.js. Reuses the seeded
// helpers and CLIENTS_DATA so the same person/program reads consistently
// everywhere in the prototype. The array is generated once and mirrored into
// localStorage after every mutation (guarded in try/catch) so creating/editing
// a program survives a navigation between the library and the workspace.
import { daysAgo, pick, seededRandom } from '@/lib/seed'
import type {
  DietDay,
  DietWeek,
  Exercise,
  Meal,
  MealEntry,
  MealSlot,
  MealTotals,
  ProgramDifficulty,
  ProgramGoal,
  TrainingProgram,
  Workout,
  WorkoutSlot,
  WorkoutWeek,
} from './types'

export const PROGRAM_GOALS: ProgramGoal[] = [
  'Fat Loss',
  'Muscle Gain',
  'Bulk',
  'PCOS',
  'Diabetes',
  'General Fitness',
]
export const PROGRAM_DIFFICULTIES: ProgramDifficulty[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
]
export const PROGRAM_DURATIONS = [4, 8, 12]
const COACH_NAMES = ['Sarah Nolan', 'James Okoro, RD', 'Priya Anand']
const WEEKDAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]
export const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner']

// ===================== Exercise library =====================
export const EXERCISE_LIBRARY: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    muscle: 'Chest',
    equipment: 'Barbell',
    instructions:
      'Lower the bar to mid-chest with control, press back up to lockout.',
  },
  {
    id: 'ex-2',
    name: 'Incline Dumbbell Press',
    muscle: 'Chest',
    equipment: 'Dumbbell',
    instructions:
      'Press dumbbells up and slightly inward on a 30° incline bench.',
  },
  {
    id: 'ex-3',
    name: 'Push-Up',
    muscle: 'Chest',
    equipment: 'Bodyweight',
    instructions:
      'Keep a straight line from head to heels, lower chest to just above the floor.',
  },
  {
    id: 'ex-4',
    name: 'Pull-Up',
    muscle: 'Back',
    equipment: 'Bodyweight',
    instructions:
      'Pull chin over the bar, control the descent to full extension.',
  },
  {
    id: 'ex-5',
    name: 'Barbell Row',
    muscle: 'Back',
    equipment: 'Barbell',
    instructions:
      'Hinge at the hips, row the bar to the lower ribs, squeeze shoulder blades.',
  },
  {
    id: 'ex-6',
    name: 'Lat Pulldown',
    muscle: 'Back',
    equipment: 'Cable',
    instructions:
      'Pull the bar to upper chest, lead with the elbows, avoid leaning back excessively.',
  },
  {
    id: 'ex-7',
    name: 'Back Squat',
    muscle: 'Legs',
    equipment: 'Barbell',
    instructions:
      'Sit hips back and down to parallel, drive through mid-foot to stand.',
  },
  {
    id: 'ex-8',
    name: 'Romanian Deadlift',
    muscle: 'Legs',
    equipment: 'Barbell',
    instructions:
      'Hinge at the hips with a soft knee bend, bar stays close to the legs.',
  },
  {
    id: 'ex-9',
    name: 'Walking Lunge',
    muscle: 'Legs',
    equipment: 'Dumbbell',
    instructions:
      'Step forward into a lunge, front knee tracks over the toes, alternate legs.',
  },
  {
    id: 'ex-10',
    name: 'Leg Press',
    muscle: 'Legs',
    equipment: 'Machine',
    instructions:
      'Lower the sled until knees reach 90°, press through the heels.',
  },
  {
    id: 'ex-11',
    name: 'Overhead Press',
    muscle: 'Shoulders',
    equipment: 'Barbell',
    instructions:
      'Press the bar overhead in a straight path, brace the core throughout.',
  },
  {
    id: 'ex-12',
    name: 'Lateral Raise',
    muscle: 'Shoulders',
    equipment: 'Dumbbell',
    instructions:
      'Raise arms to shoulder height with a slight elbow bend, control the descent.',
  },
  {
    id: 'ex-13',
    name: 'Face Pull',
    muscle: 'Shoulders',
    equipment: 'Cable',
    instructions:
      'Pull the rope to eye level, elbows high, focus on external rotation.',
  },
  {
    id: 'ex-14',
    name: 'Barbell Curl',
    muscle: 'Arms',
    equipment: 'Barbell',
    instructions:
      'Curl the bar without swinging, squeeze at the top, lower under control.',
  },
  {
    id: 'ex-15',
    name: 'Tricep Pushdown',
    muscle: 'Arms',
    equipment: 'Cable',
    instructions:
      'Keep elbows pinned to your sides, extend fully, control the return.',
  },
  {
    id: 'ex-16',
    name: 'Plank',
    muscle: 'Core',
    equipment: 'Bodyweight',
    instructions:
      'Keep a straight line from shoulders to ankles, brace the core, breathe steadily.',
  },
  {
    id: 'ex-17',
    name: 'Hanging Knee Raise',
    muscle: 'Core',
    equipment: 'Bodyweight',
    instructions:
      'Raise knees toward the chest without swinging, lower with control.',
  },
  {
    id: 'ex-18',
    name: 'Cable Woodchop',
    muscle: 'Core',
    equipment: 'Cable',
    instructions:
      'Rotate through the torso, pivot the back foot, keep arms extended.',
  },
  {
    id: 'ex-19',
    name: 'Kettlebell Swing',
    muscle: 'Full Body',
    equipment: 'Kettlebell',
    instructions:
      'Hinge and snap the hips forward, let momentum carry the bell to chest height.',
  },
  {
    id: 'ex-20',
    name: 'Rowing Machine',
    muscle: 'Cardio',
    equipment: 'Machine',
    instructions:
      'Drive with the legs first, lean back slightly, pull the handle to the ribs.',
  },
  {
    id: 'ex-21',
    name: 'Treadmill Intervals',
    muscle: 'Cardio',
    equipment: 'Machine',
    instructions:
      'Alternate 60s hard effort with 90s easy pace for the prescribed rounds.',
  },
  {
    id: 'ex-22',
    name: 'Battle Ropes',
    muscle: 'Cardio',
    equipment: 'Bodyweight',
    instructions:
      'Alternate large waves, keep knees soft, brace the core throughout.',
  },
]

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id)
}

// A workout "slot" pairs an exercise with prescribed sets/reps/etc — the same
// library exercise can appear in many workouts with different numbers.
export function makeSlot(exId: string, seed: number, i: number): WorkoutSlot {
  const ex = exerciseById(exId)
  const repsPool = ['6-8', '8-10', '10-12', '12-15', '15-20']
  return {
    uid: `slot-${exId}-${Math.round(seededRandom(seed + i * 3) * 100000)}`,
    exerciseId: exId,
    sets: 3 + Math.floor(seededRandom(seed + i * 5) * 2),
    reps: pick(repsPool, seed + i * 7),
    weight:
      ex && ex.equipment === 'Bodyweight'
        ? 'Bodyweight'
        : `${5 + Math.floor(seededRandom(seed + i * 11) * 15) * 5} lb`,
    rest: pick(['45s', '60s', '75s', '90s', '120s'], seed + i * 13),
    tempo: pick(['2-0-2', '3-0-1', '2-1-2', '4-0-1'], seed + i * 17),
    rpe: 6 + Math.floor(seededRandom(seed + i * 19) * 4),
    notes: '',
  }
}

export type WorkoutTemplate = {
  name: string
  muscle: string
  exerciseIds: string[]
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    name: 'Push Day — Chest & Shoulders',
    muscle: 'Push',
    exerciseIds: ['ex-1', 'ex-2', 'ex-11', 'ex-12', 'ex-15'],
  },
  {
    name: 'Pull Day — Back & Arms',
    muscle: 'Pull',
    exerciseIds: ['ex-4', 'ex-5', 'ex-6', 'ex-13', 'ex-14'],
  },
  {
    name: 'Leg Day — Lower Body',
    muscle: 'Legs',
    exerciseIds: ['ex-7', 'ex-8', 'ex-9', 'ex-10'],
  },
  {
    name: 'Core & Conditioning',
    muscle: 'Core',
    exerciseIds: ['ex-16', 'ex-17', 'ex-18', 'ex-19'],
  },
  {
    name: 'Full Body Strength',
    muscle: 'Full Body',
    exerciseIds: ['ex-7', 'ex-1', 'ex-5', 'ex-16'],
  },
  {
    name: 'Cardio & Recovery',
    muscle: 'Cardio',
    exerciseIds: ['ex-20', 'ex-21', 'ex-22'],
  },
]

export function templateMuscles(t: WorkoutTemplate): string[] {
  return [...new Set(t.exerciseIds.map((id) => exerciseById(id)?.muscle ?? ''))]
}
export function templateEquipment(t: WorkoutTemplate): string[] {
  return [
    ...new Set(t.exerciseIds.map((id) => exerciseById(id)?.equipment ?? '')),
  ]
}

export function buildWorkout(
  templateIndex: number,
  difficulty: string,
  seed: number,
): Workout {
  const t = WORKOUT_TEMPLATES[templateIndex % WORKOUT_TEMPLATES.length]
  const exercises = t.exerciseIds.map((id, i) => makeSlot(id, seed, i))
  const durationMin = 30 + Math.floor(seededRandom(seed * 1.3) * 30)
  return {
    uid: `wk-${Math.round(seededRandom(seed) * 1000000)}`,
    name: t.name,
    muscle: t.muscle,
    description: `${difficulty} ${t.muscle.toLowerCase()}-focused session — ${exercises.length} exercises.`,
    estimatedMinutes: durationMin,
    difficulty,
    caloriesBurn: 180 + Math.round(seededRandom(seed * 2.1) * 300),
    warmup:
      '5 min light cardio + dynamic stretching for the target muscle groups.',
    cooldown: '5 min static stretching, focus on the muscles trained today.',
    exercises,
  }
}

// Two normal-week splits that alternate, plus a lighter deload pattern every
// 4th week. Indexes are into WORKOUT_TEMPLATES; null = rest.
const DAY_PATTERN_A: Array<number | null> = [0, 5, 1, 5, 2, 3, null]
const DAY_PATTERN_B: Array<number | null> = [1, 5, 2, 5, 0, 4, null]
const DELOAD_DAY_PATTERN: Array<number | null> = [5, 4, null, 5, 4, null, null]

function buildWorkoutWeeks(
  durationWeeks: number,
  difficulty: string,
  seed: number,
): WorkoutWeek[] {
  return Array.from({ length: durationWeeks }, (_, wi) => {
    const weekNum = wi + 1
    const isDeload = weekNum % 4 === 0
    const pattern = isDeload
      ? DELOAD_DAY_PATTERN
      : weekNum % 2 === 1
        ? DAY_PATTERN_A
        : DAY_PATTERN_B
    const days = pattern.map((templateIdx, di) => {
      const isRest = templateIdx === null
      return {
        dayNum: di + 1,
        label: WEEKDAY_LABELS[di],
        type: isRest ? ('rest' as const) : ('workout' as const),
        workout: isRest
          ? null
          : buildWorkout(
              templateIdx,
              isDeload ? 'Light' : difficulty,
              seed * 3.1 + wi * 7.7 + di * 1.9,
            ),
      }
    })
    return { weekNum, days, isDeload }
  })
}

// ===================== Meal library =====================
export const MEAL_LIBRARY: Meal[] = [
  {
    id: 'meal-1',
    category: 'Breakfast',
    name: 'Greek Yogurt & Berry Bowl',
    calories: 320,
    protein: 28,
    carbs: 34,
    fat: 8,
    fiber: 5,
    servingSize: '1 bowl',
    prepTime: '5 min',
    ingredients: ['Greek yogurt', 'Mixed berries', 'Honey', 'Granola'],
    steps: [
      'Add yogurt to a bowl.',
      'Top with berries and granola.',
      'Drizzle honey to finish.',
    ],
  },
  {
    id: 'meal-2',
    category: 'Breakfast',
    name: 'Veggie Egg White Omelet',
    calories: 280,
    protein: 26,
    carbs: 12,
    fat: 10,
    fiber: 3,
    servingSize: '1 omelet',
    prepTime: '10 min',
    ingredients: ['Egg whites', 'Spinach', 'Bell pepper', 'Feta cheese'],
    steps: [
      'Whisk egg whites.',
      'Sauté vegetables.',
      'Pour eggs over vegetables, fold when set.',
    ],
  },
  {
    id: 'meal-3',
    category: 'Breakfast',
    name: 'Overnight Protein Oats',
    calories: 360,
    protein: 24,
    carbs: 48,
    fat: 9,
    fiber: 7,
    servingSize: '1 jar',
    prepTime: '5 min + overnight',
    ingredients: [
      'Rolled oats',
      'Protein powder',
      'Almond milk',
      'Chia seeds',
      'Banana',
    ],
    steps: [
      'Combine all ingredients in a jar.',
      'Refrigerate overnight.',
      'Stir and serve cold.',
    ],
  },
  {
    id: 'meal-4',
    category: 'Breakfast',
    name: 'Avocado Toast & Eggs',
    calories: 400,
    protein: 20,
    carbs: 32,
    fat: 20,
    fiber: 8,
    servingSize: '2 slices',
    prepTime: '10 min',
    ingredients: ['Whole grain bread', 'Avocado', 'Eggs', 'Chili flakes'],
    steps: [
      'Toast bread.',
      'Mash avocado on top.',
      'Add fried or poached eggs.',
    ],
  },
  {
    id: 'meal-5',
    category: 'Lunch',
    name: 'Grilled Chicken Quinoa Bowl',
    calories: 520,
    protein: 42,
    carbs: 48,
    fat: 14,
    fiber: 6,
    servingSize: '1 bowl',
    prepTime: '20 min',
    ingredients: [
      'Chicken breast',
      'Quinoa',
      'Mixed greens',
      'Cherry tomatoes',
      'Olive oil',
    ],
    steps: [
      'Grill chicken and slice.',
      'Cook quinoa.',
      'Combine all ingredients, drizzle with olive oil.',
    ],
  },
  {
    id: 'meal-6',
    category: 'Lunch',
    name: 'Vegan Bowl with Greens & Grain',
    calories: 470,
    protein: 18,
    carbs: 62,
    fat: 16,
    fiber: 12,
    servingSize: '1 bowl',
    prepTime: '20 min',
    ingredients: ['Chickpeas', 'Brown rice', 'Kale', 'Tahini dressing'],
    steps: [
      'Roast chickpeas.',
      'Cook rice.',
      'Toss kale with dressing and combine.',
    ],
  },
  {
    id: 'meal-7',
    category: 'Lunch',
    name: 'Turkey Wrap & Side Salad',
    calories: 450,
    protein: 34,
    carbs: 40,
    fat: 15,
    fiber: 6,
    servingSize: '1 wrap',
    prepTime: '10 min',
    ingredients: ['Whole wheat tortilla', 'Turkey breast', 'Lettuce', 'Hummus'],
    steps: [
      'Spread hummus on tortilla.',
      'Layer turkey and lettuce.',
      'Roll tightly and slice.',
    ],
  },
  {
    id: 'meal-8',
    category: 'Lunch',
    name: 'Salmon & Roasted Vegetables',
    calories: 540,
    protein: 40,
    carbs: 30,
    fat: 24,
    fiber: 7,
    servingSize: '1 plate',
    prepTime: '25 min',
    ingredients: ['Salmon fillet', 'Broccoli', 'Sweet potato', 'Lemon'],
    steps: [
      'Roast vegetables at 400°F.',
      'Pan-sear salmon.',
      'Plate together with a squeeze of lemon.',
    ],
  },
  {
    id: 'meal-9',
    category: 'Snack',
    name: 'Apple & Almond Butter',
    calories: 210,
    protein: 6,
    carbs: 24,
    fat: 11,
    fiber: 5,
    servingSize: '1 apple + 1 tbsp',
    prepTime: '2 min',
    ingredients: ['Apple', 'Almond butter'],
    steps: ['Slice apple.', 'Serve with almond butter for dipping.'],
  },
  {
    id: 'meal-10',
    category: 'Snack',
    name: 'Protein Shake',
    calories: 180,
    protein: 25,
    carbs: 10,
    fat: 3,
    fiber: 1,
    servingSize: '1 shake',
    prepTime: '2 min',
    ingredients: ['Protein powder', 'Water or milk', 'Ice'],
    steps: ['Blend all ingredients until smooth.'],
  },
  {
    id: 'meal-11',
    category: 'Snack',
    name: 'Cottage Cheese & Pineapple',
    calories: 190,
    protein: 20,
    carbs: 18,
    fat: 3,
    fiber: 2,
    servingSize: '1 cup',
    prepTime: '2 min',
    ingredients: ['Cottage cheese', 'Pineapple chunks'],
    steps: ['Combine in a bowl and serve chilled.'],
  },
  {
    id: 'meal-12',
    category: 'Snack',
    name: 'Trail Mix',
    calories: 230,
    protein: 7,
    carbs: 20,
    fat: 15,
    fiber: 4,
    servingSize: '1/4 cup',
    prepTime: '1 min',
    ingredients: [
      'Almonds',
      'Walnuts',
      'Dried cranberries',
      'Dark chocolate chips',
    ],
    steps: ['Portion into a small container.'],
  },
  {
    id: 'meal-13',
    category: 'Dinner',
    name: 'Lean Beef Stir-Fry',
    calories: 560,
    protein: 38,
    carbs: 44,
    fat: 22,
    fiber: 6,
    servingSize: '1 plate',
    prepTime: '25 min',
    ingredients: [
      'Lean beef strips',
      'Broccoli',
      'Bell pepper',
      'Brown rice',
      'Soy sauce',
    ],
    steps: [
      'Sear beef in a hot pan.',
      'Stir-fry vegetables.',
      'Combine with rice and sauce.',
    ],
  },
  {
    id: 'meal-14',
    category: 'Dinner',
    name: 'Baked Cod & Asparagus',
    calories: 420,
    protein: 36,
    carbs: 22,
    fat: 16,
    fiber: 5,
    servingSize: '1 fillet',
    prepTime: '25 min',
    ingredients: ['Cod fillet', 'Asparagus', 'Olive oil', 'Garlic', 'Lemon'],
    steps: [
      'Season cod and asparagus.',
      'Bake at 400°F for 15 min.',
      'Finish with lemon juice.',
    ],
  },
  {
    id: 'meal-15',
    category: 'Dinner',
    name: 'Lentil & Vegetable Curry',
    calories: 480,
    protein: 22,
    carbs: 60,
    fat: 14,
    fiber: 14,
    servingSize: '1 bowl',
    prepTime: '30 min',
    ingredients: [
      'Red lentils',
      'Coconut milk',
      'Curry spices',
      'Spinach',
      'Rice',
    ],
    steps: [
      'Simmer lentils with spices and coconut milk.',
      'Stir in spinach.',
      'Serve over rice.',
    ],
  },
  {
    id: 'meal-16',
    category: 'Dinner',
    name: 'Grilled Chicken & Sweet Potato',
    calories: 500,
    protein: 42,
    carbs: 38,
    fat: 16,
    fiber: 6,
    servingSize: '1 plate',
    prepTime: '25 min',
    ingredients: ['Chicken thigh', 'Sweet potato', 'Green beans', 'Herbs'],
    steps: [
      'Grill chicken with herbs.',
      'Roast sweet potato.',
      'Steam green beans, plate together.',
    ],
  },
  {
    id: 'meal-17',
    category: 'Breakfast',
    name: 'Tofu Scramble & Spinach',
    calories: 300,
    protein: 24,
    carbs: 14,
    fat: 16,
    fiber: 4,
    servingSize: '1 plate',
    prepTime: '10 min',
    ingredients: ['Firm tofu', 'Spinach', 'Turmeric', 'Cherry tomatoes'],
    steps: [
      'Crumble tofu into a hot pan.',
      'Add turmeric and vegetables.',
      'Cook until warmed through.',
    ],
  },
  {
    id: 'meal-18',
    category: 'Breakfast',
    name: 'Chia & Kiwi Pudding',
    calories: 300,
    protein: 12,
    carbs: 40,
    fat: 12,
    fiber: 10,
    servingSize: '1 jar',
    prepTime: '5 min + overnight',
    ingredients: ['Chia seeds', 'Almond milk', 'Kiwi', 'Maple syrup'],
    steps: [
      'Stir chia into almond milk.',
      'Chill overnight.',
      'Top with kiwi to serve.',
    ],
  },
  {
    id: 'meal-19',
    category: 'Lunch',
    name: 'Quinoa & Roasted Veg Bowl',
    calories: 480,
    protein: 18,
    carbs: 60,
    fat: 18,
    fiber: 9,
    servingSize: '1 bowl',
    prepTime: '25 min',
    ingredients: ['Quinoa', 'Zucchini', 'Carrot', 'Olive oil', 'Pumpkin seeds'],
    steps: [
      'Roast zucchini and carrot.',
      'Cook quinoa.',
      'Combine and top with seeds.',
    ],
  },
  {
    id: 'meal-20',
    category: 'Lunch',
    name: 'Tofu Poke Bowl',
    calories: 520,
    protein: 28,
    carbs: 62,
    fat: 14,
    fiber: 7,
    servingSize: '1 bowl',
    prepTime: '20 min',
    ingredients: ['Firm tofu', 'Sushi rice', 'Edamame', 'Cucumber', 'Sesame'],
    steps: [
      'Cube and sear tofu.',
      'Cook rice.',
      'Assemble bowl with edamame and cucumber.',
    ],
  },
  {
    id: 'meal-21',
    category: 'Snack',
    name: 'Banana & Walnuts',
    calories: 200,
    protein: 5,
    carbs: 24,
    fat: 11,
    fiber: 4,
    servingSize: '1 banana + handful',
    prepTime: '1 min',
    ingredients: ['Banana', 'Walnuts'],
    steps: ['Slice banana and serve with walnuts.'],
  },
  {
    id: 'meal-22',
    category: 'Snack',
    name: 'Rice Cakes & Sunflower Butter',
    calories: 210,
    protein: 6,
    carbs: 22,
    fat: 12,
    fiber: 3,
    servingSize: '2 cakes',
    prepTime: '2 min',
    ingredients: ['Rice cakes', 'Sunflower seed butter'],
    steps: ['Spread sunflower butter over rice cakes.'],
  },
  {
    id: 'meal-23',
    category: 'Dinner',
    name: 'Tofu & Bok Choy Stir-Fry',
    calories: 520,
    protein: 30,
    carbs: 58,
    fat: 16,
    fiber: 8,
    servingSize: '1 plate',
    prepTime: '25 min',
    ingredients: ['Firm tofu', 'Bok choy', 'Carrot', 'Tamari', 'Brown rice'],
    steps: [
      'Sear tofu until golden.',
      'Stir-fry vegetables with tamari.',
      'Serve over brown rice.',
    ],
  },
  {
    id: 'meal-24',
    category: 'Dinner',
    name: 'Baked Tempeh & Quinoa',
    calories: 500,
    protein: 34,
    carbs: 50,
    fat: 16,
    fiber: 10,
    servingSize: '1 plate',
    prepTime: '30 min',
    ingredients: ['Tempeh', 'Quinoa', 'Green beans', 'Olive oil'],
    steps: [
      'Bake seasoned tempeh.',
      'Cook quinoa.',
      'Steam green beans and plate together.',
    ],
  },
]

export function mealsByCategory(cat: MealSlot): Meal[] {
  return MEAL_LIBRARY.filter((m) => m.category === cat)
}
export function mealById(id: string): Meal | undefined {
  return MEAL_LIBRARY.find((m) => m.id === id)
}

function buildDietWeekSlots(
  seed: number,
): Array<{ dayNum: number; label: string; meals: Record<string, string> }> {
  return WEEKDAY_LABELS.map((label, di) => {
    const meals: Record<string, string> = {}
    MEAL_SLOTS.forEach((slot, si) => {
      const pool = mealsByCategory(slot)
      meals[slot.toLowerCase()] = pick(pool, seed * (si + 2) + di * 3.3).id
    })
    return { dayNum: di + 1, label, meals }
  })
}

const DEFAULT_MEAL_TIMES: Record<string, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  snack: '16:30',
  dinner: '20:00',
}
let MEAL_ENTRY_SEQ = 1
export function newMealEntry(
  mealId: string,
  slot: MealSlot,
  time?: string,
): MealEntry {
  return {
    uid: 'meal-' + MEAL_ENTRY_SEQ++ + '-' + Math.round(Math.random() * 1e6),
    mealId,
    slot,
    time: time || DEFAULT_MEAL_TIMES[slot.toLowerCase()] || '12:00',
  }
}
function toMealEntries(mealsObj: Record<string, string>): MealEntry[] {
  return MEAL_SLOTS.filter((slot) => mealsObj[slot.toLowerCase()]).map((slot) =>
    newMealEntry(mealsObj[slot.toLowerCase()], slot),
  )
}
export function formatTime12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${period}`
}
function buildDietWeekEntries(seed: number): DietDay[] {
  return buildDietWeekSlots(seed).map((day) => ({
    dayNum: day.dayNum,
    label: day.label,
    meals: toMealEntries(day.meals),
  }))
}
function buildDietWeeks(durationWeeks: number, seed: number): DietWeek[] {
  return Array.from({ length: durationWeeks }, (_, wi) => ({
    weekNum: wi + 1,
    days: buildDietWeekEntries(seed + wi * 517),
  }))
}
export function dietDayTotals(day: DietDay): MealTotals {
  return day.meals.reduce(
    (acc, entry) => {
      const meal = mealById(entry.mealId)
      if (!meal) return acc
      acc.calories += meal.calories
      acc.protein += meal.protein
      acc.carbs += meal.carbs
      acc.fat += meal.fat
      acc.fiber += meal.fiber || 0
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  )
}

// ===================== Programs =====================
const PROGRAM_NAME_POOL: Record<ProgramGoal, string[]> = {
  'Fat Loss': [
    '12-Week Fat Loss Reset',
    'Lean & Strong Fat Loss',
    'Metabolic Fat Burn Program',
  ],
  'Muscle Gain': [
    'Progressive Muscle Builder',
    'Hypertrophy Foundations',
    'Mass Gain Blueprint',
  ],
  Bulk: ['Clean Bulk Program', 'Strength & Size Bulk', 'Off-Season Bulk Plan'],
  PCOS: [
    'PCOS Balance & Strength',
    'PCOS-Friendly Reset',
    'Hormone Balance Program',
  ],
  Diabetes: [
    'Diabetes-Friendly Fitness',
    'Blood Sugar Balance Plan',
    'Metabolic Health Program',
  ],
  'General Fitness': [
    'General Wellness Starter',
    'Total Body Fitness',
    'Everyday Strength & Mobility',
  ],
}

// Builds the single global program. There is only ever one — per-user
// assignment/progress now lives entirely in the Users section, so this no
// longer generates a members roster.
export function buildProgram(index: number): TrainingProgram {
  const seed = (index + 1) * 23.7 + 11
  const goal = pick(PROGRAM_GOALS, seed * 1.1)
  const difficulty = pick(PROGRAM_DIFFICULTIES, seed * 2.3)
  const durationWeeks = pick(PROGRAM_DURATIONS, seed * 3.7)
  const coach = pick(COACH_NAMES, seed * 4.1)
  const createdDate = daysAgo(Math.floor(30 + seededRandom(seed * 6.3) * 300))
  const updatedDate = daysAgo(Math.floor(seededRandom(seed * 7.1) * 20))

  return {
    id: `prog-${index + 1}`,
    name: pick(PROGRAM_NAME_POOL[goal], seed * 16.1),
    description: `A ${durationWeeks}-week ${difficulty.toLowerCase()} program combining structured training and nutrition guidance for ${goal.toLowerCase()} goals.`,
    goal,
    difficulty,
    durationWeeks,
    coach,
    enabled: true,
    createdDate,
    updatedDate,
    version: `v1.${Math.floor(seededRandom(seed * 17) * 4)}`,
    members: [],
    activeUsers: 0,
    completionRate: 0,
    workoutWeeks: buildWorkoutWeeks(durationWeeks, difficulty, seed),
    dietWeeks: buildDietWeeks(durationWeeks, seed),
    nutritionTargets: {
      calories: 1800 + Math.round(seededRandom(seed * 18) * 800),
      protein: 120 + Math.round(seededRandom(seed * 19) * 60),
      carbs: 150 + Math.round(seededRandom(seed * 20) * 100),
      fat: 50 + Math.round(seededRandom(seed * 21) * 40),
      water: 2 + Math.round(seededRandom(seed * 22) * 2),
    },
    notes: [],
    activity: [],
    versionHistory: [],
  }
}

// ===================== Empty week builders =====================
export function buildEmptyWorkoutWeek(weekNum: number): WorkoutWeek {
  return {
    weekNum,
    days: WEEKDAY_LABELS.map((label, di) => ({
      dayNum: di + 1,
      label,
      type: 'rest',
      workout: null,
    })),
  }
}
export function buildEmptyDietWeek(weekNum: number): DietWeek {
  return {
    weekNum,
    days: WEEKDAY_LABELS.map((label, di) => ({
      dayNum: di + 1,
      label,
      meals: [],
    })),
  }
}
export function buildEmptyWorkoutWeeks(durationWeeks: number): WorkoutWeek[] {
  return Array.from({ length: durationWeeks }, (_, i) =>
    buildEmptyWorkoutWeek(i + 1),
  )
}
export function buildEmptyDietWeeks(durationWeeks: number): DietWeek[] {
  return Array.from({ length: durationWeeks }, (_, i) =>
    buildEmptyDietWeek(i + 1),
  )
}

// ===================== Session persistence =====================
// No backend — the seeded array would otherwise regenerate on every load. Mirror
// it into localStorage after every mutation and restore it on the next load.
const PROGRAMS_STORAGE_KEY = 'nourish_training_programs'
const PROGRAM_DATE_KEYS = ['createdDate', 'updatedDate', 'assignedDate']

function reviveProgramDates(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(reviveProgramDates)
    return
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    Object.keys(obj).forEach((k) => {
      if (PROGRAM_DATE_KEYS.includes(k) && typeof obj[k] === 'string') {
        obj[k] = new Date(obj[k] as string)
      } else {
        reviveProgramDates(obj[k])
      }
    })
  }
}

export function saveTrainingPrograms(programs: TrainingProgram[]): void {
  try {
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs))
  } catch {
    /* storage unavailable — edits just won't survive a reload */
  }
}

function loadStoredPrograms(): TrainingProgram[] | null {
  try {
    const raw = localStorage.getItem(PROGRAMS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    reviveProgramDates(parsed)
    return parsed as TrainingProgram[]
  } catch {
    return null
  }
}

// There is only ever one program.
export function seedTrainingPrograms(): TrainingProgram[] {
  return [buildProgram(0)]
}

// The session's program — restored from localStorage or freshly seeded.
// Only the first entry is ever used; a browser that still has an old
// multi-program array (or a pre-`enabled` entry) falls back safely.
const restoredPrograms = loadStoredPrograms()
export const TRAINING_PROGRAMS: TrainingProgram[] = restoredPrograms?.length
  ? [{ ...restoredPrograms[0], enabled: restoredPrograms[0].enabled ?? true }]
  : seedTrainingPrograms()
