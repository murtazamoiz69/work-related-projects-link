export * from './types'
export {
  CONVERSATIONS,
  conversationsForTab,
  filterConversations,
  timeAgoShort,
  formatTime,
  formatDateSep,
  isToday,
  randomSuggestions,
  summarizeNotes,
} from './data'
export { ConversationList } from './components/ConversationList'
export { MessageThread } from './components/MessageThread'
export { ClientOverview } from './components/ClientOverview'
export { ActivityLogList } from './components/ActivityLogList'
export { PlanWorkspaceOverlay, deriveClinicalProfile } from './plan-workspace'

// API layer + hooks
export {
  getConversations,
  getConversation,
  toConversation,
} from './api/chat.api'
export type {
  ConversationSummary,
  ConversationDto,
  SendMessageBody,
  AddNoteBody,
} from './api/chat.types'
export {
  useConversationsQuery,
  useConversationQuery,
  useSendMessage,
  useSetStar,
  useMarkRead,
  useHandoff,
  useAddNote,
} from './hooks/useConversations'
export { useConversationRealtime } from './hooks/useConversationRealtime'
