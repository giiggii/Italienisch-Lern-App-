import { STARTER, PERSONS, PRAISE, COMFORT, LEVELS, BADGES } from './data.js';
import { state, save, replaceState, profile, newProfile, allUnits, unitById, dayKey, wordId, grade, stats, touchDay, liveStreak } from './store.js';
import { buildSession, storyExercises, collectWords, checkTyped, similar, shuffle } from './exercises.js';
import { aiReady, analysePhotos, moreExercises, explainMistake, toUnit, mergeMore, unitFromText } from './ai.js';

const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
const pick = a => a[Math.floor(Math.random() * a.length)];
const AVATARS = ['🌻', '🍋', '🫒', '🍷', '⛵', '🎻', '🦉', '🐈', '🌷', '☕'];

let view = { name: 'home' };
let S = null;        // laufende Lerneinheit
let M = null;        // Memory-Spiel
let photos = [];     // ausgewählte Fotos (verkleinert, nur im Arbeitsspeicher)
let lastSummary = null;

function go(name, params = {}) { view = { name, ...params }; render(); window.scrollTo(0, 0); }

// ---------- Sprache: Vorlesen und Zuhören ----------
let voices = [];
const loadVoices = () => { try { voices = speechSynthesis.getVoices(); } catch (e) { /* nicht verfügbar */ } };
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

function speak(text, slow) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/___/g, ' '));
    u.lang = 'it-IT';
    const v = voices.find(x => /^it[-_]/i.test(x.lang) && x.localService) || voices.find(x => /^it[-_]/i.test(x.lang));
    if (v) u.voice = v;
    u.rate = slow ? 0.55 : (profile()?.prefs.rate || 0.85);
    speechSynthesis.speak(u);
  } catch (e) { /* Vorlesen ist optional */ }
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;

let actx = null;
function ding(ok) {
  if (!profile()?.prefs.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime;
    (ok ? [660, 880] : [330]).forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, t + i * 0.11);
      g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.11 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.25);
      o.connect(g).connect(actx.destination); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.3);
    });
  } catch (e) { /* Töne sind optional */ }
}

// ---------- Hinweise ----------
function toast(msg, ms = 3200) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
let busyTimer = null;
function busy(messages) {
  unbusy();
  const el = document.createElement('div');
  el.id = 'busy';
  el.innerHTML = `<div class="busy-box"><div class="spinner"></div><p id="busy-msg">${esc(messages[0])}</p><p class="muted">Das kann bis zu einer Minute dauern. Bitte die App geöffnet lassen.</p></div>`;
  document.body.appendChild(el);
  let i = 0;
  busyTimer = setInterval(() => { i = (i + 1) % messages.length; const m = document.getElementById('busy-msg'); if (m) m.textContent = messages[i]; }, 3500);
}
function unbusy() { clearInterval(busyTimer); document.getElementById('busy')?.remove(); }

// ---------- Bausteine ----------
const sayBtn = (text, cls = '') => `<button class="say ${cls}" data-act="say" data-text="${esc(text)}" aria-label="Vorlesen">🔊</button>`;
const levelName = p => LEVELS[Math.max(1, Math.min(5, Math.round(p.level))) - 1];

function tabbar(active) {
  const tabs = [['home', '🏠', 'Heute'], ['units', '📒', 'Unterricht'], ['games', '🎲', 'Spiele'], ['progress', '🏅', 'Erfolge'], ['settings', '⚙️', 'Mehr']];
  return `<nav class="tabbar">${tabs.map(([n, e, l]) => `<button data-act="go" data-to="${n}" class="${active === n ? 'on' : ''}" ${active === n ? 'aria-current="page"' : ''}><span>${e}</span>${l}</button>`).join('')}</nav>`;
}

function unitProgress(p, u) {
  if (!u.vocab.length) return 0;
  return Math.round(100 * u.vocab.filter(v => (p.items[wordId(v.it)]?.box || 0) >= 3).length / u.vocab.length);
}

