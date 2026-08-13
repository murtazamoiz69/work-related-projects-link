import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { ToggleSwitch } from '@/components/atoms/ToggleSwitch'
import { Topbar } from '@/components/organisms/Topbar'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { showToast } from '@/lib/toast'
import { CLIENTS_DATA } from '@/features/clients'
import { useProgramsStore } from '@/features/programs'
import { ProgramOverview } from '@/features/programs/components/detail/ProgramOverview'
import { EditProgramModal } from '@/features/programs/components/detail/EditProgramModal'
import { WorkoutPlanTab } from '@/features/programs/components/detail/WorkoutPlanTab'
import { DietPlanTab } from '@/features/programs/components/detail/DietPlanTab'

type ContentTab = 'workout' | 'diet'

// There is a single global program — this page views/edits it and toggles its
// availability. No list, no create/duplicate/delete, no user assignment; the
// Users section owns all per-user access and progress.
export function ProgramsPage() {
  const programs = useProgramsStore((s) => s.programs)
  const rev = useProgramsStore((s) => s.rev)
  const commit = useProgramsStore((s) => s.commit)
  // Subscribes this page to the mutation nonce so it re-renders after
  // in-place edits (flashSaved / toggling availability).
  void rev
  const program = programs[0]

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

  // Autosave: stamp updatedDate, persist + re-render, and flash the pill.
  const flashSaved = () => {
    if (!program) return
    program.updatedDate = new Date()
    commit()
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1600)
  }

  const confirmToggle = () => {
    if (!program) return
    program.enabled = !program.enabled
    flashSaved()
    showToast(program.enabled ? 'Program enabled' : 'Program disabled')
    setToggleConfirmOpen(false)
  }

  if (!program) {
    return (
      <>
        <Topbar
          title="Program"
          subtitle="Manage the program available across the platform."
        />
        <main className="content">
          <div className="clients-empty">
            <Icon name="clipboard-x" />
            <p>No program configured yet</p>
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
          enrolledCount={CLIENTS_DATA.length}
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
