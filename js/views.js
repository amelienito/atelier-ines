'use strict';
/* =====================================================================
   ATELIER · affichage
   Chaque fonction renvoie du HTML ; les render*() le posent dans la page.
   ===================================================================== */

const ui = { sheet: null, pop: null, tab: 'today', expanded: null, flash: null, archFilter: 'tout', setTab: 'apparence' };

/* ---------- Icônes (traits simples) ---------- */
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.3-8.8A6 6 0 0 0 4.4 12.4 3.5 3.5 0 0 0 6.5 19z"/>',
  cloudOff: '<path d="M3 3l18 18"/><path d="M8.6 6.4A6 6 0 0 1 16.2 10.2a4.5 4.5 0 0 1 4.4 6.4M17 19H6.5a3.5 3.5 0 0 1-2.1-6.6 6 6 0 0 1 1.4-3.6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M20 17v4H6.5A2.5 2.5 0 0 1 4 18.5"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  palette: '<path d="M12 21a9 9 0 1 1 9-9c0 2.5-2 3.5-4 3.5h-2a2 2 0 0 0-1.4 3.4A1.3 1.3 0 0 1 12 21z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="11" cy="7" r="1.2"/><circle cx="16" cy="8.5" r="1.2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>',
  grip: '<circle cx="9" cy="6" r="1.1"/><circle cx="15" cy="6" r="1.1"/><circle cx="9" cy="12" r="1.1"/><circle cx="15" cy="12" r="1.1"/><circle cx="9" cy="18" r="1.1"/><circle cx="15" cy="18" r="1.1"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  sparkles: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
};
const I = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const flashed = (id) => !!(ui.flash && ui.flash.has(id));

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
}
function shortName(side) {
  const w = state.sides[side].name.trim().split(/\s+/);
  const s = w.length > 1 && w[0].length > 7 ? w[w.length - 1] : w[0];
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const ago = (t) => {
  const s = Math.round((now() - t) / 1000);
  if (s < 60) return 'à l’instant';
  const mn = Math.round(s / 60); if (mn < 60) return `il y a ${mn} min`;
  const h = Math.round(mn / 60); if (h < 24) return `il y a ${h} h`;
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/* ---------- Apparence générale ---------- */
function applyPrefs() {
  const pr = state.prefs; const root = document.documentElement;
  const dark = pr.theme === 'sombre' || (pr.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  document.body.dataset.bg = pr.bg;
  document.body.dataset.density = pr.density;
  document.body.classList.toggle('calm', calm());
  root.style.setProperty('--perso', state.sides.perso.color);
  root.style.setProperty('--pro', state.sides.pro.color);
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = dark ? '#131217' : '#f3f1f6';
}

function renderAll() { applyPrefs(); renderTop(); renderMain(); renderTabbar(); renderSheet(); renderPop(); }

/* =====================================================================
   EN-TÊTE
   ===================================================================== */
function renderTop() {
  const act = activeProjects().length; const te = todayEntries(); const left = te.filter((e) => !e.done).length;
  const bits = [new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })];
  bits.push(act ? plural(act, 'livre en cours', 'livres en cours') : 'aucun livre en cours');
  if (te.length) bits.push(left ? `${left} à faire aujourd’hui` : 'journée bouclée ✨');
  $('#top').innerHTML = `
    <div class="hello">
      <span class="mark" aria-hidden="true"><i></i><i></i></span>
      <div class="hello-txt">
        <h1>${greeting()}${state.user ? `, <em>${esc(state.user)}</em>` : ''}</h1>
        <p>${bits.map(esc).join(' · ')}</p>
      </div>
    </div>
    <div class="top-actions">
      <button class="search-pill" data-action="palette">${I('search', 17)}<span>Rechercher ou créer…</span><kbd>${isMac ? '⌘' : 'Ctrl '}K</kbd></button>
      <button class="icon-btn search-only" data-action="palette" aria-label="Rechercher">${I('search')}</button>
      ${syncBtn()}
      <button class="icon-btn hide-phone" data-action="open-archives" aria-label="Livres terminés" title="Livres terminés">${I('book')}</button>
      <button class="icon-btn" data-action="open-settings" aria-label="Réglages" title="Réglages et personnalisation">${I('sliders')}</button>
    </div>`;
}
function syncBtn() {
  const map = {
    off: ['cloudOff', 'Seulement sur cet appareil : touche pour brancher la synchro'],
    pending: ['cloud', 'Enregistrement en cours…'], saving: ['cloud', 'Enregistrement en cours…'],
    ok: ['cloud', 'Tout est enregistré en ligne'],
    offline: ['cloudOff', 'Hors ligne : gardé sur l’appareil, envoyé au retour du réseau'],
    error: ['cloudOff', Sync.msg || 'La synchro a un souci'],
  };
  const [ic, t] = map[Sync.status] || map.off;
  return `<button class="icon-btn sync sync-${Sync.status}" data-action="open-settings" data-tab="memoire" title="${esc(t)}" aria-label="${esc(t)}">${I(ic)}<i class="sync-dot"></i></button>`;
}
function renderSyncState() {
  const b = $('.sync'); if (b) b.outerHTML = syncBtn();
  const box = $('#sync-status'); if (box) box.outerHTML = syncStatusHTML();
}

/* =====================================================================
   ACCUEIL
   ===================================================================== */
function renderMain() {
  document.body.dataset.expanded = ui.expanded || '';
  $('#main').innerHTML = `
    <div class="layout">${spaceHTML('perso')}${todayHTML()}${spaceHTML('pro')}</div>
    <section class="overview ${state.prefs.tables ? '' : 'phone-only'}">${overviewHTML()}</section>`;
}

function spaceHTML(side) {
  const sd = state.sides[side]; const list = activeProjects(side); const ex = ui.expanded === side;
  return `
  <section class="space tint" data-side="${side}" style="--c:${sd.color}">
    <header class="space-head">
      <button class="space-emoji" data-action="pick-emoji" data-target="space" data-side="${side}" title="Changer l’emoji">${esc(sd.emoji)}</button>
      <h2 class="space-name" contenteditable="plaintext-only" data-space-name="${side}" aria-label="Nom de cet espace (modifiable)" spellcheck="false" enterkeyhint="done">${esc(sd.name)}</h2>
      <span class="space-count">${list.length}</span>
      <button class="icon-btn ghost hide-phone" data-action="expand" data-side="${side}" title="${ex ? 'Revenir à la vue complète' : 'Agrandir cet espace'}">${I(ex ? 'shrink' : 'expand', 17)}</button>
      <button class="add-btn" data-action="new-project" data-side="${side}">${I('plus', 17)}<span>Nouveau</span></button>
    </header>
    ${list.length ? `<ul class="cards" data-sortable="side-${side}">${list.map(cardHTML).join('')}</ul>`
      : `<button class="space-empty" data-action="new-project" data-side="${side}"><span class="space-empty-emo">${esc(sd.emoji)}</span><b>Rien en cours ici</b><span>Ajoute ton prochain livre</span></button>`}
  </section>`;
}

function coverAttrs(p, cls) {
  const c = p.cover;
  if (c && c.t === 'img') {
    const u = Covers.url(c.key);
    return `class="${cls} cover ${u ? 'has-img' : 'img-wait'}" data-cover="${esc(c.key)}"${u ? ` style="background-image:url('${u}')"` : ''}`;
  }
  if (c && c.t === 'grad' && COVERS[c.v]) return `class="${cls} cover" style="background:${COVERS[c.v]}"`;
  return `class="${cls} cover cover-auto"`;
}
const typeChip = (t) => `<span class="type" style="--t:${t.color}">${esc(t.name)}</span>`;

function progressHTML(p, nx = nextStep(p)) {
  const pr = progress(p); if (!pr.total) return '';
  const num = state.prefs.numbers ? `<span class="pnum">${pr.done}/${pr.total}</span>` : '';
  if (state.prefs.progress === 'barre' || pr.total > 24) return `<div class="prog"><div class="pbar"><i style="width:${pr.pct}%"></i></div>${num}</div>`;
  return `<div class="prog"><div class="beads" aria-label="${pr.done} étapes faites sur ${pr.total}">${p.steps.map((s) => `<i class="${s.done ? 'on' : ''}${s === nx ? ' now' : ''}${flashed(s.id) ? ' just' : ''}"></i>`).join('')}</div>${num}</div>`;
}

function cardHTML(p) {
  const ph = phase(p); const pr = progress(p); const nx = nextStep(p); const ty = typeOf(p);
  let foot;
  if (ph === 'livrables') {
    const d = p.deliverables.filter((x) => x.done).length;
    foot = `<button class="card-finish" data-action="open-celebrate" data-id="${p.id}">${I('sparkles', 16)}<span>Plus que les livrables</span><b>${d}/${p.deliverables.length}</b></button>`;
  } else if (nx) {
    const on = inToday(p.id, nx.id); const idx = p.steps.indexOf(nx) + 1;
    foot = `<div class="card-now">
      <div class="now-txt"><small>${state.prefs.numbers ? `Étape ${idx} sur ${pr.total}` : 'Prochaine étape'}</small><b>${esc(nx.name)}</b></div>
      <button class="round sun ${on ? 'on' : ''}" data-action="toggle-today" data-p="${p.id}" data-s="${nx.id}" title="${on ? 'Retirer d’aujourd’hui' : 'Ajouter à aujourd’hui'}" aria-pressed="${on}">${I('sun', 17)}</button>
      <button class="round done" data-action="quick-done" data-p="${p.id}" data-s="${nx.id}" title="C’est fait !" aria-label="Marquer « ${esc(nx.name)} » comme fait">${I('check', 17)}</button>
    </div>`;
  } else {
    foot = `<div class="card-now"><div class="now-txt"><small>Pas encore d’étapes</small><b>Ouvre pour en ajouter</b></div></div>`;
  }
  return `
  <li class="card ph-${ph}${flashed(p.id) ? ' flash' : ''}" data-id="${p.id}" data-action="open-project">
    <div ${coverAttrs(p, 'card-cover')}></div>
    <div class="card-body">
      <span class="card-icon">${esc(p.icon)}</span>
      <h3 class="card-title">${esc(p.title)}</h3>
      ${ty || p.client ? `<div class="card-meta">${ty ? typeChip(ty) : ''}${p.client ? `<span class="client">${I('user', 13)}${esc(p.client)}</span>` : ''}</div>` : ''}
      ${progressHTML(p, nx)}
      ${foot}
    </div>
  </li>`;
}

/* ---------- Aujourd'hui ---------- */
function todayHTML() {
  const es = todayEntries(); const done = es.filter((e) => e.done).length;
  const sug = suggestions(es.length ? 3 : 5);
  const sub = !es.length ? 'Rien de prévu pour l’instant' : done === es.length ? 'Tout est fait, bravo ✨' : `${plural(es.length - done, 'chose', 'choses')} à faire`;
  return `
  <aside class="today">
    <header class="today-head">
      <span class="today-sun">${I('sun', 21)}</span>
      <div class="today-titles"><h2>Aujourd’hui</h2><p>${sub}</p></div>
      ${es.length ? ringHTML(done, es.length) : ''}
    </header>
    ${es.length ? `<ul class="todo" data-sortable="today">${es.map(todoHTML).join('')}</ul>` : ''}
    <label class="todo-add">${I('plus', 17)}<input id="free-input" type="text" placeholder="Ajouter une tâche…" data-enter="add-free" autocomplete="off" enterkeyhint="done"></label>
    <button class="pick-btn" data-action="open-picker">${I('book', 16)}<span>Choisir une étape d’un projet</span></button>
    ${sug.length ? `<div class="sugg"><h4>À suivre</h4>${sug.map(({ p, st }) => `
      <button class="sugg-item tint" style="--c:${sideColor(p.side)}" data-action="today-add" data-p="${p.id}" data-s="${st.id}">
        <span class="sugg-plus">${I('plus', 14)}</span><span class="sugg-txt"><b>${esc(st.name)}</b><small>${esc(p.icon)} ${esc(p.title)}</small></span>
      </button>`).join('')}</div>` : ''}
    ${miniOverviewHTML()}
  </aside>`;
}
function todoHTML(e) {
  const fl = flashed(e.it.id) ? ' flash' : '';
  const tag = e.it.carried && !e.done ? '<span class="tag">d’hier</span>' : '';
  const x = `<button class="icon-btn mini" data-action="today-remove" data-id="${e.it.id}" aria-label="Retirer de la liste">${I('x', 15)}</button>`;
  if (e.free) {
    return `<li class="todo-item free ${e.done ? 'done' : ''}${fl}" data-id="${e.it.id}">
      <button class="tick" data-action="today-toggle" data-id="${e.it.id}" aria-label="Cocher">${I('check', 15)}</button>
      <div class="todo-txt"><input class="todo-free" value="${esc(e.it.text)}" data-free="${e.it.id}" aria-label="Tâche" enterkeyhint="done"></div>${tag}${x}</li>`;
  }
  return `<li class="todo-item tint ${e.done ? 'done' : ''}${fl}" data-id="${e.it.id}" style="--c:${sideColor(e.p.side)}">
    <button class="tick" data-action="today-toggle" data-id="${e.it.id}" aria-label="Cocher">${I('check', 15)}</button>
    <div class="todo-txt"><b>${esc(e.st.name)}</b><button class="todo-proj" data-action="open-project" data-id="${e.p.id}">${esc(e.p.icon)} ${esc(e.p.title)}</button></div>${tag}${x}</li>`;
}
function ringHTML(d, n) {
  const r = 15; const c = 2 * Math.PI * r; const off = c * (1 - d / n);
  return `<span class="ring" title="${d} sur ${n}"><svg width="42" height="42" viewBox="0 0 40 40"><circle cx="20" cy="20" r="${r}" class="ring-bg"/><circle cx="20" cy="20" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg><b>${d}/${n}</b></span>`;
}
/* Petit résumé de tous les projets (téléphone, sous « Aujourd'hui ») */
function miniOverviewHTML() {
  const all = SIDES.flatMap((s) => activeProjects(s));
  if (!all.length) return '';
  return `<div class="mini-ov"><h4>Où j’en suis</h4>${all.map((p) => {
    const pr = progress(p); const ph = phase(p);
    return `<button class="mini-row tint ${ph === 'livrables' ? 'due' : ''}" style="--c:${sideColor(p.side)}" data-action="open-project" data-id="${p.id}">
      <span class="mini-emo">${esc(p.icon)}</span><b>${esc(p.title)}</b><span class="mini-bar"><i style="width:${pr.pct}%"></i></span>${ph === 'livrables' ? I('sparkles', 15) : ''}
    </button>`;
  }).join('')}${archivedProjects().length ? `<button class="mini-row mini-arch" data-action="open-archives"><span class="mini-emo">📚</span><b>Livres terminés</b><span class="sec-count">${archivedProjects().length}</span></button>` : ''}</div>`;
}

/* ---------- Vue d'ensemble (tableaux façon carnet) ---------- */
function overviewHTML() {
  const na = archivedProjects().length;
  return `<header class="ov-head"><h2>${I('grid', 19)}Vue d’ensemble</h2><p>Coche directement dans les cases</p>${na ? `<button class="link-btn ov-arch" data-action="open-archives">${I('book', 15)}${plural(na, 'livre terminé', 'livres terminés')}</button>` : ''}</header>
    <div class="ov-tables">${SIDES.map(tableHTML).join('')}</div>`;
}
function tableHTML(side) {
  const sd = state.sides[side]; const list = activeProjects(side); const cols = sd.steps;
  const tplIds = new Set(cols.map((c) => c.id)); const collapsed = !!(LOCAL.collapsed || {})[side];
  const head = `<tr><th class="xt-name"></th><th class="xt-v"><span>Type</span></th>${cols.map((c) => `<th class="xt-v"><span>${esc(c.name)}</span></th>`).join('')}<th class="xt-v"><span>Autres</span></th><th class="xt-v"><span>Début</span></th><th class="xt-v"><span>Fin</span></th></tr>`;
  const rows = list.map((p) => {
    const others = p.steps.filter((s) => !s.tpl || !tplIds.has(s.tpl)); const od = others.filter((s) => s.done).length; const ty = typeOf(p);
    return `<tr class="ph-${phase(p)}">
      <th class="xt-name"><button data-action="open-project" data-id="${p.id}"><span class="xt-emo">${esc(p.icon)}</span><span class="xt-t">${esc(p.title)}</span></button></th>
      <td>${ty ? `<span class="xt-type" style="--t:${ty.color}" title="${esc(ty.name)}"></span>` : ''}</td>
      ${cols.map((c) => {
        const st = p.steps.find((s) => s.tpl === c.id);
        if (!st) return '<td><span class="cell na" title="Pas concerné"></span></td>';
        return `<td><button class="cell ${st.done ? 'on' : ''}${flashed(st.id) ? ' just' : ''}" data-action="cell-toggle" data-p="${p.id}" data-s="${st.id}" title="${esc(c.name)}" aria-pressed="${st.done}">${I('check', 13)}</button></td>`;
      }).join('')}
      <td>${others.length ? `<button class="cell other ${od === others.length ? 'on' : ''}" data-action="open-project" data-id="${p.id}" title="${esc(others.map((s) => s.name).join(', '))}">${od}/${others.length}</button>` : ''}</td>
      <td class="xt-date">${shortDate(p.start)}</td><td class="xt-date">${shortDate(p.end)}</td>
    </tr>`;
  }).join('');
  return `<div class="xt tint ${collapsed ? 'collapsed' : ''}" data-side="${side}" style="--c:${sd.color}">
    <header class="xt-head">
      <button class="xt-toggle" data-action="toggle-table" data-side="${side}" aria-expanded="${!collapsed}">${I('chevron', 16)}<span class="xt-emo">${esc(sd.emoji)}</span><b>${esc(sd.name)}</b><small>${plural(list.length, 'projet', 'projets')}</small></button>
      <button class="link-btn" data-action="open-settings" data-tab="espaces" data-side="${side}">${I('layers', 15)}Modifier les colonnes</button>
    </header>
    ${collapsed ? '' : list.length ? `<div class="xt-scroll"><table>${head}${rows}</table></div>` : '<p class="xt-empty">Aucun projet en cours.</p>'}
  </div>`;
}

/* ---------- Barre d'onglets (téléphone) ---------- */
function renderTabbar() {
  const n = todayEntries().filter((e) => !e.done).length;
  const tabs = [
    ['today', I('sun', 21), 'Aujourd’hui', n, ''],
    ['perso', `<span class="tab-emo">${esc(state.sides.perso.emoji)}</span>`, shortName('perso'), 0, sideColor('perso')],
    ['pro', `<span class="tab-emo">${esc(state.sides.pro.emoji)}</span>`, shortName('pro'), 0, sideColor('pro')],
    ['tables', I('grid', 21), 'Tableaux', 0, ''],
  ];
  $('#tabbar').innerHTML = tabs.map(([k, ic, label, c, col]) => `
    <button class="tab ${ui.tab === k ? 'on' : ''}" data-action="tab" data-tab="${k}"${col ? ` style="--c:${col}"` : ''}>${ic}<span>${esc(label)}</span>${c ? `<i class="badge">${c}</i>` : ''}</button>`).join('');
  document.body.dataset.tab = ui.tab;
}

/* =====================================================================
   FENÊTRES
   ===================================================================== */
const sheetKey = (m) => m.type + ':' + (m.id || m.side || '');
function sheetColor(m) {
  if (m.type === 'new') return sideColor(m.side);
  if (m.type === 'page' && P(m.id)) return sideColor(P(m.id).side);
  return '';
}
function lockBody() { document.body.classList.toggle('locked', !!(ui.sheet || ui.pop)); }

function renderSheet() {
  const root = $('#sheet-root'); const m = ui.sheet;
  if (!m) { root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const kinds = { page: [pageHTML, 'drawer'], new: [newHTML, 'modal'], picker: [pickerHTML, 'modal'], archives: [archivesHTML, 'modal wide'], settings: [settingsHTML, 'modal wide'], welcome: [welcomeHTML, 'modal'] };
  const [fn, cls] = kinds[m.type] || [];
  const html = fn ? fn(m) : '';
  if (!html) { ui.sheet = null; root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const key = sheetKey(m); const color = sheetColor(m);
  const ex = $('.sheet', root);
  if (ex && root.dataset.key === key) {
    const sc = $('.sheet-scroll', ex); const top = sc ? sc.scrollTop : 0;
    ex.innerHTML = html;
    const sc2 = $('.sheet-scroll', ex); if (sc2) sc2.scrollTop = top;
  } else {
    root.innerHTML = `<div class="scrim" data-action="close-sheet"></div><section class="sheet tint ${cls} sheet-${m.type}" role="dialog" aria-modal="true"${color ? ` style="--c:${color}"` : ''}>${html}</section>`;
    root.dataset.key = key;
    const af = $('[data-autofocus]', root);
    if (af && (!isTouch() || m.type === 'new')) setTimeout(() => af.focus(), 80);
  }
  autoGrowAll(root);
  lockBody();
}

function renderPop() {
  const root = $('#pop-root'); const m = ui.pop;
  if (!m) { root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const kinds = { emoji: emojiHTML, cover: coverHTML, ask: askHTML, celebrate: celebrateHTML, palette: paletteHTML };
  const html = kinds[m.type] ? kinds[m.type](m) : '';
  if (!html) { ui.pop = null; root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const key = sheetKey(m);
  const ex = $('.pop', root);
  if (ex && root.dataset.key === key) ex.innerHTML = html;
  else {
    root.innerHTML = `<div class="scrim pop-scrim" data-action="close-pop"></div><div class="pop pop-${m.type}" role="dialog" aria-modal="true">${html}</div>`;
    root.dataset.key = key;
    const af = $('[data-autofocus]', root); if (af) setTimeout(() => af.focus(), 60);
  }
  lockBody();
}

const sheetHead = (title, sub = '', emo = '') => `
  <div class="sheet-head">
    <div class="sheet-title">${emo ? `<span class="sheet-emo">${emo}</span>` : ''}<div>${sub ? `<small>${esc(sub)}</small>` : ''}<h2>${title}</h2></div></div>
    <button class="icon-btn" data-action="close-sheet" aria-label="Fermer">${I('x')}</button>
  </div>`;

/* ---------- Fiche projet (une « page ») ---------- */
function rowHTML(kind, p, x) {
  const isStep = kind === 'step';
  const attrs = isStep ? `data-p="${p.id}" data-s="${x.id}"` : `data-p="${p.id}" data-d="${x.id}"`;
  return `<li class="row ${x.done ? 'done' : ''}${flashed(x.id) ? ' flash' : ''}" data-id="${x.id}">
    <span class="grip" aria-hidden="true">${I('grip', 15)}</span>
    <button class="tick" data-action="${isStep ? 'step-toggle' : 'livr-toggle'}" ${attrs} aria-label="Cocher">${I('check', 14)}</button>
    <input class="row-name" value="${esc(x.name)}" ${isStep ? `data-step-name="${x.id}"` : `data-livr-name="${x.id}"`} aria-label="Nom" enterkeyhint="done">
    ${isStep && !x.done ? `<button class="row-sun ${inToday(p.id, x.id) ? 'on' : ''}" data-action="toggle-today" ${attrs} title="${inToday(p.id, x.id) ? 'Retirer d’aujourd’hui' : 'Faire aujourd’hui'}">${I('sun', 16)}</button>` : ''}
    <button class="icon-btn mini row-x" data-action="${isStep ? 'step-remove' : 'livr-remove'}" ${attrs} aria-label="Retirer">${I('x', 14)}</button>
  </li>`;
}
function pageHTML(m) {
  const p = P(m.id); if (!p) return '';
  const sd = state.sides[p.side]; const pr = progress(p); const ph = phase(p); const nx = nextStep(p);
  const dd = p.deliverables.filter((d) => d.done).length;
  const dateFr = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `
  <div class="sheet-scroll page">
    <div ${coverAttrs(p, 'page-cover')}>
      <div class="page-cover-bar">
        <button class="glass-btn" data-action="pick-cover" data-id="${p.id}">${I('image', 15)}<span>Couverture</span></button>
        <button class="glass-btn round" data-action="close-sheet" aria-label="Fermer">${I('x', 17)}</button>
      </div>
    </div>
    <div class="page-inner">
      <button class="page-icon" data-action="pick-emoji" data-target="project" data-id="${p.id}" title="Changer l’emoji">${esc(p.icon)}</button>
      <textarea class="page-title" data-pfield="title" rows="1" aria-label="Titre" spellcheck="false">${esc(p.title)}</textarea>
      ${p.archived ? `<div class="banner">${I('book', 17)}<span>Terminé${p.archivedAt ? ' le ' + dateFr(p.archivedAt) : ''}</span><button class="btn small" data-action="unarchive" data-id="${p.id}">Remettre en cours</button></div>` : ''}
      <div class="props">
        <div class="prop"><span class="prop-k">${I('layers', 15)}Espace</span><div class="prop-v"><span class="space-chip">${esc(sd.emoji)} ${esc(sd.name)}</span></div></div>
        <div class="prop"><span class="prop-k">${I('tag', 15)}Type</span><div class="prop-v chips">${sd.types.map((t) => `<button class="type-pick ${p.kind === t.name ? 'on' : ''}" style="--t:${t.color}" data-action="set-kind" data-id="${p.id}" data-kind="${esc(t.name)}">${esc(t.name)}</button>`).join('') || '<span class="muted small">Aucun type (à créer dans Réglages)</span>'}</div></div>
        ${p.side === 'pro' || p.client || p.contact ? `
        <label class="prop"><span class="prop-k">${I('user', 15)}Cliente</span><input class="prop-in" data-pfield="client" value="${esc(p.client)}" placeholder="Son nom" enterkeyhint="done"></label>
        <label class="prop"><span class="prop-k">${I('at', 15)}Contact</span><input class="prop-in" data-pfield="contact" value="${esc(p.contact)}" placeholder="Insta, mail, téléphone…" enterkeyhint="done"></label>` : ''}
        <label class="prop"><span class="prop-k">${I('calendar', 15)}Début</span><input class="prop-in" type="date" data-pfield="start" value="${esc(p.start)}"></label>
        <label class="prop"><span class="prop-k">${I('flag', 15)}Fin</span><input class="prop-in" type="date" data-pfield="end" value="${esc(p.end)}"></label>
      </div>

      <section class="page-sec">
        <div class="sec-head"><h3>Étapes</h3><span class="sec-count">${pr.done}/${pr.total}</span></div>
        ${progressHTML(p, nx)}
        <ul class="rows" data-sortable="steps">${p.steps.map((st) => rowHTML('step', p, st)).join('')}</ul>
        <label class="add-row">${I('plus', 17)}<input id="step-input" placeholder="Ajouter une étape" data-enter="add-step" data-id="${p.id}" autocomplete="off" enterkeyhint="done"></label>
      </section>

      <section class="page-sec livr ${ph === 'livrables' ? 'is-due' : ''}">
        <div class="sec-head"><h3>Livrables de fin</h3><span class="sec-count">${dd}/${p.deliverables.length}</span></div>
        <p class="sec-hint">${ph === 'livrables' ? 'Toutes les étapes sont faites : coche ton dossier et le livre rejoindra tes livres terminés ✨' : 'Le dossier à préparer une fois toutes les étapes cochées.'}</p>
        <ul class="rows" data-sortable="livr">${p.deliverables.map((d) => rowHTML('livr', p, d)).join('')}</ul>
        <label class="add-row">${I('plus', 17)}<input id="livr-input" placeholder="Ajouter un livrable" data-enter="add-livr" data-id="${p.id}" autocomplete="off" enterkeyhint="done"></label>
      </section>

      <section class="page-sec">
        <div class="sec-head"><h3>Notes</h3></div>
        <textarea class="notes" data-pfield="notes" placeholder="Papier, couleurs, références, idées…">${esc(p.notes)}</textarea>
      </section>

      <footer class="page-foot">
        <span class="muted small">${p.created ? 'Créé le ' + dateFr(p.created) : ''}</span>
        <span class="grow"></span>
        <button class="btn ghost small" data-action="duplicate" data-id="${p.id}">${I('copy', 15)}Dupliquer</button>
        ${p.archived ? '' : `<button class="btn ghost small" data-action="archive-now" data-id="${p.id}">${I('archive', 15)}Ranger</button>`}
        <button class="btn ghost small danger" data-action="delete-project" data-id="${p.id}">${I('trash', 15)}Supprimer</button>
      </footer>
    </div>
  </div>`;
}

/* ---------- Nouveau projet ---------- */
function newHTML(m) {
  const sd = state.sides[m.side];
  m.skip = m.skip || []; m.extra = m.extra || [];
  m.draft = { title: '', kind: '', client: '', contact: '', icon: BOOK_EMOJIS[Math.floor(Math.random() * BOOK_EMOJIS.length)], ...(m.draft || {}) };
  const n = sd.steps.length - m.skip.length + m.extra.length;
  return `
  ${sheetHead(esc(sd.name), 'Nouveau projet', esc(sd.emoji))}
  <div class="sheet-scroll">
    <div class="new-hero">
      <button class="new-icon" data-action="pick-emoji" data-target="new" title="Changer l’emoji">${esc(m.draft.icon)}</button>
      <input class="new-title" type="text" data-draft="title" value="${esc(m.draft.title)}" placeholder="Titre du livre" data-autofocus data-enter="create-project" autocomplete="off" enterkeyhint="go">
    </div>
    ${sd.types.length ? `<div class="field"><span class="field-k">Type</span><div class="chips">${sd.types.map((t) => `<button class="type-pick ${m.draft.kind === t.name ? 'on' : ''}" style="--t:${t.color}" data-action="draft-kind" data-kind="${esc(t.name)}">${esc(t.name)}</button>`).join('')}</div></div>` : ''}
    ${m.side === 'pro' ? `<div class="grid2">
      <label class="field"><span class="field-k">Cliente</span><input class="in" data-draft="client" value="${esc(m.draft.client)}" placeholder="Son nom" enterkeyhint="next"></label>
      <label class="field"><span class="field-k">Contact</span><input class="in" data-draft="contact" value="${esc(m.draft.contact)}" placeholder="Insta, mail, tél…" enterkeyhint="done"></label>
    </div>` : ''}
    <div class="field">
      <span class="field-k">Les étapes pour ce livre <em>· touche celles dont tu n’auras pas besoin</em></span>
      <div class="chips">
        ${sd.steps.map((t) => { const off = m.skip.includes(t.id); return `<button class="step-chip ${off ? 'off' : ''}" data-action="toggle-skip" data-id="${t.id}" aria-pressed="${!off}">${I(off ? 'x' : 'check', 13)}${esc(t.name)}</button>`; }).join('')}
        ${m.extra.map((x, i) => `<span class="step-chip extra">${I('sparkles', 13)}${esc(x)}<button data-action="remove-extra" data-i="${i}" aria-label="Retirer">${I('x', 12)}</button></span>`).join('')}
      </div>
      <label class="add-row boxed">${I('plus', 17)}<input id="extra-input" placeholder="Autre étape (ex. Envoi du colis)" data-enter="add-extra" autocomplete="off" enterkeyhint="done"></label>
    </div>
  </div>
  <div class="sheet-foot">
    <span class="muted">${plural(n, 'étape', 'étapes')}</span>
    <button class="btn primary" data-action="create-project">Créer le projet</button>
  </div>`;
}

/* ---------- Choisir des étapes pour aujourd'hui ---------- */
function pickerHTML() {
  const block = (side) => {
    const sd = state.sides[side]; const list = activeProjects(side).filter((p) => nextStep(p));
    return `<div class="pick-side tint" style="--c:${sd.color}"><h3>${esc(sd.emoji)} ${esc(sd.name)}</h3>${list.length ? list.map((p) => `
      <div class="pick-proj"><div class="pick-title">${esc(p.icon)} ${esc(p.title)}</div><div class="chips">${p.steps.filter((s) => !s.done).map((s, i) => {
        const on = inToday(p.id, s.id);
        return `<button class="pick-chip ${on ? 'on' : ''} ${i === 0 ? 'first' : ''}" data-action="${on ? 'today-remove-step' : 'today-add'}" data-p="${p.id}" data-s="${s.id}">${I(on ? 'check' : 'plus', 13)}${esc(s.name)}</button>`;
      }).join('')}</div></div>`).join('') : '<p class="muted small">Rien en cours ici.</p>'}</div>`;
  };
  return `${sheetHead('Ajouter à aujourd’hui', 'Touche ce que tu fais aujourd’hui', I('sun', 22))}
    <div class="sheet-scroll">${SIDES.map(block).join('')}</div>
    <div class="sheet-foot"><button class="btn primary" data-action="close-sheet">C’est bon</button></div>`;
}

/* ---------- Livres terminés ---------- */
function archivesHTML() {
  const f = ui.archFilter; const all = archivedProjects(); const list = all.filter((p) => f === 'tout' || p.side === f);
  const year = new Date().getFullYear();
  const thisYear = all.filter((p) => p.archivedAt && new Date(p.archivedAt).getFullYear() === year).length;
  return `${sheetHead('Livres terminés', all.length ? `${plural(all.length, 'livre', 'livres')} au total · ${thisYear} en ${year}` : '', '📚')}
  <div class="sheet-scroll">
    <div class="seg">${[['tout', 'Tout'], ['perso', `${state.sides.perso.emoji} ${shortName('perso')}`], ['pro', `${state.sides.pro.emoji} ${shortName('pro')}`]].map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-action="arch-filter" data-f="${k}">${esc(l)}</button>`).join('')}</div>
    ${list.length ? `<div class="shelf">${list.map((p) => `
      <button class="book tint" style="--c:${sideColor(p.side)}" data-action="open-project" data-id="${p.id}">
        <div ${coverAttrs(p, 'book-cover')}><span class="book-emo">${esc(p.icon)}</span></div>
        <b>${esc(p.title)}</b><small>${[typeOf(p) && typeOf(p).name, p.end ? 'fini le ' + shortDate(p.end) : ''].filter(Boolean).map(esc).join(' · ')}</small>
      </button>`).join('')}</div>`
      : `<div class="empty-state"><span>📚</span><b>Pas encore de livre terminé</b><small>Ils arriveront ici, comme sur une étagère.</small></div>`}
  </div>`;
}

/* ---------- Réglages ---------- */
function settingsHTML(m) {
  const tab = ui.setTab;
  const tabs = [['apparence', 'Apparence', 'palette'], ['espaces', 'Espaces & étapes', 'layers'], ['memoire', 'Mémoire & synchro', 'cloud']];
  return `${sheetHead('Réglages')}
    <div class="set-tabs">${tabs.map(([k, l, ic]) => `<button class="${tab === k ? 'on' : ''}" data-action="set-tab" data-tab="${k}">${I(ic, 16)}<span>${l}</span></button>`).join('')}</div>
    <div class="sheet-scroll set-body">${tab === 'apparence' ? appearanceHTML() : tab === 'espaces' ? spacesSetHTML() : memoryHTML(m)}</div>`;
}
function appearanceHTML() {
  const pr = state.prefs;
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l, ic]) => `<button class="${pr[key] === v ? 'on' : ''}" data-action="set-pref" data-k="${key}" data-v="${v}">${ic ? I(ic, 15) : ''}${l}</button>`).join('')}</div>`;
  const sw = (key, on, label, sub, local) => `<label class="switch-row"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" class="switch" ${on ? 'checked' : ''} data-${local ? 'local' : 'pref'}="${key}"></label>`;
  return `
    <div class="set-group"><label class="field"><span class="field-k">Prénom affiché</span><input class="in" data-setting="user" value="${esc(state.user)}" placeholder="Ton prénom" enterkeyhint="done"></label></div>
    <div class="set-group"><h4>Thème</h4>${seg('theme', [['clair', 'Clair', 'sun'], ['sombre', 'Sombre', 'moon'], ['auto', 'Comme l’appareil', 'auto']])}</div>
    <div class="set-group"><h4>Fond</h4><div class="bg-picks">${[['doux', 'Lumière douce'], ['points', 'Pointillés'], ['uni', 'Uni']].map(([v, l]) => `<button class="bg-pick bgp-${v} ${pr.bg === v ? 'on' : ''}" data-action="set-pref" data-k="bg" data-v="${v}"><i></i><span>${l}</span></button>`).join('')}</div></div>
    <div class="set-group"><h4>Cartes</h4>${seg('density', [['aeree', 'Aérées, avec couverture'], ['compacte', 'Compactes']])}</div>
    <div class="set-group"><h4>Progression</h4>${seg('progress', [['perles', 'Perles'], ['barre', 'Barre']])}
      ${sw('numbers', pr.numbers, 'Afficher les chiffres', 'Par exemple « étape 4 sur 10 »')}</div>
    <div class="set-group"><h4>Accueil</h4>${sw('tables', pr.tables, 'Vue d’ensemble sous les projets', 'Les tableaux façon carnet')}</div>
    <div class="set-group"><h4>Sur cet appareil</h4>
      ${sw('haptics', LOCAL.haptics, 'Vibrations', 'Un petit retour quand tu coches (iPhone, Android)', true)}
      ${sw('sounds', LOCAL.sounds, 'Sons', 'Un petit « tic » quand tu coches', true)}
      ${sw('calm', LOCAL.calm, 'Animations réduites', 'Ni confettis ni mouvements', true)}
    </div>
    <p class="muted small center">Les couleurs, noms et emojis des espaces sont dans l’onglet « Espaces & étapes ».</p>`;
}
function spacesSetHTML() {
  return SIDES.map((side) => {
    const sd = state.sides[side];
    return `<div class="space-set tint" style="--c:${sd.color}" id="set-${side}">
      <div class="space-set-head">
        <button class="space-emoji big" data-action="pick-emoji" data-target="space" data-side="${side}" title="Changer l’emoji">${esc(sd.emoji)}</button>
        <input class="in name" data-space-name="${side}" value="${esc(sd.name)}" aria-label="Nom de l’espace" enterkeyhint="done">
      </div>
      <div class="swatches">${PALETTE.map(([n, hex]) => `<button class="swatch ${sd.color === hex ? 'on' : ''}" style="--s:${hex}" data-action="set-color" data-side="${side}" data-hex="${hex}" title="${n}" aria-label="${n}"></button>`).join('')}</div>
      ${tplListHTML(side, 'steps', 'Étapes proposées à chaque nouveau projet', 'Nouvelle étape')}
      ${tplListHTML(side, 'deliverables', 'Livrables de fin', 'Nouveau livrable')}
      ${typesSetHTML(side)}
    </div>`;
  }).join('') + '<p class="muted small center">Changer ces listes ne touche pas aux projets déjà en cours (chaque fiche se modifie à part).</p>';
}
function tplListHTML(side, key, title, ph) {
  return `<div class="tpl"><h4>${title}</h4>
    <ul class="rows" data-sortable="tpl-${side}-${key}">${state.sides[side][key].map((t) => `
      <li class="row" data-id="${t.id}"><span class="grip" aria-hidden="true">${I('grip', 15)}</span>
      <input class="row-name" value="${esc(t.name)}" data-tpl="${side}|${key}|${t.id}" enterkeyhint="done">
      <button class="icon-btn mini row-x" data-action="tpl-remove" data-side="${side}" data-key="${key}" data-id="${t.id}" aria-label="Supprimer">${I('x', 14)}</button></li>`).join('')}</ul>
    <label class="add-row">${I('plus', 17)}<input id="tpl-${side}-${key}" placeholder="${ph}" data-enter="tpl-add" data-side="${side}" data-key="${key}" autocomplete="off" enterkeyhint="done"></label></div>`;
}
function typesSetHTML(side) {
  return `<div class="tpl"><h4>Types <span class="muted">· touche la pastille pour changer sa couleur</span></h4>
    <ul class="rows">${state.sides[side].types.map((t) => `
      <li class="row" data-id="${t.id}"><button class="type-dot" style="--t:${t.color}" data-action="cycle-type-color" data-side="${side}" data-id="${t.id}" aria-label="Changer la couleur"></button>
      <input class="row-name" value="${esc(t.name)}" data-type="${side}|${t.id}" enterkeyhint="done">
      <button class="icon-btn mini row-x" data-action="type-remove" data-side="${side}" data-id="${t.id}" aria-label="Supprimer">${I('x', 14)}</button></li>`).join('')}</ul>
    <label class="add-row">${I('plus', 17)}<input id="type-${side}" placeholder="Nouveau type (ex. Réparation)" data-enter="type-add" data-side="${side}" autocomplete="off" enterkeyhint="done"></label></div>`;
}
function syncStatusHTML() {
  const s = Sync.status; const on = Sync.enabled();
  let ic = 'cloudOff'; let title; let sub; let st = on ? s : 'off';
  if (!on) { title = 'Seulement sur cet appareil'; sub = 'Branche la synchro pour retrouver tout sur l’ordi, le téléphone et l’iPad, sans jamais rien perdre.'; }
  else if (['ok', 'pending', 'saving'].includes(s)) { ic = 'cloud'; title = s === 'ok' ? 'Tout est enregistré en ligne' : 'Enregistrement…'; sub = Sync.cfg.lastOk ? `Dernière synchro ${ago(Sync.cfg.lastOk)}` : ''; st = 'ok'; }
  else if (s === 'offline') { title = 'Hors ligne pour l’instant'; sub = 'Rien n’est perdu : c’est gardé sur l’appareil et ça partira au retour du réseau.'; }
  else { title = 'La synchro a un souci'; sub = Sync.msg; }
  return `<div class="sync-card st-${st}" id="sync-status"><span class="sync-ic">${I(ic, 22)}</span><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>${on ? `<button class="btn small" data-action="sync-now">Synchroniser</button>` : ''}</div>`;
}
function memoryHTML(m) {
  const on = Sync.enabled();
  const msg = m.msg ? `<p class="msg ${m.err ? 'err' : 'ok'}">${esc(m.msg)}</p>` : '';
  return `
    ${syncStatusHTML()}
    ${on ? `<div class="set-group">
      <h4>Connecter un autre appareil</h4>
      <p class="muted small">Ouvre ce lien sur l’ordi, le téléphone ou l’iPad à connecter, et c’est tout. Garde-le pour toi : il donne accès aux données.</p>
      <div class="btn-row"><button class="btn" data-action="copy-link">${I('link', 16)}Copier le lien</button>${navigator.share ? `<button class="btn" data-action="share-link">${I('share', 16)}Envoyer…</button>` : ''}</div>
    </div>` : `<div class="set-group">
      <h4>Connecter cet appareil</h4>
      <p class="muted small">Colle ici le lien de connexion qu’on t’a envoyé (ou un jeton GitHub).</p>
      <label class="add-row boxed">${I('link', 17)}<input id="connect-input" placeholder="https://…#connecter=…" data-enter="connect" autocomplete="off" spellcheck="false"></label>
      <div class="btn-row"><button class="btn primary" data-action="connect">Connecter</button></div>
    </div>`}
    ${msg}
    ${installTipHTML()}
    <div class="set-group">
      <h4>Historique</h4>
      <p class="muted small">Chaque modification est gardée : tu peux revenir en arrière à tout moment.</p>
      <div class="btn-row">${on ? `<button class="btn" data-action="load-history">${I('history', 16)}Versions en ligne</button>` : ''}<button class="btn" data-action="load-local-history">${I('phone', 16)}Copies sur cet appareil</button></div>
      ${historyListHTML(m)}
    </div>
    <div class="set-group">
      <h4>Fichier de sauvegarde</h4>
      <div class="btn-row"><button class="btn" data-action="export">${I('download', 16)}Télécharger</button><label class="btn">${I('upload', 16)}Importer<input type="file" accept="application/json,.json" id="import-file" hidden></label></div>
    </div>
    <div class="set-group danger-zone">
      <h4>Zone sensible</h4>
      <div class="btn-row">${on ? '<button class="btn ghost" data-action="disconnect">Déconnecter cet appareil</button>' : ''}<button class="btn ghost danger" data-action="reset">Repartir de zéro</button></div>
    </div>`;
}
function installTipHTML() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (!ios || standalone) return '';
  return `<div class="tip">${I('phone', 19)}<div><b>Ajoute l’atelier à l’écran d’accueil</b><small>Dans Safari : Partager → « Sur l’écran d’accueil ». Il s’ouvrira comme une appli et l’iPhone ne l’effacera jamais. Une fois dedans, rouvre le lien de connexion.</small></div></div>`;
}
function historyListHTML(m) {
  const h = m.hist;
  if (!h) return '';
  if (h === 'loading') return '<p class="muted small">Chargement…</p>';
  if (h.error) return `<p class="msg err">${esc(h.error)}</p>`;
  if (!h.items.length) return '<p class="muted small">Rien pour l’instant.</p>';
  return `<ul class="hist">${h.items.map((x) => `<li><div><b>${esc(x.label)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</div><button class="btn small" data-action="restore" data-src="${h.src}" data-ref="${esc(x.ref)}">Revenir à cette version</button></li>`).join('')}</ul>
    ${h.more ? `<button class="link-btn" data-action="load-history" data-page="${h.page + 1}">Voir plus ancien</button>` : ''}`;
}

/* ---------- Bienvenue / lien de connexion ---------- */
function welcomeHTML(m) {
  const msg = m.msg ? `<p class="msg ${m.err ? 'err' : 'ok'}">${esc(m.msg)}</p>` : '';
  if (m.link) {
    return `<div class="sheet-scroll welcome"><span class="mark big" aria-hidden="true"><i></i><i></i></span>
      <h2>Connecter cet appareil ?</h2>
      <p>Il retrouvera tous les projets de l’atelier, et tout ce que tu feras ici sera enregistré en ligne.</p>${msg}
      <div class="btn-col"><button class="btn primary big" data-action="welcome-connect">Connecter</button><button class="btn ghost" data-action="close-sheet">Pas maintenant</button></div></div>`;
  }
  return `<div class="sheet-scroll welcome"><span class="mark big" aria-hidden="true"><i></i><i></i></span>
    <h2>Bienvenue dans ton atelier ✨</h2>
    <p>Tes binds perso d’un côté, les commandes de l’autre, et au milieu ce que tu fais aujourd’hui.</p>
    <div class="welcome-card"><b>Tu as reçu un lien de connexion ?</b>
      <label class="add-row boxed">${I('link', 17)}<input id="connect-input" placeholder="Colle-le ici" data-enter="connect" autocomplete="off" spellcheck="false"></label>
      <button class="btn primary" data-action="connect">Connecter</button>${msg}</div>
    <div class="btn-col"><button class="btn" data-action="start-blank">Commencer à zéro</button><button class="btn ghost" data-action="start-demo">Découvrir avec des exemples</button></div></div>`;
}

/* ---------- Petites fenêtres ---------- */
const popHead = (t) => `<div class="pop-head"><b>${t}</b><button class="icon-btn mini" data-action="close-pop" aria-label="Fermer">${I('x', 16)}</button></div>`;
function emojiHTML() {
  return `${popHead('Choisis un emoji')}
    <div class="emoji-grid">${EMOJIS.map((e) => `<button data-action="emoji-set" data-e="${e}">${e}</button>`).join('')}</div>
    <label class="add-row boxed">${I('sparkles', 16)}<input id="emoji-input" placeholder="Ou tape n’importe quel emoji" data-enter="emoji-custom" autocomplete="off" enterkeyhint="done"></label>`;
}
function coverHTML(m) {
  const p = P(m.id); if (!p) return '';
  return `${popHead('Couverture')}
    <div class="cover-grid">
      <button class="cv tint cover-auto ${!p.cover ? 'on' : ''}" style="--c:${sideColor(p.side)}" data-action="cover-set" data-v=""><span>Auto</span></button>
      ${Object.entries(COVERS).map(([k, css]) => `<button class="cv ${p.cover && p.cover.t === 'grad' && p.cover.v === k ? 'on' : ''}" style="background:${css}" data-action="cover-set" data-v="${k}" aria-label="${k}"></button>`).join('')}
    </div>
    <label class="btn wide">${I('image', 16)}${m.busy ? 'Préparation de l’image…' : 'Mettre une photo'}<input type="file" accept="image/*" id="cover-file" hidden></label>`;
}
function askHTML(m) {
  return `<div class="ask"><h3>${esc(m.title)}</h3>${m.text ? `<p>${esc(m.text)}</p>` : ''}
    <div class="ask-btns"><button class="btn ghost" data-action="ask-no">${esc(m.no || 'Annuler')}</button><button class="btn ${m.danger ? 'danger-fill' : 'primary'}" data-action="ask-yes">${esc(m.ok || 'OK')}</button></div></div>`;
}
function celebrateHTML(m) {
  const p = P(m.id); if (!p) return '';
  const dd = p.deliverables.filter((d) => d.done).length;
  return `<div class="celebrate tint" style="--c:${sideColor(p.side)}">
    <div class="cel-emo">${esc(p.icon)}</div>
    <h2>Toutes les étapes sont faites !</h2>
    <p>Avant de ranger <b>${esc(p.title)}</b> avec tes livres terminés, il reste ton dossier de livrables.</p>
    ${p.side === 'pro' && (p.client || p.contact) ? `<p class="cel-client">${I('user', 15)}${esc([p.client, p.contact].filter(Boolean).join(' · '))}</p>` : ''}
    <ul class="rows cel-list">${p.deliverables.map((d) => `<li class="row ${d.done ? 'done' : ''}${flashed(d.id) ? ' flash' : ''}" data-id="${d.id}"><button class="tick" data-action="livr-toggle" data-p="${p.id}" data-d="${d.id}" aria-label="Cocher">${I('check', 14)}</button><span class="row-label">${esc(d.name)}</span></li>`).join('')}</ul>
    <div class="cel-foot"><span class="muted">${dd}/${p.deliverables.length}</span><button class="btn ghost" data-action="open-project" data-id="${p.id}">Voir la fiche</button><button class="btn primary" data-action="close-pop">Plus tard</button></div>
  </div>`;
}
function paletteHTML(m) {
  return `<label class="pal-in">${I('search', 19)}<input id="pal-input" value="${esc(m.q || '')}" placeholder="Rechercher un livre, créer, ajouter une tâche…" autocomplete="off" spellcheck="false" data-autofocus enterkeyhint="go"></label>
    <ul class="pal-list">${paletteListHTML(m)}</ul>`;
}
function paletteListHTML(m) {
  m.items = paletteItems(m.q || '');
  m.sel = Math.max(0, Math.min(m.sel || 0, m.items.length - 1));
  if (!m.items.length) return '<li class="pal-empty">Rien trouvé</li>';
  return m.items.map((it, i) => `<li><button class="pal-item ${i === m.sel ? 'sel' : ''}" data-action="pal-run" data-i="${i}"><span class="pal-ic">${it.ic}</span><span class="pal-txt">${it.label}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button></li>`).join('');
}
function paletteItems(q) {
  const f = fold(q).trim(); const out = []; const raw = q.trim();
  state.projects
    .filter((p) => !f || fold(p.title).includes(f) || fold(p.client).includes(f) || fold(p.kind).includes(f))
    .sort((a, b) => a.archived - b.archived)
    .slice(0, f ? 8 : 5)
    .forEach((p) => out.push({ ic: esc(p.icon), label: esc(p.title), sub: (p.archived ? 'Terminé · ' : '') + state.sides[p.side].name, run: () => openSheet({ type: 'page', id: p.id }) }));
  if (f) {
    SIDES.forEach((side) => out.push({ ic: I('plus', 16), label: `Nouveau projet « ${esc(raw)} »`, sub: state.sides[side].name, run: () => openSheet({ type: 'new', side, draft: { title: raw } }) }));
    out.push({ ic: I('sun', 16), label: `Ajouter « ${esc(raw)} » à aujourd’hui`, sub: 'Tâche libre', run: () => addFree(raw) });
  }
  const nav = [
    [I('plus', 16), `Nouveau projet · ${state.sides.perso.name}`, () => openSheet({ type: 'new', side: 'perso' })],
    [I('plus', 16), `Nouveau projet · ${state.sides.pro.name}`, () => openSheet({ type: 'new', side: 'pro' })],
    [I('book', 16), 'Livres terminés', () => openSheet({ type: 'archives' })],
    [I('palette', 16), 'Apparence et thème', () => openSettings('apparence')],
    [I('layers', 16), 'Étapes et livrables par défaut', () => openSettings('espaces')],
    [I('cloud', 16), 'Mémoire et synchro', () => openSettings('memoire')],
    [I('moon', 16), 'Basculer clair / sombre', () => toggleTheme()],
  ];
  nav.filter(([, l]) => !f || fold(l).includes(f)).forEach(([ic, label, run]) => out.push({ ic, label: esc(label), run }));
  return out.slice(0, 14);
}

/* ---------- Messages ---------- */
function toast(msg, { action, onAction, timeout } = {}) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').addEventListener('click', () => { onAction(); el.remove(); });
  root.appendChild(el);
  while (root.children.length > 2) root.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, timeout || (action ? 6000 : 3000));
}

/* Zones de texte qui s'agrandissent toutes seules */
function autoGrow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
function autoGrowAll(root) { $$('textarea.page-title, textarea.notes', root).forEach(autoGrow); }
