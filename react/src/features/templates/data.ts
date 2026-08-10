// Templates data model — ported from V2's templates-data.js. Reuses the seeded
// helpers and CLIENTS_DATA so the same person/template reads consistently
// everywhere in the prototype. The array is generated once and mirrored into
// localStorage after every mutation (guarded in try/catch) so creating/editing
// a template survives a navigation between the library and the workspace.
import { daysAgo, pick, seededRandom } from '@/lib/seed'
import { CLIENTS_DATA } from '@/features/clients'
import type { PollContent, Template, TemplateVariable } from './types'

let pollOptionSeq = 0
export function newPollOption(text = ''): { id: string; text: string } {
  pollOptionSeq += 1
  return { id: `poll-opt-${Date.now()}-${pollOptionSeq}`, text }
}

// Every template carries a `poll` slot even when it's a 'message' template —
// keeps the shape uniform so switching Template Type in the editor never has
// to conjure the field from nothing.
export function defaultPoll(): PollContent {
  return {
    question: '',
    optionType: 'single',
    options: [newPollOption(), newPollOption()],
  }
}

// Categories seed a mutable list (nutritionists can add their own from the
// Create/Edit screen) — the live list lives in the store; this is the default.
export const DEFAULT_TEMPLATE_CATEGORIES = [
  'Welcome',
  'Motivation',
  'Workout',
  'Diet',
  'Reminder',
  'Appointment',
  'Broadcast',
  'Payment',
  'General',
]

export const TEMPLATE_CATEGORY_ICON: Record<string, string> = {
  Welcome: 'hand',
  Motivation: 'flame',
  Workout: 'dumbbell',
  Diet: 'utensils',
  Reminder: 'bell',
  Appointment: 'calendar-clock',
  Broadcast: 'megaphone',
  Payment: 'credit-card',
  General: 'file-text',
}

// Icon for a category, falling back to a generic tag for user-added ones.
export function categoryIcon(category: string): string {
  return TEMPLATE_CATEGORY_ICON[category] ?? 'tag'
}

export const TEMPLATE_COVER_GRADIENTS = [
  'linear-gradient(135deg,#2F5D50,#16302A)',
  'linear-gradient(135deg,#3B6FA6,#1F3B5C)',
  'linear-gradient(135deg,#C44F3F,#7A362C)',
  'linear-gradient(135deg,#7A5AA8,#40305C)',
  'linear-gradient(135deg,#A3672E,#7A4E22)',
  'linear-gradient(135deg,#39816E,#1E4A3E)',
  'linear-gradient(135deg,#AF5688,#652F4E)',
  'linear-gradient(135deg,#55789D,#2E415C)',
]

export const TEMPLATE_AUTHORS = [
  'Sarah Nolan',
  'James Okoro, RD',
  'Priya Anand',
]

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: '{{User Name}}', label: 'User Name', sample: 'Priya' },
  { key: '{{Coach Name}}', label: 'Coach Name', sample: 'Sarah' },
  { key: '{{Goal}}', label: 'Goal', sample: 'lose fat' },
  { key: '{{Current Weight}}', label: 'Current Weight', sample: '68 kg' },
  {
    key: '{{Program Name}}',
    label: 'Program Name',
    sample: '12-Week Weight Loss Kickstart',
  },
  {
    key: "{{Today's Workout}}",
    label: "Today's Workout",
    sample: 'Leg Day — Lower Body',
  },
  {
    key: "{{Today's Calories}}",
    label: "Today's Calories",
    sample: '1,850 kcal',
  },
]

// A minimal HTML-escape for building the highlight/preview HTML strings that get
// injected via dangerouslySetInnerHTML. JSX auto-escapes elsewhere.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function extractTemplateVariables(html: string): string[] {
  const matches = html.match(/\{\{[^}]+\}\}/g) || []
  return Array.from(new Set(matches))
}

export function renderTemplateWithSampleData(html: string): string {
  let out = html
  TEMPLATE_VARIABLES.forEach((v) => {
    out = out.split(v.key).join(v.sample)
  })
  return out
}

// Highlights any remaining {{Variable}} placeholders as chips — used when
// rendering a template's stored content for read-only display/preview.
export function highlightTemplateVariables(html: string): string {
  return html.replace(
    /\{\{[^}]+\}\}/g,
    (m) => `<span class="var-chip">${escapeHtml(m)}</span>`,
  )
}

export function stripHtmlToText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || '').replace(/\s+/g, ' ').trim()
}

// ===================== Seed content =====================
type TemplateSeed = {
  title: string
  category: string
  desc: string
  content: string
}

