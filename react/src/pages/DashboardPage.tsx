import { useMemo } from 'react'
import { Topbar } from '@/components/organisms/Topbar'
import {
  ClientProgressPanel,
  KpiRow,
  NeedsAttentionPanel,
  UpcomingExpiryPanel,
  buildHeroCounts,
} from '@/features/dashboard'

export function DashboardPage() {
  const hero = useMemo(() => buildHeroCounts(), [])
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const subtitle = `${dateStr} · ${hero.chatRequests} Chat Requests · ${hero.needAttention} Clients Need Attention · ${hero.progressReviews} Progress Reviews · ${hero.renewals} Renewals`

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
