// Saved "Useful for" values for the HEAL health-data document, shared by everyone with the link.
//
//   GET  /api/field-edits              -> {edits: {id: {value, at}}}
//   GET  /api/field-edits?history=1    -> {history: [{id, at, before, after}]}, newest first
//   POST /api/field-edits  {id, value, base}
//        value: one of the four labels, or null to go back to the value the page was built with
//        base:  the "at" of the value the editor started from (null if none);
//               if someone saved that row since, the answer is 409 with everyone's current values
//
// Storage is Netlify Blobs: one record per row ("row/<id>"), so two people editing different rows
// never overwrite each other, and one record per save ("history/<time>-<id>"), never rewritten.
import { getStore } from '@netlify/blobs';
import { IDS, LABELS } from './keys.mjs';

const MAX_REQUEST = 2000;
const store = () => getStore({ name: 'health-field-edits', consistency: 'strong' });

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function readEdits(s) {
  const { blobs } = await s.list({ prefix: 'row/' });
  const out = {};
  await Promise.all(blobs.map(async (b) => {
    const r = await s.get(b.key, { type: 'json' });
    if (r) out[b.key.slice('row/'.length)] = r;
  }));
  return out;
}

async function readHistory(s) {
  const { blobs } = await s.list({ prefix: 'history/' });
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
  if (!IDS.has(id)) return json(400, { error: 'That row cannot be edited.' });
  if (value !== null && !LABELS.includes(value)) {
    return json(400, { error: 'Useful for has to be one of the four values.' });
  }

  const cur = await s.get('row/' + id, { type: 'json' });
  if ((cur ? cur.at : null) !== (base || null)) {
    return json(409, { error: 'conflict', edits: await readEdits(s) });
  }

  const at = new Date().toISOString();
  if (value === null) await s.delete('row/' + id);
  else await s.setJSON('row/' + id, { value, at });
  // no ':' or '.' in the key: the local dev store writes keys as file names
  await s.setJSON(`history/${at.replace(/[:.]/g, '-')}-${id}`,
    { id, at, before: cur ? cur.value : null, after: value });

  return json(200, { ok: true, edits: await readEdits(s) });
};

export const config = { path: '/api/field-edits' };
