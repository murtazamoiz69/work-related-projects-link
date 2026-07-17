import { create } from 'zustand'
import { APP_NOTIFICATIONS, type AppNotification } from '@/features/shell/data'

type NotificationsState = {
  notifications: AppNotification[]
  markRead: (index: number) => void
  markAllRead: () => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: APP_NOTIFICATIONS.map((n) => ({ ...n })),
  markRead: (index) =>
    set((s) => ({
      notifications: s.notifications.map((n, i) =>
        i === index ? { ...n, read: true } : n,
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
}))
