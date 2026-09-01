import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names, resolving conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Route-active check shared by the sidebar's nav rows: exact match for
 *  "/", prefix match for everything else so nested routes stay highlighted. */
export function isNavPathActive(pathname: string, to: string): boolean {
  return to === '/' ? pathname === '/' : pathname.startsWith(to)
}

/** First letters of the first two words, uppercased ("Sarah Nolan" -> "SN").
 *  Falls back to `fallback` when the name yields nothing. */
export function getInitials(name: string, fallback = ''): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || fallback
  )
}

/** "07:30" -> "7:30 AM". Empty in, empty out. */
export function formatTime12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${period}`
}
