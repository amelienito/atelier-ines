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

  /* Lien de connexion reçu (…#connecter=…) */
  const linkCfg = location.hash.includes('connecter=') ? Link.parse(location.hash) : null;
  if (location.hash.includes('connecter=')) history.replaceState(null, '', location.pathname + location.search);
  if (linkCfg) {
    if (Sync.enabled() && Sync.cfg.token === linkCfg.token) toast('Cet appareil est déjà connecté ✓');
    else openSheet({ type: 'welcome', link: true, cfg: linkCfg });
  } else if (!had && !Sync.enabled()) {
    openSheet({ type: 'welcome' });
  }

  /* Filet de sécurité : si le stockage principal a été vidé, on reprend la copie de secours */
  if (!had) {
    IDB.get('state').then((j) => {
      if (!j || localStorage.getItem(LS_KEY)) return;
      try {
        const s = JSON.parse(j);
        if (s && Array.isArray(s.projects) && s.projects.length) {
          replaceState(s);
          if (ui.sheet && ui.sheet.type === 'welcome' && !ui.sheet.link) closeSheet();
          toast('Tes données ont été retrouvées sur cet appareil ✓');
        }
      } catch (e) { /* rien */ }
    });
  }

  /* Demande au navigateur de ne jamais effacer les données de l'atelier */
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  Sync.start();

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
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyPrefs);
  setInterval(() => {
    if (rollDay()) { saveLocal(); Sync.schedule(); renderAll(); }
    else if (!document.activeElement || document.activeElement === document.body) renderTop();
  }, 60 * 1000);
})();
