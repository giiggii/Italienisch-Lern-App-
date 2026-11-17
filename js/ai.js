// Anbindung an die Claude-API: Fotos der Unterrichtsunterlagen lesen und neue Übungen erzeugen.
// Der Schlüssel liegt nur auf dem Gerät (Einstellungen) oder alternativ hinter einem eigenen Proxy.
import { state } from './store.js';
import { LEVELS } from './data.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

// Weg 1 (kostenlos): Die Seite läuft als Artifact auf claude.ai und fragt Claude über das Konto der Person, die sie öffnet.
// Weg 2: eigener API-Schlüssel oder Proxy. Weg 3: Anleitung kopieren und Antwort aus der Claude-App einfügen.
let sampleFn = null, sampleImages = false;
export const aiMode = () => (sampleFn ? 'claude' : (state.settings.apiKey || state.settings.proxyUrl) ? 'key' : 'none');
export const aiReady = () => aiMode() !== 'none';
export const canSendPhotos = () => (sampleFn ? sampleImages : aiReady());
export async function initAI(onChange) {
  try {
    const fn = await window.claude?.use?.('sample');
    if (!fn) return;
    sampleFn = fn;
    const lim = await fn.limits().catch(() => null);
    sampleImages = !!lim?.images;
    onChange();
  } catch (e) { /* kein Claude-Zugang in dieser Ansicht */ }
}

const SAMPLE_ERRORS = {
  not_granted: 'Die Nutzung von Claude wurde für diese Seite nicht erlaubt. Bitte die Seite neu laden und die Frage mit „Erlauben“ beantworten.',
  sampling_disabled: 'Claude steht für dieses Konto hier nicht zur Verfügung.',
  rate_limited: 'Das Nutzungslimit des Claude-Kontos ist im Moment erreicht. Bitte später noch einmal versuchen.',
  session_expired: 'Bitte bei Claude neu anmelden und die Seite noch einmal öffnen.',
  image_rejected: 'Eines der Fotos konnte nicht verarbeitet werden. Bitte ein anderes Foto versuchen.',
  images_unavailable: 'In dieser Ansicht können keine Fotos an Claude gesendet werden.',
  refused: 'Claude konnte diese Anfrage nicht bearbeiten. Bitte ein anderes Foto versuchen.',
  prompt_too_large: 'Die Anfrage war zu groß. Bitte weniger auf einmal senden.',
};

function toBlob(dataUrl) {
  const [head, b64] = dataUrl.split(','), bin = atob(b64), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg' });
}

async function ask(text, { images = [], quick = false, effort = 'low', maxTokens = 16000 } = {}) {
  if (sampleFn) {
    try {
      const opts = { cache: false, modelTier: quick ? 'quick' : 'default' };
      if (images.length) opts.images = images.map(toBlob);
      const r = await sampleFn(PERSONA + '\n\n' + text, opts);
      if (r.truncated && !r.text.trim().endsWith('}')) throw { code: 'truncated' };
      return r.text;
    } catch (e) {
      throw new Error(SAMPLE_ERRORS[e?.code] || (e?.code === 'truncated' ? 'Die Antwort war zu lang. Bitte weniger Fotos auf einmal senden.' : 'Claude ist gerade nicht erreichbar. Bitte später noch einmal versuchen.'));
    }
  }
  const content = images.map(d => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: d.split(',')[1] } }));
  content.push({ type: 'text', text });
  return callClaude({ system: PERSONA, content, effort, maxTokens });
}

