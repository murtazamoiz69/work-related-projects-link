// The shared sprint plan, for everyone with the link.
//
//   GET  /api/plan          -> {plan}
//   POST /api/plan {op}     -> {plan} after the change, or {error, plan} (400 bad change, 409 item gone)
//
// The plan is one Netlify Blobs record ("plan"). A change is applied to the latest copy and written
// only if nobody wrote in between (onlyIfMatch on the etag); otherwise it is re-read and retried, so
// two people editing at once never overwrite each other. Every change is also kept as a log record
// ("log/<time>-<rand>"), which is never rewritten. Files an item stops using are deleted.
import { getStore } from '@netlify/blobs';
import { applyOp, emptyPlan, filesDropped, normalize, newId } from '../../../site/plan-ops.mjs';

const KEY = 'plan';
const MAX_REQUEST = 100000;
const store = () => getStore({ name: 'sprint-plan', consistency: 'strong' });

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function read(s) {
  const r = await s.getWithMetadata(KEY, { type: 'json' });
  return r ? { plan: normalize(r.data), exists: true, etag: r.etag } : { plan: emptyPlan(), exists: false, etag: null };
}

// Write only if nobody wrote since the read. The local dev Blobs server returns no etag on reads,
// so there the write is unconditional (the one-at-a-time queue below keeps it safe in one process).
function condition({ exists, etag }) {
  if (!exists) return { onlyIfNew: true };
  return etag ? { onlyIfMatch: etag } : {};
}

// Changes reaching the same function instance are applied one at a time; the etag check covers
// changes that reach different instances.
let chain = Promise.resolve();
const oneAtATime = (fn) => {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
};

export default async (req) => {
  const s = store();
  if (req.method === 'GET') return json(200, { plan: (await read(s)).plan });
  if (req.method !== 'POST') return json(405, { error: 'Use GET or POST.' });

  const raw = await req.text();
  if (raw.length > MAX_REQUEST) return json(413, { error: 'That change is too large to save.' });
  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'That request was not valid JSON.' }); }
  return oneAtATime(() => save(s, body));
};

async function save(s, body) {
  const op = body && body.op;
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = await read(s);
    const { plan } = current;
    const dropped = filesDropped(plan, op);
    const now = Date.now();
    const error = applyOp(plan, op, now);
    if (error) return json(error === 'That item no longer exists.' ? 409 : 400, { error, plan: (await read(s)).plan });
    plan.version += 1;
    const res = await s.setJSON(KEY, plan, condition(current));
    if (!res.modified) continue; // someone wrote first: re-read and apply again
    const at = new Date(now).toISOString().replace(/[:.]/g, '-');
    await s.setJSON(`log/${at}-${newId()}`, { at: now, by: String(body.by || '').slice(0, 80), op });
    await Promise.all(dropped.map((k) => s.delete('file/' + k)));
    return json(200, { plan });
  }
  return json(503, { error: 'The plan is busy. Try again in a moment.' });
}

export const config = { path: '/api/plan' };
