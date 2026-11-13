'use strict';
/* =====================================================================
   ATELIER — le hub d'Inès
   Deux côtés séparés (bibliothèque perso / activité pro), une to-do du
   jour au milieu, des tableaux croisés façon carnet en dessous.
   Tout est enregistré dans le navigateur, et en option dans un dépôt
   GitHub privé (synchro entre ordi et téléphone).
   ===================================================================== */

/* ---------- Modèles par défaut (modifiables dans Réglages) ---------- */
const DEFAULT_SIDES = {
  perso: {
    steps: ['Typeset', 'Impression', 'Couture', 'Colle', 'Maquette', 'Découpe carton',
            'Découpe Cricut', 'Impression couverture', 'Vinyle', 'Assemblage final'],
    deliverables: ['Dossier du projet', 'Fichiers typeset + maquette rangés', 'Photos du bind'],
  },
  pro: {
    steps: ['Création maquette', 'Envoi maquette', 'Validation maquette', 'Règlement acompte',
            'Commande matériel (si besoin)', 'Découpe carton', 'Impression couv + découpe Cricut',
            'Vinyle', 'Impression page de garde', 'Assemblage du livre', 'Photo du livre',
            'Envoi + validation photo', 'Règlement final', 'Envoi commande'],
    deliverables: ['Dossier du projet', 'Maquette finale (PDF)', 'Fichier de découpe Cricut', 'Photos du livre'],
  },
};
const SIDES = ['perso', 'pro'];
const SIDE_LABEL = { perso: 'Bibliothèque perso', pro: 'Activité pro' };
const KINDS = ['Couverture', 'Rebind'];

const LS_KEY = 'atelier.data.v1';
const LS_SYNC = 'atelier.sync.v1';
const LS_UI = 'atelier.ui.v1';

/* ---------- Petits outils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const now = () => Date.now();
const clone = (o) => JSON.parse(JSON.stringify(o));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const shortDate = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '');
const longToday = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/* =====================================================================
   DONNÉES
   ===================================================================== */
let state;
const ui = { modal: null, expanded: null, tab: 'today' };

function freshState() {
  const s = {
    v: 1, seed: false, user: 'Inès', userU: 0,
    sides: {}, sidesU: 0,
    projects: [], orderU: 0, deleted: {},
    today: { date: todayStr(), items: [], u: 0 },
  };
  for (const side of SIDES) {
    s.sides[side] = {
      steps: DEFAULT_SIDES[side].steps.map((name) => ({ id: uid(), name })),
      deliverables: DEFAULT_SIDES[side].deliverables.map((name) => ({ id: uid(), name })),
    };
  }
  return s;
}

function buildProject(s, side, title, opts = {}) {
  const skip = new Set(opts.skip || []);
  const steps = s.sides[side].steps
    .filter((t) => !skip.has(t.id) && !skip.has(t.name))
    .map((t) => ({ id: uid(), tpl: t.id, name: t.name, done: false }));
  (opts.extra || []).forEach((name) => steps.push({ id: uid(), name, done: false, custom: true }));
  return {
    id: uid(), side, title: title.trim() || 'Sans titre',
    kind: opts.kind || '', client: opts.client || '', contact: opts.contact || '', notes: '',
    steps, deliverables: null,
    start: opts.start ?? todayStr(), end: '', endAuto: false,
    archived: false, archivedAt: null, u: now(),
  };
}

/* Exemple de départ, tiré des photos (effaçable dans Réglages) */
function seedState() {
  const s = freshState();
  s.seed = true;
  const mk = (side, title, doneCount, opts = {}) => {
    const p = buildProject(s, side, title, { start: '', ...opts });
    p.steps.forEach((st, i) => { st.done = i < doneCount; });
    s.projects.push(p);
    return p;
  };
  const jl = mk('perso', 'Just Lovers', 3);
  mk('perso', 'Green Light', 0, { skip: ['Découpe Cricut'] });
  const ce = mk('pro', 'Le Chevalier Errant', 5, { kind: 'Rebind' });
  mk('pro', 'Eragon', 5, { kind: 'Rebind' });
  mk('pro', 'Les Liaisons dangereuses', 5, { kind: 'Rebind' });
  s.today.items = [
    { id: uid(), projectId: jl.id, stepId: jl.steps[3].id },
    { id: uid(), projectId: ce.id, stepId: ce.steps[5].id },
  ];
  return s;
}

/* Remet d'aplomb des données venues d'ailleurs (import, synchro, ancienne version) */
function normalize(s) {
  if (!s || typeof s !== 'object') s = freshState();
  const base = freshState();
  s.v = 1;
  s.user = typeof s.user === 'string' ? s.user : 'Inès';
  s.userU = s.userU || 0;
  s.sides = s.sides || {};
  for (const side of SIDES) {
    const sd = s.sides[side] || base.sides[side];
    sd.steps = Array.isArray(sd.steps) ? sd.steps.filter((x) => x && x.name).map((x) => ({ id: x.id || uid(), name: String(x.name) })) : base.sides[side].steps;
    sd.deliverables = Array.isArray(sd.deliverables) ? sd.deliverables.filter((x) => x && x.name).map((x) => ({ id: x.id || uid(), name: String(x.name) })) : base.sides[side].deliverables;
    s.sides[side] = sd;
  }
  s.sidesU = s.sidesU || 0;
  s.orderU = s.orderU || 0;
  s.deleted = s.deleted && typeof s.deleted === 'object' ? s.deleted : {};
  s.projects = (Array.isArray(s.projects) ? s.projects : []).filter((p) => p && p.id && SIDES.includes(p.side)).map((p) => ({
    id: p.id, side: p.side, title: String(p.title || 'Sans titre'),
    kind: KINDS.includes(p.kind) ? p.kind : '', client: p.client || '', contact: p.contact || '', notes: p.notes || '',
    steps: (Array.isArray(p.steps) ? p.steps : []).filter((x) => x && x.name).map((x) => ({
      id: x.id || uid(), name: String(x.name), done: !!x.done, ...(x.tpl ? { tpl: x.tpl } : {}), ...(x.custom ? { custom: true } : {}),
    })),
    deliverables: Array.isArray(p.deliverables) ? p.deliverables.filter((x) => x && x.name).map((x) => ({ id: x.id || uid(), name: String(x.name), done: !!x.done })) : null,
    start: p.start || '', end: p.end || '', endAuto: !!p.endAuto,
    archived: !!p.archived, archivedAt: p.archivedAt || null, u: p.u || 0,
  }));
  s.today = s.today && typeof s.today === 'object' ? s.today : base.today;
  s.today.date = s.today.date || todayStr();
  s.today.items = (Array.isArray(s.today.items) ? s.today.items : []).filter((it) => it && it.projectId && it.stepId).map((it) => ({ id: it.id || uid(), projectId: it.projectId, stepId: it.stepId, ...(it.carried ? { carried: true } : {}) }));
  s.today.u = s.today.u || 0;
  s.seed = !!s.seed;
  return s;
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn('Lecture impossible, on repart sur un exemple', e); }
  return seedState();
}

function saveLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { toast('Impossible d’enregistrer sur cet appareil (stockage plein ?)'); }
}

/* Toute modification passe par ici */
function commit(fn, { modal = true } = {}) {
  fn(state);
  state.seed = false;
  saveLocal();
  Sync.schedule();
  renderTop();
  renderMain();
  renderTabbar();
  if (modal) renderModal();
}

/* Remplace tout l'état (synchro, import) */
function replaceState(next) {
  state = normalize(next);
  rollDay(true);
  saveLocal();
  renderAll();
}

