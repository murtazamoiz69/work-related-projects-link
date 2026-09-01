// Chat module data — conversation list + thread, derived from CLIENTS_DATA
// (ported from V2's chat.js). Conversation status is mapped from each client's
// existing status field so the story stays consistent with the rest of the
// dashboard (an "attention" client is naturally "waiting" on a reply here too).
import { pick, seededRandom, daysAgo } from '@/lib/seed'
import { CLIENTS_DATA } from '@/features/clients'
import type { Client } from '@/features/clients'
import {
  MEAL_SLOTS,
  WORKOUT_TEMPLATES,
  mealsByCategory,
} from '@/features/programs'
import type { MealSlot } from '@/features/programs'
import type {
  ChatActivityItem,
  ChatAttachment,
  ChatMessage,
  ChatNote,
  ChatTab,
  Conversation,
  ConversationStatus,
} from './types'

const PROGRAM_OPENER: Record<string, string> = {
  'Weight Loss':
    "Hey! Quick question about today's meal plan — can I swap the dinner option for something else?",
  'Diabetes Management':
    "Attaching this week's glucose readings, let me know what you think!",
  'Prenatal Nutrition':
    'Feeling pretty nauseous again this morning, is that normal at this stage?',
  'Muscle Gain':
    "Should I increase my protein intake? Feeling like I've plateaued a bit this week.",
  'General Wellness':
    "Just checking in — finished today's workout, feeling great!",
  'Post-Surgery Recovery':
    'Started reintroducing solid foods today like we discussed at the last check-in.',
  'Endurance Training':
    "Logged this morning's run — legs are pretty sore, any recovery tips?",
  'Body Recomposition':
    "Scale's not moving much this week, is that normal at this stage?",
  'Sports Nutrition':
    "What should I eat the night before tomorrow's competition?",
  'PCOS Management':
    "Cycle's been irregular again this month, wanted to flag it for you.",
  'Cardiac Health':
    'Blood pressure reading this morning was a little high, sharing it here just in case.',
}
const NEW_CLIENT_OPENER = (program: string): string =>
  `Hi! Just signed up for ${program} — excited to get started 🙂`

export const COACH_REPLIES = [
  'Thanks for sharing — this is really helpful context.',
  "Great question, let's dig into that a bit.",
  "That's totally normal at this stage, but let's keep an eye on it together.",
  'Nice work staying consistent this week — proud of you!',
  'Let me take a closer look and get back to you shortly.',
  "Good catch flagging that early — here's what I'd suggest.",
]
export const CLIENT_FOLLOWUPS = [
  'Thank you! That makes a lot of sense.',
  "Okay, I'll keep track of that going forward.",
  'Got it, appreciate the quick response!',
  'Sounds good, talk soon!',
  "Perfect, I'll try that today.",
  "That's a relief to hear, thanks Sarah!",
]
// What a user is plausibly sending in, by program. Each conversation draws a
// couple of these so the thread has real material in it: progress photos,
// meal shots, screenshots of a tracker, and clinical documents.
const ATTACHMENT_BY_PROGRAM: Record<string, ChatAttachment[]> = {
  'Diabetes Management': [
    { type: 'file', name: 'Glucose_Readings_WeeklyLog.pdf', size: '186 KB' },
    { type: 'image', name: 'CGM_App_Screenshot.png' },
    { type: 'file', name: 'HbA1c_Lab_Result.pdf', size: '312 KB' },
  ],
  'Weight Loss': [
    { type: 'image', name: 'Progress_Photo_Week6.jpg' },
    { type: 'image', name: 'Scale_Reading.jpg' },
    { type: 'file', name: 'Food_Diary_Export.pdf', size: '94 KB' },
  ],
  'Muscle Gain': [
    { type: 'image', name: 'Progress_Photo_Week6.jpg' },
    { type: 'image', name: 'Gym_Tracker_Screenshot.png' },
  ],
  'Body Recomposition': [
    { type: 'image', name: 'Progress_Photo_Week6.jpg' },
    { type: 'file', name: 'Body_Composition_Scan.pdf', size: '421 KB' },
  ],
  'Cardiac Health': [
    { type: 'file', name: 'BP_Readings.pdf', size: '128 KB' },
    { type: 'image', name: 'BP_Monitor_Photo.jpg' },
  ],
  'Prenatal Nutrition': [
    { type: 'file', name: 'Prenatal_Bloodwork.pdf', size: '265 KB' },
    { type: 'image', name: 'Lunch_Today.jpg' },
  ],
  'Post-Surgery Recovery': [
    { type: 'file', name: 'Discharge_Summary.pdf', size: '338 KB' },
    { type: 'image', name: 'Incision_Check.jpg' },
  ],
  'PCOS Management': [
    { type: 'file', name: 'Hormone_Panel.pdf', size: '204 KB' },
    { type: 'image', name: 'Symptom_Tracker_Screenshot.png' },
  ],
  'Sports Nutrition': [
    { type: 'image', name: 'Race_Day_Fuel_Plan.png' },
    { type: 'file', name: 'VO2_Max_Test.pdf', size: '157 KB' },
  ],
  'General Wellness': [
    { type: 'image', name: 'Breakfast_Today.jpg' },
    { type: 'file', name: 'Annual_Bloodwork.pdf', size: '241 KB' },
  ],
  'Endurance Training': [
    { type: 'image', name: 'Long_Run_Splits.png' },
    { type: 'file', name: 'Training_Block_Summary.pdf', size: '176 KB' },
  ],
}

