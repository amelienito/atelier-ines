'use strict';
/* =====================================================================
   ATELIER · données
   Modèles par défaut, palettes, structure des données, fusion entre
   appareils. Tout ce qui décrit le « quoi », pas l'affichage.
   ===================================================================== */

const LS_KEY = 'atelier.data.v1';      // même clé qu'avant : les données existantes sont reprises
const LS_SYNC = 'atelier.sync.v1';
const LS_LOCAL = 'atelier.local.v1';   // réglages propres à l'appareil (vibrations, sons…)
const LS_DIRTY = 'atelier.dirty.v1';
const DEFAULT_OWNER = 'amelienito';
const DEFAULT_REPO = 'atelier-ines-data';
const SIDES = ['perso', 'pro'];

/* ---------- Couleurs : des surligneurs ----------
   Une couleur par espace. Elle ne sert qu'à une chose : montrer ce qui
   est fait (comme un coup de surligneur dans le carnet). */
const MARKERS = [
  ['Rose', '#ff6fa5'], ['Corail', '#ff8668'], ['Orange', '#ffa24c'], ['Jaune', '#f2cf3a'],
  ['Vert', '#5fd08a'], ['Menthe', '#3ecdb5'], ['Bleu', '#5fb2ff'], ['Lilas', '#a58bff'],
];
const CLOTHS = MARKERS;
/* Anciennes couleurs (v3 à v5) → surligneur le plus proche */
const OLD_CLOTH = {
  '#ff8b74': '#ff6fa5', '#4dc3d6': '#5fd08a',
  '#f0648c': '#ff6fa5', '#ffb07c': '#ffa24c', '#f5c451': '#f2cf3a', '#b3d66a': '#5fd08a',
  '#6fd5b0': '#3ecdb5', '#7fa9ff': '#5fb2ff', '#9d92ff': '#a58bff', '#c890f2': '#a58bff',
  '#ff9fc8': '#ff6fa5', '#ddc4a2': '#ffa24c',
  '#6b1f2a': '#ff6fa5', '#b5332a': '#ff8668', '#97461f': '#ffa24c', '#c2902a': '#f2cf3a',
  '#5c6a2c': '#5fd08a', '#1e4637': '#3ecdb5', '#0d5a62': '#3ecdb5', '#1d2945': '#5fb2ff',
  '#4a2446': '#a58bff', '#b06873': '#ff6fa5', '#c4b89f': '#ffa24c', '#1b1a1d': '#a58bff',
  '#e0457b': '#ff6fa5', '#1f8460': '#5fd08a',
};
const hue = (c) => { const k = String(c || '').toLowerCase(); return OLD_CLOTH[k] || k; };
/* Couleurs des pastilles de type (gardées dans les données, plus affichées) */
const PALETTE = [
  ['Framboise', '#d0436f'], ['Corail', '#e0603f'], ['Abricot', '#e5862b'], ['Miel', '#c9970f'],
  ['Sauge', '#5f9457'], ['Sapin', '#1f8460'], ['Lagon', '#1593a8'], ['Bleuet', '#4470e0'],
  ['Lavande', '#7e5fe0'], ['Prune', '#9a4386'], ['Rose poudré', '#cf7395'], ['Ardoise', '#55627b'],
];
/* Anciennes couvertures en dégradé → toile la plus proche */
const GRAD_TO_CLOTH = { aube: '#ff9fc8', peche: '#ffb07c', soleil: '#f5c451', menthe: '#6fd5b0', lagon: '#4dc3d6', ciel: '#7fa9ff', lavande: '#9d92ff', pierre: '#ddc4a2', braise: '#ff8b74', foret: '#b3d66a', nuit: '#c890f2', encre: '#7fa9ff' };

const BOOK_EMOJIS = ['📕', '📗', '📘', '📙', '📓', '📔', '📒'];

