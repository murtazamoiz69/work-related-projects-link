import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { ToggleSwitch } from '@/components/atoms/ToggleSwitch'
import { Topbar } from '@/components/organisms/Topbar'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  useProgramQuery,
  useUpdateProgram,
  useUpdateProgramAvailability,
} from '@/features/programs'
import { ProgramOverview } from '@/features/programs/components/detail/ProgramOverview'
import { EditProgramModal } from '@/features/programs/components/detail/EditProgramModal'
import { WorkoutPlanTab } from '@/features/programs/components/detail/WorkoutPlanTab'
import { DietPlanTab } from '@/features/programs/components/detail/DietPlanTab'

type ContentTab = 'workout' | 'diet'

// There is a single global program — this page views/edits it and toggles its
// availability. It loads the program from the API (React Query); editors mutate
// the loaded program in place and call flashSaved(), which persists the whole
// program via the update mutation (autosave). No component calls HTTP.
export function ProgramsPage() {
  const programQuery = useProgramQuery()
  const program = programQuery.data
  const updateProgram = useUpdateProgram()
  const updateAvailability = useUpdateProgramAvailability()

  const [tab, setTab] = useState<ContentTab>('workout')
  const [activeWeek, setActiveWeek] = useState(1)
  const [saved, setSaved] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  useEffect(() => {
    if (program) document.title = `${program.name} — Nourish with Nourish AI`
  }, [program])

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    },
    [],
  )

  // Autosave: stamp updatedDate, persist the whole program, and flash the pill.
  const flashSaved = () => {
    if (!program) return
    program.updatedDate = new Date()
    updateProgram.mutate(program)
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1600)
  }

  const confirmToggle = () => {
    if (!program) return
    updateAvailability.mutate(!program.enabled)
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1600)
    setToggleConfirmOpen(false)
  }

  if (programQuery.isPending) {
    return (
      <>
        <Topbar
          title="Program"
          subtitle="Manage the program available across the platform."
        />
        <main className="content">
          <div className="panel" aria-busy="true" style={{ padding: 24 }}>
            <span className="skel skel-wide" style={{ height: '1.25rem' }} />
            <div style={{ height: 12 }} />
            <span className="skel" />
          </div>
        </main>
      </>
    )
  }

  if (programQuery.isError || !program) {
    return (
      <>
        <Topbar
          title="Program"
          subtitle="Manage the program available across the platform."
        />
        <main className="content">
          <div className="clients-empty is-error" role="alert">
            <Icon name="clipboard-x" />
            <p>
              {programQuery.isError
                ? apiErrorMessage(programQuery.error)
                : 'No program configured yet'}
            </p>
            {programQuery.isError ? (
              <button
                className="link-btn clients-empty-retry"
                onClick={() => programQuery.refetch()}
              >
                Try again
              </button>
            ) : null}
          </div>
        </main>
      </>
    )
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
        title="Program"
        subtitle="Manage the program available across the platform."
        status={autosavePill}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setEditOpen(true)}>
              <Icon name="pencil" />
              Edit
            </button>
            <span className="prog-status-toggle">
              <ToggleSwitch
                checked={program.enabled}
                onChange={() => setToggleConfirmOpen(true)}
                ariaLabel={
                  program.enabled ? 'Disable program' : 'Enable program'
                }
              />
              <span
                className={`prog-status-toggle-label${program.enabled ? ' is-active' : ''}`}
              >
                {program.enabled ? 'Active' : 'Disabled'}
              </span>
            </span>
          </>
        }
      />
      <main className="content">
        <ProgramOverview
          program={program}
          enrolledCount={program.enrolledCount}
        />

        <section className="panel prog-tabs-panel">
          <div className="prog-tabs" role="tablist">
            <button
              className={`prog-tab${tab === 'workout' ? ' active' : ''}`}
              role="tab"
              aria-selected={tab === 'workout'}
              onClick={() => setTab('workout')}
            >
              Workout Plan
            </button>
            <button
              className={`prog-tab${tab === 'diet' ? ' active' : ''}`}
              role="tab"
              aria-selected={tab === 'diet'}
              onClick={() => setTab('diet')}
            >
              Diet Plan
            </button>
          </div>
        </section>

        <div>
          {tab === 'workout' ? (
            <WorkoutPlanTab
              program={program}
              activeWeek={activeWeek}
              setActiveWeek={setActiveWeek}
              flashSaved={flashSaved}
            />
          ) : (
            <DietPlanTab
              program={program}
              activeWeek={activeWeek}
              setActiveWeek={setActiveWeek}
              flashSaved={flashSaved}
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

      {toggleConfirmOpen ? (
        <ConfirmDialog
          title={program.enabled ? 'Disable program?' : 'Enable program?'}
          message={
            program.enabled
              ? 'Disabling the program will make the program unavailable to users. The program content will remain saved and can be enabled again later.'
              : 'Enabling the program will make the program available again.'
          }
          confirmText={program.enabled ? 'Disable program' : 'Enable program'}
          danger={program.enabled}
          onConfirm={confirmToggle}
          onClose={() => setToggleConfirmOpen(false)}
        />
      ) : null}
    </>
  )
}
