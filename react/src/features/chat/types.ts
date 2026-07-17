import type { Client } from '@/features/clients'

export type ConversationStatus = 'waiting' | 'active'
export type HandledBy = 'ai' | 'nutritionist'
export type MessageFrom = 'client' | 'ai' | 'coach' | 'system'

export type ChatAttachment = {
  type: 'image' | 'file'
  name: string
  dataUrl?: string
}

export type ChatMessage = {
  from: MessageFrom
  text: string
  time: Date
  attachment: ChatAttachment | null
}

// Tri-state daily dot for the profile card's Weekly Diet / Weekly Workout rows.
export type WeekDayStat = {
  label: string
  daysAgo: number
  scheduled: number
  completed: number
  isToday: boolean
  tier: 'empty' | 'missed' | 'partial' | 'done'
}

export type ConversationInsights = {
  mealPct: number
  workoutDone: boolean
  workoutsCompleted: number
  workoutsTotal: number
  dietWeek: WeekDayStat[]
  workoutWeek: WeekDayStat[]
}

export type ChatNote = {
  author: string
  text: string
  days: number
}

export type ChatUpload = {
  date: Date
}

export type ChatActivityItem = {
  icon: string
  text: string
  days: number
}

export type Conversation = {
  id: string
  client: Client
  status: ConversationStatus
  handledBy: HandledBy
  messages: ChatMessage[]
  unread: number
  starred: boolean
  insights: ConversationInsights
  flags: string[]
  notes: ChatNote[]
  uploads: ChatUpload[]
  activity: ChatActivityItem[]
  chatSummary: string
  liveSimulated: boolean
}

export type ChatTab = 'inbox' | 'waiting' | 'active' | 'new'
export type ProfileSectionId = 'overview' | 'medical' | 'activity'