// Documents render as a plain file card (icon + name + size) rather than a
// generated preview image — there is no real file behind them in this
// prototype, so a WhatsApp-style file chip reads as more honest than a fake
// page thumbnail.

const FLAG_POOL_ATTENTION = [
  'Missed 3 consecutive check-ins',
  'Adherence dropped below 50%',
  'Flagged a health concern this week',
  'Plan renewal is overdue',
]
const NOTE_POOL = [
  'Prefers quick voice-note style replies over long text.',
  'Mentioned scheduling conflicts on weekday mornings.',
  'Responds best to check-ins in the early evening.',
  'Has expressed some flavor fatigue — try rotating meal suggestions.',
]
// Nourish AI drafts these as starting points for a reply — the nutritionist
// edits or sends as-is, never auto-sent on their behalf.
export const AI_SUGGESTION_POOL = [
  "Thanks for the update — let's make a small adjustment based on this.",
  'Great progress this week, keep this momentum going!',
  "I hear you — let's talk through a couple of options that might help.",
  "Can you tell me a bit more about how you've been feeling?",
  "Let's set up a quick call so we can go over this in more detail.",
  "That's a great question — here's what I'd recommend.",
  "Totally understandable — let's adjust the plan so it fits better.",
  'Nice work staying consistent, this is exactly the kind of progress we want.',
]
export const EMOJI_PICKER_POOL = [
  '👍',
  '🎉',
  '💪',
  '🙌',
  '❤️',
  '😊',
  '👏',
  '🔥',
  '✅',
  '😅',
  '🙏',
  '⭐',
]

function hoursAgo(h: number): Date {
  const d = new Date()
  d.setTime(d.getTime() - h * 3600 * 1000)
  return d
}

// "waiting" = needs the nutritionist's attention (an attention/new/paused
// client); everything else is a normal ongoing "active" conversation.
function conversationStatus(client: Client): ConversationStatus {
  if (
    client.status === 'attention' ||
    client.status === 'new' ||
    client.status === 'paused'
  )
    return 'waiting'
  return 'active'
}