// ---------- Ansichten ----------
const views = {
  profiles() {
    return `<main class="page center">
      <div class="logo">🇮🇹</div><h1>Parliamo!</h1>
      <p class="lead">${state.profiles.length ? 'Wer lernt heute?' : 'Willkommen! Wer möchte Italienisch lernen?'}</p>
      <div class="stack">${state.profiles.map(p => `<button class="btn big ghost" data-act="pickProfile" data-id="${p.id}"><span class="av">${p.avatar}</span> ${esc(p.name)}</button>`).join('')}</div>
      <div class="card">
        <h2>Neue Person anlegen</h2>
        <label for="pname">Vorname</label>
        <input id="pname" type="text" maxlength="20" autocomplete="off" placeholder="z. B. Maria">
        <p class="label">Bild auswählen</p>
        <div class="avatars">${AVATARS.map((a, i) => `<button class="avatar ${i === (view.av || 0) ? 'on' : ''}" data-act="pickAvatar" data-i="${i}" aria-label="Bild ${i + 1}">${a}</button>`).join('')}</div>
        <button class="btn primary" data-act="addProfile">Los geht's</button>
      </div>
    </main>`;
  },

  home(p) {
    const s = stats(p), today = p.days[dayKey()] || 0, pct = Math.min(100, Math.round(100 * today / p.prefs.goal));
    const words = collectWords(null).filter(w => w.ex_it), tip = words[Math.floor(Date.now() / 864e5) % words.length];
    const own = state.units[0];
    const h = new Date().getHours(), hello = h < 11 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
    return `<main class="page">
      <header class="top">
        <button class="who" data-act="go" data-to="profiles" aria-label="Person wechseln"><span class="av">${p.avatar}</span></button>
        <div><p class="hello">${hello},</p><h1>${esc(p.name)}!</h1></div>
        <div class="streak" aria-label="Lernserie ${liveStreak(p)} Tage">🔥 ${liveStreak(p)}</div>
      </header>
      <section class="card goal">
        <div class="ring" style="--p:${pct}"><b>${pct}%</b></div>
        <div><h2>Tagesziel</h2><p>${today} von ${p.prefs.goal} Punkten${pct >= 100 ? '. Geschafft, bravo! 🎉' : ''}</p></div>
      </section>
      <button class="btn primary huge" data-act="start" data-mode="mix">▶ ${today ? 'Weiterlernen' : 'Heute lernen'}</button>
      ${s.due ? `<button class="btn ghost" data-act="start" data-mode="review">🔁 ${s.due} ${s.due === 1 ? 'Wort wartet' : 'Wörter warten'} auf Wiederholung</button>` : ''}
      ${own ? `<section class="card tap" data-act="openUnit" data-id="${own.id}"><p class="label">Aus dem letzten Unterricht</p><h2>${esc(own.emoji)} ${esc(own.title)}</h2><p class="muted">Antippen zum Üben</p></section>`
        : `<section class="card accent"><h2>📷 Unterlagen aus dem Unterricht</h2><p>Fotografieren Sie Arbeitsblätter oder Notizen. Daraus entstehen passende Übungen.</p><button class="btn primary" data-act="go" data-to="upload">Fotos hinzufügen</button></section>`}
      ${tip ? `<section class="card"><p class="label">Satz des Tages</p><div class="row"><p class="it">${esc(tip.ex_it)}</p>${sayBtn(tip.ex_it)}</div><p class="muted">${esc(tip.ex_de)}</p></section>` : ''}
    </main>${tabbar('home')}`;
  },

  units(p) {
    const row = u => `<button class="unit" data-act="openUnit" data-id="${u.id}"><span class="uemoji">${esc(u.emoji)}</span><span class="grow"><b>${esc(u.title)}</b><small>${u.vocab.length} Wörter${u.created ? ' · ' + new Date(u.created).toLocaleDateString('de-DE') : ''}</small><span class="bar"><i style="width:${unitProgress(p, u)}%"></i></span></span><span class="chev">›</span></button>`;
    return `<main class="page">
      <h1>Mein Unterricht</h1>
      <button class="btn primary huge" data-act="go" data-to="upload">📷 Neue Unterlagen hinzufügen</button>
      <h2>Eigene Lektionen</h2>
      ${state.units.length ? state.units.map(row).join('') : '<p class="muted">Noch keine eigenen Lektionen. Fotografieren Sie die Unterlagen aus Ihrer letzten Stunde.</p>'}
      <h2>Grundlagen</h2>
      ${STARTER.map(row).join('')}
    </main>${tabbar('units')}`;
  },

  unit(p) {
    const u = unitById(view.id);
    if (!u) return views.units(p);
    const dots = v => { const b = p.items[wordId(v.it)]?.box ?? -1; return `<span class="dots" aria-label="Lernstand">${[1, 3, 5].map(n => `<i class="${b >= n ? 'on' : ''}"></i>`).join('')}</span>`; };
    return `<main class="page">
      <button class="back" data-act="go" data-to="units">‹ Zurück</button>
      <h1>${esc(u.emoji)} ${esc(u.title)}</h1>
      <p>${esc(u.summary)}</p>
      <button class="btn primary huge" data-act="start" data-mode="mix" data-unit="${u.id}">▶ Diese Lektion üben</button>
      ${(u.stories || []).map((s, i) => `<button class="btn ghost" data-act="story" data-id="${u.id}" data-i="${i}">📖 Geschichte: ${esc(s.title)}</button>`).join('')}
      ${u.builtin ? '' : `<button class="btn ghost" data-act="more" data-id="${u.id}">✨ Neue, weiterführende Aufgaben erzeugen</button>`}
      ${(u.grammar || []).map(g => `<section class="card"><p class="label">Grammatik</p><h2>${esc(g.title)}</h2><p>${esc(g.text)}</p>${g.examples.map(x => `<div class="row ex"><div class="grow"><p class="it">${esc(x.it)}</p><p class="muted">${esc(x.de)}</p></div>${sayBtn(x.it)}</div>`).join('')}</section>`).join('')}
      ${(u.verbs || []).map(v => `<section class="card"><p class="label">Verb</p><h2>${esc(v.inf)} <small>${esc(v.de)}</small></h2><table class="conj">${v.forms.map((f, i) => `<tr><td>${PERSONS[i]}</td><td><b>${esc(f)}</b></td><td>${sayBtn(PERSONS[i].split(' / ')[0] + ' ' + f, 'sm')}</td></tr>`).join('')}</table></section>`).join('')}
      ${u.culture ? `<section class="card accent"><p class="label">Italien entdecken</p><h2>${esc(u.culture.title)}</h2><div class="row"><p class="it grow">${esc(u.culture.it)}</p>${sayBtn(u.culture.it)}</div><details><summary>Übersetzung zeigen</summary><p>${esc(u.culture.de)}</p></details></section>` : ''}
      <h2>Wörter (${u.vocab.length})</h2>
      <div class="words">${u.vocab.map((v, i) => `<div class="word"><button class="grow wbtn" data-act="say" data-text="${esc(v.it)}"><span class="wemoji">${esc(v.emoji || '🔊')}</span><span><b>${esc(v.it)}</b>${v.isNew ? ' <em class="tag">neu</em>' : ''}<small>${esc(v.de)}</small></span></button>${dots(v)}${view.edit ? `<button class="del" data-act="delWord" data-i="${i}" aria-label="Wort entfernen">✕</button>` : ''}</div>`).join('')}</div>
      ${u.builtin ? '' : `<div class="stack"><button class="btn ghost" data-act="toggleEdit">${view.edit ? 'Fertig' : '✏️ Falsch erkannte Wörter entfernen'}</button><button class="btn danger" data-act="delUnit" data-id="${u.id}">Lektion löschen</button></div>`}
    </main>${tabbar('units')}`;
  },

  upload() {
    const ready = aiReady();
    return `<main class="page">
      <button class="back" data-act="go" data-to="units">‹ Zurück</button>
      <h1>Neue Unterlagen</h1>
      <p>Fotografieren Sie Arbeitsblätter, Grammatikübersichten oder Ihre Notizen aus der letzten Stunde. Achten Sie auf gutes Licht und darauf, dass das ganze Blatt zu sehen ist.</p>
      ${ready ? '' : `<section class="card warn"><h2>KI-Zugang fehlt noch</h2><p>Damit die App Fotos lesen kann, muss einmalig ein Zugang eingerichtet werden. Bitten Sie dafür am besten Ihren Sohn oder Ihre Tochter um Hilfe.</p><button class="btn ghost" data-act="go" data-to="settings">Zu den Einstellungen</button></section>`}
      <label class="btn primary huge filebtn">📷 Foto aufnehmen<input type="file" accept="image/*" capture="environment" data-in="photos"></label>
      <label class="btn ghost filebtn">🖼️ Aus meinen Fotos wählen<input type="file" accept="image/*" multiple data-in="photos"></label>
      ${photos.length ? `<div class="thumbs">${photos.map((d, i) => `<div class="thumb"><img src="${d}" alt="Foto ${i + 1}"><button data-act="rmPhoto" data-i="${i}" aria-label="Foto ${i + 1} entfernen">✕</button></div>`).join('')}</div>
        <label for="note">Worum ging es in der Stunde? (freiwillig)</label>
        <input id="note" type="text" maxlength="200" placeholder="z. B. Einkaufen auf dem Markt">
        <button class="btn primary huge" data-act="analyse" ${ready ? '' : 'disabled'}>✨ Lektion daraus erstellen</button>` : ''}
      <details class="card"><summary>Wörter lieber selbst eintippen</summary>
        <label for="mtitle">Titel</label><input id="mtitle" type="text" maxlength="60" placeholder="z. B. Stunde vom Dienstag">
        <label for="mtext">Pro Zeile ein Wort: italienisch = deutsch</label>
        <textarea id="mtext" rows="6" placeholder="la finestra = das Fenster&#10;aprire = öffnen" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
        <button class="btn ghost" data-act="manual">Lektion anlegen</button>
      </details>
    </main>${tabbar('units')}`;
  },

  games(p) {
    const g = (act, attrs, e, t, d) => `<button class="game" data-act="${act}" ${attrs}><span>${e}</span><b>${t}</b><small>${d}</small></button>`;
    return `<main class="page">
      <h1>Spiele und Training</h1>
      <p>Kurze Übungen für zwischendurch. Jede dauert nur wenige Minuten.</p>
      <div class="games">
        ${g('memory', '', '🃏', 'Memory', 'Wortpaare finden')}
        ${g('start', 'data-mode="verbs"', '🔤', 'Verb-Trainer', 'Verbformen üben')}
        ${g('start', 'data-mode="listen"', '👂', 'Hör-Training', 'Zuhören und verstehen')}
        ${g('start', 'data-mode="order"', '🧩', 'Satzbau', 'Wörter in die richtige Reihenfolge')}
        ${p.prefs.speakEx ? g('start', 'data-mode="speak"', '🎤', 'Aussprache', 'Laut nachsprechen') : ''}
        ${g('start', 'data-mode="review"', '🔁', 'Wiederholen', 'Gelernte Wörter auffrischen')}
      </div>
    </main>${tabbar('games')}`;
  },

  memory() {
    return `<main class="page session">
      <header class="shead"><button class="close" data-act="go" data-to="games" aria-label="Beenden">✕</button><b>Memory</b><span class="muted">${M.moves} Züge</span></header>
      <p class="muted center">Finden Sie das italienische Wort und seine deutsche Bedeutung.</p>
      <div class="memory">${M.cards.map((c, i) => {
        const open = M.open.includes(i) || M.found.has(c.pair);
        return `<button class="mcard ${open ? 'open' : ''} ${M.found.has(c.pair) ? 'found' : ''} ${c.lang}" data-act="flip" data-i="${i}" ${open ? '' : 'aria-label="Verdeckte Karte"'}>${open ? esc(c.text) : '?'}</button>`;
      }).join('')}</div>
      ${M.found.size === M.cards.length / 2 ? `<div class="card center"><h2>🎉 Geschafft in ${M.moves} Zügen!</h2><p>+20 Punkte</p><button class="btn primary" data-act="memory">Noch einmal</button><button class="btn ghost" data-act="go" data-to="games">Zurück</button></div>` : ''}
    </main>`;
  },

  progress(p) {
    const s = stats(p), acc = p.answers ? Math.round(100 * p.correct / p.answers) : 0;
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return { l: d.toLocaleDateString('de-DE', { weekday: 'short' }), xp: p.days[dayKey(d)] || 0 }; });
    const max = Math.max(p.prefs.goal, ...days.map(d => d.xp));
    const lv = levelName(p);
    return `<main class="page">
      <h1>Meine Erfolge</h1>
      <div class="tiles">
        <div class="tile"><b>🔥 ${liveStreak(p)}</b><small>Tage in Folge</small></div>
        <div class="tile"><b>⭐ ${p.xp}</b><small>Punkte</small></div>
        <div class="tile"><b>📚 ${s.mastered}</b><small>Wörter sicher</small></div>
        <div class="tile"><b>🌱 ${s.learning}</b><small>Wörter in Arbeit</small></div>
        <div class="tile"><b>🎯 ${acc}%</b><small>richtig beantwortet</small></div>
        <div class="tile"><b>🏆 ${p.best}</b><small>längste Serie</small></div>
      </div>
      <section class="card"><h2>Diese Woche</h2>
        <div class="chart" role="img" aria-label="Punkte der letzten sieben Tage">${days.map(d => `<div class="col"><span class="val">${d.xp || ''}</span><i style="height:${Math.round(100 * d.xp / max)}%" class="${d.xp >= p.prefs.goal ? 'full' : ''}"></i><small>${d.l}</small></div>`).join('')}</div>
      </section>
      <section class="card"><h2>Mein Niveau</h2>
        <div class="lvl">${LEVELS.map(l => `<i class="${l.n <= lv.n ? 'on' : ''}"></i>`).join('')}</div>
        <p><b>Stufe ${lv.n} von 5: ${lv.name}</b></p>
        <p class="muted">${p.auto ? 'Die Aufgaben passen sich automatisch an: Bei vielen richtigen Antworten werden sie anspruchsvoller, bei Fehlern wieder leichter.' : 'Die Stufe ist fest eingestellt (siehe „Mehr“).'}</p>
      </section>
      <h2>Abzeichen</h2>
      <div class="badges">${BADGES.map(b => `<div class="badge ${p.badges.includes(b.id) ? 'on' : ''}"><span>${b.emoji}</span><b>${b.name}</b><small>${b.text}</small></div>`).join('')}</div>
    </main>${tabbar('progress')}`;
  },

  settings(p) {
    const seg = (key, opts, cur) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-act="pref" data-k="${key}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
    const st = state.settings;
    return `<main class="page">
      <h1>Einstellungen</h1>
      <section class="card"><h2>${p.avatar} ${esc(p.name)}</h2><button class="btn ghost" data-act="go" data-to="profiles">Person wechseln oder hinzufügen</button></section>
      <section class="card"><h2>Darstellung und Ton</h2>
        <p class="label">Schriftgröße</p>${seg('font', [[1, 'Normal'], [1.15, 'Groß'], [1.3, 'Sehr groß']], p.prefs.font)}
        <p class="label">Vorlesetempo</p>${seg('rate', [[0.65, 'Langsam'], [0.85, 'Normal'], [1, 'Schnell']], p.prefs.rate)}
        <button class="btn ghost" data-act="say" data-text="Buongiorno! Come sta oggi?">🔊 Probe hören</button>
        <p class="label">Töne bei richtig und falsch</p>${seg('sound', [[true, 'An'], [false, 'Aus']], p.prefs.sound)}
      </section>
      <section class="card"><h2>Lernen</h2>
        <p class="label">Tagesziel</p>${seg('goal', [[30, 'Gemütlich'], [50, 'Normal'], [80, 'Fleißig']], p.prefs.goal)}
        <p class="label">Länge einer Lerneinheit</p>${seg('len', [[6, 'Kurz'], [10, 'Mittel'], [14, 'Lang']], p.prefs.len)}
        <p class="label">Ausspracheübungen</p>${seg('speakEx', [[true, 'An'], [false, 'Aus']], p.prefs.speakEx)}
        <p class="label">Schwierigkeit</p>${seg('auto', [[true, 'Automatisch anpassen'], [false, 'Selbst festlegen']], p.auto)}
        ${seg('level', LEVELS.map(l => [l.n, l.n]), Math.round(p.level))}
        <p class="muted">Aktuell Stufe ${levelName(p).n}: ${levelName(p).name}</p>
      </section>
      <section class="card"><h2>KI-Zugang für Fotos</h2>
        <p class="muted">Wird einmalig eingerichtet, am besten von einem Familienmitglied. Der Schlüssel bleibt nur auf diesem Gerät gespeichert und wird ausschließlich an die Claude-API gesendet.</p>
        <label for="apikey">Claude-API-Schlüssel</label>
        <input id="apikey" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-ant-…" value="${esc(st.apiKey)}" data-in="apiKey">
        <label for="model">Modell</label>
        <select id="model" data-in="model">${[['claude-opus-5-5', 'Claude Opus 5.5 (beste Qualität, empfohlen)'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (günstiger)'], ['claude-haiku-5-5', 'Claude Haiku 5.5 (am günstigsten)']].map(([v, l]) => `<option value="${v}" ${st.model === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <details><summary>Für Fortgeschrittene: eigener Proxy</summary><label for="proxy">Proxy-Adresse (ersetzt den Schlüssel)</label><input id="proxy" type="url" autocapitalize="off" placeholder="https://…" value="${esc(st.proxyUrl)}" data-in="proxyUrl"></details>
        <p class="status ${aiReady() ? 'ok' : ''}">${aiReady() ? '✓ Zugang ist eingerichtet' : 'Noch nicht eingerichtet'}</p>
      </section>
      <section class="card"><h2>Als App installieren</h2><p>In Safari unten auf das Teilen-Symbol tippen und „Zum Home-Bildschirm“ wählen. Danach lässt sich Parliamo! wie eine normale App öffnen.</p></section>
      <section class="card"><h2>Daten</h2>
        <p class="muted">Alle Lernstände liegen nur auf diesem Gerät. Eine Sicherung schützt vor Verlust und erlaubt den Umzug auf ein anderes Gerät.</p>
        <button class="btn ghost" data-act="export">Sicherung speichern</button>
        <label class="btn ghost filebtn">Sicherung einspielen<input type="file" accept="application/json,.json" data-in="import"></label>
        <button class="btn danger" data-act="resetProfile">Lernstand von ${esc(p.name)} zurücksetzen</button>
      </section>
    </main>${tabbar('settings')}`;
  },

  session(p) { return sessionView(p); },

  summary(p) {
    const r = lastSummary, pct = r.total ? Math.round(100 * r.right / r.total) : 100;
    const head = pct >= 90 ? ['🎉', 'Fantastico!'] : pct >= 60 ? ['👏', 'Molto bene!'] : ['💪', 'Gut, dass Sie dranbleiben!'];
    return `<main class="page center summary">
      <div class="confetti" aria-hidden="true">${'🎊🇮🇹⭐🎉🍋'.repeat(3)}</div>
      <div class="logo">${head[0]}</div><h1>${head[1]}</h1>
      <div class="tiles">
        <div class="tile"><b>+${r.xp}</b><small>Punkte</small></div>
        <div class="tile"><b>${r.right}/${r.total}</b><small>beim ersten Mal richtig</small></div>
        <div class="tile"><b>🔥 ${liveStreak(p)}</b><small>Tage in Folge</small></div>
      </div>
      ${r.levelMsg ? `<p class="card">${r.levelMsg}</p>` : ''}
      ${r.badges.map(b => `<div class="card accent"><h2>${b.emoji} Neues Abzeichen: ${b.name}</h2><p>${b.text}</p></div>`).join('')}
      ${r.wrong.length ? `<section class="card left"><h2>Zum Merken</h2>${r.wrong.map(w => `<div class="row ex"><p class="it grow">${esc(w)}</p>${sayBtn(w, 'sm')}</div>`).join('')}</section>` : ''}
      <button class="btn primary huge" data-act="again">Noch eine Runde</button>
      <button class="btn ghost" data-act="go" data-to="home">Fertig für jetzt</button>
    </main>`;
  },
};

// ---------- Lerneinheit ----------
function startSession(title, list, opts = {}) {
  if (!list.length) { toast('Dafür gibt es noch nicht genug Wörter. Lernen Sie zuerst ein paar Wörter unter „Heute“.'); return; }
  S = { title, list, i: 0, right: 0, total: 0, xp: 0, wrong: [], opts, startLevel: profile().level };
  resetAnswer();
  go('session');
}

function resetAnswer() {
  Object.assign(S, { phase: 'ask', sel: null, text: '', placed: [], fb: null, heard: '', listening: false, showDe: false, m: { left: null, done: [], miss: false, bad: null } });
  const ex = S.list[S.i];
  if (ex?.k === 'match') S.m.right = shuffle(ex.pairs.map((_, i) => i));
  S.spoken = false;
}

function autoSpeak() {
  const ex = S?.list[S.i];
  if (!ex || S.phase !== 'ask' || S.spoken) return;
  S.spoken = true;
  const t = ex.k === 'card' ? ex.w.it : ex.k === 'listen' ? ex.audio : ex.k === 'mc' && ex.big && ex.say ? ex.say : ex.k === 'speak' ? ex.it : '';
  if (t) setTimeout(() => speak(t), 250);
}

function sessionView(p) {
  const ex = S.list[S.i], done = Math.round(100 * S.i / S.list.length);
  const opts = (list) => `<div class="opts">${list.map((o, i) => {
    let c = S.sel === i ? 'sel' : '';
    if (S.phase === 'fb') c = i === ex.ans || o === ex.ans ? 'good' : S.sel === i ? 'bad' : '';
    return `<button class="opt ${c}" data-act="sel" data-i="${i}" ${S.phase === 'fb' ? 'disabled' : ''}>${esc(o)}</button>`;
  }).join('')}</div>`;
  const input = (ph) => `<input id="answer" class="answer" type="text" lang="it" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${ph}" value="${esc(S.text)}" data-in="text" ${S.phase === 'fb' ? 'disabled' : ''}>
    <div class="accents">${['à', 'è', 'é', 'ì', 'ò', 'ù'].map(a => `<button data-act="accent" data-c="${a}" ${S.phase === 'fb' ? 'disabled' : ''}>${a}</button>`).join('')}</div>`;
  let body = '', canCheck = false, footer = null;

  if (ex.k === 'card') {
    const w = ex.w;
    body = `<p class="task">Neues Wort</p><div class="flash"><div class="femoji">${esc(w.emoji || '🇮🇹')}</div><div class="row centerrow"><h2 class="it xl">${esc(w.it)}</h2>${sayBtn(w.it)}</div><p class="de">${esc(w.de)}</p>
      ${w.ex_it ? `<div class="example"><div class="row"><p class="it grow">${esc(w.ex_it)}</p>${sayBtn(w.ex_it, 'sm')}</div><p class="muted">${esc(w.ex_de)}</p></div>` : ''}</div>`;
    footer = `<button class="btn primary huge" data-act="next">Verstanden, weiter</button>`;
  } else if (ex.k === 'read') {
    body = `<p class="task">Lesen und zuhören</p><div class="flash left"><h2>${esc(ex.title)}</h2><p class="it story">${esc(ex.it)}</p>
      <div class="row"><button class="btn ghost" data-act="say" data-text="${esc(ex.it)}">🔊 Vorlesen</button><button class="btn ghost" data-act="saySlow" data-text="${esc(ex.it)}">🐢 Langsam</button></div>
      ${S.showDe ? `<p class="muted">${esc(ex.de)}</p>` : `<button class="btn ghost" data-act="showDe">Übersetzung zeigen</button>`}</div>`;
    footer = `<button class="btn primary huge" data-act="next">Weiter${S.list[S.i + 1] ? ' zu den Fragen' : ''}</button>`;
  } else if (ex.k === 'mc') {
    body = `<p class="task">${esc(ex.sub || 'Wählen Sie die richtige Antwort')}</p>
      <div class="prompt">${ex.emoji ? `<span class="pemoji">${esc(ex.emoji)}</span>` : ''}<h2 class="${ex.big ? 'it xl' : ''}">${esc(ex.q)}</h2>${ex.say ? sayBtn(ex.say) : ''}</div>${opts(ex.opts)}`;
    canCheck = S.sel !== null;
  } else if (ex.k === 'listen') {
    body = `<p class="task">Was hören Sie?</p><div class="prompt col"><button class="say giant" data-act="say" data-text="${esc(ex.audio)}" aria-label="Noch einmal anhören">🔊</button><button class="btn ghost slim" data-act="saySlow" data-text="${esc(ex.audio)}">🐢 Langsam anhören</button>${S.phase === 'fb' ? `<h2 class="it">${esc(ex.reveal)}</h2>` : ''}</div>${opts(ex.opts)}`;
    canCheck = S.sel !== null;
  } else if (ex.k === 'cloze') {
    const fill = S.phase === 'fb' ? ex.ans : ex.opts ? (S.sel !== null ? ex.opts[S.sel] : '') : S.text;
    const [a, b] = ex.sent.split('___');
    body = `<p class="task">${esc(ex.title || 'Was passt in die Lücke?')}</p><div class="prompt col"><h2 class="it">${esc(a)}<span class="gap ${S.phase === 'fb' ? 'filled' : ''}">${esc(fill) || '&nbsp;'}</span>${esc(b || '')}</h2>${ex.de ? `<p class="muted">${esc(ex.de)}</p>` : ''}</div>${ex.opts ? opts(ex.opts) : input('Fehlendes Wort')}`;
    canCheck = ex.opts ? S.sel !== null : S.text.trim() !== '';
  } else if (ex.k === 'order') {
    const used = new Set(S.placed);
    body = `<p class="task">Bilden Sie den Satz auf Italienisch</p><div class="prompt"><h2>${esc(ex.de)}</h2></div>
      <div class="line" aria-label="Ihr Satz">${S.placed.map((bi, pos) => `<button class="tok" data-act="unplace" data-pos="${pos}" ${S.phase === 'fb' ? 'disabled' : ''}>${esc(ex.bank[bi])}</button>`).join('') || '<span class="muted">Tippen Sie unten auf die Wörter</span>'}</div>
      <div class="bank">${ex.bank.map((t, bi) => `<button class="tok ${used.has(bi) ? 'used' : ''}" data-act="place" data-i="${bi}" ${used.has(bi) || S.phase === 'fb' ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div>`;
    canCheck = S.placed.length > 0;
  } else if (ex.k === 'type') {
    body = `<p class="task">Schreiben Sie auf Italienisch</p><div class="prompt">${ex.emoji ? `<span class="pemoji">${esc(ex.emoji)}</span>` : ''}<h2>${esc(ex.de)}</h2></div>${input(ex.hint ? `Beginnt mit „${esc(ex.hint)}“` : 'Ihre Antwort')}`;
    canCheck = S.text.trim() !== '';
  } else if (ex.k === 'match') {
    const cell = (side, idx, text) => {
      const done = S.m.done.includes(idx), sel = side === 'l' && S.m.left === idx, bad = S.m.bad && S.m.bad[side] === idx;
      return `<button class="opt ${done ? 'good' : ''} ${sel ? 'sel' : ''} ${bad ? 'bad' : ''}" data-act="match" data-side="${side}" data-i="${idx}" ${done ? 'disabled' : ''}>${esc(text)}</button>`;
    };
    body = `<p class="task">Was gehört zusammen? Erst links, dann rechts antippen.</p><div class="matchgrid"><div>${ex.pairs.map((pr, i) => cell('l', i, pr[0])).join('')}</div><div>${S.m.right.map(i => cell('r', i, ex.pairs[i][1])).join('')}</div></div>`;
    footer = S.phase === 'fb' ? null : '';
  } else if (ex.k === 'speak') {
    body = `<p class="task">Sprechen Sie laut nach</p><div class="prompt col"><div class="row centerrow"><h2 class="it">${esc(ex.it)}</h2>${sayBtn(ex.it)}</div><p class="muted">${esc(ex.de)}</p>
      ${SR ? `<button class="mic ${S.listening ? 'on' : ''}" data-act="mic" aria-label="Aufnahme starten">🎤</button><p class="muted">${S.listening ? 'Ich höre zu …' : S.heard ? 'Verstanden: „' + esc(S.heard) + '“' : 'Auf das Mikrofon tippen und sprechen'}</p>` : '<p class="muted">Hören Sie zu und sprechen Sie den Satz zwei- bis dreimal laut nach.</p>'}</div>`;
    footer = S.phase === 'fb' ? null : `<button class="btn primary huge" data-act="spoke">Ich habe es laut gesprochen</button>`;
  }

  if (footer === null) {
    footer = S.phase === 'fb' ? '' : `<button class="btn primary huge" data-act="check" ${canCheck ? '' : 'disabled'}>Prüfen</button>`;
  }
  const fb = S.fb;
  const panel = S.phase === 'fb' && fb ? `<div class="feedback ${fb.ok ? 'ok' : 'no'}" role="status" aria-live="polite">
      <h2>${fb.ok ? '✓ ' + pick(PRAISE) : pick(COMFORT)}</h2>
      ${fb.ok ? '' : `<p>Richtig ist: <b class="it">${esc(fb.correct)}</b></p>`}
      ${fb.note ? `<p>${esc(fb.note)}</p>` : ''}${fb.ok && fb.correct && fb.showCorrect ? `<p class="it">${esc(fb.correct)}</p>` : ''}
      ${fb.explain ? `<p>${esc(fb.explain)}</p>` : ''}
      ${fb.ai ? `<p class="aiexp">💡 ${esc(fb.ai)}</p>` : ''}
      <div class="row">${fb.say ? sayBtn(fb.say) : ''}${!fb.ok && aiReady() && !fb.ai ? `<button class="btn ghost slim" data-act="why">💡 Warum?</button>` : ''}<button class="btn primary grow" data-act="next">Weiter</button></div>
    </div>` : '';

  return `<main class="page session">
    <header class="shead"><button class="close" data-act="quit" aria-label="Lerneinheit beenden">✕</button><div class="pbar" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="100"><i style="width:${done}%"></i></div><span class="muted">${S.i + 1}/${S.list.length}</span></header>
    <section class="exercise">${body}</section>
    <footer class="sfoot">${footer}</footer>${panel}
  </main>`;
}

function taskText(ex) {
  if (ex.k === 'mc') return ex.q; if (ex.k === 'listen') return 'Hörverstehen: ' + ex.audio;
  if (ex.k === 'cloze') return ex.sent + (ex.de ? ' (' + ex.de + ')' : ''); if (ex.k === 'order' || ex.k === 'type') return 'Übersetze: ' + ex.de;
  return ex.it || '';
}

function settle(ok, { correct = '', given = '', note = '', showCorrect = false } = {}) {
  const p = profile(), ex = S.list[S.i];
  S.phase = 'fb';
  S.fb = { ok, correct, given, note, showCorrect, explain: ex.explain || '', say: ex.say || ex.sayAfter || ex.reveal || (ex.k === 'type' ? ex.ans : ''), task: taskText(ex) };
  if (!ex.retry) { S.total++; if (ok) S.right++; }
  p.answers++; if (ok) p.correct++;
  S.xp += ok ? (ex.retry ? 5 : 10) : 2;
  (ex.items || []).forEach(id => grade(p, id, ok));
  if (ex.xid) p.done[ex.xid] = (p.done[ex.xid] || 0) + 1;
  if (p.auto) p.level = Math.max(1, Math.min(5, p.level + (ok ? 0.05 : -0.12)));
  if (!ok) {
    if (correct && !S.wrong.includes(correct)) S.wrong.push(correct);
    if (!ex.retry) S.list.push({ ...ex, retry: true });
  }
  ding(ok); save(); render();
  const say = S.fb.say;
  if (say && ex.k !== 'listen') setTimeout(() => { if (S && S.list[S.i] === ex) speak(say); }, 350);
}

function check() {
  const ex = S.list[S.i];
  if (ex.k === 'mc' || ex.k === 'listen') settle(S.sel === ex.ans, { correct: ex.opts[ex.ans], given: ex.opts[S.sel] });
  else if (ex.k === 'cloze') {
    const full = ex.sent.replace('___', ex.ans);
    if (ex.opts) settle(ex.opts[S.sel] === ex.ans, { correct: full, given: ex.opts[S.sel] });
    else { const r = checkTyped(S.text, ex.ans); settle(r.ok, { correct: full, given: S.text, note: r.note, showCorrect: !!r.note }); }
  } else if (ex.k === 'order') {
    const given = S.placed.map(i => ex.bank[i]).join(' '), correct = ex.tokens.join(' ');
    settle(given === correct, { correct, given });
  } else if (ex.k === 'type') { const r = checkTyped(S.text, ex.ans); settle(r.ok, { correct: ex.ans, given: S.text, note: r.note, showCorrect: !!r.note }); }
}

function next() {
  window.speechSynthesis?.cancel?.();
  S.i++;
  if (S.i >= S.list.length) return finish();
  resetAnswer(); render(); window.scrollTo(0, 0);
}

function awardBadges(p) {
  const s = stats(p), fresh = BADGES.filter(b => !p.badges.includes(b.id) && b.test(p, s));
  fresh.forEach(b => p.badges.push(b.id));
  return fresh;
}

function finish() {
  const p = profile(), acc = S.total ? S.right / S.total : 1;
  const xp = S.xp + 10;
  p.sessions++;
  if (S.total >= 4 && S.right === S.total) p.perfect++;
  if (p.auto && S.total >= 4) p.level = Math.max(1, Math.min(5, p.level + (acc >= 0.9 ? 0.15 : acc < 0.6 ? -0.2 : 0)));
  touchDay(p, xp);
  const a = Math.round(S.startLevel), b = Math.round(p.level);
  const levelMsg = b > a ? `📈 Sie werden besser! Die Aufgaben werden jetzt etwas anspruchsvoller (Stufe ${b}: ${LEVELS[b - 1].name}).`
    : b < a ? `🌿 Wir gehen einen Schritt zurück und festigen die Grundlagen (Stufe ${b}: ${LEVELS[b - 1].name}). Das ist völlig in Ordnung.` : '';
  lastSummary = { xp, right: S.right, total: S.total, wrong: S.wrong.slice(0, 6), badges: awardBadges(p), levelMsg, opts: S.opts };
  save(); S = null; go('summary');
}

function launch(mode, unitId) {
  const p = profile();
  const titles = { mix: 'Lernen', review: 'Wiederholen', listen: 'Hör-Training', order: 'Satzbau', speak: 'Aussprache', verbs: 'Verb-Trainer' };
  startSession(titles[mode], buildSession(p, { mode, unitIds: unitId ? [unitId] : null }), { mode, unitId });
}

// ---------- Fotos ----------
function shrink(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const max = 1568, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Dieses Bild konnte nicht gelesen werden.')); };
    img.src = url;
  });
}

