const CACHE_NAME = 'aion2-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* 설치: 새 캐시에 에셋 저장 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();          // 대기 없이 즉시 활성화
});

/* 활성화: 이전 버전 캐시 전부 삭제 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();        // 즉시 페이지 제어 시작
});

/* 
  fetch 전략: Network-first (온라인이면 항상 최신, 오프라인이면 캐시)
  → 업데이트 후 캐시 문제 없음
*/
self.addEventListener('fetch', e => {
  // 광고/외부 요청은 SW가 관여하지 않음
  const url = e.request.url;
  if (url.includes('googlesyndication') ||
      url.includes('googleads') ||
      url.includes('doubleclick') ||
      url.includes('fonts.googleapis') ||
      url.includes('fonts.gstatic') ||
      url.includes('cdnjs.cloudflare')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // 네트워크 성공 → 캐시 갱신 후 응답
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => {
        // 네트워크 실패(오프라인) → 캐시에서 응답
        return caches.match(e.request);
      })
  );
});
