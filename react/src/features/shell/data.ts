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
  { icon: 'calendar-x', tone: 'red', title: 'Priya Sharma missed 3 consecutive check-ins', time: 12, read: false },
  { icon: 'message-circle', tone: 'blue', title: 'Marcus Chen sent a new message', time: 38, read: false },
  { icon: 'user-plus', tone: 'amber', title: 'Sofia Martins signed up — needs a welcome message', time: 55, read: false },
  { icon: 'clipboard-check', tone: 'green', title: 'James Okafor completed Week 4 of Mass Gain Blueprint', time: 130, read: true },
  { icon: 'calendar-clock', tone: 'amber', title: "Tom Wilson's plan renewal is due in 2 days", time: 260, read: true },
  { icon: 'heart-pulse', tone: 'red', title: 'Elena Rodriguez reported severe fatigue & nausea', time: 340, read: true },
]

export type Profile = {
  name: string
  role: string
  initials: string
  color: string
}

export const SWITCH_PROFILES: Profile[] = [
  { name: 'Sarah Nolan', role: 'Lead Nutritionist', initials: 'SN', color: '#2F5D50' },
  { name: 'James Okoro, RD', role: 'Nutritionist', initials: 'JO', color: '#5B7FA6' },
  { name: 'Priya Anand', role: 'Nutritionist', initials: 'PA', color: '#B0598A' },
]

export function minutesAgoLabel(mins: number): string {
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}
