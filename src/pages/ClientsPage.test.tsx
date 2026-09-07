// Behavior tests for the Users (Clients) roster page. Covers rendering states,
// every user interaction, the API state matrix, edge cases, and accessibility.
// Routing is faked: the page treats the URL as source of truth and pushes
// changes through useNavigate — we capture those calls and re-render with new
// `search` props to simulate the route round-trip.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { ClientsSearch } from '@/features/clients'
import { CLIENT_FIXTURES } from '@/features/clients/api/clients.mock'
import { ClientsPage } from './ClientsPage'

const API = 'http://localhost:3000'
const CLIENTS = `${API}/clients`
const ACCESS = `${API}/clients/:id/access`

// --- Router seam: capture navigate() calls; stub Link as a plain anchor. ---
const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateSpy,
    Link: ({ children, to }: { children: React.ReactNode; to: unknown }) => (
      <a href={String(to)}>{children}</a>
    ),
  }
})

// --- Toast is fire-and-forget; spy instead of rendering the shell. ---
vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'

function renderPage(
  search: ClientsSearch = {},
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders((<ClientsPage search={search} />) as ReactElement)
}

/** The resulting search object from the most recent navigate() call — resolving
 *  the functional-updater form against a given previous state. */
function lastSearch(prev: Record<string, unknown> = {}) {
  const arg = navigateSpy.mock.calls.at(-1)?.[0] as
    { to?: string; search?: unknown } | undefined
  const s = arg?.search
  return {
    to: arg?.to,
    search: typeof s === 'function' ? s(prev) : s,
  }
}

beforeEach(() => {
  navigateSpy.mockClear()
  vi.mocked(showToast).mockClear()
})
afterEach(() => server.resetHandlers())

// The cohort size is data, not a constant of the UI — derive every count from
// the fixtures so resizing the roster doesn't require editing assertions.
const TOTAL = CLIENT_FIXTURES.length
const PAGE_SIZE = 12
const LAST_PAGE = Math.ceil(TOTAL / PAGE_SIZE)
const FIRST_PAGE_ROWS = Math.min(TOTAL, PAGE_SIZE)

