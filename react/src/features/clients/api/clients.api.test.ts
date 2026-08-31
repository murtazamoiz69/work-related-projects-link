import { describe, expect, it } from 'vitest'
import { isApiError } from '@/lib/api/types'
import {
  extendClientExpiry,
  getClientsSummary,
  listClients,
  updateClientAccess,
} from './clients.api'
import { CLIENT_FIXTURES } from './clients.mock'

describe('clients.api', () => {
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
    expect(s.active + s.disabled).toBe(s.total)
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
})
