'use strict';
/* =====================================================================
   ATELIER · musique
   Le lecteur de Music Discovery (la sélection d'Amélien), en petit.
   Sur l'ordi et l'iPad, il démarre tout seul, tout doucement (volume
   bas qui monte lentement), puis se range en disque dans un coin.
   Toujours à portée de main : un toucher pour le voir, pause, suivant,
   et le × demande s'il faut le faire disparaître (aujourd'hui ou pour
   de bon). Rien n'est écrit dans les données d'Inès.
   ===================================================================== */

const MOODS = [['calme', 'Calme'], ['pose', 'Posé'], ['tout', 'Un peu de tout']];
const VOLS = [['18', 'Très doux'], ['30', 'Doux'], ['50', 'Normal']];
const ytId = (lien) => {
  const s = String(lien || '');
  const m = s.match(/[?&]v=([\w-]{11})/) || s.match(/youtu\.be\/([\w-]{11})/) || s.match(/embed\/([\w-]{11})/);
  return m ? m[1] : '';
};

const Music = {
  st: { mode: 'off', playing: false, cur: null, err: '', mood: LOCAL.muMood || 'calme', busy: false, ask: false },
  list: null, yt: null, ready: false, fails: 0, hist: [], back: [], mounted: false, hover: false, fade: null, wantFade: false,
  site: 'https://amelienito.github.io/music-discovery/',
  src() { return location.hostname.endsWith('github.io') ? '../music-discovery/data.js' : this.site + 'data.js'; },
  enabled() { return LOCAL.music !== false && LOCAL.muHideDay !== todayStr(); },
  autoOK() { return LOCAL.muAuto !== false && LOCAL.muPaused !== todayStr() && !isPhone(); },
  vol() { return +LOCAL.muVol || 30; },

  /* ---------- Les morceaux ---------- */
  async load() {
    if (this.list) return this.list;
    const r = await fetch(this.src(), { cache: 'no-cache' });
    if (!r.ok) throw new Error('liste');
    const txt = await r.text();
    // le fichier de Music Discovery déclare « const MORCEAUX = [...] » : on le lit à part
    const arr = new Function(txt + '\n;return (typeof MORCEAUX !== "undefined") ? MORCEAUX : [];')();
    this.list = arr.map((m) => Object.assign({}, m, { yt: ytId(m.lien) })).filter((m) => m.yt);
    return this.list;
  },
  pool() {
    const e = (m) => (typeof m.energie === 'number' ? m.energie : 5);
    const mood = this.st.mood; const all = this.list || [];
    const p = mood === 'calme' ? all.filter((m) => e(m) <= 4) : mood === 'pose' ? all.filter((m) => e(m) >= 3 && e(m) <= 6) : all;
    return p.length ? p : all;
  },
  pick() {
    const pool = this.pool();
    const recent = new Set(this.hist.slice(-40).map((m) => m.yt));
    let cand = pool.filter((m) => !recent.has(m.yt));
    if (!cand.length) cand = pool;
    const w = cand.map((m) => (m.coeur ? 2 : 1));      // les coups de cœur reviennent un peu plus souvent
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < cand.length; i++) { r -= w[i]; if (r <= 0) return cand[i]; }
    return cand[0];
  },

  /* ---------- Le lecteur YouTube ---------- */
  api() {
    return new Promise((res, rej) => {
      if (window.YT && window.YT.Player) { res(); return; }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) try { prev(); } catch (e) { /* rien */ } res(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.onerror = () => rej(new Error('yt'));
        document.head.appendChild(s);
      }
      setTimeout(() => rej(new Error('yt')), 15000);
    });
  },
  async player() {
    if (this.yt && this.ready) return this.yt;
    await this.api();
    await new Promise((res) => {
      this.yt = new YT.Player('mu-yt', {
        width: '100%', height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, controls: 0, disablekb: 1, origin: location.origin.indexOf('http') === 0 ? location.origin : undefined },
        events: {
          onReady: () => { this.ready = true; res(); },
          onStateChange: (e) => this.onState(e),
          onError: () => this.onError(),
        },
      });
    });
    return this.yt;
  },
  target() { return Math.round(this.vol() * Math.min(1, +((this.st.cur || {}).volume) || 1)); },
  /* Le son arrive doucement : de 0 au volume choisi en quelques secondes */
  fadeIn() {
    clearInterval(this.fade);
    const to = this.target(); let v = 0; const step = Math.max(1, to / 24);
    try { this.yt.setVolume(0); } catch (e) { /* rien */ }
    this.fade = setInterval(() => {
      v = Math.min(to, v + step);
      try { this.yt.setVolume(Math.round(v)); } catch (e) { /* rien */ }
      if (v >= to) clearInterval(this.fade);
    }, 250);
  },
  onState(e) {
    const S = window.YT ? YT.PlayerState : {};
    if (e.data === S.PLAYING) {
      this.st.playing = true; this.fails = 0; this.st.err = '';
      if (this.wantFade) { this.wantFade = false; this.fadeIn(); } else { try { this.yt.setVolume(this.target()); } catch (err) { /* rien */ } }
    } else if (e.data === S.PAUSED) this.st.playing = false;
    else if (e.data === S.ENDED) { this.st.playing = false; this.next(); return; }
    this.paint();
  },
  onError() {
    this.fails++;
    if (this.fails >= 3) { this.st.err = 'YouTube refuse de lire ces morceaux ici pour l’instant.'; this.st.playing = false; this.paint(); return; }
    this.next();
  },
  async play(m, soft) {
    if (!m) return;
    this.st.cur = m; this.st.err = ''; this.paint();
    try {
      const yt = await this.player();
      this.wantFade = !!soft;
      if (soft) try { yt.setVolume(0); } catch (e) { /* rien */ }
      yt.loadVideoById({ videoId: m.yt, startSeconds: +m.debut || 0 });
    } catch (e) {
      this.st.err = 'YouTube ne répond pas pour l’instant.';
      this.paint();
    }
  },

  /* ---------- Démarrage avec l'atelier ---------- */
  async boot() {
    if (!this.enabled()) { this.paintLauncher(); return; }
    this.mount();
    this.setMode(isPhone() ? 'disc' : 'mini');
    this.st.busy = true; this.paint();
    try { await this.load(); } catch (e) { this.st.busy = false; this.setMode('off'); return; }
    this.st.busy = false;
    const m = this.pick(); this.hist.push(m); this.st.cur = m; this.paint();
    if (this.autoOK()) {
      this.play(m, true);
      // si le navigateur attend un premier geste, la musique part au premier clic dans l'atelier
      const kick = (ev) => {
        if (ev.target && ev.target.closest && ev.target.closest('#music')) return;
        off();
        if (!this.st.playing && this.autoOK() && this.st.mode !== 'off') { this.wantFade = true; try { this.yt.playVideo(); } catch (err) { this.play(this.st.cur, true); } }
      };
      const off = () => { document.removeEventListener('pointerdown', kick, true); document.removeEventListener('keydown', kick, true); };
      document.addEventListener('pointerdown', kick, true); document.addEventListener('keydown', kick, true);
    }
    // au bout de quelques secondes, le lecteur se range en disque
    clearTimeout(this.tuck);
    this.tuck = setTimeout(() => { if (this.st.mode === 'mini' && !this.hover && !this.st.ask) this.setMode('disc'); }, 12000);
  },

  /* ---------- Commandes ---------- */
  launch() {
    if (!this.enabled()) { delete LOCAL.muHideDay; LOCAL.music = true; saveLocalPrefs(); }
    if (this.st.mode === 'off') {
      this.mount(); this.setMode('mini');
      if (this.st.cur) { this.toggle(); return; }
      (async () => {
        this.st.busy = true; this.paint();
        try { await this.load(); } catch (e) { this.st.busy = false; this.st.err = 'La sélection n’a pas pu être chargée. Réessaie dans un moment.'; this.paint(); return; }
        this.st.busy = false; this.next();
      })();
      return;
    }
    this.setMode(this.st.mode === 'disc' ? 'mini' : this.st.mode === 'mini' ? 'full' : 'mini');
  },
  next() {
    if (!this.list) return;
    if (this.st.cur) this.back.push(this.st.cur);
    const m = this.pick(); this.hist.push(m);
    this.play(m);
  },
  prev() {
    const m = this.back.pop();
    if (!m) { try { if (this.yt) this.yt.seekTo(+((this.st.cur || {}).debut) || 0, true); } catch (e) { /* rien */ } return; }
    this.play(m);
  },
  toggle() {
    if (this.st.playing) {
      try { this.yt.pauseVideo(); } catch (e) { /* rien */ }
      LOCAL.muPaused = todayStr(); saveLocalPrefs();          // plus de démarrage tout seul aujourd'hui
      return;
    }
    if (LOCAL.muPaused) { delete LOCAL.muPaused; saveLocalPrefs(); }
    if (this.yt && this.ready && this.st.cur && this.yt.getVideoData && (this.yt.getVideoData() || {}).video_id === this.st.cur.yt) {
      try { this.yt.playVideo(); } catch (e) { /* rien */ }
    } else if (this.st.cur) this.play(this.st.cur);
    else this.next();
  },
  hide(forGood) {
    clearInterval(this.fade);
    try { if (this.yt && this.ready) this.yt.pauseVideo(); } catch (e) { /* rien */ }
    this.st.playing = false; this.st.ask = false;
    if (forGood) LOCAL.music = false; else LOCAL.muHideDay = todayStr();
    saveLocalPrefs();
    this.setMode('off');
    if (typeof renderTop === 'function') renderTop();
    toast(forGood ? 'La musique ne reviendra plus. Elle se remet dans Réglages, Cet appareil.' : 'Plus de musique aujourd’hui. Elle reviendra demain.');
  },
  stop() {
    clearInterval(this.fade);
    try { if (this.yt && this.ready) this.yt.pauseVideo(); } catch (e) { /* rien */ }
    this.st.playing = false; this.st.ask = false;
    this.setMode('off');
  },
  setMood(k) {
    if (this.st.mood === k) return;
    this.st.mood = k; LOCAL.muMood = k; saveLocalPrefs();
    this.paint();
    if (this.list) this.next();
  },
  setMode(mode) {
    this.st.mode = mode;
    if (mode !== 'full') this.st.ask = false;
    this.paint();
  },

  /* ---------- Affichage ----------
     Le lecteur est construit une seule fois (déplacer la vidéo la
     relancerait) ; ensuite on ne change que les textes et les classes. */
  mount() {
    if (this.mounted) return;
    this.mounted = true;
    const root = $('#music');
    root.innerHTML = `<div class="mu" role="region" aria-label="Musique">
      <div class="mu-video"><div id="mu-yt"></div><button class="mu-face" data-mu="open" aria-label="Voir le lecteur de musique"><i class="mu-hole"></i></button></div>
      <div class="mu-body">
        <div class="mu-main">
          <div class="mu-now" data-mu="open"><div><p class="mu-t"></p><p class="mu-a"></p></div>
            <button class="icon-btn mu-full" data-mu="mini" aria-label="Réduire le lecteur" title="Réduire">${I('min', 18)}</button></div>
          <p class="mu-note"></p>
          <div class="mu-ctrl">
            <button class="icon-btn mu-full" data-mu="prev" aria-label="Morceau précédent">${I('prev', 18)}</button>
            <button class="play" data-mu="toggle" aria-label="Lecture"></button>
            <button class="icon-btn" data-mu="next" aria-label="Morceau suivant">${I('next', 18)}</button>
            <span class="grow mu-full"></span>
            <button class="icon-btn mu-mini-only" data-mu="disc" aria-label="Ranger dans le coin" title="Ranger dans le coin">${I('min', 18)}</button>
            <button class="icon-btn" data-mu="ask" aria-label="Faire disparaître la musique" title="Faire disparaître">${I('x', 18)}</button>
          </div>
          <div class="mu-mood"><div class="seg" role="group" aria-label="Ambiance">${MOODS.map((x) => `<button data-mu="mood" data-k="${x[0]}">${x[1]}</button>`).join('')}</div></div>
          <p class="mu-msg" role="status"></p>
          <div class="mu-foot"><span>La sélection d’Amélien</span><a href="${this.site}" target="_blank" rel="noopener">Music Discovery</a></div>
        </div>
        <div class="mu-ask">
          <p><b>Faire disparaître la musique ?</b></p>
          <div class="mu-ask-btns">
            <button class="btn small" data-mu="hide-day">Pour aujourd’hui</button>
            <button class="btn small" data-mu="hide-ever">Pour de bon</button>
            <button class="btn small quiet" data-mu="keep">Non, la garder</button>
          </div>
        </div>
      </div>
    </div>`;
    root.addEventListener('mouseenter', () => { this.hover = true; });
    root.addEventListener('mouseleave', () => { this.hover = false; });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mu]'); if (!b) return;
      const k = b.dataset.mu;
      e.stopPropagation();
      if (k === 'open') { if (this.st.mode === 'disc') this.setMode('mini'); else if (this.st.mode === 'mini') this.setMode('full'); return; }
      if (k === 'mini') this.setMode('mini');
      else if (k === 'disc') this.setMode('disc');
      else if (k === 'toggle') this.toggle();
      else if (k === 'next') { this.fails = 0; this.next(); }
      else if (k === 'prev') this.prev();
      else if (k === 'ask') { this.st.mode = 'full'; this.st.ask = true; this.paint(); }
      else if (k === 'keep') { this.st.ask = false; this.paint(); }
      else if (k === 'hide-day') this.hide(false);
      else if (k === 'hide-ever') this.hide(true);
      else if (k === 'mood') this.setMood(b.dataset.k);
      Haptic.tap();
    });
  },
  paint() {
    const root = $('#music'); if (!root) return;
    if (this.mounted) {
      root.hidden = this.st.mode === 'off';
      const mu = $('.mu', root);
      ['disc', 'mini', 'full'].forEach((m) => mu.classList.toggle(m, this.st.mode === m));
      mu.classList.toggle('playing', this.st.playing);
      mu.classList.toggle('asking', this.st.ask);
      const m = this.st.cur;
      $('.mu-t', root).textContent = m ? m.titre : this.st.busy ? 'Un instant…' : 'Musique';
      $('.mu-a', root).textContent = m ? m.artiste + (m.annee ? `, ${m.annee}` : '') : '';
      $('.mu-note', root).textContent = m && m.note ? `« ${m.note} »` : '';
      $('.mu-note', root).hidden = !(m && m.note);
      const pl = $('.play', root);
      pl.innerHTML = I(this.st.playing ? 'pause' : 'play', 18);
      pl.setAttribute('aria-label', this.st.playing ? 'Pause' : 'Lecture');
      $('.mu-face', root).title = m ? `${m.titre}, ${m.artiste}` : 'Musique';
      $$('[data-mu="mood"]', root).forEach((b) => b.classList.toggle('on', b.dataset.k === this.st.mood));
      $('.mu-msg', root).textContent = this.st.err;
    }
    this.paintLauncher();
  },
  paintLauncher() {
    const b = $('.mu-launch');
    if (b) { b.classList.toggle('playing', this.st.playing); b.setAttribute('aria-pressed', String(this.st.mode !== 'off')); }
  },
};
window.Music = Music;

/* Échap range le grand lecteur (sauf si une fenêtre de l'atelier est ouverte) */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && Music.st.mode === 'full' && !ui.sheet && !ui.pop) Music.setMode('mini');
});
