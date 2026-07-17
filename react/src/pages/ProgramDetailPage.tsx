import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { showToast } from '@/lib/toast'
import { useProgramsStore } from '@/features/programs'
import type { ProgramStatus, TrainingProgram } from '@/features/programs'
import { AssignUsersModal } from '@/features/programs/components/AssignUsersModal'
import { ProgramDetailHeader } from '@/features/programs/components/detail/ProgramDetailHeader'
import { EditProgramModal } from '@/features/programs/components/detail/EditProgramModal'
import { OverviewTab } from '@/features/programs/components/detail/OverviewTab'
import { WorkoutPlanTab } from '@/features/programs/components/detail/WorkoutPlanTab'
import { DietPlanTab } from '@/features/programs/components/detail/DietPlanTab'
import { MembersTab } from '@/features/programs/components/detail/MembersTab'
import { AnalyticsTab } from '@/features/programs/components/detail/AnalyticsTab'
import { SettingsTab } from '@/features/programs/components/detail/SettingsTab'

type ProgramDetailPageProps = { programId: string }

type ProgramTab =
  'overview' | 'workout' | 'diet' | 'members' | 'analytics' | 'settings'

const PROGRAM_TABS: Array<{ key: ProgramTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'workout', label: 'Workout Plan' },
  { key: 'diet', label: 'Diet Plan' },
  { key: 'members', label: 'Members' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
]

// JSON round-trip clone — restores the Date fields the round-trip flattens.
function cloneProgram(p: TrainingProgram): TrainingProgram {
  const copy = JSON.parse(JSON.stringify(p)) as TrainingProgram
  copy.createdDate = new Date()
  copy.updatedDate = new Date()
  return copy
}

export function ProgramDetailPage({ programId }: ProgramDetailPageProps) {
  const navigate = useNavigate()
  const programs = useProgramsStore((s) => s.programs)
  const rev = useProgramsStore((s) => s.rev)
  const commit = useProgramsStore((s) => s.commit)
  const setPrograms = useProgramsStore((s) => s.setPrograms)

  // Reading `rev` above subscribes this page to the store's mutation nonce, so
  // it re-renders (and re-runs this lookup) after in-place program edits.
  void rev
  const program = programs.find((p) => p.id === programId)

  const [tab, setTab] = useState<ProgramTab>('overview')
  const [activeWeek, setActiveWeek] = useState(1)
  const [saved, setSaved] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  useEffect(() => {
    setTab('overview')
    setActiveWeek(1)
  }, [programId])

  useEffect(() => {
    if (program) document.title = `${program.name} — Nourish with Nourish AI`
  }, [program])

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    },
    [],
  )

  // Autosave: stamp updatedDate, persist + re-render, and flash the pill.
  const flashSaved = () => {
    if (!program) return
    program.updatedDate = new Date()
    commit()
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1600)
  }

  if (!program) {
    return (
      <>
        <Topbar back={{ to: '/programs', label: 'Back to Programs' }} />
        <main className="content">
          <div className="clients-empty">
            <Icon name="clipboard-x" />
            <p>Program not found</p>
            <Link className="link-btn" to="/programs">
              Back to Programs
            </Link>
          </div>
        </main>
      </>
    )
  }

  const duplicateProgram = () => {
    const copy = cloneProgram(program)
    copy.id = `prog-copy-${Date.now()}`
    copy.name = `${program.name} (Copy)`
    copy.status = 'draft'
    copy.members = []
    copy.activeUsers = 0
    copy.completionRate = 0
    copy.version = 'v1.0'
    copy.activity = []
    copy.versionHistory = [
      { version: 'v1.0', text: `Duplicated from ${program.name}`, days: 0 },
    ]
    setPrograms((prev) => [copy, ...prev])
    showToast(`Duplicated “${program.name}”`)
    navigate({ to: '/programs/$programId', params: { programId: copy.id } })
  }

  const deleteProgram = () => {
    if (!confirm(`Delete “${program.name}”? This can't be undone.`)) return
    setPrograms((prev) => prev.filter((p) => p.id !== program.id))
    showToast(`Deleted “${program.name}”`)
    navigate({ to: '/programs' })
  }

  const togglePublish = () => {
    program.status = program.status === 'published' ? 'draft' : 'published'
    flashSaved()
    showToast(
      program.status === 'published'
        ? 'Program published'
        : 'Moved back to draft',
    )
  }

  const setVisibility = (status: ProgramStatus) => {
    program.status = status
    flashSaved()
    showToast(`Visibility set to ${status[0].toUpperCase()}${status.slice(1)}`)
  }

  const autosavePill = (
    <span className={`autosave-indicator${saved ? ' show' : ''}`}>
      <Icon name="check" />
      Saved
    </span>
  )

  return (
    <>
      <Topbar
        back={{ to: '/programs', label: 'Back to Programs' }}
        status={autosavePill}
      />
      <main className="content">
        <ProgramDetailHeader
          program={program}
          onEdit={() => setEditOpen(true)}
          onAssign={() => setAssignOpen(true)}
          onDuplicate={duplicateProgram}
          onTogglePublish={togglePublish}
        />

        <section className="panel prog-tabs-panel">
          <div className="prog-tabs" role="tablist">
            {PROGRAM_TABS.map((t) => (
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

        <div>
          {tab === 'overview' ? (
            <OverviewTab program={program} flashSaved={flashSaved} />
          ) : tab === 'workout' ? (
            <WorkoutPlanTab
              program={program}
              activeWeek={activeWeek}
              setActiveWeek={setActiveWeek}
              flashSaved={flashSaved}
            />
          ) : tab === 'diet' ? (
            <DietPlanTab
              program={program}
              activeWeek={activeWeek}
              setActiveWeek={setActiveWeek}
              flashSaved={flashSaved}
            />
          ) : tab === 'members' ? (
            <MembersTab
              program={program}
              flashSaved={flashSaved}
              onAssign={() => setAssignOpen(true)}
            />
          ) : tab === 'analytics' ? (
            <AnalyticsTab program={program} />
          ) : (
            <SettingsTab
              program={program}
              onStatusChange={setVisibility}
              onDuplicate={duplicateProgram}
              onDelete={deleteProgram}
            />
          )}
        </div>
      </main>

      {editOpen ? (
        <EditProgramModal
          program={program}
          onClose={() => setEditOpen(false)}
          onSaved={flashSaved}
        />
      ) : null}

      {assignOpen ? (
        <AssignUsersModal
          program={program}
          onClose={() => setAssignOpen(false)}
          onAssigned={flashSaved}
        />
      ) : null}
    </>
  )
}
