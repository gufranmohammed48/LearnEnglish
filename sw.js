// Offline support. Bump VERSION whenever any file changes so phones pick up the update.
const VERSION = "angrezi-v6";
const FONTS = "angrezi-fonts"; // kept across versions
const FILES = ["./", "index.html", "style.css", "app.js", "lesson.js", "content.js", "store.js", "srs.js", "speech.js",
  "strings.js", "ui.js", "native.js", "manifest.json", "content/course.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

// Caches the app plus every lesson listed in course.json, so the whole course works offline.
self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })));
    try {
      const course = await (await fetch("content/course.json", { cache: "reload" })).json();
      const lessons = course.units.flatMap((u) => (u.soon ? [] : u.lessons.map((l) => "content/lessons/" + l.id + ".json")));
      const stories = (await (await fetch("content/stories/index.json", { cache: "reload" })).json()).stories
        .map((st) => "content/stories/" + st.id + ".json");
      await c.addAll([...lessons, "content/stories/index.json", ...stories].map((f) => new Request(f, { cache: "reload" })));
    } catch (err) {}
  })());
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
