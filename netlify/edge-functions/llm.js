// /api/llm: one chat call to NVIDIA NIM, with the key from the site's environment.
//   GET  -> { model }
//   POST { messages, tools } -> { message }   (the model's reply message, tool calls included)
// Edge function, so a slow answer has up to 40 s before the response must start.
// Env: NVIDIA_API_KEY (required), NIM_MODEL, NIM_BASE_URL (optional).

const env = (k, d) => Netlify.env.get(k) || d;
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export default async (req) => {
  const model = env('NIM_MODEL', 'nvidia/nemotron-3-ultra-550b-a55b');
  if (req.method === 'GET') return json({ model });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const key = env('NVIDIA_API_KEY');
  if (!key) return json({ error: 'NVIDIA_API_KEY is not set on this site.' }, 500);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Bad JSON.' }, 400); }
  const { messages, tools } = body || {};
  if (!Array.isArray(messages) || messages.length > 40) return json({ error: 'messages must be a list (at most 40).' }, 400);
  const r = await fetch(`${env('NIM_BASE_URL', 'https://integrate.api.nvidia.com/v1')}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools, temperature: 0.3, max_tokens: 1500 }),
  });
  const text = await r.text();
  if (!r.ok) return json({ error: `Model error ${r.status}: ${text.slice(0, 300)}` }, 502);
  try { return json({ message: JSON.parse(text).choices[0].message, model }); }
  catch { return json({ error: 'The model sent something unreadable.' }, 502); }
};

export const config = { path: '/api/llm' };
