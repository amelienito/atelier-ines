'use strict';
/* =====================================================================
   ATELIER · sensations
   Vibrations, petits sons, confettis, glisser-déposer (souris + doigt),
   glisser vers le bas pour fermer une fenêtre sur téléphone.
   ===================================================================== */

/* Réglages propres à cet appareil (non synchronisés) */
const LOCAL = (() => {
  const d = { haptics: true, sounds: false, calm: false, collapsed: {} };
  try { return { ...d, ...JSON.parse(localStorage.getItem(LS_LOCAL) || '{}') }; } catch (e) { return d; }
})();
function saveLocalPrefs() { try { localStorage.setItem(LS_LOCAL, JSON.stringify(LOCAL)); } catch (e) { /* rien */ } }
const calm = () => LOCAL.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = () => matchMedia('(hover: none)').matches;

/* ---------- Vibrations ----------
   Android : navigator.vibrate. iPhone (iOS 18+) : on « clique » un
   interrupteur natif invisible, ce qui déclenche le retour haptique. */
const Haptic = {
  tap(strong) {
    if (!LOCAL.haptics) return;
    try {
      if (navigator.vibrate) { navigator.vibrate(strong ? [10, 50, 16] : 8); return; }
      const label = document.createElement('label');
      label.setAttribute('aria-hidden', 'true');
      label.style.display = 'none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      label.appendChild(input);
      document.head.appendChild(label);
      label.click();
      label.remove();
    } catch (e) { /* rien */ }
  },
};

/* ---------- Sons (synthétisés, aucun fichier) ---------- */
const Sound = {
  ctx: null,
  play(kind) {
    if (!LOCAL.sounds) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx; const t0 = c.currentTime;
      const notes = kind === 'fete' ? [523, 659, 784, 1047] : kind === 'add' ? [740] : [880, 1320];
      notes.forEach((f, i) => {
        const o = c.createOscillator(); const g = c.createGain();
        const t = t0 + i * (kind === 'fete' ? 0.09 : 0.06);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(kind === 'fete' ? 0.1 : 0.07, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g).connect(c.destination);
        o.start(t); o.stop(t + 0.3);
      });
    } catch (e) { /* rien */ }
  },
};

/* ---------- Confettis ---------- */
const FX = {
  at(el) {
    if (!el || !el.isConnected) return null;
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  },
  burst(pt, colors, n = 12, power = 1) {
    if (!pt || calm()) return;
    const layer = $('#fx');
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      el.className = 'bit' + (i % 3 === 0 ? ' round' : '');
      el.style.left = pt[0] + 'px'; el.style.top = pt[1] + 'px';
      el.style.background = colors[i % colors.length];
      layer.appendChild(el);
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const d = (30 + Math.random() * 40) * power;
      const dx = Math.cos(a) * d; const dy = Math.sin(a) * d;
      el.animate([
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(1) rotate(${Math.random() * 180}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx * 1.15}px,${dy + 26 * power}px) scale(.6) rotate(${Math.random() * 360}deg)`, opacity: 0 },
      ], { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(.2,.75,.35,1)' }).onfinish = () => el.remove();
    }
  },
  rain(colors) {
    if (calm()) return;
    const layer = $('#fx'); const w = innerWidth; const h = innerHeight;
    for (let i = 0; i < 80; i++) {
      const el = document.createElement('i');
      el.className = 'bit' + (i % 4 === 0 ? ' round' : '');
      el.style.left = Math.random() * w + 'px'; el.style.top = '-16px';
      el.style.background = colors[i % colors.length];
      layer.appendChild(el);
      const sway = (Math.random() - 0.5) * 160;
      el.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${sway}px,${h * 0.75}px) rotate(${360 + Math.random() * 540}deg)`, opacity: 0.9, offset: 0.85 },
        { transform: `translate(${sway * 1.2}px,${h * 0.9}px) rotate(${720}deg)`, opacity: 0 },
      ], { duration: 1600 + Math.random() * 1200, delay: Math.random() * 450, easing: 'cubic-bezier(.25,.6,.45,1)', fill: 'backwards' }).onfinish = () => el.remove();
    }
  },
};

/* Anime les éléments d'une liste entre leur ancienne et leur nouvelle place */
function flip(container, mutate) {
  const kids = [...container.children];
  const before = new Map(kids.map((k) => [k, k.getBoundingClientRect()]));
  mutate();
  if (calm()) return;
  for (const k of kids) {
    const a = before.get(k); const b = k.getBoundingClientRect();
    const dx = a.left - b.left; const dy = a.top - b.top;
    if (dx || dy) k.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.3,1)' });
  }
}

function scrollParent(el) {
  for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) return n;
  }
  return null;
}
function autoscroll(scroller, y) {
  const top = scroller ? scroller.getBoundingClientRect().top : 0;
  const bottom = scroller ? scroller.getBoundingClientRect().bottom : innerHeight;
  const step = y < top + 70 ? -12 : y > bottom - 70 ? 12 : 0;
  if (!step) return;
  if (scroller) scroller.scrollTop += step; else window.scrollBy(0, step);
}

