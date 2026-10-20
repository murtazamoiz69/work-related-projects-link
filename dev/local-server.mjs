// Run the planner locally, with the real /api/plan and /api/files functions and a local Blobs store.
//
//   npm install
//   node dev/local-server.mjs            -> http://localhost:8771
//
// Saved data goes to dev/.blobs/ (ignored by git), or to BLOBS_DIR if set. No Netlify account needed.
// An empty store starts from the sheet's pending items (netlify/functions/plan/seed.mjs).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobsServer } from '@netlify/blobs/server';
import { setEnvironmentContext } from '@netlify/blobs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8771);
const TOKEN = 'local-dev';

const blobs = new BlobsServer({ directory: process.env.BLOBS_DIR || join(ROOT, 'dev', '.blobs'), token: TOKEN });
const { port: blobsPort } = await blobs.start();
const edge = `http://localhost:${blobsPort}`;
setEnvironmentContext({ siteID: 'local', token: TOKEN, edgeURL: edge, uncachedEdgeURL: edge });

const FUNCTIONS = {
  '/api/plan': (await import('../netlify/functions/plan/plan.mjs')).default,
  '/api/files': (await import('../netlify/functions/files/files.mjs')).default,
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    const fn = FUNCTIONS[url.pathname];
    if (fn) {
      const body = req.method === 'POST'
        ? await new Promise((ok) => { const parts = []; req.on('data', (c) => parts.push(c)); req.on('end', () => ok(Buffer.concat(parts))); })
        : undefined;
      const r = await fn(new Request(url, { method: req.method, headers: req.headers, body }));
      res.writeHead(r.status, Object.fromEntries(r.headers));
      res.end(Buffer.from(await r.arrayBuffer()));
      return;
    }
    const file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (file.includes('..')) throw new Error('bad path');
    const data = await readFile(join(ROOT, 'site', file));
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain' });
    res.end(e.code === 'ENOENT' ? 'Not found' : String(e));
  }
}).listen(PORT, () => console.log(`sprint planner on http://localhost:${PORT}  (blobs on ${edge})`));