const TEMPLATE_SEED: TemplateSeed[] = [
  {
    title: 'Welcome Message',
    category: 'Welcome',
    desc: 'Sent the moment a new user signs up.',
    content: `<p>Hi {{User Name}} 👋</p><p>Welcome to <strong>{{Program Name}}</strong>! I'm {{Coach Name}}, and I'll be your nutritionist for this journey. I'm really excited to help you work toward {{Goal}}.</p><p>I'll check in regularly, but feel free to message me anytime — no question is too small.</p>`,
  },
  {
    title: 'Diet Reminder',
    category: 'Diet',
    desc: "Nudge for users who haven't logged a meal today.",
    content: `<p>Hey {{User Name}}, just a friendly reminder to log today's meals when you get a chance 🥗</p><p>Your target for today is <strong>{{Today's Calories}}</strong> — staying consistent with logging really helps us fine-tune {{Program Name}} for you.</p>`,
  },
  {
    title: 'Water Reminder',
    category: 'Reminder',
    desc: 'Gentle hydration nudge.',
    content: `<p>Quick reminder to stay on top of your water intake today, {{User Name}} 💧</p><p>Small habit, big impact on {{Goal}} — keep a bottle nearby!</p>`,
  },
  {
    title: 'Workout Motivation',
    category: 'Motivation',
    desc: 'Pre-workout pep talk.',
    content: `<p>Today's session: <strong>{{Today's Workout}}</strong> 💪</p><p>You've got this, {{User Name}} — every workout is a step closer to {{Goal}}. Let me know how it goes!</p>`,
  },
  {
    title: 'Weekly Check-in',
    category: 'Reminder',
    desc: 'Prompt for the weekly progress check-in.',
    content: `<p>Hi {{User Name}}, it's time for your weekly check-in on {{Program Name}} 📋</p><p>How has this week felt overall? Let me know your current weight ({{Current Weight}} last time) and anything that's been tricky.</p>`,
  },
  {
    title: 'Congratulations',
    category: 'Motivation',
    desc: 'Celebrate a milestone or goal hit.',
    content: `<p>🎉 Huge congratulations, {{User Name}}!</p><p>You're making fantastic progress toward {{Goal}} — I'm really proud of the consistency you've shown on {{Program Name}}. Keep it up!</p>`,
  },
  {
    title: 'Progress Reminder',
    category: 'Reminder',
    desc: 'Ask for an updated progress photo or weigh-in.',
    content: `<p>Hey {{User Name}}, could you log an updated weigh-in when you get a chance?</p><p>Last recorded was {{Current Weight}} — tracking regularly helps us keep {{Program Name}} dialed in for {{Goal}}.</p>`,
  },
  {
    title: 'Payment Reminder',
    category: 'Payment',
    desc: 'Friendly billing reminder.',
    content: `<p>Hi {{User Name}}, just a heads up that your payment for {{Program Name}} is coming up.</p><p>Let me know if you'd like to adjust your plan or have any billing questions — happy to help!</p>`,
  },
  {
    title: 'Appointment Reminder',
    category: 'Appointment',
    desc: 'Upcoming call or session reminder.',
    content: `<p>Reminder: you've got a check-in call scheduled with {{Coach Name}} soon, {{User Name}} 📅</p><p>Come with any questions about {{Program Name}} — see you then!</p>`,
  },
  {
    title: 'Plan Renewal',
    category: 'Payment',
    desc: 'Prompt users to renew an expiring plan.',
    content: `<p>Hi {{User Name}}, your plan on {{Program Name}} is wrapping up soon.</p><p>You've made great progress toward {{Goal}} — want to renew and keep the momentum going?</p>`,
  },
  {
    title: 'Missed Check-in Follow-up',
    category: 'Reminder',
    desc: 'Re-engage a user who has gone quiet.',
    content: `<p>Hey {{User Name}}, haven't heard from you in a bit — just checking in!</p><p>No pressure at all, just want to make sure {{Program Name}} is still working for you and see how {{Goal}} is going.</p>`,
  },
  {
    title: 'New Program Announcement',
    category: 'Broadcast',
    desc: 'Broadcast a new program launch to your caseload.',
    content: `<p>📣 Exciting news — we just launched a new program!</p><p>If {{Goal}} is on your radar, this could be a great fit. Reply here or check the Programs tab to learn more.</p>`,
  },
  {
    title: 'Seasonal Motivation Blast',
    category: 'Broadcast',
    desc: 'General motivational broadcast for the whole caseload.',
    content: `<p>Hi {{User Name}} — hope your week is off to a strong start! 🌱</p><p>Small consistent actions add up fast. Keep showing up for {{Goal}}, we're all cheering you on.</p>`,
  },
  {
    title: 'Post-Session Recap',
    category: 'General',
    desc: 'Summary sent after a coaching call.',
    content: `<p>Great chatting today, {{User Name}}!</p><p>Quick recap: we're keeping focus on {{Goal}} within {{Program Name}}, and I'll follow up on the points we discussed.</p>`,
  },
  {
    title: 'Holiday Hours Notice',
    category: 'General',
    desc: 'Let users know about a schedule change.',
    content: `<p>Hi {{User Name}}, just a quick note that {{Coach Name}}'s hours will be a little different this week.</p><p>I'll still be checking messages, so don't hesitate to reach out.</p>`,
  },
]

