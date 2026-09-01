import { beforeEach, describe, expect, it } from 'vitest'
import {
  getProgram,
  updateProgram,
  updateProgramAvailability,
} from './programs.api'
import { resetProgramStore } from './programs.mock'

describe('programs.api', () => {
  beforeEach(() => resetProgramStore())

  it('loads the program with Date fields', async () => {
    const program = await getProgram()
    expect(program.name).toBeTruthy()
    expect(program.createdDate).toBeInstanceOf(Date)
    expect(program.updatedDate).toBeInstanceOf(Date)
    expect(Array.isArray(program.workoutWeeks)).toBe(true)
  })

  it('persists an edit across reloads', async () => {
    const program = await getProgram()
    const edited = { ...program, name: 'Renamed Program' }
    const saved = await updateProgram(edited)
    expect(saved.name).toBe('Renamed Program')

    const reloaded = await getProgram()
    expect(reloaded.name).toBe('Renamed Program')
  })

  it('rejects saving a program with no name (422)', async () => {
    const program = await getProgram()
    await expect(
      updateProgram({ ...program, name: '   ' }),
    ).rejects.toMatchObject({ kind: 'validation', status: 422 })
  })

  it('toggles availability and persists it', async () => {
    const program = await getProgram()
    const next = !program.enabled
    const saved = await updateProgramAvailability(next)
    expect(saved.enabled).toBe(next)

    const reloaded = await getProgram()
    expect(reloaded.enabled).toBe(next)
  })
})
