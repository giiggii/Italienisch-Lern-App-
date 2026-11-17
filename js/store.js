// Speicherung auf dem Gerät (localStorage). Es werden keine Daten an einen eigenen Server gesendet.
import { STARTER } from './data.js';

const KEY = 'parla.v1';

const defaults = () => ({
  v: 1, profiles: [], current: null, units: [],
  settings: { apiKey: '', model: 'claude-opus-5-5', proxyUrl: '' },
});

export const newProfile = (name, avatar) => ({
  id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
  name, avatar, xp: 0, streak: 0, best: 0, lastDay: null, days: {},
  level: 1.6, auto: true, items: {}, done: {}, badges: [],
  sessions: 0, answers: 0, correct: 0, perfect: 0, memory: 0,
  prefs: { font: 1, rate: 0.85, goal: 50, len: 10, sound: true, speakEx: true },
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw), d = defaults();
      return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) } };
    }
  } catch (e) { console.warn('Laden fehlgeschlagen', e); }
  return defaults();
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('Speichern fehlgeschlagen', e); }
}

export function replaceState(obj) {
  const d = defaults();
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, d, obj, { settings: { ...d.settings, ...(obj.settings || {}) } });
  save();
}

export const profile = () => state.profiles.find(p => p.id === state.current) || null;
export const allUnits = () => [...state.units, ...STARTER];
export const unitById = id => allUnits().find(u => u.id === id);

export function dayKey(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const norm = s => String(s || '').toLowerCase().normalize('NFC')
  .replace(/[.,!?;:¡¿"«»()]/g, ' ').replace(/[’`´]/g, '\'').replace(/\s+/g, ' ').trim();
export const stripAcc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
export const wordId = it => 'w:' + norm(it);

// Wiederholung in wachsenden Abständen (Leitner-System): Fach 0 bis 5.
const INTERVAL = [0, 1, 2, 4, 9, 21];
export function grade(p, id, ok) {
  const it = p.items[id] || (p.items[id] = { box: 0, due: 0, ok: 0, ko: 0 });
  if (ok) { it.ok++; it.box = Math.min(5, it.box + 1); }
  else { it.ko++; it.box = Math.max(0, Math.min(it.box - 1, 1)); }
  it.due = Date.now() + INTERVAL[it.box] * 864e5 - 6 * 36e5;
}

export function stats(p) {
  let mastered = 0, learning = 0, due = 0;
  const now = Date.now();
  for (const [id, it] of Object.entries(p.items)) {
    if (!id.startsWith('w:')) continue;
    if (it.box >= 3) mastered++; else learning++;
    if (it.due <= now) due++;
  }
  return { mastered, learning, due, ownUnits: state.units.length };
}

export function touchDay(p, xp) {
  const t = dayKey();
  if (p.lastDay !== t) {
    const y = dayKey(new Date(Date.now() - 864e5));
    p.streak = p.lastDay === y ? p.streak + 1 : 1;
    p.lastDay = t;
    p.best = Math.max(p.best, p.streak);
  }
  p.days[t] = (p.days[t] || 0) + xp;
  p.xp += xp;
}

export function liveStreak(p) {
  if (!p.lastDay) return 0;
  const y = dayKey(new Date(Date.now() - 864e5));
  return (p.lastDay === dayKey() || p.lastDay === y) ? p.streak : 0;
}