/* ---------- Modèles par défaut (tout est modifiable dans Réglages) ---------- */
const DEFAULT_SIDES = {
  perso: {
    name: 'Bibliothèque perso', emoji: '📚', color: '#ff6fa5',
    steps: ['Typeset', 'Impression', 'Couture', 'Colle', 'Maquette', 'Découpe carton',
      'Découpe Cricut', 'Impression couverture', 'Vinyle', 'Assemblage final'],
    deliverables: ['Dossier du projet', 'Fichiers typeset + maquette rangés', 'Photos du bind'],
    types: [['Perso', '#7e5fe0'], ['Bind exchange', '#e5862b']],
    fields: [['Auteur ou fandom', true], ['Format', true], ['Papier', true], ['Couverture', true], ['Couture', false], ['Pages de garde', false], ['Tranchefile et signet', false], ['Nombre de pages', false], ['Lien du texte', false]],
  },
  pro: {
    name: 'Activité pro', emoji: '✂️', color: '#5fd08a',
    steps: ['Création maquette', 'Envoi maquette', 'Validation maquette', 'Règlement acompte',
      'Commande matériel (si besoin)', 'Découpe carton', 'Impression couv + découpe Cricut',
      'Vinyle', 'Impression page de garde', 'Assemblage du livre', 'Photo du livre',
      'Envoi + validation photo', 'Règlement final', 'Envoi commande'],
    deliverables: ['Dossier du projet', 'Maquette finale (PDF)', 'Fichier de découpe Cricut', 'Photos du livre'],
    types: [['Couverture', '#4470e0'], ['Rebind', '#9a4386']],
    fields: [['Prix', true], ['Format', true], ['Couverture', true], ['Livraison', true], ['Papier', false], ['Acompte', false], ['Pages de garde', false], ['Nombre de pages', false]],
  },
};
const DEFAULT_PREFS = { theme: 'auto', bg: 'doux', density: 'aeree', progress: 'perles', numbers: false, tables: true, links: true };
const PREF_CHOICES = { theme: ['auto', 'clair', 'sombre'], bg: ['doux', 'points', 'uni'], density: ['aeree', 'compacte'], progress: ['perles', 'barre'] };

/* ---------- Petits outils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const now = () => Date.now();
const clone = (o) => JSON.parse(JSON.stringify(o));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const dayStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => dayStr();
const shortDate = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '');
const hashStr = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const hid = (prefix, s) => prefix + hashStr(s).toString(36);
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const isHex = (c) => /^#[0-9a-f]{6}$/i.test(c || '');
const defaultIcon = (id) => BOOK_EMOJIS[hashStr(id) % BOOK_EMOJIS.length];
const defaultCloth = (id) => CLOTHS[hashStr('t' + id) % CLOTHS.length][1];
/* Contraste : texte doré ou encre selon la toile */
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const inkOn = (hex) => (contrast(hex, '#f2d991') >= contrast(hex, '#1d1b18') ? 'gilt' : 'ink');
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

/* =====================================================================
   STRUCTURE
   ===================================================================== */
let state;

function makeSide(side, deterministic) {
  const d = DEFAULT_SIDES[side];
  const id = (k, n) => (deterministic ? hid(k, side + '|' + n) : k + uid());
  return {
    name: d.name, emoji: d.emoji, color: d.color,
    steps: d.steps.map((n) => ({ id: id('s', n), name: n })),
    deliverables: d.deliverables.map((n) => ({ id: id('l', n), name: n })),
    types: d.types.map(([n, c]) => ({ id: id('t', n), name: n, color: c })),
    fields: d.fields.map(([n, on]) => ({ id: id('f', n), name: n, on })),
  };
}

function freshState() {
  return {
    v: 2, seed: false, user: 'Inès', userU: 0,
    sides: { perso: makeSide('perso'), pro: makeSide('pro') }, sidesU: 0,
    prefs: { ...DEFAULT_PREFS }, prefsU: 0,
    projects: [], orderU: 0, deleted: {},
    today: { date: todayStr(), items: [], u: 0 },
  };
}

function buildProject(s, side, title, o = {}) {
  const skip = new Set(o.skip || []);
  const sd = s.sides[side];
  const id = uid();
  return {
    id, side, title: String(title || '').trim() || 'Sans titre',
    icon: o.icon || defaultIcon(id), cloth: o.cloth || defaultCloth(id), cover: o.cover || null,
    kind: o.kind || '', client: o.client || '', contact: o.contact || '', notes: '',
    spec: Object.assign({}, o.spec || {}), log: [],
    steps: [
      ...sd.steps.filter((t) => !skip.has(t.id) && !skip.has(t.name)).map((t) => ({ id: uid(), tpl: t.id, name: t.name, done: false })),
      ...(o.extra || []).map((n) => ({ id: uid(), name: n, done: false, custom: true })),
    ],
    deliverables: sd.deliverables.map((d) => ({ id: uid(), name: d.name, done: false })),
    start: o.start ?? todayStr(), end: '', endAuto: false, due: o.due || '',
    archived: false, archivedAt: null, created: now(), u: now(),
  };
}

