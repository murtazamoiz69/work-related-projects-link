import { beforeEach, describe, expect, it } from 'vitest'
import { isApiError } from '@/lib/api/types'
import {
  createNutritionist,
  getNutritionistMembers,
  listNutritionists,
  updateNutritionist,
  updateNutritionistAccess,
} from './nutritionists.api'
import { resetNutritionistStore } from './nutritionists.mock'

describe('nutritionists.api', () => {
  // The mock is stateful — reset it before each test for isolation.
  beforeEach(() => resetNutritionistStore())

  it('lists nutritionists (Date joinDate) sorted by name', async () => {
    const { items, total } = await listNutritionists({ pageSize: 100 })
    expect(total).toBeGreaterThan(0)
    expect(items[0].joinDate).toBeInstanceOf(Date)
    const names = items.map((n) => n.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it('filters by status', async () => {
    const { items } = await listNutritionists({
      status: 'disabled',
      pageSize: 100,
    })
    expect(items.every((n) => !n.accessEnabled)).toBe(true)
  })

  it('creates a nutritionist and it persists in the roster', async () => {
    const created = await createNutritionist({
      name: 'Test Person',
      email: 'test.person@nourishwithsim.com',
      qualification: 'Registered Dietitian',
      experienceYears: 3,
    })
    expect(created.id).toBeTruthy()
    expect(created.initials).toBe('TP')

    const { items } = await listNutritionists({
      search: 'test.person',
      pageSize: 100,
    })
    expect(items.some((n) => n.id === created.id)).toBe(true)
  })

  it('rejects create with missing fields (422)', async () => {
    await expect(
      createNutritionist({
        name: '',
        email: '',
        qualification: 'x',
        experienceYears: 1,
      }),
    ).rejects.toMatchObject({ kind: 'validation', status: 422 })
  })

  it('edits a nutritionist', async () => {
    const { items } = await listNutritionists({ pageSize: 1 })
    const target = items[0]
    const updated = await updateNutritionist(target.id, {
      name: 'Renamed Person',
      email: target.email,
      qualification: target.qualification,
      experienceYears: target.experienceYears,
    })
    expect(updated.name).toBe('Renamed Person')
    expect(updated.initials).toBe('RP')
  })

  it('toggles access', async () => {
    const { items } = await listNutritionists({ pageSize: 1 })
    const target = items[0]
    const updated = await updateNutritionistAccess(target.id, {
      enabled: !target.accessEnabled,
    })
    expect(updated.accessEnabled).toBe(!target.accessEnabled)
  })

  it('returns members for a nutritionist', async () => {
    const { items } = await listNutritionists({ pageSize: 100 })
    const withMembers = items.find((n) => n.memberIds.length > 0)
    expect(withMembers).toBeTruthy()
    if (withMembers) {
      const members = await getNutritionistMembers(withMembers.id)
      expect(members).toHaveLength(withMembers.memberIds.length)
      expect(members[0]).toHaveProperty('email')
    }
  })

  it('rejects members for an unknown id (404)', async () => {
    try {
      await getNutritionistMembers('nope')
      throw new Error('expected rejection')
    } catch (e) {
      expect(isApiError(e)).toBe(true)
      if (isApiError(e)) expect(e.kind).toBe('not-found')
    }
  })
})
