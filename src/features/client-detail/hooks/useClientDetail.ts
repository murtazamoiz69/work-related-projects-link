// Loads a client's derived detail (the "At a glance" tracker). Session-stable.
import { useQuery } from '@tanstack/react-query'
import { getClientDetail } from '../api/detail.api'

export function useClientDetailQuery(clientId: string) {
  return useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: ({ signal }) => getClientDetail(clientId, signal),
    staleTime: Infinity,
  })
}
