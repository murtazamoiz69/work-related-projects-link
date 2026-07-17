import { useToast } from '@/lib/toast'

/** Renders the transient `.search-toast` pill driven by lib/toast. */
export function ShellToast() {
  const { message, visible } = useToast()
  return (
    <div className={`search-toast${visible ? ' show' : ''}`}>{message}</div>
  )
}
