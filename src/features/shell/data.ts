// Global chrome data — ported from V2 app-shell.js.

export type NotificationTone = 'red' | 'blue' | 'amber' | 'green'

export type AppNotification = {
  icon: string
  tone: NotificationTone
  title: string
  time: number // minutes ago
  read: boolean
}

export const APP_NOTIFICATIONS: AppNotification[] = [
  {
    icon: 'calendar-x',
    tone: 'red',
    title: 'Priya Sharma missed 3 consecutive check-ins',
    time: 12,
    read: false,
  },
  {
    icon: 'message-circle',
    tone: 'blue',
    title: 'Marcus Chen sent a new message',
    time: 38,
    read: false,
  },
  {
    icon: 'user-plus',
    tone: 'amber',
    title: 'Sofia Martins signed up — needs a welcome message',
    time: 55,
    read: false,
  },
  {
    icon: 'clipboard-check',
    tone: 'green',
    title: 'James Okafor completed Week 4 of Mass Gain Blueprint',
    time: 130,
    read: true,
  },
  {
    icon: 'calendar-clock',
    tone: 'amber',
    title: "Tom Wilson's plan renewal is due in 2 days",
    time: 260,
    read: true,
  },
  {
    icon: 'heart-pulse',
    tone: 'red',
    title: 'Elena Rodriguez reported severe fatigue & nausea',
    time: 340,
    read: true,
  },
]

// There is one role in this product — every account is a nutritionist with the
// same full access, so a `role` field would only ever hold one value and is
// deliberately absent rather than carried around unused.
export type Profile = {
  name: string
  initials: string
  color: string
  email?: string
  phone?: string
  bio?: string
  /** Uploaded profile photo as a data URL. When set it replaces the
   *  initials-on-color avatar everywhere the profile is shown. */
  photo?: string
}

export const DEFAULT_PROFILE: Profile = {
  name: 'Sarah Nolan',
  initials: 'SN',
  color: '#2F5D50',
  email: 'sarah@nourishwithsim.com',
}

export function minutesAgoLabel(mins: number): string {
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}
