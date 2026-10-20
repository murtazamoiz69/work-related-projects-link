// The plan and the changes people make to it. Used by the page (to show a change at once)
// and by /api/plan (to apply it to the shared copy), so both always agree.
//
// A plan: {version, nextNum, items: {id: item}, cols: {backlog: [ids], s4: [...], s5, s6}}
// An item: {id, num, title, description, priority, start, end, assignees, attachments, comments, created, updated}
// `start` and `end` are the days its bar spans in the calendar ("2026-10-26"), both inside its sprint and
// start <= end, or both '' for no dates. (Older plans had a single `day`; normalize turns it into both.)

export const SPRINTS = [
  { id: 's4', name: 'Sprint 4', start: '2026-10-23', end: '2026-10-29' },
  { id: 's5', name: 'Sprint 5', start: '2026-10-30', end: '2026-11-05' },
  { id: 's6', name: 'Sprint 6', start: '2026-11-06', end: '2026-11-12', note: 'Last delivery' },
];
export const PRIORITIES = [
  { id: 'vhigh', label: 'V High' },
  { id: 'high', label: 'High' },
  { id: 'med', label: 'Med' },
  { id: 'low', label: 'Low' },
];
export const COLS = ['backlog', ...SPRINTS.map((s) => s.id)];

export const LIMITS = { title: 300, description: 20000, name: 80, comment: 5000, url: 2000, assignees: 20, attachments: 50, comments: 500, items: 2000 };

export function emptyPlan() {
  const cols = {};
  for (const c of COLS) cols[c] = [];
  return { version: 0, nextNum: 1, items: {}, cols };
}

// Repairs a plan read from storage or a file: every item in exactly one column.
export function normalize(p) {
  const out = emptyPlan();
  out.version = Number(p && p.version) || 0;
  out.nextNum = Number(p && p.nextNum) || 1;
  out.items = (p && p.items) || {};
  const seen = new Set();
  for (const c of COLS) {
    for (const id of (p && p.cols && p.cols[c]) || []) {
      if (out.items[id] && !seen.has(id)) { out.cols[c].push(id); seen.add(id); }
    }
  }
  for (const id of Object.keys(out.items)) {
    const it = out.items[id];
    it.assignees = it.assignees || [];
    it.attachments = it.attachments || [];
    it.comments = it.comments || [];
    if (!seen.has(id)) out.cols.backlog.push(id);
    const col = out.cols.backlog.includes(id) ? 'backlog' : COLS.find((c) => out.cols[c].includes(id));
    if (!it.start && !it.end && it.day) { it.start = it.day; it.end = it.day; }
    delete it.day;
    setDates(it, it.start, it.end, col);
    if (it.num >= out.nextNum) out.nextNum = it.num + 1;
  }
  return out;
}

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const isId = (v) => typeof v === 'string' && /^[a-z0-9]{6,40}$/i.test(v);

// True when `day` ("YYYY-MM-DD") is one of the days of sprint `col`.
export function dayInSprint(day, col) {
  const s = SPRINTS.find((x) => x.id === col);
  return !!s && typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= s.start && day <= s.end;
}

// Sets an item's dates for sprint `col`: one missing date takes the other's value, the two are put in
// order, and anything outside the sprint clears both.
export function setDates(it, start, end, col) {
  let s = typeof start === 'string' ? start : '', e = typeof end === 'string' ? end : '';
  if (!s) s = e;
  if (!e) e = s;
  if (s > e) [s, e] = [e, s];
  if (!s || !dayInSprint(s, col) || !dayInSprint(e, col)) { s = ''; e = ''; }
  it.start = s;
  it.end = e;
}

export function colOf(plan, id) {
  for (const c of COLS) if (plan.cols[c].includes(id)) return c;
  return null;
}

function removeFromCols(plan, id) {
  for (const c of COLS) plan.cols[c] = plan.cols[c].filter((x) => x !== id);
}

