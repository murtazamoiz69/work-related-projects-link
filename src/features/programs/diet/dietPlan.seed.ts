// Seed content for the master diet sheets — one per (week, calorie band).
//
// The body is authored HTML because that is what the rich-text editor round
// trips and what the AI engine reads. It is generated rather than hand-written
// five times over: the slot structure is identical across bands, and only the
// portions scale, so writing it once and scaling the numbers keeps the bands
// consistent with each other (a 1200 sheet is genuinely the 2000 sheet at
// smaller portions, which is what a nutritionist would expect).
import { CALORIE_BANDS, type CalorieBand } from './dietPlan.types'

/** The day, slot by slot. Portions are given for the 1600 kcal reference band
 *  and scaled per band below. `must` marks a non-negotiable. */
type SlotSpec = {
  slot: string
  time: string
  must?: string
  /** Portion-based options that hit the same macro target. */
  options: string[]
  note?: string
}

const REFERENCE_BAND = 1600

const DAY_SPEC: SlotSpec[] = [
  {
    slot: 'Waking up',
    time: '6:30 – 7:00 AM',
    must: '500 ml warm water with half a lime',
    options: ['5 soaked almonds', '2 soaked walnuts', '1 tsp soaked chia'],
    note: 'Before anything else. Sets hydration for the day.',
  },
  {
    slot: 'Pre-breakfast',
    time: '7:30 AM',
    options: [
      '1 small apple (100 g)',
      '1 guava (100 g)',
      '1 cup papaya (150 g)',
      '10 g roasted chana',
    ],
    note: 'Skip on training mornings — go straight to pre-workout.',
  },
  {
    slot: 'Pre-workout',
    time: '8:00 AM',
    options: [
      '1 banana (80 g)',
      '2 dates + black coffee',
      '30 g oats with water',
    ],
    note: '30–45 minutes before training. Training days only.',
  },
  {
    slot: 'Breakfast',
    time: '9:00 – 9:30 AM',
    must: 'Protein source + complex carb + 1 serving vegetables',
    options: [
      'Protein — 3 whole eggs / 150 g paneer / 200 g tofu / 150 g curd / 1 scoop whey',
      'Carb — 60 g oats / 2 multigrain rotis / 2 idli / 60 g poha (raw weight)',
      'Veg — 1 cup sautéed spinach, tomato, onion or a mixed salad',
    ],
  },
  {
    slot: 'Mid-morning',
    time: '11:30 AM',
    options: [
      '1 cup buttermilk',
      '150 g curd',
      '1 cup green tea + 15 g mixed seeds',
    ],
  },
  {
    slot: 'Lunch',
    time: '1:30 – 2:00 PM',
    must: 'Protein + carb + 2 servings vegetables + salad first',
    options: [
      'Protein — 150 g chicken breast / 150 g fish / 200 g rajma or chole (cooked) / 200 g tofu / 150 g paneer',
      'Carb — 80 g rice (raw) / 2 rotis / 80 g millet',
      'Veg — 2 cups of any seasonal sabzi, no cream',
      'Fat — 1 tsp ghee or 1 tsp cold-pressed oil',
    ],
    note: 'Eat the salad before the meal — it blunts the glucose spike.',
  },
  {
    slot: 'Evening snack',
    time: '5:00 PM',
    options: [
      '1 cup sprouts chaat (100 g)',
      '2 egg whites',
      '30 g roasted makhana',
      '1 scoop whey in water',
    ],
  },
  {
    slot: 'Dinner',
    time: '8:00 – 8:30 PM',
    must: 'Protein + vegetables. Keep the carb light.',
    options: [
      'Protein — 150 g chicken / 150 g fish / 150 g paneer / 200 g tofu / 200 g dal (cooked)',
      'Carb — 1 roti or 50 g rice (raw), optional',
      'Veg — 2 cups steamed or stir-fried',
    ],
    note: 'Finish at least two hours before bed.',
  },
  {
    slot: 'Before bed',
    time: '10:30 PM',
    options: ['1 cup chamomile tea', '150 ml warm toned milk with cinnamon'],
  },
]

