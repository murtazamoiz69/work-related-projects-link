// Spreadsheet -> request rows for the bulk "Add User" importer. Pure parsing
// only: it reads cells and normalizes headers, and makes no judgement about
// whether a row is valid — that is the backend's call, and the importer asks
// for it with a `dryRun` POST so the preview and the commit can't disagree.
import type { CreateClientBody } from './api/clients.types'

type ImportField = 'name' | 'email' | 'phone' | 'program' | 'weeks'

// Accepted header spellings, normalized (lowercased, punctuation stripped) ->
// the field they map to. Keeps the importer tolerant of "Plan" vs "Plan Name",
// "Phone" vs "Phone Number", etc. without silently guessing at columns that
// aren't actually one of these.
const HEADER_ALIASES: Record<string, ImportField> = {
  name: 'name',
  fullname: 'name',
  email: 'email',
  emailid: 'email',
  emailaddress: 'email',
  phone: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  mobilenumber: 'phone',
  plan: 'program',
  planname: 'program',
  program: 'program',
  programname: 'program',
  weeks: 'weeks',
  week: 'weeks',
  durationweeks: 'weeks',
}

/** One spreadsheet row as submitted, kept alongside the cells exactly as they
 *  were typed so the preview can show "12 wks" or the unrecognized plan text
 *  the user actually wrote, not a normalized guess. */
export type ParsedImportRow = {
  /** Row number in the source file — header is row 1, so data starts at 2. */
  rowNum: number
  body: CreateClientBody
  weeksRaw: string
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

export function parseImportRows(
  records: Record<string, unknown>[],
): ParsedImportRow[] {
  return records.map((record, i) => {
    const fields: Record<ImportField, string> = {
      name: '',
      email: '',
      phone: '',
      program: '',
      weeks: '',
    }
    for (const [header, value] of Object.entries(record)) {
      const key = HEADER_ALIASES[normalizeHeader(header)]
      if (key) fields[key] = cellToString(value)
    }

    const weeks = Math.round(Number(fields.weeks))
    return {
      rowNum: i + 2,
      weeksRaw: fields.weeks,
      body: {
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        program: fields.program,
        // A blank or non-numeric cell becomes 0, which the backend rejects with
        // "Weeks must be a positive number" — the reason the preview shows.
        weeks: Number.isFinite(weeks) ? weeks : 0,
      },
    }
  })
}
