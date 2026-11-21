// Offline support. Bump VERSION whenever any file changes so phones pick up the update.
const VERSION = "angrezi-v1";
const FONTS = "angrezi-fonts"; // kept across versions
const LESSONS = ["u1-l1", "u1-l2", "u1-l3", "u2-l1", "u2-l2", "u3-l1", "u3-l2", "u4-l1", "u4-l2",
  "u5-l1", "u5-l2", "u6-l1", "u6-l2", "u7-l1"];
const FILES = ["./", "index.html", "style.css", "app.js", "lesson.js", "content.js", "store.js", "srs.js", "speech.js",
  "strings.js", "ui.js", "manifest.json", "content/course.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  ...LESSONS.map((id) => "content/lessons/" + id + ".json")];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONTS).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// App files: network first (so updates show up), cache when offline.
// Google Fonts: cache first (they never change), so Urdu text looks right offline.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(FONTS).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then((res) => {
      if (res.ok && res.status === 200) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