async function callClaude({ system, content, effort = 'low', maxTokens = 16000 }) {
  const { apiKey, proxyUrl, model } = state.settings;
  if (!apiKey && !proxyUrl) throw new Error('Es ist noch kein KI-Zugang eingerichtet. Bitte in den Einstellungen nachsehen.');
  const body = {
    model, max_tokens: maxTokens, system,
    output_config: { effort },
    messages: [{ role: 'user', content }],
  };
  const headers = { 'content-type': 'application/json' };
  if (!proxyUrl) {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2026-10-21';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
    // Bei einer (hier sehr unwahrscheinlichen) Ablehnung durch Sicherheitsfilter antwortet ein Ersatzmodell.
    if (!model.includes('haiku')) {
      headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
      body.fallbacks = 'default';
    }
  }
  let res, lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(proxyUrl || API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
    } catch (e) {
      lastErr = new Error('Keine Verbindung zum Internet. Bitte WLAN oder mobile Daten prüfen und noch einmal versuchen.');
      await wait(1500 * (attempt + 1)); continue;
    }
    if (res.ok) break;
    let msg = '';
    try { msg = (await res.json())?.error?.message || ''; } catch (e) { /* kein JSON */ }
    if (res.status === 401 || res.status === 403) throw new Error('Der KI-Schlüssel wurde nicht akzeptiert. Bitte in den Einstellungen prüfen.');
    if (res.status === 400 || res.status === 404 || res.status === 413) throw new Error('Die Anfrage wurde abgelehnt. ' + (res.status === 413 ? 'Die Fotos sind zu groß, bitte weniger Fotos auf einmal senden.' : msg));
    lastErr = new Error(res.status === 429
      ? 'Im Moment sind zu viele Anfragen unterwegs. Bitte in einer Minute noch einmal versuchen.'
      : 'Der KI-Dienst ist gerade nicht erreichbar. Bitte später noch einmal versuchen.');
    res = null;
    await wait(2500 * (attempt + 1));
  }
  if (!res) throw lastErr;
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('Die KI konnte diese Anfrage nicht bearbeiten. Bitte ein anderes Foto versuchen.');
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  if (data.stop_reason === 'max_tokens' && !text.trim().endsWith('}')) throw new Error('Die Antwort der KI war zu lang. Bitte weniger Fotos auf einmal senden.');
  return text;
}

const wait = ms => new Promise(r => setTimeout(r, ms));

export function parseJSON(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('Die Antwort der KI war nicht lesbar. Bitte noch einmal versuchen.');
  try { return JSON.parse(text.slice(a, b + 1)); }
  catch (e) { throw new Error('Die Antwort der KI war nicht lesbar. Bitte noch einmal versuchen.'); }
}

const EXERCISE_SPEC = `Aufgabenformate (Feld "exercises", jede Aufgabe mit "level" von 1 bis 5):
- {"type":"mc","question_de":"Frage auf Deutsch, das Italienische darin in « »","options":["...","...","..."],"answer_index":0,"explain_de":"kurze Erklärung","level":2}
- {"type":"cloze","sentence_it":"Italienischer Satz mit genau einer Lücke ___","translation_de":"deutsche Übersetzung des ganzen Satzes","options":["richtig","falsch1","falsch2"],"answer":"richtig","explain_de":"warum diese Form","level":2}
- {"type":"order","sentence_it":"Vollständiger italienischer Satz mit 3 bis 8 Wörtern","translation_de":"deutsche Übersetzung","level":3}
- {"type":"translate","de":"kurzer deutscher Ausdruck oder Satz","it":"italienische Lösung","level":4}
Regeln für Aufgaben: Genau eine Antwort ist eindeutig richtig. Falsche Antworten sind plausibel, aber klar falsch. Bei "mc" stehen 3 oder 4 Antworten, die Position der richtigen Antwort wechselt. Erklärungen sind kurz, freundlich und auf Deutsch.`;

const PERSONA = `Du bist eine erfahrene, geduldige Italienischlehrerin für deutschsprachige Erwachsene über 60 auf dem Niveau A1. Du arbeitest für eine Lern-App, die den wöchentlichen Einzelunterricht ergänzt. Die Lernenden lernen langsam und brauchen Erfolgserlebnisse, klare Beispiele aus dem Alltag (Reise, Essen, Familie, Einkaufen, Arztbesuch, Freizeit) und viele Wiederholungen in immer neuen Zusammenhängen. Alles Italienische muss fehlerfrei, natürlich und idiomatisch sein. Erklärungen sind auf Deutsch, in einfachen Worten und ohne Fachjargon, den man nicht aus der Schule kennt.
Antworte ausschließlich mit einem einzigen gültigen JSON-Objekt, ohne Einleitung, ohne Markdown und ohne Kommentare.`;

