const CACHE_NAME = 'countind-v1';
const ASSETS = [
  './',
  './index.html',
];

// 安装时缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // 立即激活，不等待旧 SW 释放
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 网络优先策略（保证获取最新资源），失败时回退缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// 接收主线程消息（用于后台保活心跳）
self.addEventListener('message', (event) => {
  if (event.data === 'keepalive') {
    // 回复心跳，保持 Service Worker 活跃
    event.ports[0]?.postMessage('alive');
  }
});
