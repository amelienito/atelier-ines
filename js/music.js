'use strict';
/* =====================================================================
   ATELIER · musique
   Le lecteur de Music Discovery (la sélection d'Amélien), en petit.
   Il ne fait rien tant qu'on n'a pas appuyé sur « Musique », n'écrit
   rien dans les données d'Inès, et se range en petit dans un coin.
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
  enabled() { return LOCAL.music !== false; },

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
  target() { return Math.round(85 * Math.min(1, +((this.st.cur || {}).volume) || 1)); },
  onState(e) {
    const S = window.YT ? YT.PlayerState : {};
    if (e.data === S.PLAYING) {
      this.st.playing = true; this.fails = 0; this.st.err = '';
      try { this.yt.setVolume(this.target()); } catch (err) { /* rien */ }
    } else if (e.data === S.PAUSED) this.st.playing = false;
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
    } catch (e) {
      this.st.err = 'YouTube ne répond pas pour l’instant.';
      this.paint();
    }
  },

  /* ---------- Commandes ---------- */
  launch() {
    if (isPhone()) return;                                   // pas de lecteur sur le téléphone
    if (this.st.mode === 'full') { this.setMode('mini'); return; }
    if (this.st.mode === 'mini') { this.setMode('full'); return; }
    this.mount();
    this.setMode('full');
    if (this.st.cur) { this.toggle(); return; }
    (async () => {
      this.st.busy = true; this.paint();
      try { await this.load(); } catch (e) { this.st.busy = false; this.st.err = 'La sélection n’a pas pu être chargée. Réessaie dans un moment.'; this.paint(); return; }
      this.st.busy = false; this.next();
    })();
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
    if (this.st.playing) { try { this.yt.pauseVideo(); } catch (e) { /* rien */ } return; }
    if (this.yt && this.ready && this.st.cur && this.yt.getVideoData && (this.yt.getVideoData() || {}).video_id === this.st.cur.yt) {
      try { this.yt.playVideo(); } catch (e) { /* rien */ }
    } else if (this.st.cur) this.play(this.st.cur);
    else this.next();
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
      <div class="mu-video"><div id="mu-yt"></div><button class="mu-face" data-mu="open" aria-label="Agrandir le lecteur"></button></div>
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
            <button class="icon-btn mu-mini-only" data-mu="open" aria-label="Agrandir le lecteur" title="Agrandir">${I('max', 18)}</button>
            <button class="icon-btn" data-mu="stop" aria-label="Arrêter la musique" title="Arrêter">${I('x', 18)}</button>
          </div>
          <div class="mu-mood"><div class="seg" role="group" aria-label="Ambiance">${MOODS.map((x) => `<button data-mu="mood" data-k="${x[0]}">${x[1]}</button>`).join('')}</div></div>
          <p class="mu-msg" role="status"></p>
          <div class="mu-foot"><span>La sélection d’Amélien</span><a href="${this.site}" target="_blank" rel="noopener">Music Discovery</a></div>
        </div>
      </div>
    </div>`;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mu]'); if (!b) return;
      const k = b.dataset.mu;
      e.stopPropagation();
      if (k === 'open') { if (this.st.mode === 'mini') this.setMode('full'); return; }
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
      ['mini', 'full'].forEach((m) => mu.classList.toggle(m, this.st.mode === m));
      mu.classList.toggle('playing', this.st.playing);
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