async function addPhotos(files) {
  for (const f of files) {
    if (photos.length >= 6) { toast('Bitte höchstens 6 Fotos auf einmal.'); break; }
    try { photos.push(await shrink(f)); } catch (e) { toast(e.message); }
  }
  render();
}

async function analyse() {
  const note = document.getElementById('note')?.value || '';
  busy(['Ich schaue mir die Fotos an …', 'Ich lese die Handschrift …', 'Ich sammle die neuen Wörter …', 'Ich denke mir passende Übungen aus …', 'Ich schreibe eine kleine Geschichte …', 'Gleich fertig …']);
  try {
    const unit = toUnit(await analysePhotos(photos, note, profile().level));
    if (!unit.vocab.length && !unit.pool.length) throw new Error('Auf den Fotos war nichts Italienisches zu erkennen. Bitte bei gutem Licht noch einmal fotografieren.');
    state.units.unshift(unit); photos = [];
    awardBadges(profile()); save();
    go('unit', { id: unit.id });
    toast('Die neue Lektion ist fertig. Buono studio!');
  } catch (e) { toast(e.message || 'Das hat leider nicht geklappt.', 6000); }
  finally { unbusy(); }
}

async function more(id) {
  const u = unitById(id), p = profile();
  if (!aiReady()) { toast('Dafür wird der KI-Zugang benötigt (siehe „Mehr“).'); return; }
  busy(['Ich denke mir neue Aufgaben aus …', 'Ich suche eine neue Alltagssituation …', 'Ich schreibe eine neue Geschichte …', 'Gleich fertig …']);
  try {
    const weak = u.vocab.filter(v => { const s = p.items[wordId(v.it)]; return s && s.ko > s.ok; }).map(v => v.it).slice(0, 10);
    const r = mergeMore(u, await moreExercises(u, p.level, weak));
    save(); render();
    toast(`Neu: ${r.exercises} Aufgaben${r.words ? ', ' + r.words + ' Wörter' : ''}${r.story ? ' und eine Geschichte' : ''}.`, 5000);
  } catch (e) { toast(e.message || 'Das hat leider nicht geklappt.', 6000); }
  finally { unbusy(); }
}

