import { useQuery } from '@tanstack/react-query'
import { getProgram } from '../api/programs.api'
import { programKeys } from '../api/programs.keys'

export function useProgramQuery() {
  return useQuery({
    queryKey: programKeys.detail(),
    queryFn: ({ signal }) => getProgram(signal),
  })
}
