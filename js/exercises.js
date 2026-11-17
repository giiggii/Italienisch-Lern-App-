// Erzeugt Lerneinheiten: wählt Wörter nach Wiederholungsplan und passt die Aufgabenart an das Niveau an.
import { VERBS, PERSONS } from './data.js';
import { allUnits, wordId, norm, stripAcc } from './store.js';

export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];

const ARTICLE = /^(il|lo|la|i|gli|le|un|uno|una)\s+|^(l'|un')\s*/i;
export const bare = it => it.replace(ARTICLE, '').trim();

export function collectWords(unitIds) {
  const seen = new Set(), out = [];
  for (const u of allUnits()) {
    if (unitIds && !unitIds.includes(u.id)) continue;
    for (const v of u.vocab) {
      const id = wordId(v.it);
      if (seen.has(id)) continue;
      seen.add(id); out.push({ ...v, id, unit: u.id });
    }
  }
  return out;
}

function distract(word, all, field, n) {
  const out = [], used = new Set([norm(word[field])]);
  const same = shuffle(all.filter(w => w.unit === word.unit)), other = shuffle(all.filter(w => w.unit !== word.unit));
  for (const w of [...same, ...other]) {
    const k = norm(w[field]);
    if (used.has(k) || w.id === word.id) continue;
    used.add(k); out.push(w[field]);
    if (out.length === n) break;
  }
  return out;
}

function mcFrom(q, correct, wrong, extra = {}) {
  const opts = shuffle([correct, ...wrong]);
  return { k: 'mc', q, opts, ans: opts.indexOf(correct), ...extra };
}

const tokens = s => s.trim().split(/\s+/);
const orderable = s => { const n = tokens(s || '').length; return n >= 3 && n <= 9; };

function clozeFrom(w, all, typed) {
  const b = bare(w.it);
  if (!w.ex_it || b.length < 2) return null;
  const idx = w.ex_it.toLowerCase().indexOf(b.toLowerCase());
  if (idx < 0) return null;
  const found = w.ex_it.slice(idx, idx + b.length);
  const sent = w.ex_it.slice(0, idx) + '___' + w.ex_it.slice(idx + b.length);
  const cap = found[0] !== found[0].toLowerCase();
  const fix = s => { s = bare(s); return cap ? s[0].toUpperCase() + s.slice(1) : s; };
  const wrong = distract(w, all, 'it', 2).map(fix).filter(x => norm(x) !== norm(found));
  if (!typed && wrong.length < 2) return null;
  return { k: 'cloze', sent, de: w.ex_de, opts: typed ? null : shuffle([found, ...wrong]), ans: found, items: [w.id], say: w.ex_it };
}

function orderFrom(sent, de, items, level, all) {
  const t = tokens(sent);
  let extra = [];
  if (level >= 3.2 && all) {
    const have = new Set(t.map(norm));
    extra = shuffle(all.map(w => bare(w.it)).filter(x => !x.includes(' ') && !have.has(norm(x)))).slice(0, level >= 4.2 ? 2 : 1);
  }
  return { k: 'order', de, tokens: t, bank: shuffle([...t, ...extra]), items, say: sent };
}