/* Exemples tirés des photos (proposés au premier lancement) */
/* Titres des exemples (pour les reconnaître même sans marque) */
const SEED_TITLES = ['Just Lovers', 'Green Light', 'Le Chevalier Errant', 'Eragon', 'Les Liaisons dangereuses'];
const looksLikeDemo = (s) => s.seed || s.projects.some((p) => p.demo) || (s.projects.length > 0 && s.projects.every((p) => SEED_TITLES.includes(p.title)));

function seedState() {
  const s = freshState();
  s.seed = true;
  const mk = (side, title, done, o) => {
    const p = buildProject(s, side, title, { start: dayStr(new Date(Date.now() - (12 + done * 2) * 864e5)), ...o });
    p.steps.forEach((st, i) => { st.done = i < done; if (st.done) st.doneAt = Date.now() - Math.max(0, done - i - 1) * 864e5 * 1.3 - 36e5; });
    p.demo = true;
    s.projects.push(p);
    return p;
  };
  const jl = mk('perso', 'Just Lovers', 3, { kind: 'Perso', spec: {} });
  const f = (side, n) => (s.sides[side].fields.find((x) => x.name === n) || {}).id;
  jl.spec[f('perso', 'Format')] = 'A5'; jl.spec[f('perso', 'Papier')] = 'Ivoire 90 g'; jl.spec[f('perso', 'Couverture')] = 'Toile rose poudré';
  mk('perso', 'Green Light', 0, { cloth: '#b3d66a', skip: ['Découpe Cricut'] });
  const ce = mk('pro', 'Le Chevalier Errant', 5, { kind: 'Rebind', client: 'Camille', due: dayStr(new Date(Date.now() + 9 * 864e5)) });
  mk('pro', 'Eragon', 7, { kind: 'Rebind', cloth: '#ffb07c' });
  mk('pro', 'Les Liaisons dangereuses', 2, { kind: 'Couverture', cloth: '#c890f2' });
  s.today.items = [
    { id: uid(), projectId: jl.id, stepId: jl.steps[3].id },
    { id: uid(), projectId: ce.id, stepId: ce.steps[5].id },
    { id: uid(), free: true, text: 'Racheter de la colle', done: false },
  ];
  return s;
}

/* Remet d'aplomb des données venues d'ailleurs (ancienne version,
   synchro, import). Doit donner le même résultat sur tous les appareils. */
function normalize(s) {
  if (!s || typeof s !== 'object') s = freshState();
  const out = {
    v: 2, seed: !!s.seed,
    user: typeof s.user === 'string' ? s.user : 'Inès', userU: +s.userU || 0,
    sides: {}, sidesU: +s.sidesU || 0,
    prefs: { ...DEFAULT_PREFS }, prefsU: +s.prefsU || 0,
    projects: [], orderU: +s.orderU || 0, deleted: {},
    today: { date: todayStr(), items: [], u: 0 },
  };
  for (const side of SIDES) out.sides[side] = normSide(s.sides && s.sides[side], side);
  const pr = s.prefs && typeof s.prefs === 'object' ? s.prefs : {};
  for (const [k, choices] of Object.entries(PREF_CHOICES)) if (choices.includes(pr[k])) out.prefs[k] = pr[k];
  for (const k of ['numbers', 'tables', 'links']) if (typeof pr[k] === 'boolean') out.prefs[k] = pr[k];
  if (s.deleted && typeof s.deleted === 'object') for (const [k, v] of Object.entries(s.deleted)) if (+v) out.deleted[k] = +v;
  out.projects = (Array.isArray(s.projects) ? s.projects : [])
    .filter((p) => p && p.id && SIDES.includes(p.side))
    .map((p) => normProject(p, out.sides[p.side]));
  const t = s.today && typeof s.today === 'object' ? s.today : {};
  out.today.date = typeof t.date === 'string' ? t.date : todayStr();
  out.today.u = +t.u || 0;
  out.today.items = (Array.isArray(t.items) ? t.items : []).map(normTodayItem).filter(Boolean);
  return out;
}

