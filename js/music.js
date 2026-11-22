'use strict';
/* =====================================================================
   ATELIER · musique
   Le lecteur de Music Discovery (la sélection d'Amélien), en petit.
   Il ne se lance jamais tout seul, n'écrit rien dans les données
   d'Inès, et se range dans un coin pendant qu'elle travaille.
   ===================================================================== */

const MOODS = [['calme', 'Calme'], ['pose', 'Posé'], ['tout', 'Un peu de tout']];
const ytId = (lien) => {
  const s = String(lien || '');
  const m = s.match(/[?&]v=([\w-]{11})/) || s.match(/youtu\.be\/([\w-]{11})/) || s.match(/embed\/([\w-]{11})/);
  return m ? m[1] : '';
};

const Music = {
  st: { mode: 'off', playing: false, cur: null, err: '', mood: LOCAL.muMood || 'pose', busy: false },
  list: null, yt: null, ready: false, fails: 0, hist: [], back: [], mounted: false,
  site: 'https://amelienito.github.io/music-discovery/',
  src() { return location.hostname.endsWith('github.io') ? '../music-discovery/data.js' : this.site + 'data.js'; },

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
    const mood = this.st.mood;
    const all = this.list || [];
    const p = mood === 'calme' ? all.filter((m) => e(m) <= 4) : mood === 'pose' ? all.filter((m) => e(m) >= 3 && e(m) <= 6) : all;
    return p.length ? p : all;
  },
  pick() {
    const pool = this.pool();
    const recent = new Set(this.hist.slice(-40).map((m) => m.yt));
    let cand = pool.filter((m) => !recent.has(m.yt));
    if (!cand.length) cand = pool;
    // les coups de cœur reviennent un peu plus souvent
    const w = cand.map((m) => (m.coeur ? 2 : 1));
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
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, origin: location.origin.indexOf('http') === 0 ? location.origin : undefined },
        events: {
          onReady: () => { this.ready = true; res(); },
          onStateChange: (e) => this.onState(e),
          onError: () => this.onError(),
        },
      });
    });
    return this.yt;
  },
  onState(e) {
    const S = window.YT ? YT.PlayerState : {};
    if (e.data === S.PLAYING) { this.st.playing = true; this.fails = 0; this.st.err = ''; }
    else if (e.data === S.PAUSED) this.st.playing = false;
    else if (e.data === S.ENDED) { this.st.playing = false; this.next(); return; }
    this.paint();
  },
  onError() {
    this.fails++;
    if (this.fails >= 3) { this.st.err = 'YouTube refuse de lire ces morceaux ici pour l’instant.'; this.st.playing = false; this.paint(); return; }
    this.next();
  },
  async play(m) {
    if (!m) return;
    this.st.cur = m; this.st.err = ''; this.paint();
    try {
      const yt = await this.player();
      yt.loadVideoById({ videoId: m.yt, startSeconds: +m.debut || 0 });
      try { yt.setVolume(Math.round(Math.min(1, +m.volume || 1) * 85)); } catch (e) { /* rien */ }
    } catch (e) {
      this.st.err = 'YouTube ne répond pas. Vérifie la connexion et réessaie.';
      this.paint();
    }
  },

  /* ---------- Commandes ---------- */
  async launch() {
    if (this.st.mode === 'full') { this.setMode('mini'); return; }
    if (this.st.mode === 'mini') { this.setMode('full'); return; }
    this.mount();
    this.setMode('full');
    if (this.st.cur) { this.toggle(); return; }
    this.st.busy = true; this.paint();
    try { await this.load(); } catch (e) { this.st.busy = false; this.st.err = 'La sélection n’a pas pu être chargée. Réessaie dans un moment.'; this.paint(); return; }
    this.st.busy = false;
    this.next();
  },
  next() {
    if (!this.list) return;
    if (this.st.cur) this.back.push(this.st.cur);
    const m = this.pick();
    this.hist.push(m);
    this.play(m);
  },
  prev() {
    const m = this.back.pop();
    if (!m) { try { if (this.yt) this.yt.seekTo(+((this.st.cur || {}).debut) || 0, true); } catch (e) { /* rien */ } return; }
    this.play(m);
  },
  toggle() {
    if (!this.yt || !this.ready) { if (this.list && !this.st.cur) this.next(); return; }
    try {
      if (this.st.playing) this.yt.pauseVideo(); else this.yt.playVideo();
    } catch (e) { /* rien */ }
  },
  stop() {
    try { if (this.yt && this.ready) this.yt.pauseVideo(); } catch (e) { /* rien */ }
    this.st.playing = false;
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
      <div class="mu-video"><div id="mu-yt"></div></div>
      <div class="mu-body">
        <div class="mu-now" data-mu="open"><div><p class="mu-t"></p><p class="mu-a"></p></div><button class="icon-btn mu-full" data-mu="mini" aria-label="Réduire le lecteur" title="Réduire">${I('min', 18)}</button></div>
        <p class="mu-note"></p>
        <div class="mu-ctrl">
          <button class="icon-btn mu-full" data-mu="prev" aria-label="Morceau précédent">${I('prev', 18)}</button>
          <button class="play" data-mu="toggle" aria-label="Lecture"></button>
          <button class="icon-btn" data-mu="next" aria-label="Morceau suivant">${I('next', 18)}</button>
          <span class="grow mu-full"></span>
          <button class="icon-btn mu-mini-only" data-mu="open" aria-label="Agrandir le lecteur" title="Agrandir">${I('max', 18)}</button>
          <button class="icon-btn" data-mu="stop" aria-label="Arrêter la musique" title="Arrêter">${I('x', 18)}</button>
        </div>
        <div class="mu-mood"><div class="seg" role="group" aria-label="Ambiance">${MOODS.map((x) => `<button data-mu="mood" data-k="${x[0]}">${x[1]}</button>`).join('')}</div></div>
        <p class="mu-msg" role="status"></p>
        <div class="mu-foot"><span>La sélection d’Amélien</span><a href="${this.site}" target="_blank" rel="noopener">Music Discovery</a></div>
      </div>
    </div>`;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mu]'); if (!b) return;
      const k = b.dataset.mu;
      if (k === 'open') { if (this.st.mode === 'mini' && !e.target.closest('[data-mu="mini"]')) this.setMode('full'); return; }
      e.stopPropagation();
      if (k === 'mini') this.setMode('mini');
      else if (k === 'toggle') this.toggle();
      else if (k === 'next') { this.fails = 0; this.next(); }
      else if (k === 'prev') this.prev();
      else if (k === 'stop') this.stop();
      else if (k === 'mood') this.setMood(b.dataset.k);
      Haptic.tap();
    });
  },
  paint() {
    const root = $('#music'); if (!root) return;
    if (this.mounted) {
      root.hidden = this.st.mode === 'off';
      const mu = $('.mu', root);
      mu.classList.toggle('mini', this.st.mode === 'mini');
      mu.classList.toggle('playing', this.st.playing);
      const m = this.st.cur;
      $('.mu-t', root).textContent = m ? m.titre : this.st.busy ? 'Chargement de la sélection…' : 'Music Discovery';
      $('.mu-a', root).textContent = m ? m.artiste + (m.annee ? `, ${m.annee}` : '') : '';
      $('.mu-note', root).textContent = m && m.note ? `« ${m.note} »` : '';
      $('.mu-note', root).hidden = !(m && m.note);
      const pl = $('.play', root);
      pl.innerHTML = I(this.st.playing ? 'pause' : 'play', 18);
      pl.setAttribute('aria-label', this.st.playing ? 'Pause' : 'Lecture');
      $$('[data-mu="mood"]', root).forEach((b) => b.classList.toggle('on', b.dataset.k === this.st.mood));
      $('.mu-msg', root).textContent = this.st.err;
    }
    this.paintLauncher();
  },
  paintLauncher() {
    const b = $('.mu-launch');
    if (b) {
      b.classList.toggle('playing', this.st.playing);
      b.setAttribute('aria-pressed', String(this.st.mode !== 'off'));
    }
  },
};
window.Music = Music;

/* Échap range le grand lecteur (sauf si une fenêtre de l'atelier est ouverte) */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && Music.st.mode === 'full' && !ui.sheet && !ui.pop) Music.setMode(Music.st.cur ? 'mini' : 'off');
});
