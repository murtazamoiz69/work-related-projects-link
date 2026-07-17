import { Placeholder } from '@/components/molecules/Placeholder'

type ProgramDetailPageProps = { programId: string }

export function ProgramDetailPage({ programId }: ProgramDetailPageProps) {
  void programId
  return (
    <Placeholder
      back={{ to: '/programs', label: 'Back to Programs' }}
      phase="Phase 4"
    />
  )
}