/* ---------- Accès & calculs ---------- */
const P = (id) => state.projects.find((p) => p.id === id);
const activeProjects = (side) => state.projects.filter((p) => p.side === side && !p.archived);
const archivedProjects = () => state.projects.filter((p) => p.archived).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
const touch = (p) => { p.u = now(); };
const touchToday = () => { state.today.u = now(); };

function progress(p) {
  const total = p.steps.length;
  const done = p.steps.filter((s) => s.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
function phase(p) {
  if (p.archived) return 'archived';
  const { done, total } = progress(p);
  if (total > 0 && done === total) {
    if (p.deliverables && p.deliverables.length && !p.deliverables.every((d) => d.done)) return 'livrables';
    return 'fini';
  }
  return 'encours';
}
const nextStep = (p) => p.steps.find((s) => !s.done);
const inToday = (pid, sid) => state.today.items.some((it) => it.projectId === pid && it.stepId === sid);

/* Nouveau jour : on garde ce qui n'est pas fait, on enlève le reste */
function rollDay(silent) {
  if (state.today.date === todayStr()) return false;
  state.today.items = state.today.items.filter((it) => {
    const p = P(it.projectId); if (!p || p.archived) return false;
    const st = p.steps.find((s) => s.id === it.stepId);
    return st && !st.done;
  }).map((it) => ({ ...it, carried: true }));
  state.today.date = todayStr();
  touchToday();
  if (!silent) { saveLocal(); Sync.schedule(); }
  return true;
}

/* Nettoie la to-do des étapes / projets disparus */
function todayItems() {
  return state.today.items.map((it) => {
    const p = P(it.projectId); if (!p || p.archived) return null;
    const st = p.steps.find((s) => s.id === it.stepId); if (!st) return null;
    return { it, p, st };
  }).filter(Boolean);
}

/* Après chaque coche/décoche d'étape */
function afterStepChange(p) {
  const { done, total } = progress(p);
  if (total > 0 && done === total) {
    if (!p.end) { p.end = todayStr(); p.endAuto = true; }
    if (!p.deliverables) p.deliverables = state.sides[p.side].deliverables.map((d) => ({ id: uid(), name: d.name, done: false }));
    if (!p.deliverables.length || p.deliverables.every((d) => d.done)) return 'archive';
    return 'livrables';
  }
  if (p.endAuto) { p.end = ''; p.endAuto = false; }
  return null;
}

function setStepDone(pid, sid, value) {
  const p = P(pid); if (!p) return;
  const st = p.steps.find((s) => s.id === sid); if (!st) return;
  const before = phase(p);
  const snap = clone(state);
  let outcome = null;
  commit(() => {
    st.done = value === undefined ? !st.done : value;
    touch(p);
    outcome = afterStepChange(p);
    if (outcome === 'archive') archiveProject(p);
  }, { modal: false });
  if (outcome === 'livrables' && before !== 'livrables') {
    ui.modal = { type: 'livrables', id: p.id };
  }
  if (outcome === 'archive' && ui.modal?.id === p.id) ui.modal = null;
  renderModal();
  if (outcome === 'archive') toast(`« ${p.title} » est terminé et archivé`, { action: 'Annuler', onAction: () => restoreSnapshot(snap) });
}

function archiveProject(p) {
  p.archived = true; p.archivedAt = now(); touch(p);
  const n = state.today.items.length;
  state.today.items = state.today.items.filter((it) => it.projectId !== p.id);
  if (state.today.items.length !== n) touchToday();
}

function restoreSnapshot(snap) {
  const t = now();
  snap.projects.forEach((p) => { p.u = t; delete snap.deleted[p.id]; });
  snap.today.u = t; snap.sidesU = t; snap.orderU = t;
  // garde les suppressions faites ailleurs entre-temps
  for (const [id, ts] of Object.entries(state.deleted)) if (!snap.projects.some((p) => p.id === id)) snap.deleted[id] = ts;
  state = normalize(snap);
  state.seed = false;
  saveLocal(); Sync.schedule(); renderAll();
}

function undoable(label, fn, opts) {
  const snap = clone(state);
  commit(fn, opts);
  toast(label, { action: 'Annuler', onAction: () => restoreSnapshot(snap) });
}

/* =====================================================================
   RENDU
   ===================================================================== */
function renderAll() { renderTop(); renderMain(); renderTabbar(); renderModal(); }

function renderTop() {
  const nArch = archivedProjects().length;
  $('#top').innerHTML = `
    <div class="brand">
      <span class="logo" aria-hidden="true"><i></i><i></i></span>
      <div>
        <h1>Bonjour ${esc(state.user || '')}</h1>
        <p class="date">${esc(longToday())}</p>
      </div>
    </div>
    <div class="top-actions">
      ${syncPill()}
      <button class="btn ghost" data-action="open-archives">Archives${nArch ? ` <span class="count">${nArch}</span>` : ''}</button>
      <button class="btn ghost" data-action="open-settings">Réglages</button>
    </div>`;
}

function syncPill() {
  const map = {
    off: ['local', 'Sur cet appareil', 'Pas encore en ligne : branche la synchro dans Réglages'],
    pending: ['wait', 'Modifié…', 'Envoi en ligne dans un instant'],
    saving: ['wait', 'Envoi…', 'Envoi en cours'],
    ok: ['ok', 'En ligne', 'Tout est enregistré en ligne'],
    offline: ['warn', 'Hors ligne', 'Pas de connexion : enregistré sur l’appareil, envoi au retour du réseau'],
    error: ['err', 'Synchro en panne', Sync.msg || 'Erreur de synchro'],
  };
  const [cls, label, title] = map[Sync.status] || map.off;
  return `<button class="sync-pill ${cls}" data-action="open-settings" title="${esc(title)}"><i></i>${label}</button>`;
}
function renderSyncPill() { const el = $('.sync-pill'); if (el) el.outerHTML = syncPill(); }

function renderTabbar() {
  const n = todayItems().filter((x) => !x.st.done).length;
  const tabs = [['today', 'Aujourd’hui', n || ''], ['perso', 'Perso', activeProjects('perso').length], ['pro', 'Pro', activeProjects('pro').length], ['tables', 'Tableaux', '']];
  $('#tabbar').innerHTML = tabs.map(([k, label, c]) => `<button class="tab tab-${k} ${ui.tab === k ? 'on' : ''}" data-action="tab" data-tab="${k}">${label}${c !== '' ? `<small>${c}</small>` : ''}</button>`).join('');
  document.body.dataset.tab = ui.tab;
}

function renderMain() {
  document.body.dataset.expanded = ui.expanded || '';
  $('#main').innerHTML = `
    <div class="board">
      ${sideHTML('perso')}
      ${todayHTML()}
      ${sideHTML('pro')}
    </div>
    <div class="tables">
      ${tableHTML('perso')}
      ${tableHTML('pro')}
    </div>`;
}

/* ---------- Colonnes perso / pro ---------- */
function sideHTML(side) {
  const list = activeProjects(side);
  const expanded = ui.expanded === side;
  return `
  <section class="side side-${side}" data-side="${side}">
    <header class="side-head">
      <h2>${SIDE_LABEL[side]} <span class="n">${list.length}</span></h2>
      <div class="side-tools">
        <button class="icon-btn" data-action="expand" data-side="${side}" title="${expanded ? 'Revenir à la vue complète' : 'Plein écran'}">${expanded ? '⤡' : '⤢'}</button>
        <button class="plus" data-action="new-project" data-side="${side}" title="Nouveau projet">+</button>
      </div>
    </header>
    ${list.length ? `<ul class="cards" data-sort="side-${side}">${list.map(cardHTML).join('')}</ul>`
      : `<button class="empty" data-action="new-project" data-side="${side}">Rien en cours ici.<br><b>+ Ajouter un projet</b></button>`}
    ${list.length > 1 ? '<p class="hint">Glisse avec ⋮⋮ pour trier par urgence.</p>' : ''}
  </section>`;
}

function cardHTML(p) {
  const pr = progress(p);
  const ph = phase(p);
  const nx = nextStep(p);
  let foot = '';
  if (ph === 'livrables') {
    const d = p.deliverables.filter((x) => x.done).length;
    foot = `<button class="livr-btn" data-action="open-livrables" data-id="${p.id}">Livrables ${d}/${p.deliverables.length} à cocher →</button>`;
  } else if (nx) {
    const already = inToday(p.id, nx.id);
    foot = `<span class="next-label">Ensuite :</span> <b class="next-name">${esc(nx.name)}</b>
      ${already ? '<span class="in-today">✓ dans aujourd’hui</span>' : `<button class="to-today" data-action="today-add" data-p="${p.id}" data-s="${nx.id}">+ aujourd’hui</button>`}`;
  }
  const sub = [p.kind ? `<span class="kind kind-${p.kind.toLowerCase()}">${p.kind}</span>` : '', p.client ? `<span class="client">${esc(p.client)}</span>` : ''].join('');
  return `
  <li class="card ${ph === 'livrables' ? 'is-livrables' : ''}" data-id="${p.id}">
    <span class="handle" data-drag title="Glisser pour trier">⋮⋮</span>
    <div class="card-main" data-action="open-project" data-id="${p.id}">
      <div class="card-title">${esc(p.title)}</div>
      ${sub ? `<div class="card-sub">${sub}</div>` : ''}
      <div class="progress"><div class="bar"><i style="width:${pr.pct}%"></i></div><span>${pr.done}/${pr.total}</span></div>
    </div>
    <div class="card-foot">${foot}</div>
  </li>`;
}

/* ---------- To-do du jour ---------- */
function todayHTML() {
  const items = todayItems();
  const left = items.filter((x) => !x.st.done).length;
  return `
  <section class="today">
    <header class="today-head">
      <h2>Aujourd’hui</h2>
      <span class="today-count">${items.length ? `${items.length - left}/${items.length}` : ''}</span>
    </header>
    ${items.length ? `<ol class="todo" data-sort="today">${items.map(({ it, p, st }) => `
      <li class="todo-item side-${p.side} ${st.done ? 'done' : ''}" data-id="${it.id}">
        <span class="handle" data-drag title="Glisser pour réordonner">⋮⋮</span>
        <button class="check" data-action="today-toggle" data-p="${p.id}" data-s="${st.id}" aria-label="Cocher">${st.done ? '✓' : ''}</button>
        <div class="todo-txt">
          <b>${esc(st.name)}</b>
          <button class="todo-proj" data-action="open-project" data-id="${p.id}">${esc(p.title)}${it.carried && !st.done ? ' <em>· reporté</em>' : ''}</button>
        </div>
        <button class="x" data-action="today-remove" data-id="${it.id}" aria-label="Retirer de la liste">×</button>
      </li>`).join('')}</ol>`
      : `<p class="today-empty">Rien de prévu pour l’instant.<br>Choisis ce que tu fais aujourd’hui, étape par étape.</p>`}
    <button class="add-today" data-action="today-picker">+ Ajouter une étape</button>
    ${items.some((x) => x.st.done) ? '<button class="clear-done" data-action="today-clear-done">Retirer ce qui est fait</button>' : ''}
    ${overviewHTML()}
  </section>`;
}

/* Vue d'ensemble compacte (affichée seulement sur téléphone) */
function overviewHTML() {
  const all = SIDES.flatMap((side) => activeProjects(side));
  if (!all.length) return '';
  return `<div class="overview"><h3>Où j’en suis</h3>${all.map((p) => {
    const pr = progress(p); const ph = phase(p);
    return `<button class="ov-row side-${p.side} ${ph === 'livrables' ? 'is-livrables' : ''}" data-action="open-project" data-id="${p.id}">
      <i></i><b>${esc(p.title)}</b><span class="mini"><span style="width:${pr.pct}%"></span></span><small>${ph === 'livrables' ? '!' : pr.pct + '%'}</small>
    </button>`;
  }).join('')}</div>`;
}

/* ---------- Tableaux croisés (façon carnet) ---------- */
function tableHTML(side) {
  const list = activeProjects(side);
  const cols = state.sides[side].steps;
  const isPro = side === 'pro';
  const head = `<tr>
      <th class="t-title">Titre</th>
      ${isPro ? '<th class="rot t-kind"><span>Couv. / Rebind</span></th>' : ''}
      ${cols.map((c) => `<th class="rot"><span>${esc(c.name)}</span></th>`).join('')}
      <th class="rot t-other"><span>Autre</span></th>
      <th class="rot t-date"><span>Début</span></th>
      <th class="rot t-date"><span>Fin</span></th>
    </tr>`;
  const rows = list.map((p) => {
    const ph = phase(p);
    const tplIds = new Set(cols.map((c) => c.id));
    const others = p.steps.filter((s) => !s.tpl || !tplIds.has(s.tpl));
    const oDone = others.filter((s) => s.done).length;
    return `<tr class="${ph === 'livrables' ? 'is-livrables' : ''}">
      <th class="t-title"><button data-action="open-project" data-id="${p.id}">${ph === 'livrables' ? '<span class="bang">!</span>' : ''}${esc(p.title)}</button></th>
      ${isPro ? `<td class="kind-cell ${p.kind ? 'kind-' + p.kind.toLowerCase() : ''}" title="${esc(p.kind || 'Type non précisé')}"></td>` : ''}
      ${cols.map((c) => {
        const st = p.steps.find((s) => s.tpl === c.id);
        if (!st) return '<td class="cell na" title="Pas concerné"></td>';
        return `<td class="cell ${st.done ? 'done' : ''}" data-action="cell-toggle" data-p="${p.id}" data-s="${st.id}" title="${esc(c.name)}"></td>`;
      }).join('')}
      <td class="cell other" data-action="open-project" data-id="${p.id}" title="${esc(others.map((s) => s.name).join(', ') || 'Aucune autre étape')}">${others.length ? `${oDone}/${others.length}` : ''}</td>
      <td class="date">${shortDate(p.start)}</td>
      <td class="date">${shortDate(p.end)}</td>
    </tr>`;
  }).join('');
  return `
  <section class="xtable-wrap side-${side}">
    <h3>Tableau — ${SIDE_LABEL[side]}</h3>
    ${list.length ? `<div class="scroll"><table class="xtable">${head}${rows}</table></div>
    <p class="hint">Touche une case pour la cocher. Les cases hachurées = étape pas concernée.</p>`
      : '<p class="hint">Aucun projet en cours.</p>'}
  </section>`;
}

/* =====================================================================
   FENÊTRES (modales)
   ===================================================================== */
function openModal(m) { ui.modal = m; renderModal(); }
function closeModal() { ui.modal = null; renderModal(); }

function renderModal() {
  const root = $('#modal-root');
  const m = ui.modal;
  if (!m) { root.innerHTML = ''; root.dataset.key = ''; document.body.classList.remove('modal-open'); return; }
  let html = '';
  if (m.type === 'project') html = projectModal(m);
  else if (m.type === 'new') html = newModal(m);
  else if (m.type === 'livrables') html = livrablesModal(m);
  else if (m.type === 'picker') html = pickerModal();
  else if (m.type === 'archives') html = archivesModal();
  else if (m.type === 'settings') html = settingsModal(m);
  if (!html) { ui.modal = null; root.innerHTML = ''; root.dataset.key = ''; document.body.classList.remove('modal-open'); return; }
  const key = m.type + (m.id || m.side || '');
  const sideCls = m.side ? `side-${m.side}` : (m.id && P(m.id) ? `side-${P(m.id).side}` : '');
  const cls = `sheet sheet-${m.type} ${sideCls}`;
  const existing = $('.sheet', root);
  if (existing && root.dataset.key === key) {
    // même fenêtre : on remplace juste le contenu (pas d'animation, on garde le défilement)
    const scroll = $('.sheet-body', root)?.scrollTop || 0;
    existing.className = cls;
    existing.innerHTML = html;
    const b = $('.sheet-body', root); if (b) b.scrollTop = scroll;
  } else {
    root.innerHTML = `<div class="overlay" data-action="overlay"><div class="${cls}" role="dialog" aria-modal="true">${html}</div></div>`;
    root.dataset.key = key;
    const af = $('[data-autofocus]', root); if (af) setTimeout(() => af.focus(), 30);
  }
  document.body.classList.add('modal-open');
}

const sheetHead = (title, extra = '') => `<header class="sheet-head"><h2>${title}</h2>${extra}<button class="close" data-action="close" aria-label="Fermer">×</button></header>`;

/* ---------- Nouveau projet ---------- */
function newModal(m) {
  const side = m.side;
  const tpl = state.sides[side].steps;
  m.skip = m.skip || [];
  m.extra = m.extra || [];
  m.draft = m.draft || { title: '', kind: '', client: '', contact: '' };
  return `
  ${sheetHead(`Nouveau projet <small>${SIDE_LABEL[side]}</small>`)}
  <div class="sheet-body">
    <label class="field big"><span>Titre</span><input type="text" data-draft="title" value="${esc(m.draft.title)}" placeholder="${side === 'perso' ? 'Ex. Just Lovers' : 'Ex. Le Chevalier Errant'}" data-autofocus autocomplete="off"></label>
    ${side === 'pro' ? `
      <div class="field"><span>Type</span><div class="seg">${KINDS.map((k) => `<button class="${m.draft.kind === k ? 'on' : ''} kind-${k.toLowerCase()}" data-action="draft-kind" data-kind="${k}">${k}</button>`).join('')}</div></div>
      <div class="row2">
        <label class="field"><span>Cliente</span><input type="text" data-draft="client" value="${esc(m.draft.client)}" placeholder="Nom"></label>
        <label class="field"><span>Contact</span><input type="text" data-draft="contact" value="${esc(m.draft.contact)}" placeholder="Insta, mail, tél…"></label>
      </div>` : ''}
    <div class="field">
      <span>Les étapes — <b>touche celles dont tu n’auras pas besoin</b> pour celui-ci</span>
      <div class="chips">
        ${tpl.map((t) => `<button class="chip ${m.skip.includes(t.id) ? 'off' : 'on'}" data-action="toggle-skip" data-id="${t.id}">${esc(t.name)}</button>`).join('')}
        ${m.extra.map((name, i) => `<span class="chip on extra">${esc(name)}<button data-action="remove-extra" data-i="${i}" aria-label="Retirer">×</button></span>`).join('')}
      </div>
      <div class="add-line">
        <input type="text" id="extra-input" placeholder="Autre étape (ex. Envoi du colis)" data-enter="add-extra" autocomplete="off">
        <button class="btn" data-action="add-extra">+ Ajouter</button>
      </div>
    </div>
  </div>
  <footer class="sheet-foot">
    <span class="muted">${tpl.length - m.skip.length + m.extra.length} étapes</span>
    <button class="btn primary" data-action="create-project">Créer le projet</button>
  </footer>`;
}

/* ---------- Fiche projet ---------- */
function projectModal(m) {
  const p = P(m.id); if (!p) return '';
  const pr = progress(p);
  const ph = phase(p);
  const steps = p.steps.map((st) => `
    <li class="step ${st.done ? 'done' : ''}" data-id="${st.id}">
      ${p.archived ? '' : '<span class="handle" data-drag>⋮⋮</span>'}
      <button class="check" data-action="step-toggle" data-p="${p.id}" data-s="${st.id}" ${p.archived ? 'disabled' : ''}>${st.done ? '✓' : ''}</button>
      <span class="step-name">${esc(st.name)}${st.custom || !st.tpl ? ' <em>autre</em>' : ''}</span>
      ${p.archived || st.done ? '' : (inToday(p.id, st.id) ? '<span class="in-today">✓ aujourd’hui</span>' : `<button class="to-today" data-action="today-add" data-p="${p.id}" data-s="${st.id}">+ aujourd’hui</button>`)}
      ${p.archived ? '' : `<button class="x" data-action="step-remove" data-p="${p.id}" data-s="${st.id}" title="Retirer cette étape">×</button>`}
    </li>`).join('');
  return `
  ${sheetHead(`<input class="title-input" type="text" data-pfield="title" value="${esc(p.title)}" aria-label="Titre">`, `<span class="side-chip">${SIDE_LABEL[p.side]}</span>`)}
  <div class="sheet-body">
    ${p.archived ? `<p class="banner">Projet archivé ${p.archivedAt ? 'le ' + new Date(p.archivedAt).toLocaleDateString('fr-FR') : ''}. <button class="btn small" data-action="unarchive" data-id="${p.id}">Le remettre en cours</button></p>` : ''}
    <div class="progress big"><div class="bar"><i style="width:${pr.pct}%"></i></div><span>${pr.done}/${pr.total} étapes</span></div>
    ${p.side === 'pro' ? `
      <div class="field"><span>Type</span><div class="seg">${KINDS.map((k) => `<button class="${p.kind === k ? 'on' : ''} kind-${k.toLowerCase()}" data-action="set-kind" data-id="${p.id}" data-kind="${k}">${k}</button>`).join('')}</div></div>
      <div class="row2">
        <label class="field"><span>Cliente</span><input type="text" data-pfield="client" value="${esc(p.client)}" placeholder="Nom"></label>
        <label class="field"><span>Contact</span><input type="text" data-pfield="contact" value="${esc(p.contact)}" placeholder="Insta, mail, tél…"></label>
      </div>` : ''}
    <div class="row2">
      <label class="field"><span>Début</span><input type="date" data-pfield="start" value="${esc(p.start)}"></label>
      <label class="field"><span>Fin</span><input type="date" data-pfield="end" value="${esc(p.end)}"></label>
    </div>
    <div class="field">
      <span>Étapes</span>
      <ul class="steps" data-sort="steps">${steps}</ul>
      ${p.archived ? '' : `<div class="add-line">
        <input type="text" id="step-input" placeholder="Autre étape (ex. Envoi du colis)" data-enter="add-step" autocomplete="off">
        <button class="btn" data-action="add-step" data-id="${p.id}">+ Ajouter</button>
      </div>`}
    </div>
    ${p.deliverables ? livrablesBlock(p) : `<p class="muted small">Livrables : la liste s’affichera quand toutes les étapes seront cochées.</p>`}
    <label class="field"><span>Notes</span><textarea data-pfield="notes" rows="3" placeholder="Papier, couleurs, références, idées…">${esc(p.notes)}</textarea></label>
  </div>
  <footer class="sheet-foot">
    <button class="btn danger-ghost" data-action="delete-project" data-id="${p.id}">Supprimer</button>
    ${p.archived ? '' : `<button class="btn ghost" data-action="archive-now" data-id="${p.id}">Archiver</button>`}
    <button class="btn primary" data-action="close">${ph === 'livrables' ? 'Fermer (livrables en attente)' : 'OK'}</button>
  </footer>`;
}

function livrablesBlock(p) {
  const d = p.deliverables;
  const done = d.filter((x) => x.done).length;
  const ok = d.length && done === d.length;
  return `
  <div class="livrables ${ok ? 'ok' : ''}">
    <div class="livr-head"><b>Livrables</b><span>${done}/${d.length}</span></div>
    ${p.side === 'pro' && (p.client || p.contact) ? `<p class="client-line">${esc(p.client)}${p.client && p.contact ? ' — ' : ''}${esc(p.contact)}</p>` : ''}
    <ul class="livr-list">
      ${d.map((x) => `<li class="${x.done ? 'done' : ''}">
        <button class="check" data-action="livr-toggle" data-p="${p.id}" data-d="${x.id}" ${p.archived ? 'disabled' : ''}>${x.done ? '✓' : ''}</button>
        <span>${esc(x.name)}</span>
        ${p.archived ? '' : `<button class="x" data-action="livr-remove" data-p="${p.id}" data-d="${x.id}" title="Retirer">×</button>`}
      </li>`).join('')}
    </ul>
    ${p.archived ? '' : `<div class="add-line">
      <input type="text" id="livr-input" placeholder="Autre livrable" data-enter="add-livr" autocomplete="off">
      <button class="btn" data-action="add-livr" data-id="${p.id}">+ Ajouter</button>
    </div>`}
  </div>`;
}

/* ---------- Rappel livrables (dernière étape cochée) ---------- */
function livrablesModal(m) {
  const p = P(m.id); if (!p || !p.deliverables) return '';
  return `
  ${sheetHead('Dernière étape cochée ✓')}
  <div class="sheet-body">
    <p class="lead">Avant de ranger <b>« ${esc(p.title)} »</b>, fais ton dossier de livrables. Le projet reste en rouge tant que tout n’est pas coché, puis il part tout seul dans les archives.</p>
    ${livrablesBlock(p)}
  </div>
  <footer class="sheet-foot">
    <button class="btn ghost" data-action="open-project" data-id="${p.id}">Voir la fiche</button>
    <button class="btn primary" data-action="close">Je m’en occupe</button>
  </footer>`;
}

/* ---------- Choisir les étapes du jour ---------- */
function pickerModal() {
  const block = (side) => {
    const list = activeProjects(side).filter((p) => p.steps.some((s) => !s.done));
    if (!list.length) return `<p class="muted">Rien à faire côté ${side}.</p>`;
    return list.map((p) => {
      const todo = p.steps.filter((s) => !s.done);
      return `<div class="pick-proj">
        <div class="pick-title">${esc(p.title)}</div>
        <div class="chips">${todo.map((s, i) => {
          const already = inToday(p.id, s.id);
          return `<button class="chip ${already ? 'added' : ''} ${i === 0 ? 'first' : ''}" data-action="${already ? 'today-remove-step' : 'today-add'}" data-p="${p.id}" data-s="${s.id}">${already ? '✓ ' : ''}${esc(s.name)}</button>`;
        }).join('')}</div>
      </div>`;
    }).join('');
  };
  return `
  ${sheetHead('Ajouter à aujourd’hui')}
  <div class="sheet-body">
    <p class="muted">Touche les étapes que tu fais aujourd’hui. La première de chaque ligne est la prochaine dans l’ordre.</p>
    ${SIDES.map((side) => `<div class="pick-side side-${side}"><h3>${SIDE_LABEL[side]}</h3>${block(side)}</div>`).join('')}
  </div>
  <footer class="sheet-foot"><button class="btn primary" data-action="close">C’est bon</button></footer>`;
}

/* ---------- Archives ---------- */
function archivesModal() {
  const list = archivedProjects();
  const block = (side) => {
    const l = list.filter((p) => p.side === side);
    if (!l.length) return '<p class="muted">Rien d’archivé pour l’instant.</p>';
    return `<ul class="arch-list">${l.map((p) => `
      <li>
        <button class="arch-title" data-action="open-project" data-id="${p.id}">${esc(p.title)}</button>
        <span class="arch-meta">${[p.kind, p.client, p.start || p.end ? `${shortDate(p.start) || '?'} → ${shortDate(p.end) || '?'}` : ''].filter(Boolean).map(esc).join(' · ')}</span>
        <button class="btn small ghost" data-action="unarchive" data-id="${p.id}">Remettre en cours</button>
      </li>`).join('')}</ul>`;
  };
  return `
  ${sheetHead('Archives')}
  <div class="sheet-body">
    ${SIDES.map((side) => `<div class="arch-side side-${side}"><h3>${SIDE_LABEL[side]}</h3>${block(side)}</div>`).join('')}
  </div>
  <footer class="sheet-foot"><button class="btn primary" data-action="close">Fermer</button></footer>`;
}

/* ---------- Réglages ---------- */
function settingsModal(m) {
  const c = Sync.cfg || {};
  const tplList = (side, key, label) => `
    <div class="tpl">
      <h4>${label}</h4>
      <ul class="tpl-list" data-sort="tpl-${side}-${key}">
        ${state.sides[side][key].map((t) => `<li data-id="${t.id}">
          <span class="handle" data-drag>⋮⋮</span>
          <input type="text" value="${esc(t.name)}" data-tpl="${side}|${key}|${t.id}">
          <button class="x" data-action="tpl-remove" data-side="${side}" data-key="${key}" data-id="${t.id}" title="Supprimer">×</button>
        </li>`).join('')}
      </ul>
      <div class="add-line">
        <input type="text" id="tpl-${side}-${key}" placeholder="${key === 'steps' ? 'Nouvelle étape' : 'Nouveau livrable'}" data-enter="tpl-add" data-side="${side}" data-key="${key}" autocomplete="off">
        <button class="btn" data-action="tpl-add" data-side="${side}" data-key="${key}">+</button>
      </div>
    </div>`;
  return `
  ${sheetHead('Réglages')}
  <div class="sheet-body">
    <label class="field"><span>Prénom affiché</span><input type="text" data-setting="user" value="${esc(state.user)}"></label>

    <h3 class="set-h">Étapes & livrables par défaut</h3>
    <p class="muted small">Ce sont les listes proposées à chaque nouveau projet. Changer ici ne touche pas aux projets déjà en cours.</p>
    <div class="tpl-grid">
      ${SIDES.map((side) => `<div class="tpl-side side-${side}"><h3>${SIDE_LABEL[side]}</h3>${tplList(side, 'steps', 'Étapes')}${tplList(side, 'deliverables', 'Livrables')}</div>`).join('')}
    </div>

    <h3 class="set-h">Synchro en ligne (GitHub)</h3>
    <p class="muted small">Pour retrouver les mêmes données sur l’ordi et le téléphone. Les données vont dans un dépôt <b>privé</b>. À faire une fois par appareil.</p>
    <div class="row2">
      <label class="field"><span>Compte</span><input type="text" id="s-owner" value="${esc(c.owner || 'amelienito')}" autocomplete="off"></label>
      <label class="field"><span>Dépôt privé</span><input type="text" id="s-repo" value="${esc(c.repo || 'atelier-ines-data')}" autocomplete="off"></label>
    </div>
    <label class="field"><span>Jeton d’accès</span><input type="password" id="s-token" value="${esc(c.token || '')}" placeholder="github_pat_…" autocomplete="off"></label>
    <div class="sync-row">
      ${Sync.enabled() ? '<button class="btn ghost" data-action="sync-off">Déconnecter</button><button class="btn" data-action="sync-now">Synchroniser maintenant</button>' : '<button class="btn primary" data-action="sync-on">Connecter</button>'}
      <span class="sync-msg ${m.syncErr ? 'err' : ''}">${esc(m.syncMsg || (Sync.enabled() ? `Connecté à ${c.owner}/${c.repo}` : ''))}</span>
    </div>

    <h3 class="set-h">Sauvegarde</h3>
    <div class="sync-row">
      <button class="btn" data-action="export">Télécharger une sauvegarde</button>
      <label class="btn">Importer une sauvegarde<input type="file" accept="application/json,.json" id="import-file" hidden></label>
    </div>
    <div class="sync-row">
      <button class="btn danger-ghost" data-action="reset">Repartir de zéro (efface tous les projets)</button>
    </div>
  </div>
  <footer class="sheet-foot"><button class="btn primary" data-action="close">Fermer</button></footer>`;
}

/* =====================================================================
   ACTIONS
   ===================================================================== */
const actions = {
  tab(el) { ui.tab = el.dataset.tab; ui.expanded = null; renderTabbar(); renderMain(); window.scrollTo(0, 0); },
  expand(el) {
    ui.expanded = ui.expanded === el.dataset.side ? null : el.dataset.side;
    try { localStorage.setItem(LS_UI, JSON.stringify({ expanded: ui.expanded })); } catch (e) { /* rien */ }
    renderMain();
  },
  close() { closeModal(); },
  overlay(el, e) { if (e.target === el) closeModal(); },
  'open-project'(el) { openModal({ type: 'project', id: el.dataset.id }); },
  'open-livrables'(el) { openModal({ type: 'livrables', id: el.dataset.id }); },
  'open-archives'() { openModal({ type: 'archives' }); },
  'open-settings'() { openModal({ type: 'settings' }); },
  'today-picker'() { openModal({ type: 'picker' }); },

  /* création */
  'new-project'(el) { openModal({ type: 'new', side: el.dataset.side }); },
  'draft-kind'(el) { const m = ui.modal; m.draft.kind = m.draft.kind === el.dataset.kind ? '' : el.dataset.kind; renderModal(); },
  'toggle-skip'(el) {
    const m = ui.modal; const id = el.dataset.id;
    m.skip = m.skip.includes(id) ? m.skip.filter((x) => x !== id) : [...m.skip, id];
    renderModal();
  },
  'add-extra'() {
    const inp = $('#extra-input'); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    ui.modal.extra.push(v); renderModal(); setTimeout(() => $('#extra-input')?.focus(), 0);
  },
  'remove-extra'(el) { ui.modal.extra.splice(+el.dataset.i, 1); renderModal(); },
  'create-project'() {
    const m = ui.modal;
    if (!m.draft.title.trim()) { const t = $('[data-draft="title"]'); t.classList.add('shake'); t.focus(); setTimeout(() => t.classList.remove('shake'), 400); return; }
    const p = buildProject(state, m.side, m.draft.title, { skip: m.skip, extra: m.extra, kind: m.draft.kind, client: m.draft.client, contact: m.draft.contact });
    commit((s) => { s.projects.push(p); }, { modal: false });
    ui.modal = null; renderModal();
    toast(`« ${p.title} » ajouté`);
    requestAnimationFrame(() => { const c = $(`.card[data-id="${p.id}"]`); if (c) { c.classList.add('pop'); c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } });
  },

  /* étapes */
  'step-toggle'(el) { setStepDone(el.dataset.p, el.dataset.s); },
  'cell-toggle'(el) { setStepDone(el.dataset.p, el.dataset.s); },
  'today-toggle'(el) { setStepDone(el.dataset.p, el.dataset.s); },
  'step-remove'(el) {
    const p = P(el.dataset.p); const st = p?.steps.find((s) => s.id === el.dataset.s); if (!st) return;
    undoable(`Étape « ${st.name} » retirée`, () => {
      p.steps = p.steps.filter((s) => s.id !== st.id); touch(p);
      const n = state.today.items.length;
      state.today.items = state.today.items.filter((it) => it.stepId !== st.id);
      if (n !== state.today.items.length) touchToday();
      afterStepChange(p);
    });
  },
  'add-step'(el) {
    const inp = $('#step-input'); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    const p = P(el?.dataset?.id || ui.modal.id); if (!p) return;
    commit(() => { p.steps.push({ id: uid(), name: v, done: false, custom: true }); touch(p); afterStepChange(p); });
    setTimeout(() => $('#step-input')?.focus(), 0);
  },
  'set-kind'(el) { const p = P(el.dataset.id); commit(() => { p.kind = p.kind === el.dataset.kind ? '' : el.dataset.kind; touch(p); }); },

  /* livrables */
  'livr-toggle'(el) {
    const p = P(el.dataset.p); const d = p?.deliverables?.find((x) => x.id === el.dataset.d); if (!d) return;
    const snap = clone(state);
    let archived = false;
    commit(() => {
      d.done = !d.done; touch(p);
      if (phase(p) === 'fini' && p.steps.every((s) => s.done)) { archiveProject(p); archived = true; }
    }, { modal: false });
    if (archived) { ui.modal = null; toast(`« ${p.title} » est bouclé et archivé`, { action: 'Annuler', onAction: () => restoreSnapshot(snap) }); }
    renderModal();
  },
  'livr-remove'(el) {
    const p = P(el.dataset.p); if (!p?.deliverables) return;
    commit(() => { p.deliverables = p.deliverables.filter((x) => x.id !== el.dataset.d); touch(p); });
  },
  'add-livr'(el) {
    const inp = $('#livr-input'); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    const p = P(el?.dataset?.id || ui.modal.id); if (!p) return;
    commit(() => { (p.deliverables = p.deliverables || []).push({ id: uid(), name: v, done: false }); touch(p); });
    setTimeout(() => $('#livr-input')?.focus(), 0);
  },

  /* projets */
  'archive-now'(el) {
    const p = P(el.dataset.id); if (!p) return;
    ui.modal = null;
    undoable(`« ${p.title} » archivé`, () => archiveProject(p));
  },
  unarchive(el) {
    const p = P(el.dataset.id); if (!p) return;
    commit(() => { p.archived = false; p.archivedAt = null; touch(p); state.orderU = now(); });
    toast(`« ${p.title} » est de retour`);
  },
  'delete-project'(el) {
    const p = P(el.dataset.id); if (!p) return;
    if (!confirm(`Supprimer « ${p.title} » pour de bon ?\n(Pour le garder sans le voir, utilise plutôt « Archiver ».)`)) return;
    ui.modal = null;
    undoable(`« ${p.title} » supprimé`, () => {
      state.projects = state.projects.filter((x) => x.id !== p.id);
      state.deleted[p.id] = now();
      const n = state.today.items.length;
      state.today.items = state.today.items.filter((it) => it.projectId !== p.id);
      if (n !== state.today.items.length) touchToday();
    });
  },

  /* aujourd'hui */
  'today-add'(el) {
    const { p, s } = el.dataset; if (inToday(p, s)) return;
    commit(() => { state.today.items.push({ id: uid(), projectId: p, stepId: s }); touchToday(); });
    if (!ui.modal) toast('Ajouté à aujourd’hui');
  },
  'today-remove'(el) { commit(() => { state.today.items = state.today.items.filter((it) => it.id !== el.dataset.id); touchToday(); }); },
  'today-remove-step'(el) { commit(() => { state.today.items = state.today.items.filter((it) => !(it.projectId === el.dataset.p && it.stepId === el.dataset.s)); touchToday(); }); },
  'today-clear-done'() {
    commit(() => {
      const keep = new Set(todayItems().filter((x) => !x.st.done).map((x) => x.it.id));
      state.today.items = state.today.items.filter((it) => keep.has(it.id)); touchToday();
    });
  },

  /* réglages */
  'tpl-remove'(el) {
    const { side, key, id } = el.dataset;
    commit(() => { state.sides[side][key] = state.sides[side][key].filter((t) => t.id !== id); state.sidesU = now(); });
  },
  'tpl-add'(el) {
    const { side, key } = el.dataset; const inp = $(`#tpl-${side}-${key}`); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    commit(() => { state.sides[side][key].push({ id: uid(), name: v }); state.sidesU = now(); });
    setTimeout(() => $(`#tpl-${side}-${key}`)?.focus(), 0);
  },
  async 'sync-on'() {
    const cfg = { owner: $('#s-owner').value.trim(), repo: $('#s-repo').value.trim(), token: $('#s-token').value.trim(), branch: 'main', path: 'data.json' };
    if (!cfg.owner || !cfg.repo || !cfg.token) { ui.modal.syncMsg = 'Remplis les trois champs.'; ui.modal.syncErr = true; renderModal(); return; }
    ui.modal.syncMsg = 'Connexion…'; ui.modal.syncErr = false; renderModal();
    const err = await Sync.connect(cfg);
    if (ui.modal?.type === 'settings') { ui.modal.syncMsg = err || 'Connecté. Les données sont maintenant en ligne.'; ui.modal.syncErr = !!err; renderModal(); }
  },
  'sync-off'() {
    if (!confirm('Déconnecter cet appareil de la synchro ? (Les données restent sur l’appareil et en ligne.)')) return;
    Sync.disconnect(); ui.modal.syncMsg = 'Déconnecté.'; ui.modal.syncErr = false; renderModal();
  },
  async 'sync-now'() { ui.modal.syncMsg = 'Synchro…'; renderModal(); await Sync.refresh(true); await Sync.flush(); if (ui.modal?.type === 'settings') { ui.modal.syncMsg = Sync.status === 'ok' ? 'À jour.' : (Sync.msg || 'Problème de synchro.'); ui.modal.syncErr = Sync.status !== 'ok'; renderModal(); } },
  export() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `atelier-sauvegarde-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  reset() {
    if (!confirm('Effacer tous les projets (en cours et archivés) ? Les listes d’étapes et de livrables sont gardées.')) return;
    undoable('Tout est effacé', () => {
      const t = now();
      state.projects.forEach((p) => { state.deleted[p.id] = t; });
      state.projects = []; state.today.items = []; touchToday(); state.orderU = t;
    });
  },
};

/* ---------- Délégation des événements ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  if (el.dataset.action === 'overlay' && e.target !== el) return;
  e.preventDefault();
  fn(el, e);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.modal) { closeModal(); return; }
  if (e.key === 'Enter' && e.target.dataset?.enter) {
    e.preventDefault();
    actions[e.target.dataset.enter](e.target);
  }
});

/* Saisie : brouillon de création (pas de re-rendu pour ne pas perdre le focus) */
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.draft && ui.modal?.type === 'new') ui.modal.draft[t.dataset.draft] = t.value;
});

/* Saisie validée (quand on quitte le champ) */
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.pfield && ui.modal?.id) {
    const p = P(ui.modal.id); if (!p) return;
    const f = t.dataset.pfield;
    commit(() => {
      p[f] = f === 'title' ? (t.value.trim() || p.title) : t.value;
      if (f === 'end') p.endAuto = false;
      touch(p);
    }, { modal: false });
    if (f === 'title') t.value = p.title;
  } else if (t.dataset.tpl) {
    const [side, key, id] = t.dataset.tpl.split('|');
    const item = state.sides[side][key].find((x) => x.id === id); if (!item) return;
    const v = t.value.trim(); if (!v) { t.value = item.name; return; }
    commit(() => { item.name = v; state.sidesU = now(); }, { modal: false });
  } else if (t.dataset.setting === 'user') {
    commit(() => { state.user = t.value.trim(); state.userU = now(); }, { modal: false });
  } else if (t.id === 'import-file' && t.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = normalize(JSON.parse(reader.result));
        if (!confirm(`Remplacer les données actuelles par cette sauvegarde (${data.projects.length} projets) ?`)) return;
        const ts = now();
        data.projects.forEach((p) => { p.u = ts; });
        data.today.u = ts; data.sidesU = ts; data.orderU = ts; data.userU = ts; data.seed = false;
        state.projects.forEach((p) => { if (!data.projects.some((q) => q.id === p.id)) data.deleted[p.id] = ts; });
        replaceState(data); Sync.schedule();
        toast('Sauvegarde importée');
      } catch (err) { toast('Ce fichier ne ressemble pas à une sauvegarde de l’atelier.'); }
    };
    reader.readAsText(t.files[0]);
    t.value = '';
  }
});

/* =====================================================================
   GLISSER-DÉPOSER (souris + doigt)
   ===================================================================== */
let drag = null;
document.addEventListener('pointerdown', (e) => {
  const h = e.target.closest('[data-drag]');
  if (!h) return;
  const item = h.closest('li');
  const list = item?.parentElement;
  if (!list?.dataset.sort) return;
  e.preventDefault();
  drag = { item, list, id: e.pointerId };
  item.classList.add('dragging');
  document.body.classList.add('is-dragging');
});
document.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  e.preventDefault();
  const { item, list } = drag;
  const sibs = [...list.children].filter((c) => c !== item);
  let placed = false;
  for (const sib of sibs) {
    const r = sib.getBoundingClientRect();
    if (e.clientY < r.top + r.height / 2) { if (item.nextElementSibling !== sib) list.insertBefore(item, sib); placed = true; break; }
  }
  if (!placed && sibs.length && list.lastElementChild !== item) list.appendChild(item);
  // défilement auto près des bords
  const edge = 70;
  if (e.clientY < edge) window.scrollBy(0, -12); else if (e.clientY > window.innerHeight - edge) window.scrollBy(0, 12);
}, { passive: false });
const endDrag = (e) => {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  const { item, list } = drag;
  item.classList.remove('dragging');
  document.body.classList.remove('is-dragging');
  drag = null;
  const ids = [...list.children].map((c) => c.dataset.id);
  applyOrder(list.dataset.sort, ids);
};
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);

function applyOrder(kind, ids) {
  const sortBy = (arr, key = 'id') => ids.map((id) => arr.find((x) => x[key] === id)).filter(Boolean);
  if (kind.startsWith('side-')) {
    const side = kind.slice(5);
    const moved = sortBy(activeProjects(side));
    const same = moved.map((p) => p.id).join() === activeProjects(side).map((p) => p.id).join();
    if (same) return;
    commit(() => { state.projects = [...state.projects.filter((p) => p.side !== side || p.archived), ...moved]; state.orderU = now(); });
  } else if (kind === 'today') {
    const moved = sortBy(state.today.items);
    if (moved.map((x) => x.id).join() === state.today.items.map((x) => x.id).join()) return;
    const rest = state.today.items.filter((x) => !ids.includes(x.id));
    commit(() => { state.today.items = [...moved, ...rest]; touchToday(); });
  } else if (kind === 'steps') {
    const p = P(ui.modal?.id); if (!p) return;
    const moved = sortBy(p.steps);
    if (moved.length !== p.steps.length || moved.map((x) => x.id).join() === p.steps.map((x) => x.id).join()) return;
    commit(() => { p.steps = moved; touch(p); });
  } else if (kind.startsWith('tpl-')) {
    const [, side, key] = kind.split('-');
    const arr = state.sides[side][key];
    const moved = sortBy(arr);
    if (moved.length !== arr.length || moved.map((x) => x.id).join() === arr.map((x) => x.id).join()) return;
    commit(() => { state.sides[side][key] = moved; state.sidesU = now(); });
  }
}

/* =====================================================================
   PETITS MESSAGES
   ===================================================================== */
function toast(msg, { action, onAction, timeout = action ? 6000 : 3000 } = {}) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').addEventListener('click', () => { onAction(); el.remove(); });
  root.appendChild(el);
  while (root.children.length > 2) root.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, timeout);
}

/* =====================================================================
   SYNCHRO GITHUB
   Les données vivent dans un fichier data.json d'un dépôt privé.
   Chaque appareil garde une copie locale ; en cas de modifs croisées,
   on fusionne projet par projet (le plus récent gagne).
   ===================================================================== */
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function mergeStates(a, b) {
  a = normalize(clone(a)); b = normalize(clone(b));
  const out = clone(b);
  if (a.userU > b.userU) { out.user = a.user; out.userU = a.userU; }
  if (a.sidesU > b.sidesU) { out.sides = a.sides; out.sidesU = a.sidesU; }
  for (const [id, ts] of Object.entries(a.deleted)) out.deleted[id] = Math.max(ts, out.deleted[id] || 0);
  const map = new Map(b.projects.map((p) => [p.id, p]));
  for (const p of a.projects) { const q = map.get(p.id); if (!q || p.u > q.u) map.set(p.id, p); }
  const base = a.orderU > b.orderU ? a.projects : b.projects;
  out.orderU = Math.max(a.orderU, b.orderU);
  const ids = [...base.map((p) => p.id), ...[...map.keys()].filter((id) => !base.some((p) => p.id === id))];
  out.projects = ids.filter((id) => map.has(id) && !(out.deleted[id] && out.deleted[id] >= map.get(id).u)).map((id) => map.get(id));
  if (a.today.u > b.today.u) out.today = a.today;
  out.seed = a.seed && b.seed;
  return normalize(out);
}
const combine = (local, remote) => (local.seed ? normalize(clone(remote)) : mergeStates(local, remote));
const same = (x, y) => JSON.stringify(normalize(clone(x))) === JSON.stringify(normalize(clone(y)));

const Sync = {
  cfg: null, status: 'off', msg: '', timer: null, busy: false, again: false, dirty: false,
  load() { try { this.cfg = JSON.parse(localStorage.getItem(LS_SYNC)) || null; } catch (e) { this.cfg = null; } },
  saveCfg() { try { if (this.cfg) localStorage.setItem(LS_SYNC, JSON.stringify(this.cfg)); else localStorage.removeItem(LS_SYNC); } catch (e) { /* rien */ } },
  enabled() { const c = this.cfg; return !!(c && c.owner && c.repo && c.token); },
  setStatus(s, msg = '') { this.status = s; this.msg = msg; renderSyncPill(); },
  base(c = this.cfg) { return `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}`; },
  async req(method, path, body, c = this.cfg) {
    const headers = { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json' };
    if (body) headers['Content-Type'] = 'application/json';
    return fetch(this.base(c) + path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  },
  filePath() { return `/contents/${(this.cfg.path || 'data.json').split('/').map(encodeURIComponent).join('/')}`; },
  async pull() {
    const res = await this.req('GET', `${this.filePath()}?ref=${encodeURIComponent(this.cfg.branch || 'main')}&_=${Date.now()}`);
    if (res.status === 404) return { exists: false };
    if (!res.ok) throw await httpError(res);
    const j = await res.json();
    return { exists: true, sha: j.sha, data: JSON.parse(b64decode(j.content)) };
  },
  async put(data, sha) {
    const body = { message: `Atelier · ${new Date().toLocaleString('fr-FR')}`, content: b64encode(JSON.stringify(data, null, 1)), branch: this.cfg.branch || 'main' };
    if (sha) body.sha = sha;
    const res = await this.req('PUT', this.filePath(), body);
    if (res.status === 409 || res.status === 422) { const e = new Error('conflit'); e.conflict = true; throw e; }
    if (!res.ok) throw await httpError(res);
    const j = await res.json();
    return j.content.sha;
  },
  schedule() {
    if (!this.enabled()) return;
    this.dirty = true;
    if (!this.busy) this.setStatus('pending');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 1500);
  },
  async flush() {
    if (!this.enabled() || !this.dirty) return;
    if (this.busy) { this.again = true; return; }
    clearTimeout(this.timer);
    this.busy = true; this.setStatus('saving');
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          const snapshot = JSON.stringify(state);
          this.cfg.sha = await this.put(state, this.cfg.sha);
          this.saveCfg();
          if (JSON.stringify(state) === snapshot) this.dirty = false;
          break;
        } catch (e) {
          if (!e.conflict || attempt >= 2) throw e;
          await this.absorbRemote();
        }
      }
      this.setStatus(this.dirty ? 'pending' : 'ok');
    } catch (e) { this.fail(e); }
    finally {
      this.busy = false;
      if ((this.again || this.dirty) && this.status !== 'offline' && this.status !== 'error') { this.again = false; this.schedule(); }
    }
  },
  /* récupère la version en ligne et la fusionne avec la locale */
  async absorbRemote() {
    const r = await this.pull();
    if (!r.exists) { this.cfg.sha = null; this.saveCfg(); this.dirty = true; return false; }
    const merged = combine(state, r.data);
    const changedHere = !same(merged, state);
    if (!same(merged, r.data)) this.dirty = true;
    this.cfg.sha = r.sha; this.saveCfg();
    if (changedHere) replaceState(merged);
    return changedHere;
  },
  async refresh(force) {
    if (!this.enabled() || this.busy || (this.dirty && !force)) return;
    this.busy = true;
    try {
      const changed = await this.absorbRemote();
      if (changed) toast('Mis à jour avec les modifs faites sur un autre appareil');
      this.setStatus(this.dirty ? 'pending' : 'ok');
    } catch (e) { this.fail(e); }
    finally { this.busy = false; if (this.dirty && this.status !== 'error') this.schedule(); }
  },
  fail(e) {
    console.warn('Synchro :', e);
    if (e instanceof TypeError || !navigator.onLine) this.setStatus('offline');
    else this.setStatus('error', e.message || 'Erreur de synchro');
  },
  async connect(cfg) {
    let res;
    try { res = await this.req('GET', '', null, cfg); } catch (e) { return 'Pas de connexion internet (ou GitHub injoignable).'; }
    if (res.status === 401) return 'Jeton refusé : il est faux ou expiré.';
    if (res.status === 404) return 'Dépôt introuvable : vérifie le nom, et que le jeton a bien accès à ce dépôt.';
    if (!res.ok) return `GitHub répond une erreur (${res.status}).`;
    const j = await res.json().catch(() => ({}));
    if (j.permissions && j.permissions.push === false) return 'Le jeton peut lire mais pas écrire : donne-lui « Contents : Read and write ».';
    this.cfg = { ...cfg, branch: j.default_branch || cfg.branch || 'main', sha: null };
    this.saveCfg();
    await this.refresh(true);
    if (this.status === 'error') return this.msg;
    await this.flush();
    return this.status === 'error' ? this.msg : null;
  },
  disconnect() { clearTimeout(this.timer); this.cfg = null; this.saveCfg(); this.dirty = false; this.setStatus('off'); },
  async start() {
    this.load();
    if (!this.enabled()) { this.setStatus('off'); return; }
    await this.refresh(true);
    await this.flush();
  },
};
async function httpError(res) {
  let m = ''; try { m = (await res.json()).message || ''; } catch (e) { /* rien */ }
  const msg = res.status === 401 ? 'Jeton refusé (faux ou expiré) — à refaire dans Réglages'
    : res.status === 403 ? `Accès refusé par GitHub${m ? ' : ' + m : ''}`
      : `GitHub ${res.status}${m ? ' : ' + m : ''}`;
  return new Error(msg);
}

/* =====================================================================
   DÉMARRAGE
   ===================================================================== */
state = loadState();
try { ui.expanded = JSON.parse(localStorage.getItem(LS_UI))?.expanded || null; } catch (e) { /* rien */ }
const rolled = rollDay(true);
saveLocal();
Sync.load();
renderAll();
if (rolled) Sync.schedule();
Sync.start();

const wake = () => { if (document.visibilityState !== 'visible') return; if (rollDay(false)) renderAll(); Sync.refresh(); };
document.addEventListener('visibilitychange', wake);
window.addEventListener('focus', wake);
window.addEventListener('online', () => { if (Sync.dirty) Sync.flush(); else Sync.refresh(); });
setInterval(() => { if (rollDay(false)) renderAll(); }, 60 * 1000);
