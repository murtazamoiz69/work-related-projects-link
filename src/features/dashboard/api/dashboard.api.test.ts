import { describe, expect, it } from 'vitest'
import { isApiError } from '@/lib/api/types'
import {
  getAttentionFilters,
  getClientProgress,
  getDashboardPrograms,
  getKpis,
  getNeedsAttention,
  getUpcomingExpirations,
} from './dashboard.api'

describe('dashboard.api', () => {
  it('returns KPI counts', async () => {
    const k = await getKpis()
    expect(typeof k.total).toBe('number')
    expect(k.mealsLogged).toBeLessThanOrEqual(k.total)
  })

  it('returns the chip metadata with a default key the client can open with', async () => {
    const meta = await getAttentionFilters()
    expect(meta.filters.length).toBeGreaterThan(0)
    expect(meta.counts).toHaveProperty('needs-attention')
    expect(meta.weekRange).toBeTruthy()
    // defaultKey must be one of the offered chips — the client opens on it.
    expect(meta.filters.map((f) => f.key)).toContain(meta.defaultKey)
  })

  it('returns needs-attention rows with embedded clients + week dots', async () => {
    const meta = await getAttentionFilters()
    const res = await getNeedsAttention(meta.defaultKey)
    expect(Array.isArray(res.rows)).toBe(true)
    if (res.rows.length) {
      expect(res.rows[0].client.name).toBeTruthy()
      expect(res.rows[0].week).toHaveLength(7)
    }
  })

  it('rejects a rows request with no filter key (422)', async () => {
    try {
      // Bypass the typed api (which always sends a key) to prove the contract.
      await getNeedsAttention('')
      throw new Error('expected rejection')
    } catch (e) {
      expect(isApiError(e)).toBe(true)
      if (isApiError(e)) expect(e.kind).toBe('validation')
    }
  })

  it('returns upcoming expirations sorted soonest-first, all within 7 days', async () => {
    const rows = await getUpcomingExpirations()
    expect(rows.every((r) => r.daysLeft <= 7)).toBe(true)
    const days = rows.map((r) => r.daysLeft)
    expect(days).toEqual([...days].sort((a, b) => a - b))
    if (rows.length) expect(rows[0].client.id).toBeTruthy()
  })

  it('returns client-progress series for a range/program', async () => {
    const data = await getClientProgress(30, 'all')
    expect(data.ticks.length).toBe(data.meals.values.length)
    expect(data.workouts.values.length).toBe(data.ticks.length)
    expect(typeof data.activeClients).toBe('number')
  })

  it('returns the distinct program options', async () => {
    const programs = await getDashboardPrograms()
    expect(programs.length).toBeGreaterThan(0)
    expect(new Set(programs).size).toBe(programs.length)
  })
})
