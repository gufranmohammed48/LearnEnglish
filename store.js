// Everything the learner does is saved on the device (localStorage). Nothing is sent anywhere.
const KEY = "angrezi";
export const MAX_HEARTS = 5;
const HEART_MS = 30 * 60 * 1000; // one heart comes back every 30 minutes

const fresh = () => ({
  settings: null,          // { script: "ur"|"roman", goal, dailyXp, sfx, autoplay, speak }
  xp: 0,
  day: { date: null, xp: 0 },
  streak: { count: 0, last: null, best: 0 },
  done: {},                // lessonId -> { at, best (accuracy 0-100), times }
  hearts: { n: MAX_HEARTS, at: Date.now() },
  cards: {},               // spaced-repetition cards, keyed by English text (lowercase)
  noSpeakUntil: 0,
});

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") return Object.assign(fresh(), s);
  } catch (e) {}
  return fresh();
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

export function resetAll() {
  const keep = state.settings;
  Object.assign(state, fresh(), { settings: keep });
  save();
}

// ---- dates (device local time) ----
export function dateKey(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

// ---- XP, daily goal, streak ----
export function todayXp() {
  return state.day.date === dateKey() ? state.day.xp : 0;
}

/** Streak shown to the learner: broken if they missed yesterday. */
export function currentStreak() {
  const last = state.streak.last;
  return last === dateKey() || last === yesterdayKey() ? state.streak.count : 0;
}

/** Adds XP; returns true when this made today count for the streak for the first time. */
export function addXp(n) {
  const today = dateKey();
  if (state.day.date !== today) state.day = { date: today, xp: 0 };
  state.day.xp += n;
  state.xp += n;
  let streakUp = false;
  if (state.streak.last !== today) {
    state.streak.count = state.streak.last === yesterdayKey() ? state.streak.count + 1 : 1;
    state.streak.last = today;
    state.streak.best = Math.max(state.streak.best || 0, state.streak.count);
    streakUp = true;
  }
  save();
  return streakUp;
}

// ---- hearts ----
export function hearts() {
  const h = state.hearts;
  if (h.n < MAX_HEARTS) {
    const back = Math.floor((Date.now() - h.at) / HEART_MS);
    if (back > 0) {
      h.n = Math.min(MAX_HEARTS, h.n + back);
      h.at = h.n >= MAX_HEARTS ? Date.now() : h.at + back * HEART_MS;
      save();
    }
  }
  return h.n;
}
export function loseHeart() {
  hearts();
  if (state.hearts.n >= MAX_HEARTS) state.hearts.at = Date.now(); // regen clock starts at first loss
  state.hearts.n = Math.max(0, state.hearts.n - 1);
  save();
  return state.hearts.n;
}
export function gainHeart() {
  hearts();
  state.hearts.n = Math.min(MAX_HEARTS, state.hearts.n + 1);
  save();
}
/** Minutes until the next heart comes back (0 if full). */
export function nextHeartMinutes() {
  if (hearts() >= MAX_HEARTS) return 0;
  return Math.max(1, Math.ceil((state.hearts.at + HEART_MS - Date.now()) / 60000));
}

// ---- lessons ----
export function markDone(lessonId, accuracy) {
  const d = state.done[lessonId] || { times: 0, best: 0 };
  d.times += 1;
  d.best = Math.max(d.best, accuracy);
  d.at = Date.now();
  state.done[lessonId] = d;
  save();
}
