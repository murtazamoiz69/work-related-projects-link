import type { Nutritionist } from './types'

export function nutritionistHaystack(n: Nutritionist): string {
  return `${n.name} ${n.email} ${n.qualification}`.toLowerCase()
}
