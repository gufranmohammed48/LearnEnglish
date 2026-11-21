// Spaced repetition: every word learned becomes a card that comes back just before it is forgotten.
// Simple SM-2 style scheduler (interval grows by "ease" after each correct answer, resets after a miss).
// Can be swapped for FSRS later without changing the card shape much.
import { state, save } from "./store.js";

const DAY = 24 * 60 * 60 * 1000;
const key = (en) => en.trim().toLowerCase();

/** Adds the words from a finished lesson. Already-known words are left alone. */
export function addWords(words, lessonId) {
  for (const w of words || []) {
    const k = key(w.en);
    if (!state.cards[k]) {
      state.cards[k] = { en: w.en, ur: w.ur, roman: w.roman, lesson: lessonId, due: Date.now() + DAY, ivl: 1, ease: 2.3, reps: 0, lapses: 0 };
    }
  }
  save();
}

export function allCards() {
  return Object.values(state.cards);
}

export function dueCards(now = Date.now()) {
  return allCards().filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
}

/** Records one answer for a word. */
export function grade(en, ok) {
  const c = state.cards[key(en)];
  if (!c) return;
  if (ok) {
    c.reps += 1;
    c.ivl = c.reps === 1 ? Math.max(c.ivl, 2) : Math.round(c.ivl * c.ease);
    c.ivl = Math.min(c.ivl, 365);
    c.ease = Math.min(3, c.ease + 0.05);
    c.due = Date.now() + c.ivl * DAY;
  } else {
    c.lapses += 1;
    c.reps = 0;
    c.ivl = 1;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.due = Date.now() + 10 * 60 * 1000; // try again in 10 minutes
  }
  save();
}

/** 0-4 bars for the Words screen. */
export function strength(c) {
  if (c.due <= Date.now()) return 1;
  if (c.ivl >= 21) return 4;
  if (c.ivl >= 7) return 3;
  return 2;
}