// ---------- Memory ----------
function newMemory() {
  const p = profile();
  const known = collectWords(null).filter(w => p.items[w.id] && w.it.length < 22 && w.de.length < 22);
  const pool = known.length >= 6 ? known : collectWords(null).filter(w => w.it.length < 22 && w.de.length < 22);
  const words = shuffle(pool).slice(0, 6);
  M = { moves: 0, open: [], found: new Set(), lock: false, cards: shuffle(words.flatMap((w, i) => [{ pair: i, text: w.it, lang: 'mit' }, { pair: i, text: w.de, lang: 'mde' }])) };
  go('memory');
}

function flip(i) {
  const c = M.cards[i];
  if (M.lock || M.open.includes(i) || M.found.has(c.pair)) return;
  M.open.push(i);
  if (c.lang === 'mit') speak(c.text);
  if (M.open.length === 2) {
    M.moves++;
    const [a, b] = M.open.map(x => M.cards[x]);
    if (a.pair === b.pair) {
      M.found.add(a.pair); M.open = []; ding(true);
      if (M.found.size === M.cards.length / 2) { const p = profile(); p.memory++; touchDay(p, 20); awardBadges(p); save(); }
    } else { M.lock = true; setTimeout(() => { M.open = []; M.lock = false; if (view.name === 'memory') render(); }, 1400); }
  }
  render();
}

