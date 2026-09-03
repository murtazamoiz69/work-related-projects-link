// Dependency-free bundle-size budget. Gzips the production JS chunks and fails
// if the entry chunk or the total exceeds its budget — so a bloat regression
// (a heavy dep, a barrel drag) trips CI instead of shipping silently.
//
// Run `npm run build` first, then `npm run size`. Budgets are gzipped KB.
import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const ASSETS_DIR = 'dist/assets'

// Generous headroom over today's sizes (entry ~158 KB gz, total ~419 KB gz);
// tighten as the app is optimised.
//
// `totalKb` counts every chunk, eager or lazy, so it can't tell "the app got
// heavier" from "a rarely-used feature was correctly split out". The bulk-user
// importer's spreadsheet parser (xlsx, ~140 KB gz) is the latter: it loads only
// when someone picks a file, and it alone accounts for a third of the total.
// Entry size is the number that reflects what every visitor actually pays.
const BUDGET = {
  entryKb: 200, // the largest single chunk (the app entry)
  totalKb: 480, // all JS chunks combined, including on-demand ones
}

const gzKb = (buf) => gzipSync(buf).length / 1024

let files
try {
  files = readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.js'))
} catch {
  console.error(
    `No build output at ${ASSETS_DIR}. Run \`npm run build\` first.`,
  )
  process.exit(1)
}

const sizes = files
  .map((f) => ({ f, kb: gzKb(readFileSync(join(ASSETS_DIR, f))) }))
  .sort((a, b) => b.kb - a.kb)

const total = sizes.reduce((s, x) => s + x.kb, 0)
const entry = sizes[0]?.kb ?? 0

console.log('Gzipped JS chunks:')
for (const { f, kb } of sizes)
  console.log(`  ${kb.toFixed(1).padStart(7)} KB  ${f}`)
console.log(`  ${'-'.repeat(7)}`)
console.log(`  ${total.toFixed(1).padStart(7)} KB  total`)
console.log(
  `\nEntry ${entry.toFixed(1)} / ${BUDGET.entryKb} KB · Total ${total.toFixed(1)} / ${BUDGET.totalKb} KB`,
)

const over = []
if (entry > BUDGET.entryKb)
  over.push(`entry chunk ${entry.toFixed(1)} KB > ${BUDGET.entryKb} KB budget`)
if (total > BUDGET.totalKb)
  over.push(`total ${total.toFixed(1)} KB > ${BUDGET.totalKb} KB budget`)

if (over.length) {
  console.error('\n✗ Bundle size over budget:\n  - ' + over.join('\n  - '))
  process.exit(1)
}
console.log('\n✓ Bundle within budget.')
