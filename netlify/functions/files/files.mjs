// Attachment files for the sprint plan.
//
//   POST /api/files?name=<file name>&type=<mime>   body: the file   -> {key, size}
//   GET  /api/files?key=<key>                                       -> the file
//
// Each file is one Netlify Blobs record ("file/<key>") with its name and type as metadata.
// Images and PDFs open in the browser; anything else downloads, so an uploaded page can never
// run on this site.
import { getStore } from '@netlify/blobs';
import { newId } from '../../../site/plan-ops.mjs';

const MAX_FILE = 4 * 1024 * 1024;
const INLINE = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']);
const store = () => getStore({ name: 'sprint-plan', consistency: 'strong' });

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export default async (req) => {
  const s = store();
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const key = url.searchParams.get('key') || '';
    if (!/^[a-z0-9]{6,40}$/i.test(key)) return json(400, { error: 'Bad file key.' });
    const r = await s.getWithMetadata('file/' + key, { type: 'arrayBuffer' });
    if (!r) return json(404, { error: 'That file is no longer here.' });
    const name = String(r.metadata.name || 'file');
    const type = String(r.metadata.type || '');
    const inline = INLINE.has(type);
    return new Response(r.data, {
      status: 200,
      headers: {
        'content-type': inline ? type : 'application/octet-stream',
        'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(name)}`,
        'x-content-type-options': 'nosniff',
        'cache-control': 'private, max-age=3600',
      },
    });
  }

  if (req.method !== 'POST') return json(405, { error: 'Use GET or POST.' });
  const data = await req.arrayBuffer();
  if (!data.byteLength) return json(400, { error: 'The file is empty.' });
  if (data.byteLength > MAX_FILE) return json(413, { error: 'Files over 4 MB cannot be uploaded; add a link instead.' });
  const key = newId();
  await s.set('file/' + key, data, {
    metadata: {
      name: (url.searchParams.get('name') || 'file').slice(0, 300),
      type: (url.searchParams.get('type') || '').slice(0, 100),
      size: data.byteLength,
    },
  });
  return json(200, { key, size: data.byteLength });
};

export const config = { path: '/api/files' };
