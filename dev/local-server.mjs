// Run the health data integration document locally, with the real /api/field-edits function and a
// local Blobs store.
//
//   node dev/local-server.mjs            -> http://localhost:8770/health-integration/
//
// Saved values go to dev/.blobs/ (ignored by git). No Netlify account needed.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobsServer } from '@netlify/blobs/server';
import { setEnvironmentContext } from '@netlify/blobs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8770);
const TOKEN = 'local-dev';
const PAGE = '/health-integration/';

const blobs = new BlobsServer({ directory: join(ROOT, 'dev', '.blobs'), token: TOKEN });
const { port: blobsPort } = await blobs.start();
const edge = `http://localhost:${blobsPort}`;
setEnvironmentContext({ siteID: 'local', token: TOKEN, edgeURL: edge, uncachedEdgeURL: edge });

// every function in netlify/functions, mounted at the path its own config declares
const FUNCTIONS = await Promise.all(
  ['field-edits/field-edits.mjs'].map(async (f) => {
    const m = await import(`../netlify/functions/${f}`);
    return [m.config.path, m.default];
  }),
).then((pairs) => new Map(pairs));
const TYPES = { '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    const fn = FUNCTIONS.get(url.pathname);
    if (fn) {
      const body = req.method === 'POST'
        ? await new Promise((ok) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => ok(b)); })
        : undefined;
      const r = await fn(new Request(url, { method: req.method, headers: req.headers, body }));
      res.writeHead(r.status, Object.fromEntries(r.headers));
      res.end(await r.text());
      return;
    }
    // the same redirect netlify.toml declares: the site root sends visitors to the page
    if (url.pathname === '/') {
      res.writeHead(302, { location: PAGE });
      res.end();
      return;
    }
    const path = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
    const file = path.slice(1);
    if (file.includes('..')) throw new Error('bad path');
    const data = await readFile(join(ROOT, 'site', file));
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain' });
    res.end(e.code === 'ENOENT' ? 'Not found' : String(e));
  }
}).listen(PORT, () => console.log(
  `health data document on http://localhost:${PORT}${PAGE}\n`
  + `(blobs on ${edge}; functions: ${[...FUNCTIONS.keys()].join(', ')})`));
