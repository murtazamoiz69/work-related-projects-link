// Saved Implementation Phase values for the HEAL health data pages, shared by everyone with the link.
// There are two pages, siam and nws, and each has its own saved values: every request names its
// page, and nothing saved on one is ever read by the other.
//
//   GET  /api/field-edits?page=<page>              -> {edits: {id: {value, at}}}
//   GET  /api/field-edits?page=<page>&history=1    -> {history: [{id, at, before, after}]}, newest first
//   POST /api/field-edits?page=<page>  {id, value, base}
//        value: one of the labels in keys.mjs, or null to go back to the value the page was built with
//        base:  the "at" of the value the editor started from (null if none);
//               if someone saved that field since, the answer is 409 with everyone's current values
//
// Storage is Netlify Blobs: one record per field ("<page>/phase/<id>"), so two people editing
// different fields never overwrite each other, and one record per save
// ("<page>/phase-history/<time>-<id>"), never rewritten.
//
// Until 12 October 2026 there was one page, and its records were kept under "phase/<id>" and
// "phase-history/...". Until 9 October 2026 the column was called "Useful for" and held a different
// set of values, kept under "row/<id>" and "history/...". Both sets are still in the store,
// untouched and unread. No phase was saved under "phase/" when the page was split in two.
import { getStore } from '@netlify/blobs';
import { LABELS, PAGES } from './keys.mjs';

const MAX_REQUEST = 2000;
const store = () => getStore({ name: 'health-field-edits', consistency: 'strong' });

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function readEdits(s, row) {
  const { blobs } = await s.list({ prefix: row });
  const out = {};
  await Promise.all(blobs.map(async (b) => {
    const r = await s.get(b.key, { type: 'json' });
    if (r) out[b.key.slice(row.length)] = r;
  }));
  return out;
}

async function readHistory(s, history) {
  const { blobs } = await s.list({ prefix: history });
  const recent = blobs.map((b) => b.key).sort().reverse().slice(0, 300);
  const rows = await Promise.all(recent.map((k) => s.get(k, { type: 'json' })));
  return rows.filter(Boolean);
}

export default async (req) => {
  const url = new URL(req.url);
  const page = url.searchParams.get('page');
  if (!page || !Object.hasOwn(PAGES, page)) {
    return json(400, { error: `Name the page: ?page=${Object.keys(PAGES).join(' or ?page=')}.` });
  }
  const ids = PAGES[page];
  const ROW = `${page}/phase/`;
  const HISTORY = `${page}/phase-history/`;
  const s = store();

  if (req.method === 'GET') {
    if (url.searchParams.has('history')) return json(200, { history: await readHistory(s, HISTORY) });
    return json(200, { edits: await readEdits(s, ROW) });
  }

  if (req.method !== 'POST') return json(405, { error: 'Use GET or POST.' });

  const raw = await req.text();
  if (raw.length > MAX_REQUEST) return json(413, { error: 'That request is too large.' });
  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'That request was not valid JSON.' }); }

  const { id, value, base } = body || {};
  if (!ids.has(id)) return json(400, { error: 'That field cannot be edited.' });
  if (value !== null && !LABELS.includes(value)) {
    return json(400, { error: 'The phase has to be one of the values in the list.' });
  }

  const cur = await s.get(ROW + id, { type: 'json' });
  if ((cur ? cur.at : null) !== (base || null)) {
    return json(409, { error: 'conflict', edits: await readEdits(s, ROW) });
  }

  const at = new Date().toISOString();
  if (value === null) await s.delete(ROW + id);
  else await s.setJSON(ROW + id, { value, at });
  // no ':' or '.' in the key: the local dev store writes keys as file names
  await s.setJSON(`${HISTORY}${at.replace(/[:.]/g, '-')}-${id}`,
    { id, at, before: cur ? cur.value : null, after: value });

  return json(200, { ok: true, edits: await readEdits(s, ROW) });
};

export const config = { path: '/api/field-edits' };
