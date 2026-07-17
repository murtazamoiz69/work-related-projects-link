import { Placeholder } from '@/components/molecules/Placeholder'

type TemplateDetailPageProps = { templateId: string }

export function TemplateDetailPage({ templateId }: TemplateDetailPageProps) {
  void templateId
  return (
    <Placeholder
      back={{ to: '/templates', label: 'Back to Templates' }}
      phase="Phase 5"
    />
  )
}
