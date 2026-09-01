// React Query keys for the settings feature.
export const settingsKeys = {
  all: ['settings'] as const,
  notificationPrefs: () => ['settings', 'notification-preferences'] as const,
  practice: () => ['settings', 'practice'] as const,
}
