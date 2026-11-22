'use strict';
/* =====================================================================
   ATELIER · affichage
   Le tableau d'Inès, d'après son croquis : la bibliothèque perso à
   gauche, l'activité pro à droite, la feuille du jour posée sur la
   couture, et dessous le carnet (le tableau croisé de son cahier).
   La couleur ne sert qu'à montrer ce qui est fait, au surligneur.
   ===================================================================== */

const ui = { sheet: null, pop: null, tab: 'today', expanded: null, flash: null, archFilter: 'tout', setTab: 'apparence', showDone: false };

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
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
  next: '<path d="M5 5v14l10-7z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
  prev: '<path d="M19 5v14L9 12z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
  min: '<path d="M6 9l6 6 6-6"/>',
  max: '<path d="M6 15l6-6 6 6"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
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
      <button class="tb hide-phone" data-action="open-archives">Terminés${na ? `<span class="n">${na}</span>` : ''}</button>
      ${syncBtn()}
      <button class="tb" data-action="open-settings" aria-label="Réglages">${I('sliders', 19)}<span class="lbl">Réglages</span></button>
    </div>
    ${dockHTML()}`;
}
function miniCodeHTML() {
  const parts = [];
  SIDES.forEach((side, k) => {
    const list = activeProjects(side); if (!list.length) return;
    if (parts.length) parts.push('<i class="g"></i>');
    list.forEach((p) => p.steps.forEach((s) => parts.push(`<i class="${s.done ? 'd s-' + side : ''}"></i>`)));
  });
  return `<span class="mini-code" aria-hidden="true">${parts.slice(0, 120).join('')}</span>`;
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
  const mu = LOCAL.music !== false
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
      : `<div class="empty"><p>Aucun livre en cours ici.</p><button class="btn" data-action="new-project" data-side="${side}">${I('plus', 16)}Commencer un livre</button></div>`}
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
      ${es.length ? `<div class="td-count"><b>${done}</b><small>sur ${es.length}</small></div>` : ''}
    </header>
    ${es.length ? `<div class="td-meter"><span class="cells">${es.map((e) => `<i class="c${e.done ? ' d ' + mkv(e.it.id) : ''}${flashed(e.it.id) ? ' just' : ''} ${e.free ? 's-free' : 's-' + e.p.side}"${e.free ? ' style="--c:var(--sun)"' : ''}></i>`).join('')}</span></div>` : ''}
    ${groups.length ? groups.map((g) => `
      <section class="td-group${g[0] === 'free' ? '' : ' s-' + g[0]}">
        <h3 class="td-g${g[0] === 'free' ? ' free' : ''}"><i></i>${esc(g[1])}<span class="n">${g[2].filter((e) => !e.done).length || ''}</span></h3>
        <ul class="td-list" data-sortable="today">${g[2].filter(shown).map(todoHTML).join('')}</ul>
      </section>`).join('') : `<p class="td-empty">${all ? 'Tout ce qui était prévu est fait. Belle journée.' : 'Rien de prévu pour l’instant. Note une tâche, ou pioche une étape juste en dessous.'}</p>`}
    ${done ? `<button class="td-done-toggle" data-action="toggle-done">${I('check', 15)}${ui.showDone ? 'Masquer ce qui est fait' : `${plural(done, 'tâche faite', 'tâches faites')} aujourd’hui`}</button>` : ''}
    <label class="td-add">${I('plus', 18)}<input id="free-input" type="text" placeholder="Noter une tâche" data-enter="add-free" autocomplete="off" enterkeyhint="done"></label>
    ${sug.length ? `<div class="td-sugg"><h4>Pour la suite</h4>${sug.map((x) => `
      <button class="sugg s-${x.p.side}" data-action="today-add" data-p="${x.p.id}" data-s="${x.st.id}">
        <span class="pl">${I('plus', 14)}</span><span><b>${esc(x.st.name)}</b><small>${esc(x.p.title)}</small></span><i class="dot"></i>
      </button>`).join('')}</div>` : ''}
    <button class="td-pick" data-action="open-picker">${I('stack', 17)}Choisir parmi toutes les étapes</button>
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
  const ts = SIDES.map((s) => stats(s));
  const month = [t.finished ? plural(t.finished, 'livre terminé', 'livres terminés') : '', t.stepsMonth ? plural(t.stepsMonth, 'étape cochée', 'étapes cochées') : ''].filter(Boolean);
  const off = state.prefs.tables === false;
  return `
  <section class="carnet${off ? ' hide-desk' : ''}" id="carnet">
    <div class="cn-top"><h2>Le carnet</h2>${na ? `<button class="btn small quiet" data-action="open-archives">${I('books', 16)}${plural(na, 'livre terminé', 'livres terminés')}</button>` : ''}</div>
    ${t.total ? `
    <div class="cn-head">
      <div class="cn-big" role="img" aria-label="${t.pct} % de l’atelier accompli"><b>${t.pct}</b><small>%</small></div>
      <div class="cn-cap">
        <p><b>de l’atelier accompli.</b> ${t.done} cases cochées sur ${t.total}, étapes et livrables de ${plural(t.books, 'livre en cours', 'livres en cours')}.</p>
        ${month.length ? `<p>Ce mois-ci : ${month.join(', ')}.</p>` : ''}
      </div>
      ${weekHTML()}
    </div>
    ${codeHTML()}
    <div class="code-legend">${SIDES.map((s, i) => `<span class="s-${s}"><i></i>${esc(state.sides[s].name)}, ${ts[i].pct} %</span>`).join('')}<span><i class="todo"></i>Reste à faire</span></div>`
    : '<p class="mx-empty">Le carnet se remplira au fil des livres.</p>'}
    <div class="mxs">${SIDES.map(matrixHTML).join('')}</div>
  </section>`;
}
/* Toute la liste d'un trait : un bâtonnet par étape et par livrable */
function codeHTML() {
  let html = '';
  SIDES.filter((s) => activeProjects(s).length).forEach((s, k) => {
    if (k) html += '<i class="gg"></i>';
    html += `<span class="s-${s}" style="display:contents">`;
    activeProjects(s).forEach((p, j) => {
      if (j) html += '<i class="g"></i>';
      p.steps.forEach((x) => { html += `<i class="${x.done ? 'd' : ''}"></i>`; });
      p.deliverables.forEach((x) => { html += `<i class="${x.done ? 'd' : ''}"></i>`; });
    });
    html += '</span>';
  });
  return `<div class="code" aria-hidden="true">${html}</div>`;
}
function weekHTML() {
  const wk = weekActivity(7); const total = wk.reduce((n, d) => n + d.perso + d.pro, 0);
  const L = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const MAX = 8;
  return `<div class="week" role="img" aria-label="${plural(total, 'étape cochée', 'étapes cochées')} ces 7 derniers jours">
    <p class="week-cap">Cette semaine : <b>${plural(total, 'étape cochée', 'étapes cochées')}</b></p>
    ${wk.map((d) => {
      const n = d.perso + d.pro; const shownN = Math.min(n, MAX);
      const pp = Math.min(d.perso, shownN); const pr = shownN - pp;
      return `<div><div class="week-col">${'<i class="s-perso"></i>'.repeat(pp)}${'<i class="s-pro"></i>'.repeat(pr)}${n > MAX ? `<span class="more">+${n - MAX}</span>` : ''}</div></div>`;
    }).join('')}
    ${wk.map((d, i) => `<p class="week-l${i === wk.length - 1 ? ' now' : ''}">${L[d.date.getDay()]}</p>`).join('')}
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
  const head = `<div class="mx-head s-${side}"><h3>${esc(sd.name)}</h3><span class="mx-bar"><i style="width:${t.pct}%"></i></span><span class="p">${t.pct} %</span></div>`;
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
  return `<div class="mx-wrap s-${side}">${head}<div class="mx-scroll"><table class="mx">
    <thead><tr><th></th>${m.cols.map((c) => `<th class="v"><span title="${esc(c.name)}">${esc(c.name)}</span></th>`).join('')}<th class="v dt"><span>Début</span></th><th class="v dt"><span>Fin</span></th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}

/* ---------- Onglets (téléphone) ---------- */
function renderTabbar() {
  const n = todayEntries().filter((e) => !e.done).length;
  const tabs = [
    ['today', 'Aujourd’hui', n, I('sun', 20), ''],
    ['perso', shortName('perso'), activeProjects('perso').length, '<i class="sq"></i>', 's-perso'],
    ['pro', shortName('pro'), activeProjects('pro').length, '<i class="sq"></i>', 's-pro'],
    ['carnet', 'Carnet', 0, I('grid', 20), ''],
  ];
  $('#tabbar').innerHTML = tabs.map((t) => `
    <button class="tab ${t[4]}${ui.tab === t[0] ? ' on' : ''}" data-action="tab" data-tab="${t[0]}"><span class="tab-ic">${t[3]}${t[2] ? `<span class="tab-n">${t[2]}</span>` : ''}</span><span class="tab-lbl">${esc(t[1])}</span></button>`).join('');
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
function pageHTML(m) {
  const p = P(m.id); if (!p) return '';
  const sd = state.sides[p.side]; const pr = progress(p); const ph = phase(p); const nx = nextStep(p); const ty = typeOf(p);
  const dd = p.deliverables.filter((d) => d.done).length;
  const hasImg = !!(p.cover && p.cover.t === 'img'); const u = hasImg ? Covers.url(p.cover.key) : '';
  let st;
  if (p.archived) st = `Terminé${p.archivedAt ? ' le ' + dateFr(p.archivedAt) : ''}.`;
  else if (ph === 'livrables') st = 'Toutes les étapes sont faites. Plus que les livrables.';
  else if (pr.total) st = `<b>${pr.done}</b> ${pr.done > 1 ? 'étapes faites' : 'étape faite'} sur ${pr.total}${nx ? `. Ensuite, ${esc(nx.name)}.` : '.'}`;
  else st = 'Aucune étape pour l’instant.';
  const prop = (k, inner) => `<div class="prop"><span class="prop-k">${k}</span>${inner}</div>`;
  const inp = (f, v, ph2, type) => `<input class="prop-in" ${type ? `type="${type}"` : ''} data-pfield="${f}" value="${esc(v)}" placeholder="${ph2 || ''}" enterkeyhint="done">`;
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
        <span>${I('image', 22)}${m.busy ? 'Préparation…' : 'Ajouter une photo'}</span>
        <input type="file" accept="image/*" id="cover-file" aria-label="${hasImg ? 'Changer la photo' : 'Ajouter une photo'}">
      </label>
      <button class="close pg-close" data-action="close-sheet" aria-label="Fermer">${I('x', 20)}</button>
    </header>
    <div class="pg-body scroller">
      <aside class="pg-side">
        ${p.archived ? `<div class="banner"><span>Terminé${p.archivedAt ? ' le ' + dateFr(p.archivedAt) : ''}.</span><button class="btn small" data-action="unarchive" data-id="${p.id}">Le remettre en cours</button></div>` : ''}
        <div class="props">
          ${prop('Type', `<div class="chips">${sd.types.map((t) => `<button class="chip-btn${p.kind === t.name ? ' on' : ''}" data-action="set-kind" data-id="${p.id}" data-kind="${esc(t.name)}">${esc(t.name)}</button>`).join('') || '<span class="muted small">À créer dans Réglages</span>'}</div>`)}
          ${p.side === 'pro' || p.client || p.contact ? prop('Cliente', inp('client', p.client, 'Son nom')) + prop('Contact', inp('contact', p.contact, 'Insta, mail, téléphone')) : ''}
          ${p.side === 'pro' || p.due ? prop('À rendre', inp('due', p.due, '', 'date')) : ''}
          ${prop('Début', inp('start', p.start, '', 'date'))}
          ${prop('Fin', inp('end', p.end, '', 'date'))}
        </div>
        <div class="sec" style="margin-top:1.6rem"><div class="sec-head"><h3>Notes</h3></div>
          <textarea class="notes" data-pfield="notes" placeholder="Papier, couleurs, références, idées…">${esc(p.notes)}</textarea></div>
        ${hasImg ? `<div class="photo-row" style="margin-top:1rem"><button class="btn small quiet" data-action="remove-photo" data-id="${p.id}">${I('image', 15)}Retirer la photo</button></div>` : ''}
      </aside>
      <section class="pg-main">
        <div class="sec-head"><h3>Étapes</h3><span class="n">${pr.done} sur ${pr.total}</span></div>
        <ul class="rows" data-sortable="steps">${p.steps.map((x) => rowHTML('step', p, x)).join('')}</ul>
        <label class="add-row">${I('plus', 17)}<input id="step-input" placeholder="Ajouter une étape" data-enter="add-step" data-id="${p.id}" autocomplete="off" enterkeyhint="done"></label>
        <div class="livr${ph === 'livrables' ? ' is-due' : ''}">
          <div class="sec-head"><h3>Livrables de fin</h3><span class="n">${dd} sur ${p.deliverables.length}</span></div>
          <p class="sec-hint">${ph === 'livrables' ? 'Coche ton dossier : une fois tout coché, le livre passe dans les terminés.' : 'Le dossier à préparer quand toutes les étapes seront faites.'}</p>
          <ul class="rows" data-sortable="livr">${p.deliverables.map((x) => rowHTML('livr', p, x)).join('')}</ul>
          <label class="add-row">${I('plus', 17)}<input id="livr-input" placeholder="Ajouter un livrable" data-enter="add-livr" data-id="${p.id}" autocomplete="off" enterkeyhint="done"></label>
        </div>
        <footer class="pg-foot">
          <span class="muted">${p.created ? 'Commencé le ' + dateFr(p.created) : ''}</span>
          <button class="btn quiet small" data-action="duplicate" data-id="${p.id}">${I('copy', 15)}Dupliquer</button>
          ${p.archived ? '' : `<button class="btn quiet small" data-action="archive-now" data-id="${p.id}">${I('archive', 15)}Ranger</button>`}
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
  m.draft = Object.assign({ title: '', kind: '', client: '', contact: '', due: '' }, m.draft || {});
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
    <div class="np-preview"><span class="cells">${'<i class="c"></i>'.repeat(Math.max(0, n))}</span><span class="bk-n">0/${n}</span></div>
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
    return `<div class="pick-side s-${side}"><h3><i class="sq"></i>${esc(sd.name)}</h3>${list.length ? list.map((p) => `
      <div class="pick-book"><div class="pick-title">${esc(p.title)}</div><div class="chips">${p.steps.filter((s) => !s.done).map((s, i) => {
        const on = inToday(p.id, s.id);
        return `<button class="pick-chip${on ? ' on' : ''}${i === 0 ? ' first' : ''}" data-action="${on ? 'today-remove-step' : 'today-add'}" data-p="${p.id}" data-s="${s.id}"><span>${esc(s.name)}</span></button>`;
      }).join('')}</div></div>`).join('') : '<p class="muted small">Rien en cours ici.</p>'}</div>`;
  };
  return `${sheetHead('Choisir pour aujourd’hui', 'Touche les étapes que tu vas faire. Celle entourée est la suivante dans l’ordre.')}
    <div class="sheet-scroll scroller">${SIDES.map(block).join('')}</div>
    <div class="sheet-foot"><button class="btn primary" data-action="close-sheet" style="margin-left:auto">C’est bon</button></div>`;
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

/* ---------- Réglages ---------- */
function settingsHTML(m) {
  const tab = ui.setTab;
  const tabs = [['apparence', 'Apparence'], ['espaces', 'Espaces et étapes'], ['memoire', 'Mémoire et synchro']];
  return `${sheetHead('Réglages')}
    <div class="set-tabs" role="tablist">${tabs.map((t) => `<button class="${tab === t[0] ? 'on' : ''}" data-action="set-tab" data-tab="${t[0]}" role="tab" aria-selected="${tab === t[0]}">${t[1]}</button>`).join('')}</div>
    <div class="sheet-scroll scroller set-body">${tab === 'apparence' ? appearanceHTML() : tab === 'espaces' ? spacesSetHTML() : memoryHTML(m)}</div>`;
}
function appearanceHTML() {
  const pr = state.prefs;
  const seg = (key, opts) => `<div class="seg">${opts.map((o) => `<button class="${pr[key] === o[0] ? 'on' : ''}" data-action="set-pref" data-k="${key}" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>`;
  const sw = (key, on, label, sub, local) => `<label class="switch-row"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" class="switch" ${on ? 'checked' : ''} data-${local ? 'local' : 'pref'}="${key}"></label>`;
  return `
    <div class="set-group"><h4>Jour ou nuit</h4>${seg('theme', [['clair', 'Jour'], ['sombre', 'Nuit'], ['auto', 'Comme l’appareil']])}</div>
    <div class="set-group"><h4>Sur le tableau</h4>
      ${sw('tables', pr.tables !== false, 'Le carnet sous le tableau', 'L’avancement en pourcentage et le tableau croisé de chaque espace')}
      ${sw('links', pr.links !== false, 'Barre de favoris', 'Drive, Gmail, Shopify, Enbooken, Pinterest, Cosmos, Pour Inès')}
    </div>
    <div class="set-group"><h4>Sur cet appareil</h4>
      <div class="switch-row"><span><b>Taille de l’affichage</b><small>${Math.round((LOCAL.zoom || 1) * 100)} %</small></span><div class="size" style="display:inline-flex"><button data-action="zoom" data-d="-1" aria-label="Plus petit">A</button><button data-action="zoom" data-d="1" aria-label="Plus grand">A</button></div></div>
      ${sw('music', LOCAL.music !== false, 'Bouton Musique', 'La musique d’Amélien, seulement quand tu la lances', true)}
      ${sw('haptics', LOCAL.haptics, 'Vibrations', 'Un petit retour quand tu coches, sur iPhone et Android', true)}
      ${sw('sounds', LOCAL.sounds, 'Sons', 'Un petit son quand tu coches', true)}
      ${sw('calm', LOCAL.calm, 'Animations réduites', 'Les coups de surligneur se posent sans bouger', true)}
    </div>`;
}
function spacesSetHTML() {
  return SIDES.map((side) => {
    const sd = state.sides[side];
    return `<div class="space-set s-${side}" id="set-${side}">
      <label class="field"><span class="field-k">Nom de l’espace</span><input class="in name" data-space-name="${side}" value="${esc(sd.name)}" enterkeyhint="done"></label>
      <div class="field"><span class="field-k">Couleur du surligneur</span><div class="swatches">${MARKERS.map((x) => `<button class="swatch${sd.color === x[1] ? ' on' : ''}" style="--c:${x[1]}" data-action="set-color" data-side="${side}" data-hex="${x[1]}" title="${x[0]}" aria-label="${x[0]}" aria-pressed="${sd.color === x[1]}"></button>`).join('')}</div></div>
      ${tplListHTML(side, 'steps', 'Étapes proposées à chaque nouveau livre', 'Nouvelle étape')}
      ${tplListHTML(side, 'deliverables', 'Livrables de fin', 'Nouveau livrable')}
      ${typesSetHTML(side)}
    </div>`;
  }).join('') + '<p class="muted small" style="margin-top:1rem">Changer ces listes ne touche pas aux livres déjà en cours : chacun se modifie dans sa propre fiche.</p>';
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
  return `<div class="tpl"><h4>Types</h4>
    <ul class="rows">${state.sides[side].types.map((t) => `
      <li class="row" data-id="${t.id}" style="grid-template-columns:minmax(0,1fr) auto">
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
    [I('sliders', 16), 'Apparence', () => openSettings('apparence')],
    [I('stack', 16), 'Étapes et livrables par défaut', () => openSettings('espaces')],
    [I('history', 16), 'Mémoire et synchro', () => openSettings('memoire')],
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
