// Behavior tests for the Nutritionists admin page (Super-Admin only). Covers
// rendering states, interactions, the API state matrix, the role guard, an
// edge-case dataset, and accessibility. Routing is faked via useNavigate; the
// stateful mock is reset per test; the auth store is signed in so
// the page renders.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { useAuthStore } from '@/store/useAuthStore'
import { resetNutritionistStore } from '@/features/nutritionists/api/nutritionists.mock'
import type { NutritionistsSearch } from '@/features/nutritionists'
import { NutritionistsPage } from './NutritionistsPage'

const API = 'http://localhost:3000'
const LIST = `${API}/nutritionists`
const ACCESS = `${API}/nutritionists/:id/access`

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

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'
import { NUTRITIONISTS_DATA } from '@/features/nutritionists/data'

// Team size is data — derive it rather than hardcoding.
const TEAM = NUTRITIONISTS_DATA.length

const PROFILE = {
  name: 'Alex Rivera',
  initials: 'AR',
  color: '#7A5AA8',
  email: 'alex@nourishwithsim.com',
}

function renderPage(
  search: NutritionistsSearch = {},
): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    (<NutritionistsPage search={search} />) as ReactElement,
  )
}

function lastSearch(prev: Record<string, unknown> = {}) {
  const arg = navigateSpy.mock.calls.at(-1)?.[0] as
    { to?: string; search?: unknown } | undefined
  const s = arg?.search
  return { to: arg?.to, search: typeof s === 'function' ? s(prev) : s }
}

beforeEach(() => {
  navigateSpy.mockClear()
  vi.mocked(showToast).mockClear()
  resetNutritionistStore()
  useAuthStore.setState({ isAuthenticated: true, activeProfile: PROFILE })
})
afterEach(() => server.resetHandlers())

describe('NutritionistsPage — rendering', () => {
  it('shows a skeleton while the roster loads', () => {
    const { container } = renderPage()
    expect(container.querySelector('.skel')).toBeTruthy()
  })

  it('renders the roster and a correct count', async () => {
    renderPage()
    expect(
      await screen.findByText(new RegExp(`of ${TEAM} nutritionists`)),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(TEAM + 1) // + header
  })

  it('renders the empty state for a query that matches nothing', async () => {
    renderPage({ q: 'zzz-no-match' })
    expect(
      await screen.findByRole('button', { name: 'Clear all filters' }),
    ).toBeInTheDocument()
  })

  it('renders an error state with a retry that recovers', async () => {
    server.use(http.get(LIST, () => HttpResponse.error()))
    const { user } = renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(
      await screen.findByText(new RegExp(`of ${TEAM} nutritionists`)),
    ).toBeInTheDocument()
  })
})

describe('NutritionistsPage — access', () => {
  // One role: managing other nutritionists is part of every account, so the
  // page renders for any signed-in user with no redirect.
  it('renders the roster for any signed-in nutritionist', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'Nutritionist Roster' }),
    ).toBeInTheDocument()
    expect(navigateSpy).not.toHaveBeenCalledWith({ to: '/' })
  })
})

