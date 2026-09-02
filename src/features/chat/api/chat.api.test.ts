import { beforeEach, describe, expect, it } from 'vitest'
import { isApiError } from '@/lib/api/types'
import {
  addNote,
  getConversation,
  getConversations,
  getConversationTabs,
  patchConversation,
  sendMessage,
  setHandoff,
} from './chat.api'
import { resetChatStore } from './chat.mock'

describe('chat.api', () => {
  beforeEach(() => resetChatStore())

  it('lists conversation summaries with Date times', async () => {
    const list = await getConversations()
    expect(list.length).toBeGreaterThan(0)
    expect(list[0].lastMessage.time).toBeInstanceOf(Date)
    expect(list[0].client.name).toBeTruthy()
  })

  it('loads a full conversation with Date message times', async () => {
    const list = await getConversations()
    const convo = await getConversation(list[0].id)
    expect(convo.id).toBe(list[0].id)
    expect(convo.messages[0].time).toBeInstanceOf(Date)
  })

  it('appends a sent coach message', async () => {
    const list = await getConversations()
    const id = list[0].id
    const before = (await getConversation(id)).messages.length
    const updated = await sendMessage(id, {
      text: 'Hello there',
      attachment: null,
    })
    const last = updated.messages[updated.messages.length - 1]
    expect(updated.messages.length).toBe(before + 1)
    expect(last.from).toBe('coach')
    expect(last.text).toBe('Hello there')
  })

  it('takes over and hands back with system messages', async () => {
    const list = await getConversations()
    const id = list[0].id
    const taken = await setHandoff(id, 'nutritionist')
    expect(taken.handledBy).toBe('nutritionist')
    expect(taken.messages[taken.messages.length - 1].from).toBe('system')

    const back = await setHandoff(id, 'ai')
    expect(back.handledBy).toBe('ai')
  })

  it('prepends a note', async () => {
    const list = await getConversations()
    const id = list[0].id
    const updated = await addNote(id, { text: 'Prefers mornings' })
    expect(updated.notes[0].text).toBe('Prefers mornings')
    expect(updated.notes[0].author).toBe('Sarah Nolan')
  })

  it('serves tab counts that agree with the listed conversations', async () => {
    const list = await getConversations()
    const tabs = await getConversationTabs()

    const byId = Object.fromEntries(tabs.map((t) => [t.id, t]))
    expect(byId.inbox.total).toBe(list.length)
    expect(byId.waiting.total).toBe(
      list.filter((c) => c.status === 'waiting').length,
    )
    expect(byId.new.total).toBe(
      list.filter((c) => c.client.status === 'new').length,
    )
    // Order is All, Needs Attention, [Pinned], New, Active.
    expect(tabs.map((t) => t.id).filter((id) => id !== 'starred')).toEqual([
      'inbox',
      'waiting',
      'new',
      'active',
    ])
  })

  it('adds the Pinned tab once something is pinned', async () => {
    const list = await getConversations()
    expect((await getConversationTabs()).some((t) => t.id === 'starred')).toBe(
      false,
    )

    await patchConversation(list[0].id, { starred: true })
    const pinned = (await getConversationTabs()).find((t) => t.id === 'starred')
    expect(pinned?.total).toBe(1)
  })

  it('rejects an unknown conversation id (404)', async () => {
    try {
      await getConversation('does-not-exist')
      throw new Error('expected rejection')
    } catch (e) {
      expect(isApiError(e)).toBe(true)
      if (isApiError(e)) expect(e.kind).toBe('not-found')
    }
  })
})
