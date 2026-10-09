// Saved Implementation Phase values for the HEAL health data page, shared by everyone with the link.
//
//   GET  /api/field-edits              -> {edits: {id: {value, at}}}
//   GET  /api/field-edits?history=1    -> {history: [{id, at, before, after}]}, newest first
//   POST /api/field-edits  {id, value, base}
//        value: one of the labels in keys.mjs, or null to go back to the value the page was built with
//        base:  the "at" of the value the editor started from (null if none);
//               if someone saved that field since, the answer is 409 with everyone's current values
//
// Storage is Netlify Blobs: one record per field ("phase/<id>"), so two people editing different
// fields never overwrite each other, and one record per save ("phase-history/<time>-<id>"), never
// rewritten.
//
// Until 9 October 2026 this column was called "Useful for" and held a different set of values, kept
// under "row/<id>" and "history/...". Those records are still in the store, untouched and unread:
// the phases started again from what the page is built with, so they have prefixes of their own.
import { getStore } from '@netlify/blobs';
import { IDS, LABELS } from './keys.mjs';

const MAX_REQUEST = 2000;
const ROW = 'phase/';
const HISTORY = 'phase-history/';
const store = () => getStore({ name: 'health-field-edits', consistency: 'strong' });

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function readEdits(s) {
  const { blobs } = await s.list({ prefix: ROW });
  const out = {};
  await Promise.all(blobs.map(async (b) => {
    const r = await s.get(b.key, { type: 'json' });
    if (r) out[b.key.slice(ROW.length)] = r;
  }));
  return out;
}

async function readHistory(s) {
  const { blobs } = await s.list({ prefix: HISTORY });
  const recent = blobs.map((b) => b.key).sort().reverse().slice(0, 300);
  const rows = await Promise.all(recent.map((k) => s.get(k, { type: 'json' })));
  return rows.filter(Boolean);
}

export default async (req) => {
  const s = store();

  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.has('history')) return json(200, { history: await readHistory(s) });
    return json(200, { edits: await readEdits(s) });
  }

  if (req.method !== 'POST') return json(405, { error: 'Use GET or POST.' });

  const raw = await req.text();
  if (raw.length > MAX_REQUEST) return json(413, { error: 'That request is too large.' });
  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'That request was not valid JSON.' }); }

  const { id, value, base } = body || {};
  if (!IDS.has(id)) return json(400, { error: 'That field cannot be edited.' });
  if (value !== null && !LABELS.includes(value)) {
    return json(400, { error: 'The phase has to be one of the values in the list.' });
  }

  const cur = await s.get(ROW + id, { type: 'json' });
  if ((cur ? cur.at : null) !== (base || null)) {
    return json(409, { error: 'conflict', edits: await readEdits(s) });
  }

  const at = new Date().toISOString();
  if (value === null) await s.delete(ROW + id);
  else await s.setJSON(ROW + id, { value, at });
  // no ':' or '.' in the key: the local dev store writes keys as file names
  await s.setJSON(`${HISTORY}${at.replace(/[:.]/g, '-')}-${id}`,
    { id, at, before: cur ? cur.value : null, after: value });

  return json(200, { ok: true, edits: await readEdits(s) });
};

export const config = { path: '/api/field-edits' };