export function buildTemplate(index: number): Template {
  const seed = (index + 1) * 19.3 + 7
  const s = TEMPLATE_SEED[index % TEMPLATE_SEED.length]
  const statusRoll = seededRandom(seed * 3.1)
  const status =
    statusRoll < 0.78 ? 'active' : statusRoll < 0.92 ? 'draft' : 'archived'
  const createdDate = daysAgo(Math.floor(20 + seededRandom(seed * 4.3) * 260))
  const updatedDate = daysAgo(Math.floor(seededRandom(seed * 5.1) * 18))
  const timesUsed =
    status === 'active'
      ? Math.floor(seededRandom(seed * 6.7) * 140)
      : Math.floor(seededRandom(seed * 6.7) * 8)
  const usedInChats = Math.round(
    timesUsed * (0.55 + seededRandom(seed * 7.3) * 0.25),
  )
  const usedInBroadcasts = Math.max(0, timesUsed - usedInChats)
  const favoriteCount = Math.floor(seededRandom(seed * 8.1) * 12)

  const recentUses =
    timesUsed > 0
      ? Array.from(
          { length: Math.min(4, Math.ceil(timesUsed / 20) + 1) },
          (_, i) => {
            const client =
              CLIENTS_DATA[
                Math.floor(seededRandom(seed * 9 + i) * CLIENTS_DATA.length)
              ]
            return {
              context:
                seededRandom(seed * 10 + i) < 0.7
                  ? ('chat' as const)
                  : ('broadcast' as const),
              clientName: client.name,
              days: Math.floor(seededRandom(seed * 11 + i) * 14),
            }
          },
        )
      : []

  return {
    id: `tmpl-${index + 1}`,
    title: s.title,
    category: s.category,
    description: s.desc,
    content: s.content,
    cover: {
      type: 'gradient',
      value: TEMPLATE_COVER_GRADIENTS[index % TEMPLATE_COVER_GRADIENTS.length],
    },
    templateType: 'message',
    poll: defaultPoll(),
    status,
    trashed: false,
    favorite: seededRandom(seed * 2.2) < 0.3,
    createdBy: pick(TEMPLATE_AUTHORS, seed * 12.1),
    createdDate,
    updatedDate,
    usage: {
      timesUsed,
      lastUsed:
        timesUsed > 0
          ? daysAgo(Math.floor(seededRandom(seed * 13) * 10))
          : null,
      usedInChats,
      usedInBroadcasts,
      favoriteCount,
    },
    recentUses,
    versionHistory: [
      {
        version: 'v1.0',
        text: 'Template created',
        days: Math.round(
          (Date.now() - createdDate.getTime()) / (24 * 3600 * 1000),
        ),
      },
      {
        version: 'v1.1',
        text: 'Content updated',
        days: Math.round(
          (Date.now() - updatedDate.getTime()) / (24 * 3600 * 1000),
        ),
      },
    ],
  }
}

// Build a blank template for the "new template" editor flow.
export function buildBlankTemplate(categories: string[]): Template {
  return {
    id: `tmpl-${Date.now()}`,
    title: 'Untitled Template',
    category: categories[0] ?? 'General',
    description: '',
    content: '<p>Start writing your message…</p>',
    cover: {
      type: 'gradient',
      value:
        TEMPLATE_COVER_GRADIENTS[
          Math.floor(Math.random() * TEMPLATE_COVER_GRADIENTS.length)
        ],
    },
    templateType: 'message',
    poll: defaultPoll(),
    status: 'draft',
    trashed: false,
    favorite: false,
    createdBy: 'Sarah Nolan',
    createdDate: new Date(),
    updatedDate: new Date(),
    usage: {
      timesUsed: 0,
      lastUsed: null,
      usedInChats: 0,
      usedInBroadcasts: 0,
      favoriteCount: 0,
    },
    recentUses: [],
    versionHistory: [{ version: 'v1.0', text: 'Template created', days: 0 }],
  }
}

// v1.0 -> v1.1 minor bump for save/publish checkpoints.
export function bumpVersion(version: string): string {
  const [major, minor] = version.replace('v', '').split('.').map(Number)
  return `v${major}.${minor + 1}`
}

// ===================== Session persistence =====================
const TEMPLATES_STORAGE_KEY = 'nourish_templates'
const TEMPLATE_DATE_KEYS = ['createdDate', 'updatedDate', 'lastUsed']

function reviveTemplateDates(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(reviveTemplateDates)
    return
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    Object.keys(obj).forEach((k) => {
      if (TEMPLATE_DATE_KEYS.includes(k) && typeof obj[k] === 'string') {
        obj[k] = new Date(obj[k] as string)
      } else {
        reviveTemplateDates(obj[k])
      }
    })
  }
}

export function saveTemplates(templates: Template[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
  } catch {
    /* storage unavailable — edits just won't survive a reload */
  }
}

function loadStoredTemplates(): Template[] | null {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    reviveTemplateDates(parsed)
    return parsed as Template[]
  } catch {
    return null
  }
}

export function seedTemplates(): Template[] {
  return TEMPLATE_SEED.map((_, i) => buildTemplate(i))
}

// The session's templates — restored from localStorage or freshly seeded.
export const TEMPLATES: Template[] = loadStoredTemplates() ?? seedTemplates()

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