function normSide(sd, side) {
  const d = makeSide(side, true);
  if (!sd || typeof sd !== 'object') return d;
  const list = (arr, fb, extra) => (Array.isArray(arr)
    ? arr.filter((x) => x && String(x.name || '').trim()).map((x) => ({ id: String(x.id || hid('x', side + x.name)), name: String(x.name), ...(extra ? extra(x) : {}) }))
    : fb);
  return {
    name: String(sd.name || '').trim() || d.name,
    emoji: String(sd.emoji || '').trim() || d.emoji,
    color: isHex(sd.color) ? hue(sd.color) : d.color,
    steps: list(sd.steps, d.steps),
    deliverables: list(sd.deliverables, d.deliverables),
    types: list(sd.types, d.types, (x) => ({ color: isHex(x.color) ? x.color.toLowerCase() : '#8564e8' }))
      .map((t) => (t.name === 'Fanfic' && d.name === 'Bibliothèque perso' ? { ...t, name: 'Perso' } : t)),
    fields: list(sd.fields, d.fields, (x) => ({ on: !!x.on })),
  };
}

function normCover(c) {
  if (c && c.t === 'img' && typeof c.key === 'string' && c.key) return { t: 'img', key: c.key };
  return null;
}

function normProject(p, sd) {
  const items = (arr) => (Array.isArray(arr) ? arr : []).filter((x) => x && String(x.name || '').trim());
  const steps = items(p.steps).map((x) => {
    const st = { id: String(x.id || hid('x', p.id + x.name)), name: String(x.name), done: !!x.done };
    if (x.tpl) st.tpl = String(x.tpl);
    if (x.custom) st.custom = true;
    if (x.done && x.doneAt) st.doneAt = +x.doneAt;
    return st;
  });
  const deliverables = Array.isArray(p.deliverables)
    ? items(p.deliverables).map((x) => ({ id: String(x.id || hid('x', p.id + x.name)), name: String(x.name), done: !!x.done }))
    : sd.deliverables.map((d) => ({ id: hid('l', p.id + d.name), name: d.name, done: false }));
  const str = (v) => (typeof v === 'string' ? v : '');
  const spec = {};
  if (p.spec && typeof p.spec === 'object') for (const k of Object.keys(p.spec)) { const v = str(p.spec[k]).trim(); if (v) spec[String(k)] = v; }
  const log = (Array.isArray(p.log) ? p.log : []).filter((x) => x && (str(x.text).trim() || str(x.photo)) && +x.at)
    .map((x) => ({ id: String(x.id || hid('j', p.id + x.at)), at: +x.at, ...(str(x.text).trim() ? { text: str(x.text).trim() } : {}), ...(str(x.photo) ? { photo: str(x.photo) } : {}) }));
  return {
    id: String(p.id), side: p.side, title: String(p.title || '').trim() || 'Sans titre',
    icon: String(p.icon || '').trim() || defaultIcon(String(p.id)),
    cloth: isHex(p.cloth) ? hue(p.cloth) : (p.cover && p.cover.t === 'grad' && GRAD_TO_CLOTH[p.cover.v]) || defaultCloth(String(p.id)),
    cover: normCover(p.cover),
    kind: p.side === 'perso' && p.kind === 'Fanfic' ? 'Perso' : str(p.kind), client: str(p.client), contact: str(p.contact), notes: str(p.notes),
    spec, log,
    steps, deliverables,
    start: str(p.start), end: str(p.end), endAuto: !!p.endAuto, due: str(p.due),
    archived: !!p.archived, archivedAt: +p.archivedAt || null,
    created: +p.created || +p.u || 0, u: +p.u || 0,
    ...(p.demo ? { demo: true } : {}),
  };
}

function normTodayItem(it) {
  if (!it || typeof it !== 'object') return null;
  if (it.free || (typeof it.text === 'string' && !it.projectId)) {
    const text = String(it.text || '').trim();
    if (!text) return null;
    return { id: String(it.id || hid('f', text)), free: true, text, done: !!it.done, ...(it.carried ? { carried: true } : {}) };
  }
  if (!it.projectId || !it.stepId) return null;
  return { id: String(it.id || hid('i', it.projectId + it.stepId)), projectId: String(it.projectId), stepId: String(it.stepId), ...(it.carried ? { carried: true } : {}) };
}

