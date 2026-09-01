// Query + mutation hooks for conversations. Mutations return the full updated
// conversation; onSuccess writes it into the detail cache and patches the
// matching list summary (no refetch, so client-side realtime messages already
// in the detail cache are preserved).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import type { Conversation, HandledBy } from '../types'
import {
  addNote,
  getConversation,
  getConversations,
  patchConversation,
  sendMessage,
  setHandoff,
} from '../api/chat.api'
import { chatKeys } from '../api/chat.keys'
import type {
  AddNoteBody,
  ConversationSummary,
  SendMessageBody,
} from '../api/chat.types'

function summaryFromConversation(c: Conversation): ConversationSummary {
  const last = c.messages[c.messages.length - 1]
  return {
    id: c.id,
    client: c.client,
    status: c.status,
    handledBy: c.handledBy,
    unread: c.unread,
    starred: c.starred,
    lastMessage: {
      text: last?.text ?? '',
      time: last?.time ?? new Date(0),
      hasAttachment: Boolean(last?.attachment),
    },
  }
}

function writeConversation(queryClient: QueryClient, c: Conversation): void {
  queryClient.setQueryData<Conversation>(chatKeys.detail(c.id), c)
  queryClient.setQueryData<ConversationSummary[]>(chatKeys.list(), (prev) =>
    prev
      ? prev.map((s) => (s.id === c.id ? summaryFromConversation(c) : s))
      : prev,
  )
}

export function useConversationsQuery() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: ({ signal }) => getConversations(signal),
  })
}

export function useConversationQuery(id: string | null) {
  return useQuery({
    queryKey: chatKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getConversation(id as string, signal),
    enabled: !!id,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SendMessageBody }) =>
      sendMessage(id, body),
    // Optimistic: show the coach's message immediately (matches the original
    // in-place feel), roll back on failure.
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(id) })
      const prev = queryClient.getQueryData<Conversation>(chatKeys.detail(id))
      queryClient.setQueryData<Conversation>(chatKeys.detail(id), (c) =>
        c
          ? {
              ...c,
              unread: 0,
              messages: [
                ...c.messages,
                {
                  from: 'coach',
                  text: body.text,
                  time: new Date(),
                  attachment: body.attachment,
                },
              ],
            }
          : c,
      )
      return { prev }
    },
    onError: (error, { id }, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(chatKeys.detail(id), ctx.prev)
      showToast(apiErrorMessage(error))
    },
    onSuccess: (conversation) => writeConversation(queryClient, conversation),
  })
}

export function useSetStar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) =>
      patchConversation(id, { starred }),
    onSuccess: (conversation) => writeConversation(queryClient, conversation),
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => patchConversation(id, { unread: 0 }),
    onSuccess: (conversation) => writeConversation(queryClient, conversation),
  })
}

export function useHandoff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, handledBy }: { id: string; handledBy: HandledBy }) =>
      setHandoff(id, handledBy),
    onSuccess: (conversation) => writeConversation(queryClient, conversation),
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}

export function useAddNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AddNoteBody }) =>
      addNote(id, body),
    onSuccess: (conversation) => {
      writeConversation(queryClient, conversation)
      showToast('Note added')
    },
    onError: (error) => showToast(apiErrorMessage(error)),
  })
}