function levelText(level) {
  const l = LEVELS[Math.max(1, Math.min(5, Math.round(level))) - 1];
  return `Stufe ${l.n} von 5: ${l.ai}`;
}

// Anleitung, mit der Claude aus Fotos eine vollständige Lektion baut.
export function photoPrompt(note, level) {
  return `Das sind Fotos der Unterlagen aus der letzten Italienischstunde (Arbeitsblätter, teils handschriftlich ausgefüllt, Grammatikübersichten, eigene Notizen, Tafelbilder).
${note ? 'Hinweis der Lernenden zur Stunde: ' + note + '\n' : ''}
Aufgabe:
1. Lies alle Fotos sorgfältig, auch die Handschrift. Erfasse, was in der Stunde gelernt wurde: Vokabeln, Wendungen, Grammatik, Verben, landeskundliche Inhalte. Korrigiere dabei stillschweigend Schreibfehler der Lernenden. Lasse aus, was du nicht sicher lesen kannst.
2. Baue daraus eine Lektion, die den Stoff wiederholt, in neue Zusammenhänge setzt und behutsam erweitert. Verbinde die Vokabeln der Stunde mit der Grammatik der Stunde. Verwende in Beispielsätzen und Aufgaben andere Sätze als auf den Arbeitsblättern.
3. Ergänze 3 bis 6 thematisch passende, nützliche neue Wörter und kennzeichne sie mit "new": true.

Aktuelles Niveau der Lernenden: ${levelText(level)}

Gib genau dieses JSON zurück:
{
 "title": "kurzer deutscher Titel der Lektion",
 "emoji": "ein passendes Emoji",
 "summary_de": "2 bis 3 Sätze: Was wurde in der Stunde gelernt?",
 "vocab": [{"it":"Wort mit Artikel bei Nomen, Verben im Infinitiv","de":"deutsche Bedeutung","emoji":"passendes Emoji oder leer","example_it":"kurzer neuer Beispielsatz, der das Wort enthält","example_de":"Übersetzung","new":false}],
 "grammar": [{"title":"Thema","explanation_de":"einfache Erklärung in 2 bis 4 Sätzen mit Merkhilfe","examples":[{"it":"...","de":"..."}]}],
 "conjugations": [{"infinitive":"...","de":"...","forms":["io-Form","tu-Form","lui/lei-Form","noi-Form","voi-Form","loro-Form"]}],
 "story": {"title":"...","text_it":"kleine Geschichte oder Dialog mit 5 bis 8 kurzen Sätzen, die Vokabeln und Grammatik der Stunde in einer neuen Alltagssituation verwendet","text_de":"Übersetzung","questions":[{"question_de":"Verständnisfrage","options":["...","...","..."],"answer_index":0}]},
 "culture": {"title":"...","text_it":"3 bis 4 einfache Sätze zu italienischer Kultur, Küche, Alltag oder Literatur, passend zum Thema der Stunde","text_de":"Übersetzung"},
 "exercises": [ 14 bis 18 Aufgaben, gemischt aus allen vier Formaten und über die Stufen 1 bis 5 verteilt, mit Schwerpunkt auf dem aktuellen Niveau ]
}
"conjugations" enthält nur Verben im Präsens, die in der Stunde vorkamen (höchstens 4). "vocab" enthält höchstens 30 Einträge. Wenn auf den Fotos nichts Italienisches erkennbar ist, gib {"error":"kurze deutsche Erklärung, was auf dem Foto fehlt"} zurück.

${EXERCISE_SPEC}`;
}

export async function analysePhotos(images, note, level) {
  const out = parseJSON(await ask(photoPrompt(note, level), { images, effort: 'medium', maxTokens: 20000 }));
  if (out.error) throw new Error(String(out.error));
  return out;
}

// Vollständiger Text zum Kopieren in die Claude-App (Weg 3).
export const copyText = body => PERSONA + '\n\n' + body;