/* ---------- Fusion de deux versions (deux appareils) ----------
   Projet par projet, le plus récent gagne ; les suppressions sont
   gardées en mémoire pour qu'un projet supprimé ne revienne pas. */
function mergeStates(a, b) {
  a = normalize(clone(a)); b = normalize(clone(b));
  const out = clone(b);
  for (const [k, ku] of [['user', 'userU'], ['sides', 'sidesU'], ['prefs', 'prefsU']]) {
    if (a[ku] > b[ku]) { out[k] = a[k]; out[ku] = a[ku]; }
  }
  for (const [id, ts] of Object.entries(a.deleted)) out.deleted[id] = Math.max(ts, out.deleted[id] || 0);
  const map = new Map(b.projects.map((p) => [p.id, p]));
  for (const p of a.projects) { const q = map.get(p.id); if (!q || p.u > q.u) map.set(p.id, p); }
  const base = a.orderU > b.orderU ? a.projects : b.projects;
  out.orderU = Math.max(a.orderU, b.orderU);
  const seen = new Set(base.map((p) => p.id));
  const ids = [...base.map((p) => p.id), ...[...map.keys()].filter((id) => !seen.has(id))];
  out.projects = ids.filter((id) => map.has(id) && !(out.deleted[id] && out.deleted[id] >= map.get(id).u)).map((id) => map.get(id));
  if (a.today.u > b.today.u) out.today = a.today;
  out.seed = a.seed && b.seed;
  return normalize(out);
}
const combine = (local, remote) => (local.seed ? normalize(clone(remote)) : mergeStates(local, remote));
const sameState = (x, y) => JSON.stringify(normalize(clone(x))) === JSON.stringify(normalize(clone(y)));

/* =====================================================================
   LECTURE / CALCULS
   ===================================================================== */
const P = (id) => state.projects.find((p) => p.id === id);
const activeProjects = (side) => state.projects.filter((p) => !p.archived && (!side || p.side === side));
const archivedProjects = () => state.projects.filter((p) => p.archived).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
const sideColor = (side) => state.sides[side].color;

