// MSW handlers for conversations. Stateful (see chat.mock.ts).
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type {
  AddNoteBody,
  HandoffBody,
  PatchConversationBody,
  SendMessageBody,
} from './chat.types'
import {
  addMessageDto,
  addNoteDto,
  getConversationDto,
  listConversationSummaries,
  patchConversationDto,
  setHandoffDto,
} from './chat.mock'

const base = env.apiUrl
const notFound = () =>
  HttpResponse.json({ message: 'Conversation not found.' }, { status: 404 })

export const chatHandlers = [
  http.get(`${base}/conversations`, () =>
    HttpResponse.json(listConversationSummaries()),
  ),

  http.get(`${base}/conversations/:id`, ({ params }) => {
    const dto = getConversationDto(String(params.id))
    return dto ? HttpResponse.json(dto) : notFound()
  }),

  // Nutritionist-sent message.
  http.post(
    `${base}/conversations/:id/messages`,
    async ({ params, request }) => {
      const body = (await request.json()) as SendMessageBody
      const dto = addMessageDto(String(params.id), 'coach', body)
      return dto ? HttpResponse.json(dto) : notFound()
    },
  ),

  // Star / mark-read.
  http.patch(`${base}/conversations/:id`, async ({ params, request }) => {
    const body = (await request.json()) as PatchConversationBody
    const dto = patchConversationDto(String(params.id), body)
    return dto ? HttpResponse.json(dto) : notFound()
  }),

  // Take over / hand back (also appends a system message).
  http.patch(
    `${base}/conversations/:id/handoff`,
    async ({ params, request }) => {
      const body = (await request.json()) as HandoffBody
      const dto = setHandoffDto(String(params.id), body.handledBy)
      return dto ? HttpResponse.json(dto) : notFound()
    },
  ),

  http.post(`${base}/conversations/:id/notes`, async ({ params, request }) => {
    const body = (await request.json()) as AddNoteBody
    const dto = addNoteDto(String(params.id), body)
    return dto ? HttpResponse.json(dto) : notFound()
  }),
]
