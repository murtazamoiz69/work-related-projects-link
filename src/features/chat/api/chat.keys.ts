// React Query keys for the chat feature.
export const chatKeys = {
  all: ['conversations'] as const,
  list: () => ['conversations', 'list'] as const,
  tabs: () => ['conversations', 'tabs'] as const,
  detail: (id: string) => ['conversations', 'detail', id] as const,
}
