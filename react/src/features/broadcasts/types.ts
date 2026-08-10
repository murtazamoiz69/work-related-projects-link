// Broadcast composer + roster domain model. In-memory + localStorage, same
// pattern as Templates: no backend, so the list persists across a reload but
// there is nothing behind it once storage is cleared.

export type AudienceType = 'all' | 'selected' | 'program' | 'goals'

export type SendTiming = 'now' | 'later'

export type RepeatUnit = 'day' | 'week' | 'month'

export type AudienceOption = { value: AudienceType; label: string }

export type BroadcastStatus = 'draft' | 'scheduled' | 'published'

// 'datetime' = a fixed calendar date + time; 'rule' = relative to each
// client's own Program Activation Date (see repeatUnit/repeatCount).
export type ScheduleMode = 'datetime' | 'rule'

export type Broadcast = {
  id: string
  title: string
  templateId: string
  audienceType: AudienceType
  program: string
  goal: string
  // Set isn't JSON-serializable, so the persisted/edited form of the
  // selection is a plain array; the composer UI still works with a Set.
  selectedClientIds: string[]
  recipientCount: number
  timing: SendTiming
  scheduleMode: ScheduleMode
  scheduleDate: string
  scheduleTime: string
  repeatUnit: RepeatUnit
  repeatCount: number
  status: BroadcastStatus
  trashed: boolean
  createdBy: string
  createdDate: Date
  updatedDate: Date
}

// The subset of a Broadcast that the composer form actually edits — cached to
// sessionStorage before navigating to "Create Template" so the in-progress
// broadcast can be restored when the user comes back (see draftCache.ts).
export type BroadcastDraftFields = {
  title: string
  templateId: string
  audienceType: AudienceType
  program: string
  goal: string
  selectedClientIds: string[]
  timing: SendTiming
  scheduleMode: ScheduleMode
  scheduleDate: string
  scheduleTime: string
  repeatUnit: RepeatUnit
  repeatCount: number
}
