// 인터넷이 없어도 앱 화면이 열리도록 저장해두는 역할.
// 번역 자체는 인터넷이 필요하지만, 앱과 여행 문장집은 오프라인에서도 동작한다.

const CACHE = "translator-v3";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn("[sw] 저장 실패:", err))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // 번역 요청은 저장하지 않고 항상 인터넷으로 (오래된 번역이 남으면 안 되니까)
  if (url.hostname !== self.location.hostname) return;
  if (event.request.method !== "GET") return;

  // 인터넷이 되면 최신 파일을 쓰고, 안 되면 저장해둔 걸 쓴다
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match("./index.html")))
  );
});
