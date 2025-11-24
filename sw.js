const CACHE_NAME = 'charging-station-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  // 跳过等待，立即激活
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('预缓存失败:', error);
      })
  );
});

// 缓存策略：网络优先，缓存回退
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 忽略浏览器扩展和非http请求
  if (!(event.request.url.indexOf('http') === 0)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 检查响应是否有效
        if (!response || response.status !== 200) {
          return response;
        }

        // 克隆响应，因为响应流只能使用一次
        let responseClone = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          })
          .catch(err => {
            console.error('缓存响应失败:', err);
          });
          
        return response;
      })
      .catch(() => {
        // 网络请求失败时，从缓存中获取
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // 如果是导航请求，返回缓存的首页
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            return Promise.reject('no-match');
          });
      })
  );
});

// 激活时清除旧缓存
self.addEventListener('activate', event => {
  // 立即接管页面
  clients.claim();
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});