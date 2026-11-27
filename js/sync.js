'use strict';
/* =====================================================================
   ATELIER · mémoire
   1. Sur l'appareil : stockage du navigateur + copie de secours
      (IndexedDB) + une copie par jour gardée 30 jours.
   2. En ligne : fichier data.json dans un dépôt GitHub privé. Chaque
      modification = une version datée, restaurable depuis Réglages.
   3. Couvertures photo : un fichier par image dans le même dépôt.
   ===================================================================== */

/* ---------- Petite base locale (IndexedDB) ---------- */
const IDB = {
  p: null,
  db() {
    if (!this.p) {
      this.p = new Promise((res, rej) => {
        try {
          const r = indexedDB.open('atelier', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('kv');
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        } catch (e) { rej(e); }
      });
    }
    return this.p;
  },
  async run(mode, fn) {
    const db = await this.db();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', mode);
      const req = fn(tx.objectStore('kv'));
      tx.oncomplete = () => res(req ? req.result : undefined);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
  },
  get(k) { return this.run('readonly', (s) => s.get(k)).catch(() => undefined); },
  set(k, v) { return this.run('readwrite', (s) => s.put(v, k)).catch(() => undefined); },
  del(k) { return this.run('readwrite', (s) => s.delete(k)).catch(() => undefined); },
  keys() { return this.run('readonly', (s) => s.getAllKeys()).catch(() => []); },
};

/* ---------- Copies locales ---------- */
const Backup = {
  timer: null,
  schedule() { clearTimeout(this.timer); this.timer = setTimeout(() => this.write(), 1200); },
  async write() {
    const json = JSON.stringify(state);
    await IDB.set('state', json);
    await IDB.set('snap:' + todayStr(), json);
    const snaps = (await this.list()).reverse();
    for (const k of snaps.slice(0, Math.max(0, snaps.length - 30))) await IDB.del('snap:' + k);
  },
  async list() { return (await IDB.keys()).filter((k) => String(k).startsWith('snap:')).map((k) => String(k).slice(5)).sort().reverse(); },
  async get(day) { const j = await IDB.get('snap:' + day); return j ? JSON.parse(j) : null; },
};

/* ---------- Encodage ---------- */
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
const b64url = (s) => b64encode(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => b64decode(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
const blobToB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
function b64ToBlob(b64, type) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type });
}

function deviceName() {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh|Mac OS/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'PC';
  return 'Navigateur';
}

/* ---------- Lien de connexion ----------
   https://…/atelier-ines/#connecter=<code> : le code contient le compte,
   le dépôt et le jeton. La partie après # n'est jamais envoyée au serveur. */
const Link = {
  code() {
    const c = Sync.cfg;
    return c.owner === DEFAULT_OWNER && c.repo === DEFAULT_REPO ? c.token : b64url(JSON.stringify({ o: c.owner, r: c.repo, t: c.token }));
  },
  make() { return `${location.origin}${location.pathname}#connecter=${this.code()}`; },
  parse(text) {
    text = String(text || '').trim();
    const m = text.match(/connecter=([A-Za-z0-9_-]+)/);
    if (m && /^(github_pat_|ghp_)/.test(m[1])) return { owner: DEFAULT_OWNER, repo: DEFAULT_REPO, token: m[1] };
    if (m) {
      try { const j = JSON.parse(unb64url(m[1])); if (j.t) return { owner: j.o || DEFAULT_OWNER, repo: j.r || DEFAULT_REPO, token: j.t }; } catch (e) { /* rien */ }
      return null;
    }
    if (/^(github_pat_|ghp_)[A-Za-z0-9_]+$/.test(text)) return { owner: DEFAULT_OWNER, repo: DEFAULT_REPO, token: text };
    return null;
  },
  /* iPhone, iPad, Safari du Mac : l'icône ajoutée à l'écran d'accueil (ou au Dock) a sa propre
     mémoire, vide. On glisse la connexion dans son adresse de départ : elle s'ouvre déjà connectée. */
  pin() {
    if (!Sync.enabled() || !Device.carries()) return;
    const url = this.make(); const dir = location.origin + location.pathname.replace(/[^/]*$/, '');
    const man = {
      name: 'Atelier — Inès', short_name: 'Atelier', start_url: url, scope: dir, display: 'standalone',
      background_color: '#f3f3f0', theme_color: '#f3f3f0',
      icons: [{ src: dir + 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' }, { src: dir + 'icon-512.png', sizes: '512x512', type: 'image/png' }],
    };
    const el = document.querySelector('link[rel="manifest"]');
    if (el) el.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(man));
    if (Device.ios) history.replaceState(null, '', location.pathname + location.search + '#connecter=' + this.code());
  },
  unpin() {
    const el = document.querySelector('link[rel="manifest"]'); if (el) el.href = 'manifest.json';
    if (location.hash.includes('connecter=')) history.replaceState(null, '', location.pathname + location.search);
  },
};

const Device = (() => {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const macSafari = !ios && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|Firefox|OPR/.test(ua);
  return {
    ios, macSafari,
    app: () => !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)),
    carries() { return (ios || macSafari) && !this.app(); },
  };
})();

