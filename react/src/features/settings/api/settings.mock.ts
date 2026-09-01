// Mock backend for user settings. Notification prefs + practice details are
// localStorage-backed (reusing the original prototype keys, so existing data
// and reload-persistence carry over). Password change has no store — it just
// validates. Reset with resetSettingsStore() in tests.
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_PRACTICE_DETAILS,
  type NotificationPrefs,
  type PracticeDetails,
} from './settings.types'

const PREFS_KEY = 'nourishNotificationPrefs'
const PRACTICE_KEY = 'nourishPracticeDetails'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

export function getNotificationPrefs(): NotificationPrefs {
  return load(PREFS_KEY, DEFAULT_NOTIFICATION_PREFS)
}

export function setNotificationPrefs(
  next: NotificationPrefs,
): NotificationPrefs {
  save(PREFS_KEY, next)
  return next
}

export function getPracticeDetails(): PracticeDetails {
  return load(PRACTICE_KEY, DEFAULT_PRACTICE_DETAILS)
}

export function setPracticeDetails(next: PracticeDetails): PracticeDetails {
  save(PRACTICE_KEY, next)
  return next
}

export function resetSettingsStore(): void {
  try {
    localStorage.removeItem(PREFS_KEY)
    localStorage.removeItem(PRACTICE_KEY)
  } catch {
    /* ignore */
  }
}
