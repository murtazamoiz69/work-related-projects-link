// Wire shape for a client's derived detail (the "At a glance" tracker data).
import type { ClientDetail, Program, ProgramWeek } from '../types'

type ProgramWeekDto = Omit<ProgramWeek, 'date'> & { date: string }
type ProgramDto = Omit<Program, 'startDate' | 'endDate' | 'weeks'> & {
  startDate: string
  endDate: string
  weeks: ProgramWeekDto[]
}

export type ClientDetailDto = Omit<ClientDetail, 'programs'> & {
  programs: ProgramDto[]
}