/* ---------- Couvertures photo ---------- */
const Covers = {
  urls: new Map(), failed: new Set(), busy: new Set(),
  url(key) { const u = this.urls.get(key); if (!u) this.load(key); return u || ''; },
  async load(key) {
    if (!key || this.busy.has(key) || this.failed.has(key)) return;
    this.busy.add(key);
    try {
      let blob = await IDB.get('cover:' + key);
      if (!blob && Sync.enabled()) { blob = await Sync.getCover(key); if (blob) await IDB.set('cover:' + key, blob); }
      if (blob) {
        const u = URL.createObjectURL(blob);
        this.urls.set(key, u);
        $$(`[data-cover="${key}"]`).forEach((el) => { el.style.setProperty('--img', `url("${u}")`); el.classList.add('has-img'); el.classList.remove('img-wait'); });
      } else this.failed.add(key);
    } catch (e) { this.failed.add(key); } finally { this.busy.delete(key); }
  },
  async fromFile(file) {
    const blob = await shrinkImage(file, 1200, 0.82);
    const key = uid() + uid();
    await IDB.set('cover:' + key, blob);
    this.urls.set(key, URL.createObjectURL(blob));
    const q = (await IDB.get('coverq')) || [];
    q.push(key);
    await IDB.set('coverq', q);
    return key;
  },
};
async function shrinkImage(file, max, quality) {
  let src;
  try { src = await createImageBitmap(file); } catch (e) {
    src = await new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file); });
  }
  const k = Math.min(1, max / Math.max(src.width, src.height));
  const c = document.createElement('canvas');
  c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('image'))), 'image/jpeg', quality));
}

