// MSW handler for a client's derived detail. Registered in src/mocks/handlers.ts.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import { CLIENTS_DATA } from '@/features/clients'
import { clientDetailDto } from './detail.mock'

export const clientDetailHandlers = [
  http.get(`${env.apiUrl}/clients/:id/detail`, ({ params }) => {
    const client = CLIENTS_DATA.find((c) => c.id === params.id)
    if (!client)
      return HttpResponse.json({ message: 'User not found.' }, { status: 404 })
    return HttpResponse.json(clientDetailDto(client))
  }),
]
