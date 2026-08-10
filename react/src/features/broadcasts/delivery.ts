// Publish-time delivery: turns a Broadcast into an actual chat message in
// every recipient's conversation, with {{Token}} placeholders resolved
// against that specific recipient's own data — the per-recipient
// counterpart to the Broadcast preview's static sample substitution.
import { CONVERSATIONS, isToday } from '@/features/chat'
import type { Conversation } from '@/features/chat'
import type { Client } from '@/features/clients'
import {
  TEMPLATE_VARIABLES,
  stripHtmlToText,
  templateById,
} from '@/features/templates'
import { recipientClients } from './data'
import type { Broadcast } from './types'

function mostRecentWeightKg(convo: Conversation): string | null {
  const entries = convo.activity
    .filter((a) => a.kind === 'weight')
    .sort((a, b) => b.time.getTime() - a.time.getTime())
  const match = entries[0]?.detail.match(/(\d+(?:\.\d+)?)\s*kg\s*$/)
  return match ? `${match[1]} kg` : null
}

function todaysWorkoutTitle(convo: Conversation): string | null {
  const entry = convo.activity.find(
    (a) => a.kind === 'workout' && !a.upcoming && isToday(a.time),
  )
  return entry ? entry.title : null
}

function todaysCalories(convo: Conversation): string | null {
  const meals = convo.activity.filter(
    (a) => a.kind === 'meal' && !a.upcoming && isToday(a.time),
  )
  if (!meals.length) return null
  const total = meals.reduce((sum, m) => {
    const match = m.detail.match(/(\d+)\s*kcal/)
    return sum + (match ? Number(match[1]) : 0)
  }, 0)
  return total ? `${total.toLocaleString()} kcal` : null
}

// Resolves a template's {{Token}} placeholders against this specific
// recipient's real data instead of the fixed demo sample values — falls
// back to the sample only for the handful of tokens a client genuinely has
// no logged data for yet (e.g. no weight check-in logged).
function renderBroadcastForClient(
  html: string,
  client: Client,
  convo: Conversation,
): string {
  const values: Partial<Record<string, string>> = {
    '{{User Name}}': client.name,
    '{{Coach Name}}': 'Sarah Nolan',
    '{{Goal}}': client.goals[0] ?? client.program,
    '{{Program Name}}': client.program,
    '{{Current Weight}}': mostRecentWeightKg(convo) ?? undefined,
    "{{Today's Workout}}": todaysWorkoutTitle(convo) ?? undefined,
    "{{Today's Calories}}": todaysCalories(convo) ?? undefined,
  }
  let out = html
  TEMPLATE_VARIABLES.forEach((v) => {
    out = out.split(v.key).join(values[v.key] ?? v.sample)
  })
  return out
}

// Delivers a published Broadcast into every recipient's chat — pushed as a
// plain-text 'broadcast' message (same conversion Chat's own "insert
// template into composer" flow uses) so it renders through the existing
// message thread exactly like any other message, just visually tagged as a
// Broadcast rather than something Sarah typed live.
export function deliverBroadcast(broadcast: Broadcast): void {
  const template = templateById(broadcast.templateId)
  if (!template) return

  const recipients = recipientClients({
    type: broadcast.audienceType,
    program: broadcast.program,
    goal: broadcast.goal,
    selectedIds: new Set(broadcast.selectedClientIds),
  })

  recipients.forEach((client) => {
    const convo = CONVERSATIONS.find((c) => c.client.id === client.id)
    if (!convo) return
    const resolvedHtml = renderBroadcastForClient(
      template.content,
      client,
      convo,
    )
    convo.messages.push({
      from: 'broadcast',
      text: stripHtmlToText(resolvedHtml),
      time: new Date(),
      attachment: null,
    })
  })
}
