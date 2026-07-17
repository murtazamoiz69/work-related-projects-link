export type ClientStatus = 'active' | 'attention' | 'paused' | 'new'

export type Client = {
  id: string
  name: string
  initials: string
  color: string
  age: number
  gender: 'Female' | 'Male'
  program: string
  plan: string
  status: ClientStatus
  adherence: number | null
  checkInDays: number | null
  joinDate: Date
  goals: string[]
  diet: string
}
