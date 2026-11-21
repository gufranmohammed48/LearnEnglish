# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

LearnEnglish: an English-learning app for Urdu speakers (adults in Pakistan/India and abroad).
Free with ads. Planned stack matches the owner's other apps (IqamaTime, Translator):
vanilla JS PWA, no build step, wrapped with Capacitor 8 for Android and iPhone.

Current phase: brainstorm. The plan, techniques and open questions are in `docs/BRAINSTORM.md`.
Do not start app code until the brainstorm decisions are agreed.

## Conventions (planned)

- Lessons are JSON in `content/`; the app is a generic lesson player.
- UI is Urdu, right-to-left, Nastaliq font bundled for offline use, with a Roman Urdu option.
- Offline first; progress and spaced-repetition state stay on the device.
- Ads never appear during a lesson.
- Write files containing Urdu text with the Write tool, not shell heredocs.
