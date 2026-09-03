// The authored content behind the workout plan.
//
// Only **week 1** ships written, for the same reason the diet sheet does: the
// nutritionist builds one week, copies it forward with Duplicate, then varies
// it. Seeding all six would be six near-identical weeks nobody had decided on,
// and would hide which weeks have actually been thought about.
import {
  WEEKDAY_NAMES,
  type WorkoutDaySheet,
  type WorkoutDayType,
} from './workoutPlan.types'

/** Exercise demo videos. Mock links — a real deployment points these at the
 *  video library, and the nutritionist can paste any URL in the editor. */
const VIDEO_BASE = 'https://videos.nourishwithsim.com/exercise'

type Movement = {
  name: string
  /** Sets x reps, or a duration for cardio. */
  prescription: string
  /** Rest, tempo or a coaching cue — whatever matters for this movement. */
  note: string
  /** Slug for the demo video. */
  slug: string
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

/** One movement as a list item: what to do, then the demo video beside it. The
 *  link is a real anchor rather than bare text so it survives the editor's
 *  round trip and stays clickable for whoever reads the plan. */
function movementHtml(m: Movement): string {
  const href = `${VIDEO_BASE}/${m.slug}`
  return (
    `<li><strong>${escapeHtml(m.name)}</strong> — ${escapeHtml(m.prescription)}` +
    ` &middot; ${escapeHtml(m.note)} &middot; ` +
    `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Watch demo</a></li>`
  )
}

function dayBody(spec: DaySpec): string {
  const parts = [`<p><em>${escapeHtml(spec.intent)}</em></p>`]
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
        slug: 'barbell-bench-press',
      },
      {
        name: 'Seated Dumbbell Shoulder Press',
        prescription: '3 x 10',
        note: '75s rest',
        slug: 'dumbbell-shoulder-press',
      },
      {
        name: 'Incline Dumbbell Press',
        prescription: '3 x 12',
        note: 'Control the lowering, 3 seconds',
        slug: 'incline-dumbbell-press',
      },
      {
        name: 'Cable Lateral Raise',
        prescription: '3 x 15',
        note: 'Light, no swinging',
        slug: 'cable-lateral-raise',
      },
      {
        name: 'Rope Triceps Pushdown',
        prescription: '3 x 15',
        note: '45s rest',
        slug: 'rope-triceps-pushdown',
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
        slug: 'incline-treadmill-walk',
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
        slug: 'lat-pulldown',
      },
      {
        name: 'Seated Cable Row',
        prescription: '4 x 10',
        note: 'Squeeze for a count at the back',
        slug: 'seated-cable-row',
      },
      {
        name: 'Dumbbell Single-Arm Row',
        prescription: '3 x 12 each side',
        note: '60s rest',
        slug: 'single-arm-dumbbell-row',
      },
      {
        name: 'Face Pull',
        prescription: '3 x 15',
        note: 'Shoulder health — do not skip',
        slug: 'face-pull',
      },
      {
        name: 'Dumbbell Hammer Curl',
        prescription: '3 x 12',
        note: '45s rest',
        slug: 'hammer-curl',
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
        slug: 'barbell-back-squat',
      },
      {
        name: 'Romanian Deadlift',
        prescription: '3 x 10',
        note: 'Hinge, flat back, feel the hamstrings',
        slug: 'romanian-deadlift',
      },
      {
        name: 'Walking Lunge',
        prescription: '3 x 12 each leg',
        note: '75s rest',
        slug: 'walking-lunge',
      },
      {
        name: 'Seated Leg Curl',
        prescription: '3 x 15',
        note: '60s rest',
        slug: 'seated-leg-curl',
      },
      {
        name: 'Standing Calf Raise',
        prescription: '4 x 15',
        note: 'Pause at the top',
        slug: 'standing-calf-raise',
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
        slug: 'rowing-intervals',
      },
      {
        name: 'Kettlebell Swing',
        prescription: '3 x 20',
        note: 'Hips, not arms — 60s rest',
        slug: 'kettlebell-swing',
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

/** Week 1, authored. */
export function buildWeekOneDays(): WorkoutDaySheet[] {
  return WEEK_ONE.map((spec, i) => ({
    dayNum: i + 1,
    label: spec.label,
    type: spec.type,
    body: dayBody(spec),
  }))
}

/** An unauthored week: seven days with no name and no session. */
export function buildBlankDays(): WorkoutDaySheet[] {
  return WEEKDAY_NAMES.map((_, i) => ({
    dayNum: i + 1,
    label: '',
    type: 'rest' as WorkoutDayType,
    body: '',
  }))
}

export function buildMasterWeeks(
  durationWeeks: number,
): { weekNum: number; days: WorkoutDaySheet[] }[] {
  const out: { weekNum: number; days: WorkoutDaySheet[] }[] = []
  for (let w = 1; w <= durationWeeks; w++) {
    out.push({
      weekNum: w,
      days: w === 1 ? buildWeekOneDays() : buildBlankDays(),
    })
  }
  return out
}
