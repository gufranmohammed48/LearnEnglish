# Angrezi (LearnEnglish)

English for Urdu speakers: short daily lessons, spaced-repetition review, pronunciation practice,
stories and real-life conversations, all explained in Urdu (Nastaliq script or Roman Urdu).

- **Web:** https://gufranmohammed48.github.io/LearnEnglish/ (installable PWA, works offline)
- **Android / iPhone:** Capacitor 8 app, app ID `com.mohammed.learnenglish`
- Free; ads planned (never during a lesson). Plan and decisions: [docs/BRAINSTORM.md](docs/BRAINSTORM.md)

## What's in it

| Feature | Where |
|---|---|
| Onboarding: Urdu script or Roman Urdu, goal, daily goal, level (or a placement test) | `app.js` → `onboarding()` |
| Learning path: units, lessons, jump-ahead tests, unit tests | `app.js` → `pathPage()` |
| Lesson player: tip, pick, listen, build a sentence, match, type, fix the mistake, reply, speak | `lesson.js` |
| Hearts (after the first 3 lessons), XP, daily goal, streak | `store.js` |
| Review of learned words (spaced repetition) | `srs.js`, `content.js` → `reviewSession()` |
| Stories with tap-a-word meanings and per-character voices | `content/stories/`, `lesson.js` → `R.line` |
| English voice and speech recognition (browser on web, native plugins in the app) | `speech.js` |
| Daily reminder notification (app only) | `native.js` |
| Offline support | `sw.js` |

Content: 17 units / 30 lessons (A1–A2) + 4 stories, in `content/`. **All Urdu is a draft to be checked**:
see [docs/URDU_REVIEW.md](docs/URDU_REVIEW.md).

## Run it on your computer

```bash
python scripts/serve.py
```

Then open http://localhost:8080. (Caching is off, so edits show on reload.) Add `?debug` to the URL to let test scripts read the current exercise.

## Check content after editing lessons

```bash
python scripts/check_content.py
```

```bash
python scripts/export_urdu.py
```

The first checks every lesson and story for mistakes that would break the app; the second refreshes the Urdu review sheet.

## Android / iPhone app

Needs Node (for Capacitor), plus JDK 21 and the Android SDK for Android builds.

```bash
npm install
```

```bash
npm run sync
```

`npm run sync` copies the web app into `www/` and updates the `android/` and `ios/` projects. Build a debug APK:

```bash
cd android && ./gradlew assembleDebug
```

The APK lands in `android/app/build/outputs/apk/debug/`. `android/local.properties` (not committed) must point at the Android SDK, e.g. `sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk`.
iPhone builds need a Mac (or a cloud Mac via GitHub Actions, as in the Iqama Time project).

## Adding a lesson

1. Write `content/lessons/<id>.json` (copy an existing lesson; exercise types are listed in `CLAUDE.md`).
2. Add it to a unit in `content/course.json`.
3. Run `python scripts/check_content.py`, then bump `VERSION` in `sw.js` so phones get the update.
