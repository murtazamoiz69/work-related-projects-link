export { KpiRow } from './components/KpiRow'
export { NeedsAttentionPanel } from './components/NeedsAttentionPanel'
export { ClientProgressPanel } from './components/ClientProgressPanel'
export { UpcomingExpiryPanel } from './components/UpcomingExpiryPanel'
export type { WeekDay, WeekDayTier } from './types'

// API layer
export {
  getKpis,
  getNeedsAttention,
  getUpcomingExpirations,
  getClientProgress,
  getDashboardPrograms,
} from './api/dashboard.api'

// Query hooks
export {
  useKpisQuery,
  useNeedsAttentionQuery,
  useUpcomingExpiryQuery,
  useClientProgressQuery,
  useDashboardProgramsQuery,
} from './hooks/useDashboardQueries'
