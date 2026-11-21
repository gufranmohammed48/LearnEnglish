// Loads the course and lessons (JSON in content/) and builds review / test sessions from them.
import { shuffle } from "./ui.js";
import { state } from "./store.js";
import { allCards, dueCards } from "./srs.js";

let course = null;
const lessons = {};

export async function getCourse() {
  if (!course) course = await (await fetch("content/course.json")).json();
  return course;
}

export async function getLesson(id) {
  if (!lessons[id]) {
    const res = await fetch("content/lessons/" + id + ".json");
    if (!res.ok) throw new Error("lesson " + id + " missing");
    lessons[id] = await res.json();
  }
  return lessons[id];
}

/** All lessons in order, each with its unit. */
export async function lessonList() {
  const c = await getCourse();
  const out = [];
  for (const u of c.units) if (!u.soon) for (const l of u.lessons) out.push({ ...l, unit: u });
  return out;
}

/** A lesson is open when every lesson before it is done. */
export async function isUnlocked(lessonId) {
  const list = await lessonList();
  for (const l of list) {
    if (l.id === lessonId) return true;
    if (!state.done[l.id]) return false;
  }
  return false;
}

export async function nextLessonId() {
  const list = await lessonList();
  const l = list.find((x) => !state.done[x.id]);
  return l ? l.id : null;
}

// ---- exercises made from words (for review) ----
function distractors(card, pool, n = 2) {
  const others = shuffle(pool.filter((c) => c.en.toLowerCase() !== card.en.toLowerCase()));
  return others.slice(0, n);
}

export function wordExercise(card, pool, kind) {
  const d = distractors(card, pool);
  const kinds = ["en-ur", "ur-en", "listen"];
  if (card.en.split(" ").length <= 3) kinds.push("type");
  kind = kind || kinds[Math.floor(Math.random() * kinds.length)];
  if (d.length < 2) kind = "type";
  const ans = { ur: card.ur, roman: card.roman };
  switch (kind) {
    case "en-ur":
      return { type: "pick", word: card.en, q: { en: card.en }, options: [ans, ...d.map((c) => ({ ur: c.ur, roman: c.roman }))], answer: 0 };
    case "ur-en":
      return { type: "pick", word: card.en, q: ans, options: [card.en, ...d.map((c) => c.en)], answer: 0 };
    case "listen":
      return { type: "listen", word: card.en, say: card.en, options: [card.en, ...d.map((c) => c.en)], answer: 0 };
    default:
      return { type: "type", word: card.en, say: card.en, answer: card.en, meaning: ans };
  }
}

/** Review session: due words first, then the weakest ones, up to `max`. */
export function reviewSession(max = 10) {
  const pool = allCards();
  let picks = dueCards();
  if (picks.length < max) {
    const rest = pool.filter((c) => !picks.includes(c)).sort((a, b) => a.due - b.due);
    picks = picks.concat(rest);
  }
  picks = picks.slice(0, max);
  return shuffle(picks).map((c) => wordExercise(c, pool));
}

// ---- tests (unit test, jump ahead) ----
const TESTABLE = new Set(["pick", "listen", "build", "type", "fix", "reply"]);

/** Random exercises taken from the given lessons. */
export async function testExercises(lessonIds, count = 12) {
  const all = [];
  for (const id of lessonIds) {
    const l = await getLesson(id);
    for (const ex of l.exercises) if (TESTABLE.has(ex.type)) all.push(ex);
  }
  return shuffle(all).slice(0, count);
}
