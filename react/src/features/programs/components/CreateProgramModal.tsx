import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal'
import { showToast } from '@/lib/toast'
import {
  PROGRAM_DIFFICULTIES,
  PROGRAM_GOALS,
  buildEmptyDietWeeks,
  buildEmptyWorkoutWeeks,
} from '../data'
import type { ProgramDifficulty, ProgramGoal, TrainingProgram } from '../types'

export function CreateProgramModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (program: TrainingProgram) => void
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [goal, setGoal] = useState<ProgramGoal>(PROGRAM_GOALS[0])
  const [duration, setDuration] = useState('4')
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>(
    PROGRAM_DIFFICULTIES[0],
  )

  const confirm = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      showToast('Give the program a name first')
      return
    }
    const durationWeeks = Math.min(
      52,
      Math.max(1, parseInt(duration, 10) || 4),
    )
    const description =
      desc.trim() ||
      `A ${durationWeeks}-week ${difficulty.toLowerCase()} program for ${goal.toLowerCase()} goals.`
    const program: TrainingProgram = {
      id: `prog-new-${Date.now()}`,
      name: trimmed,
      description,
      goal,
      difficulty,
      durationWeeks,
      coach: 'Sarah Nolan',
      status: 'draft',
      createdDate: new Date(),
      updatedDate: new Date(),
      version: 'v1.0',
      members: [],
      activeUsers: 0,
      completionRate: 0,
      workoutWeeks: buildEmptyWorkoutWeeks(durationWeeks),
      dietWeeks: buildEmptyDietWeeks(durationWeeks),
      nutritionTargets: { calories: 2000, protein: 150, carbs: 200, fat: 65, water: 3 },
      notes: [],
      activity: [{ text: 'Program created', days: 0 }],
      versionHistory: [{ version: 'v1.0', text: 'Program created', days: 0 }],
    }
    onCreate(program)
  }

  return (
    <Modal
      title="Create Program"
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={confirm}>
            Create Program
          </button>
        </>
      }
    >
      <label className="modal-field">
        <span>Program Name</span>
        <input
          type="text"
          placeholder="e.g. 8-Week Fat Loss Kickstart"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="modal-field">
        <span>Description</span>
        <textarea
          className="notes-input"
          rows={2}
          placeholder="What this program is designed to do…"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </label>
      <div className="modal-field-row">
        <label className="modal-field">
          <span>Goal</span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as ProgramGoal)}
          >
            {PROGRAM_GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="modal-field">
          <span>Duration (weeks)</span>
          <input
            type="number"
            min={1}
            max={52}
            step={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>
      </div>
      <label className="modal-field">
        <span>Difficulty</span>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as ProgramDifficulty)}
        >
          {PROGRAM_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
    </Modal>
  )
}
