'use strict';
/* =====================================================================
   ATELIER · actions
   Tout ce qui modifie quelque chose passe par commit() : enregistrement
   sur l'appareil, copie de secours, synchro, et possibilité d'annuler.
   ===================================================================== */

function saveLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { toast('La mémoire de cet appareil est pleine : la version en ligne garde tout'); }
}
function persist() { saveLocal(); Backup.schedule(); Sync.schedule(); }

/* ---------- Annuler / rétablir ---------- */
const Undo = {
  past: [], future: [],
  push() { this.past.push(JSON.stringify(state)); if (this.past.length > 60) this.past.shift(); this.future = []; },
  undo() {
    if (!this.past.length) { toast('Rien à annuler'); return; }
    this.future.push(JSON.stringify(state));
    applySnapshot(JSON.parse(this.past.pop()));
    toast('Annulé', { action: 'Rétablir', onAction: () => Undo.redo() });
  },
  redo() {
    if (!this.future.length) return;
    this.past.push(JSON.stringify(state));
    applySnapshot(JSON.parse(this.future.pop()));
  },
};

function commit(fn, { sheet = true, pop = true, undo = true } = {}) {
  if (undo) Undo.push();
  fn(state);
  state.seed = false;
  persist();
  applyPrefs();
  renderTop(); renderMain(); renderTabbar();
  if (sheet) renderSheet();
  if (pop) renderPop();
  ui.flash = null;
}

/* Remplace tout par une version reçue (synchro, import) */
function replaceState(next) {
  state = normalize(next);
  rollDay();
  saveLocal(); Backup.schedule();
  renderAll();
}

/* Revient à une version précédente : les éléments qui changent sont
   datés de maintenant pour que la synchro les garde. */
function applySnapshot(snap) {
  snap = normalize(snap); const t = now();
  const cur = new Map(state.projects.map((p) => [p.id, JSON.stringify(p)]));
  const ids = new Set(snap.projects.map((p) => p.id));
  snap.projects.forEach((p) => { if (cur.get(p.id) !== JSON.stringify(p)) p.u = t; delete snap.deleted[p.id]; });
  for (const p of state.projects) if (!ids.has(p.id)) snap.deleted[p.id] = t;
  for (const [id, ts] of Object.entries(state.deleted)) if (!ids.has(id)) snap.deleted[id] = Math.max(ts, snap.deleted[id] || 0);
  if (JSON.stringify(snap.today) !== JSON.stringify(state.today)) snap.today.u = t;
  if (JSON.stringify(snap.sides) !== JSON.stringify(state.sides)) snap.sidesU = t;
  if (JSON.stringify(snap.prefs) !== JSON.stringify(state.prefs)) snap.prefsU = t;
  if (snap.user !== state.user) snap.userU = t;
  if (snap.projects.map((p) => p.id).join() !== state.projects.map((p) => p.id).join()) snap.orderU = t;
  snap.seed = false;
  state = snap;
  persist();
  renderAll();
}

