// Mock realtime source for a conversation.
//
// SWAP POINT: today this is client-side timers emitting simulated inbound
// messages. In production this module becomes a websocket (or polling)
// subscription that emits the SAME events (onTyping / onMessage). Consumers
// (useConversationRealtime) depend only on the RealtimeEvents callbacks, so the
// transport can be replaced here without touching the UI. MSW does not simulate
// server push, which is exactly why this lives client-side for the mock phase.
import { CLIENT_FOLLOWUPS, COACH_REPLIES } from './data'

export type InboundMessage = { from: 'client' | 'ai'; text: string }

export type RealtimeEvents = {
  onTyping: (who: 'client' | 'ai' | null) => void
  onMessage: (message: InboundMessage) => void
}

function randOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** One live exchange while watching an AI-handled conversation: the client
 *  sends a follow-up, then Nourish AI replies. Returns a cleanup that cancels
 *  any pending timers. */
export function scheduleLiveExchange(events: RealtimeEvents): () => void {
  const timers: ReturnType<typeof setTimeout>[] = []
  timers.push(
    setTimeout(
      () => {
        events.onMessage({ from: 'client', text: randOf(CLIENT_FOLLOWUPS) })
        events.onTyping('ai')
        timers.push(
          setTimeout(
            () => {
              events.onTyping(null)
              events.onMessage({ from: 'ai', text: randOf(COACH_REPLIES) })
            },
            1300 + Math.random() * 1100,
          ),
        )
      },
      2600 + Math.random() * 2600,
    ),
  )
  return () => timers.forEach(clearTimeout)
}

/** A client reply after the nutritionist sends a message. */
export function scheduleClientReply(events: RealtimeEvents): () => void {
  const timers: ReturnType<typeof setTimeout>[] = []
  events.onTyping('client')
  timers.push(
    setTimeout(
      () => {
        events.onTyping(null)
        events.onMessage({ from: 'client', text: randOf(CLIENT_FOLLOWUPS) })
      },
      1100 + Math.random() * 1300,
    ),
  )
  return () => timers.forEach(clearTimeout)
}
