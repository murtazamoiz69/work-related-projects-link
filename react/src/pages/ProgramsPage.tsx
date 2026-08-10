import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { showToast } from '@/lib/toast'
import {
  PROGRAM_DIFFICULTIES,
  PROGRAM_DURATIONS,
  PROGRAM_GOALS,
  useProgramsStore,
} from '@/features/programs'
import type { TrainingProgram } from '@/features/programs'
import { CreateProgramModal } from '@/features/programs/components/CreateProgramModal'
import { AssignUsersModal } from '@/features/programs/components/AssignUsersModal'
import {
  ProgramCard,
  ProgramTableRow,
} from '@/features/programs/components/ProgramRosterViews'
import type { ProgramMenuAction } from '@/features/programs/components/ProgramActionsMenu'

type SortKey = 'updated' | 'name' | 'members' | 'completion'

// JSON round-trip clone — restores the Date fields the round-trip flattens.
function cloneProgram(p: TrainingProgram): TrainingProgram {
  const copy = JSON.parse(JSON.stringify(p)) as TrainingProgram
  copy.createdDate = new Date()
  copy.updatedDate = new Date()
  return copy
}

export function ProgramsPage() {
  const navigate = useNavigate()
  const programs = useProgramsStore((s) => s.programs)
  const setPrograms = useProgramsStore((s) => s.setPrograms)
  const commit = useProgramsStore((s) => s.commit)

  const [query, setQuery] = useState('')
  const [goal, setGoal] = useState('all')
  const [duration, setDuration] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<SortKey>('updated')
  const [view, setView] = useState<'table' | 'card'>('table')

  const [createOpen, setCreateOpen] = useState(false)
  const [assignFor, setAssignFor] = useState<TrainingProgram | null>(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = programs.filter((p) => {
      if (goal !== 'all' && p.goal !== goal) return false
      if (duration !== 'all' && String(p.durationWeeks) !== duration)
        return false
      if (difficulty !== 'all' && p.difficulty !== difficulty) return false
      if (status !== 'all' && p.status !== status) return false
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.coach.toLowerCase().includes(q)
      )
        return false
      return true
    })
    const sorted = [...filtered]
    switch (sort) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'members':
        sorted.sort((a, b) => b.members.length - a.members.length)
        break
      case 'completion':
        sorted.sort((a, b) => b.completionRate - a.completionRate)
        break
      default:
        sorted.sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime())
    }
    return sorted
  }, [programs, query, goal, duration, difficulty, status, sort])

  const noResults = list.length === 0

  const clearFilters = () => {
    setQuery('')
    setGoal('all')
    setDuration('all')
    setDifficulty('all')
    setStatus('all')
  }

  const handleAction = (
    action: ProgramMenuAction,
    program: TrainingProgram,
  ) => {
    if (action === 'edit') {
      navigate({
        to: '/programs/$programId',
        params: { programId: program.id },
      })
      return
    }
    if (action === 'duplicate') {
      const copy = cloneProgram(program)
      copy.id = `prog-${programs.length + 1}-${Math.round(Math.random() * 9999)}`
      copy.name = `${program.name} (Copy)`
      copy.status = 'draft'
      copy.members = []
      copy.activeUsers = 0
      copy.completionRate = 0
      copy.version = 'v1.0'
      copy.activity = []
      setPrograms((prev) => [copy, ...prev])
      showToast(`Duplicated “${program.name}”`)
      return
    }
    if (action === 'toggle-publish') {
      program.status = program.status === 'published' ? 'draft' : 'published'
      program.updatedDate = new Date()
      setPrograms((prev) => [...prev])
      showToast(
        program.status === 'published'
          ? `“${program.name}” published`
          : `“${program.name}” moved to draft`,
      )
      return
    }
    if (action === 'archive') {
      program.status = program.status === 'archived' ? 'draft' : 'archived'
      program.updatedDate = new Date()
      setPrograms((prev) => [...prev])
      showToast(
        program.status === 'archived'
          ? `“${program.name}” archived`
          : `“${program.name}” restored`,
      )
      return
    }
    if (action === 'delete') {
      setPrograms((prev) => prev.filter((p) => p.id !== program.id))
      showToast(`Deleted “${program.name}”`)
    }
  }

  return (
    <>
      <Topbar
        title="Programs"
        subtitle="Reusable workout & diet programs you can assign to any user"
      />
      <main className="content">
        <section className="panel programs-toolbar">
          <div className="programs-toolbar-row">
            <div className="clients-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search programs by name or coach…"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="clients-filters">
              <select
                className="select-range"
                aria-label="Filter by goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="all">All goals</option>
                {PROGRAM_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                className="select-range"
                aria-label="Filter by duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="all">Any duration</option>
                {PROGRAM_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} Weeks
                  </option>
                ))}
              </select>
              <select
                className="select-range"
                aria-label="Filter by difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="all">Any difficulty</option>
                {PROGRAM_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                className="select-range"
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <select
                className="select-range"
                aria-label="Sort programs"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="updated">Recently updated</option>
                <option value="name">Name A–Z</option>
                <option value="members">Most assigned</option>
                <option value="completion">Highest completion</option>
              </select>
            </div>

            <div
              className="view-toggle"
              role="tablist"
              aria-label="Switch view"
            >
              <button
                className={`view-toggle-btn${view === 'table' ? ' active' : ''}`}
                role="tab"
                aria-selected={view === 'table'}
                title="Table view"
                onClick={() => setView('table')}
              >
                <Icon name="rows-3" />
              </button>
              <button
                className={`view-toggle-btn${view === 'card' ? ' active' : ''}`}
                role="tab"
                aria-selected={view === 'card'}
                title="Card view"
                onClick={() => setView('card')}
              >
                <Icon name="layout-grid" />
              </button>
            </div>

            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Icon name="plus" />
              Create Program
            </button>
          </div>
        </section>

        <section className="panel programs-panel">
          <div className="panel-head">
            <div>
              <h2>Your Programs</h2>
              <p className="panel-sub">
                Showing {list.length} of {programs.length} programs
              </p>
            </div>
          </div>

          {noResults ? (
            <div className="clients-empty">
              <Icon name="clipboard-x" />
              <p>No programs match your filters</p>
              <button className="link-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            </div>
          ) : view === 'table' ? (
            <div className="clients-table-wrap">
              <table className="client-table prog-table programs-table">
                <colgroup>
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '130px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Coach</th>
                    <th>Assigned</th>
                    <th>Active</th>
                    <th>Avg Completion Rate</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <ProgramTableRow
                      key={p.id}
                      program={p}
                      onAction={handleAction}
                      onAssign={setAssignFor}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="prog-grid">
              {list.map((p) => (
                <ProgramCard
                  key={p.id}
                  program={p}
                  onAction={handleAction}
                  onAssign={setAssignFor}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {createOpen ? (
        <CreateProgramModal
          onClose={() => setCreateOpen(false)}
          onCreate={(program) => {
            setPrograms((prev) => [program, ...prev])
            setCreateOpen(false)
            navigate({
              to: '/programs/$programId',
              params: { programId: program.id },
            })
          }}
        />
      ) : null}

      {assignFor ? (
        <AssignUsersModal
          program={assignFor}
          onClose={() => setAssignFor(null)}
          onAssigned={commit}
        />
      ) : null}
    </>
  )
}
