// React Query keys for a client's plan workspace.
export const planKeys = {
  all: ['plan'] as const,
  detail: (clientId: string) => ['plan', 'detail', clientId] as const,
}
