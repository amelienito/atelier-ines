'use strict';
/* =====================================================================
   ATELIER · affichage
   Chaque livre est une carte qui se remplit de sa couleur, comme de
   l'eau, au fil des étapes faites. Rien de rigide : des formes douces,
   un fond qui respire, des gestes qui répondent.
   ===================================================================== */

const ui = { sheet: null, pop: null, tab: 'today', expanded: null, flash: null, archFilter: 'tout', setTab: 'apparence' };

/* ---------- Icônes ---------- */
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  grip: '<circle cx="9" cy="6" r="1.1"/><circle cx="15" cy="6" r="1.1"/><circle cx="9" cy="12" r="1.1"/><circle cx="15" cy="12" r="1.1"/><circle cx="9" cy="18" r="1.1"/><circle cx="15" cy="18" r="1.1"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
  books: '<path d="M4 4h4v16H4zM9 4h4v16H9z"/><path d="m14.5 5.2 3.9-1 3.6 14.6-3.9 1z"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  stack: '<rect x="3" y="15" width="18" height="5" rx="1"/><rect x="5" y="9.5" width="15" height="5" rx="1"/><rect x="3.5" y="4" width="16" height="5" rx="1"/>',
};
const I = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const flashed = (id) => !!(ui.flash && ui.flash.has(id));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const longToday = () => cap(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));

