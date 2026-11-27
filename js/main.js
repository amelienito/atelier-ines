'use strict';
/* =====================================================================
   ATELIER · démarrage
   ===================================================================== */
(function boot() {
  let had = false;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { state = normalize(JSON.parse(raw)); had = true; }
  } catch (e) { console.warn('Lecture locale impossible', e); }
  if (!state) state = freshState();

  if (rollDay() && had) saveLocal();
  Sync.load();
  renderAll();
  setTimeout(() => document.body.classList.remove('intro'), 1400);

  /* Lien de connexion reçu (…#connecter=…) */
  const linkCfg = location.hash.includes('connecter=') ? Link.parse(location.hash) : null;
  if (location.hash.includes('connecter=')) history.replaceState(null, '', location.pathname + location.search);

  /* Filet de sécurité : si le stockage principal a été vidé, on reprend la copie de secours */
  const rescue = had ? Promise.resolve() : IDB.get('state').then((j) => {
    if (!j || localStorage.getItem(LS_KEY)) return;
    try {
      const s = JSON.parse(j);
      if (s && Array.isArray(s.projects) && s.projects.length) {
        replaceState(s);
        if (ui.sheet && ui.sheet.type === 'welcome' && !ui.sheet.link) closeSheet();
        toast('Tes données ont été retrouvées sur cet appareil ✓');
      }
    } catch (e) { /* rien */ }
  }).catch(() => {});

  if (linkCfg) {
    if (Sync.enabled()) {
      /* déjà relié : rien à faire. L'icône de l'écran d'accueil rouvre toujours ce lien, en silence. */
      if (Sync.cfg.token === linkCfg.token) { if (!Device.app() && !Device.ios) toast('Cet appareil est déjà connecté ✓'); }
      else if (!Device.app()) openSheet({ type: 'welcome', link: true, cfg: linkCfg });
    } else {
      /* appareil vierge : on connecte tout de suite, sans rien demander */
      openSheet({ type: 'welcome', link: true, cfg: linkCfg, busy: true });
      rescue.then(() => {
        if (localIsEmpty()) return linkConnect(linkCfg);
        if (ui.sheet && ui.sheet.link) { ui.sheet.busy = false; renderSheet(); }
      });
    }
  } else if (!had && !Sync.enabled()) {
    openSheet({ type: 'welcome' });
  }
  Link.pin();

  /* Demande au navigateur de ne jamais effacer les données de l'atelier */
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  Sync.start();

  /* Hors ligne : l'atelier et l'outil Pour Inès restent consultables */
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

  /* Retour sur l'appli : nouveau jour ? modifs faites ailleurs ? */
  const wake = () => {
    if (document.visibilityState !== 'visible') return;
    if (rollDay()) { saveLocal(); Sync.schedule(); renderAll(); } else renderTop();
    Sync.refresh();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      blurActive();                       // enregistre le champ en cours d'écriture
      if (Sync.dirty) Sync.flush();       // et envoie tout de suite
    } else wake();
  });
  window.addEventListener('focus', wake);
  window.addEventListener('online', () => { if (Sync.dirty) Sync.flush(); else Sync.refresh(); });
  window.addEventListener('pagehide', () => { blurActive(); saveLocal(); });
  const mqp = matchMedia('(max-width: 759px)');
  if (mqp.addEventListener) mqp.addEventListener('change', applyDense); else if (mqp.addListener) mqp.addListener(applyDense);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', () => renderAll()); else if (mq.addListener) mq.addListener(() => renderAll());
  setInterval(() => {
    if (rollDay()) { saveLocal(); Sync.schedule(); renderAll(); }
    else if (!document.activeElement || document.activeElement === document.body) renderTop();
  }, 60 * 1000);

  /* Deux appareils ouverts en même temps : on regarde toutes les 30 s
     si l'autre a changé quelque chose (seulement si l'écran est visible
     et que personne n'est en train d'écrire). */
  setInterval(() => {
    if (document.visibilityState !== 'visible' || !Sync.enabled() || Sync.dirty || isTyping()) return;
    Sync.refresh();
  }, 30 * 1000);

  /* Nouvelle version du site : elle s'installe toute seule, au moment où
     rien n'est ouvert (au retour sur l'appli, ou après une minute calme). */
  const APP_V = ((document.querySelector('script[src*="main.js"]') || {}).src || '').split('v=')[1] || '';
  let newV = null; let lastTouch = Date.now();
  ['pointerdown', 'keydown'].forEach((t) => addEventListener(t, () => { lastTouch = Date.now(); }, true));
  const quiet = () => !ui.sheet && !ui.pop && !isTyping() && !document.body.classList.contains('dragging') && !(window.Music && Music.st.playing);
  const install = () => {
    if (!newV || !quiet() || sessionStorage.getItem('atelier.upd') === newV) return;
    sessionStorage.setItem('atelier.upd', newV);       // jamais deux fois de suite
    blurActive(); saveLocal();
    location.replace(location.pathname + '?v=' + encodeURIComponent(newV));
  };
  const checkUpdate = async () => {
    if (!APP_V || !navigator.onLine) return;
    try {
      const t = await fetch('index.html?u=' + Date.now(), { cache: 'no-store' }).then((r) => (r.ok ? r.text() : ''));
      const m = t.match(/main\.js\?v=([\w.-]+)/);
      if (m && m[1] !== APP_V) newV = m[1];
    } catch (e) { /* hors ligne */ }
  };
  checkUpdate();
  setInterval(async () => {
    await checkUpdate();
    if (newV && Date.now() - lastTouch > 60 * 1000) install();
  }, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    await checkUpdate(); install();
  });
})();