// This prototype has no real file storage, so a mock photo attachment renders
// a consistent placeholder image (deterministic per seed) instead of an icon.
function placeholderPhotoDataUri(seed: number): string {
  const hue = Math.floor(seededRandom(seed) * 360)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" viewBox="0 0 240 300">` +
    `<rect width="240" height="300" fill="hsl(${hue},48%,42%)"/>` +
    `<circle cx="120" cy="112" r="42" fill="rgba(255,255,255,.82)"/>` +
    `<path d="M56 236c0-38 28-64 64-64s64 26 64 64" fill="rgba(255,255,255,.82)"/>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// A separate placeholder for logged meals — a recognizable food emoji on a
// soft tinted card, distinct from placeholderPhotoDataUri's person
// silhouette (progress photos), so the two never look like the same
// generic "avatar" icon. There's no real photo pipeline in this prototype,
// so this is the closest deterministic stand-in for an actual recipe photo.
const MEAL_SLOT_EMOJI: Record<MealSlot, string[]> = {
  Breakfast: ['🍳', '🥣', '🥞', '🧇'],
  Lunch: ['🥗', '🍱', '🌯', '🥙'],
  Snack: ['🍎', '🥜', '🍌', '🧀'],
  Dinner: ['🍲', '🍛', '🍝', '🥘'],
}
function mealPhotoDataUri(seed: number, slot: MealSlot): string {
  const hue = Math.floor(seededRandom(seed) * 360)
  const emoji = pick(MEAL_SLOT_EMOJI[slot], seed * 1.3)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">` +
    `<rect width="240" height="240" rx="26" fill="hsl(${hue},55%,91%)"/>` +
    `<text x="120" y="150" font-size="118" text-anchor="middle">${emoji}</text>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// ===================== User activity log =====================
// Spans today plus the last week so the "Recent Activity" panel (today only)
// and the "View all activity" modal (the full span) read from one consistent
// log instead of two disagreeing mock sources.
const ACTIVITY_SPAN_DAYS = 8
const UPCOMING_DAYS = 3
const MEAL_SLOT_TIME: Record<MealSlot, string> = {
  Breakfast: '08:00',
  Lunch: '13:00',
  Snack: '16:00',
  Dinner: '19:00',
}

function activityTime(daysBack: number, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  d.setHours(h, m, 0, 0)
  return d
}

function buildActivityLog(
  client: Client,
  seed: number,
  mealPct: number,
  workoutsCompleted: number,
  workoutsTotal: number,
): ChatActivityItem[] {
  const items: ChatActivityItem[] = []

  if (client.checkInDays !== null && client.checkInDays !== undefined) {
    items.push({
      kind: 'checkin',
      icon: client.status === 'attention' ? 'alert-circle' : 'check-circle-2',
      title:
        client.status === 'attention'
          ? 'Missed a scheduled check-in'
          : 'Completed a check-in',
      detail: '',
      time: activityTime(
        Math.min(client.checkInDays, ACTIVITY_SPAN_DAYS - 1),
        '09:00',
      ),
    })
  }

  const mealChance = mealPct / 100
  for (let day = 0; day < ACTIVITY_SPAN_DAYS; day++) {
    MEAL_SLOTS.forEach((slot, si) => {
      if (seededRandom(seed * 130 + day * 5 + si) >= mealChance) return
      const meal = pick(mealsByCategory(slot), seed * 131 + day * 7 + si)
      items.push({
        kind: 'meal',
        icon: 'utensils',
        title: meal.name,
        detail: `${slot} · ${meal.calories} kcal`,
        time: activityTime(day, MEAL_SLOT_TIME[slot]),
        photos: [mealPhotoDataUri(seed * 140 + day * 11 + si, slot)],
        category: slot,
      })
    })
  }

  const workoutChance =
    workoutsTotal > 0 ? workoutsCompleted / workoutsTotal : 0
  for (let day = 0; day < ACTIVITY_SPAN_DAYS; day++) {
    if (seededRandom(seed * 150 + day) >= workoutChance) continue
    const tmpl = pick(WORKOUT_TEMPLATES, seed * 151 + day)
    const exerciseCount = tmpl.exerciseIds.length
    items.push({
      kind: 'workout',
      icon: 'dumbbell',
      title: tmpl.name,
      detail: `${exerciseCount} exercises · ${exerciseCount * 12} min`,
      time: activityTime(day, '17:30'),
      category: tmpl.muscle,
    })
  }

  // Weight check-ins every ~3 days, trending toward the client's own goal —
  // matching the direction used for the chatSummary's weight-change line.
  const wantsBuildMuscle = client.goals.includes('Build muscle')
  let weight = Math.round((60 + seededRandom(seed * 160) * 35) * 10) / 10
  for (let day = ACTIVITY_SPAN_DAYS - 1; day >= 0; day -= 3) {
    const prevWeight = weight
    const step =
      Math.round((0.1 + seededRandom(seed * 161 + day) * 0.6) * 10) / 10
    weight = Math.round((weight + (wantsBuildMuscle ? step : -step)) * 10) / 10
    if (day === ACTIVITY_SPAN_DAYS - 1) continue // seeds the trend, not a loggable entry
    const direction: 'up' | 'down' = weight >= prevWeight ? 'up' : 'down'
    items.push({
      kind: 'weight',
      icon: 'scale',
      title: 'Weight updated',
      detail: `${prevWeight} kg → ${weight} kg`,
      time: activityTime(day, '08:15'),
      delta: {
        text: `${direction === 'up' ? '↑' : '↓'} ${Math.abs(Math.round((weight - prevWeight) * 10) / 10)} kg`,
        direction,
      },
    })
  }

  const uploadCount = 1 + Math.floor(seededRandom(seed * 170) * 3)
  for (let i = 0; i < uploadCount; i++) {
    const day = Math.floor(seededRandom(seed * 171 + i) * ACTIVITY_SPAN_DAYS)
    const photoCount = 2 + Math.floor(seededRandom(seed * 172 + i) * 3)
    items.push({
      kind: 'photo',
      icon: 'image',
      title: 'Uploaded progress photos',
      detail: photoCount === 1 ? '1 photo' : `${photoCount} photos`,
      time: activityTime(day, '10:24'),
      photos: Array.from({ length: photoCount }, (_, p) =>
        placeholderPhotoDataUri(seed * 173 + i * 5 + p),
      ),
    })
  }

  // Upcoming (not-yet-happened) plan schedule — the next few days' meals and
  // workouts, so the log doesn't stop dead at today. No adherence gating
  // here (nothing has been skipped yet); every scheduled slot shows up.
  for (let aheadDays = 1; aheadDays <= UPCOMING_DAYS; aheadDays++) {
    MEAL_SLOTS.forEach((slot, si) => {
      const meal = pick(mealsByCategory(slot), seed * 180 + aheadDays * 7 + si)
      items.push({
        kind: 'meal',
        icon: 'utensils',
        title: meal.name,
        detail: `${slot} · ${meal.calories} kcal`,
        time: activityTime(-aheadDays, MEAL_SLOT_TIME[slot]),
        upcoming: true,
        category: slot,
      })
    })
    if (seededRandom(seed * 185 + aheadDays) < 0.6) {
      const tmpl = pick(WORKOUT_TEMPLATES, seed * 186 + aheadDays)
      const exerciseCount = tmpl.exerciseIds.length
      items.push({
        kind: 'workout',
        icon: 'dumbbell',
        title: tmpl.name,
        detail: `${exerciseCount} exercises · ${exerciseCount * 12} min`,
        time: activityTime(-aheadDays, '17:30'),
        upcoming: true,
        category: tmpl.muscle,
      })
    }
  }

  items.sort((a, b) => b.time.getTime() - a.time.getTime())
  return items
}

function buildConversation(client: Client, index: number): Conversation {
  const seed = (index + 1) * 17.23 + 5
  const status = conversationStatus(client)

  // Nourish AI is the default first responder on every open thread — a handful
  // start already taken over, so both states exist on page load.
  const handledBy = seededRandom(seed * 22) < 0.82 ? 'ai' : 'nutritionist'
  const responderFrom: ChatMessage['from'] = handledBy === 'ai' ? 'ai' : 'coach'

  const startHoursAgo =
    status === 'waiting'
      ? 2 + seededRandom(seed * 3) * 20
      : 1 + seededRandom(seed * 3) * 30

  const messages: ChatMessage[] = []
  let t = startHoursAgo
  const opener =
    client.status === 'new'
      ? NEW_CLIENT_OPENER(client.program)
      : PROGRAM_OPENER[client.program] || 'Hey, quick question about my plan!'
  // Photos get a person-placeholder preview image; documents render as a
  // plain file card with no image behind them (see the comment above).
  const attachPool = ATTACHMENT_BY_PROGRAM[client.program] ?? []
  const withPreview = (att: ChatAttachment, s: number): ChatAttachment =>
    att.type === 'image' ? { ...att, dataUrl: placeholderPhotoDataUri(s) } : att
  const attached =
    attachPool.length && seededRandom(seed * 4) < 0.72
      ? withPreview(pick(attachPool, seed * 4.2), seed * 4.6)
      : null
  messages.push({
    from: 'client',
    text: opener,
    time: hoursAgo(t),
    attachment: attached,
  })
  t -= 0.4 + seededRandom(seed * 5) * 1.5

  if (status !== 'waiting') {
    messages.push({
      from: responderFrom,
      text: pick(COACH_REPLIES, seed * 6),
      time: hoursAgo(Math.max(t, 0.1)),
      attachment: null,
    })
    t -= 0.3 + seededRandom(seed * 7) * 2
    if (seededRandom(seed * 8) < 0.6) {
      // A second upload later in the thread, so attachments aren't a
      // one-shot occurrence confined to the very first message. Drawn from
      // the remaining pool entries so it is never a duplicate of the
      // opener's file.
      const rest = attachPool.filter((a) => a.name !== attached?.name)
      const second =
        rest.length && seededRandom(seed * 8.4) < 0.55
          ? withPreview(pick(rest, seed * 8.7), seed * 8.9)
          : null
      messages.push({
        from: 'client',
        text: pick(CLIENT_FOLLOWUPS, seed * 9),
        time: hoursAgo(Math.max(t, 0.05)),
        attachment: second,
      })
      t -= 0.2 + seededRandom(seed * 10) * 1
    }
    if (status === 'active' && seededRandom(seed * 11) < 0.5) {
      messages.push({
        from: responderFrom,
        text: pick(COACH_REPLIES, seed * 12),
        time: hoursAgo(Math.max(t, 0.02)),
        attachment: null,
      })
    }
  }
  messages.sort((a, b) => a.time.getTime() - b.time.getTime())

  const unread =
    status === 'waiting'
      ? 1
      : status === 'active' && seededRandom(seed * 13) < 0.18
        ? 1
        : 0

  const mealPct = Math.max(
    10,
    Math.min(100, Math.round(40 + seededRandom(seed * 14) * 60)),
  )
  const workoutDone = seededRandom(seed * 15) > 0.45
  const workoutsTotal = 4 + Math.floor(seededRandom(seed * 15.2) * 3)
  const workoutsCompleted = Math.max(
    0,
    Math.min(
      workoutsTotal,
      Math.round(seededRandom(seed * 15) * workoutsTotal),
    ),
  )
  const flags =
    client.status === 'attention'
      ? [
          pick(FLAG_POOL_ATTENTION, seed * 16),
          pick(FLAG_POOL_ATTENTION, seed * 16.5),
        ].filter((v, i, a) => a.indexOf(v) === i)
      : []

  const notes: ChatNote[] = Array.from(
    { length: 1 + (seededRandom(seed * 17) > 0.5 ? 1 : 0) },
    (_, i) => ({
      author: i === 0 ? 'Sarah Nolan' : 'James Okoro, RD',
      text: pick(NOTE_POOL, seed * 18 + i * 3),
      days: Math.floor(1 + seededRandom(seed * 19 + i) * 14),
    }),
  )

  const uploadCount = 1 + Math.floor(seededRandom(seed * 20) * 4)
  const uploadDaysAgo = Array.from({ length: uploadCount }, (_, i) =>
    Math.round(seededRandom(seed * 21 + i) * 40),
  )
  const uploads = uploadDaysAgo.map((d) => ({ date: daysAgo(d) }))

  const activity = buildActivityLog(
    client,
    seed,
    mealPct,
    workoutsCompleted,
    workoutsTotal,
  )

  // Nutritionist-facing digest (not addressed to the client) — bullet points
  // driven by this week's actual adherence, weight trend, and meal/workout
  // completion, mirroring the tone used on the full client-detail Overview tab.
  const workoutCompletionPct =
    workoutsTotal > 0
      ? Math.round((workoutsCompleted / workoutsTotal) * 100)
      : 0
  const dietIsWeaker = mealPct <= workoutCompletionPct
  const firstName = client.name.split(' ')[0]
  // Weight should trend toward the client's own goal — up for muscle gain,
  // down otherwise — so the "good news" framing stays directionally correct.
  const wantsBuildMuscle = client.goals.includes('Build muscle')
  const weightChangeMag =
    Math.round((0.2 + seededRandom(seed * 23) * 1.1) * 10) / 10
  const weightChange = wantsBuildMuscle ? weightChangeMag : -weightChangeMag
  const workoutClause =
    workoutCompletionPct >= 95
      ? 'all planned workouts completed'
      : workoutCompletionPct >= 80
        ? 'most planned workouts completed'
        : `${workoutCompletionPct}% of planned workouts completed`

  const chatSummary: string[] =
    client.status === 'attention'
      ? [
          `Adherence has decreased to ${client.adherence}%, mainly due to missed ${dietIsWeaker ? 'evening meals' : 'workouts'}.`,
          dietIsWeaker
            ? 'Workout consistency remains good.'
            : 'Meal logging remains consistent.',
          `A quick check-in about ${dietIsWeaker ? 'evening routines' : 'workout scheduling'} may help improve overall consistency.`,
        ]
      : client.status === 'new'
        ? [
            `Just joined for ${client.program} and hasn't started their plan yet.`,
            `A warm welcome message goes a long way here.`,
          ]
        : client.status === 'paused'
          ? [
              `Plan is currently paused.`,
              `The conversation could use a re-engagement nudge.`,
            ]
          : [
              `Excellent consistency this week with ${client.adherence}% adherence and ${workoutClause}.`,
              `Weight is ${weightChange < 0 ? 'down' : 'up'} ${Math.abs(weightChange)} kg, meal logging is consistent.`,
              `Consider recommending increased workout intensity next week if ${firstName} feels ready.`,
            ]

  return {
    id: client.id,
    client,
    status,
    handledBy,
    messages,
    unread,
    starred: false,
    insights: {
      mealPct,
      workoutDone,
      workoutsCompleted,
      workoutsTotal,
    },
    flags,
    notes,
    uploads,
    activity,
    chatSummary,
    liveSimulated: false,
  }
}

