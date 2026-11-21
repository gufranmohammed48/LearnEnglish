# LearnEnglish – Brainstorm

An app that teaches English to Urdu speakers. Free, with ads. Web + Android + iPhone.

Status: **draft for discussion** (2026-11-21). Nothing here is final until we agree on it.

---

## 1. Who it is for

Two groups of adult learners (18+):

| Group | Situation | What they need first |
|---|---|---|
| **A. Urdu speakers living abroad** (US mainly, also UK/Gulf) | Need English *now* for daily life | Doctor, school meetings, shopping, phone calls, work, forms, driving test words |
| **B. Urdu speakers in Pakistan / India** | Studies, job interviews, IELTS, going abroad later | Speaking confidence, interviews, grammar, pronunciation, writing emails |

Onboarding asks one question, "Why are you learning English?", and the answer picks the starting path:
Daily life abroad / Job & interviews / Studies & IELTS / Travel / Just for fun.

**Not for kids (under 13)** in the first version: apps aimed at children have strict ad rules
(Google Play Families policy, Apple Kids category, COPPA). We can add a kids mode later without ads.

Reading level varies a lot: some learners read Urdu well, some only speak it. So:
- Every instruction has **audio** (tap the speaker icon to hear it in Urdu).
- Text can be **Urdu script (Nastaliq)** or **Roman Urdu**. The learner picks.

---

## 2. Techniques we borrow from the best apps

### Duolingo – habit and game loop
- **Bite-size lessons**: 3–5 minutes, 10–15 exercises each.
- **Streak** (days in a row), **XP**, daily goal (5 / 10 / 15 / 20 min).
- **Learning path**: units → lessons, unlocked in order, with a "jump ahead" test.
- **Hearts**: lose one per mistake; refill by practising old lessons or watching an ad (see Ads).
- Instant feedback after each answer, with the correct answer and why.
- Mix of exercise types so it never feels the same.

### Anki / Memrise – spaced repetition (SRS)
- Every word and sentence learned becomes a review card.
- Cards come back on a schedule (1 day, 3 days, 1 week, …), just before you would forget.
- Algorithm: **FSRS** (modern, open, better than SM-2). Runs on the phone, no server.
- A daily "Review" button always shows how many cards are due.

### Babbel – teach through the learner's own language
- Short grammar tips **in Urdu**, compared with Urdu grammar. Examples:
  - Word order: Urdu is Subject–Object–Verb ("میں پانی پیتا ہوں"), English is Subject–Verb–Object ("I drink water").
  - English has **a / an / the**; Urdu has no articles → the #1 source of mistakes.
  - Urdu uses postpositions (کے ساتھ = "with"), English uses prepositions placed *before* the noun.
  - "آپ" vs "تم" have no English equivalent; politeness in English comes from "please", "could you", "would you".
  - Tenses: "I am going" vs "I go" vs "I have gone" mapped to Urdu forms.
- **Common Pakistani/Indian English mistakes** drilled on purpose:
  - "I am having a car" → "I have a car"
  - "since 2 years" → "for 2 years"
  - "He is my cousin brother" → "He is my cousin"
  - "Do one thing…", "What is your good name?", "I will do it tomorrow only"
  - "Revert back", "discuss about", "return back"
  - "Where you are going?" → "Where are you going?" (question word order)

### Pimsleur – audio-first, speak out loud
- "Listen and repeat" and "How would you say…?" prompts with a pause to answer.
- A **hands-free audio lesson mode** (good while driving or cooking, and for weak readers).

### ELSA Speak – pronunciation scoring
Practice the sounds Urdu speakers find hardest:
- **v / w** ("very" vs "wary", "vine" vs "wine")
- **th** (θ "think", ð "this") vs ٹ / د
- **Added vowel before s-clusters**: "iskool" → "school", "istation" → "station"
- **Short vowels**: "ship/sheep", "full/fool", "cat/cut"
- **z vs j**, **f vs ph**, final consonants, word stress ("PHOtograph / phoTOgraphy")
- How we score: the phone's speech recognition writes out what you said; we compare it with the target and mark each word green/red. Version 1 is word-level; deeper phoneme scoring can come later.

### Busuu / Speak / Praktika – real conversations
- **Role-play dialogues**: doctor's appointment, parent–teacher meeting, job interview, ordering food, calling a bank, airport, pharmacy, landlord, police stop, 911.
- Learner speaks their part; the app plays the other side.
- Later: an **AI conversation partner** (Claude) that chats about anything and corrects gently in Urdu.

### LingQ / Beelinguapp – learn from stories
- Short graded stories with side-by-side Urdu, tap any word for meaning + audio.
- Words you tap go into your review cards.

### Drops – visual vocabulary
- Picture + word + audio, fast swipes, 5 minutes a day.

---

## 3. Exercise types (v1)

