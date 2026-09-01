// Settings service — user notification prefs, practice details, password.
import { get, put } from '@/lib/api/client'
import type {
  ChangePasswordBody,
  NotificationPrefs,
  PracticeDetails,
} from './settings.types'

export async function getNotificationPrefs(
  signal?: AbortSignal,
): Promise<NotificationPrefs> {
  return get<NotificationPrefs>('/me/notification-preferences', { signal })
}

export async function updateNotificationPrefs(
  prefs: NotificationPrefs,
): Promise<NotificationPrefs> {
  return put<NotificationPrefs>('/me/notification-preferences', prefs)
}

export async function getPracticeDetails(
  signal?: AbortSignal,
): Promise<PracticeDetails> {
  return get<PracticeDetails>('/me/practice', { signal })
}

export async function updatePracticeDetails(
  practice: PracticeDetails,
): Promise<PracticeDetails> {
  return put<PracticeDetails>('/me/practice', practice)
}

export async function changePassword(
  body: ChangePasswordBody,
): Promise<{ ok: true }> {
  return put<{ ok: true }>('/me/password', body)
}
