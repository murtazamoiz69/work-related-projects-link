// Settings API contracts. No date fields, so DTO and domain shapes are equal.
// Profile is intentionally NOT here: it is session identity, owned by the auth
// store (and the future /me/profile endpoint in the auth phase).

export type NotificationPrefs = {
  email: boolean
  push: boolean
  chatAlerts: boolean
  weekly: boolean
  twoFactor: boolean
}

export type PracticeDetails = {
  name: string
  timezone: string
  workingHours: string
}

export type ChangePasswordBody = {
  currentPassword: string
  newPassword: string
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  email: true,
  push: true,
  chatAlerts: true,
  weekly: false,
  twoFactor: false,
}

export const DEFAULT_PRACTICE_DETAILS: PracticeDetails = {
  name: 'Nourish with Nourish AI',
  timezone: 'America/New_York',
  workingHours: '9-5',
}