/* ---------- Glisser-déposer ----------
   Souris : on attrape et on bouge. Doigt : appui long (≈0,3 s), puis on bouge.
   Toute liste marquée data-sortable dont les éléments ont un data-id. */
const Drag = {
  s: null, pending: null, timer: null, suppressClick: false,
  itemFrom(target) {
    if (target.closest('input, textarea, select, [contenteditable]')) return null;
    return target.closest('[data-sortable] > [data-id]');
  },
  begin(item, x, y) {
    const list = item.parentElement;
    this.s = { item, list, scroller: scrollParent(list) };
    item.classList.add('lifted');
    document.body.classList.add('dragging');
    Haptic.tap();
  },
  move(x, y) {
    const { item, list } = this.s;
    const sibs = [...list.children].filter((c) => c !== item && c.dataset.id);
    let target = null;
    for (const sib of sibs) {
      const r = sib.getBoundingClientRect();
      if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) { target = sib; break; }
    }
    if (target) { if (item.nextElementSibling !== target) flip(list, () => list.insertBefore(item, target)); }
    else { const last = sibs[sibs.length - 1]; if (last && last.nextElementSibling !== item) flip(list, () => last.after(item)); }
    autoscroll(this.s.scroller, y);
  },
  finish() {
    const { item, list } = this.s;
    item.classList.remove('lifted');
    document.body.classList.remove('dragging');
    this.s = null;
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; }, 80);
    applyOrder(list.dataset.sortable, [...list.children].map((c) => c.dataset.id).filter(Boolean));
  },
  cancelPending() { clearTimeout(this.timer); this.pending = null; },
};

document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch' || e.button !== 0) return;
  const item = Drag.itemFrom(e.target);
  if (item) Drag.pending = { item, x: e.clientX, y: e.clientY, id: e.pointerId };
});
document.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  if (Drag.s) { e.preventDefault(); Drag.move(e.clientX, e.clientY); return; }
  const pd = Drag.pending;
  if (pd && e.pointerId === pd.id && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 6) {
    Drag.pending = null;
    window.getSelection()?.removeAllRanges();
    Drag.begin(pd.item, e.clientX, e.clientY);
  }
});
document.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'touch') return;
  Drag.pending = null;
  if (Drag.s) Drag.finish();
});

document.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) { Drag.cancelPending(); return; }
  const item = Drag.itemFrom(e.target);
  if (!item) return;
  const t = e.touches[0];
  Drag.pending = { item, x: t.clientX, y: t.clientY };
  clearTimeout(Drag.timer);
  Drag.timer = setTimeout(() => {
    const pd = Drag.pending;
    if (pd && pd.item === item) { Drag.pending = null; Drag.begin(item, pd.x, pd.y); }
  }, 300);
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  if (Drag.s) { e.preventDefault(); Drag.move(t.clientX, t.clientY); return; }
  if (Drag.pending && Math.hypot(t.clientX - Drag.pending.x, t.clientY - Drag.pending.y) > 8) Drag.cancelPending();
}, { passive: false });
const touchEnd = () => { Drag.cancelPending(); if (Drag.s) Drag.finish(); };
document.addEventListener('touchend', touchEnd);
document.addEventListener('touchcancel', touchEnd);
document.addEventListener('contextmenu', (e) => { if (Drag.s || (Drag.pending && isTouch())) e.preventDefault(); });

/* ---------- Glisser vers le bas pour fermer (téléphone) ---------- */
const Swipe = { s: null };
document.addEventListener('touchstart', (e) => {
  if (Drag.s || innerWidth >= 700) return;
  const sheet = e.target.closest('.sheet, .pop');
  if (!sheet || e.target.closest('input, textarea, button, a, [data-sortable] > *')) return;
  const scroller = $('.sheet-scroll', sheet);
  const top = sheet.getBoundingClientRect().top;
  const t = e.touches[0];
  const inHead = t.clientY - top < 70 || e.target.closest('.sheet-head, .pop-head, .page-cover');
  if (!inHead && scroller && scroller.scrollTop > 0) return;
  if (!inHead && !e.target.closest('.sheet-head, .pop-head, .page-cover')) return;
  Swipe.s = { sheet, y0: t.clientY, dy: 0, pop: sheet.classList.contains('pop') };
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (!Swipe.s) return;
  const dy = e.touches[0].clientY - Swipe.s.y0;
  Swipe.s.dy = dy;
  if (dy > 0) { e.preventDefault(); Swipe.s.sheet.style.transition = 'none'; Swipe.s.sheet.style.transform = `translateY(${dy}px)`; }
}, { passive: false });
document.addEventListener('touchend', () => {
  const s = Swipe.s; Swipe.s = null;
  if (!s) return;
  s.sheet.style.transition = '';
  if (s.dy > 110) { Haptic.tap(); s.sheet.style.transform = `translateY(${s.dy}px)`; if (s.pop) closePop(); else closeSheet(); }
  else s.sheet.style.transform = '';
});
