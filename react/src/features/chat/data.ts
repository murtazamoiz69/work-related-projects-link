// Chat module data — conversation list + thread, derived from CLIENTS_DATA
// (ported from V2's chat.js). Conversation status is mapped from each client's
// existing status field so the story stays consistent with the rest of the
// dashboard (an "attention" client is naturally "waiting" on a reply here too).
import { pick, seededRandom, daysAgo } from '@/lib/seed'
import { CLIENTS_DATA } from '@/features/clients'
import type { Client } from '@/features/clients'
import type {
  ChatActivityItem,
  ChatAttachment,
  ChatMessage,
  ChatNote,
  ChatTab,
  Conversation,
  ConversationStatus,
  WeekDayStat,
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
    'Logged this morning\'s run — legs are pretty sore, any recovery tips?',
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
const ATTACHMENT_BY_PROGRAM: Record<string, ChatAttachment> = {
  'Diabetes Management': { type: 'file', name: 'Glucose_Readings_WeeklyLog.pdf' },
  'Weight Loss': { type: 'image', name: 'Progress_Photo.jpg' },
  'Muscle Gain': { type: 'image', name: 'Progress_Photo.jpg' },
  'Body Recomposition': { type: 'image', name: 'Progress_Photo.jpg' },
  'Cardiac Health': { type: 'file', name: 'BP_Readings.pdf' },
}
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

function chatPlanDurationWeeks(client: Client): number {
  const match = /^(\d+)-Week/i.exec(client.plan)
  return match ? parseInt(match[1], 10) : 12
}
function chatDaysSinceJoined(client: Client): number {
  return Math.floor((Date.now() - client.joinDate.getTime()) / (24 * 60 * 60 * 1000))
}
export function chatPlanWeekForDay(client: Client, dayOffset: number): number {
  const planWeeks = chatPlanDurationWeeks(client)
  const daysIntoProgramThen = Math.max(0, chatDaysSinceJoined(client) - dayOffset)
  return (Math.floor(daysIntoProgramThen / 7) % planWeeks) + 1
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

// Tri-state daily dot (done / partial / missed) for the profile card's Weekly
// Diet and Weekly Workout rows. Biased by the client's own adherence score so
// the dots and the "Adherence" figure never disagree. Days run Sun-Sat of the
// current calendar week; a day later than today renders empty.
function buildWeekDayStats(
  seed: number,
  mult: number,
  adherencePct: number | null,
  kind: 'meal' | 'workout',
): WeekDayStat[] {
  const p = (adherencePct ?? 70) / 100
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const days: WeekDayStat[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dayOffset = Math.round((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    if (dayOffset < 0)
      return {
        label,
        daysAgo: dayOffset,
        scheduled: 0,
        completed: 0,
        isToday: false,
        tier: 'empty',
      }

    const daySeed = seed * mult + dayOffset * 3.7
    const scheduled =
      kind === 'meal'
        ? seededRandom(daySeed * 1.11) < 0.4
          ? 4
          : 3
        : seededRandom(daySeed * 1.13) < 0.3
          ? 2
          : 1
    const r = seededRandom(daySeed)
    let completed: number
    if (r < p * 0.85) completed = scheduled
    else if (r < p * 0.85 + 0.15 && scheduled > 1)
      completed = Math.max(
        1,
        Math.min(scheduled - 1, Math.round(seededRandom(daySeed * 1.31) * scheduled)),
      )
    else completed = 0
    return {
      label,
      daysAgo: dayOffset,
      scheduled,
      completed,
      isToday: dayOffset === 0,
      tier: 'empty',
    }
  })

  // Guarantee at least one partial day among the days that have happened.
  const happened = days.filter((d) => d.daysAgo >= 0)
  if (
    happened.length &&
    !happened.some((d) => d.completed > 0 && d.completed < d.scheduled)
  ) {
    const forced =
      happened[Math.floor(seededRandom(seed * mult * 1.7) * happened.length)]
    forced.scheduled = Math.max(2, forced.scheduled)
    forced.completed = Math.max(1, Math.floor(forced.scheduled / 2))
  }

  return days.map((d) => ({
    ...d,
    tier:
      d.daysAgo < 0
        ? 'empty'
        : d.completed <= 0
          ? 'missed'
          : d.completed >= d.scheduled
            ? 'done'
            : 'partial',
  }))
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
  const attachPool = ATTACHMENT_BY_PROGRAM[client.program]
  const attached =
    attachPool && seededRandom(seed * 4) < 0.4 ? attachPool : null
  const photoDataUrl =
    attached && attached.type === 'image'
      ? placeholderPhotoDataUri(seed * 4.6)
      : null
  messages.push({
    from: 'client',
    text: opener,
    time: hoursAgo(t),
    attachment: attached
      ? { ...attached, ...(photoDataUrl ? { dataUrl: photoDataUrl } : {}) }
      : null,
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
      messages.push({
        from: 'client',
        text: pick(CLIENT_FOLLOWUPS, seed * 9),
        time: hoursAgo(Math.max(t, 0.05)),
        attachment: null,
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
    Math.min(workoutsTotal, Math.round(seededRandom(seed * 15) * workoutsTotal)),
  )
  const dietWeek = buildWeekDayStats(seed, 140, client.adherence, 'meal')
  const workoutWeek = buildWeekDayStats(seed, 150, client.adherence, 'workout')

  const flags =
    client.status === 'attention'
      ? [pick(FLAG_POOL_ATTENTION, seed * 16), pick(FLAG_POOL_ATTENTION, seed * 16.5)].filter(
          (v, i, a) => a.indexOf(v) === i,
        )
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

  const activity: ChatActivityItem[] = []
  if (client.checkInDays !== null && client.checkInDays !== undefined) {
    activity.push({
      icon: client.status === 'attention' ? 'alert-circle' : 'check-circle-2',
      text:
        client.status === 'attention'
          ? 'Missed a scheduled check-in'
          : 'Completed a check-in',
      days: client.checkInDays,
    })
  }
  activity.push({
    icon: 'utensils',
    text: `Logged meals — ${mealPct}% of targets hit this week`,
    days: 0,
  })
  activity.push({
    icon: 'dumbbell',
    text: `Completed ${workoutsCompleted} of ${workoutsTotal} workouts this week`,
    days: 1,
  })
  uploadDaysAgo.forEach((d, i) =>
    activity.push({
      icon: i % 2 === 0 ? 'image' : 'file-text',
      text: 'Uploaded a progress update',
      days: d,
    }),
  )
  activity.sort((a, b) => a.days - b.days)

  const chatSummary =
    client.status === 'attention'
      ? `${client.name} needs a reply — adherence has dropped to ${client.adherence}% and their last message is still open.`
      : client.status === 'new'
        ? `${client.name} just joined for ${client.program}. A warm welcome message goes a long way here.`
        : client.status === 'paused'
          ? `${client.name}'s plan is paused — the conversation could use a re-engagement nudge.`
          : `${client.name} is on track with ${client.program} — ${client.adherence}% adherence and the conversation is up to date.`

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
      dietWeek,
      workoutWeek,
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
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDateSep(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - d.getTime()) / (24 * 3600 * 1000))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
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
    const s = AI_SUGGESTION_POOL[Math.floor(Math.random() * AI_SUGGESTION_POOL.length)]
    if (!picks.includes(s)) picks.push(s)
  }
  return picks
}
