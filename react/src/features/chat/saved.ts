// Pinning an attachment out of a conversation. The nutritionist saves a photo
// or report from the thread; it then shows up in the activity log (so it sits
// in the chronology of what happened) and in the user's Saved tab (so it stays
// findable without scrolling the whole conversation back).
//
// CONVERSATIONS is mutated in place, the same way starring and note-adding
// already work in this prototype, so every surface reading it stays in sync.
import { attachmentKey } from './data'
import type {
  ChatActivityItem,
  ChatAttachment,
  Conversation,
  SavedItem,
} from './types'

const SAVED_BY = 'Sarah Nolan'

export function savedKey(name: string, sentAt: Date): string {
  return attachmentKey(name, sentAt)
}

export function isSaved(
  convo: Conversation,
  attachment: ChatAttachment,
  sentAt: Date,
): boolean {
  const key = savedKey(attachment.name, sentAt)
  return convo.saved.some((s) => s.id === key)
}

function activityFor(item: SavedItem): ChatActivityItem {
  return {
    kind: 'saved',
    icon: 'bookmark-check',
    title: item.attachment.name,
    detail:
      item.attachment.type === 'image'
        ? 'Photo saved for reference'
        : 'Document saved for reference',
    time: item.savedAt,
    photos: item.attachment.dataUrl ? [item.attachment.dataUrl] : undefined,
  }
}

/** Pin an attachment. Returns true if it was added, false if already saved. */
export function saveAttachment(
  convo: Conversation,
  attachment: ChatAttachment,
  sentAt: Date,
): boolean {
  const id = savedKey(attachment.name, sentAt)
  if (convo.saved.some((s) => s.id === id)) return false
  const item: SavedItem = {
    id,
    attachment,
    sentAt,
    savedAt: new Date(),
    savedBy: SAVED_BY,
  }
  convo.saved.unshift(item)
  convo.activity.push(activityFor(item))
  return true
}

/** Unpin. Removes the matching activity entry too, so the log does not keep
 * claiming something is saved after it has been removed. */
export function unsaveAttachment(
  convo: Conversation,
  attachment: ChatAttachment,
  sentAt: Date,
): boolean {
  const id = savedKey(attachment.name, sentAt)
  const idx = convo.saved.findIndex((s) => s.id === id)
  if (idx === -1) return false
  const [removed] = convo.saved.splice(idx, 1)
  const ai = convo.activity.findIndex(
    (a) =>
      a.kind === 'saved' &&
      a.title === removed.attachment.name &&
      a.time.getTime() === removed.savedAt.getTime(),
  )
  if (ai !== -1) convo.activity.splice(ai, 1)
  return true
}

/** Toggle, returning the state it landed in. */
export function toggleSaved(
  convo: Conversation,
  attachment: ChatAttachment,
  sentAt: Date,
): 'saved' | 'removed' {
  if (isSaved(convo, attachment, sentAt)) {
    unsaveAttachment(convo, attachment, sentAt)
    return 'removed'
  }
  saveAttachment(convo, attachment, sentAt)
  return 'saved'
}
