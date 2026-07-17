import { create } from 'zustand'

type ToastState = {
  message: string
  visible: boolean
}

const useToastStore = create<ToastState>(() => ({
  message: '',
  visible: false,
}))

let hideTimer: ReturnType<typeof setTimeout> | undefined

/** V2's appShellToast — a transient bottom-center pill. */
export function showToast(message: string): void {
  useToastStore.setState({ message, visible: true })
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    useToastStore.setState({ visible: false })
  }, 2400)
}

export function useToast(): ToastState {
  return useToastStore()
}