function wordExercise(w, eff, all, prefs, forced) {
  const n = eff < 2 ? 2 : 3;
  const itde = () => mcFrom(w.it, w.de, distract(w, all, 'de', n), { items: [w.id], say: w.it, sub: 'Was bedeutet das?', big: true, emoji: '' });
  const deit = () => mcFrom(w.de, w.it, distract(w, all, 'it', n), { items: [w.id], sub: 'Wie heißt das auf Italienisch?', big: true, emoji: w.emoji, sayAfter: w.it });
  const listen = () => { const o = mcFrom('', w.de, distract(w, all, 'de', n), { items: [w.id] }); return { ...o, k: 'listen', audio: w.it, reveal: w.it }; };
  const type = () => ({ k: 'type', de: w.de, ans: w.it, emoji: w.emoji, items: [w.id], hint: eff < 4.2 ? bare(w.it)[0] : '' });
  const speak = () => (eff >= 3.8 && w.ex_it
    ? { k: 'speak', it: w.ex_it, de: w.ex_de, items: [w.id] } : { k: 'speak', it: w.it, de: w.de, items: [w.id] });
  const order = () => (orderable(w.ex_it) ? orderFrom(w.ex_it, w.ex_de, [w.id], eff, all) : null);

  let kinds;
  if (forced) kinds = [forced];
  else if (eff < 2) kinds = ['itde', 'listen', 'itde'];
  else if (eff < 3) kinds = ['deit', 'listen', 'cloze', 'itde'];
  else if (eff < 4) kinds = ['cloze', 'order', 'type', 'deit', 'listen'];
  else kinds = ['type', 'order', 'clozeT', 'type', prefs.speakEx ? 'speak' : 'order'];
  const make = { itde, deit, listen, type, speak, order, cloze: () => clozeFrom(w, all, false), clozeT: () => clozeFrom(w, all, true) };
  return make[pick(kinds)]() || (eff < 2.5 ? itde() : deit());
}

function verbPool(units, level) {
  const own = units.flatMap(u => u.verbs || []);
  const base = VERBS.slice(0, Math.min(VERBS.length, 2 + Math.round(level * 2.5)));
  const seen = new Set();
  return [...own, ...base].filter(v => !seen.has(v.inf) && seen.add(v.inf));
}

function verbExercise(v, level) {
  const i = Math.floor(Math.random() * 6), form = v.forms[i];
  const typed = level >= 3.6;
  const wrong = shuffle([...new Set(v.forms)].filter(f => f !== form)).slice(0, level < 2 ? 2 : 3);
  return {
    k: 'cloze', sent: `${PERSONS[i]} ___`, de: `${v.inf} = ${v.de}`, title: 'Welche Verbform passt?',
    opts: typed ? null : shuffle([form, ...wrong]), ans: form, items: [`v:${v.inf}:${i}`],
    say: `${PERSONS[i].split(' / ')[0]} ${form}`, explain: `${v.inf}: ${v.forms.join(', ')}`,
  };
}

function fromPool(x, level) {
  if (x.type === 'mc') {
    const correct = x.opts[x.ans], opts = shuffle(x.opts);
    return { k: 'mc', q: x.q, opts, ans: opts.indexOf(correct), explain: x.explain, xid: x.id, items: [] };
  }
  if (x.type === 'cloze') return { k: 'cloze', sent: x.sent, de: x.de, opts: level >= 4.4 ? null : shuffle(x.opts), ans: x.answer, explain: x.explain, xid: x.id, items: [], say: x.sent.replace('___', x.answer) };
  if (x.type === 'order') return { ...orderFrom(x.sent, x.de, [], level, null), xid: x.id };
  return { k: 'type', de: x.de, ans: x.it, items: [], xid: x.id, hint: '' };
}

export function storyExercises(story) {
  return [
    { k: 'read', title: story.title, it: story.it, de: story.de },
    ...story.questions.map(q => { const c = q.opts[q.ans], opts = shuffle(q.opts); return { k: 'mc', q: q.q, opts, ans: opts.indexOf(c), items: [], sub: 'Frage zum Text' }; }),
  ];
}

