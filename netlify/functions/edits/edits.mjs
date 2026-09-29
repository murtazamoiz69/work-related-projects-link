// Saved edits for the journey map, shared by everyone with the link.
//
//   GET  /api/edits              -> {edits: {key: {value, at}}}
//   GET  /api/edits?history=1    -> {history: [{key, at, before, after}]}, newest first
//   POST /api/edits  {key, value, base}
//        value: the edited message, or null to restore the original
//        base:  the "at" of the edit the editor started from (null if none);
//               if someone saved the same message since, the answer is 409
//
// Storage is Netlify Blobs: one record per message ("edit/<key>"), so saves on
// different messages never overwrite each other, and one record per save
// ("history/<time>-<key>", time with '-' for ':' and '.'), which is never rewritten.
import { getStore } from '@netlify/blobs';
import { KEYS } from './keys.mjs';

const MAX = { ex: 6000, message: 8000, title: 80, body: 200, request: 40000 };

const store = () => getStore({ name: 'journey-edits', consistency: 'strong' });

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function readEdits(s) {
  const { blobs } = await s.list({ prefix: 'edit/' });
  const out = {};
  await Promise.all(blobs.map(async (b) => {
    const r = await s.get(b.key, { type: 'json' });
    if (r) out[b.key.slice('edit/'.length)] = r;
  }));
  return out;
}

async function readHistory(s) {
  const { blobs } = await s.list({ prefix: 'history/' });
  const recent = blobs.map((b) => b.key).sort().reverse().slice(0, 200);
  const rows = await Promise.all(recent.map((k) => s.get(k, { type: 'json' })));
  return rows.filter(Boolean);
}

const text = (v) => typeof v === 'string' && v.trim() !== '';

// the value exactly as the page stores it: {message} for welcome, else {ex, notif}
function clean(key, v) {
  if (v === null) return { value: null };
  if (!v || typeof v !== 'object') return { error: 'That edit is not in the expected shape.' };
  if (key === 'welcome') {
    if (!text(v.message)) return { error: 'The message cannot be empty.' };
    if (v.message.length > MAX.message) return { error: 'That message is too long to save.' };
    return { value: { message: v.message } };
  }
  if (!text(v.ex)) return { error: 'The example message cannot be empty.' };
  if (v.ex.length > MAX.ex) return { error: 'That example is too long to save.' };
  let notif = null;
  if (v.notif != null) {
    if (!Array.isArray(v.notif) || v.notif.length !== 2 || !text(v.notif[0]) || !text(v.notif[1])) {
      return { error: 'The notification needs a header and a body.' };
    }
    if (v.notif[0].length > MAX.title || v.notif[1].length > MAX.body) {
      return { error: 'The notification is too long to save.' };
    }
    notif = [v.notif[0], v.notif[1]];
  }
  return { value: { ex: v.ex, notif } };
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
  if (raw.length > MAX.request) return json(413, { error: 'That edit is too large to save.' });
  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'That request was not valid JSON.' }); }

  const { key, base } = body || {};
  if (!KEYS.has(key)) return json(400, { error: 'That message cannot be edited.' });
  const c = clean(key, body.value);
  if (c.error) return json(400, { error: c.error });

  const cur = await s.get('edit/' + key, { type: 'json' });
  if ((cur ? cur.at : null) !== (base || null)) {
    return json(409, { error: 'conflict', edits: await readEdits(s) });
  }

  const at = new Date().toISOString();
  if (c.value === null) await s.delete('edit/' + key);
  else await s.setJSON('edit/' + key, { value: c.value, at });
  // no ':' or '.' in the key: the local dev store writes keys as file names
  await s.setJSON(`history/${at.replace(/[:.]/g, '-')}-${key}`,
    { key, at, before: cur ? cur.value : null, after: c.value });

  return json(200, { ok: true, edits: await readEdits(s) });
};

export const config = { path: '/api/edits' };