// Neue, weiterführende Aufgaben zu einer bestehenden Lektion erzeugen (angepasst an Niveau und Schwächen).
export function morePrompt(unit, level, weakWords) {
  return `Lektion: ${unit.title}
Vokabeln: ${unit.vocab.map(v => `${v.it} = ${v.de}`).join('; ')}
Grammatik: ${(unit.grammar || []).map(g => g.title).join('; ') || 'keine besondere'}
Verben: ${(unit.verbs || []).map(v => v.inf).join(', ') || 'keine besonderen'}
Bereits verwendete Geschichten: ${(unit.stories || []).map(s => s.title).join('; ') || 'keine'}
Wörter, die den Lernenden noch schwerfallen: ${weakWords.join(', ') || 'keine bekannt'}

Aktuelles Niveau: ${levelText(level)}

Erstelle neues, weiterführendes Material zu dieser Lektion. Setze den Stoff in eine NEUE Alltagssituation, die bisher nicht vorkam. Wende die Vokabeln in gebeugter Form an und verbinde sie mit der Grammatik der Lektion. Übe schwierige Wörter besonders oft. Führe 2 bis 4 neue, nützliche Wörter ein.

Gib genau dieses JSON zurück:
{
 "new_vocab": [{"it":"...","de":"...","emoji":"","example_it":"...","example_de":"..."}],
 "story": {"title":"...","text_it":"5 bis 8 kurze Sätze","text_de":"...","questions":[{"question_de":"...","options":["...","...","..."],"answer_index":0}]},
 "culture": {"title":"...","text_it":"3 bis 4 einfache Sätze, neues Thema","text_de":"..."},
 "exercises": [ 12 bis 14 Aufgaben, alle auf dem aktuellen Niveau oder eine Stufe darüber ]
}

${EXERCISE_SPEC}`;
}
export const moreExercises = async (unit, level, weakWords) => parseJSON(await ask(morePrompt(unit, level, weakWords)));

// Kurze, persönliche Erklärung zu einem Fehler.
export async function explainMistake(task, given, correct) {
  const text = `Aufgabe: ${task}
Antwort der Lernenden: ${given}
Richtige Antwort: ${correct}
Erkläre in höchstens 3 kurzen, freundlichen deutschen Sätzen, warum die richtige Antwort stimmt, und gib eine kleine Merkhilfe. Antworte als JSON: {"text":"..."}`;
  const out = parseJSON(await ask(text, { quick: true, maxTokens: 2000 }));
  return String(out.text || '');
}

// ---------- Prüfung und Aufbereitung der KI-Antworten ----------
const str = (x, max = 400) => (typeof x === 'string' ? x.trim().slice(0, max) : '');

function cleanExercises(list) {
  const out = [];
  for (const e of Array.isArray(list) ? list : []) {
    if (!e || typeof e !== 'object') continue;
    const level = Math.max(1, Math.min(5, Math.round(Number(e.level) || 2)));
    const id = 'x' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    if (e.type === 'mc') {
      const opts = (e.options || []).map(o => str(o, 120)).filter(Boolean);
      const ans = Number(e.answer_index);
      if (str(e.question_de) && opts.length >= 2 && Number.isInteger(ans) && ans >= 0 && ans < opts.length && new Set(opts).size === opts.length)
        out.push({ id, level, type: 'mc', q: str(e.question_de), opts, ans, explain: str(e.explain_de) });
    } else if (e.type === 'cloze') {
      const opts = (e.options || []).map(o => str(o, 60)).filter(Boolean);
      const answer = str(e.answer, 60), sent = str(e.sentence_it);
      if (sent.includes('___') && answer && opts.includes(answer) && new Set(opts).size === opts.length)
        out.push({ id, level, type: 'cloze', sent, de: str(e.translation_de), opts, answer, explain: str(e.explain_de) });
    } else if (e.type === 'order') {
      const sent = str(e.sentence_it, 160), n = sent.split(/\s+/).length;
      if (n >= 3 && n <= 9 && str(e.translation_de)) out.push({ id, level, type: 'order', sent, de: str(e.translation_de) });
    } else if (e.type === 'translate') {
      if (str(e.de) && str(e.it)) out.push({ id, level, type: 'translate', de: str(e.de, 160), it: str(e.it, 160) });
    }
  }
  return out;
}

