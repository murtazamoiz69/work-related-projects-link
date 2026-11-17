// /api/page: Simi B's only way onto the web. POST { url } -> { url, title, text }.
// Refuses anything that isn't under https://nourishwithsim.com/blogs/recipes/.

const PREFIX = 'https://nourishwithsim.com/blogs/recipes/';
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', frac12: '½', frac14: '¼', frac34: '¾', deg: '°' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e.toLowerCase()] ?? m));

/* Page HTML to readable text: list items as "- ", one line per paragraph. */
function toText(html) {
  return decode(html
    .replace(/<(script|style|nav|header|footer|svg|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .split('\n').map((l) => l.replace(/[ \t ]+/g, ' ').trim()).filter((l) => l && l !== '-')
    .join('\n');
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  let url = '';
  try { url = String((await req.json()).url || ''); } catch { /* empty */ }
  url = url.split('#')[0].split('?')[0];
  if (!url.startsWith(PREFIX) || url.includes('..')) return json({ error: `Refused: only pages under ${PREFIX} may be opened.` });
  let page;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (recipe-prototype)' } });
    if (!r.ok) return json({ error: `Could not open the page (${r.status}).` });
    page = await r.text();
  } catch (e) { return json({ error: `Could not open the page: ${e.message}` }); }
  const m = page.match(/<div[^>]+class="[^"]*(?:article__content|article-template__content|rte)[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
  const t = page.match(/<title>([\s\S]*?)<\/title>/i);
  return json({ url, title: t ? decode(t[1].trim()) : '', text: toText(m ? m[1] : page).slice(0, 6000) });
};

export const config = { path: '/api/page' };