function shortName(side) {
  const w = state.sides[side].name.trim().split(/\s+/);
  return cap(w.length > 1 && w[0].length > 7 ? w[w.length - 1] : w[0]);
}
const ago = (t) => {
  const s = Math.round((now() - t) / 1000);
  if (s < 60) return 'à l’instant';
  const mn = Math.round(s / 60); if (mn < 60) return `il y a ${mn} min`;
  const h = Math.round(mn / 60); if (h < 24) return `il y a ${h} h`;
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/* ---------- Variables visuelles d'un livre ---------- */
/* Niveau de remplissage : 0 à 1. Si une étape vient d'être cochée, on part
   de l'ancien niveau pour que la couleur monte (ou descende) doucement. */
function fillOf(p) {
  const pr = progress(p); const ph = phase(p);
  const lv = ph === 'livrables' || ph === 'fini' || p.archived ? 1 : pr.total ? pr.done / pr.total : 0;
  const st = p.steps.find((x) => flashed(x.id));
  const from = st && pr.total ? Math.min(1, Math.max(0, (pr.done + (st.done ? -1 : 1)) / pr.total)) : null;
  return { lv, from };
}
function bookVars(p) {
  const img = p.cover && p.cover.t === 'img';
  const u = img ? Covers.url(p.cover.key) : '';
  const f = fillOf(p);
  return {
    style: `--cl:${p.cloth};--p:${f.lv.toFixed(3)}${f.from !== null ? `;--p0:${f.from.toFixed(3)}` : ''}${u ? `;--img:url('${u}')` : ''}`,
    ink: 'ink',
    cls: (img ? (u ? ' has-img' : ' img-wait') : '') + (f.from !== null ? ' rise' : ''),
    cover: img ? ` data-cover="${esc(p.cover.key)}"` : '',
  };
}
/* L'eau colorée (deux vagues qui bougent lentement) */
const LQ = '<span class="lq" aria-hidden="true"></span>';
/* Pastille de couleur d'un livre */
const chip = (p) => `<i class="chip" style="--cl:${p.cloth}" aria-hidden="true"></i>`;

/* Une bulle par étape : pleine quand elle est faite */
function toolingHTML(p, nx = nextStep(p), cls = '') {
  const pr = progress(p); if (!pr.total) return '';
  return `<div class="tool ${cls}" role="img" aria-label="${pr.done} étapes faites sur ${pr.total}">${p.steps.map((s) => `<i class="${s.done ? 'g' : ''}${s === nx ? ' n' : ''}${flashed(s.id) ? ' just' : ''}"></i>`).join('')}<span class="tool-n">${pr.done} sur ${pr.total}</span></div>`;
}

/* ---------- Apparence générale ---------- */
function applyPrefs() {
  const pr = state.prefs; const root = document.documentElement;
  const dark = pr.theme === 'sombre' || (pr.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  document.body.dataset.density = pr.density;
  document.body.classList.toggle('calm', calm());
  root.style.setProperty('--perso', state.sides.perso.color);
  root.style.setProperty('--pro', state.sides.pro.color);
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = dark ? '#16132b' : '#f1edf6';
}

function renderAll() { applyPrefs(); renderTop(); renderMain(); renderTabbar(); renderSheet(); renderPop(); }

/* =====================================================================
   EN-TÊTE
   ===================================================================== */
function renderTop() {
  const na = archivedProjects().length;
  $('#top').innerHTML = `
    <h1 class="logo" role="img" aria-label="Parinès, atelier"></h1>
    <p class="today-date">${esc(greeting())}<span>${esc(longToday())}</span></p>
    <div class="top-actions">
      <button class="top-btn search" data-action="palette"><span>Chercher</span><kbd>${isMac ? '⌘' : 'Ctrl '}K</kbd></button>
      <button class="top-btn icon-only" data-action="palette" aria-label="Chercher">${I('search', 20)}</button>
      ${syncBtn()}
      <button class="top-btn hide-phone" data-action="open-archives">Terminés${na ? `<span class="n">${na}</span>` : ''}</button>
      <button class="top-btn" data-action="open-settings" aria-label="Réglages"><span class="hide-phone">Réglages</span><span class="show-phone">${I('sliders', 20)}</span></button>
    </div>`;
}
function greeting() {
  const h = new Date().getHours(); const who = (state.user || '').trim();
  const w = h >= 5 && h < 12 ? 'Bonjour' : h >= 12 && h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return who ? `${w} ${who}` : w;
}
function syncBtn() {
  const map = {
    off: ['Sur cet appareil', 'Rien n’est en ligne pour l’instant : branche la synchro dans Réglages'],
    pending: ['Enregistrement…', 'Envoi en ligne en cours'], saving: ['Enregistrement…', 'Envoi en ligne en cours'],
    ok: ['Enregistré', 'Tout est enregistré en ligne'],
    offline: ['Hors ligne', 'Gardé sur l’appareil, envoyé au retour du réseau'],
    error: ['Synchro en panne', Sync.msg || 'La synchro a un souci'],
  };
  const [label, t] = map[Sync.status] || map.off;
  return `<button class="top-btn sync sync-${Sync.status}" data-action="open-settings" data-tab="memoire" title="${esc(t)}" aria-label="${esc(t)}"><i class="dot"></i><span class="hide-phone">${label}</span></button>`;
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
    <div class="layout">${pileHTML('perso')}${todayHTML()}${pileHTML('pro')}</div>
    <section class="ledger ${state.prefs.tables ? '' : 'phone-only'}">${ledgerHTML()}</section>`;
}

/* ---------- Une pile de livres ---------- */
function pileHTML(side) {
  const sd = state.sides[side]; const list = activeProjects(side); const ex = ui.expanded === side;
  return `
  <section class="pile-zone" data-side="${side}">
    <header class="pile-head">
      <i class="space-chip" style="--cl:${sd.color}" aria-hidden="true"></i>
      <h2 class="pile-name" contenteditable="plaintext-only" data-space-name="${side}" spellcheck="false" aria-label="Nom de cette pile (modifiable)">${esc(sd.name)}</h2>
      <span class="pile-n">${list.length ? plural(list.length, 'livre en cours', 'livres en cours') : 'aucun livre'}</span>
      <span class="grow"></span>
      <button class="ghost-btn hide-phone" data-action="expand" data-side="${side}" title="${ex ? 'Revenir à la vue complète' : 'Agrandir cette pile'}" aria-label="${ex ? 'Revenir à la vue complète' : 'Agrandir cette pile'}">${I(ex ? 'shrink' : 'expand', 17)}</button>
      <button class="new-btn" data-action="new-project" data-side="${side}">${I('plus', 17)}<span>Nouveau livre</span></button>
    </header>
    ${list.length ? `<ul class="pile" data-sortable="side-${side}">${list.map(spineHTML).join('')}</ul>`
      : `<button class="spine-ghost" data-action="new-project" data-side="${side}"><span>${I('plus', 22)}</span>Aucun livre en cours ici.<b>Commencer un livre</b></button>`}
  </section>`;
}

function spineHTML(p) {
  const ph = phase(p); const nx = nextStep(p); const ty = typeOf(p); const b = bookVars(p);
  const on = nx && inToday(p.id, nx.id);
  let line;
  if (ph === 'livrables') {
    const d = p.deliverables.filter((x) => x.done).length;
    line = `<button class="ribbon" data-action="open-celebrate" data-id="${p.id}">${I('check', 15)}Plus que les livrables, ${d} sur ${p.deliverables.length}</button>`;
  } else if (nx) {
    /* La prochaine étape a sa propre case : on la coche là où on la lit */
    line = `<div class="sp-step">
      <button class="box sp-box" data-action="quick-done" data-p="${p.id}" data-s="${nx.id}" aria-label="Cocher « ${esc(nx.name)} »">${I('check', 15)}</button>
      <p class="sp-next"><em>Ensuite</em>${esc(nx.name)}</p>
      <button class="sp-sun ${on ? 'on' : ''}" data-action="toggle-today" data-p="${p.id}" data-s="${nx.id}" aria-pressed="${on}" title="${on ? 'Retirer d’aujourd’hui' : 'Prévoir pour aujourd’hui'}">${I('sun', 18)}<span>${on ? 'Aujourd’hui' : 'Pour aujourd’hui'}</span></button>
    </div>`;
  } else {
    line = '<p class="sp-next sp-none">Aucune étape pour l’instant. Ouvre le livre pour en ajouter.</p>';
  }
  return `
  <li class="spine ph-${ph}${b.cls}${flashed(p.id) ? ' flash' : ''}" data-id="${p.id}" data-action="open-project" style="${b.style}"${b.cover}>
    ${LQ}
    <div class="sp-row">
      <h3 class="sp-title">${esc(p.title)}</h3>
      ${ty || p.client ? `<span class="sp-tags">${ty ? `<span>${esc(ty.name)}</span>` : ''}${p.client ? `<span>pour ${esc(p.client)}</span>` : ''}</span>` : ''}
    </div>
    ${line}
    ${toolingHTML(p, nx)}
  </li>`;
}

/* ---------- Aujourd'hui ---------- */
function todayHTML() {
  const es = todayEntries(); const done = es.filter((e) => e.done).length;
  const sug = suggestions(es.length ? 3 : 5);
  const lv = es.length ? done / es.length : 0;
  return `
  <aside class="today">
    <header class="td-head">
      <div><h2>Aujourd’hui</h2><p class="td-date">${esc(longToday())}</p></div>
      ${es.length ? `<div class="td-drop${done === es.length ? ' full' : ''}" style="--p:${lv.toFixed(3)}" role="img" aria-label="${done} fait sur ${es.length}">${LQ}<span class="td-count">${done === es.length ? I('check', 22) : `<b>${done}</b><small>sur ${es.length}</small>`}</span></div>` : ''}
    </header>
    ${es.length ? `<ul class="td-list" data-sortable="today">${es.map(todoHTML).join('')}</ul>` : '<p class="td-empty">Rien de prévu. Note une tâche ou pioche dans les étapes à suivre.</p>'}
    <label class="td-add">${I('plus', 18)}<input id="free-input" type="text" placeholder="Noter une tâche" data-enter="add-free" autocomplete="off" enterkeyhint="done"></label>
    ${sug.length ? `<div class="td-sugg"><h4>Pour la suite</h4><div class="sugg-list">${sug.map(({ p, st }) => `
      <button class="sugg" data-action="today-add" data-p="${p.id}" data-s="${st.id}" style="--cl:${p.cloth}">
        <span class="sugg-plus">${I('plus', 14)}</span><span class="sugg-txt"><b>${esc(st.name)}</b><small>${esc(p.title)}</small></span>
      </button>`).join('')}</div></div>` : ''}
    <button class="td-pick" data-action="open-picker">${I('stack', 17)}Choisir parmi toutes les étapes</button>
    ${miniOverviewHTML()}
  </aside>`;
}
function todoHTML(e) {
  const fl = flashed(e.it.id) ? ' flash' : '';
  const tag = e.it.carried && !e.done ? '<span class="tag">d’hier</span>' : '';
  const x = `<button class="x" data-action="today-remove" data-id="${e.it.id}" aria-label="Retirer de la liste">${I('x', 15)}</button>`;
  const box = `<button class="box" data-action="today-toggle" data-id="${e.it.id}" aria-label="${e.done ? 'Décocher' : 'Cocher'}">${I('check', 15)}</button>`;
  if (e.free) {
    return `<li class="td-item free ${e.done ? 'done' : ''}${fl}" data-id="${e.it.id}">${box}
      <div class="td-txt"><input class="td-free" value="${esc(e.it.text)}" data-free="${e.it.id}" aria-label="Tâche" enterkeyhint="done"></div>${tag}${x}</li>`;
  }
  return `<li class="td-item ${e.done ? 'done' : ''}${fl}" data-id="${e.it.id}" style="--cl:${e.p.cloth}">${box}
    <div class="td-txt"><b>${esc(e.st.name)}</b><button class="td-book" data-action="open-project" data-id="${e.p.id}">${chip(e.p)}${esc(e.p.title)}</button></div>${tag}${x}</li>`;
}
/* Résumé de tous les livres (téléphone, sous « Aujourd'hui ») */
function miniOverviewHTML() {
  const all = SIDES.flatMap((s) => activeProjects(s));
  const na = archivedProjects().length;
  if (!all.length && !na) return '';
  return `<div class="mini-ov"><h4>Tous les livres en cours</h4>${all.map((p) => {
    const pr = progress(p); const ph = phase(p);
    return `<button class="mini-row" data-action="open-project" data-id="${p.id}">${chip(p)}<b>${esc(p.title)}</b><span class="mini-n">${ph === 'livrables' ? 'livrables' : `${pr.done}/${pr.total}`}</span></button>`;
  }).join('')}${na ? `<button class="mini-row mini-arch" data-action="open-archives">${I('books', 16)}<b>Livres terminés</b><span class="mini-n">${na}</span></button>` : ''}</div>`;
}

/* ---------- Vue d'ensemble : le grand cahier ---------- */
function ledgerHTML() {
  const na = archivedProjects().length;
  return `<header class="lg-head"><h2>Vue d’ensemble</h2><p>Une ligne par livre, une colonne par étape. Touche une pastille pour la cocher.</p>
      ${na ? `<button class="ghost-btn text" data-action="open-archives">${I('books', 16)}${plural(na, 'livre terminé', 'livres terminés')}</button>` : ''}</header>
    <div class="lg-tables">${SIDES.map(tableHTML).join('')}</div>`;
}
function tableHTML(side) {
  const sd = state.sides[side]; const list = activeProjects(side); const cols = sd.steps;
  const tplIds = new Set(cols.map((c) => c.id)); const collapsed = !!(LOCAL.collapsed || {})[side];
  const head = `<tr><th class="lg-name"></th><th class="lg-v"><span>Type</span></th>${cols.map((c) => `<th class="lg-v"><span>${esc(c.name)}</span></th>`).join('')}<th class="lg-v"><span>Autres</span></th><th class="lg-v"><span>Début</span></th><th class="lg-v"><span>Fin</span></th></tr>`;
  const rows = list.map((p) => {
    const others = p.steps.filter((s) => !s.tpl || !tplIds.has(s.tpl)); const od = others.filter((s) => s.done).length; const ty = typeOf(p);
    return `<tr class="ph-${phase(p)}" style="--cl:${p.cloth}">
      <th class="lg-name"><button data-action="open-project" data-id="${p.id}">${chip(p)}<span>${esc(p.title)}</span></button></th>
      <td>${ty ? `<span class="lg-type" style="--t:${ty.color}" title="${esc(ty.name)}"></span>` : ''}</td>
      ${cols.map((c) => {
        const st = p.steps.find((s) => s.tpl === c.id);
        if (!st) return '<td><span class="cell na" title="Pas concerné"></span></td>';
        return `<td><button class="cell ${st.done ? 'on' : ''}${flashed(st.id) ? ' just' : ''}" data-action="cell-toggle" data-p="${p.id}" data-s="${st.id}" title="${esc(c.name)}" aria-pressed="${st.done}">${I('check', 13)}</button></td>`;
      }).join('')}
      <td>${others.length ? `<button class="cell other ${od === others.length ? 'on' : ''}" data-action="open-project" data-id="${p.id}" title="${esc(others.map((s) => s.name).join(', '))}">${od}/${others.length}</button>` : ''}</td>
      <td class="lg-date">${shortDate(p.start) || '<i class="lg-nil">–</i>'}</td><td class="lg-date">${shortDate(p.end) || '<i class="lg-nil">–</i>'}</td>
    </tr>`;
  }).join('');
  return `<div class="lg ${collapsed ? 'collapsed' : ''}" data-side="${side}">
    <header class="lg-sub">
      <button class="lg-toggle" data-action="toggle-table" data-side="${side}" aria-expanded="${!collapsed}">${I('chevron', 16)}<i class="space-chip" style="--cl:${sd.color}"></i><b>${esc(sd.name)}</b></button>
      <button class="ghost-btn text" data-action="open-settings" data-tab="espaces" data-side="${side}">Modifier les colonnes</button>
    </header>
    ${collapsed ? '' : list.length ? `<div class="lg-scroll"><table>${head}${rows}</table></div>` : '<p class="lg-empty">Aucun livre en cours.</p>'}
  </div>`;
}

/* ---------- Onglets (téléphone) ---------- */
function renderTabbar() {
  const n = todayEntries().filter((e) => !e.done).length;
  const tabs = [['today', 'Aujourd’hui', n, ''], ['perso', shortName('perso'), activeProjects('perso').length, state.sides.perso.color], ['pro', shortName('pro'), activeProjects('pro').length, state.sides.pro.color], ['tables', 'Ensemble', 0, '']];
  $('#tabbar').innerHTML = tabs.map(([k, label, c, col]) => `
    <button class="tab ${ui.tab === k ? 'on' : ''}" data-action="tab" data-tab="${k}">${col ? `<i class="space-chip" style="--cl:${col}"></i>` : ''}<span>${esc(label)}</span>${c ? `<small>${c}</small>` : ''}</button>`).join('');
  document.body.dataset.tab = ui.tab;
}

/* =====================================================================
   FENÊTRES
   ===================================================================== */
const sheetKey = (m) => m.type + ':' + (m.id || m.side || '');
function lockBody() { document.body.classList.toggle('locked', !!(ui.sheet || ui.pop)); }

function renderSheet() {
  const root = $('#sheet-root'); const m = ui.sheet;
  if (!m) { root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const kinds = { page: [pageHTML, 'book'], new: [newHTML, 'modal'], picker: [pickerHTML, 'modal'], archives: [archivesHTML, 'modal wide'], settings: [settingsHTML, 'modal wide'], welcome: [welcomeHTML, 'modal'] };
  const [fn, cls] = kinds[m.type] || [];
  const html = fn ? fn(m) : '';
  if (!html) { ui.sheet = null; root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const key = sheetKey(m);
  const ex = $('.sheet', root);
  if (ex && root.dataset.key === key) {
    const sc = $('.sheet-scroll', ex); const top = sc ? sc.scrollTop : 0;
    ex.innerHTML = html;
    const sc2 = $('.sheet-scroll', ex); if (sc2) sc2.scrollTop = top;
  } else {
    root.innerHTML = `<div class="scrim${cls === 'book' ? ' dim' : ''}" data-action="close-sheet"></div><section class="sheet ${cls} sheet-${m.type}" role="dialog" aria-modal="true">${html}</section>`;
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
  const kinds = { ask: askHTML, celebrate: celebrateHTML, palette: paletteHTML };
  const html = kinds[m.type] ? kinds[m.type](m) : '';
  if (!html) { ui.pop = null; root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const key = sheetKey(m);
  const ex = $('.pop', root);
  if (ex && root.dataset.key === key) ex.innerHTML = html;
  else {
    root.innerHTML = `<div class="scrim" data-action="close-pop"></div><div class="pop pop-${m.type}" role="dialog" aria-modal="true">${html}</div>`;
    root.dataset.key = key;
    const af = $('[data-autofocus]', root); if (af) setTimeout(() => af.focus(), 60);
  }
  lockBody();
}

const sheetHead = (title, sub = '') => `
  <div class="sheet-head">
    <div class="sheet-title"><h2>${title}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>
    <button class="close" data-action="close-sheet" aria-label="Fermer">${I('x', 20)}</button>
  </div>`;

/* ---------- Le livre ouvert (fiche projet) ---------- */
function rowHTML(kind, p, x) {
  const isStep = kind === 'step';
  const attrs = isStep ? `data-p="${p.id}" data-s="${x.id}"` : `data-p="${p.id}" data-d="${x.id}"`;
  const on = isStep && inToday(p.id, x.id);
  return `<li class="row ${x.done ? 'done' : ''}${flashed(x.id) ? ' flash' : ''}" data-id="${x.id}">
    <span class="grip" aria-hidden="true">${I('grip', 15)}</span>
    <button class="box" data-action="${isStep ? 'step-toggle' : 'livr-toggle'}" ${attrs} aria-label="${x.done ? 'Décocher' : 'Cocher'}">${I('check', 14)}</button>
    <input class="row-name" value="${esc(x.name)}" ${isStep ? `data-step-name="${x.id}"` : `data-livr-name="${x.id}"`} aria-label="Nom" enterkeyhint="done">
    ${isStep && !x.done ? `<button class="row-sun ${on ? 'on' : ''}" data-action="toggle-today" ${attrs} title="${on ? 'Retirer d’aujourd’hui' : 'Faire aujourd’hui'}" aria-label="${on ? 'Retirer d’aujourd’hui' : 'Faire aujourd’hui'}">${I('sun', 16)}</button>` : ''}
    <button class="x row-x" data-action="${isStep ? 'step-remove' : 'livr-remove'}" ${attrs} aria-label="Retirer">${I('x', 14)}</button>
  </li>`;
}
function clothPicker(action, current, extra = '') {
  return `<div class="cloths">${CLOTHS.map(([n, hex]) => `<button class="cloth ${current === hex ? 'on' : ''}" style="--cl:${hex}" data-action="${action}" data-hex="${hex}"${extra} title="${n}" aria-label="Couleur ${n}" aria-pressed="${current === hex}">${I('check', 15)}</button>`).join('')}</div>`;
}
function pageHTML(m) {
  const p = P(m.id); if (!p) return '';
  const sd = state.sides[p.side]; const pr = progress(p); const ph = phase(p); const nx = nextStep(p); const b = bookVars(p);
  const dd = p.deliverables.filter((d) => d.done).length;
  const dateFr = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const hasImg = p.cover && p.cover.t === 'img';
  const ty = typeOf(p);
  const state1 = p.archived ? 'Terminé' : ph === 'livrables' ? 'Plus que les livrables' : pr.total ? `${pr.done} étape${pr.done > 1 ? 's' : ''} faite${pr.done > 1 ? 's' : ''} sur ${pr.total}` : 'Aucune étape';
  return `
  <div class="sheet-scroll book-scroll" data-action="close-self">
    <article class="spread${b.cls}" style="${b.style}"${b.cover}>
      <header class="pg-hero">
        ${LQ}
        <button class="book-close" data-action="close-sheet" aria-label="Fermer">${I('x', 20)}</button>
        <p class="pg-kicker"><i class="space-chip" style="--cl:${sd.color}"></i>${esc(sd.name)}${ty ? `<span class="pg-type" style="--t:${ty.color}">${esc(ty.name)}</span>` : ''}</p>
        <textarea class="pg-title" data-pfield="title" rows="1" aria-label="Titre du livre" spellcheck="false">${esc(p.title)}</textarea>
        <p class="pg-state">${state1}</p>
      </header>
      <div class="leaves">
        <section class="leaf leaf-a">
          ${p.archived ? `<div class="banner"><span>Terminé${p.archivedAt ? ' le ' + dateFr(p.archivedAt) : ''}.</span><button class="btn small" data-action="unarchive" data-id="${p.id}">Le remettre en cours</button></div>` : ''}
          <div class="props">
            <div class="prop"><span class="prop-k">Type</span><div class="prop-v chips">${sd.types.map((t) => `<button class="type-pick ${p.kind === t.name ? 'on' : ''}" style="--t:${t.color}" data-action="set-kind" data-id="${p.id}" data-kind="${esc(t.name)}">${esc(t.name)}</button>`).join('') || '<span class="muted">Aucun type, à créer dans Réglages</span>'}</div></div>
            ${p.side === 'pro' || p.client || p.contact ? `
            <label class="prop"><span class="prop-k">Cliente</span><input class="prop-in" data-pfield="client" value="${esc(p.client)}" placeholder="Son nom" enterkeyhint="done"></label>
            <label class="prop"><span class="prop-k">Contact</span><input class="prop-in" data-pfield="contact" value="${esc(p.contact)}" placeholder="Insta, mail, téléphone" enterkeyhint="done"></label>` : ''}
            <label class="prop"><span class="prop-k">Début</span><input class="prop-in" type="date" data-pfield="start" value="${esc(p.start)}"></label>
            <label class="prop"><span class="prop-k">Fin</span><input class="prop-in" type="date" data-pfield="end" value="${esc(p.end)}"></label>
          </div>
        </section>

        <section class="leaf leaf-b">
          <div class="sec-head"><h3>Étapes</h3><span class="sec-count">${pr.done} sur ${pr.total}</span></div>
          ${toolingHTML(p, nx, 'on-paper')}
          <ul class="rows" data-sortable="steps">${p.steps.map((st) => rowHTML('step', p, st)).join('')}</ul>
          <label class="add-row">${I('plus', 17)}<input id="step-input" placeholder="Ajouter une étape" data-enter="add-step" data-id="${p.id}" autocomplete="off" enterkeyhint="done"></label>

          <div class="livr ${ph === 'livrables' ? 'is-due' : ''}">
            <div class="sec-head"><h3>Livrables de fin</h3><span class="sec-count">${dd} sur ${p.deliverables.length}</span></div>
            <p class="sec-hint">${ph === 'livrables' ? 'Toutes les étapes sont faites. Coche le dossier et le livre passera dans les terminés.' : 'Le dossier à préparer une fois toutes les étapes faites.'}</p>
            <ul class="rows" data-sortable="livr">${p.deliverables.map((d) => rowHTML('livr', p, d)).join('')}</ul>
            <label class="add-row">${I('plus', 17)}<input id="livr-input" placeholder="Ajouter un livrable" data-enter="add-livr" data-id="${p.id}" autocomplete="off" enterkeyhint="done"></label>
          </div>
        </section>

        <section class="leaf leaf-c">
          <div class="sec-head"><h3>Couleur</h3></div>
          ${clothPicker('set-cloth', p.cloth, ` data-id="${p.id}"`)}
          <div class="photo-row">
            <label class="btn">${I('image', 17)}${hasImg ? 'Changer la photo' : 'Ajouter une photo'}<input type="file" accept="image/*" id="cover-file" hidden></label>
            ${hasImg ? `<button class="btn quiet" data-action="remove-photo" data-id="${p.id}">Retirer la photo</button>` : ''}
            ${m.busy ? '<span class="muted">Préparation de l’image…</span>' : ''}
          </div>
          <div class="sec-head"><h3>Notes</h3></div>
          <textarea class="notes" data-pfield="notes" placeholder="Papier, couleurs, références, idées…">${esc(p.notes)}</textarea>
          <footer class="pg-foot">
            <span class="muted">${p.created ? 'Commencé le ' + dateFr(p.created) : ''}</span>
            <span class="grow"></span>
            <button class="btn quiet small" data-action="duplicate" data-id="${p.id}">${I('copy', 15)}Dupliquer</button>
            ${p.archived ? '' : `<button class="btn quiet small" data-action="archive-now" data-id="${p.id}">${I('archive', 15)}Ranger</button>`}
            <button class="btn quiet small danger" data-action="delete-project" data-id="${p.id}">${I('trash', 15)}Supprimer</button>
          </footer>
        </section>
      </div>
    </article>
  </div>`;
}

/* ---------- Nouveau livre ---------- */
function newHTML(m) {
  const sd = state.sides[m.side];
  m.skip = m.skip || []; m.extra = m.extra || [];
  m.draft = { title: '', kind: '', client: '', contact: '', cloth: CLOTHS[Math.floor(Math.random() * 10)][1], ...(m.draft || {}) };
  const n = sd.steps.length - m.skip.length + m.extra.length;
  return `
  ${sheetHead('Nouveau livre', sd.name)}
  <div class="sheet-scroll">
    <div class="spine preview" style="--cl:${m.draft.cloth};--p:.18">
      ${LQ}
      <div class="sp-row"><h3 class="sp-title" id="np-title">${esc(m.draft.title || 'Titre du livre')}</h3></div>
      <p class="sp-next sp-none">${plural(n, 'étape', 'étapes')}</p>
    </div>
    <label class="field"><span class="field-k">Titre</span><input class="in big new-title" type="text" data-draft="title" value="${esc(m.draft.title)}" placeholder="Le Chant d’Achille" data-autofocus data-enter="create-project" autocomplete="off" enterkeyhint="go"></label>
    <div class="field"><span class="field-k">Couleur</span>${clothPicker('draft-cloth', m.draft.cloth)}</div>
    ${sd.types.length ? `<div class="field"><span class="field-k">Type</span><div class="chips">${sd.types.map((t) => `<button class="type-pick ${m.draft.kind === t.name ? 'on' : ''}" style="--t:${t.color}" data-action="draft-kind" data-kind="${esc(t.name)}">${esc(t.name)}</button>`).join('')}</div></div>` : ''}
    ${m.side === 'pro' ? `<div class="grid2">
      <label class="field"><span class="field-k">Cliente</span><input class="in" data-draft="client" value="${esc(m.draft.client)}" placeholder="Son nom" enterkeyhint="next"></label>
      <label class="field"><span class="field-k">Contact</span><input class="in" data-draft="contact" value="${esc(m.draft.contact)}" placeholder="Insta, mail, téléphone" enterkeyhint="done"></label>
    </div>` : ''}
    <div class="field">
      <span class="field-k">Étapes de ce livre <em>Touche celles dont tu n’auras pas besoin.</em></span>
      <div class="chips">
        ${sd.steps.map((t) => { const off = m.skip.includes(t.id); return `<button class="step-chip ${off ? 'off' : ''}" data-action="toggle-skip" data-id="${t.id}" aria-pressed="${!off}">${esc(t.name)}</button>`; }).join('')}
        ${m.extra.map((x, i) => `<span class="step-chip extra">${esc(x)}<button data-action="remove-extra" data-i="${i}" aria-label="Retirer ${esc(x)}">${I('x', 12)}</button></span>`).join('')}
      </div>
      <label class="add-row boxed">${I('plus', 17)}<input id="extra-input" placeholder="Autre étape, par exemple Envoi du colis" data-enter="add-extra" autocomplete="off" enterkeyhint="done"></label>
    </div>
  </div>
  <div class="sheet-foot">
    <span class="muted">${plural(n, 'étape', 'étapes')}</span>
    <button class="btn primary" data-action="create-project">Ajouter le livre</button>
  </div>`;
}

/* ---------- Choisir des étapes pour aujourd'hui ---------- */
function pickerHTML() {
  const block = (side) => {
    const sd = state.sides[side]; const list = activeProjects(side).filter((p) => nextStep(p));
    return `<div class="pick-side"><h3><i class="space-chip" style="--cl:${sd.color}"></i>${esc(sd.name)}</h3>${list.length ? list.map((p) => `
      <div class="pick-book" style="--cl:${p.cloth}"><div class="pick-title">${chip(p)}${esc(p.title)}</div><div class="chips">${p.steps.filter((s) => !s.done).map((s, i) => {
        const on = inToday(p.id, s.id);
        return `<button class="pick-chip ${on ? 'on' : ''} ${i === 0 ? 'first' : ''}" data-action="${on ? 'today-remove-step' : 'today-add'}" data-p="${p.id}" data-s="${s.id}">${on ? I('check', 13) : ''}${esc(s.name)}</button>`;
      }).join('')}</div></div>`).join('') : '<p class="muted">Rien en cours ici.</p>'}</div>`;
  };
  return `${sheetHead('Choisir pour aujourd’hui', 'Touche les étapes que tu vas faire. La première de chaque livre est la suivante dans l’ordre.')}
    <div class="sheet-scroll">${SIDES.map(block).join('')}</div>
    <div class="sheet-foot"><button class="btn primary" data-action="close-sheet">C’est bon</button></div>`;
}

/* ---------- Livres terminés ---------- */
function archivesHTML() {
  const f = ui.archFilter; const all = archivedProjects(); const list = all.filter((p) => f === 'tout' || p.side === f);
  const year = new Date().getFullYear();
  const thisYear = all.filter((p) => p.archivedAt && new Date(p.archivedAt).getFullYear() === year).length;
  const sub = all.length ? `${plural(all.length, 'livre terminé', 'livres terminés')}, dont ${thisYear} en ${year}.` : '';
  return `${sheetHead('Livres terminés', sub)}
  <div class="sheet-scroll">
    <div class="seg">${[['tout', 'Tous'], ['perso', shortName('perso')], ['pro', shortName('pro')]].map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-action="arch-filter" data-f="${k}">${esc(l)}</button>`).join('')}</div>
    ${list.length ? `<div class="shelf">${list.map((p) => {
      const b = bookVars(p); const when = p.archivedAt ? new Date(p.archivedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      return `<button class="stand${b.cls}" style="${b.style}"${b.cover} data-action="open-project" data-id="${p.id}">${LQ}<span class="st-t">${esc(p.title)}</span>${when ? `<small>Terminé le ${when}</small>` : ''}</button>`;
    }).join('')}</div>` : '<div class="empty-shelf"><p>Aucun livre terminé pour l’instant. Ils viendront se ranger ici, remplis de leur couleur.</p></div>'}
  </div>`;
}

/* ---------- Réglages ---------- */
function settingsHTML(m) {
  const tab = ui.setTab;
  const tabs = [['apparence', 'Apparence'], ['espaces', 'Piles et étapes'], ['memoire', 'Mémoire et synchro']];
  return `${sheetHead('Réglages')}
    <div class="set-tabs" role="tablist">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-action="set-tab" data-tab="${k}" role="tab" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
    <div class="sheet-scroll set-body">${tab === 'apparence' ? appearanceHTML() : tab === 'espaces' ? spacesSetHTML() : memoryHTML(m)}</div>`;
}
function appearanceHTML() {
  const pr = state.prefs;
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${pr[key] === v ? 'on' : ''}" data-action="set-pref" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const sw = (key, on, label, sub, local) => `<label class="switch-row"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" class="switch" ${on ? 'checked' : ''} data-${local ? 'local' : 'pref'}="${key}"></label>`;
  return `
    <div class="set-group"><h4>Thème</h4>${seg('theme', [['clair', 'Jour'], ['sombre', 'Nuit'], ['auto', 'Comme l’appareil']])}</div>
    <div class="set-group"><h4>Cartes des livres</h4>${seg('density', [['aeree', 'Détaillées, avec la prochaine étape'], ['compacte', 'Compactes']])}</div>
    <div class="set-group">
      ${sw('tables', pr.tables, 'Vue d’ensemble en bas de page', 'Le grand tableau façon carnet')}
    </div>
    <div class="set-group"><h4>Sur cet appareil</h4>
      ${sw('haptics', LOCAL.haptics, 'Vibrations', 'Un petit retour quand tu coches, sur iPhone et Android', true)}
      ${sw('sounds', LOCAL.sounds, 'Sons', 'Un petit tic quand tu coches', true)}
      ${sw('calm', LOCAL.calm, 'Animations réduites', 'Ni vagues, ni bulles, ni fond qui bouge', true)}
    </div>`;
}
function spacesSetHTML() {
  return SIDES.map((side) => {
    const sd = state.sides[side];
    return `<div class="space-set" id="set-${side}">
      <label class="field"><span class="field-k">Nom de la pile</span><input class="in name" data-space-name="${side}" value="${esc(sd.name)}" enterkeyhint="done"></label>
      <div class="field"><span class="field-k">Couleur</span>${clothPicker('set-color', sd.color, ` data-side="${side}"`)}</div>
      ${tplListHTML(side, 'steps', 'Étapes proposées à chaque nouveau livre', 'Nouvelle étape')}
      ${tplListHTML(side, 'deliverables', 'Livrables de fin', 'Nouveau livrable')}
      ${typesSetHTML(side)}
    </div>`;
  }).join('') + '<p class="muted small">Changer ces listes ne touche pas aux livres déjà en cours : chacun se modifie dans sa propre fiche.</p>';
}
function tplListHTML(side, key, title, ph) {
  return `<div class="tpl"><h4>${title}</h4>
    <ul class="rows" data-sortable="tpl-${side}-${key}">${state.sides[side][key].map((t) => `
      <li class="row" data-id="${t.id}"><span class="grip" aria-hidden="true">${I('grip', 15)}</span>
      <input class="row-name" value="${esc(t.name)}" data-tpl="${side}|${key}|${t.id}" enterkeyhint="done">
      <button class="x row-x" data-action="tpl-remove" data-side="${side}" data-key="${key}" data-id="${t.id}" aria-label="Supprimer ${esc(t.name)}">${I('x', 14)}</button></li>`).join('')}</ul>
    <label class="add-row">${I('plus', 17)}<input id="tpl-${side}-${key}" placeholder="${ph}" data-enter="tpl-add" data-side="${side}" data-key="${key}" autocomplete="off" enterkeyhint="done"></label></div>`;
}
function typesSetHTML(side) {
  return `<div class="tpl"><h4>Types <span class="muted">Touche la pastille pour changer sa couleur.</span></h4>
    <ul class="rows">${state.sides[side].types.map((t) => `
      <li class="row" data-id="${t.id}"><button class="type-dot" style="--t:${t.color}" data-action="cycle-type-color" data-side="${side}" data-id="${t.id}" aria-label="Changer la couleur de ${esc(t.name)}"></button>
      <input class="row-name" value="${esc(t.name)}" data-type="${side}|${t.id}" enterkeyhint="done">
      <button class="x row-x" data-action="type-remove" data-side="${side}" data-id="${t.id}" aria-label="Supprimer ${esc(t.name)}">${I('x', 14)}</button></li>`).join('')}</ul>
    <label class="add-row">${I('plus', 17)}<input id="type-${side}" placeholder="Nouveau type, par exemple Réparation" data-enter="type-add" data-side="${side}" autocomplete="off" enterkeyhint="done"></label></div>`;
}
function syncStatusHTML() {
  const s = Sync.status; const on = Sync.enabled();
  let title; let sub; let st = on ? s : 'off';
  if (!on) { title = 'Seulement sur cet appareil'; sub = 'Branche la synchro pour retrouver tout sur l’ordi, le téléphone et l’iPad, sans jamais rien perdre.'; }
  else if (['ok', 'pending', 'saving'].includes(s)) { title = s === 'ok' ? 'Tout est enregistré en ligne' : 'Enregistrement en cours'; sub = Sync.cfg.lastOk ? `Dernière synchro ${ago(Sync.cfg.lastOk)}.` : ''; st = 'ok'; }
  else if (s === 'offline') { title = 'Hors ligne pour l’instant'; sub = 'Rien n’est perdu : c’est gardé sur l’appareil et ça partira au retour du réseau.'; }
  else { title = 'La synchro a un souci'; sub = Sync.msg; }
  return `<div class="sync-card st-${st}" id="sync-status"><i class="dot"></i><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>${on ? '<button class="btn small" data-action="sync-now">Synchroniser</button>' : ''}</div>`;
}
function memoryHTML(m) {
  const on = Sync.enabled();
  const msg = m.msg ? `<p class="msg ${m.err ? 'err' : 'ok'}">${esc(m.msg)}</p>` : '';
  return `
    ${syncStatusHTML()}
    ${on ? `<div class="set-group">
      <h4>Connecter un autre appareil</h4>
      <p class="muted">À faire une seule fois par appareil. Envoie-toi ce lien, puis ouvre-le sur l’appareil à connecter. Si l’atelier y est installé sur l’écran d’accueil, copie le lien et colle-le dans l’atelier (Réglages, Mémoire et synchro). Garde-le pour toi : il donne accès aux données.</p>
      <div class="btn-row"><button class="btn" data-action="copy-link">${I('link', 16)}Copier le lien</button>${navigator.share ? `<button class="btn" data-action="share-link">${I('share', 16)}Envoyer le lien</button>` : ''}</div>
    </div>` : `<div class="set-group">
      <h4>Connecter cet appareil</h4>
      <p class="muted">Pour l’instant, ce qui est fait ici reste sur cet appareil. Colle le lien de connexion pour retrouver l’atelier partout.</p>
      <label class="add-row boxed">${I('link', 17)}<input id="connect-input" placeholder="https://…#connecter=…" data-enter="connect" autocomplete="off" spellcheck="false"></label>
      <div class="btn-row">${navigator.clipboard && navigator.clipboard.readText ? `<button class="btn primary" data-action="paste-link">${I('copy', 16)}Coller le lien</button><button class="btn" data-action="connect">Connecter</button>` : '<button class="btn primary" data-action="connect">Connecter</button>'}</div>
    </div>`}
    ${msg}
    ${installTipHTML()}
    <div class="set-group">
      <h4>Historique</h4>
      <p class="muted">Chaque modification est gardée. Tu peux revenir en arrière à tout moment.</p>
      <div class="btn-row">${on ? `<button class="btn" data-action="load-history">${I('history', 16)}Versions en ligne</button>` : ''}<button class="btn" data-action="load-local-history">${I('phone', 16)}Copies sur cet appareil</button></div>
      ${historyListHTML(m)}
    </div>
    <div class="set-group">
      <h4>Fichier de sauvegarde</h4>
      <div class="btn-row"><button class="btn" data-action="export">${I('download', 16)}Télécharger</button><label class="btn">${I('upload', 16)}Importer<input type="file" accept="application/json,.json" id="import-file" hidden></label></div>
    </div>
    <div class="set-group danger-zone">
      <h4>Zone sensible</h4>
      <div class="btn-row">${on ? '<button class="btn quiet" data-action="disconnect">Déconnecter cet appareil</button>' : ''}<button class="btn quiet danger" data-action="reset">Repartir de zéro</button></div>
    </div>`;
}
function installTipHTML() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (!ios || standalone) return '';
  return `<div class="tip"><b>Ajoute l’atelier à l’écran d’accueil</b><p>Dans Safari : Partager, puis « Sur l’écran d’accueil ». Il s’ouvrira comme une appli et l’iPhone ne l’effacera jamais. Une fois dedans, rouvre le lien de connexion.</p></div>`;
}
function historyListHTML(m) {
  const h = m.hist;
  if (!h) return '';
  if (h === 'loading') return '<p class="muted">Chargement…</p>';
  if (h.error) return `<p class="msg err">${esc(h.error)}</p>`;
  if (!h.items.length) return '<p class="muted">Rien pour l’instant.</p>';
  return `<ul class="hist">${h.items.map((x) => `<li><div><b>${esc(x.label)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</div><button class="btn small" data-action="restore" data-src="${h.src}" data-ref="${esc(x.ref)}">Revenir à cette version</button></li>`).join('')}</ul>
    ${h.more ? `<button class="ghost-btn text" data-action="load-history" data-page="${h.page + 1}">Voir plus ancien</button>` : ''}`;
}

/* ---------- Bienvenue / lien de connexion ---------- */
const logoDrop = () => `<div class="logo-drop" style="--cl:${state ? state.sides.perso.color : '#ff8b74'};--p:.58">${LQ}</div>`;
function welcomeHTML(m) {
  const msg = m.msg ? `<p class="msg ${m.err ? 'err' : 'ok'}">${esc(m.msg)}</p>` : '';
  if (m.link) {
    return `<div class="sheet-scroll welcome">${logoDrop()}<h1 class="logo big" role="img" aria-label="Parinès"></h1>
      <h2>Connecter cet appareil ?</h2>
      <p class="lead">Il retrouvera tous les livres de l’atelier, et tout ce que tu feras ici sera enregistré en ligne.</p>${msg}
      <div class="btn-col"><button class="btn primary big" data-action="welcome-connect">Connecter</button><button class="btn quiet" data-action="close-sheet">Pas maintenant</button></div></div>`;
  }
  return `<div class="sheet-scroll welcome">${logoDrop()}<h1 class="logo big" role="img" aria-label="Parinès"></h1>
    <p class="lead">Les binds perso d’un côté, les commandes de l’autre, et au milieu ce que tu fais aujourd’hui.</p>
    <div class="welcome-card"><b>Tu as reçu un lien de connexion ?</b>
      <label class="add-row boxed">${I('link', 17)}<input id="connect-input" placeholder="Colle-le ici" data-enter="connect" autocomplete="off" spellcheck="false"></label>
      ${navigator.clipboard && navigator.clipboard.readText ? `<div class="btn-row"><button class="btn primary" data-action="paste-link">${I('copy', 16)}Coller le lien</button><button class="btn" data-action="connect">Connecter</button></div>` : '<button class="btn primary" data-action="connect">Connecter</button>'}${msg}</div>
    <div class="btn-col"><button class="btn" data-action="start-blank">Commencer avec un atelier vide</button><button class="btn quiet" data-action="start-demo">Découvrir avec des exemples</button></div></div>`;
}

/* ---------- Petites fenêtres ---------- */
function askHTML(m) {
  return `<div class="ask"><h3>${esc(m.title)}</h3>${m.text ? `<p>${esc(m.text)}</p>` : ''}
    <div class="ask-btns"><button class="btn quiet" data-action="ask-no">${esc(m.no || 'Annuler')}</button><button class="btn ${m.danger ? 'danger-fill' : 'primary'}" data-action="ask-yes">${esc(m.ok || 'OK')}</button></div></div>`;
}
function celebrateHTML(m) {
  const p = P(m.id); if (!p) return '';
  const dd = p.deliverables.filter((d) => d.done).length; const b = bookVars(p);
  return `<div class="celebrate">
    <div class="spine preview cel-spine${b.cls}" style="${b.style}"${b.cover}>${LQ}<div class="sp-row"><h3 class="sp-title">${esc(p.title)}</h3></div>${toolingHTML(p, null)}</div>
    <h2>Toutes les étapes sont faites</h2>
    <p>Avant de le passer dans les terminés, il reste ton dossier de livrables.${p.side === 'pro' && (p.client || p.contact) ? ` Pour ${esc([p.client, p.contact].filter(Boolean).join(', '))}.` : ''}</p>
    <ul class="rows cel-list">${p.deliverables.map((d) => `<li class="row ${d.done ? 'done' : ''}${flashed(d.id) ? ' flash' : ''}" data-id="${d.id}"><button class="box" data-action="livr-toggle" data-p="${p.id}" data-d="${d.id}" aria-label="Cocher">${I('check', 14)}</button><span class="row-label">${esc(d.name)}</span></li>`).join('')}</ul>
    <div class="cel-foot"><span class="muted"><b>${dd}</b> sur ${p.deliverables.length}</span><button class="btn quiet" data-action="open-project" data-id="${p.id}">Ouvrir le livre</button><button class="btn primary" data-action="close-pop">Plus tard</button></div>
  </div>`;
}
function paletteHTML(m) {
  return `<label class="pal-in">${I('search', 20)}<input id="pal-input" value="${esc(m.q || '')}" placeholder="Chercher un livre, en créer un, noter une tâche" autocomplete="off" spellcheck="false" data-autofocus enterkeyhint="go"></label>
    <ul class="pal-list">${paletteListHTML(m)}</ul>`;
}
function paletteListHTML(m) {
  m.items = paletteItems(m.q || '');
  m.sel = Math.max(0, Math.min(m.sel || 0, m.items.length - 1));
  if (!m.items.length) return '<li class="pal-empty">Aucun livre ne correspond.</li>';
  return m.items.map((it, i) => `<li><button class="pal-item ${i === m.sel ? 'sel' : ''}" data-action="pal-run" data-i="${i}"><span class="pal-ic">${it.ic}</span><span class="pal-txt">${it.label}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button></li>`).join('');
}
function paletteItems(q) {
  const f = fold(q).trim(); const out = []; const raw = q.trim();
  state.projects
    .filter((p) => !f || fold(p.title).includes(f) || fold(p.client).includes(f) || fold(p.kind).includes(f))
    .sort((a, b) => a.archived - b.archived)
    .slice(0, f ? 8 : 5)
    .forEach((p) => out.push({ ic: chip(p), label: esc(p.title), sub: (p.archived ? 'Terminé, ' : '') + state.sides[p.side].name, run: () => openSheet({ type: 'page', id: p.id }) }));
  if (f) {
    SIDES.forEach((side) => out.push({ ic: I('plus', 16), label: `Nouveau livre « ${esc(raw)} »`, sub: state.sides[side].name, run: () => openSheet({ type: 'new', side, draft: { title: raw } }) }));
    out.push({ ic: I('sun', 16), label: `Noter « ${esc(raw)} » pour aujourd’hui`, sub: 'Tâche libre', run: () => addFree(raw) });
  }
  const nav = [
    [I('plus', 16), `Nouveau livre, ${state.sides.perso.name}`, () => openSheet({ type: 'new', side: 'perso' })],
    [I('plus', 16), `Nouveau livre, ${state.sides.pro.name}`, () => openSheet({ type: 'new', side: 'pro' })],
    [I('books', 16), 'Livres terminés', () => openSheet({ type: 'archives' })],
    [I('sliders', 16), 'Apparence', () => openSettings('apparence')],
    [I('stack', 16), 'Étapes et livrables par défaut', () => openSettings('espaces')],
    [I('history', 16), 'Mémoire et synchro', () => openSettings('memoire')],
    [I('sun', 16), 'Passer en jour ou en nuit', () => toggleTheme()],
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
function autoGrowAll(root) { $$('textarea.pg-title, textarea.notes', root).forEach(autoGrow); }
