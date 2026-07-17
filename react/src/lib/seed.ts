// Deterministic seeded helpers — ported verbatim from V2 clients.js so every
// generated entity reads the same across screens (no persisted runtime state).

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length) % arr.length]
}

export function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}
