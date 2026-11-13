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

/* ---------- Couleurs proposées pour les espaces et les types ---------- */
const PALETTE = [
  ['Framboise', '#e0457b'], ['Corail', '#ec6550'], ['Abricot', '#ee8a2e'], ['Miel', '#cf9a10'],
  ['Sauge', '#679a5f'], ['Sapin', '#1f8460'], ['Lagon', '#1595aa'], ['Bleuet', '#4673e8'],
  ['Lavande', '#8564e8'], ['Prune', '#a1468b'], ['Rose poudré', '#d4789a'], ['Ardoise', '#55627b'],
];

/* ---------- Couvertures en dégradé ---------- */
const COVERS = {
  aube: 'linear-gradient(135deg,#ffc6d4,#ffe0ba)',
  peche: 'linear-gradient(135deg,#ffd2b3,#ffbccd)',
  soleil: 'linear-gradient(135deg,#ffe48f,#ffb27a)',
  menthe: 'linear-gradient(135deg,#c4f0d4,#d5ecff)',
  lagon: 'linear-gradient(135deg,#aee8de,#b6cbfb)',
  ciel: 'linear-gradient(160deg,#c3dcff,#ecdcff)',
  lavande: 'linear-gradient(135deg,#d9cbff,#ffcfe9)',
  pierre: 'linear-gradient(135deg,#d7d9e2,#efedf3)',
  braise: 'linear-gradient(135deg,#d6455d,#f4a15a)',
  foret: 'linear-gradient(135deg,#2c6b53,#8ac39e)',
  nuit: 'linear-gradient(135deg,#27254d,#7a4d98)',
  encre: 'linear-gradient(135deg,#1d2231,#46526d)',
};

const EMOJIS = ('📚 📖 📕 📗 📘 📙 📓 📔 📒 📜 🔖 ✂️ 🧵 🪡 🧶 🎀 🖌️ 🖋️ ✏️ 📐 📎 🏷️ 💌 📦 🎁 ' +
  '🌸 🌷 🌹 🌻 🌼 🍀 🌿 🍂 🍁 🌙 ⭐ ✨ 🌈 ☀️ 🔥 💧 ❄️ 🌊 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💕 ' +
  '🦋 🐉 🐺 🦊 🐈‍⬛ 🦢 🕯️ 🗝️ 🗡️ 🛡️ 👑 💎 🍷 ☕ 🍓 🍒 🎭 🎻 🪐 🏰 ⚔️ 🌑 🪞 🫖 🧸').split(' ');
const BOOK_EMOJIS = ['📕', '📗', '📘', '📙', '📓', '📔', '📒'];

/* ---------- Modèles par défaut (tout est modifiable dans Réglages) ---------- */
const DEFAULT_SIDES = {
  perso: {
    name: 'Bibliothèque perso', emoji: '📚', color: '#e0457b',
    steps: ['Typeset', 'Impression', 'Couture', 'Colle', 'Maquette', 'Découpe carton',
      'Découpe Cricut', 'Impression couverture', 'Vinyle', 'Assemblage final'],
    deliverables: ['Dossier du projet', 'Fichiers typeset + maquette rangés', 'Photos du bind'],
    types: [['Fanfic', '#8564e8'], ['Bind exchange', '#ee8a2e']],
  },
  pro: {
    name: 'Activité pro', emoji: '✂️', color: '#1f8460',
    steps: ['Création maquette', 'Envoi maquette', 'Validation maquette', 'Règlement acompte',
      'Commande matériel (si besoin)', 'Découpe carton', 'Impression couv + découpe Cricut',
      'Vinyle', 'Impression page de garde', 'Assemblage du livre', 'Photo du livre',
      'Envoi + validation photo', 'Règlement final', 'Envoi commande'],
    deliverables: ['Dossier du projet', 'Maquette finale (PDF)', 'Fichier de découpe Cricut', 'Photos du livre'],
    types: [['Couverture', '#4673e8'], ['Rebind', '#8564e8']],
  },
};
const DEFAULT_PREFS = { theme: 'auto', bg: 'doux', density: 'aeree', progress: 'perles', numbers: false, tables: true };
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
    icon: o.icon || defaultIcon(id), cover: o.cover || null,
    kind: o.kind || '', client: o.client || '', contact: o.contact || '', notes: '',
    steps: [
      ...sd.steps.filter((t) => !skip.has(t.id) && !skip.has(t.name)).map((t) => ({ id: uid(), tpl: t.id, name: t.name, done: false })),
      ...(o.extra || []).map((n) => ({ id: uid(), name: n, done: false, custom: true })),
    ],
    deliverables: sd.deliverables.map((d) => ({ id: uid(), name: d.name, done: false })),
    start: o.start ?? todayStr(), end: '', endAuto: false,
    archived: false, archivedAt: null, created: now(), u: now(),
  };
}

/* Exemples tirés des photos (proposés au premier lancement) */
function seedState() {
  const s = freshState();
  s.seed = true;
  const mk = (side, title, done, o) => {
    const p = buildProject(s, side, title, { start: '', ...o });
    p.steps.forEach((st, i) => { st.done = i < done; });
    s.projects.push(p);
    return p;
  };
  const jl = mk('perso', 'Just Lovers', 3, { kind: 'Fanfic', icon: '💕', cover: { t: 'grad', v: 'lavande' } });
  mk('perso', 'Green Light', 0, { icon: '🌿', cover: { t: 'grad', v: 'menthe' }, skip: ['Découpe Cricut'] });
  const ce = mk('pro', 'Le Chevalier Errant', 5, { kind: 'Rebind', icon: '⚔️', cover: { t: 'grad', v: 'nuit' } });
  mk('pro', 'Eragon', 5, { kind: 'Rebind', icon: '🐉', cover: { t: 'grad', v: 'braise' } });
  mk('pro', 'Les Liaisons dangereuses', 5, { kind: 'Rebind', icon: '🌹', cover: { t: 'grad', v: 'peche' } });
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
  for (const k of ['numbers', 'tables']) if (typeof pr[k] === 'boolean') out.prefs[k] = pr[k];
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
    color: isHex(sd.color) ? sd.color.toLowerCase() : d.color,
    steps: list(sd.steps, d.steps),
    deliverables: list(sd.deliverables, d.deliverables),
    types: list(sd.types, d.types, (x) => ({ color: isHex(x.color) ? x.color.toLowerCase() : '#8564e8' })),
  };
}

function normCover(c) {
  if (c && c.t === 'grad' && COVERS[c.v]) return { t: 'grad', v: c.v };
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
  return {
    id: String(p.id), side: p.side, title: String(p.title || '').trim() || 'Sans titre',
    icon: String(p.icon || '').trim() || defaultIcon(String(p.id)),
    cover: normCover(p.cover),
    kind: str(p.kind), client: str(p.client), contact: str(p.contact), notes: str(p.notes),
    steps, deliverables,
    start: str(p.start), end: str(p.end), endAuto: !!p.endAuto,
    archived: !!p.archived, archivedAt: +p.archivedAt || null,
    created: +p.created || +p.u || 0, u: +p.u || 0,
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
