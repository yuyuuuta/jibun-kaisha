// ══════════════════════════════════════════
//  Life Orbit Service Worker（オフライン対応）
//  方式：ネットワーク優先・失敗したらキャッシュ
//  → 更新は常に最新が届き、圏外でも前回の状態で開ける
// ══════════════════════════════════════════
const CACHE_NAME = 'life-orbit-v18';
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  './icon-180.png',
  './data/report.json',
  './assets/favicon.svg',
  './assets/favicon-32.png',
  './assets/favicon-64.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/og-image-1200x630.png',
  './assets/splash-1125x2436.png',
  './assets/splash-1170x2532.png',
  './assets/splash-1179x2556.png',
  './assets/splash-1290x2796.png',
  './assets/splash-828x1792.png',
  // 2026-08-06：同梱した書体（Quicksand）。ここに入れないと、電波の無い場所で
  // 2回目以降に開いたとき書体だけ取れず崩れる（同梱した意味が消える）。
  './assets/fonts/quicksand-500-700-latin.woff2',
];

// 1つでも取れないファイルがあると、まとめて登録する方式では
// オフライン対応そのものが失敗する（過去にそれが起きた）。
// そのため1ファイルずつ入れて、取れなかったものは飛ばす。
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