/* ---------- Fenêtres ---------- */
function blurActive() { const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); }
function openSheet(m) {
  blurActive();
  $('#sheet-root').classList.remove('closing');
  if (ui.pop && ui.pop.type !== 'celebrate') ui.pop = null;
  ui.sheet = m;
  renderSheet(); renderPop();
}
function closeSheet() {
  blurActive();
  const root = $('#sheet-root');
  if (ui.sheet && ui.sheet.type === 'welcome' && !localStorage.getItem(LS_KEY)) saveLocal();
  ui.sheet = null;
  if ($('.sheet', root) && !calm()) {
    root.classList.add('closing');
    setTimeout(() => { root.classList.remove('closing'); if (!ui.sheet) renderSheet(); }, 200);
  } else renderSheet();
  lockBody();
}
function openPop(m) { blurActive(); $('#pop-root').classList.remove('closing'); ui.pop = m; renderPop(); }
function closePop() {
  blurActive();
  const root = $('#pop-root'); const m = ui.pop;
  ui.pop = null;
  if (m && m.type === 'ask' && m.resolve) m.resolve(false);
  if ($('.pop', root) && !calm()) {
    root.classList.add('closing');
    setTimeout(() => { root.classList.remove('closing'); if (!ui.pop) renderPop(); }, 180);
  } else renderPop();
  lockBody();
}
function ask(title, text, ok, opts = {}) {
  return new Promise((resolve) => openPop({ type: 'ask', title, text, ok, resolve, ...opts }));
}
function openSettings(tab, side) {
  ui.setTab = tab || 'apparence';
  openSheet({ type: 'settings' });
  if (side) setTimeout(() => { const el = $(`#set-${side}`); if (el) el.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' }); }, 120);
}
function toggleTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  commit(() => { state.prefs.theme = dark ? 'clair' : 'sombre'; state.prefsU = now(); });
}
function shake(sel) { const el = $(sel); if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.focus(); Haptic.tap(); }
/* Bulles : la couleur du livre, éclaircie, et un peu de lumière */
const GOLD = ['#ffd3b5', '#ffc1d3', '#cfc8ff', '#bfeee2', '#ffffff'];
const sparkColors = (cloth) => [cloth || '#ff8b74', cloth || '#ff8b74', '#ffffff', ...GOLD.slice(0, 3)];

/* ---------- Étapes ---------- */
function setStepDone(pid, sid, value, el) {
  const p = P(pid); const st = p && p.steps.find((s) => s.id === sid);
  if (!st) return;
  const nv = value === undefined ? !st.done : value;
  if (nv === st.done) return;
  const before = phase(p); const pt = FX.at(el);
  let outcome = null;
  if (nv) ui.flash = new Set([pid, sid, ...state.today.items.filter((it) => it.stepId === sid).map((it) => it.id)]);
  commit(() => {
    st.done = nv;
    if (nv) st.doneAt = now(); else delete st.doneAt;
    p.u = now();
    outcome = afterStepChange(p);
    if (outcome === 'archive') archiveProject(p);
  }, { pop: false });
  if (nv) { Haptic.tap(); Sound.play('tick'); FX.burst(pt, sparkColors(p.cloth), 12); } else Haptic.tap();
  if (outcome === 'livrables' && before !== 'livrables') {
    setTimeout(() => {
      Haptic.tap(true); Sound.play('fete'); FX.rain(sparkColors(p.cloth));
      openPop({ type: 'celebrate', id: p.id });
    }, 260);
  } else renderPop();
  if (outcome === 'archive') { if (ui.sheet && ui.sheet.type === 'page' && ui.sheet.id === p.id) closeSheet(); celebrateDone(p); }
  checkDayDone();
}
function celebrateDone(p) {
  setTimeout(() => {
    Haptic.tap(true); Sound.play('fete'); FX.rain(sparkColors(p.cloth));
    toast(`« ${p.title} » est terminé`, { action: 'Annuler', onAction: () => Undo.undo() });
  }, 150);
}
function checkDayDone() {
  const es = todayEntries();
  if (es.length > 1 && es.every((e) => e.done) && ui.dayDone !== state.today.date) {
    ui.dayDone = state.today.date;
    setTimeout(() => { toast('Journée bouclée : tout ce qui était prévu est fait'); FX.rain(GOLD); }, 500);
  }
}
function addFree(text) {
  text = String(text || '').trim(); if (!text) return;
  const id = uid();
  ui.flash = new Set([id]);
  commit(() => { state.today.items.push({ id, free: true, text, done: false }); state.today.u = now(); });
  Haptic.tap(); Sound.play('add');
}

/* ---------- Ordre (glisser-déposer) ---------- */
function applyOrder(kind, ids) {
  const sortBy = (arr) => ids.map((id) => arr.find((x) => x.id === id)).filter(Boolean);
  const same = (a, b) => a.map((x) => x.id).join() === b.map((x) => x.id).join();
  if (kind.startsWith('side-')) {
    const side = kind.slice(5); const cur = activeProjects(side); const moved = sortBy(cur);
    if (same(moved, cur) || moved.length !== cur.length) return;
    commit(() => { state.projects = [...moved, ...state.projects.filter((p) => p.side !== side || p.archived)]; state.orderU = now(); });
  } else if (kind === 'today') {
    const moved = sortBy(state.today.items); if (same(moved, state.today.items)) return;
    const rest = state.today.items.filter((x) => !ids.includes(x.id));
    commit(() => { state.today.items = [...moved, ...rest]; state.today.u = now(); });
  } else if (kind === 'steps' || kind === 'livr') {
    const p = P(ui.sheet && ui.sheet.id); if (!p) return;
    const key = kind === 'steps' ? 'steps' : 'deliverables';
    const moved = sortBy(p[key]); if (moved.length !== p[key].length || same(moved, p[key])) return;
    commit(() => { p[key] = moved; p.u = now(); });
  } else if (kind.startsWith('tpl-')) {
    const [, side, key] = kind.split('-'); const arr = state.sides[side][key]; const moved = sortBy(arr);
    if (moved.length !== arr.length || same(moved, arr)) return;
    commit(() => { state.sides[side][key] = moved; state.sidesU = now(); });
  }
  Haptic.tap();
}

/* =====================================================================
   ACTIONS (boutons marqués data-action)
   ===================================================================== */
const actions = {
  /* navigation */
  tab(el) { ui.tab = el.dataset.tab; ui.expanded = null; renderTabbar(); renderMain(); window.scrollTo(0, 0); Haptic.tap(); },
  expand(el) { ui.expanded = ui.expanded === el.dataset.side ? null : el.dataset.side; renderMain(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  'toggle-table'(el) { LOCAL.collapsed = { ...(LOCAL.collapsed || {}), [el.dataset.side]: !(LOCAL.collapsed || {})[el.dataset.side] }; saveLocalPrefs(); renderMain(); },
  'close-sheet'() { closeSheet(); },
  'close-pop'() { closePop(); },
  'open-project'(el) { if (ui.pop) { ui.pop = null; renderPop(); } openSheet({ type: 'page', id: el.dataset.id }); },
  'open-celebrate'(el) { openPop({ type: 'celebrate', id: el.dataset.id }); },
  'open-archives'() { openSheet({ type: 'archives' }); },
  'open-settings'(el) { openSettings(el.dataset.tab, el.dataset.side); },
  'open-picker'() { openSheet({ type: 'picker' }); },
  'arch-filter'(el) { ui.archFilter = el.dataset.f; renderSheet(); },
  'set-tab'(el) { ui.setTab = el.dataset.tab; const sc = $('.sheet-scroll'); renderSheet(); if (sc) $('.sheet-scroll').scrollTop = 0; },
  palette() { openPop({ type: 'palette', q: '', sel: 0 }); },
  'pal-run'(el) { const it = ui.pop && ui.pop.items && ui.pop.items[+el.dataset.i]; if (!it) return; ui.pop = null; renderPop(); it.run(); },

  /* création */
  'new-project'(el) { openSheet({ type: 'new', side: el.dataset.side }); },
  'draft-kind'(el) { const d = ui.sheet.draft; d.kind = d.kind === el.dataset.kind ? '' : el.dataset.kind; renderSheet(); Haptic.tap(); },
  'toggle-skip'(el) {
    const m = ui.sheet; const id = el.dataset.id;
    m.skip = m.skip.includes(id) ? m.skip.filter((x) => x !== id) : [...m.skip, id];
    renderSheet(); Haptic.tap();
  },
  'add-extra'() {
    const inp = $('#extra-input'); const v = inp.value.trim();
    if (!v) { inp.focus(); return; }
    ui.sheet.extra.push(v); renderSheet(); setTimeout(() => { const i = $('#extra-input'); if (i) i.focus(); }, 0);
  },
  'remove-extra'(el) { ui.sheet.extra.splice(+el.dataset.i, 1); renderSheet(); },
  'create-project'() {
    const m = ui.sheet; if (!m || m.type !== 'new') return;
    const t = $('.new-title'); if (t) m.draft.title = t.value;
    if (!m.draft.title.trim()) { shake('.new-title'); return; }
    const p = buildProject(state, m.side, m.draft.title, { skip: m.skip, extra: m.extra, kind: m.draft.kind, client: m.draft.client, contact: m.draft.contact, cloth: m.draft.cloth });
    ui.flash = new Set([p.id]);
    ui.sheet = null;
    commit(() => { state.projects.unshift(p); state.orderU = now(); });
    if (innerWidth < 700) { ui.tab = p.side; renderTabbar(); renderMain(); }
    Haptic.tap(); Sound.play('add');
    requestAnimationFrame(() => {
      const card = $(`.spine[data-id="${p.id}"]`);
      if (card) { card.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' }); FX.burst(FX.at(card), sparkColors(p.cloth), 16); }
    });
    toast(`« ${p.title} » est posé sur la pile`);
  },

  /* étapes */
  'step-toggle'(el) { setStepDone(el.dataset.p, el.dataset.s, undefined, el); },
  'cell-toggle'(el) { setStepDone(el.dataset.p, el.dataset.s, undefined, el); },
  'quick-done'(el) { setStepDone(el.dataset.p, el.dataset.s, true, el); },
  'step-remove'(el) {
    const p = P(el.dataset.p); const st = p && p.steps.find((s) => s.id === el.dataset.s); if (!st) return;
    commit(() => {
      p.steps = p.steps.filter((s) => s.id !== st.id); p.u = now();
      const n = state.today.items.length;
      state.today.items = state.today.items.filter((it) => it.stepId !== st.id);
      if (n !== state.today.items.length) state.today.u = now();
      afterStepChange(p);
    });
    toast(`Étape « ${st.name} » retirée`, { action: 'Annuler', onAction: () => Undo.undo() });
  },
  'add-step'(el) {
    const inp = $('#step-input'); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    const p = P(el.dataset.id || (ui.sheet && ui.sheet.id)); if (!p) return;
    const id = uid(); ui.flash = new Set([id]);
    commit(() => { p.steps.push({ id, name: v, done: false, custom: true }); p.u = now(); afterStepChange(p); });
    setTimeout(() => { const i = $('#step-input'); if (i) i.focus(); }, 0);
  },
  'set-kind'(el) { const p = P(el.dataset.id); commit(() => { p.kind = p.kind === el.dataset.kind ? '' : el.dataset.kind; p.u = now(); }); Haptic.tap(); },

  /* livrables */
  'livr-toggle'(el) {
    const p = P(el.dataset.p); const d = p && p.deliverables.find((x) => x.id === el.dataset.d); if (!d) return;
    const nv = !d.done; const pt = FX.at(el); let archived = false;
    if (nv) ui.flash = new Set([d.id]);
    commit(() => {
      d.done = nv; p.u = now();
      if (p.steps.length && p.steps.every((s) => s.done) && p.deliverables.every((x) => x.done)) { archiveProject(p); archived = true; }
    }, { pop: false });
    if (nv) { Haptic.tap(); Sound.play('tick'); FX.burst(pt, sparkColors(p.cloth), 10); } else Haptic.tap();
    if (archived) {
      ui.pop = null; renderPop();
      if (ui.sheet && ui.sheet.type === 'page' && ui.sheet.id === p.id) closeSheet();
      celebrateDone(p);
    } else renderPop();
  },
  'livr-remove'(el) { const p = P(el.dataset.p); commit(() => { p.deliverables = p.deliverables.filter((x) => x.id !== el.dataset.d); p.u = now(); }); },
  'add-livr'(el) {
    const inp = $('#livr-input'); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    const p = P(el.dataset.id || (ui.sheet && ui.sheet.id)); if (!p) return;
    commit(() => { p.deliverables.push({ id: uid(), name: v, done: false }); p.u = now(); });
    setTimeout(() => { const i = $('#livr-input'); if (i) i.focus(); }, 0);
  },

  /* projets */
  'archive-now'(el) {
    const p = P(el.dataset.id); if (!p) return;
    ui.sheet = null;
    commit(() => archiveProject(p));
    toast(`« ${p.title} » est passé dans les terminés`, { action: 'Annuler', onAction: () => Undo.undo() });
  },
  unarchive(el) {
    const p = P(el.dataset.id); if (!p) return;
    commit(() => { p.archived = false; p.archivedAt = null; p.u = now(); state.orderU = now(); });
    toast(`« ${p.title} » est de retour sur sa pile`);
  },
  duplicate(el) {
    const p = P(el.dataset.id); if (!p) return;
    const c = clone(p);
    c.id = uid(); c.title = p.title + ' (copie)'; c.created = now(); c.u = now();
    c.archived = false; c.archivedAt = null; c.start = todayStr(); c.end = ''; c.endAuto = false;
    c.steps = c.steps.map((s) => ({ ...s, id: uid(), done: false, doneAt: undefined }));
    c.deliverables = c.deliverables.map((d) => ({ ...d, id: uid(), done: false }));
    if (c.cover && c.cover.t === 'img') c.cover = { ...c.cover };
    commit(() => { const i = state.projects.findIndex((x) => x.id === p.id); state.projects.splice(i + 1, 0, normProject(c, state.sides[c.side])); state.orderU = now(); });
    openSheet({ type: 'page', id: c.id });
    toast('Copie créée');
  },
  async 'delete-project'(el) {
    const p = P(el.dataset.id); if (!p) return;
    const ok = await ask(`Supprimer « ${p.title} » ?`, 'Pour le garder sans le voir, utilise plutôt « Ranger ». Tu pourras quand même annuler juste après.', 'Supprimer', { danger: true });
    if (!ok) return;
    ui.sheet = null;
    commit(() => {
      state.projects = state.projects.filter((x) => x.id !== p.id);
      state.deleted[p.id] = now();
      const n = state.today.items.length;
      state.today.items = state.today.items.filter((it) => it.projectId !== p.id);
      if (n !== state.today.items.length) state.today.u = now();
    });
    toast(`« ${p.title} » supprimé`, { action: 'Annuler', onAction: () => Undo.undo() });
  },

  /* aujourd'hui */
  'today-toggle'(el) {
    const it = state.today.items.find((x) => x.id === el.dataset.id); if (!it) return;
    if (!it.free) { setStepDone(it.projectId, it.stepId, undefined, el); return; }
    const nv = !it.done; const pt = FX.at(el);
    if (nv) ui.flash = new Set([it.id]);
    commit(() => { it.done = nv; state.today.u = now(); });
    if (nv) { Haptic.tap(); Sound.play('tick'); FX.burst(pt, GOLD, 10); } else Haptic.tap();
    checkDayDone();
  },
  'toggle-today'(el) {
    const { p, s } = el.dataset; const on = inToday(p, s); const pt = FX.at(el);
    commit(() => {
      if (on) state.today.items = state.today.items.filter((it) => !(it.projectId === p && it.stepId === s));
      else state.today.items.push({ id: uid(), projectId: p, stepId: s });
      state.today.u = now();
    });
    Haptic.tap();
    if (!on) { Sound.play('add'); FX.burst(pt, GOLD, 9, 0.7); }
  },
  'today-add'(el) {
    const { p, s } = el.dataset; if (inToday(p, s)) return;
    const pt = FX.at(el); const id = uid();
    ui.flash = new Set([id]);
    commit(() => { state.today.items.push({ id, projectId: p, stepId: s }); state.today.u = now(); });
    Haptic.tap(); Sound.play('add'); FX.burst(pt, GOLD, 9, 0.7);
  },
  'today-remove'(el) { commit(() => { state.today.items = state.today.items.filter((it) => it.id !== el.dataset.id); state.today.u = now(); }); },
  'today-remove-step'(el) { commit(() => { state.today.items = state.today.items.filter((it) => !(it.projectId === el.dataset.p && it.stepId === el.dataset.s)); state.today.u = now(); }); Haptic.tap(); },
  'add-free'() { const inp = $('#free-input'); const v = inp.value.trim(); if (!v) return; addFree(v); setTimeout(() => { const i = $('#free-input'); if (i) i.focus(); }, 0); },

  /* toile & photo */
  'set-cloth'(el) { const p = P(el.dataset.id); if (!p) return; commit(() => { p.cloth = el.dataset.hex; p.u = now(); }); Haptic.tap(); },
  'draft-cloth'(el) { if (!ui.sheet || !ui.sheet.draft) return; ui.sheet.draft.cloth = el.dataset.hex; renderSheet(); Haptic.tap(); },
  'remove-photo'(el) { const p = P(el.dataset.id); if (!p) return; commit(() => { p.cover = null; p.u = now(); }); },
  'close-self'(el, e) { if (e.target === el) closeSheet(); },

  /* réglages */
  'set-pref'(el) { commit(() => { state.prefs[el.dataset.k] = el.dataset.v; state.prefsU = now(); }); Haptic.tap(); },
  'set-color'(el) { commit(() => { state.sides[el.dataset.side].color = el.dataset.hex; state.sidesU = now(); }); Haptic.tap(); },
  'tpl-remove'(el) { const { side, key, id } = el.dataset; commit(() => { state.sides[side][key] = state.sides[side][key].filter((t) => t.id !== id); state.sidesU = now(); }); },
  'tpl-add'(el) {
    const { side, key } = el.dataset; const inp = $(`#tpl-${side}-${key}`); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    commit(() => { state.sides[side][key].push({ id: uid(), name: v }); state.sidesU = now(); });
    setTimeout(() => { const i = $(`#tpl-${side}-${key}`); if (i) i.focus(); }, 0);
  },
  'type-add'(el) {
    const side = el.dataset.side; const inp = $(`#type-${side}`); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
    const used = state.sides[side].types.map((t) => t.color);
    const color = (PALETTE.find(([, h]) => !used.includes(h)) || PALETTE[0])[1];
    commit(() => { state.sides[side].types.push({ id: uid(), name: v, color }); state.sidesU = now(); });
    setTimeout(() => { const i = $(`#type-${side}`); if (i) i.focus(); }, 0);
  },
  'type-remove'(el) { const { side, id } = el.dataset; commit(() => { state.sides[side].types = state.sides[side].types.filter((t) => t.id !== id); state.sidesU = now(); }); },
  'cycle-type-color'(el) {
    const t = state.sides[el.dataset.side].types.find((x) => x.id === el.dataset.id); if (!t) return;
    const i = PALETTE.findIndex(([, h]) => h === t.color);
    commit(() => { t.color = PALETTE[(i + 1) % PALETTE.length][1]; state.sidesU = now(); });
    Haptic.tap();
  },

  /* mémoire & synchro */
  async connect() {
    const m = ui.sheet; const inp = $('#connect-input');
    const cfg = Link.parse(inp ? inp.value : '');
    if (!cfg) { m.msg = 'Ça ne ressemble pas à un lien de connexion. Copie bien tout le lien reçu.'; m.err = true; renderSheet(); return; }
    m.msg = 'Connexion…'; m.err = false; renderSheet();
    const err = await Sync.connect(cfg);
    if (err) { m.msg = err; m.err = true; renderSheet(); return; }
    Haptic.tap(true);
    if (m.type === 'welcome') closeSheet(); else { m.msg = 'Connecté. Tout est maintenant enregistré en ligne.'; m.err = false; renderSheet(); }
    toast('Connecté : tout est enregistré en ligne');
  },
  async 'welcome-connect'() {
    const m = ui.sheet; m.msg = 'Connexion…'; m.err = false; renderSheet();
    const err = await Sync.connect(m.cfg);
    if (err) { m.msg = err; m.err = true; renderSheet(); return; }
    Haptic.tap(true); closeSheet();
    toast('Cet appareil est connecté');
  },
  'start-blank'() { state = freshState(); saveLocal(); Backup.schedule(); closeSheet(); renderAll(); },
  'start-demo'() { state = seedState(); saveLocal(); Backup.schedule(); closeSheet(); renderAll(); toast('Voici quelques exemples. Pour les effacer : Réglages, Mémoire et synchro, Repartir de zéro.'); },
  async 'copy-link'() {
    try { await navigator.clipboard.writeText(Link.make()); toast('Lien copié : ouvre-le sur l’autre appareil'); Haptic.tap(); } catch (e) { toast('Copie impossible ici : utilise « Envoyer… »'); }
  },
  async 'share-link'() { try { await navigator.share({ title: 'Atelier', text: 'Ouvre ce lien pour connecter cet appareil à l’atelier', url: Link.make() }); } catch (e) { /* annulé */ } },
  async disconnect() {
    if (!(await ask('Déconnecter cet appareil ?', 'Les données restent ici et en ligne. Il faudra rouvrir le lien de connexion pour le reconnecter.', 'Déconnecter'))) return;
    Sync.disconnect(); renderSheet();
  },
  async 'sync-now'() { await Sync.refresh(true); await Sync.flush(); renderSyncState(); },
  async 'load-history'(el) {
    const m = ui.sheet; const page = +(el.dataset.page || 1); const prev = page > 1 && m.hist && m.hist.items ? m.hist.items : [];
    if (page === 1) { m.hist = 'loading'; renderSheet(); }
    try {
      const list = await Sync.history(page);
      const items = list.map((c) => ({ ref: c.sha, label: c.date ? new Date(c.date).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : c.sha.slice(0, 7), sub: (c.msg.split('·')[1] || '').trim() }));
      m.hist = { src: 'remote', items: [...prev, ...items], page, more: list.length === 25 };
    } catch (e) { m.hist = { error: e.message || 'Impossible de charger l’historique' }; }
    renderSheet();
  },
  async 'load-local-history'() {
    const m = ui.sheet; m.hist = 'loading'; renderSheet();
    const days = await Backup.list();
    m.hist = { src: 'local', page: 1, more: false, items: days.map((d) => ({ ref: d, label: new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), sub: d === todayStr() ? 'Copie d’aujourd’hui' : 'Copie de fin de journée' })) };
    renderSheet();
  },
  async restore(el) {
    const { src, ref } = el.dataset;
    if (!(await ask('Revenir à cette version ?', 'Tout reviendra comme à ce moment-là. Tu pourras annuler juste après.', 'Revenir'))) return;
    try {
      const data = src === 'remote' ? await Sync.version(ref) : await Backup.get(ref);
      if (!data) throw new Error('Version introuvable');
      Undo.push(); applySnapshot(data);
      toast('Version restaurée', { action: 'Annuler', onAction: () => Undo.undo() });
    } catch (e) { toast(e.message || 'Impossible de restaurer cette version'); }
  },
  export() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `atelier-sauvegarde-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  async reset() {
    if (!(await ask('Repartir de zéro ?', 'Tous les projets (en cours et terminés) seront effacés. Les listes d’étapes et les couleurs sont gardées. Tu pourras annuler juste après.', 'Tout effacer', { danger: true }))) return;
    commit(() => { const t = now(); state.projects.forEach((p) => { state.deleted[p.id] = t; }); state.projects = []; state.today.items = []; state.today.u = t; state.orderU = t; });
    toast('Tout est effacé', { action: 'Annuler', onAction: () => Undo.undo() });
  },
  'ask-yes'() { const m = ui.pop; if (m && m.resolve) { const r = m.resolve; m.resolve = null; closePop(); r(true); } },
  'ask-no'() { closePop(); },
};

/* =====================================================================
   ÉVÉNEMENTS
   ===================================================================== */
document.addEventListener('click', (e) => {
  if (Drag.suppressClick && !e.target.closest('head')) { e.preventDefault(); e.stopPropagation(); return; }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  if (el.dataset.action === 'close-self' && e.target !== el) return;
  e.preventDefault();
  fn(el, e);
}, true);

/* Modifications en direct dans les champs (noms, notes…) */
const EDIT_ATTRS = ['pfield', 'stepName', 'livrName', 'spaceName', 'tpl', 'type', 'free', 'setting'];
function applyEdit(t) {
  const d = t.dataset; const v = t.isContentEditable ? t.textContent : t.value;
  if (d.pfield) {
    const p = P(ui.sheet && ui.sheet.id); if (!p) return;
    const f = d.pfield; const val = f === 'title' ? v.replace(/\s*\n\s*/g, ' ').trim() : v;
    if (f === 'title' && !val) return;
    if (p[f] === val) return;
    commit(() => { p[f] = val; if (f === 'end') p.endAuto = false; p.u = now(); }, { sheet: false, pop: false });
  } else if (d.stepName || d.livrName) {
    const p = P(ui.sheet && ui.sheet.id); if (!p) return;
    const list = d.stepName ? p.steps : p.deliverables; const x = list.find((s) => s.id === (d.stepName || d.livrName));
    const val = v.trim(); if (!x || !val || x.name === val) return;
    commit(() => { x.name = val; p.u = now(); }, { sheet: false, pop: false });
  } else if (d.spaceName) {
    const val = v.trim(); const sd = state.sides[d.spaceName];
    if (!val || sd.name === val) return;
    commit(() => { sd.name = val; state.sidesU = now(); }, { sheet: !t.closest('.sheet'), pop: false });
  } else if (d.tpl) {
    const [side, key, id] = d.tpl.split('|'); const x = state.sides[side][key].find((i) => i.id === id);
    const val = v.trim(); if (!x || !val || x.name === val) return;
    commit(() => { x.name = val; state.sidesU = now(); }, { sheet: false, pop: false });
  } else if (d.type) {
    const [side, id] = d.type.split('|'); const x = state.sides[side].types.find((i) => i.id === id);
    const val = v.trim(); if (!x || !val || x.name === val) return;
    const old = x.name;
    commit(() => {
      x.name = val; state.sidesU = now();
      state.projects.forEach((p) => { if (p.side === side && p.kind === old) { p.kind = val; p.u = now(); } });
    }, { sheet: false, pop: false });
  } else if (d.free) {
    const it = state.today.items.find((x) => x.id === d.free); if (!it) return;
    const val = v.trim();
    if (!val) { commit(() => { state.today.items = state.today.items.filter((x) => x.id !== it.id); state.today.u = now(); }); return; }
    if (it.text === val) return;
    commit(() => { it.text = val; state.today.u = now(); }, { sheet: false, pop: false });
  } else if (d.setting === 'user') {
    const val = v.trim(); if (state.user === val) return;
    commit(() => { state.user = val; state.userU = now(); }, { sheet: false, pop: false });
  }
}
const editTimers = new WeakMap();
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.draft && ui.sheet && ui.sheet.type === 'new') {
    ui.sheet.draft[t.dataset.draft] = t.value;
    if (t.dataset.draft === 'title') { const pv = $('#np-title'); if (pv) pv.textContent = t.value || 'Titre du livre'; }
    return;
  }
  if (t.id === 'pal-input' && ui.pop && ui.pop.type === 'palette') { ui.pop.q = t.value; ui.pop.sel = 0; $('.pal-list').innerHTML = paletteListHTML(ui.pop); return; }
  if (t.tagName === 'TEXTAREA') autoGrow(t);
  // enregistre en direct les champs des fenêtres (sans attendre la sortie du champ)
  if (t.closest('.sheet') && EDIT_ATTRS.some((k) => t.dataset[k] !== undefined)) {
    clearTimeout(editTimers.get(t));
    editTimers.set(t, setTimeout(() => { if (t.isConnected) applyEdit(t); }, 700));
  }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (EDIT_ATTRS.some((k) => t.dataset[k] !== undefined)) { clearTimeout(editTimers.get(t)); applyEdit(t); return; }
  if (t.dataset.pref !== undefined) { commit(() => { state.prefs[t.dataset.pref] = t.checked; state.prefsU = now(); }, { sheet: false }); Haptic.tap(); return; }
  if (t.dataset.local !== undefined) { LOCAL[t.dataset.local] = t.checked; saveLocalPrefs(); applyPrefs(); if (t.checked && t.dataset.local === 'haptics') Haptic.tap(); if (t.checked && t.dataset.local === 'sounds') Sound.play('tick'); return; }
  if (t.id === 'cover-file' && t.files[0]) {
    const m = ui.sheet; const p = P(m && m.id); if (!p) return;
    m.busy = true; renderSheet();
    Covers.fromFile(t.files[0]).then((key) => {
      m.busy = false;
      commit(() => { p.cover = { t: 'img', key }; p.u = now(); });
      Haptic.tap(); Sync.pushCovers();
    }).catch(() => { m.busy = false; renderSheet(); toast('Cette image n’a pas pu être lue. Essaie une photo JPG ou PNG.'); });
    return;
  }
  if (t.id === 'import-file' && t.files[0]) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = normalize(JSON.parse(reader.result));
        if (!(await ask('Importer cette sauvegarde ?', `Elle contient ${plural(data.projects.length, 'projet', 'projets')} et remplacera ce qu’il y a ici. Tu pourras annuler juste après.`, 'Importer'))) return;
        Undo.push(); applySnapshot(data);
        toast('Sauvegarde importée', { action: 'Annuler', onAction: () => Undo.undo() });
      } catch (err) { toast('Ce fichier ne ressemble pas à une sauvegarde de l’atelier'); }
    };
    reader.readAsText(t.files[0]);
    t.value = '';
  }
});

document.addEventListener('focusout', (e) => {
  const t = e.target;
  if (t.isContentEditable && EDIT_ATTRS.some((k) => t.dataset[k] !== undefined)) {
    if (!t.textContent.trim() && t.dataset.spaceName) t.textContent = state.sides[t.dataset.spaceName].name;
    applyEdit(t);
  }
});

document.addEventListener('keydown', (e) => {
  const t = e.target; const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); if (ui.pop && ui.pop.type === 'palette') closePop(); else actions.palette(); return; }
  if (e.key === 'Escape') { if (ui.pop) closePop(); else if (ui.sheet) closeSheet(); return; }
  const typing = t.matches && t.matches('input, textarea, [contenteditable]');
  if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) Undo.redo(); else Undo.undo(); return; }
  if (t.id === 'pal-input' && ui.pop) {
    const m = ui.pop;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); m.sel = (m.sel + (e.key === 'ArrowDown' ? 1 : -1) + m.items.length) % Math.max(1, m.items.length);
      $$('.pal-item').forEach((b, i) => b.classList.toggle('sel', i === m.sel));
      const s = $('.pal-item.sel'); if (s) s.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { e.preventDefault(); const it = m.items[m.sel]; if (it) { ui.pop = null; renderPop(); it.run(); } }
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey && t.dataset && t.dataset.enter) { e.preventDefault(); actions[t.dataset.enter](t); return; }
  if (e.key === 'Enter' && !e.shiftKey && t.matches && t.matches('.pg-title, .row-name, .pile-name, .td-free, .prop-in, .in')) { e.preventDefault(); t.blur(); }
});