1. Picture ↔ word (tap the right picture)
2. Listen and choose
3. Translate Urdu → English by tapping word tiles (fixes word order)
4. Translate English → Urdu (tiles)
5. Fill the gap (a / an / the, prepositions, tenses)
6. Speak the sentence (pronunciation score)
7. Listen and type (dictation)
8. Match pairs (English ↔ Urdu)
9. Fix the mistake ("I am having a car" → tap the wrong word)
10. Dialogue: choose the right reply

---

## 4. Course outline (first draft)

Levels follow **CEFR** (A1 → B2) so a learner can tell where they stand. A placement test at sign-up puts them in the right place.

**A1 – Survival** (≈ 20 units)
Alphabet & sounds (English letters vs Urdu letters) · Greetings & introducing yourself · Numbers, money, time, dates · Family · Food & shopping · Directions · At the doctor · Phone calls · Days/weather · Basic verbs (be, have, go, want, need) · a/an/the · This/that · Plurals · Present simple · Questions

**A2 – Daily life**
Past tense · Future (will / going to) · School & kids · Work & jobs · Bank, post office, forms · Housing & landlord · Transport & driving · Emergencies · Polite requests · Comparatives

**B1 – Confidence**
Job interviews · Emails & messages · Present perfect · Conditionals · Phrasal verbs · Small talk · Complaints · Telling stories · Opinions

**B2 – Fluency**
IELTS-style speaking & writing · Presentations · Workplace meetings · Idioms · Formal vs informal

Each unit: 4–6 lessons + 1 role-play + 1 story + a unit test.

---

## 5. Motivation and habit

- Streak + streak freeze (earned, or one free per week)
- Daily reminder notification at the time the learner picks
- Weekly progress summary ("You learned 42 words this week")
- Badges for milestones (first conversation, 7-day streak, 500 words)
- **No account needed to start**: progress saved on the phone. Optional sign-in later to back up and sync.
- Leagues/leaderboards: later, needs a server.

---

## 6. Money: free with ads

Plan: **AdMob** (Google) on Android and iPhone; nothing on the web version at first.

Rules so ads don't ruin learning:
- **Never during a lesson.** At most one ad *after* a finished lesson, and not after every lesson (e.g. every 3rd).
- **Rewarded ads** (learner chooses to watch): refill hearts, get a streak freeze, unlock a bonus story.
- Small banner only on the home/path screen, never on exercise screens.
- Later option: a one-time "Remove ads" purchase.

Needs: AdMob account, privacy policy, Google consent screen for Europe/UK (UMP), Apple tracking prompt (ATT), and "Contains ads" on the store listings.

---

## 7. Tech plan (same stack as Iqama Time / Translator)

- **Vanilla JS PWA**, no framework or build step; wrapped with **Capacitor 8** for Android + iPhone.
- App ID: `com.mohammed.learnenglish` (permanent once published, so please confirm).
- **Lessons are JSON files** in `content/`: new lessons ship without an app update (web) or with a small update (stores).
- **Audio**:
  - English: phone text-to-speech first (free, offline); recorded native audio for key lessons later.
  - Urdu instructions: text-to-speech where available, recorded where not.
- **Speech recognition**: Web Speech API on the web, native speech plugin on Android/iPhone.
- **Progress & SRS**: stored on the phone (IndexedDB / Capacitor Preferences). Optional cloud backup later (Firebase, as with Iqama Time).
- **Urdu UI**: right-to-left layout, Noto Nastaliq Urdu font bundled for offline use, Roman Urdu toggle.
- **Offline first**: everything except AI chat and ads works without internet.
- GitHub Actions to build the Android APK/AAB and check the iPhone build (as in Iqama Time).

---

## 8. Phases

| Phase | What | Result |
|---|---|---|
| **0. Brainstorm** | This document, agree on scope | Decisions below answered |
| **1. Skeleton** | App shell, Urdu RTL UI, onboarding, path screen, lesson player with 4 exercise types, progress saved | Clickable web demo |
| **2. MVP content** | Placement test, A1 units 1–5, SRS review, streak/XP/hearts, pronunciation drill | Usable by real learners on the web |
| **3. Phones** | Capacitor Android + iPhone, native speech, notifications, AdMob | Internal testing on Play |
| **4. More content** | Rest of A1, A2, role-plays, stories | Store release |
| **5. Extras** | AI conversation partner, cloud backup, leagues, remove-ads purchase | Growth |

---

## 9. Open questions for you

1. **App name** for the stores? ("LearnEnglish" works for the repo; something like "Angrezi Seekho / انگریزی سیکھو" may do better in Pakistan search.)
2. **App ID** `com.mohammed.learnenglish`: OK?
3. **Content writing**: I can draft lessons and Urdu explanations; who checks the Urdu (you, a friend, a teacher)?
4. **Voices**: start with phone text-to-speech, or record real voices for the first units?
5. **Interface language**: Urdu script by default with a Roman Urdu toggle, or ask on first launch?
6. Should the **web version** be public (GitHub Pages) from the start, as with Iqama Time?
