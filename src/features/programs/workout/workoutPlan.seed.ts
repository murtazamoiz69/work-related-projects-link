// The authored content behind the workout plan.
//
// The programme ships four authored days (Day 1–4); the nutritionist adds more
// with "Add day" and fills them in, and Days 5–7 already exist but start blank
// for the same reason. Each day's coach-facing name ("Push Day") is folded into
// the body as a heading, since the day itself is identified only by its number
// now.
import { type WorkoutDay, type WorkoutDayType } from './workoutPlan.types'

type Movement = {
  name: string
  /** Sets x reps, or a duration for cardio. */
  prescription: string
  /** Rest, tempo or a coaching cue — whatever matters for this movement. */
  note: string
}

type DaySpec = {
  label: string
  type: WorkoutDayType
  /** One line under the title saying what the day is for. */
  intent: string
  warmup: string[]
  main: Movement[]
  finisher: string[]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** One movement as a list item: the name, the prescription, then the note. */
function movementHtml(m: Movement): string {
  return (
    `<li><strong>${escapeHtml(m.name)}</strong> — ${escapeHtml(m.prescription)}` +
    ` &middot; ${escapeHtml(m.note)}</li>`
  )
}

function dayBody(spec: DaySpec): string {
  const parts = [
    `<h2>${escapeHtml(spec.label)}</h2>`,
    `<p><em>${escapeHtml(spec.intent)}</em></p>`,
  ]
  if (spec.warmup.length) {
    parts.push('<h3>Warm-up</h3>')
    parts.push(
      `<ul>${spec.warmup.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul>`,
    )
  }
  if (spec.main.length) {
    parts.push('<h3>Main set</h3>')
    parts.push(`<ul>${spec.main.map(movementHtml).join('')}</ul>`)
  }
  if (spec.finisher.length) {
    parts.push('<h3>Finish</h3>')
    parts.push(
      `<ul>${spec.finisher.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`,
    )
  }
  return parts.join('')
}

// Monday through Sunday. A fat-loss week: three lifting days, two cardio days,
// two days off — enough training to hold muscle through a deficit without
// making the week impossible to keep to.
const WEEK_ONE: DaySpec[] = [
  {
    label: 'Push Day',
    type: 'workout',
    intent:
      'Chest, shoulders and triceps. Leave one rep in reserve on the top set.',
    warmup: [
      '5 min easy cycle or brisk walk',
      'Band pull-aparts — 2 x 15',
      'Push-ups — 1 x 10, slow',
    ],
    main: [
      {
        name: 'Barbell Bench Press',
        prescription: '4 x 8',
        note: '90s rest',
      },
      {
        name: 'Seated Dumbbell Shoulder Press',
        prescription: '3 x 10',
        note: '75s rest',
      },
      {
        name: 'Incline Dumbbell Press',
        prescription: '3 x 12',
        note: 'Control the lowering, 3 seconds',
      },
      {
        name: 'Cable Lateral Raise',
        prescription: '3 x 15',
        note: 'Light, no swinging',
      },
      {
        name: 'Rope Triceps Pushdown',
        prescription: '3 x 15',
        note: '45s rest',
      },
    ],
    finisher: ['Chest and shoulder stretch — 3 min'],
  },
  {
    label: 'Zone 2 Cardio',
    type: 'cardio',
    intent:
      'Easy, conversational pace. This is recovery that happens to burn calories.',
    warmup: ['5 min walk, building pace'],
    main: [
      {
        name: 'Treadmill Incline Walk',
        prescription: '35 min',
        note: 'Incline 6-8%, heart rate 120-135',
      },
    ],
    finisher: ['Calf and hip flexor stretch — 5 min'],
  },
  {
    label: 'Pull Day',
    type: 'workout',
    intent: 'Back and biceps. Pull with the elbows, not the hands.',
    warmup: ['5 min rowing machine', 'Scapular pull-ups — 2 x 8'],
    main: [
      {
        name: 'Lat Pulldown',
        prescription: '4 x 10',
        note: '90s rest',
      },
      {
        name: 'Seated Cable Row',
        prescription: '4 x 10',
        note: 'Squeeze for a count at the back',
      },
      {
        name: 'Dumbbell Single-Arm Row',
        prescription: '3 x 12 each side',
        note: '60s rest',
      },
      {
        name: 'Face Pull',
        prescription: '3 x 15',
        note: 'Shoulder health — do not skip',
      },
      {
        name: 'Dumbbell Hammer Curl',
        prescription: '3 x 12',
        note: '45s rest',
      },
    ],
    finisher: ['Dead hang — 2 x 30s'],
  },
  {
    label: 'Rest Day',
    type: 'rest',
    intent: 'Nothing structured. Movement is welcome, training is not.',
    warmup: [],
    main: [],
    finisher: [
      '8,000 steps if the day allows it',
      '10 min mobility — hips and thoracic spine',
      'Sleep is the session today',
    ],
  },
  {
    label: 'Leg Day',
    type: 'workout',
    intent: 'The hardest session of the week. Eat before it.',
    warmup: [
      '5 min bike',
      'Bodyweight squats — 2 x 15',
      'Glute bridges — 2 x 12',
    ],
    main: [
      {
        name: 'Barbell Back Squat',
        prescription: '4 x 8',
        note: '2 min rest',
      },
      {
        name: 'Romanian Deadlift',
        prescription: '3 x 10',
        note: 'Hinge, flat back, feel the hamstrings',
      },
      {
        name: 'Walking Lunge',
        prescription: '3 x 12 each leg',
        note: '75s rest',
      },
      {
        name: 'Seated Leg Curl',
        prescription: '3 x 15',
        note: '60s rest',
      },
      {
        name: 'Standing Calf Raise',
        prescription: '4 x 15',
        note: 'Pause at the top',
      },
    ],
    finisher: ['Quad and hamstring stretch — 5 min'],
  },
  {
    label: 'HIIT Cardio',
    type: 'cardio',
    intent: 'Short and genuinely hard. Stop if form breaks down.',
    warmup: ['5 min easy row or bike'],
    main: [
      {
        name: 'Rowing Intervals',
        prescription: '8 x 250 m',
        note: '90s easy row between efforts',
      },
      {
        name: 'Kettlebell Swing',
        prescription: '3 x 20',
        note: 'Hips, not arms — 60s rest',
      },
    ],
    finisher: ['5 min walk to bring the heart rate down'],
  },
  {
    label: 'Rest Day',
    type: 'rest',
    intent: 'Full day off. Prep meals for the week ahead.',
    warmup: [],
    main: [],
    finisher: ['A walk if you feel like one', 'Weigh in tomorrow morning'],
  },
]

/** Days beyond this one start blank, same as a freshly added day — the
 *  programme ships a partly-authored week so an unauthored day's empty state
 *  is visible from the start, not just after someone adds one. */
const AUTHORED_DAYS = 4

/** The programme's starting days (Day 1–7): the first four authored, the rest
 *  blank and ready to write. */
export function buildSeedDays(): WorkoutDay[] {
  return WEEK_ONE.map((spec, i) =>
    i < AUTHORED_DAYS
      ? { dayNum: i + 1, type: spec.type, body: dayBody(spec) }
      : { dayNum: i + 1, type: 'rest' as WorkoutDayType, body: '' },
  )
}

/** A freshly added day: a rest day with no session, ready to author. */
export function buildBlankDay(dayNum: number): WorkoutDay {
  return { dayNum, type: 'rest' as WorkoutDayType, body: '' }
}
