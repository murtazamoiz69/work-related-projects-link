// Behavior tests for the Chat page — conversation list (tabs, search, star,
// selection) and the message thread (handoff banners, locked vs active
// composer, take-over, optimistic send + rollback, unread clearing). The
// plan-workspace overlay has its own suite. Realtime is mocked to no-ops so no
// timer-driven messages fire mid-test.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { CONVERSATIONS } from '@/features/chat/data'
import {
  resetChatStore,
  getConversationDto,
  patchConversationDto,
} from '@/features/chat/api/chat.mock'
import type { Conversation } from '@/features/chat/types'
import { resetClientStore } from '@/features/clients/api/clients.mock'
import { resetDietPlanStore } from '@/features/programs/diet/dietPlan.mock'
import { ChatPage } from './ChatPage'

const API = 'http://localhost:3000'
const DETAIL = `${API}/conversations/:id`
const MESSAGES = `${API}/conversations/:id/messages`

// The Plan Workspace overlay has its own suite (and embeds chart.js, which
// can't tear down under jsdom). Here we only care about ChatPage's open/close
// wiring around it, so stub it with a lightweight overlay that just exposes a
// close button.
vi.mock('@/features/chat/plan-workspace', () => ({
  PlanWorkspaceOverlay: ({ onClose }: { onClose: () => void }) => (
    <div id="planWorkspaceOverlay">
      <button aria-label="Close Plan Workspace" onClick={onClose}>
        close
      </button>
    </div>
  ),
}))

const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateSpy,
    Link: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
  }
})

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'

// Neutralise the client-side realtime simulation (timers).
vi.mock('@/features/chat/realtime', () => ({
  scheduleClientReply: () => () => {},
  scheduleLiveExchange: () => () => {},
}))

function pick(pred: (c: Conversation) => boolean): Conversation {
  const c = CONVERSATIONS.find(pred)
  if (!c) throw new Error('no matching conversation fixture')
  return c
}
const aiConvo = () => pick((c) => c.handledBy === 'ai' && c.status === 'active')
const humanConvo = () => pick((c) => c.handledBy === 'nutritionist')
const inReviewConvo = () => pick((c) => c.client.dietReview === 'in-review')
const reviewedConvo = () => pick((c) => c.client.dietReview === 'reviewed')

beforeEach(() => {
  navigateSpy.mockClear()
  vi.mocked(showToast).mockClear()
  resetChatStore()
  resetClientStore()
  resetDietPlanStore()
})
afterEach(() => {
  server.resetHandlers()
  document.body.classList.remove('chat-page')
})

describe('ChatPage — conversation list', () => {
  it('renders a card per conversation once loaded', async () => {
    const { container } = renderWithProviders(<ChatPage />)
    // One card per seeded conversation — derived, so resizing the cohort
    // doesn't turn this into a stale magic number.
    await waitFor(() =>
      expect(container.querySelectorAll('.convo-card').length).toBe(
        CONVERSATIONS.length,
      ),
    )
  })

  it('filters the list by search query', async () => {
    const { user } = renderWithProviders(<ChatPage />)
    const search = await screen.findByPlaceholderText(/search conversations/i)
    await user.type(search, 'zzz-no-conversation-match')
    expect(
      await screen.findByText('No conversations match'),
    ).toBeInTheDocument()
  })

  it('switches tabs (Needs Attention becomes selected)', async () => {
    const { user } = renderWithProviders(<ChatPage />)
    const tab = await screen.findByRole('tab', { name: /Needs Attention/ })
    // The badge count is server-computed (GET /conversations/tabs), so a
    // rendered number proves the tab is wired to that endpoint.
    expect(tab.textContent).toMatch(/\d/)
    await user.click(tab)
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })

  it('stars a conversation, persisting via PATCH', async () => {
    let patched: Record<string, unknown> | null = null
    server.use(
      http.patch(DETAIL, async ({ params, request }) => {
        patched = (await request.json()) as Record<string, unknown>
        patchConversationDto(String(params.id), patched)
        return HttpResponse.json(getConversationDto(String(params.id)))
      }),
    )
    const { user } = renderWithProviders(<ChatPage />)
    const pin = (
      await screen.findAllByRole('button', { name: 'Pin conversation' })
    )[0]
    await user.click(pin)
    await waitFor(() => expect(patched).toMatchObject({ starred: true }))
  })
})

