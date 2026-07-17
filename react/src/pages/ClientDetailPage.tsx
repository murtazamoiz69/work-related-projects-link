import { Placeholder } from '@/components/molecules/Placeholder'

type ClientDetailPageProps = { clientId: string }

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  void clientId
  return (
    <Placeholder back={{ to: '/clients', label: 'Back to Clients' }} phase="Phase 3" />
  )
}
