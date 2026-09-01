// Wires the (mock) realtime source to a conversation's detail cache: inbound
// messages are appended to the React Query cache exactly as a websocket push
// would update it. Also exposes triggerClientReply() for the after-send reply.
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
  ChatMessage,
  Conversation,
  ConversationStatus,
  HandledBy,
} from '../types'
import { chatKeys } from '../api/chat.keys'
import {
  scheduleClientReply,
  scheduleLiveExchange,
  type InboundMessage,
} from '../realtime'

export function useConversationRealtime(
  conversationId: string,
  handledBy: HandledBy,
  status: ConversationStatus,
) {
  const queryClient = useQueryClient()
  const [typing, setTyping] = useState<'client' | 'ai' | null>(null)
  const cleanups = useRef<Array<() => void>>([])

  const appendMessage = (m: InboundMessage) => {
    const msg: ChatMessage = {
      from: m.from,
      text: m.text,
      time: new Date(),
      attachment: null,
    }
    queryClient.setQueryData<Conversation>(
      chatKeys.detail(conversationId),
      (prev) => (prev ? { ...prev, messages: [...prev.messages, msg] } : prev),
    )
  }
  const events = { onTyping: setTyping, onMessage: appendMessage }

  // One live exchange when watching an AI-handled active conversation. Keyed on
  // the conversation id (the thread is remounted per conversation), so it runs
  // once per open; taking over (handledBy !== 'ai') stops it.
  useEffect(() => {
    setTyping(null)
    const list = cleanups.current
    if (handledBy === 'ai' && status === 'active') {
      list.push(scheduleLiveExchange(events))
    }
    return () => {
      list.forEach((fn) => fn())
      cleanups.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, handledBy, status])

  const triggerClientReply = () => {
    cleanups.current.push(scheduleClientReply(events))
  }

  return { typing, triggerClientReply }
}