function cleanVocab(list) {
  const seen = new Set(), out = [];
  for (const v of Array.isArray(list) ? list : []) {
    const it = str(v?.it, 80), de = str(v?.de, 120);
    if (!it || !de || seen.has(it.toLowerCase())) continue;
    seen.add(it.toLowerCase());
    out.push({ it, de, emoji: str(v.emoji, 8), ex_it: str(v.example_it, 200), ex_de: str(v.example_de, 200), isNew: !!v.new });
  }
  return out;
}

function cleanStory(s) {
  if (!s || !str(s.text_it, 2000)) return null;
  const questions = (Array.isArray(s.questions) ? s.questions : []).map(q => {
    const opts = (q?.options || []).map(o => str(o, 120)).filter(Boolean), ans = Number(q?.answer_index);
    return str(q?.question_de) && opts.length >= 2 && Number.isInteger(ans) && ans >= 0 && ans < opts.length
      ? { q: str(q.question_de), opts, ans } : null;
  }).filter(Boolean);
  return { title: str(s.title, 100) || 'Geschichte', it: str(s.text_it, 2000), de: str(s.text_de, 2000), questions };
}

export function toUnit(raw) {
  const story = cleanStory(raw.story), culture = cleanStory(raw.culture);
  return {
    id: 'u' + Date.now().toString(36),
    created: Date.now(),
    emoji: str(raw.emoji, 8) || '📘',
    title: str(raw.title, 80) || 'Neue Lektion',
    summary: str(raw.summary_de, 600),
    vocab: cleanVocab(raw.vocab),
    grammar: (Array.isArray(raw.grammar) ? raw.grammar : []).map(g => ({
      title: str(g?.title, 100), text: str(g?.explanation_de, 900),
      examples: (Array.isArray(g?.examples) ? g.examples : []).map(x => ({ it: str(x?.it, 200), de: str(x?.de, 200) })).filter(x => x.it),
    })).filter(g => g.title && g.text),
    verbs: (Array.isArray(raw.conjugations) ? raw.conjugations : []).map(c => ({
      inf: str(c?.infinitive, 40), de: str(c?.de, 60), forms: (c?.forms || []).map(f => str(f, 40)),
    })).filter(c => c.inf && c.forms.length === 6 && c.forms.every(Boolean)),
    stories: story ? [story] : [],
    culture: culture ? { title: culture.title, it: culture.it, de: culture.de } : null,
    pool: cleanExercises(raw.exercises),
  };
}

export function mergeMore(unit, raw) {
  const have = new Set(unit.vocab.map(v => v.it.toLowerCase()));
  const nv = cleanVocab(raw.new_vocab).filter(v => !have.has(v.it.toLowerCase())).map(v => ({ ...v, isNew: true }));
  unit.vocab.push(...nv);
  const story = cleanStory(raw.story), culture = cleanStory(raw.culture);
  if (story) (unit.stories || (unit.stories = [])).unshift(story);
  if (culture) unit.culture = { title: culture.title, it: culture.it, de: culture.de };
  const ex = cleanExercises(raw.exercises);
  unit.pool.push(...ex);
  return { words: nv.length, exercises: ex.length, story: !!story };
}

// Lektion ohne KI aus einer getippten Liste "italienisch = deutsch".
export function unitFromText(title, text) {
  const vocab = [];
  for (const line of text.split('\n')) {
    const m = line.split(/\s*[=–\-:;\t]\s*/);
    if (m.length >= 2 && m[0].trim() && m[1].trim()) vocab.push({ it: m[0].trim(), de: m.slice(1).join(' ').trim(), emoji: '', ex_it: '', ex_de: '' });
  }
  return { id: 'u' + Date.now().toString(36), created: Date.now(), emoji: '✏️', title: title || 'Eigene Wörter', summary: 'Selbst eingetragene Wörter.', vocab, grammar: [], verbs: [], stories: [], culture: null, pool: [] };
}