describe('ClientsPage — rendering', () => {
  it('shows a skeleton while the roster loads', () => {
    const { container } = renderPage()
    expect(container.querySelector('.skel')).toBeTruthy()
  })

  it('renders the roster and a correct count on success', async () => {
    renderPage()
    expect(
      await screen.findByText(new RegExp(`of ${TOTAL} users`)),
    ).toBeInTheDocument()
    // One row per user on page 1, plus the header row.
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(FIRST_PAGE_ROWS + 1)
  })

  it('renders the empty state for a query that matches nothing', async () => {
    renderPage({ q: 'zzz-no-match' })
    // The empty panel and the count label both say this, hence getAllByText.
    expect(
      await screen.findByRole('button', { name: 'Clear all filters' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('No users match your filters').length,
    ).toBeGreaterThan(0)
  })

  it('renders an error state with a retry that recovers', async () => {
    server.use(http.get(CLIENTS, () => HttpResponse.error()))
    const { user } = renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
    // Recover: restore the real handler, then retry.
    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(
      await screen.findByText(new RegExp(`of ${TOTAL} users`)),
    ).toBeInTheDocument()
  })
})

describe('ClientsPage — interactions', () => {
  it('debounces the search box into a single navigate', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL} users`))

    await user.type(screen.getByPlaceholderText(/search users/i), 'priya')
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledTimes(1))
    // One call for five keystrokes proves the debounce collapsed them.
    expect(lastSearch()).toMatchObject({
      to: '/clients',
      search: { q: 'priya', page: undefined },
    })
  })

  it('applies the status filter and resets the page', async () => {
    const { user } = renderPage({ page: 2 })
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    await user.selectOptions(
      screen.getByLabelText('Filter by status'),
      'disabled',
    )
    expect(lastSearch({ page: 2 })).toMatchObject({
      to: '/clients',
      search: { status: 'disabled', page: undefined },
    })
  })

  it('applies the expiry filter', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    await user.selectOptions(
      screen.getByLabelText('Filter by plan expiry'),
      'expired',
    )
    expect(lastSearch().search).toMatchObject({ expiry: 'expired' })
  })

  it('paginates: prev disabled on page 1, next navigates', async () => {
    // Served with a total larger than the cohort, so this exercises paging
    // regardless of how many users the seed roster happens to hold.
    const total = PAGE_SIZE * 3
    server.use(
      http.get(CLIENTS, () =>
        HttpResponse.json({
          items: CLIENT_FIXTURES.slice(0, PAGE_SIZE),
          total,
          page: 1,
          pageSize: PAGE_SIZE,
        }),
      ),
    )
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${total}`))

    expect(screen.getByLabelText('Previous page')).toBeDisabled()
    const next = screen.getByLabelText('Next page')
    expect(next).toBeEnabled()
    await user.click(next)
    expect(lastSearch()).toMatchObject({ to: '/clients', search: { page: 2 } })
  })

  it('renders the last page correctly', async () => {
    renderPage({ page: LAST_PAGE })
    const from = (LAST_PAGE - 1) * PAGE_SIZE + 1
    expect(
      await screen.findByText(new RegExp(`${from}.${TOTAL} of ${TOTAL}`)),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeDisabled()
  })

  it('clears all filters from the empty state', async () => {
    const { user } = renderPage({ q: 'zzz-no-match' })
    const clearBtn = await screen.findByRole('button', {
      name: 'Clear all filters',
    })

    await user.click(clearBtn)
    expect(lastSearch()).toEqual({ to: '/clients', search: {} })
  })

  it('row Call and Email actions are tel:/mailto: links', async () => {
    renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    const call = screen.getAllByRole('link', { name: /^Call / })[0]
    expect(call.getAttribute('href')).toMatch(/^tel:/)
    const email = screen.getAllByRole('link', { name: /^Email / })[0]
    expect(email.getAttribute('href')).toMatch(/^mailto:.+@/)
  })

  it('row Manage navigates to the plan workspace', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    await user.click(screen.getAllByRole('button', { name: /^Manage / })[0])
    const call = (navigateSpy.mock.calls.at(-1)?.[0] ?? {}) as {
      to?: string
      search?: { plan?: boolean }
    }
    expect(call.to).toBe('/chat')
    expect(call.search?.plan).toBe(true)
  })

  it('row Chat navigates without opening the workspace', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    await user.click(
      screen.getAllByRole('button', { name: /^Open chat with / })[0],
    )
    const call = (navigateSpy.mock.calls.at(-1)?.[0] ?? {}) as {
      to?: string
      search?: { plan?: boolean }
    }
    expect(call.to).toBe('/chat')
    expect(call.search?.plan).toBeUndefined()
  })

  it('toggling access asks for confirmation, then sends the PATCH', async () => {
    let patched: { id: string; enabled: boolean } | null = null
    server.use(
      http.patch(ACCESS, async ({ params, request }) => {
        const body = (await request.json()) as { enabled: boolean }
        patched = { id: String(params.id), enabled: body.enabled }
        const dto =
          CLIENT_FIXTURES.find((c) => c.id === params.id) ?? CLIENT_FIXTURES[0]
        return HttpResponse.json({ ...dto, accessEnabled: body.enabled })
      }),
    )
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    await user.click(screen.getAllByRole('checkbox', { name: /access$/ })[0])
    // Confirmation dialog appears; nothing sent yet.
    const confirmBtn = await screen.findByRole('button', {
      name: /^(Disable|Enable) user$/,
    })
    expect(patched).toBeNull()

    await user.click(confirmBtn)
    await waitFor(() => expect(patched).not.toBeNull())
  })

  it('cancelling the confirmation sends nothing', async () => {
    let hit = 0
    server.use(
      http.patch(ACCESS, () => {
        hit += 1
        return HttpResponse.json(CLIENT_FIXTURES[0])
      }),
    )
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    await user.click(screen.getAllByRole('checkbox', { name: /access$/ })[0])
    await screen.findByRole('button', { name: /^(Disable|Enable) user$/ })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.queryByRole('button', { name: /^(Disable|Enable) user$/ }),
    ).not.toBeInTheDocument()
    expect(hit).toBe(0)
  })

  it('opens the Extend modal from a row', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    await user.click(screen.getAllByRole('button', { name: /^Extend / })[0])
    expect(
      await screen.findByRole('heading', { name: 'Extend program' }),
    ).toBeInTheDocument()
  })
})

