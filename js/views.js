'use strict';
/* =====================================================================
   ATELIER · affichage
   Le tableau d'Inès, d'après son croquis : la bibliothèque perso à
   gauche, l'activité pro à droite, la feuille du jour posée sur la
   couture, et dessous le carnet (le tableau croisé de son cahier).
   La couleur ne sert qu'à montrer ce qui est fait, au surligneur.
   ===================================================================== */

const ui = { sheet: null, pop: null, tab: (typeof LOCAL !== 'undefined' && LOCAL.tab) || 'today', expanded: null, flash: null, archFilter: 'tout', setTab: 'apparence', showDone: false };

/* ---------- Icônes ---------- */
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.5 1.5M17.9 17.9l1.5 1.5M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.5-1.5M17.9 6.1l1.5-1.5"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  grip: '<circle cx="9" cy="6" r="1.1"/><circle cx="15" cy="6" r="1.1"/><circle cx="9" cy="12" r="1.1"/><circle cx="15" cy="12" r="1.1"/><circle cx="9" cy="18" r="1.1"/><circle cx="15" cy="18" r="1.1"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
  books: '<path d="M4 4h4v16H4zM9 4h4v16H9z"/><path d="m14.5 5.2 3.9-1 3.6 14.6-3.9 1z"/>',
  stack: '<rect x="3" y="15" width="18" height="5" rx="1"/><rect x="5" y="9.5" width="15" height="5" rx="1"/><rect x="3.5" y="4" width="16" height="5" rx="1"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  dash: '<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.5"/><rect x="3" y="15" width="7.5" height="6" rx="1.5"/><rect x="13.5" y="11" width="7.5" height="10" rx="1.5"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
  next: '<path d="M5 5v14l10-7z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
  prev: '<path d="M19 5v14L9 12z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
  min: '<path d="M6 9l6 6 6-6"/>',
  max: '<path d="M6 15l6-6 6 6"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
};
const I = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const flashed = (id) => !!(ui.flash && ui.flash.has(id));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const longToday = () => cap(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
const dateFr = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const dayFr = (iso) => new Date(iso + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
/* Un des quatre coups de surligneur, toujours le même pour une même case */
const mkv = (id) => 'm' + (1 + (hashStr(String(id)) % 4));

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

/* ---------- Les cases d'un livre (une par étape) ---------- */
function cellsHTML(p, o) {
  o = o || {};
  const nx = o.next === undefined ? nextStep(p) : o.next;
  const pr = progress(p);
  if (!pr.total) return '';
  return `<span class="cells${o.big ? ' big' : ''}" role="img" aria-label="${pr.done} étapes faites sur ${pr.total}">${p.steps.map((s, i) =>
    `<i class="c${s.done ? ' d ' + mkv(s.id) : ''}${s === nx ? ' n' : ''}${flashed(s.id) ? ' just' : ''}" style="--i:${i}"></i>`).join('')}</span>`;
}

/* À rendre le… (activité pro) */
function dueHTML(p) {
  if (!p.due || p.archived) return '';
  const d = daysLeft(p.due);
  let cls = ''; let txt;
  if (d < 0) { cls = 'late'; txt = d === -1 ? 'en retard d’un jour' : `en retard de ${-d} jours`; }
  else if (d === 0) { cls = 'soon'; txt = 'à rendre aujourd’hui'; }
  else if (d === 1) { cls = 'soon'; txt = 'à rendre demain'; }
  else if (d <= 3) { cls = 'soon'; txt = `à rendre dans ${d} jours`; }
  else txt = `à rendre le ${dayFr(p.due)}`;
  return `<span class="due ${cls}">${txt}</span>`;
}

/* ---------- Apparence générale ---------- */
const isDark = () => document.documentElement.dataset.theme === 'dark';
function applyPrefs() {
  const pr = state.prefs; const root = document.documentElement;
  const dark = pr.theme === 'sombre' || (pr.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  document.body.classList.toggle('calm', calm());
  const paper = dark ? '#121318' : '#f3f3f0';
  for (const sd of SIDES) {
    const c = state.sides[sd].color;
    root.style.setProperty('--' + sd, c);
    root.style.setProperty('--' + sd + '-wash', mixHex(c, paper, dark ? 0.13 : 0.115));
    root.style.setProperty('--' + sd + '-deep', mixHex(c, dark ? '#ffffff' : '#1c1c2a', dark ? 0.72 : 0.6));
  }
  root.style.setProperty('--zoom', LOCAL.zoom || 1);
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = paper;
  applyDense();
}
/* « Tout voir » : le tableau de bord resserré, tout sur un écran.
   Ordi et iPad : le bouton de l'en-tête. iPhone : l'onglet « Tout ». */
const isPhone = () => matchMedia('(max-width: 759px)').matches;
function applyDense() {
  document.body.classList.toggle('dense', isPhone() ? ui.tab === 'all' : !!LOCAL.dense);
  if (isPhone() && window.Music && Music.st.mode !== 'off') Music.stop();
}

function renderAll() { applyPrefs(); renderTop(); renderMain(); renderTabbar(); renderSheet(); renderPop(); if (window.Music) Music.paintLauncher(); }

/* =====================================================================
   EN-TÊTE
   ===================================================================== */
function renderTop() {
  const na = archivedProjects().length; const t = stats();
  const d = new Date();
  const wd = cap(d.toLocaleDateString('fr-FR', { weekday: 'long' }));
  const dm = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  $('#top').innerHTML = `
    <div class="top-row">
      <h1 class="logo" role="img" aria-label="Parinès"></h1>
      <p class="top-date"><b>${esc(wd)}</b>${esc(dm)}</p>
      ${t.total ? `<button class="top-ov" data-action="goto-carnet" title="Voir le carnet">${miniCodeHTML()}<b>${t.pct} %</b><span>accompli</span></button>` : '<span class="grow"></span>'}
      ${t.total ? '<span class="grow"></span>' : ''}
      <button class="tb search" data-action="palette" aria-label="Chercher">${I('search', 18)}<span>Chercher</span><kbd>${isMac ? '⌘' : 'Ctrl '}K</kbd></button>
      <button class="tb all-btn hide-phone${LOCAL.dense ? ' on' : ''}" data-action="dense" aria-pressed="${!!LOCAL.dense}" title="${LOCAL.dense ? 'Revenir à la vue détaillée' : 'Tout voir sur un seul écran'}">${I('dash', 18)}<span class="lbl">Tout voir</span></button>
      <button class="tb hide-phone" data-action="open-archives">Terminés${na ? `<span class="n">${na}</span>` : ''}</button>
      ${syncBtn()}
      <button class="tb" data-action="open-settings" aria-label="Réglages">${I('sliders', 19)}<span class="lbl">Réglages</span></button>
    </div>
    ${dockHTML()}`;
}
function miniCodeHTML() {
  const t = stats();
  return `<span class="mini-bar" aria-hidden="true"><i class="m2" style="width:${t.pct}%"></i></span>`;
}
function syncBtn() {
  const map = {
    off: ['Sur cet appareil', 'Rien n’est en ligne pour l’instant : branche la synchro dans Réglages'],
    pending: ['Enregistrement', 'Envoi en ligne en cours'], saving: ['Enregistrement', 'Envoi en ligne en cours'],
    ok: ['Enregistré', 'Tout est enregistré en ligne'],
    offline: ['Hors ligne', 'Gardé sur l’appareil, envoyé au retour du réseau'],
    error: ['Synchro en panne', Sync.msg || 'La synchro a un souci'],
  };
  const v = map[Sync.status] || map.off;
  return `<button class="tb sync sync-${Sync.status}" data-action="open-settings" data-tab="memoire" title="${esc(v[1])}" aria-label="${esc(v[1])}"><i class="sync-dot"></i><span class="sync-lbl hide-phone">${v[0]}</span></button>`;
}
function renderSyncState() {
  const b = $('.sync'); if (b) b.outerHTML = syncBtn();
  const box = $('#sync-status'); if (box) box.outerHTML = syncStatusHTML();
}

/* La barre d'outils : ses sites, son outil de mise en page, la musique, la taille */
const POUR_INES_IC = '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M14.3 7.6h-1.7a3.95 3.95 0 0 0 0 7.9h1.7z" fill="currentColor"/><path d="M14.3 7.6v12.8M17.7 7.6v12.8M12.6 7.6h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>';
const FAVS = [
  ['Drive', 'https://drive.google.com/', 'drive.google.com'],
  ['Gmail', 'https://mail.google.com/', 'mail.google.com'],
  ['Shopify', 'https://www.shopify.com/login?ui_locales=fr', 'shopify.com'],
  ['Enbooken', 'https://enbooken.com/', 'enbooken.com'],
  ['Pinterest', 'https://www.pinterest.fr/', 'pinterest.fr'],
  ['Cosmos', 'https://www.cosmos.so/', 'cosmos.so'],
  ['Pour Inès', 'pour-ines.html', ''],
];
function dockHTML() {
  const favs = state.prefs.links !== false ? FAVS.map(([n, u, d]) => {
    const ic = d
      ? `<span class="fav-ic" data-l="${n[0]}"><img src="https://www.google.com/s2/favicons?domain=${d}&sz=64" alt="" loading="lazy" onerror="this.remove()"></span>`
      : `<span class="fav-ic own" style="color:var(--on-ink)">${POUR_INES_IC}</span>`;
    return `<a class="fav" href="${u}" target="_blank" rel="noopener" data-fav>${ic}${esc(n)}</a>`;
  }).join('') : '';
  const mu = LOCAL.music !== false && !isPhone()
    ? `<button class="fav mu-launch${window.Music && Music.st.playing ? ' playing' : ''}" data-action="music" title="La musique d’Amélien, pour travailler">${'<span class="cd" aria-hidden="true"></span>'}Musique</button>` : '';
  const size = `<div class="size hide-phone" role="group" aria-label="Taille de l’affichage"><button data-action="zoom" data-d="-1" aria-label="Plus petit">A</button><button data-action="zoom" data-d="1" aria-label="Plus grand">A</button></div>`;
  return `<nav class="dock" aria-label="Outils">${favs}${favs && mu ? '<span class="dock-sep"></span>' : ''}${mu}<span class="grow"></span>${size}</nav>`;
}

/* =====================================================================
   LE TABLEAU
   ===================================================================== */
function renderMain() {
  if (ui.expanded) document.body.dataset.expanded = ui.expanded; else delete document.body.dataset.expanded;
  $('#main').innerHTML = `
    <section class="board">${halfHTML('perso')}${todayHTML()}${halfHTML('pro')}</section>
    ${carnetHTML()}`;
}

function halfHTML(side) {
  const sd = state.sides[side]; const list = activeProjects(side); const ex = ui.expanded === side; const t = stats(side);
  return `
  <section class="half s-${side}" data-side="${side}">
    <header class="half-head">
      <h2 class="half-name" contenteditable="plaintext-only" data-space-name="${side}" spellcheck="false" aria-label="Nom de cet espace (modifiable)">${esc(sd.name)}</h2>
      <div class="half-bar">
        <p class="half-sub">${list.length ? `${plural(list.length, 'livre en cours', 'livres en cours')}, <b>${t.pct} %</b> fait` : 'Rien en cours pour l’instant'}</p>
        <button class="icon-btn hide-phone" data-action="expand" data-side="${side}" title="${ex ? 'Revenir au tableau' : 'Voir en grand'}" aria-label="${ex ? 'Revenir au tableau' : 'Voir en grand'}">${I(ex ? 'shrink' : 'expand', 18)}</button>
        <button class="add" data-action="new-project" data-side="${side}"><span class="plus">${I('plus', 16)}</span><span>Nouveau livre</span></button>
      </div>
    </header>
    ${list.length ? `<ol class="books" data-sortable="side-${side}">${list.map(bookHTML).join('')}</ol>`
      : `<div class="empty"><button class="btn" data-action="new-project" data-side="${side}">${I('plus', 16)}Commencer un livre</button></div>`}
  </section>`;
}

function bookHTML(p) {
  const ph = phase(p); const nx = nextStep(p); const ty = typeOf(p); const pr = progress(p);
  const meta = [ty && ty.name, p.client && 'pour ' + p.client].filter(Boolean).join(', ');
  let line;
  if (ph === 'livrables') {
    const d = p.deliverables.filter((x) => x.done).length;
    line = `<button class="livr-due" data-action="open-celebrate" data-id="${p.id}">Livrables à préparer, ${d} sur ${p.deliverables.length}</button>`;
  } else if (nx) {
    const on = inToday(p.id, nx.id);
    line = `<div class="bk-next">
      <button class="box" data-action="quick-done" data-p="${p.id}" data-s="${nx.id}" aria-label="Cocher « ${esc(nx.name)} »"></button>
      <p><span>Ensuite</span><b>${esc(nx.name)}</b></p>
      ${p.due && !p.archived ? `<span class="due-d">${dueHTML(p)}</span>` : ''}
      <button class="sun${on ? ' on' : ''}" data-action="toggle-today" data-p="${p.id}" data-s="${nx.id}" aria-pressed="${on}" title="${on ? 'Retirer d’aujourd’hui' : 'Prévoir pour aujourd’hui'}">${I('sun', 17)}<span>${on ? 'Aujourd’hui' : 'Pour aujourd’hui'}</span></button>
    </div>`;
  } else {
    line = '<p class="bk-next muted small">Aucune étape. Ouvre le livre pour en ajouter.</p>';
  }
  const rest = ui.expanded && nx ? p.steps.filter((s) => !s.done && s !== nx) : [];
  const hasImg = !!(p.cover && p.cover.t === 'img'); const u = hasImg ? Covers.url(p.cover.key) : '';
  return `
  <li class="book ph-${ph}${flashed(p.id) ? ' flash' : ''}${hasImg ? ' with-photo' : ''}" data-id="${p.id}" data-action="open-project">
    ${hasImg ? `<span class="bk-photo${u ? ' has-img' : ''}" data-cover="${esc(p.cover.key)}"${u ? ` style="--img:url('${u}')"` : ''}></span>` : ''}
    <div class="bk-top"><h3 class="bk-title">${esc(p.title)}</h3>${meta ? `<span class="bk-meta">${esc(meta)}</span>` : ''}${dueHTML(p)}</div>
    ${pr.total ? `<div class="bk-track">${cellsHTML(p, { next: ph === 'livrables' ? null : nx })}<span class="bk-n">${pr.done}/${pr.total}</span></div>` : ''}
    ${line}
    ${rest.length ? `<div class="rest">${rest.map((s) => { const on = inToday(p.id, s.id); return `<button class="pick-chip${on ? ' on' : ''}" data-action="toggle-today" data-p="${p.id}" data-s="${s.id}" title="${on ? 'Retirer d’aujourd’hui' : 'Prévoir pour aujourd’hui'}"><span>${esc(s.name)}</span></button>`; }).join('')}</div>` : ''}
  </li>`;
}

/* ---------- La feuille du jour ---------- */
function todayHTML() {
  const es = todayEntries(); const done = es.filter((e) => e.done).length;
  const sug = suggestions(es.length ? 3 : 5);
  const shown = (e) => !e.done || flashed(e.it.id) || ui.showDone;
  const groups = [
    ['perso', state.sides.perso.name, es.filter((e) => !e.free && e.p.side === 'perso')],
    ['pro', state.sides.pro.name, es.filter((e) => !e.free && e.p.side === 'pro')],
    ['free', 'À côté', es.filter((e) => e.free)],
  ].filter((g) => g[2].some(shown));
  const all = es.length > 0 && done === es.length;
  return `
  <aside class="today${all ? ' all-done' : ''}" aria-label="Aujourd’hui">
    <header class="td-head">
      <div><h2 class="td-title">Aujourd’hui</h2><p class="td-date">${esc(longToday())}</p></div>
      ${es.length ? `<p class="td-count">${all ? 'Tout est fait' : `${done} sur ${es.length}`}</p>` : ''}
    </header>
    ${es.length ? `<div class="td-meter"><span class="cells">${es.map((e) => `<i class="c${e.done ? ' d ' + mkv(e.it.id) : ''}${flashed(e.it.id) ? ' just' : ''} ${e.free ? 's-free' : 's-' + e.p.side}"${e.free ? ' style="--c:var(--sun)"' : ''}></i>`).join('')}</span></div>` : ''}
    ${groups.length ? groups.map((g) => `
      <section class="td-group${g[0] === 'free' ? '' : ' s-' + g[0]}">
        <h3 class="td-g${g[0] === 'free' ? ' free' : ''}"><i></i>${esc(g[1])}<span class="n">${g[2].filter((e) => !e.done).length || ''}</span></h3>
        <ul class="td-list" data-sortable="today">${g[2].filter(shown).map(todoHTML).join('')}</ul>
      </section>`).join('') : `<p class="td-empty">${all ? 'Tout ce qui était prévu est fait. Belle journée.' : sug.length ? 'Rien de prévu pour l’instant. Note une tâche, ou pioche une étape juste en dessous.' : 'Rien de prévu pour l’instant. Note une tâche ici.'}</p>`}
    ${done ? `<button class="td-done-toggle" data-action="toggle-done">${I('check', 15)}${ui.showDone ? 'Masquer ce qui est fait' : `${plural(done, 'tâche faite', 'tâches faites')} aujourd’hui`}</button>` : ''}
    <label class="td-add">${I('plus', 18)}<input id="free-input" type="text" placeholder="Noter une tâche" data-enter="add-free" autocomplete="off" enterkeyhint="done"></label>
    ${sug.length ? `<div class="td-sugg"><h4>Pour la suite</h4>${sug.map((x) => `
      <button class="sugg s-${x.p.side}" data-action="today-add" data-p="${x.p.id}" data-s="${x.st.id}">
        <span class="pl">${I('plus', 14)}</span><span><b>${esc(x.st.name)}</b><small>${esc(x.p.title)}</small></span><i class="dot"></i>
      </button>`).join('')}</div>` : ''}
    <button class="td-pick" data-action="open-picker">${I('sun', 17)}Préparer ma journée</button>
  </aside>`;
}
function todoHTML(e) {
  const fl = flashed(e.it.id);
  const cls = `td-item${e.done ? ' done' : ''}${fl ? ' just' : ''}${fl && e.done && !ui.showDone ? ' leave' : ''}${e.free ? ' free' : ''} ${mkv(e.it.id)}`;
  const tag = e.it.carried && !e.done ? '<span class="td-tag">d’hier</span>' : '';
  const x = `<button class="x" data-action="today-remove" data-id="${e.it.id}" aria-label="Retirer de la liste">${I('x', 15)}</button>`;
  const box = `<button class="box${e.done ? ' on ' + mkv(e.it.id + 'b') : ''}" data-action="today-toggle" data-id="${e.it.id}" aria-label="${e.done ? 'Décocher' : 'Cocher'}"></button>`;
  const grip = `<span class="td-grip" aria-hidden="true">${I('grip', 16)}</span>`;
  if (e.free) {
    return `<li class="${cls}" data-id="${e.it.id}">${box}
      <div class="td-txt" style="--tw:${Math.min(100, Math.round(e.it.text.length * 2.6))}%"><input class="td-free" value="${esc(e.it.text)}" data-free="${e.it.id}" aria-label="Tâche" enterkeyhint="done"></div>${tag || grip}${x}</li>`;
  }
  return `<li class="${cls}" data-id="${e.it.id}">${box}
    <div class="td-txt"><b>${esc(e.st.name)}</b><button class="td-book" data-action="open-project" data-id="${e.p.id}">${esc(e.p.title)}</button></div>${tag || grip}${x}</li>`;
}

/* =====================================================================
   LE CARNET
   ===================================================================== */
function carnetHTML() {
  const t = stats(); const na = archivedProjects().length;
  const month = [t.finished ? plural(t.finished, 'livre terminé', 'livres terminés') : '', t.stepsMonth ? plural(t.stepsMonth, 'étape cochée', 'étapes cochées') : ''].filter(Boolean);
  const off = state.prefs.tables === false;
  const sides = SIDES.map((s) => ({ s, t: stats(s) }));
  return `
  <section class="carnet${off ? ' hide-desk' : ''}" id="carnet">
    <div class="cn-top"><h2>Le carnet</h2>${na ? `<button class="btn small quiet" data-action="open-archives">${I('books', 16)}${plural(na, 'livre terminé', 'livres terminés')}</button>` : ''}</div>
    ${t.total ? `
    <div class="cn-sum">
      <div class="cn-main">
        <p class="cn-line"><b class="cn-pct">${t.pct} %</b><span>de ce qu’il y a à faire est fait</span></p>
        <div class="gauge big" role="progressbar" aria-valuenow="${t.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Avancement de l’atelier">${sides.map((x) => `<i class="m2 s-${x.s}" style="width:${t.total ? (x.t.done / t.total * 100).toFixed(2) : 0}%"></i>`).join('')}</div>
        <p class="cn-note">${t.done} ${t.done > 1 ? 'cases cochées' : 'case cochée'} sur ${t.total}, en comptant les étapes et les livrables des ${plural(t.books, 'livre en cours', 'livres en cours')}.</p>
        <div class="cn-sides">${sides.map((x) => `
          <div class="cn-side s-${x.s}"><span class="cn-side-n"><i class="sq"></i>${esc(state.sides[x.s].name)}</span>
            <span class="gauge"><i class="m3" style="width:${x.t.pct}%"></i></span>
            <b>${x.t.pct} %</b><small>${x.t.done} sur ${x.t.total}</small></div>`).join('')}
        </div>
      </div>
      ${weekHTML(month)}
    </div>` : '<p class="mx-empty">Le carnet se remplira au fil des livres.</p>'}
    ${t.books ? `<div class="mxs">${SIDES.map(matrixHTML).join('')}</div>` : ''}
  </section>`;
}
function weekHTML(month) {
  const wk = weekActivity(7); const total = wk.reduce((n, d) => n + d.perso + d.pro, 0);
  const max = Math.max(4, ...wk.map((d) => d.perso + d.pro));
  const L = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  return `<div class="week">
    <h3>Ces 7 derniers jours</h3>
    <p class="week-sum"><b>${plural(total, 'étape cochée', 'étapes cochées')}</b>${month && month.length ? `<br>Ce mois-ci : ${month.join(', ')}` : ''}</p>
    <div class="week-bars" role="img" aria-label="${plural(total, 'étape cochée', 'étapes cochées')} ces 7 derniers jours">
      ${wk.map((d, i) => { const n = d.perso + d.pro; return `<div class="wb${i === wk.length - 1 ? ' now' : ''}">
        <span class="wb-n">${n || ''}</span>
        <span class="wb-col"><i class="s-pro" style="height:${(d.pro / max * 100).toFixed(1)}%"></i><i class="s-perso" style="height:${(d.perso / max * 100).toFixed(1)}%"></i></span>
        <span class="wb-l">${i === wk.length - 1 ? 'auj.' : L[d.date.getDay()]}</span></div>`; }).join('')}
    </div>
  </div>`;
}
/* Le tableau croisé d'un espace : les livres en lignes, les étapes en colonnes */
function matrixCols(side) {
  const sd = state.sides[side];
  const cols = sd.steps.map((s) => ({ tpl: s.id, name: s.name }));
  const idx = (st) => {
    let i = st.tpl ? cols.findIndex((c) => c.tpl === st.tpl) : -1;
    if (i < 0) i = cols.findIndex((c) => fold(c.name) === fold(st.name));
    return i;
  };
  for (const p of activeProjects(side)) for (const st of p.steps) if (idx(st) < 0) cols.push({ name: st.name });
  return { cols, idx };
}
function matrixHTML(side) {
  const sd = state.sides[side]; const list = activeProjects(side); const t = stats(side);
  const head = `<div class="mx-head s-${side}"><h3><i class="sq"></i>${esc(sd.name)}, le détail</h3></div>`;
  if (!list.length) return `<div class="mx-wrap">${head}<p class="mx-empty">Aucun livre en cours.</p></div>`;
  const m = matrixCols(side);
  const rows = list.map((p) => {
    const ph = phase(p); const nx = ph === 'encours' ? nextStep(p) : null;
    const at = {};
    p.steps.forEach((st) => { const i = m.idx(st); if (i >= 0 && !at[i]) at[i] = st; });
    const sub = ph === 'livrables' ? 'Livrables à préparer' : nx ? 'Ensuite : ' + nx.name : '';
    return `<tr class="ph-${ph}">
      <td class="ttl"><button data-action="open-project" data-id="${p.id}">${esc(p.title)}</button>${sub ? `<small>${esc(sub)}</small>` : ''}</td>
      ${m.cols.map((c, i) => {
        const st = at[i];
        if (!st) return '<td class="cl na"><span class="sr">Pas cette étape</span></td>';
        return `<td class="cl"><button data-action="cell-toggle" data-p="${p.id}" data-s="${st.id}" aria-label="${esc(st.name)}, ${esc(p.title)} : ${st.done ? 'fait' : 'à faire'}"><i class="c${st.done ? ' d ' + mkv(st.id) : ''}${st === nx ? ' n' : ''}${flashed(st.id) ? ' just' : ''}"></i></button></td>`;
      }).join('')}
      <td class="dt">${esc(shortDate(p.start))}</td><td class="dt">${esc(shortDate(p.end))}</td><td class="pc">${pctOf(p)} %</td>
    </tr>`;
  }).join('');
  return `<div class="mx-wrap s-${side}">${head}<p class="mx-help">Comme dans ton carnet : une ligne par livre, une colonne par étape. Touche une case pour la cocher ou la décocher.</p><div class="mx-scroll"><table class="mx">
    <thead><tr><th></th>${m.cols.map((c) => `<th class="v"><span title="${esc(c.name)}">${esc(c.name)}</span></th>`).join('')}<th class="v dt"><span>Début</span></th><th class="v dt"><span>Fin</span></th><th class="v dt"><span>Fait</span></th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}

/* ---------- Onglets (téléphone) ---------- */
function renderTabbar() {
  const n = todayEntries().filter((e) => !e.done).length;
  const tabs = [
    ['all', 'Tout', 0, I('dash', 20), ''],
    ['today', 'Aujourd’hui', n, I('sun', 20), ''],
    ['perso', shortName('perso'), activeProjects('perso').length, '<i class="sq"></i>', 's-perso'],
    ['pro', shortName('pro'), activeProjects('pro').length, '<i class="sq"></i>', 's-pro'],
    ['carnet', 'Carnet', 0, I('grid', 20), ''],
  ];
  $('#tabbar').innerHTML = tabs.map((t) => `
    <button class="tab ${t[4]}${ui.tab === t[0] ? ' on' : ''}" data-action="tab" data-tab="${t[0]}"><span class="tab-ic">${t[3]}${t[2] ? `<span class="tab-n">${t[2]}</span>` : ''}</span><span class="tab-lbl">${esc(t[1])}</span></button>`).join('');
  document.body.dataset.tab = ui.tab;
  applyDense();
}

/* =====================================================================
   FENÊTRES
   ===================================================================== */
const sheetKey = (m) => m.type + ':' + (m.id || m.side || '');
function lockBody() { document.body.classList.toggle('locked', !!(ui.sheet || ui.pop)); }

function renderSheet() {
  const root = $('#sheet-root'); const m = ui.sheet;
  if (!m) { root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const kinds = { page: [pageHTML, 'pagesheet'], new: [newHTML, 'modal'], picker: [pickerHTML, 'modal'], archives: [archivesHTML, 'modal wide'], settings: [settingsHTML, 'modal'], welcome: [welcomeHTML, 'modal'] };
  const k = kinds[m.type] || [];
  const html = k[0] ? k[0](m) : '';
  if (!html) { ui.sheet = null; root.innerHTML = ''; root.dataset.key = ''; lockBody(); return; }
  const key = sheetKey(m);
  const ex = $('.sheet', root);
  if (ex && root.dataset.key === key) {
    const tops = $$('.scroller', ex).map((s) => s.scrollTop);
    ex.innerHTML = html; ex.classList.add('settled');
    $$('.scroller', ex).forEach((s, i) => { if (tops[i]) s.scrollTop = tops[i]; });
  } else {
    root.innerHTML = `<div class="scrim" data-action="close-sheet"></div><section class="sheet ${k[1]} sheet-${m.type}" role="dialog" aria-modal="true">${html}</section>`;
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

const sheetHead = (title, sub) => `
  <div class="sheet-head">
    <div class="sheet-title"><h2>${title}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>
    <button class="close" data-action="close-sheet" aria-label="Fermer">${I('x', 20)}</button>
  </div>`;

/* ---------- La fiche d'un livre ---------- */
function rowHTML(kind, p, x) {
  const isStep = kind === 'step';
  const attrs = isStep ? `data-p="${p.id}" data-s="${x.id}"` : `data-p="${p.id}" data-d="${x.id}"`;
  const on = isStep && inToday(p.id, x.id);
  const fl = flashed(x.id);
  return `<li class="row${x.done ? ' done' : ''}" data-id="${x.id}">
    <span class="grip" aria-hidden="true">${I('grip', 15)}</span>
    <button class="box${x.done ? ' on ' + mkv(x.id) : ''}${fl ? ' just' : ''}" data-action="${isStep ? 'step-toggle' : 'livr-toggle'}" ${attrs} aria-label="${x.done ? 'Décocher' : 'Cocher'} « ${esc(x.name)} »"></button>
    <input class="row-name" value="${esc(x.name)}" ${isStep ? `data-step-name="${x.id}"` : `data-livr-name="${x.id}"`} aria-label="Nom" enterkeyhint="done">
    ${isStep && !x.done ? `<button class="sun${on ? ' on' : ''}" data-action="toggle-today" ${attrs} title="${on ? 'Retirer d’aujourd’hui' : 'Faire aujourd’hui'}" aria-label="${on ? 'Retirer d’aujourd’hui' : 'Faire aujourd’hui'}">${I('sun', 16)}<span>Aujourd’hui</span></button>` : '<span></span>'}
    <button class="x row-x" data-action="${isStep ? 'step-remove' : 'livr-remove'}" ${attrs} aria-label="Retirer">${I('x', 14)}</button>
  </li>`;
}
/* Un champ de la fiche technique : la saisie, et dessous ses valeurs déjà utilisées */
function specHTML(side, f, val, draft) {
  const vals = val ? [] : fieldValues(side, f.id, 5);
  const attr = draft ? `data-draft-spec="${f.id}"` : `data-spec="${f.id}"`;
  return `<div class="prop spec"><span class="prop-k">${esc(f.name)}</span><div class="spec-v">
    <input class="prop-in" ${attr} value="${esc(val || '')}" placeholder="…" enterkeyhint="done" aria-label="${esc(f.name)}">
    ${vals.length ? `<div class="spec-chips">${vals.map((v) => `<button class="spec-chip" data-action="${draft ? 'draft-spec-pick' : 'spec-pick'}" data-f="${f.id}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>` : ''}
  </div></div>`;
}
function dayLabel(t) {
  const d = new Date(t); const a = new Date(); a.setHours(0, 0, 0, 0);
  const diff = Math.round((a - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (diff === 0) return 'Aujourd’hui';
  if (diff === 1) return 'Hier';
  return cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
}
function journalHTML(p) {
  const all = journalOf(p); let last = '';
  const items = all.map((e) => {
    const day = dayLabel(e.at); const head = day !== last ? `<li class="jr-day">${esc(day)}</li>` : ''; last = day;
    const hour = new Date(e.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    let body;
    if (e.kind === 'step') body = `<span class="jr-mark"><i class="sq"></i></span><span class="jr-txt"><b>${esc(e.text)}</b> fait</span>`;
    else if (e.kind === 'start' || e.kind === 'end') body = `<span class="jr-mark"><i class="jr-dot"></i></span><span class="jr-txt">${esc(e.text)}</span>`;
    else {
      const u = e.photo ? Covers.url(e.photo) : '';
      body = `<span class="jr-mark">${I(e.photo ? 'image' : 'pen', 15)}</span><span class="jr-txt">${e.text ? esc(e.text) : ''}${e.photo ? `<button class="jr-photo${u ? ' has-img' : ''}" data-cover="${esc(e.photo)}"${u ? ` style="--img:url('${u}')"` : ''} data-action="photo-zoom" aria-label="Agrandir la photo"></button>` : ''}</span>
        <button class="x jr-x" data-action="log-remove" data-p="${p.id}" data-id="${e.id}" aria-label="Retirer du journal">${I('x', 14)}</button>`;
    }
    return `${head}<li class="jr-item jr-${e.kind}"><span class="jr-h">${hour}</span>${body}</li>`;
  }).join('');
  return `<div class="sec jr"><div class="sec-head"><h3>Journal</h3><span class="n">Il se remplit tout seul à chaque étape cochée</span></div>
    <label class="add-row boxed jr-add">${I('pen', 17)}<input id="log-input" placeholder="Noter quelque chose sur ce livre" data-enter="log-add" data-id="${p.id}" autocomplete="off" enterkeyhint="done">
      <span class="jr-cam" title="Ajouter une photo au journal">${I('image', 18)}<input type="file" accept="image/*" id="log-photo" aria-label="Ajouter une photo au journal"></span></label>
    <ul class="jr-list">${items}</ul></div>`;
}
function pageHTML(m) {
  const p = P(m.id); if (!p) return '';
  const sd = state.sides[p.side]; const pr = progress(p); const ph = phase(p); const nx = nextStep(p); const ty = typeOf(p);
  const dd = p.deliverables.filter((d) => d.done).length;
  const hasImg = !!(p.cover && p.cover.t === 'img'); const u = hasImg ? Covers.url(p.cover.key) : '';
  ui.stepsOpen = ui.stepsOpen || {};
  let st;
  if (p.archived) st = `Terminé${p.archivedAt ? ' le ' + dateFr(p.archivedAt) : ''}.`;
  else if (ph === 'livrables') st = 'Toutes les étapes sont faites. Plus que les livrables.';
  else if (pr.total) st = `<b>${pr.done}</b> ${pr.done > 1 ? 'étapes faites' : 'étape faite'} sur ${pr.total}${nx ? `. Ensuite, ${esc(nx.name)}.` : '.'}`;
  else st = 'Aucune étape pour l’instant.';
  const prop = (k, inner) => `<div class="prop"><span class="prop-k">${k}</span>${inner}</div>`;
  const inp = (f, v, ph2, type) => `<input class="prop-in" ${type ? `type="${type}"` : ''} data-pfield="${f}" value="${esc(v)}" placeholder="${ph2 || ''}" enterkeyhint="done">`;
  const doneSteps = p.steps.filter((x) => x.done); const todo = p.steps.filter((x) => !x.done);
  const showDone = !!ui.stepsOpen[p.id] || !todo.length;
  const fields = fieldsOn(p.side);
  return `
  <div class="pg s-${p.side}">
    <header class="pg-hero${hasImg ? ' with-photo' : ''}">
      <div class="pg-text">
        <p class="pg-kicker"><i class="sq"></i><span>${esc([sd.name, ty && ty.name, p.client && 'pour ' + p.client].filter(Boolean).join(', '))}</span>${dueHTML(p)}</p>
        <textarea class="pg-title" data-pfield="title" rows="1" aria-label="Titre du livre" spellcheck="false">${esc(p.title)}</textarea>
        <p class="pg-state">${st}</p>
        ${pr.total ? `<div class="pg-cells">${cellsHTML(p, { big: true, next: ph === 'encours' ? nx : null })}</div>` : ''}
      </div>
      <label class="pg-photo${u ? ' has-img' : ''}"${hasImg ? ` data-cover="${esc(p.cover.key)}"` : ''}${u ? ` style="--img:url('${u}')"` : ''} title="${hasImg ? 'Changer la photo' : 'Ajouter une photo'}">
        <span>${I('image', 22)}${m.busy ? 'Préparation…' : 'Photo du livre'}</span>
        <input type="file" accept="image/*" id="cover-file" aria-label="${hasImg ? 'Changer la photo' : 'Ajouter une photo'}">
      </label>
      <button class="close pg-close" data-action="close-sheet" aria-label="Fermer">${I('x', 20)}</button>
    </header>
    <div class="pg-body scroller">
      <aside class="pg-side">
        ${p.archived ? `<div class="banner"><span>Terminé${p.archivedAt ? ' le ' + dateFr(p.archivedAt) : ''}.</span><button class="btn small" data-action="unarchive" data-id="${p.id}">Le remettre en cours</button></div>` : ''}
        <div class="props">
          ${sd.types.length ? prop('Type', `<div class="chips">${sd.types.map((t) => `<button class="chip-btn${p.kind === t.name ? ' on' : ''}" data-action="set-kind" data-id="${p.id}" data-kind="${esc(t.name)}">${esc(t.name)}</button>`).join('')}</div>`) : ''}
          ${p.side === 'pro' || p.client || p.contact ? prop('Pour', inp('client', p.client, 'Son nom')) + prop('Contact', inp('contact', p.contact, 'Insta, mail, téléphone')) : ''}
          ${p.side === 'pro' || p.due ? prop('À rendre', inp('due', p.due, '', 'date')) : ''}
          ${prop('Début', inp('start', p.start, '', 'date'))}
          ${p.end || ph !== 'encours' ? prop('Fin', inp('end', p.end, '', 'date')) : ''}
        </div>
        <div class="sec"><div class="sec-head"><h3>Fiche technique</h3><button class="link" data-action="open-settings" data-tab="etapes" data-side="${p.side}">Choisir les champs</button></div>
          ${fields.length ? `<div class="props">${fields.map((f) => specHTML(p.side, f, (p.spec || {})[f.id])).join('')}</div>` : '<p class="muted small">Aucun champ pour l’instant. Choisis-les dans Réglages, Modèles de livres.</p>'}
        </div>
        <div class="sec"><div class="sec-head"><h3>Notes</h3></div>
          <textarea class="notes" data-pfield="notes" placeholder="Références, idées, ce qu’il ne faut pas oublier…">${esc(p.notes)}</textarea></div>
        ${hasImg ? `<div class="photo-row" style="margin-top:1rem"><button class="btn small quiet" data-action="remove-photo" data-id="${p.id}">${I('image', 15)}Retirer la photo du livre</button></div>` : ''}
      </aside>
      <section class="pg-main">
        <div class="sec-head"><h3>Étapes</h3><span class="n">${pr.done} sur ${pr.total}</span></div>
        ${doneSteps.length && todo.length ? `<button class="steps-done" data-action="steps-open" data-id="${p.id}">${I('check', 15)}${showDone ? 'Masquer les étapes faites' : `${plural(doneSteps.length, 'étape faite', 'étapes faites')}, les voir`}</button>` : ''}
        <ul class="rows" data-sortable="steps">${p.steps.filter((x) => showDone || !x.done).map((x) => rowHTML('step', p, x)).join('')}</ul>
        <label class="add-row">${I('plus', 17)}<input id="step-input" placeholder="Ajouter une étape" data-enter="add-step" data-id="${p.id}" autocomplete="off" enterkeyhint="done"></label>
        <div class="livr${ph === 'livrables' ? ' is-due' : ''}">
          <div class="sec-head"><h3>Livrables de fin</h3><span class="n">${dd} sur ${p.deliverables.length}</span></div>
          <p class="sec-hint">${ph === 'livrables' ? 'Coche ton dossier : une fois tout coché, le livre passe dans les terminés.' : 'Le dossier à préparer quand toutes les étapes seront faites.'}</p>
          <ul class="rows" data-sortable="livr">${p.deliverables.map((x) => rowHTML('livr', p, x)).join('')}</ul>
          <label class="add-row">${I('plus', 17)}<input id="livr-input" placeholder="Ajouter un livrable" data-enter="add-livr" data-id="${p.id}" autocomplete="off" enterkeyhint="done"></label>
        </div>
        ${journalHTML(p)}
        <footer class="pg-foot">
          <button class="btn quiet small" data-action="duplicate" data-id="${p.id}">${I('copy', 15)}Dupliquer</button>
          ${p.archived ? '' : `<button class="btn quiet small" data-action="archive-now" data-id="${p.id}">${I('archive', 15)}Ranger dans les terminés</button>`}
          <button class="btn quiet small danger" data-action="delete-project" data-id="${p.id}">${I('trash', 15)}Supprimer</button>
        </footer>
      </section>
    </div>
  </div>`;
}

/* ---------- Nouveau livre ---------- */
function newHTML(m) {
  const sd = state.sides[m.side];
  m.skip = m.skip || []; m.extra = m.extra || [];
  m.draft = Object.assign({ title: '', kind: '', client: '', contact: '', due: '', spec: {} }, m.draft || {});
  const n = sd.steps.length - m.skip.length + m.extra.length;
  return `
  ${sheetHead('Nouveau livre', sd.name)}
  <div class="sheet-scroll scroller s-${m.side}">
    <label class="field"><span class="field-k">Titre</span><input class="in big new-title" type="text" data-draft="title" value="${esc(m.draft.title)}" placeholder="Le Chant d’Achille" data-autofocus data-enter="create-project" autocomplete="off" enterkeyhint="go"></label>
    ${sd.types.length ? `<div class="field"><span class="field-k">Type</span><div class="chips">${sd.types.map((t) => `<button class="chip-btn${m.draft.kind === t.name ? ' on' : ''}" data-action="draft-kind" data-kind="${esc(t.name)}">${esc(t.name)}</button>`).join('')}</div></div>` : ''}
    ${m.side === 'pro' ? `<div class="grid2">
      <label class="field"><span class="field-k">Cliente</span><input class="in" data-draft="client" value="${esc(m.draft.client)}" placeholder="Son nom" enterkeyhint="next"></label>
      <label class="field"><span class="field-k">Contact</span><input class="in" data-draft="contact" value="${esc(m.draft.contact)}" placeholder="Insta, mail, téléphone" enterkeyhint="done"></label>
    </div>
    <label class="field"><span class="field-k">À rendre le <em>Facultatif</em></span><input class="in" type="date" data-draft="due" value="${esc(m.draft.due)}"></label>` : ''}
    <div class="field">
      <span class="field-k">Étapes de ce livre <em>Touche celles dont tu n’auras pas besoin.</em></span>
      <div class="chips">
        ${sd.steps.map((t) => { const off = m.skip.includes(t.id); return `<button class="step-chip${off ? ' off' : ''}" data-action="toggle-skip" data-id="${t.id}" aria-pressed="${!off}"><span>${esc(t.name)}</span></button>`; }).join('')}
        ${m.extra.map((x, i) => `<span class="step-chip extra"><span>${esc(x)}</span><button data-action="remove-extra" data-i="${i}" aria-label="Retirer ${esc(x)}">${I('x', 12)}</button></span>`).join('')}
      </div>
      <label class="add-row boxed">${I('plus', 17)}<input id="extra-input" placeholder="Une autre étape, par exemple Envoi du colis" data-enter="add-extra" autocomplete="off" enterkeyhint="done"></label>
    </div>
    ${fieldsOn(m.side).length ? `<div class="field">
      <button class="disclose" data-action="np-spec" aria-expanded="${!!m.specOpen}">${I(m.specOpen ? 'min' : 'plus', 16)}Fiche technique <em>Facultatif, ça se remplit aussi plus tard</em></button>
      ${m.specOpen ? `<div class="props np-spec">${fieldsOn(m.side).map((f) => specHTML(m.side, f, (m.draft.spec || {})[f.id], true)).join('')}</div>` : ''}
    </div>` : ''}
    <div class="np-preview"><span class="cells">${'<i class="c"></i>'.repeat(Math.max(0, n))}</span><span class="bk-n">0/${n}</span></div>
  </div>
  <div class="sheet-foot">
    <span class="muted">${plural(n, 'étape', 'étapes')}</span>
    <button class="btn primary" data-action="create-project">Ajouter le livre</button>
  </div>`;
}

/* ---------- Préparer la journée ----------
   Une ligne par livre : son étape suivante, à cocher pour aujourd'hui.
   Les autres étapes restent repliées tant qu'on ne les demande pas. */
function planRow(p, st, small) {
  const on = inToday(p.id, st.id);
  return `<button class="plan-row${small ? ' sub' : ''}${on ? ' on' : ''}" data-action="toggle-today" data-p="${p.id}" data-s="${st.id}" aria-pressed="${on}">
    <span class="box${on ? ' on ' + mkv(st.id + 'p') : ''}"></span><span class="plan-txt"><b>${esc(st.name)}</b>${small ? '' : `<small>${esc(p.title)}</small>`}</span></button>`;
}
function pickerHTML() {
  ui.planOpen = ui.planOpen || {};
  const planned = state.today.items.filter((it) => !it.free).length;
  const block = (side) => {
    const sd = state.sides[side]; const list = activeProjects(side).filter((p) => nextStep(p));
    if (!list.length) return `<section class="plan s-${side}"><h3><i class="sq"></i>${esc(sd.name)}</h3><p class="muted small">Rien en cours ici.</p></section>`;
    return `<section class="plan s-${side}"><h3><i class="sq"></i>${esc(sd.name)}</h3><ul class="plan-list">${list.map((p) => {
      const rest = p.steps.filter((x) => !x.done); const nx = rest[0]; const others = rest.slice(1); const open = !!ui.planOpen[p.id];
      return `<li class="plan-book">${planRow(p, nx)}
        ${others.length ? `<button class="plan-more" data-action="plan-more" data-id="${p.id}">${open ? 'Masquer les autres étapes' : `Voir les ${plural(others.length, 'autre étape', 'autres étapes')}`}</button>` : ''}
        ${open ? `<div class="plan-sub">${others.map((x) => planRow(p, x, true)).join('')}</div>` : ''}</li>`;
    }).join('')}</ul></section>`;
  };
  return `${sheetHead('Préparer ma journée', 'Coche ce que tu comptes faire aujourd’hui. Pour chaque livre, c’est son étape suivante.')}
    <div class="sheet-scroll scroller">${SIDES.map(block).join('')}</div>
    <div class="sheet-foot"><span class="muted">${planned ? plural(planned, 'étape prévue', 'étapes prévues') : 'Rien de prévu pour l’instant'}</span><button class="btn primary" data-action="close-sheet">C’est prêt</button></div>`;
}

/* ---------- Livres terminés : l'étagère ---------- */
function archivesHTML() {
  const f = ui.archFilter; const all = archivedProjects(); const list = all.filter((p) => f === 'tout' || p.side === f);
  const year = new Date().getFullYear();
  const thisYear = all.filter((p) => p.archivedAt && new Date(p.archivedAt).getFullYear() === year).length;
  const sub = all.length ? `${plural(all.length, 'livre terminé', 'livres terminés')}, dont ${thisYear} en ${year}.` : '';
  return `${sheetHead('Livres terminés', sub)}
  <div class="sheet-scroll scroller">
    <div class="arch-sum"><div class="seg">${[['tout', 'Tous'], ['perso', shortName('perso')], ['pro', shortName('pro')]].map((x) => `<button class="${f === x[0] ? 'on' : ''}" data-action="arch-filter" data-f="${x[0]}">${esc(x[1])}</button>`).join('')}</div></div>
    ${list.length ? `<div class="shelf">${list.map(standHTML).join('')}</div>` : '<div class="shelf-empty">Aucun livre terminé ici pour l’instant. Chaque livre fini viendra se ranger sur cette étagère, avec sa photo si tu en as mis une.</div>'}
  </div>`;
}
function standHTML(p) {
  const hasImg = !!(p.cover && p.cover.t === 'img'); const u = hasImg ? Covers.url(p.cover.key) : '';
  const endT = p.archivedAt || (p.end ? new Date(p.end + 'T12:00').getTime() : 0);
  const startT = p.start ? new Date(p.start + 'T12:00').getTime() : p.created;
  const days = endT && startT ? Math.max(1, Math.round((endT - startT) / 864e5)) : 0;
  const when = p.archivedAt ? new Date(p.archivedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return `<button class="stand s-${p.side}" data-action="open-project" data-id="${p.id}">
    <span class="stand-cover${u ? ' has-img' : ''}"${hasImg ? ` data-cover="${esc(p.cover.key)}"` : ''}${u ? ` style="--img:url('${u}')"` : ''}>
      <span class="big-t">${esc(p.title)}</span>${cellsHTML(p, { next: null })}
    </span>
    <b>${esc(p.title)}</b><small>${when ? `Terminé le ${when}` : 'Terminé'}${days ? `, en ${plural(days, 'jour', 'jours')}` : ''}</small>
  </button>`;
}

/* ---------- Réglages ----------
   Quatre rubriques : ce qu'on voit, les listes proposées aux nouveaux
   livres, ce qui ne concerne que cet appareil, la synchro. */
const SET_TABS = [['affichage', 'Affichage'], ['etapes', 'Modèles de livres'], ['appareil', 'Cet appareil'], ['memoire', 'Synchro et sauvegardes']];
const SET_ALIAS = { apparence: 'affichage', espaces: 'etapes' };
function settingsHTML(m) {
  const tab = SET_ALIAS[ui.setTab] || ui.setTab || 'affichage';
  const body = tab === 'etapes' ? stepsSetHTML() : tab === 'appareil' ? deviceSetHTML() : tab === 'memoire' ? memoryHTML(m) : displaySetHTML();
  return `${sheetHead('Réglages')}
    <div class="set-tabs" role="tablist">${SET_TABS.map((t) => `<button class="${tab === t[0] ? 'on' : ''}" data-action="set-tab" data-tab="${t[0]}" role="tab" aria-selected="${tab === t[0]}">${t[1]}</button>`).join('')}</div>
    <div class="sheet-scroll scroller set-body">${body}</div>`;
}
const swRow = (key, on, label, sub, local) => `<label class="switch-row"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" class="switch" ${on ? 'checked' : ''} data-${local ? 'local' : 'pref'}="${key}"></label>`;
function displaySetHTML() {
  const pr = state.prefs;
  const seg = (key, opts) => `<div class="seg">${opts.map((o) => `<button class="${pr[key] === o[0] ? 'on' : ''}" data-action="set-pref" data-k="${key}" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>`;
  const demo = (side) => `<span class="cells">${[1, 1, 1, 2, 0, 0, 0].map((v, i) => `<i class="c${v === 1 ? ' d m' + (1 + i % 4) : ''}${v === 2 ? ' n' : ''}"></i>`).join('')}</span>`;
  return `
    <div class="set-group"><h4>Jour ou nuit</h4>${seg('theme', [['clair', 'Jour'], ['sombre', 'Nuit'], ['auto', 'Comme l’appareil']])}</div>
    <div class="set-group"><h4>Les deux espaces</h4>
      <p class="muted">Leur nom, et la couleur du surligneur qui marque ce qui est fait.</p>
      <div class="space-pair">${SIDES.map((side) => {
        const sd = state.sides[side];
        return `<div class="space-set s-${side}" id="set-${side}">
          <label class="field"><span class="field-k">Nom</span><input class="in name" data-space-name="${side}" value="${esc(sd.name)}" enterkeyhint="done"></label>
          <div class="field"><span class="field-k">Couleur</span><div class="swatches">${MARKERS.map((x) => `<button class="swatch${sd.color === x[1] ? ' on' : ''}" style="--c:${x[1]}" data-action="set-color" data-side="${side}" data-hex="${x[1]}" title="${x[0]}" aria-label="${x[0]}" aria-pressed="${sd.color === x[1]}"></button>`).join('')}</div></div>
          <div class="space-demo">${demo(side)}<span class="bk-n">3/7</span></div>
        </div>`;
      }).join('')}</div>
    </div>
    <div class="set-group"><h4>Sur le tableau</h4>
      ${swRow('tables', pr.tables !== false, 'Le carnet sous le tableau', 'L’avancement en pourcentage et le tableau croisé de chaque espace')}
      ${swRow('links', pr.links !== false, 'Barre de favoris', 'Drive, Gmail, Shopify, Enbooken, Pinterest, Cosmos, Pour Inès')}
    </div>`;
}
function stepsSetHTML() {
  const side = ui.setSide || 'perso'; const sd = state.sides[side];
  return `
    <p class="set-intro">Ce qui est proposé quand tu crées un livre, pour chaque espace. À régler une fois. Les changements ne touchent pas aux livres déjà commencés (sauf la fiche technique, qui s’adapte partout).</p>
    <div class="seg set-side">${SIDES.map((x) => `<button class="${side === x ? 'on' : ''}" data-action="set-side" data-side="${x}"><i class="sq s-${x}"></i>${esc(shortName(x))}</button>`).join('')}</div>
    <div class="space-set s-${side}" id="set-${side}">
      ${tplListHTML(side, 'steps', 'Les étapes, dans l’ordre', 'Ajouter une étape')}
      ${tplListHTML(side, 'deliverables', 'Les livrables de fin', 'Ajouter un livrable')}
      ${typesSetHTML(side)}
      ${fieldsSetHTML(side)}
    </div>`;
}
function deviceSetHTML() {
  const mood = LOCAL.muMood || 'pose';
  return `
    <p class="set-intro">Ces réglages ne valent que pour cet appareil.</p>
    <div class="set-group"><h4>Affichage</h4>
      <div class="switch-row"><span><b>Taille</b><small>${Math.round((LOCAL.zoom || 1) * 100)} %</small></span><div class="size" style="display:inline-flex"><button data-action="zoom" data-d="-1" aria-label="Plus petit">A</button><button data-action="zoom" data-d="1" aria-label="Plus grand">A</button></div></div>
      ${swRow('dense', !!LOCAL.dense, 'Tout voir sur un écran', 'Le tableau resserré (le bouton Tout voir en haut fait pareil)', true)}
    </div>
    ${isPhone() ? '' : `<div class="set-group"><h4>Musique</h4>
      ${swRow('music', LOCAL.music !== false, 'Bouton Musique', 'La musique d’Amélien, seulement quand tu appuies dessus', true)}
      ${LOCAL.music !== false ? `<div class="switch-row"><span><b>Ambiance</b></span><div class="seg">${MOODS.map((x) => `<button class="${mood === x[0] ? 'on' : ''}" data-action="mu-mood" data-v="${x[0]}">${x[1]}</button>`).join('')}</div></div>` : ''}
    </div>`}
    <div class="set-group"><h4>Quand tu coches</h4>
      ${swRow('haptics', LOCAL.haptics, 'Vibrations', 'Un petit retour, sur iPhone et Android', true)}
      ${swRow('sounds', LOCAL.sounds, 'Sons', 'Un petit son', true)}
      ${swRow('calm', LOCAL.calm, 'Animations réduites', 'Les coups de surligneur se posent sans bouger', true)}
    </div>`;
}
function tplListHTML(side, key, title, ph) {
  return `<div class="tpl"><h4>${title}</h4>
    <ul class="rows" data-sortable="tpl-${side}-${key}">${state.sides[side][key].map((t) => `
      <li class="row" data-id="${t.id}"><span class="grip" aria-hidden="true">${I('grip', 15)}</span>
      <input class="row-name" value="${esc(t.name)}" data-tpl="${side}|${key}|${t.id}" aria-label="Nom" enterkeyhint="done">
      <button class="x row-x" data-action="tpl-remove" data-side="${side}" data-key="${key}" data-id="${t.id}" aria-label="Supprimer ${esc(t.name)}">${I('x', 14)}</button></li>`).join('')}</ul>
    <label class="add-row">${I('plus', 17)}<input id="tpl-${side}-${key}" placeholder="${ph}" data-enter="tpl-add" data-side="${side}" data-key="${key}" autocomplete="off" enterkeyhint="done"></label></div>`;
}
function fieldsSetHTML(side) {
  return `<div class="tpl"><h4>La fiche technique</h4>
    <p class="muted small" style="margin:-.1rem 0 .5rem">Coche ce que tu veux noter pour chaque livre. Les réponses déjà données te sont reproposées en un toucher.</p>
    <ul class="rows" data-sortable="fields-${side}">${state.sides[side].fields.map((f) => `
      <li class="row field-row" data-id="${f.id}"><span class="grip" aria-hidden="true">${I('grip', 15)}</span>
      <button class="box${f.on ? ' on m2' : ''}" data-action="field-toggle" data-side="${side}" data-id="${f.id}" aria-pressed="${f.on}" aria-label="${f.on ? 'Ne plus demander' : 'Demander'} « ${esc(f.name)} »"></button>
      <input class="row-name" value="${esc(f.name)}" data-field="${side}|${f.id}" aria-label="Nom du champ" enterkeyhint="done">
      <button class="x row-x" data-action="field-remove" data-side="${side}" data-id="${f.id}" aria-label="Supprimer ${esc(f.name)}">${I('x', 14)}</button></li>`).join('')}</ul>
    <label class="add-row">${I('plus', 17)}<input id="field-${side}" placeholder="Ajouter un champ, par exemple Police" data-enter="field-add" data-side="${side}" autocomplete="off" enterkeyhint="done"></label></div>`;
}
function typesSetHTML(side) {
  return `<div class="tpl"><h4>Les types de livre</h4>
    <ul class="rows">${state.sides[side].types.map((t) => `
      <li class="row" data-id="${t.id}" style="grid-template-columns:minmax(0,1fr) auto">
      <input class="row-name" value="${esc(t.name)}" data-type="${side}|${t.id}" aria-label="Nom" enterkeyhint="done">
      <button class="x row-x" data-action="type-remove" data-side="${side}" data-id="${t.id}" aria-label="Supprimer ${esc(t.name)}">${I('x', 14)}</button></li>`).join('')}</ul>
    <label class="add-row">${I('plus', 17)}<input id="type-${side}" placeholder="Ajouter un type, par exemple Réparation" data-enter="type-add" data-side="${side}" autocomplete="off" enterkeyhint="done"></label></div>`;
}
function syncStatusHTML() {
  const s = Sync.status; const on = Sync.enabled();
  let title; let sub; let st = on ? s : 'off';
  if (!on) { title = 'Seulement sur cet appareil'; sub = 'Branche la synchro pour retrouver tout sur l’ordi, le téléphone et l’iPad, sans jamais rien perdre.'; }
  else if (['ok', 'pending', 'saving'].includes(s)) { title = s === 'ok' ? 'Tout est enregistré en ligne' : 'Enregistrement en cours'; sub = Sync.cfg.lastOk ? `Dernière synchro ${ago(Sync.cfg.lastOk)}.` : ''; st = 'ok'; }
  else if (s === 'offline') { title = 'Hors ligne pour l’instant'; sub = 'Rien n’est perdu : c’est gardé sur l’appareil et ça partira au retour du réseau.'; }
  else { title = 'La synchro a un souci'; sub = Sync.msg; }
  return `<div class="sync-card st-${st}" id="sync-status"><i class="sync-dot"></i><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>${on ? '<button class="btn small" data-action="sync-now">Synchroniser</button>' : ''}</div>`;
}
function memoryHTML(m) {
  const on = Sync.enabled();
  const msg = m.msg ? `<p class="msg ${m.err ? 'err' : 'ok'}">${esc(m.msg)}</p>` : '';
  const paste = navigator.clipboard && navigator.clipboard.readText;
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
      <div class="btn-row">${paste ? `<button class="btn primary" data-action="paste-link">${I('copy', 16)}Coller le lien</button><button class="btn" data-action="connect">Connecter</button>` : '<button class="btn primary" data-action="connect">Connecter</button>'}</div>
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
  return '<div class="tip"><b>Ajoute l’atelier à l’écran d’accueil</b>Dans Safari : Partager, puis « Sur l’écran d’accueil ». Il s’ouvrira comme une appli et l’iPhone ne l’effacera jamais. Une fois dedans, rouvre le lien de connexion.</div>';
}
function historyListHTML(m) {
  const h = m.hist;
  if (!h) return '';
  if (h === 'loading') return '<p class="muted" style="margin-top:.8rem">Chargement…</p>';
  if (h.error) return `<p class="msg err">${esc(h.error)}</p>`;
  if (!h.items.length) return '<p class="muted" style="margin-top:.8rem">Rien pour l’instant.</p>';
  return `<ul class="hist">${h.items.map((x) => `<li><div><b>${esc(x.label)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</div><button class="btn small" data-action="restore" data-src="${h.src}" data-ref="${esc(x.ref)}">Revenir à cette version</button></li>`).join('')}</ul>
    ${h.more ? `<button class="btn quiet small" data-action="load-history" data-page="${h.page + 1}">Voir plus ancien</button>` : ''}`;
}

/* ---------- Bienvenue / lien de connexion ---------- */
function welcomeCode() {
  const seq = [1, 1, 1, 1, 0, 0, 2, 2, 2, 2, 2, 0];
  return `<div class="wl-code"><span class="cells">${seq.map((v, i) => `<i class="c${v ? ' d m' + (1 + (i % 4)) + (v === 1 ? ' s-perso' : ' s-pro') : ''}" style="--i:${i}"></i>`).join('')}</span></div>`;
}
function welcomeHTML(m) {
  const msg = m.msg ? `<p class="msg ${m.err ? 'err' : 'ok'}">${esc(m.msg)}</p>` : '';
  const paste = navigator.clipboard && navigator.clipboard.readText;
  if (m.link) {
    return `<div class="sheet-scroll welcome scroller"><h1 class="logo" role="img" aria-label="Parinès"></h1>${welcomeCode()}
      <h2>Connecter cet appareil ?</h2>
      <p class="lead">Il retrouvera tous les livres de l’atelier, et tout ce que tu feras ici sera enregistré en ligne.</p>${msg}
      <div class="btn-col"><button class="btn primary big" data-action="welcome-connect">Connecter</button><button class="btn quiet" data-action="close-sheet">Pas maintenant</button></div></div>`;
  }
  return `<div class="sheet-scroll welcome scroller"><h1 class="logo" role="img" aria-label="Parinès"></h1>${welcomeCode()}
    <p class="lead">Les binds perso d’un côté, les commandes de l’autre, et au milieu ce que tu fais aujourd’hui.</p>
    <div class="welcome-card"><b>Tu as reçu un lien de connexion ?</b>
      <label class="add-row boxed">${I('link', 17)}<input id="connect-input" placeholder="Colle-le ici" data-enter="connect" autocomplete="off" spellcheck="false"></label>
      <div class="btn-row">${paste ? `<button class="btn primary" data-action="paste-link">${I('copy', 16)}Coller le lien</button><button class="btn" data-action="connect">Connecter</button>` : '<button class="btn primary" data-action="connect">Connecter</button>'}</div>${msg}</div>
    <div class="btn-col"><button class="btn" data-action="start-blank">Commencer avec un atelier vide</button><button class="btn quiet" data-action="start-demo">Découvrir avec des exemples</button></div></div>`;
}

/* ---------- Petites fenêtres ---------- */
function askHTML(m) {
  return `<div class="ask"><h3>${esc(m.title)}</h3>${m.text ? `<p>${esc(m.text)}</p>` : ''}
    <div class="ask-btns"><button class="btn quiet" data-action="ask-no">${esc(m.no || 'Annuler')}</button><button class="btn ${m.danger ? 'danger-fill' : 'primary'}" data-action="ask-yes">${esc(m.ok || 'OK')}</button></div></div>`;
}
function celebrateHTML(m) {
  const p = P(m.id); if (!p) return '';
  const dd = p.deliverables.filter((d) => d.done).length;
  const who = p.side === 'pro' && (p.client || p.contact) ? ` Pour ${esc([p.client, p.contact].filter(Boolean).join(', '))}.` : '';
  return `<div class="celebrate s-${p.side}">
    <div class="cel-mark">${cellsHTML(p, { big: true, next: null })}</div>
    <h2>${esc(p.title)}<span>Toutes les étapes sont faites.</span></h2>
    <p>Avant de le ranger dans les terminés, il reste ton dossier de livrables.${who}</p>
    <ul class="rows cel-list">${p.deliverables.map((d) => `<li class="row${d.done ? ' done' : ''}" data-id="${d.id}"><button class="box${d.done ? ' on ' + mkv(d.id) : ''}${flashed(d.id) ? ' just' : ''}" data-action="livr-toggle" data-p="${p.id}" data-d="${d.id}" aria-label="Cocher « ${esc(d.name)} »"></button><span class="row-label">${esc(d.name)}</span></li>`).join('')}</ul>
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
  return m.items.map((it, i) => `<li><button class="pal-item${i === m.sel ? ' sel' : ''}" data-action="pal-run" data-i="${i}"><span class="pal-ic">${it.ic}</span><span class="pal-txt">${it.label}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button></li>`).join('');
}
function paletteItems(q) {
  const f = fold(q).trim(); const out = []; const raw = q.trim();
  state.projects
    .filter((p) => !f || fold(p.title).includes(f) || fold(p.client).includes(f) || fold(p.kind).includes(f))
    .sort((a, b) => a.archived - b.archived)
    .slice(0, f ? 8 : 5)
    .forEach((p) => out.push({ ic: `<i class="sq s-${p.side}"></i>`, label: esc(p.title), sub: (p.archived ? 'Terminé, ' : '') + state.sides[p.side].name, run: () => openSheet({ type: 'page', id: p.id }) }));
  if (f) {
    SIDES.forEach((side) => out.push({ ic: I('plus', 16), label: `Nouveau livre « ${esc(raw)} »`, sub: state.sides[side].name, run: () => openSheet({ type: 'new', side, draft: { title: raw } }) }));
    out.push({ ic: I('sun', 16), label: `Noter « ${esc(raw)} » pour aujourd’hui`, sub: 'Tâche libre', run: () => addFree(raw) });
  }
  const nav = [
    [I('plus', 16), `Nouveau livre, ${state.sides.perso.name}`, () => openSheet({ type: 'new', side: 'perso' })],
    [I('plus', 16), `Nouveau livre, ${state.sides.pro.name}`, () => openSheet({ type: 'new', side: 'pro' })],
    [I('books', 16), 'Livres terminés', () => openSheet({ type: 'archives' })],
    [I('grid', 16), 'Le carnet', () => actions['goto-carnet']()],
    [I('sun', 16), 'Préparer ma journée', () => openSheet({ type: 'picker' })],
    [I('sliders', 16), 'Affichage et couleurs', () => openSettings('affichage')],
    [I('stack', 16), 'Étapes des livres', () => openSettings('etapes')],
    [I('sliders', 16), 'Musique et réglages de cet appareil', () => openSettings('appareil')],
    [I('history', 16), 'Synchro et sauvegardes', () => openSettings('memoire')],
    [I('sun', 16), 'Passer en jour ou en nuit', () => toggleTheme()],
  ];
  nav.filter((x) => !f || fold(x[1]).includes(f)).forEach((x) => out.push({ ic: x[0], label: esc(x[1]), run: x[2] }));
  return out.slice(0, 14);
}

/* ---------- Messages ---------- */
function toast(msg, o) {
  o = o || {};
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>${o.action ? `<button>${esc(o.action)}</button>` : ''}`;
  if (o.action) el.querySelector('button').addEventListener('click', () => { o.onAction(); el.remove(); });
  root.appendChild(el);
  while (root.children.length > 2) root.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, o.timeout || (o.action ? 6000 : 3000));
}

/* Zones de texte qui s'agrandissent toutes seules */
function autoGrow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
function autoGrowAll(root) { $$('textarea.pg-title, textarea.notes', root).forEach(autoGrow); }