describe('ChatPage — message thread & handoff', () => {
  it('shows the AI hand-off banner and a locked composer', async () => {
    renderWithProviders(<ChatPage initialConversationId={aiConvo().id} />)
    expect(
      await screen.findByRole('button', { name: /take over conversation/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/is chatting with/i)).toBeInTheDocument()
  })

  it('takes over an AI conversation, unlocking the composer', async () => {
    const { user } = renderWithProviders(
      <ChatPage initialConversationId={aiConvo().id} />,
    )
    await user.click(
      await screen.findByRole('button', { name: /take over conversation/i }),
    )
    expect(await screen.findByPlaceholderText(/^Message /)).toBeInTheDocument()
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/now chatting live/i),
      ),
    )
  })

  it('sends a message optimistically on an active conversation', async () => {
    const { user } = renderWithProviders(
      <ChatPage initialConversationId={humanConvo().id} />,
    )
    const box = await screen.findByPlaceholderText(/^Message /)
    await user.type(box, 'How are you feeling this week?')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    // Appears in the thread (and, once persisted, in the list preview too).
    await waitFor(() =>
      expect(
        screen.getAllByText('How are you feeling this week?').length,
      ).toBeGreaterThan(0),
    )
    expect(box).toHaveValue('')
  })

  it('rolls back the sent message and toasts when the send fails', async () => {
    server.use(
      http.post(MESSAGES, () =>
        HttpResponse.json({ message: 'nope' }, { status: 500 }),
      ),
    )
    const { user } = renderWithProviders(
      <ChatPage initialConversationId={humanConvo().id} />,
    )
    const box = await screen.findByPlaceholderText(/^Message /)
    await user.type(box, 'This should fail to send')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() =>
      expect(
        screen.queryByText('This should fail to send'),
      ).not.toBeInTheDocument(),
    )
    expect(showToast).toHaveBeenCalled()
  })

  it('clears unread when a conversation is opened', async () => {
    let markedRead = false
    server.use(
      http.patch(DETAIL, async ({ params, request }) => {
        const body = (await request.json()) as { unread?: number }
        if (body.unread === 0) markedRead = true
        patchConversationDto(String(params.id), body)
        return HttpResponse.json(getConversationDto(String(params.id)))
      }),
    )
    renderWithProviders(
      <ChatPage initialConversationId={pick((c) => c.unread > 0).id} />,
    )
    await waitFor(() => expect(markedRead).toBe(true))
  })
})

describe('ChatPage — plan review pending', () => {
  // Marks when the diet-plan GET (which the review-pending banner reads)
  // has actually resolved, so "the banner stays absent" tests aren't a false
  // positive from asserting before the query ever ran.
  let dietPlanFetched = false
  beforeEach(() => {
    dietPlanFetched = false
  })
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'GET' && request.url.includes('/diet-plan')) {
      dietPlanFetched = true
    }
  })

  it('shows the banner for a user whose plan is in review — a new client, here', async () => {
    const convo = inReviewConvo()
    renderWithProviders(<ChatPage initialConversationId={convo.id} />)
    expect(
      await screen.findByText(/plan review is pending/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Review done' }),
    ).toBeInTheDocument()
  })

  it('does not show the banner once a plan is already reviewed', async () => {
    renderWithProviders(<ChatPage initialConversationId={reviewedConvo().id} />)
    await waitFor(() => expect(dietPlanFetched).toBe(true))
    expect(screen.queryByText(/plan review is pending/i)).toBeNull()
  })

  it('marking review done clears the banner and toasts', async () => {
    const { user } = renderWithProviders(
      <ChatPage initialConversationId={inReviewConvo().id} />,
    )
    await user.click(await screen.findByRole('button', { name: 'Review done' }))
    await waitFor(() =>
      expect(screen.queryByText(/plan review is pending/i)).toBeNull(),
    )
    expect(showToast).toHaveBeenCalledWith(
      expect.stringMatching(/reviewed and ready/i),
    )
  })
})

describe('ChatPage — opened via Manage Plan', () => {
  it('goes straight to the Plan Workspace without flashing the inbox', async () => {
    const { container } = renderWithProviders(
      <ChatPage initialConversationId="c-1" openPlanWorkspace />,
    )
    // Before the workspace opens, the conversation list is not painted — only a
    // neutral placeholder — so the inbox never flashes behind the overlay.
    expect(
      screen.queryByPlaceholderText(/search conversations/i),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Opening plan workspace')).toBeInTheDocument()

    // The Plan Workspace overlay opens on top (its wrapper renders in every
    // load state).
    await waitFor(() =>
      expect(
        container.querySelector('#planWorkspaceOverlay'),
      ).toBeInTheDocument(),
    )
  })

  it('reveals the conversation, not a blank page, when the workspace is closed', async () => {
    const { user } = renderWithProviders(
      <ChatPage initialConversationId="c-1" openPlanWorkspace />,
    )
    // Close the workspace.
    await user.click(
      await screen.findByRole('button', { name: /close plan workspace/i }),
    )
    // Closing must fall back to the conversation behind it — not the opening
    // placeholder (the ?c=&plan=true params are still set).
    expect(
      await screen.findByPlaceholderText(/search conversations/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Opening plan workspace'),
    ).not.toBeInTheDocument()
  })
})

describe('ChatPage — accessibility', () => {
  it('exposes conversation cards as keyboard-activatable buttons', async () => {
    const { container } = renderWithProviders(<ChatPage />)
    await waitFor(() =>
      expect(container.querySelector('.convo-card')).toBeTruthy(),
    )
    const card = container.querySelector('.convo-card')
    expect(card).toHaveAttribute('role', 'button')
    expect(card).toHaveAttribute('tabindex', '0')
  })
})