describe('ClientsPage — API states', () => {
  it('500 renders the error panel', async () => {
    server.use(
      http.get(CLIENTS, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    )
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('network failure renders the error panel', async () => {
    server.use(http.get(CLIENTS, () => HttpResponse.error()))
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('401 clears the session via the unauthorized seam and shows the error', async () => {
    const auth = await import('@/lib/api/auth')
    const spy = vi.spyOn(auth, 'notifyUnauthorized')
    server.use(
      http.get(CLIENTS, () =>
        HttpResponse.json({ message: 'nope' }, { status: 401 }),
      ),
    )
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('ClientsPage — edge cases', () => {
  it('renders null adherence, long strings and unusual characters safely', async () => {
    const weird = {
      ...CLIENT_FIXTURES[0],
      id: 'weird-1',
      name: `Zoë 🚀 <script>alert(1)</script> ${'x'.repeat(120)}`,
      adherence: null,
      checkInDays: null,
      // Assigned, so the only em dash on the row is the progress cell's.
      assignedNutritionist: {
        id: 'nut-1',
        name: 'Dr. Priya Sharma',
        initials: 'PS',
        color: '#2F5D50',
      },
    }
    server.use(
      http.get(CLIENTS, () =>
        HttpResponse.json({ items: [weird], total: 1, page: 1, pageSize: 12 }),
      ),
    )
    renderPage()

    // The name is rendered as text (the <script> is inert, not executed).
    expect(
      await screen.findByText((t) => t.includes('Zoë 🚀 <script>')),
    ).toBeInTheDocument()
    // Null adherence shows an em dash rather than a bar.
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('handles a large dataset with correct pagination math', async () => {
    server.use(
      http.get(CLIENTS, () =>
        HttpResponse.json({
          items: CLIENT_FIXTURES.slice(0, PAGE_SIZE),
          total: 1000,
          page: 1,
          pageSize: 12,
        }),
      ),
    )
    renderPage()
    expect(await screen.findByText(/of 1000/)).toBeInTheDocument()
    // ceil(1000 / 12) = 84 pages.
    expect(screen.getByText('Page 1 of 84')).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeEnabled()
  })

  it('keeps the skeleton visible during a slow response, then resolves', async () => {
    server.use(
      http.get(CLIENTS, async () => {
        await delay(150)
        return HttpResponse.json({
          items: CLIENT_FIXTURES.slice(0, PAGE_SIZE),
          total: TOTAL,
          page: 1,
          pageSize: 12,
        })
      }),
    )
    const { container } = renderPage()
    expect(container.querySelector('.skel')).toBeTruthy()
    expect(
      await screen.findByText(new RegExp(`of ${TOTAL}`)),
    ).toBeInTheDocument()
  })
})

describe('ClientsPage — accessibility', () => {
  it('exposes labelled filter controls', async () => {
    renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by plan expiry')).toBeInTheDocument()
  })

  it('gives each row action a unique accessible name', async () => {
    renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))
    const firstRow = screen.getAllByRole('row')[1]
    const utils = within(firstRow)
    expect(utils.getByRole('button', { name: /^Manage / })).toBeInTheDocument()
    expect(utils.getByRole('button', { name: /^Extend / })).toBeInTheDocument()
    expect(utils.getByRole('link', { name: /^Call / })).toBeInTheDocument()
    expect(utils.getByRole('link', { name: /^Email / })).toBeInTheDocument()
  })

  it('confirmation dialog focuses Cancel and closes on Escape', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TOTAL}`))

    await user.click(screen.getAllByRole('checkbox', { name: /access$/ })[0])
    const cancel = await screen.findByRole('button', { name: 'Cancel' })
    expect(cancel).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument()
  })
})