// Applies one change to the plan in place. Returns an error message, or null when it applied.
// `now` is the time to stamp; the server passes its own clock.
export function applyOp(plan, op, now = Date.now()) {
  if (!op || typeof op !== 'object') return 'That change is not in the expected shape.';
  const it = op.id ? plan.items[op.id] : null;
  const needItem = () => (it ? null : 'That item no longer exists.');

  switch (op.type) {
    case 'add': {
      if (!isId(op.id)) return 'Bad item id.';
      if (plan.items[op.id]) return null; // already added (a retry)
      if (Object.keys(plan.items).length >= LIMITS.items) return 'The board is full.';
      plan.items[op.id] = {
        id: op.id, num: plan.nextNum++, title: str(op.title, LIMITS.title), description: '', priority: '', start: '', end: '',
        assignees: [], attachments: [], comments: [], created: now, updated: now,
      };
      const to = COLS.includes(op.to) ? op.to : 'backlog';
      plan.cols[to].unshift(op.id);
      return null;
    }
    case 'update': {
      const e = needItem(); if (e) return e;
      const f = op.fields || {};
      if ('title' in f) it.title = str(f.title, LIMITS.title);
      if ('description' in f) it.description = str(f.description, LIMITS.description);
      if ('priority' in f) it.priority = PRIORITIES.some((p) => p.id === f.priority) ? f.priority : '';
      if ('start' in f || 'end' in f) {
        setDates(it, 'start' in f ? f.start : it.start, 'end' in f ? f.end : it.end, colOf(plan, op.id));
      }
      it.updated = now;
      return null;
    }
    case 'move': {
      // {to, before}: the column, and the item to sit in front of (null for the end).
      // {start, end} as well when dropped on the calendar; otherwise dates outside the new sprint are cleared.
      const e = needItem(); if (e) return e;
      if (!COLS.includes(op.to)) return 'Unknown column.';
      removeFromCols(plan, op.id);
      const list = plan.cols[op.to];
      const at = op.before ? list.indexOf(op.before) : -1;
      if (at === -1) list.push(op.id); else list.splice(at, 0, op.id);
      if ('start' in op || 'end' in op) setDates(it, op.start, op.end, op.to);
      else setDates(it, it.start, it.end, op.to);
      it.updated = now;
      return null;
    }
    case 'delete': {
      if (!it) return null; // already gone
      removeFromCols(plan, op.id);
      delete plan.items[op.id];
      return null;
    }
    case 'addAssignee': {
      const e = needItem(); if (e) return e;
      const name = str(op.name, LIMITS.name).trim();
      if (!name) return 'The name is empty.';
      if (!it.assignees.includes(name) && it.assignees.length < LIMITS.assignees) it.assignees.push(name);
      it.updated = now;
      return null;
    }
    case 'removeAssignee': {
      const e = needItem(); if (e) return e;
      it.assignees = it.assignees.filter((a) => a !== op.name);
      it.updated = now;
      return null;
    }
    case 'addAttachment': {
      const e = needItem(); if (e) return e;
      const a = op.attachment || {};
      if (!isId(a.id)) return 'Bad attachment id.';
      if (it.attachments.some((x) => x.id === a.id)) return null;
      if (it.attachments.length >= LIMITS.attachments) return 'Too many attachments on this item.';
      if (a.type === 'link') {
        const url = str(a.url, LIMITS.url).trim();
        if (!/^https?:\/\//i.test(url)) return 'Links must start with http:// or https://.';
        it.attachments.push({ id: a.id, type: 'link', name: str(a.name, LIMITS.title).trim(), url });
      } else if (a.type === 'file') {
        if (!isId(a.key)) return 'Bad file key.';
        it.attachments.push({ id: a.id, type: 'file', name: str(a.name, LIMITS.title) || 'file', size: Number(a.size) || 0, mime: str(a.mime, 100), key: a.key });
      } else return 'Unknown attachment type.';
      it.updated = now;
      return null;
    }
    case 'removeAttachment': {
      const e = needItem(); if (e) return e;
      it.attachments = it.attachments.filter((x) => x.id !== op.attachmentId);
      it.updated = now;
      return null;
    }
    case 'addComment': {
      const e = needItem(); if (e) return e;
      const c = op.comment || {};
      if (!isId(c.id)) return 'Bad comment id.';
      if (it.comments.some((x) => x.id === c.id)) return null;
      const text = str(c.text, LIMITS.comment).trim();
      if (!text) return 'The comment is empty.';
      if (it.comments.length >= LIMITS.comments) return 'Too many comments on this item.';
      it.comments.push({ id: c.id, author: str(c.author, LIMITS.name).trim() || 'Someone', text, at: now });
      it.updated = now;
      return null;
    }
    case 'deleteComment': {
      const e = needItem(); if (e) return e;
      it.comments = it.comments.filter((x) => x.id !== op.commentId);
      it.updated = now;
      return null;
    }
    default:
      return 'Unknown change.';
  }
}

// The file keys an op stops using, so the server can delete those files.
export function filesDropped(plan, op) {
  const it = op && op.id ? plan.items[op.id] : null;
  if (!it) return [];
  if (op.type === 'delete') return it.attachments.filter((a) => a.type === 'file').map((a) => a.key);
  if (op.type === 'removeAttachment') return it.attachments.filter((a) => a.id === op.attachmentId && a.type === 'file').map((a) => a.key);
  return [];
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
