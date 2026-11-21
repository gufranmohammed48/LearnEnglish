// Copies the web app into www/ so Capacitor can bundle it into the Android/iPhone app.
const fs = require("fs");
const files = ["index.html", "style.css", "app.js", "lesson.js", "content.js", "store.js", "srs.js", "speech.js",
  "strings.js", "ui.js", "native.js", "sw.js", "manifest.json"];
fs.rmSync("www", { recursive: true, force: true });
fs.mkdirSync("www", { recursive: true });
for (const f of files) fs.copyFileSync(f, `www/${f}`);
fs.cpSync("icons", "www/icons", { recursive: true });
fs.cpSync("content", "www/content", { recursive: true });
console.log("www/ ready");