// ---------- Aktionen ----------
const actions = {
  go: el => go(el.dataset.to),
  say: el => speak(el.dataset.text),
  saySlow: el => speak(el.dataset.text, true),
  pickAvatar: el => { const n = document.getElementById('pname').value; view.av = +el.dataset.i; render(); document.getElementById('pname').value = n; },
  addProfile: () => {
    const name = document.getElementById('pname').value.trim();
    if (!name) { toast('Bitte einen Vornamen eintragen.'); return; }
    const p = newProfile(name, AVATARS[view.av || 0]);
    state.profiles.push(p); state.current = p.id; save(); go('home');
  },
  pickProfile: el => { state.current = el.dataset.id; save(); go('home'); },
  start: el => launch(el.dataset.mode, el.dataset.unit),
  again: () => { const o = lastSummary.opts; if (o.mode) launch(o.mode, o.unitId); else go('home'); },
  openUnit: el => go('unit', { id: el.dataset.id }),
  story: el => { const u = unitById(el.dataset.id); startSession('Geschichte', storyExercises(u.stories[+el.dataset.i]), {}); },
  more: el => more(el.dataset.id),
  toggleEdit: () => { view.edit = !view.edit; render(); },
  delWord: el => { const u = unitById(view.id); u.vocab.splice(+el.dataset.i, 1); save(); render(); },
  delUnit: el => { if (confirm('Diese Lektion wirklich löschen?')) { state.units = state.units.filter(u => u.id !== el.dataset.id); save(); go('units'); } },
  rmPhoto: el => { photos.splice(+el.dataset.i, 1); render(); },
  analyse,
  manual: () => {
    const u = unitFromText(document.getElementById('mtitle').value.trim(), document.getElementById('mtext').value);
    if (u.vocab.length < 2) { toast('Bitte mindestens zwei Zeilen in der Form „italienisch = deutsch“ eintragen.'); return; }
    state.units.unshift(u); awardBadges(profile()); save(); go('unit', { id: u.id });
  },
  memory: newMemory,
  flip: el => flip(+el.dataset.i),
  pref: el => {
    const p = profile(), k = el.dataset.k, raw = el.dataset.v, v = raw === 'true' ? true : raw === 'false' ? false : Number(raw);
    if (k === 'auto') p.auto = v; else if (k === 'level') { p.level = v; p.auto = false; } else p.prefs[k] = v;
    save(); render();
  },
  export: () => {
    const blob = new Blob([JSON.stringify({ ...state, settings: { ...state.settings, apiKey: '' } })], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `parliamo-sicherung-${dayKey()}.json`; a.click();
    toast('Sicherung gespeichert (ohne den KI-Schlüssel).');
  },
  resetProfile: () => {
    if (!confirm('Wirklich alle Punkte und den Lernstand dieser Person löschen?')) return;
    const p = profile(), n = newProfile(p.name, p.avatar);
    Object.assign(p, n, { id: p.id }); save(); go('home');
  },
  // Lerneinheit
  quit: () => { if (confirm('Lerneinheit beenden? Die bisherigen Antworten bleiben gespeichert.')) { window.speechSynthesis?.cancel?.(); S = null; go('home'); } },
  sel: el => { S.sel = +el.dataset.i; render(); },
  check, next,
  showDe: () => { S.showDe = true; render(); },
  accent: el => { const inp = document.getElementById('answer'); S.text = (inp.value || '') + el.dataset.c; render(); const n = document.getElementById('answer'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); },
  place: el => { S.placed.push(+el.dataset.i); speak(S.list[S.i].bank[+el.dataset.i]); render(); },
  unplace: el => { S.placed.splice(+el.dataset.pos, 1); render(); },
  match: el => {
    const ex = S.list[S.i], i = +el.dataset.i;
    if (el.dataset.side === 'l') { S.m.left = i; S.m.bad = null; speak(ex.pairs[i][0]); render(); return; }
    if (S.m.left === null) { toast('Bitte zuerst links ein Wort antippen.'); return; }
    if (S.m.left === i) { S.m.done.push(i); S.m.left = null; S.m.bad = null; ding(true); }
    else { S.m.miss = true; S.m.bad = { l: S.m.left, r: i }; S.m.left = null; ding(false); }
    if (S.m.done.length === ex.pairs.length) settle(!S.m.miss, { correct: S.m.miss ? ex.pairs.map(p => p.join(' = ')).join(', ') : '' });
    else render();
  },
  spoke: () => settle(true, { note: 'Lautes Sprechen ist die beste Übung.' }),
  mic: () => {
    if (!SR || S.listening) return;
    const ex = S.list[S.i];
    try {
      window.speechSynthesis?.cancel?.();
      rec = new SR(); rec.lang = 'it-IT'; rec.interimResults = false; rec.maxAlternatives = 3;
      rec.onresult = e => {
        const alts = Array.from(e.results[0]).map(a => a.transcript);
        const best = alts.map(t => [similar(t, ex.it), t]).sort((a, b) => b[0] - a[0])[0];
        S.heard = best[1]; S.listening = false;
        if (best[0] >= 0.72) settle(true, { note: `Sehr gut ausgesprochen! Verstanden: „${best[1]}“` }); else { render(); toast('Noch nicht ganz. Hören Sie noch einmal zu und versuchen Sie es erneut.'); }
      };
      rec.onerror = () => { S.listening = false; render(); toast('Das Mikrofon konnte nicht verwendet werden. Sprechen Sie einfach laut nach und tippen Sie auf den Knopf unten.', 5000); };
      rec.onend = () => { if (S && S.listening) { S.listening = false; render(); } };
      S.listening = true; rec.start(); render();
    } catch (e) { S.listening = false; toast('Das Mikrofon steht hier nicht zur Verfügung.'); }
  },
  why: async el => {
    el.disabled = true; el.textContent = '💡 Einen Moment …';
    const fb = S.fb;
    try { fb.ai = await explainMistake(fb.task, fb.given || '(keine Antwort)', fb.correct); if (S && S.fb === fb) render(); }
    catch (e) { toast(e.message); el.disabled = false; el.textContent = '💡 Warum?'; }
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el, e);
});

