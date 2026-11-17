/* Recipes prototype engine: runs in the page.
   - The recipe database: data/recipes.json (the 1,026 old admin panel recipes), searched here
     with a weighted word index (name, ingredients, categories, cuisine, diet, method).
   - Simi A and B: the tool loop runs here; each model call goes to /api/llm and each blog page
     to /api/page (Netlify edge functions locally mirrored by dev/local_server.py). The NIM key
     only ever lives on the server side. */

const ENGINE = { recipes: [], byId: new Map(), titles: [], facets: null, model: '' };
const PREFIX = 'https://nourishwithsim.com/blogs/recipes/';
const MAX_OPENS = 3;
const STOP = new Set(['and', 'or', 'the', 'with', 'for', 'recipe', 'recipes', 'a', 'an', 'of', 'in', 'some', 'something', 'i', 'have', 'want', 'me', 'to', 'make', 'can', 'what']);
const FIELDS = [['name', 10], ['ingredients', 6], ['categories', 3], ['cuisine', 2], ['diet', 2], ['method', 1]];
const words = (t) => (String(t || '').toLowerCase().match(/[a-z0-9]+/g) || []);

async function loadEngine() {
  const [recipes, titles, llm] = await Promise.all([
    fetch('data/recipes.json').then((r) => r.json()),
    fetch('data/blog-titles.json').then((r) => r.json()),
    fetch('/api/llm').then((r) => r.json()).catch(() => ({ model: 'unavailable' })),
  ]);
  ENGINE.recipes = recipes; ENGINE.titles = titles; ENGINE.model = llm.model || '';
  for (const r of recipes) {
    ENGINE.byId.set(r.id, r);
    r._tok = FIELDS.map(([f]) => words(r[f]));           // tokens per field, for search
    r._cats = r.categories.split(',').map((c) => c.trim()).filter(Boolean);
  }
  const by = (k) => [...recipes.reduce((m, r) => m.set(r[k], (m.get(r[k]) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]).map(([v]) => v);
  ENGINE.facets = { diets: by('diet'), cuisines: by('cuisine'), categories: [...new Set(recipes.flatMap((r) => r._cats))].sort(), count: recipes.length };
}

/* Search: any query word may match the start of a word in a field (like "paneer*"); each match
   scores the field's weight, damped by how often it repeats, times how rare the word is.
   Filters: each takes a list (any value matches); filters combine with AND. */
function searchRecipes({ query = '', diet = [], category = [], cuisine = [] } = {}, limit = 8) {
  const L = (v) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);
  const D = L(diet), C = L(category), K = L(cuisine);
  let pool = ENGINE.recipes.filter((r) => (!D.length || D.includes(r.diet)) && (!K.length || K.includes(r.cuisine)) && (!C.length || r._cats.some((c) => C.includes(c))));
  const q = words(query).filter((w) => w.length > 1 && !STOP.has(w));
  if (!q.length) return pool.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
  const N = ENGINE.recipes.length;
  const scored = [];
  const idf = Object.fromEntries(q.map((w) => [w, Math.log(1 + N / (1 + ENGINE.recipes.filter((r) => r._tok.some((f) => f.some((t) => t.startsWith(w)))).length))]));
  for (const r of pool) {
    let s = 0;
    for (const w of q) {
      r._tok.forEach((toks, i) => {
        const tf = toks.reduce((n, t) => n + (t.startsWith(w) ? 1 : 0), 0);
        if (tf) s += FIELDS[i][1] * (tf / (tf + 1.2)) * idf[w];
      });
    }
    if (s > 0) scored.push([s, r]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map(([, r]) => r);
}
const countRecipes = (f) => searchRecipes(f, Infinity).length;
const getRecipeLocal = (id) => ENGINE.byId.get(Number(id)) || null;

/* ---------- Simi ---------- */
const tool = (name, description, properties, required = []) => ({ type: 'function', function: { name, description, parameters: { type: 'object', properties, required } } });
function toolsA() {
  const f = ENGINE.facets;
  return [
    tool('search_recipes', 'Search the recipe database. Matches words against dish name, ingredients, categories, cuisine, diet and method; returns up to `limit` recipes with id, name, categories, diet, cuisine and the start of the ingredients.', {
      query: { type: 'string', description: "Words to match, e.g. 'paneer spinach' or 'oats breakfast'. May be empty when only filters are used." },
      diet: { type: 'string', enum: f.diets }, category: { type: 'string', enum: f.categories }, cuisine: { type: 'string', enum: f.cuisines },
      limit: { type: 'integer', minimum: 1, maximum: 15 } }),
    tool('get_recipe', 'Get one recipe in full: ingredients, nutrition, method.', { id: { type: 'integer' } }, ['id']),
  ];
}
const TOOLS_B = [tool('open_page', `Open one recipe page. Only URLs that start with ${PREFIX} are allowed; anything else is refused.`, { url: { type: 'string' } }, ['url'])];
const STYLE = "Reply in plain, neutral, short language. Use simple markdown: **bold**, bullet lists, links. Don't invent recipes, ingredients or links that you weren't given.";
const systemA = () => `You help a member of a nutrition app find recipes. You have a database of ${ENGINE.recipes.length} recipes; use search_recipes (try a few phrasings or filters if the first search is thin) and get_recipe for the full recipe. If the member asks for ideas, give 2-4 options. If they clearly want one dish, give that recipe in full (ingredients and method). The app turns [[recipe:ID]] into a card showing the dish's name and photo, so write each option as a bullet that starts with [[recipe:ID]] and don't repeat the name: '- [[recipe:123]] one short line on why it fits'. If nothing fits, say so. ${STYLE}`;
const systemB = () => `You help a member of a nutrition app find recipes from the Nourish with Sim blog. All you know is this list of ${ENGINE.titles.length} recipe titles and links (nothing about their ingredients):\n${ENGINE.titles.map((t) => `- ${t.title} | ${t.url}`).join('\n')}\n\nPick the titles that most likely fit the question. You may open up to ${MAX_OPENS} of those pages with open_page to check ingredients before answering. Give 1-4 options, each with its link, and say briefly why it fits. Only use links from the list. If nothing fits, say so. ${STYLE}`;
const NUDGE = 'Please answer my question now, following your instructions.';

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

/* kind: 'a' or 'b'; history: [{role, content}]. Returns {reply, trace, seconds, model}. */
async function runAgent(kind, history) {
  const tools = kind === 'a' ? toolsA() : TOOLS_B;
  const messages = [{ role: 'system', content: kind === 'a' ? systemA() : systemB() }, ...history.slice(-12)];
  const trace = []; let opens = 0; const t0 = performance.now();
  const done = (reply) => ({ reply, trace, seconds: Math.round((performance.now() - t0) / 100) / 10, model: ENGINE.model });
  for (let step = 0; step < 8; step++) {
    const { message: msg } = await post('/api/llm', { messages, tools });
    const calls = msg.tool_calls || [];
    if (!calls.length) {
      const reply = (msg.content || '').trim();
      if (!reply && !messages.some((m) => m.content === NUDGE)) {
        messages.push({ role: 'user', content: NUDGE }); trace.push({ tool: 'retry', args: {}, found: ['Empty answer, asked again'] }); continue;
      }
      return done(reply);
    }
    messages.push({ role: 'assistant', content: msg.content || '', tool_calls: calls });
    for (const c of calls) {
      const name = c.function.name; let args = {};
      try { args = JSON.parse(c.function.arguments || '{}'); } catch { /* keep {} */ }
      let out;
      if (name === 'search_recipes') {
        const res = searchRecipes(args, Number(args.limit) || 8);
        trace.push({ tool: name, args, found: res.map((r) => r.name) });
        out = res.map((r) => ({ id: r.id, name: r.name, categories: r.categories, diet: r.diet, cuisine: r.cuisine, ingredients: (r.ingredients || '').slice(0, 400) }));
      } else if (name === 'get_recipe') {
        const r = getRecipeLocal(args.id);
        out = r ? { id: r.id, name: r.name, categories: r.categories, diet: r.diet, cuisine: r.cuisine, ingredients: r.ingredients, nutrition: r.nutrition, method: r.method || r.full_text } : { error: 'No recipe with that id.' };
        trace.push({ tool: name, args, found: [out.name || 'none'] });
      } else if (name === 'open_page') {
        if (opens >= MAX_OPENS) out = { error: `Limit reached: at most ${MAX_OPENS} pages per answer.` };
        else { opens++; out = await post('/api/page', { url: args.url }).catch((e) => ({ error: e.message })); }
        trace.push({ tool: name, args, found: [out.title || out.error || ''] });
      } else out = { error: 'Unknown tool.' };
      messages.push({ role: 'tool', tool_call_id: c.id || name, content: JSON.stringify(out) });
    }
  }
  return done("Sorry, I couldn't finish that one.");
}
