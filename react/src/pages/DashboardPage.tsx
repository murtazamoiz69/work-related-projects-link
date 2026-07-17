import { Placeholder } from '@/components/molecules/Placeholder'

export function DashboardPage() {
  return (
    <Placeholder
      title={
        <>
          Good morning, Sarah <span className="wave">👋</span>
        </>
      }
      subtitle="Today's work"
      phase="Phase 2"
    />
  )
}