document.addEventListener('input', e => {
  const k = e.target.dataset?.in;
  if (k === 'text' && S) {
    S.text = e.target.value;
    const b = document.querySelector('[data-act="check"]'); if (b) b.disabled = !S.text.trim();
    const g = document.querySelector('.gap'); if (g) g.textContent = S.text || ' ';
  }
  if (k === 'apiKey' || k === 'proxyUrl') {
    state.settings[k] = e.target.value.trim(); save();
    const s = document.querySelector('.status'); if (s) { s.className = 'status ' + (aiReady() ? 'ok' : ''); s.textContent = aiReady() ? '✓ Zugang ist eingerichtet' : 'Noch nicht eingerichtet'; }
  }
});

document.addEventListener('change', async e => {
  const k = e.target.dataset?.in;
  if (k === 'photos') { const files = [...e.target.files]; e.target.value = ''; await addPhotos(files); }
  if (k === 'model') { state.settings.model = e.target.value; save(); }
  if (k === 'import') {
    try {
      const obj = JSON.parse(await e.target.files[0].text());
      if (!Array.isArray(obj.profiles)) throw new Error();
      if (confirm('Die Sicherung ersetzt alle Daten auf diesem Gerät. Fortfahren?')) { replaceState({ ...obj, settings: { ...obj.settings, apiKey: state.settings.apiKey } }); go('profiles'); }
    } catch (err) { toast('Diese Datei ist keine gültige Sicherung.'); }
  }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || view.name !== 'session' || !S) return;
  if (S.phase === 'fb') next();
  else { const b = document.querySelector('[data-act="check"]'); if (b && !b.disabled) check(); }
});

function render() {
  const p = profile();
  if (!p && view.name !== 'profiles') view = { name: 'profiles' };
  document.documentElement.style.fontSize = (18 * (p?.prefs.font || 1)) + 'px';
  if (view.name === 'session' && !S) view = { name: 'home' };
  if (view.name === 'memory' && !M) view = { name: 'games' };
  if (view.name === 'summary' && !lastSummary) view = { name: 'home' };
  app.innerHTML = views[view.name](p);
  if (view.name === 'session') autoSpeak();
}

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
navigator.storage?.persist?.().catch?.(() => {});
render();
