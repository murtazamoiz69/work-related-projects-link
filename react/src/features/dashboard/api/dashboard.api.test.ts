import { describe, expect, it } from 'vitest'
import {
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

  it('returns needs-attention rows with embedded clients + week dots + counts', async () => {
    const res = await getNeedsAttention('needs-attention')
    expect(Array.isArray(res.rows)).toBe(true)
    expect(res.filters.length).toBeGreaterThan(0)
    expect(res.counts).toHaveProperty('needs-attention')
    if (res.rows.length) {
      expect(res.rows[0].client.name).toBeTruthy()
      expect(res.rows[0].week).toHaveLength(7)
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
