// ネットワーク優先・失敗時キャッシュ。店内など電波が悪い場所でも前回の画面が開ける。
const CACHE = "kaimono-v4";
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // 画面本体(HTML)はHTTPキャッシュ(max-age=600)を使わず毎回サーバーに更新確認する。
  // 未更新ならETagで304が返るだけなので通信コストはほぼゼロで、修正が即時に行き渡る
  const req = e.request.mode === "navigate"
    ? new Request(e.request.url, { cache: "no-cache" })
    : e.request;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
