/* Halloween Games service worker.
   - Every page, script, style and icon is saved on install, so the games open with no connection.
   - Online, files come from the network first (so updates show up straight away) and fall back to
     the saved copy after 3 seconds or when offline.
   - Google Fonts are saved the first time they load and reused afterwards.
   When you add a file, add it to PRECACHE and change CACHE so phones pick up the new list. */
const CACHE = 'halloween-games-v1';
const FONTS = 'halloween-games-fonts-v1';
const PRECACHE = [
  './', 'index.html', 'manifest.webmanifest',
  'css/arcade.css', 'js/arcade.js', 'js/hub.js',
  'games/bones-plinko/index.html', 'games/bones-plinko/game.js',
  'games/pumpkin-bowling/index.html', 'games/pumpkin-bowling/game.js',
  'games/bat-catcher/index.html', 'games/bat-catcher/game.js',
  'games/witch-dinner/index.html', 'games/witch-dinner/game.js', 'games/witch-dinner/style.css',
  'games/haunted-house/index.html', 'games/haunted-house/game.js', 'games/haunted-house/style.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Saved copies are stored without the ?v= tag so every version of a page finds them.
function keyFor(url) { const u = new URL(url); u.search = ''; return u.href; }

function networkFirst(req) {
  const key = keyFor(req.url);
  return new Promise((resolve) => {
    let settled = false;
    const done = (r) => { if (!settled && r) { settled = true; resolve(r); return true; } return false; };
    const timer = setTimeout(() => { caches.match(key).then(done); }, 3000);
    fetch(req).then((res) => {
      clearTimeout(timer);
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
      done(res);
    }).catch(() => {
      clearTimeout(timer);
      caches.match(key).then((r) => {
        if (done(r)) return;
        if (req.mode === 'navigate') caches.match(new URL('index.html', self.registration.scope).href).then((h) => done(h || Response.error()));
        else done(Response.error());
      });
    });
  });
}

function staleWhileRevalidate(req) {
  return caches.open(FONTS).then((c) => c.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) e.respondWith(networkFirst(req));
  else if (FONT_HOSTS.indexOf(url.hostname) >= 0) e.respondWith(staleWhileRevalidate(req));
});
