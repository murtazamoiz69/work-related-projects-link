// React Query keys for the dashboard's read-only queries.
export const dashboardKeys = {
  all: ['dashboard'] as const,
  kpis: () => ['dashboard', 'kpis'] as const,
  attentionFilters: () => ['dashboard', 'attention-filters'] as const,
  needsAttention: (filter: string) =>
    ['dashboard', 'needs-attention', filter] as const,
  upcomingExpirations: () => ['dashboard', 'upcoming-expirations'] as const,
  clientProgress: (range: number, program: string) =>
    ['dashboard', 'client-progress', range, program] as const,
  programs: () => ['dashboard', 'programs'] as const,
}
