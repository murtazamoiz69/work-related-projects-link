export type {
  NotificationPrefs,
  PracticeDetails,
  ChangePasswordBody,
} from './api/settings.types'
export {
  getNotificationPrefs,
  updateNotificationPrefs,
  getPracticeDetails,
  updatePracticeDetails,
  changePassword,
} from './api/settings.api'
export {
  useNotificationPrefsQuery,
  useUpdateNotificationPrefs,
  usePracticeQuery,
  useUpdatePractice,
  useChangePassword,
} from './hooks/useSettingsQueries'
