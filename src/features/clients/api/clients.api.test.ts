import { beforeEach, describe, expect, it } from 'vitest'
import { isApiError } from '@/lib/api/types'
import { listNutritionists } from '@/features/nutritionists/api/nutritionists.api'
import { resetNutritionistStore } from '@/features/nutritionists/api/nutritionists.mock'
import {
  bulkCreateClients,
  createClient,
  extendClientExpiry,
  getClientPrograms,
  getClientsSummary,
  listClients,
  updateClientAccess,
} from './clients.api'
import { CLIENT_FIXTURES, resetClientStore } from './clients.mock'

describe('clients.api', () => {
  // Both mocks are stateful, and creating a user writes to each — the roster,
  // and the assigned nutritionist's caseload. Reset them together so the
  // seeded-count assertions below don't depend on test order.
  beforeEach(() => {
    resetClientStore()
    resetNutritionistStore()
  })

  describe('listClients', () => {
    it('returns domain clients (Date fields) sorted soonest-expiring first', async () => {
      const { items, total } = await listClients({ pageSize: 100 })
      expect(total).toBe(CLIENT_FIXTURES.length)
      expect(items[0].expiryDate).toBeInstanceOf(Date)
      expect(items[0].joinDate).toBeInstanceOf(Date)
      // sorted ascending by expiry
      const times = items.map((c) => c.expiryDate.getTime())
      expect(times).toEqual([...times].sort((a, b) => a - b))
    })

    it('paginates', async () => {
      const page1 = await listClients({ page: 1, pageSize: 3 })
      const page2 = await listClients({ page: 2, pageSize: 3 })
      expect(page1.items).toHaveLength(3)
      expect(page1.page).toBe(1)
      expect(page1.items[0].id).not.toBe(page2.items[0].id)
    })

    it('filters by status', async () => {
      const { items } = await listClients({ status: 'disabled', pageSize: 100 })
      expect(items.length).toBeGreaterThan(0)
      expect(items.every((c) => !c.accessEnabled)).toBe(true)
    })

    it('filters by diet-plan review state', async () => {
      const waiting = await listClients({ review: 'in-review', pageSize: 100 })
      const done = await listClients({ review: 'reviewed', pageSize: 100 })
      // Both states are seeded — the roster is a queue, and an empty one would
      // make the filter untestable and the Users page misleading.
      expect(waiting.items.length).toBeGreaterThan(0)
      expect(done.items.length).toBeGreaterThan(0)
      expect(waiting.items.every((c) => c.dietReview === 'in-review')).toBe(
        true,
      )
      expect(done.items.every((c) => c.dietReview === 'reviewed')).toBe(true)
      const all = await listClients({ pageSize: 100 })
      expect(waiting.total + done.total).toBe(all.total)
    })

    it('filters by search haystack', async () => {
      const { items } = await listClients({ search: 'priya', pageSize: 100 })
      expect(items.every((c) => /priya/i.test(c.name))).toBe(true)
    })

    it('returns an empty page for a query that matches nothing', async () => {
      const { items, total } = await listClients({ search: 'zzz-no-match' })
      expect(items).toHaveLength(0)
      expect(total).toBe(0)
    })
  })

  it('getClientsSummary counts add up to the roster size', async () => {
    const s = await getClientsSummary()
    // Three access states now, not two: every user is invited, active or
    // disabled, and the three must still partition the roster.
    expect(s.invited + s.active + s.disabled).toBe(s.total)
    expect(s.total).toBe(CLIENT_FIXTURES.length)
  })

  describe('updateClientAccess', () => {
    it('returns the updated client', async () => {
      const updated = await updateClientAccess('c-1', { enabled: false })
      expect(updated.id).toBe('c-1')
      expect(updated.accessEnabled).toBe(false)
    })

    it('rejects with a not-found ApiError for an unknown id', async () => {
      await expect(
        updateClientAccess('nope', { enabled: true }),
      ).rejects.toMatchObject({ kind: 'not-found', status: 404 })
    })
  })

  describe('extendClientExpiry', () => {
    it('rejects a past date with a field-level validation error', async () => {
      try {
        await extendClientExpiry('c-1', {
          expiryDate: new Date(Date.now() - 86_400_000).toISOString(),
        })
        throw new Error('expected rejection')
      } catch (e) {
        expect(isApiError(e)).toBe(true)
        if (isApiError(e)) {
          expect(e.kind).toBe('validation')
          expect(e.fields?.expiryDate).toBeTruthy()
        }
      }
    })

    it('accepts a future date and returns the new expiry', async () => {
      const future = new Date(Date.now() + 30 * 86_400_000).toISOString()
      const updated = await extendClientExpiry('c-1', { expiryDate: future })
      expect(updated.expiryDate.getTime()).toBe(new Date(future).getTime())
    })
  })

  describe('getClientPrograms', () => {
    it('returns the assignable plan names', async () => {
      const programs = await getClientPrograms()
      expect(programs.length).toBeGreaterThan(0)
      expect(programs).toContain('Weight Loss')
    })
  })

  describe('createClient', () => {
    const NEW_USER = {
      name: 'Jordan Lee',
      email: 'jordan.lee@email.com',
      phone: '+1 555 123 4567',
      program: 'Weight Loss',
      weeks: 12,
    }

    it('creates a user who then appears in the roster and the summary', async () => {
      const before = await getClientsSummary()
      const created = await createClient(NEW_USER)

      expect(created.initials).toBe('JL')
      expect(created.status).toBe('new')
      expect(created.adherence).toBeNull()
      expect(created.phone).toBe(NEW_USER.phone)
      // Program length drives the expiry: 12 weeks out, give or take a day.
      const weeksOut = (created.expiryDate.getTime() - Date.now()) / 86_400_000
      expect(weeksOut).toBeGreaterThan(12 * 7 - 1)

      const { items } = await listClients({
        search: 'jordan.lee',
        pageSize: 50,
      })
      expect(items.some((c) => c.id === created.id)).toBe(true)

      const after = await getClientsSummary()
      expect(after.total).toBe(before.total + 1)
    })

    it('assigns the new user to the least-loaded nutritionist', async () => {
      const { items } = await listNutritionists({ pageSize: 100 })
      const eligible = items.filter((n) => n.accessEnabled)
      const lightest = eligible.reduce((a, b) =>
        b.memberIds.length < a.memberIds.length ? b : a,
      )

      const created = await createClient(NEW_USER)
      expect(created.assignedNutritionist?.id).toBe(lightest.id)

      // The assignment is a real caseload change, not just a label.
      const after = await listNutritionists({ pageSize: 100 })
      const updated = after.items.find((n) => n.id === lightest.id)
      expect(updated?.memberIds).toContain(created.id)
    })

    it('never assigns to a disabled nutritionist', async () => {
      const { items } = await listNutritionists({
        status: 'disabled',
        pageSize: 100,
      })
      const disabledIds = new Set(items.map((n) => n.id))
      expect(disabledIds.size).toBeGreaterThan(0)

      const created = await createClient(NEW_USER)
      expect(disabledIds.has(created.assignedNutritionist?.id ?? '')).toBe(
        false,
      )
    })

    it('maps a duplicate email onto the email field (422)', async () => {
      const taken = CLIENT_FIXTURES[0].email
      try {
        await createClient({ ...NEW_USER, email: taken })
        throw new Error('expected rejection')
      } catch (e) {
        expect(isApiError(e)).toBe(true)
        if (isApiError(e)) {
          expect(e.kind).toBe('validation')
          expect(e.fields?.email).toBeTruthy()
        }
      }
    })

    it('rejects an unknown plan and a non-positive duration', async () => {
      await expect(
        createClient({ ...NEW_USER, program: 'Not A Plan' }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
      await expect(
        createClient({ ...NEW_USER, email: 'other@email.com', weeks: 0 }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })
  })

  describe('bulkCreateClients', () => {
    const rows = [
      {
        name: 'Ada Byron',
        email: 'ada@email.com',
        phone: '111',
        program: 'Muscle Gain',
        weeks: 8,
      },
      // Duplicate of the row above — caught within the same payload.
      {
        name: 'Ada Again',
        email: 'ADA@email.com',
        phone: '222',
        program: 'Muscle Gain',
        weeks: 8,
      },
      {
        name: 'Bad Plan',
        email: 'bad@email.com',
        phone: '333',
        program: 'Nonsense',
        weeks: 8,
      },
    ]

    it('creates the valid rows and reports the rest by index', async () => {
      const { created, skipped } = await bulkCreateClients({ users: rows })
      expect(created).toHaveLength(1)
      expect(created[0].name).toBe('Ada Byron')
      expect(skipped.map((s) => s.row)).toEqual([1, 2])
      expect(skipped[0].reasons.join()).toMatch(/already exists/i)
      expect(skipped[1].reasons.join()).toMatch(/Unrecognized plan/i)

      const { total } = await listClients({ search: 'ada@email.com' })
      expect(total).toBe(1)
    })

    it('spreads the batch across nutritionists instead of stacking one', async () => {
      const many = Array.from({ length: 6 }, (_, i) => ({
        name: `Bulk Person ${i}`,
        email: `bulk.person.${i}@email.com`,
        phone: `55500${i}`,
        program: 'General Wellness',
        weeks: 8,
      }))
      const { created } = await bulkCreateClients({ users: many })
      expect(created).toHaveLength(6)

      const assignees = created.map((c) => c.assignedNutritionist?.id)
      expect(assignees.every(Boolean)).toBe(true)
      // Six users must not all land on the same person; balancing by current
      // load means each pick moves on once that nutritionist catches up.
      expect(new Set(assignees).size).toBeGreaterThan(1)
    })

    it('dryRun returns the same verdicts without creating anyone', async () => {
      const before = await getClientsSummary()
      const dry = await bulkCreateClients({ users: rows, dryRun: true })
      const after = await getClientsSummary()

      expect(dry.created).toHaveLength(1)
      expect(dry.skipped.map((s) => s.row)).toEqual([1, 2])
      expect(after.total).toBe(before.total)
    })
  })
})