function progress(p) {
  const total = p.steps.length;
  const done = p.steps.filter((s) => s.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
const nextStep = (p) => p.steps.find((s) => !s.done);
function phase(p) {
  if (p.archived) return 'archived';
  const { done, total } = progress(p);
  if (!total || done < total) return 'encours';
  return p.deliverables.length && !p.deliverables.every((d) => d.done) ? 'livrables' : 'fini';
}
const typeOf = (p) => (p.kind ? state.sides[p.side].types.find((t) => t.name === p.kind) || { name: p.kind, color: '#8a8798' } : null);
const inToday = (pid, sid) => state.today.items.some((it) => it.projectId === pid && it.stepId === sid);

function todayEntries() {
  return state.today.items.map((it) => {
    if (it.free) return { it, free: true, done: it.done };
    const p = P(it.projectId);
    if (!p || p.archived) return null;
    const st = p.steps.find((s) => s.id === it.stepId);
    if (!st) return null;
    return { it, p, st, done: st.done };
  }).filter(Boolean);
}

/* Prochaines étapes proposées (dans l'ordre d'urgence des deux côtés) */
function suggestions(limit) {
  const out = [];
  const lists = SIDES.map((s) => activeProjects(s));
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max && out.length < limit; i++) {
    for (const l of lists) {
      const p = l[i]; if (!p) continue;
      const st = nextStep(p);
      if (st && !inToday(p.id, st.id) && out.length < limit) out.push({ p, st });
    }
  }
  return out;
}

/* Nouveau jour : ce qui n'est pas fait est gardé (« d'hier »), le reste part */
function rollDay() {
  if (state.today.date === todayStr()) return false;
  state.today.items = todayEntries().filter((e) => !e.done).map((e) => ({ ...e.it, carried: true }));
  state.today.date = todayStr();
  state.today.u = now();
  return true;
}

function afterStepChange(p) {
  const { done, total } = progress(p);
  if (total > 0 && done === total) {
    if (!p.end) { p.end = todayStr(); p.endAuto = true; }
    return p.deliverables.every((d) => d.done) ? 'archive' : 'livrables';
  }
  if (p.endAuto) { p.end = ''; p.endAuto = false; }
  return null;
}

function archiveProject(p) {
  p.archived = true; p.archivedAt = now(); p.u = now();
  const n = state.today.items.length;
  state.today.items = state.today.items.filter((it) => it.projectId !== p.id);
  if (state.today.items.length !== n) state.today.u = now();
}


/* ---------- Couleur d'un livre : celle de son espace (cohérence d'un coup d'œil) ---------- */
const colOf = (p) => (state.sides[p.side] ? state.sides[p.side].color : '#ff6fa5');

/* ---------- Avancement (vue d'ensemble) ----------
   Compte toutes les étapes et tous les livrables des livres en cours. */
function stats(side) {
  const list = side ? activeProjects(side) : SIDES.flatMap((s) => activeProjects(s));
  let done = 0; let total = 0;
  for (const p of list) {
    for (const x of p.steps) { total++; if (x.done) done++; }
    for (const x of p.deliverables) { total++; if (x.done) done++; }
  }
  const t0 = new Date(); const month = new Date(t0.getFullYear(), t0.getMonth(), 1).getTime();
  const all = side ? state.projects.filter((p) => p.side === side) : state.projects;
  const finished = all.filter((p) => p.archived && (p.archivedAt || 0) >= month).length;
  const stepsMonth = all.reduce((n, p) => n + p.steps.filter((x) => x.done && (x.doneAt || 0) >= month).length, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, books: list.length, finished, stepsMonth };
}
const pctOf = (p) => { const t = p.steps.length + p.deliverables.length; const d = p.steps.filter((x) => x.done).length + p.deliverables.filter((x) => x.done).length; return t ? Math.round((d / t) * 100) : 0; };

/* ---------- Mélange de couleurs sans color-mix (anciens Safari) ---------- */
function mixHex(a, b, t) {
  const h = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const A = h(a); const B = h(b);
  return '#' + A.map((v, i) => Math.round(v * t + B[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
}


/* ---------- Activité des derniers jours (pour « Cette semaine ») ----------
   Étapes cochées par jour et par espace, d'après la date où elles l'ont été. */
function weekActivity(days = 7) {
  const out = [];
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(t0.getTime() - i * 864e5);
    out.push({ date: d, key: dayStr(d), perso: 0, pro: 0 });
  }
  const idx = new Map(out.map((x, i) => [x.key, i]));
  for (const p of state.projects) {
    for (const st of p.steps) {
      if (!st.done || !st.doneAt) continue;
      const i = idx.get(dayStr(new Date(st.doneAt)));
      if (i !== undefined) out[i][p.side]++;
    }
  }
  return out;
}

/* Jours restants avant la date « à rendre » (négatif : en retard) */
function daysLeft(iso) {
  if (!iso) return null;
  const a = new Date(iso + 'T00:00'); const b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 864e5);
}


/* ---------- Fiche technique ---------- */
const fieldsOn = (side) => state.sides[side].fields.filter((x) => x.on);
/* Les valeurs déjà utilisées pour ce champ, les plus récentes d'abord */
function fieldValues(side, fid, max = 6) {
  const seen = new Set(); const out = [];
  state.projects.filter((p) => p.side === side).sort((a, b) => (b.u || 0) - (a.u || 0)).forEach((p) => {
    const v = (p.spec || {})[fid]; if (!v) return;
    const k = fold(v); if (seen.has(k)) return; seen.add(k); out.push(v);
  });
  return out.slice(0, max);
}

/* ---------- Journal d'un livre ----------
   Ce qui s'est passé, daté : les étapes cochées (automatique), le début,
   la fin, et ce qu'Inès y ajoute (une note, une photo). */
function journalOf(p) {
  const out = [];
  if (p.created) out.push({ at: p.created, kind: 'start', text: 'Livre commencé' });
  p.steps.forEach((s) => { if (s.done && s.doneAt) out.push({ at: s.doneAt, kind: 'step', text: s.name }); });
  (p.log || []).forEach((x) => out.push(Object.assign({ kind: 'note' }, x)));
  if (p.archived && p.archivedAt) out.push({ at: p.archivedAt, kind: 'end', text: 'Terminé et rangé' });
  return out.sort((a, b) => b.at - a.at);
}
