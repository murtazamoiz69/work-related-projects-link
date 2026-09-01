import { beforeEach, describe, expect, it } from 'vitest'
import {
  changePassword,
  getNotificationPrefs,
  getPracticeDetails,
  updateNotificationPrefs,
  updatePracticeDetails,
} from './settings.api'
import { resetSettingsStore } from './settings.mock'
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_PRACTICE_DETAILS,
} from './settings.types'

describe('settings.api', () => {
  beforeEach(() => resetSettingsStore())

  it('returns default notification prefs, then persists updates', async () => {
    expect(await getNotificationPrefs()).toEqual(DEFAULT_NOTIFICATION_PREFS)
    const next = {
      ...DEFAULT_NOTIFICATION_PREFS,
      weekly: true,
      twoFactor: true,
    }
    expect(await updateNotificationPrefs(next)).toEqual(next)
    expect(await getNotificationPrefs()).toEqual(next)
  })

  it('returns default practice details, then persists updates', async () => {
    expect(await getPracticeDetails()).toEqual(DEFAULT_PRACTICE_DETAILS)
    const next = {
      ...DEFAULT_PRACTICE_DETAILS,
      name: 'New Practice',
      timezone: 'America/Chicago',
    }
    expect(await updatePracticeDetails(next)).toEqual(next)
    expect(await getPracticeDetails()).toEqual(next)
  })

  it('rejects practice details with an empty name (422)', async () => {
    await expect(
      updatePracticeDetails({ ...DEFAULT_PRACTICE_DETAILS, name: '  ' }),
    ).rejects.toMatchObject({ kind: 'validation', status: 422 })
  })

  it('acknowledges a password change', async () => {
    expect(
      await changePassword({
        currentPassword: 'old',
        newPassword: 'longenough',
      }),
    ).toEqual({ ok: true })
  })

  it('rejects a password change with no current password (422)', async () => {
    await expect(
      changePassword({ currentPassword: '', newPassword: 'longenough' }),
    ).rejects.toMatchObject({ kind: 'validation', status: 422 })
  })
})
