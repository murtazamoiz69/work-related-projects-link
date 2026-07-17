import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { CLIENTS_DATA } from '@/features/clients'
import {
  ActivityTab,
  IdentityPanel,
  LifetimePrograms,
  NotesTab,
  OverviewTab,
  ProgramJourney,
  deriveDetail,
} from '@/features/client-detail'

type ClientDetailPageProps = { clientId: string }

type ClientTab = 'overview' | 'program' | 'notes' | 'activity'

const CLIENT_TABS: Array<{ key: ClientTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'program', label: 'Program' },
  { key: 'notes', label: 'Notes' },
  { key: 'activity', label: 'Activity' },
]

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const client = useMemo(
    () => CLIENTS_DATA.find((c) => c.id === clientId),
    [clientId],
  )
  const detail = useMemo(() => (client ? deriveDetail(client) : null), [client])
  const [tab, setTab] = useState<ClientTab>('overview')

  useEffect(() => {
    setTab('overview')
  }, [clientId])

  useEffect(() => {
    if (client) document.title = `${client.name} — Nourish with Nourish AI`
  }, [client])

  if (!client || !detail) {
    return (
      <>
        <Topbar back={{ to: '/clients', label: 'Back to Clients' }} />
        <main className="content">
          <div className="clients-empty">
            <Icon name="user-x" />
            <p>Client not found</p>
            <Link className="link-btn" to="/clients">
              Back to Clients
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar back={{ to: '/clients', label: 'Back to Clients' }} />
      <main className="content">
        <IdentityPanel client={client} />

        <section className="panel prog-tabs-panel no-print">
          <div className="prog-tabs" role="tablist">
            {CLIENT_TABS.map((t) => (
              <button
                key={t.key}
                className={`prog-tab${tab === t.key ? ' active' : ''}`}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* All four panels stay mounted and toggle via `hidden`, so the print
            report (which un-hides every panel) always exports the full profile. */}
        <div data-ctab-panel="overview" hidden={tab !== 'overview'}>
          <OverviewTab client={client} detail={detail} />
        </div>

        <div data-ctab-panel="program" hidden={tab !== 'program'}>
          <LifetimePrograms client={client} programs={detail.programs} />
          <ProgramJourney client={client} programs={detail.programs} />
        </div>

        <div data-ctab-panel="notes" hidden={tab !== 'notes'}>
          <NotesTab notes={detail.notes} />
        </div>

        <div data-ctab-panel="activity" hidden={tab !== 'activity'}>
          <ActivityTab client={client} timeline={detail.timeline} />
        </div>
      </main>
    </>
  )
}