/** Portions scale with the band; the slots and the structure do not. */
function scalePortion(text: string, band: CalorieBand): string {
  const factor = band / REFERENCE_BAND
  return text.replace(/(\d+(?:\.\d+)?)\s?(g|ml)\b/g, (_m, nRaw, unit) => {
    const n = Number(nRaw)
    // Round grams to the nearest 5 and millilitres to the nearest 10 so the
    // scaled numbers still read like something a person would measure.
    const scaled = n * factor
    const step = unit === 'ml' ? 10 : 5
    return `${Math.max(step, Math.round(scaled / step) * step)} ${unit}`
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function slotHtml(spec: SlotSpec, band: CalorieBand): string {
  const parts: string[] = [
    `<h3>${escapeHtml(spec.slot)} — ${escapeHtml(spec.time)}</h3>`,
  ]
  if (spec.must) {
    parts.push(
      `<p><strong>Must have:</strong> ${escapeHtml(scalePortion(spec.must, band))}</p>`,
    )
  }
  parts.push('<p><em>Choose any one:</em></p>')
  parts.push(
    `<ul>${spec.options
      .map((o) => `<li>${escapeHtml(scalePortion(o, band))}</li>`)
      .join('')}</ul>`,
  )
  if (spec.note) parts.push(`<p><em>${escapeHtml(spec.note)}</em></p>`)
  return parts.join('')
}

/** Macro split for the band — a straightforward fat-loss template. */
function macroLine(band: CalorieBand): string {
  const protein = Math.round((band * 0.3) / 4)
  const carbs = Math.round((band * 0.4) / 4)
  const fat = Math.round((band * 0.3) / 9)
  return (
    `<p><strong>Daily target:</strong> ${band} kcal &middot; ` +
    `Protein ${protein} g &middot; Carbs ${carbs} g &middot; Fat ${fat} g &middot; ` +
    `Water 3 L</p>`
  )
}

export function buildMasterSheetBody(
  weekNum: number,
  band: CalorieBand,
): string {
  const intro =
    weekNum === 1
      ? '<p>Week 1 is about settling into the slots and the portion sizes. ' +
        'Weigh food raw where a weight is given.</p>'
      : `<p>Week ${weekNum} keeps the same structure. Hold the portions ` +
        'steady and let training drive the deficit.</p>'

  return [
    `<h2>Diwali Glow — Week ${weekNum} &middot; ${band} kcal</h2>`,
    macroLine(band),
    intro,
    ...DAY_SPEC.map((spec) => slotHtml(spec, band)),
    '<h3>Non-negotiables</h3>',
    '<ul>' +
      '<li>3 litres of water across the day.</li>' +
      '<li>No sugar-sweetened drinks, no fried snacks.</li>' +
      '<li>7 hours of sleep — the deficit does not work without it.</li>' +
      '</ul>',
  ].join('')
}

/** Every master sheet: one per week per band.
 *
 *  Only the **first half of the programme** ships with content. The programme
 *  runs one plan throughout, so the nutritionist authors the early weeks for a
 *  band and carries them forward with Save's apply-to-weeks — seeding every
 *  week would mean six copies to keep in sync and would hide whether a week
 *  has actually been reviewed. The remaining weeks start blank. */
export function buildMasterSheets(
  durationWeeks: number,
): { weekNum: number; band: CalorieBand; body: string }[] {
  const authoredWeeks = Math.ceil(durationWeeks / 2)
  const out: { weekNum: number; band: CalorieBand; body: string }[] = []
  for (let w = 1; w <= durationWeeks; w++) {
    for (const band of CALORIE_BANDS) {
      out.push({
        weekNum: w,
        band,
        body: w <= authoredWeeks ? buildMasterSheetBody(w, band) : '',
      })
    }
  }
  return out
}
