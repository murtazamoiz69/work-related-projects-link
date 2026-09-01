import { Topbar } from '@/components/organisms/Topbar'
import {
  ClientProgressPanel,
  KpiRow,
  NeedsAttentionPanel,
  UpcomingExpiryPanel,
} from '@/features/dashboard'

export function DashboardPage() {
  const subtitle = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <Topbar
        title={
          <>
            Good morning, Sarah <span className="wave">👋</span>
          </>
        }
        subtitle={subtitle}
      />
      <main className="content">
        <KpiRow />
        <NeedsAttentionPanel />
        <ClientProgressPanel />
        <UpcomingExpiryPanel />
      </main>
    </>
  )
}