/* ---------- Synchro GitHub ---------- */
const Sync = {
  cfg: null, status: 'off', msg: '', timer: null, busy: false, again: false, dirty: false, coverBusy: false,
  load() {
    try { this.cfg = JSON.parse(localStorage.getItem(LS_SYNC)) || null; } catch (e) { this.cfg = null; }
    this.dirty = localStorage.getItem(LS_DIRTY) === '1';
  },
  saveCfg() { try { if (this.cfg) localStorage.setItem(LS_SYNC, JSON.stringify(this.cfg)); else localStorage.removeItem(LS_SYNC); } catch (e) { /* rien */ } },
  setDirty(v) { this.dirty = v; try { if (v) localStorage.setItem(LS_DIRTY, '1'); else localStorage.removeItem(LS_DIRTY); } catch (e) { /* rien */ } },
  enabled() { const c = this.cfg; return !!(c && c.owner && c.repo && c.token); },
  branch() { return (this.cfg && this.cfg.branch) || 'main'; },
  setStatus(s, msg = '') {
    this.status = s; this.msg = msg;
    if (s === 'ok' && this.cfg) { this.cfg.lastOk = now(); this.saveCfg(); }
    if (typeof renderSyncState === 'function') renderSyncState();
  },
  base(c = this.cfg) { return `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}`; },
  req(method, path, body, c = this.cfg) {
    const headers = { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json' };
    if (body) headers['Content-Type'] = 'application/json';
    return fetch(this.base(c) + path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  },
  filePath(path) { return `/contents/${(path || this.cfg.path || 'data.json').split('/').map(encodeURIComponent).join('/')}`; },
  /* Contenu d'un fichier (passe par l'API « blobs » au-delà d'1 Mo) */
  async readB64(j) {
    if (j.content) return j.content;
    if (j.sha) { const r = await this.req('GET', `/git/blobs/${j.sha}`); if (!r.ok) throw await httpError(r); return (await r.json()).content; }
    return '';
  },
  async pull(ref) {
    const res = await this.req('GET', `${this.filePath()}?ref=${encodeURIComponent(ref || this.branch())}&_=${now()}`);
    if (res.status === 404) return { exists: false };
    if (!res.ok) throw await httpError(res);
    const j = await res.json();
    return { exists: true, sha: j.sha, data: JSON.parse(b64decode(await this.readB64(j))) };
  },
  async put(data, sha) {
    const body = { message: `Atelier · ${deviceName()} · ${new Date().toLocaleString('fr-FR')}`, content: b64encode(JSON.stringify(data)), branch: this.branch() };
    if (sha) body.sha = sha;
    const res = await this.req('PUT', this.filePath(), body);
    if (res.status === 409 || res.status === 422) { const e = new Error('conflit'); e.conflict = true; throw e; }
    if (!res.ok) throw await httpError(res);
    return (await res.json()).content.sha;
  },
  schedule() {
    if (!this.enabled()) return;
    this.setDirty(true);
    if (!this.busy) this.setStatus('pending');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 2000);
  },
  async flush() {
    if (!this.enabled()) return;
    if (!this.dirty) { this.pushCovers(); return; }
    if (this.busy) { this.again = true; return; }
    clearTimeout(this.timer);
    this.busy = true; this.setStatus('saving');
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          const snapshot = JSON.stringify(state);
          this.cfg.sha = await this.put(state, this.cfg.sha);
          this.saveCfg();
          if (JSON.stringify(state) === snapshot) this.setDirty(false);
          break;
        } catch (e) {
          if (!e.conflict || attempt >= 2) throw e;
          await this.absorbRemote();
        }
      }
      this.setStatus(this.dirty ? 'pending' : 'ok');
    } catch (e) { this.fail(e); } finally {
      this.busy = false;
      if ((this.again || this.dirty) && this.status !== 'offline' && this.status !== 'error') { this.again = false; this.schedule(); }
      else this.pushCovers();
    }
  },
  /* Récupère la version en ligne et la fusionne avec celle de l'appareil */
  async absorbRemote() {
    const r = await this.pull();
    if (!r.exists) { this.cfg.sha = null; this.saveCfg(); this.setDirty(true); return false; }
    const merged = combine(state, r.data);
    const changedHere = !sameState(merged, state);
    if (!sameState(merged, r.data)) this.setDirty(true);
    this.cfg.sha = r.sha; this.saveCfg();
    if (changedHere) replaceState(merged);
    return changedHere;
  },
  async refresh(force) {
    if (!this.enabled() || this.busy || (this.dirty && !force)) return;
    this.busy = true;
    try {
      const changed = await this.absorbRemote();
      if (changed && !force) toast('Mis à jour avec ce qui a été fait sur un autre appareil');
      this.setStatus(this.dirty ? 'pending' : 'ok');
    } catch (e) { this.fail(e); } finally {
      this.busy = false;
      if (this.dirty && this.status !== 'error' && this.status !== 'offline') this.schedule();
    }
  },
  fail(e) {
    console.warn('Synchro :', e);
    if (e instanceof TypeError || !navigator.onLine) this.setStatus('offline');
    else this.setStatus('error', e.message || 'Erreur de synchro');
  },
  /* decide(remote) peut demander quoi faire des livres déjà sur l'appareil :
     renvoie 'remote' (prendre ceux en ligne, ou repartir de zéro) ou 'keep' */
  async connect(cfg, decide) {
    let res;
    try { res = await this.req('GET', '', null, cfg); } catch (e) { return 'Pas de connexion internet pour l’instant.'; }
    if (res.status === 401) return 'Ce jeton est refusé : il est faux ou a expiré.';
    if (res.status === 404) return 'Dépôt introuvable, ou le jeton n’y a pas accès.';
    if (!res.ok) return `GitHub répond une erreur (${res.status}).`;
    const j = await res.json().catch(() => ({}));
    if (j.permissions && j.permissions.push === false) return 'Ce jeton peut lire mais pas écrire (il faut « Contents : Read and write »).';
    this.cfg = { owner: cfg.owner, repo: cfg.repo, token: cfg.token, branch: j.default_branch || 'main', path: 'data.json', sha: null };
    if (decide) {
      let r = null;
      try { r = await this.pull(); } catch (e) { r = null; }
      if (r) {
        const remote = r.exists ? normalize(r.data) : null;
        if ((await decide(remote)) === 'remote') replaceState(remote || freshState());
      }
    }
    this.saveCfg();
    Covers.failed.clear();
    await this.refresh(true);
    if (this.status === 'error') return this.msg;
    await this.flush();
    return this.status === 'error' ? this.msg : null;
  },
  disconnect() { clearTimeout(this.timer); this.cfg = null; this.saveCfg(); this.setDirty(false); this.setStatus('off'); },
  async start() {
    if (!this.enabled()) { this.setStatus('off'); return; }
    await this.refresh(true);
    await this.flush();
  },

  /* Historique des versions en ligne */
  async history(page = 1) {
    const res = await this.req('GET', `/commits?path=${encodeURIComponent(this.cfg.path || 'data.json')}&sha=${encodeURIComponent(this.branch())}&per_page=25&page=${page}`);
    if (!res.ok) throw await httpError(res);
    return (await res.json()).map((c) => ({ sha: c.sha, date: (c.commit && (c.commit.author || c.commit.committer) || {}).date, msg: (c.commit && c.commit.message) || '' }));
  },
  async version(sha) { const r = await this.pull(sha); return r.exists ? r.data : null; },

  /* Couvertures */
  async getCover(key) {
    const res = await this.req('GET', `${this.filePath(`covers/${key}.jpg`)}?ref=${encodeURIComponent(this.branch())}`);
    if (!res.ok) return null;
    return b64ToBlob(await this.readB64(await res.json()), 'image/jpeg');
  },
  async pushCovers() {
    if (!this.enabled() || this.coverBusy) return;
    this.coverBusy = true;
    try {
      let q = (await IDB.get('coverq')) || [];
      for (const key of [...q]) {
        const blob = await IDB.get('cover:' + key);
        if (blob) {
          const res = await this.req('PUT', this.filePath(`covers/${key}.jpg`), { message: `Couverture · ${deviceName()}`, content: await blobToB64(blob), branch: this.branch() });
          if (!res.ok && res.status !== 422) throw await httpError(res);
        }
        q = q.filter((k) => k !== key);
        await IDB.set('coverq', q);
      }
    } catch (e) { console.warn('Couvertures :', e); } finally { this.coverBusy = false; }
  },
};

async function httpError(res) {
  let m = '';
  try { m = (await res.json()).message || ''; } catch (e) { /* rien */ }
  if (res.status === 401) return new Error('Le jeton a expiré ou a été refusé : il faut en recoller un dans Réglages');
  if (res.status === 403) return new Error(`GitHub refuse l’accès${m ? ' (' + m + ')' : ''}`);
  return new Error(`GitHub ${res.status}${m ? ' : ' + m : ''}`);
}