describe('NutritionistsPage — interactions', () => {
  it('debounces the search box into a single navigate', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TEAM} nutritionists`))

    await user.type(screen.getByPlaceholderText(/search nutritionists/i), 'ben')
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledTimes(1))
    expect(lastSearch()).toMatchObject({
      to: '/nutritionists',
      search: { q: 'ben', page: undefined },
    })
  })

  it('applies the status filter', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))

    await user.selectOptions(
      screen.getByLabelText('Filter by status'),
      'disabled',
    )
    expect(lastSearch().search).toMatchObject({ status: 'disabled' })
  })

  it('clears filters from the empty state', async () => {
    const { user } = renderPage({ q: 'zzz-no-match' })
    const clear = await screen.findByRole('button', {
      name: 'Clear all filters',
    })
    await user.click(clear)
    expect(lastSearch()).toEqual({ to: '/nutritionists', search: {} })
  })

  it('opens the Add nutritionist modal', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))

    await user.click(screen.getByRole('button', { name: /add nutritionist/i }))
    expect(
      await screen.findByRole('heading', { name: 'Add nutritionist' }),
    ).toBeInTheDocument()
  })

  it('opens the Edit modal from a row, prefilled', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))

    await user.click(screen.getAllByRole('button', { name: /^Edit / })[0])
    expect(
      await screen.findByRole('heading', { name: 'Edit nutritionist' }),
    ).toBeInTheDocument()
  })

  it('opens the members modal from a row', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))

    await user.click(screen.getAllByRole('button', { name: /members$/ })[0])
    expect(
      await screen.findByRole('heading', { name: /members$/ }),
    ).toBeVisible()
  })

  it('row Email action is a mailto: link; Call is disabled without a phone', async () => {
    renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))

    const email = screen.getAllByRole('link', { name: /^Email / })[0]
    expect(email.getAttribute('href')).toMatch(/^mailto:.+@/)
    expect(
      screen.getAllByRole('button', { name: /^No phone number for / })[0],
    ).toBeDisabled()
  })

  it('toggling access confirms, then sends the PATCH', async () => {
    let patched: { id: string; enabled: boolean } | null = null
    server.use(
      http.patch(ACCESS, async ({ params, request }) => {
        const body = (await request.json()) as { enabled: boolean }
        patched = { id: String(params.id), enabled: body.enabled }
        return HttpResponse.json({
          id: String(params.id),
          name: 'Someone',
          initials: 'SO',
          color: '#000',
          email: 's@x.com',
          qualification: 'RD',
          experienceYears: 5,
          joinDate: new Date().toISOString(),
          memberIds: [],
          accessEnabled: body.enabled,
        })
      }),
    )
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))

    await user.click(
      screen.getAllByRole('checkbox', { name: /^(Disable|Enable) / })[0],
    )
    const confirm = await screen.findByRole('button', {
      name: /^(Disable|Enable) nutritionist$/,
    })
    expect(patched).toBeNull()
    await user.click(confirm)
    await waitFor(() => expect(patched).not.toBeNull())
  })
})

describe('NutritionistsPage — API states', () => {
  it('500 renders the error panel', async () => {
    server.use(
      http.get(LIST, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    )
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('network failure renders the error panel', async () => {
    server.use(http.get(LIST, () => HttpResponse.error()))
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})

describe('NutritionistsPage — edge cases', () => {
  it('computes pagination for a large dataset', async () => {
    server.use(
      http.get(LIST, ({ request }) => {
        const url = new URL(request.url)
        const pageSize = Number(url.searchParams.get('pageSize')) || 12
        // 500 total, return a single filled page.
        const items = Array.from({ length: pageSize }, (_, i) => ({
          id: `big-${i}`,
          name: `Nutritionist ${i}`,
          initials: 'NN',
          color: '#000',
          email: `n${i}@x.com`,
          qualification: 'RD',
          experienceYears: 1,
          joinDate: new Date().toISOString(),
          memberIds: [],
          accessEnabled: true,
        }))
        return HttpResponse.json({ items, total: 500, page: 1, pageSize })
      }),
    )
    renderPage()
    expect(await screen.findByText(/of 500/)).toBeInTheDocument()
    // ceil(500 / 12) = 42 pages.
    expect(screen.getByText('Page 1 of 42')).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeEnabled()
  })
})

describe('NutritionistsPage — accessibility', () => {
  it('exposes a labelled status filter', async () => {
    renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument()
  })

  it('gives each row action a unique accessible name', async () => {
    renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))
    const firstRow = screen.getAllByRole('row')[1]
    const utils = within(firstRow)
    // No phone on file for nutritionists — Call is present but disabled.
    expect(
      utils.getByRole('button', { name: /^No phone number for / }),
    ).toBeInTheDocument()
    expect(utils.getByRole('link', { name: /^Email / })).toBeInTheDocument()
    expect(utils.getByRole('button', { name: /^Edit / })).toBeInTheDocument()
  })

  it('confirmation dialog focuses Cancel and closes on Escape', async () => {
    const { user } = renderPage()
    await screen.findByText(new RegExp(`of ${TEAM}`))

    await user.click(
      screen.getAllByRole('checkbox', { name: /^(Disable|Enable) / })[0],
    )
    const cancel = await screen.findByRole('button', { name: 'Cancel' })
    expect(cancel).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument()
  })
})
