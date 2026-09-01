// React Query keys for the programs feature (single global program).
export const programKeys = {
  all: ['program'] as const,
  detail: () => ['program', 'detail'] as const,
}
