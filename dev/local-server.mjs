// Run the site locally, with the real /api/edits function and a local Blobs store.
//
//   node dev/local-server.mjs            -> http://localhost:8770
//
// Saved edits go to dev/.blobs/ (ignored by git). No Netlify account needed.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobsServer } from '@netlify/blobs/server';
import { setEnvironmentContext } from '@netlify/blobs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8770);
const TOKEN = 'local-dev';

const blobs = new BlobsServer({ directory: join(ROOT, 'dev', '.blobs'), token: TOKEN });
const { port: blobsPort } = await blobs.start();
const edge = `http://localhost:${blobsPort}`;
setEnvironmentContext({ siteID: 'local', token: TOKEN, edgeURL: edge, uncachedEdgeURL: edge });

const { default: edits } = await import('../netlify/functions/edits/edits.mjs');
const TYPES = { '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/api/edits') {
      const body = req.method === 'POST'
        ? await new Promise((ok) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => ok(b)); })
        : undefined;
      const r = await edits(new Request(url, { method: req.method, headers: req.headers, body }));
      res.writeHead(r.status, Object.fromEntries(r.headers));
      res.end(await r.text());
      return;
    }
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (file.includes('..')) throw new Error('bad path');
    const data = await readFile(join(ROOT, 'site', file));
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain' });
    res.end(e.code === 'ENOENT' ? 'Not found' : String(e));
  }
}).listen(PORT, () => console.log(`journey map on http://localhost:${PORT}  (blobs on ${edge})`));