// The session's conversations — mutated in place across the screen's lifetime
// (starring, take-over, new messages) exactly like V2's CONVERSATIONS array.
export const CONVERSATIONS: Conversation[] = CLIENTS_DATA.map(buildConversation)

// AI-style digest of the care-team notes thread — surfaces what's actually
// been flagged (the note content) rather than who logged it or when, so a
// nutritionist can read the substance without author/date noise.
export function summarizeNotes(notes: ChatNote[]): string[] {
  if (!notes.length) {
    return [
      'No care-team notes yet — anything logged below will be summarized here.',
    ]
  }
  const uniqueTexts = Array.from(
    new Set(notes.map((n) => n.text).filter(Boolean)),
  )
  const attachments = notes.filter((n) => n.attachment)

  const lines = uniqueTexts.slice(0, 4)
  if (attachments.length) {
    lines.push(
      `${attachments.length} document${attachments.length === 1 ? '' : 's'} attached for reference — ${attachments
        .map((n) => n.attachment?.name)
        .join(', ')}.`,
    )
  }
  return lines
}

// ===================== Time helpers =====================
export function timeAgoShort(date: Date): string {
  const mins = Math.round((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d`
  return `${Math.round(days / 7)}w`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDateSep(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diffDays = Math.round(
    (today.getTime() - d.getTime()) / (24 * 3600 * 1000),
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

// ===================== Conversation list =====================
// "new" filters on the client's own status (a just-joined client); starred
// (pinned) conversations always float to the top, each group ordered by most
// recent message.
export function conversationsForTab(tab: ChatTab): Conversation[] {
  const base =
    tab === 'inbox'
      ? CONVERSATIONS
      : tab === 'new'
        ? CONVERSATIONS.filter((c) => c.client.status === 'new')
        : tab === 'starred'
          ? CONVERSATIONS.filter((c) => c.starred)
          : CONVERSATIONS.filter((c) => c.status === tab)
  return base.slice().sort((a, b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1
    return (
      b.messages[b.messages.length - 1].time.getTime() -
      a.messages[a.messages.length - 1].time.getTime()
    )
  })
}

export function filterConversations(
  list: Conversation[],
  query: string,
): Conversation[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (c) =>
      c.client.name.toLowerCase().includes(q) ||
      c.messages[c.messages.length - 1].text.toLowerCase().includes(q),
  )
}

// Three distinct AI suggestion chips, drawn at random from the pool.
export function randomSuggestions(count: number): string[] {
  const picks: string[] = []
  while (picks.length < count) {
    const s =
      AI_SUGGESTION_POOL[Math.floor(Math.random() * AI_SUGGESTION_POOL.length)]
    if (!picks.includes(s)) picks.push(s)
  }
  return picks
}
