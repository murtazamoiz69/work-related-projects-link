// Loads the reference libraries once and primes the client cache. Gated on at
// the authed-shell level so every screen that resolves exercise/meal ids has the
// catalogs available synchronously. `staleTime: Infinity` — reference data
// doesn't change within a session.
import { useQuery } from '@tanstack/react-query'
import { getLibraries } from '../api/libraries.api'
import { primeLibraries } from '../library-store'

export function useLibrariesQuery() {
  return useQuery({
    queryKey: ['libraries'],
    queryFn: async ({ signal }) => {
      const libs = await getLibraries(signal)
      primeLibraries(libs)
      return libs
    },
    staleTime: Infinity,
  })
}
