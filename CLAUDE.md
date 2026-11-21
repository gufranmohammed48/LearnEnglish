# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

Angrezi (repo LearnEnglish): an English-learning app for Urdu speakers (adults in Pakistan/India and abroad).
Free with ads (planned). Vanilla JS PWA with no build step, wrapped with Capacitor 8 for Android and iPhone
(app ID `com.mohammed.learnenglish`, permanent). Plan and decisions: `docs/BRAINSTORM.md`.
The owner checks all Urdu; every Urdu text is a draft until they approve it (`docs/URDU_REVIEW.md`).

## Commands

```
python scripts/serve.py            # dev server, no caching, http://localhost:8080 (add ?debug for test hooks)
python scripts/check_content.py    # validate course.json, lessons, stories (run after any content edit)
python scripts/export_urdu.py      # regenerate docs/URDU_REVIEW.md
npm run sync                       # copy web files to www/ and update android/ + ios/
cd android && ./gradlew assembleDebug   # needs JAVA_HOME = JDK 21, android/local.properties sdk.dir
```

No test suite. Verify UI changes in the browser; with `?debug`, the player writes the current exercise
as JSON to `document.body.dataset.ex`, which lets a script answer exercises automatically.

## Architecture

- `index.html` loads `app.js` (ES module). Hash routes: `#/` path, `#/lesson/<id>`, `#/practice/<id>`,
  `#/review`, `#/test/<unit>`, `#/jump/<unit>`, `#/stories`, `#/story/<id>`, `#/words`, `#/me`.
- `app.js`: screens and routing. `lesson.js`: the exercise player (`play(session, root)` → result).
  Each exercise type is a renderer in `R` returning `{ el, check() }`; `api.ready()` enables Check,
  `api.submit()` finishes on its own (match, speak).
- `store.js`: all learner state in localStorage key `angrezi` (settings, xp, streak, hearts, done, cards).
  `srs.js`: spaced-repetition cards. `content.js`: loads JSON, builds review/test/story sessions.
- `speech.js`: TTS + speech recognition. Uses Web Speech API on the web and the Capacitor community
  plugins inside the app (Android WebView has no speech APIs). `native.js`: app-only features.
- `strings.js`: every interface text as `{ ur, roman }`. `ui.js`: `h()` element builder, `t()`/`tx()` for
  interface text, `ur()` for content text, `en()` for English (always LTR, Latin font).
- `sw.js`: offline cache; reads lesson and story lists from the JSON. **Bump `VERSION` on every change.**

## Content format

- `content/course.json`: units → lessons. `soon: true` units show as "coming soon".
- `content/lessons/<id>.json`: `{ id, words: [{en, ur, roman}], exercises: [...] }`. `words` become review cards.
- Exercise types: `tip` (text, examples), `pick` (q {en} or {ur, roman}; options English strings or {ur, roman};
  `___` in q.en makes a gap question), `listen` (say, options), `reply` (say, options, optional scene),
  `build` (q, answer, extra tiles, optional accept), `match` (3-6 pairs), `type` (say, answer, meaning),
  `fix` (sentence, wrong word indexes, fixed, why), `speak` (say, meaning). Optional `why` explains mistakes.
- `content/stories/index.json` + `<id>.json`: `cast` (name → "f"/"m"), `glossary` (lowercase word → {ur, roman}),
  `items` (lines `{who?, en, ur, roman}` or any exercise).

## Conventions

- Mobile first, RTL for Urdu script, LTR for Roman Urdu; colors are CSS variables with dark mode.
- Offline first; nothing leaves the device. Ads never appear during a lesson.
- Write files containing Urdu with the Write tool (not shell heredocs).
- Pushing `.github/workflows` fails (the stored GitHub token lacks the workflow scope); add workflows via the GitHub web UI.