// mode: mix | review | listen | order | speak | verbs
export function buildSession(p, { unitIds = null, mode = 'mix', len } = {}) {
  len = len || p.prefs.len;
  const L = p.level, now = Date.now();
  const units = allUnits().filter(u => !unitIds || unitIds.includes(u.id));
  const words = collectWords(unitIds), all = collectWords(null);
  const st = w => p.items[w.id];

  if (mode === 'verbs') {
    const pool = verbPool(units, L);
    return Array.from({ length: len }, () => verbExercise(pick(pool), L));
  }

  const due = words.filter(w => st(w) && st(w).due <= now).sort((a, b) => st(a).box - st(b).box || st(a).due - st(b).due);
  const fresh = words.filter(w => !st(w));
  const later = words.filter(w => st(w) && st(w).due > now).sort((a, b) => st(a).due - st(b).due);

  const forced = { listen: 'listen', speak: 'speak', order: 'order' }[mode];
  let chosen;
  if (mode === 'review') chosen = [...due, ...later].slice(0, len);
  else if (forced) {
    const ok = w => mode !== 'order' || orderable(w.ex_it);
    chosen = [...due, ...shuffle(later), ...fresh].filter(ok).slice(0, len);
  } else {
    const target = Math.ceil(len * 0.7);
    let nNew = L < 2 ? 2 : L < 3.5 ? 3 : 4;
    if (due.length < target - nNew) nNew = Math.min(5, target - due.length);
    const f = fresh.slice(0, nNew);
    chosen = [...due.slice(0, target - f.length), ...f];
    if (chosen.length < target) chosen.push(...later.slice(0, target - chosen.length));
  }

  const cards = [], body = [];
  for (const w of chosen) {
    const s = st(w), box = s ? s.box : 0;
    const eff = L + (box - 1.5) * 0.35 + (Math.random() - 0.5) * 0.6;
    if (!s && !forced) { cards.push({ k: 'card', w }); body.push(wordExercise(w, 1, all, p.prefs, 'itde')); }
    else body.push(wordExercise(w, eff, all, p.prefs, forced));
  }

  if (mode === 'mix') {
    // Aufgaben aus dem Unterricht (von der KI erzeugt), passend zum Niveau und möglichst noch nicht gelöst.
    const pool = units.flatMap(u => u.pool || []).filter(x => Math.abs(x.level - L) <= 1.4)
      .map(x => ({ x, r: (p.done[x.id] || 0) * 10 + Math.abs(x.level - L) + Math.random() }))
      .sort((a, b) => a.r - b.r).slice(0, Math.max(2, Math.floor(len * (unitIds ? 0.5 : 0.35)))).map(o => fromPool(o.x, L));
    body.push(...pool);
    if (L >= 1.8 && !unitIds || units.some(u => (u.verbs || []).length)) {
      const vp = verbPool(units, L);
      body.push(verbExercise(pick(vp), L));
    }
    const m = chosen.filter(w => w.de.length < 26 && w.it.length < 26);
    if (m.length >= 4) {
      const pairs = shuffle(m).slice(0, L < 3 ? 4 : 5);
      body.push({ k: 'match', pairs: pairs.map(w => [w.it, w.de]), items: pairs.map(w => w.id) });
    }
  }
  const rest = shuffle(body).slice(0, len);
  return [...cards.filter(c => rest.some(e => e.items && e.items.includes(c.w.id))), ...rest];
}

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// Nachsichtige Prüfung getippter Antworten: Akzente, Artikel und kleine Tippfehler führen nicht zum Fehler.
export function checkTyped(given, answer) {
  const g = norm(given);
  if (!g) return { ok: false };
  let best = { ok: false };
  for (const alt of answer.split(/\s+\/\s+/)) {
    const a = norm(alt);
    if (g === a) return { ok: true };
    const g2 = stripAcc(g), a2 = stripAcc(a);
    if (g2 === a2) best = { ok: true, note: 'Richtig! Achte noch auf den Akzent.' };
    else if (!best.ok && norm(bare(g)) === norm(bare(a))) best = { ok: true, note: 'Richtig! Denke noch an den Artikel.' };
    else if (!best.ok && a2.length >= 5 && lev(g2, a2) <= (a2.length >= 12 ? 2 : 1)) best = { ok: true, note: 'Fast perfekt, nur ein kleiner Tippfehler.' };
  }
  return best;
}

export function similar(heard, target) {
  const a = stripAcc(norm(heard)), b = stripAcc(norm(target));
  if (!a || !b) return 0;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
}
