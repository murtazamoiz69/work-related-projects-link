// Templates module — shared data model for the Templates library, the Template
// Detail workspace, and the universal Template Picker used by Chat and
// Broadcast. Ported from V2's templates-data.js. Templates are generated once
// and mutated in place as the nutritionist creates/edits/favorites/uses them —
// there is no backend; this is the app's in-memory source of truth for the
// session, mirrored to localStorage.

export type TemplateStatus = 'active' | 'draft' | 'archived'

// Where a template was used. 'copy' = "Copy Template" on the detail page, which
// counts toward timesUsed without attributing to a specific channel.
export type UsageContext = 'chat' | 'broadcast' | 'copy'

export type TemplateCover = {
  type: 'gradient' | 'image'
  value: string
}

export type TemplateUsage = {
  timesUsed: number
  lastUsed: Date | null
  usedInChats: number
  usedInBroadcasts: number
  favoriteCount: number
}

export type RecentUse = {
  context: UsageContext
  clientName: string
  days: number
}

export type TemplateVersion = {
  version: string
  text: string
  days: number
}

export type TemplateVariable = {
  key: string
  label: string
  sample: string
}

// 'message' is the existing rich-text template; 'poll' swaps the content
// editor for a question + answer-options builder.
export type TemplateKind = 'message' | 'poll'

export type PollOptionType = 'single' | 'multiple' | 'text' | 'rating'

export type PollOption = { id: string; text: string }

export type PollContent = {
  question: string
  optionType: PollOptionType
  options: PollOption[]
}

export type Template = {
  id: string
  title: string
  category: string
  description: string
  content: string
  cover: TemplateCover
  templateType: TemplateKind
  poll: PollContent
  status: TemplateStatus
  trashed: boolean
  favorite: boolean
  createdBy: string
  createdDate: Date
  updatedDate: Date
  usage: TemplateUsage
  recentUses: RecentUse[]
  versionHistory: TemplateVersion[]
}
