// Angrezi: screens and navigation (hash routes). Business of a lesson lives in lesson.js.
import { h, t, tx, en, ur, loc, svg, ask, toast, script } from "./ui.js";
import { state, save, resetAll, dateKey, todayXp, currentStreak, addXp, hearts, gainHeart, nextHeartMinutes, markDone, MAX_HEARTS } from "./store.js";
import { addWords, allCards, dueCards, strength } from "./srs.js";
import { getCourse, getLesson, lessonList, isUnlocked, nextLessonId, reviewSession, testExercises, getStories, storySession } from "./content.js";
import { play } from "./lesson.js";
import { speak, sfx, hasEnglishVoice, ttsAvailable, canListen } from "./speech.js";
import { STRINGS } from "./strings.js";
import { isNative, setReminder } from "./native.js";

const app = document.getElementById("app");
const VERSION = "0.2.0";

// ---------- setup ----------
function applyScript() {
  const roman = script() === "roman";
  document.documentElement.lang = roman ? "ur-Latn" : "ur";
  document.documentElement.dir = roman ? "ltr" : "rtl";
  document.body.classList.toggle("script-roman", roman);
  document.body.classList.toggle("script-ur", !roman);
}

const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

window.addEventListener("hashchange", route);

let installEvent = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; });

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// ---------- router ----------
async function route() {
  window.scrollTo(0, 0);
  applyScript();
  const [, page, arg] = (location.hash || "#/").split("/");
  if (!state.settings) return onboarding();
  try {
    switch (page) {
      case "lesson": return await runLesson(arg, false);
      case "practice": return await runLesson(arg, true);
      case "review": return await runReview();
      case "test": return await runTest(arg);
      case "jump": return await runJump(arg);
      case "stories": return await storiesPage();
      case "story": return await runStory(arg);
      case "words": return wordsPage();
      case "me": return mePage();
      default: return await pathPage();
    }
  } catch (err) {
    console.error(err);
    app.replaceChildren(h("div", { class: "empty-state" }, h("p", {}, "Error: " + err.message), h("a", { class: "btn primary", href: "#/" }, tx("back"))));
  }
}

// ---------- shared chrome ----------
function topBar() {
  const hs = hearts();
  return h("header", { class: "topbar" },
    h("div", { class: "brand" }, h("span", { class: "logo" }, "A"), tx("appName", "brand-name")),
    h("div", { class: "stats" },
      h("span", { class: "stat fire" + (state.streak.last === dateKey() ? " lit" : ""), title: t("days") }, svg("fire"), h("b", {}, String(currentStreak()))),
      h("span", { class: "stat gem" }, svg("star"), h("b", {}, String(state.xp))),
      h("span", { class: "stat heart", title: hs < MAX_HEARTS ? nextHeartMinutes() + " min" : "" }, svg("heart"), h("b", {}, String(hs)))));
}

function bottomNav(active) {
  const item = (hash, ico, key, id) =>
    h("a", { class: "nav-item" + (active === id ? " on" : ""), href: hash }, svg(ico), tx(key));
  return h("nav", { class: "bottomnav" },
    item("#/", "path", "home", "learn"),
    item("#/stories", "book", "stories", "stories"),
    item("#/words", "cards", "wordsTab", "words"),
    item("#/me", "user", "profile", "me"));
}

function page(active, ...content) {
  app.replaceChildren(h("div", { class: "page" }, topBar(), h("main", { class: "content" }, content), bottomNav(active)));
}

// ---------- onboarding ----------
function onboarding() {
  const draft = { script: null, goal: null, dailyXp: 20, sfx: true, autoplay: true, speak: true };
  const both = (o) => h("span", { class: "both" }, h("span", { class: "ur", dir: "rtl", lang: "ur" }, o.ur), h("span", { class: "roman", dir: "ltr" }, o.roman));
  const S = (k) => ({ ur: STR(k, "ur"), roman: STR(k, "roman") });
  const step = (title, choices, onPick) => {
    app.replaceChildren(h("div", { class: "onboard" },
      h("div", { class: "onboard-logo" }, h("span", { class: "logo big" }, "A"), en("Angrezi", "brand-en")),
      h("h1", {}, draft.script ? tx(title) : both(S(title))),
      h("div", { class: "choices" }, choices.map((c) =>
        h("button", { class: "choice", type: "button", onclick: () => onPick(c.value) },
          c.emoji ? h("span", { class: "emoji", "aria-hidden": "true" }, c.emoji) : null,
          h("span", { class: "choice-text" }, c.node),
          c.sub ? h("span", { class: "choice-sub" }, c.sub) : null)))));
  };

  // 1. script (shown in both scripts, since we don't know yet)
  step("chooseScript", [
    { value: "ur", node: h("span", { class: "ur", dir: "rtl", lang: "ur" }, "اردو"), sub: h("span", { class: "ur", dir: "rtl" }, "سلام، آپ کیسے ہیں؟") },
    { value: "roman", node: h("span", { class: "roman", dir: "ltr" }, "Roman Urdu"), sub: h("span", { class: "roman", dir: "ltr" }, "Salaam, aap kaise hain?") },
  ], (v) => {
    draft.script = v;
    goal();
  });

  // Until onboarding ends, settings are a draft; apply it while drawing so text uses the chosen script.
  function withDraft(fn) { state.settings = { ...draft }; applyScript(); fn(); state.settings = null; }

  // 2. why
  function goal() {
    withDraft(() => step("whyLearn", [
      { value: "abroad", emoji: "🏙️", node: tx("goalAbroad") },
      { value: "job", emoji: "💼", node: tx("goalJob") },
      { value: "study", emoji: "🎓", node: tx("goalStudy") },
      { value: "travel", emoji: "✈️", node: tx("goalTravel") },
      { value: "fun", emoji: "🌱", node: tx("goalFun") },
    ], (v) => { draft.goal = v; pace(); }));
  }

  // 3. daily goal
  function pace() {
    withDraft(() => step("dailyGoalQ", [
      { value: 10, node: tx("pace5"), sub: h("span", {}, en("5"), " ", tx("minutes")) },
      { value: 20, node: tx("pace10"), sub: h("span", {}, en("10"), " ", tx("minutes")) },
      { value: 30, node: tx("pace15"), sub: h("span", {}, en("15"), " ", tx("minutes")) },
      { value: 50, node: tx("pace20"), sub: h("span", {}, en("20"), " ", tx("minutes")) },
    ], (v) => { draft.dailyXp = v; level(); }));
  }

  // 4. level
  function level() {
    withDraft(() => step("levelQ", [
      { value: "new", emoji: "🌱", node: tx("levelNew") },
      { value: "some", emoji: "📝", node: tx("levelSome") },
    ], async (v) => {
      state.settings = { ...draft };
      save();
      if (v === "some") {
        const c = await getCourse();
        const units = c.units.filter((u) => !u.soon);
        go("#/jump/" + (units[Math.min(2, units.length - 1)] || units[0]).id);
      } else {
        toast(tx("welcome"));
        go("#/lesson/" + (await nextLessonId()));
      }
    }));
  }
}

const STR = (k, s) => { const v = STRINGS[k][s]; return Array.isArray(v) ? v[0] : v; };

// ---------- path (home) ----------
async function pathPage() {
  const course = await getCourse();
  const nextId = await nextLessonId();
  const goalXp = state.settings.dailyXp || 20;
  const got = todayXp();
  const due = dueCards().length;
  const cards = allCards().length;

  const goalCard = h("div", { class: "card goal-card" },
    h("div", { class: "goal-row" }, h("span", {}, got >= goalXp ? tx("goalDone") : tx("todayGoal")), en(Math.min(got, goalXp) + " / " + goalXp + " XP", "muted")),
    h("div", { class: "meter" }, h("i", { style: "width:" + Math.min(100, Math.round((100 * got) / goalXp)) + "%" })));

  const reviewCard = cards
    ? h("a", { class: "card review-card" + (due ? " due" : ""), href: "#/review" },
        svg("cards", "ico big"),
        h("div", {}, h("b", {}, tx("review")), h("div", { class: "muted" }, due ? h("span", {}, tx("reviewDue"), ": ", en(String(due))) : tx("reviewNone"))),
        due ? h("span", { class: "badge" }, String(due)) : null)
    : null;

  const unitsEl = [];
  let unitNo = 0;
  for (const u of course.units) {
    unitNo++;
    const firstOpen = !u.soon && (await isUnlocked(u.lessons[0].id));
    const allDone = !u.soon && u.lessons.every((l) => state.done[l.id]);
    const banner = h("div", { class: "unit-banner c-" + (u.color || "green") + (u.soon ? " soon" : "") },
      h("div", {},
        h("div", { class: "unit-no" }, tx("unit"), " ", en(String(unitNo)), u.level ? h("span", { class: "lvl" }, en(u.level)) : null),
        h("h2", { class: "unit-title" }, ur(u.title)),
        en(u.title.en, "unit-en")),
      u.soon ? h("span", { class: "pill" }, tx("soon"))
        : allDone ? h("a", { class: "pill light", href: "#/test/" + u.id }, svg("trophy"), tx("unitTest"))
        : !firstOpen ? h("a", { class: "pill light", href: "#/jump/" + u.id, title: t("jumpHint") }, tx("jumpHere"))
        : null);
    const nodes = h("div", { class: "nodes" });
    if (!u.soon) {
      let i = 0;
      for (const l of u.lessons) {
        const isDone = !!state.done[l.id];
        const isNext = l.id === nextId;
        const open = isDone || isNext;
        const offset = [0, 1, 2, 1, 0, -1, -2, -1][i % 8];
        const node = h(open ? "a" : "button", {
          class: "node" + (isDone ? " done" : "") + (isNext ? " next" : "") + (open ? "" : " locked"),
          href: open ? (isDone ? "#/practice/" + l.id : "#/lesson/" + l.id) : null,
          type: open ? null : "button",
          style: "--x:" + offset,
          onclick: open ? null : () => toast(tx("locked")),
        },
          isNext ? h("span", { class: "start-tip" }, tx("start")) : null,
          h("span", { class: "node-btn" }, svg(isDone ? "check" : open ? "star" : "lock")),
          h("span", { class: "node-label" }, ur(l.title)));
        nodes.append(node);
        i++;
      }
    }
    unitsEl.push(h("section", { class: "unit" }, banner, nodes));
  }

  page("learn", goalCard, reviewCard, unitsEl);
  const nextEl = app.querySelector(".node.next");
  if (nextEl && got === 0 && Object.keys(state.done).length) nextEl.scrollIntoView({ block: "center" });
}

// ---------- sessions ----------
async function runLesson(id, isPractice) {
  if (!id) return go("#/");
  if (!isPractice && !(await isUnlocked(id))) return go("#/");
  const lesson = await getLesson(id);
  // Hearts only once the learner has the basics (3 lessons), and never when practising an old lesson.
  const useHearts = !isPractice && Object.keys(state.done).filter((k) => !k.startsWith("story:")).length >= 3;
  const r = await play({ kind: isPractice ? "practice" : "lesson", exercises: lesson.exercises, hearts: useHearts }, app);
  if (r.needHearts) return allCards().length ? go("#/review") : go("#/");
  if (!r.finished) return go("#/");
  const acc = r.total ? Math.round((100 * r.firstTry) / r.total) : 100;
  const perfect = r.mistakes === 0;
  const xp = isPractice ? 5 : 10 + (perfect ? 5 : 0);
  const hadFull = hearts() >= MAX_HEARTS;
  if (isPractice) gainHeart(); // practising old lessons earns a heart back
  const streakUp = addXp(xp);
  markDone(id, acc);
  addWords(lesson.words, id);
  resultScreen({ title: "lessonDone", xp, acc, perfect, streakUp, heart: isPractice && !hadFull });
}

async function runReview() {
  if (!allCards().length) return go("#/");
  const r = await play({ kind: "review", exercises: reviewSession(10), hearts: false }, app);
  if (!r.finished) return go("#/");
  const acc = r.total ? Math.round((100 * r.firstTry) / r.total) : 100;
  const hadFull = hearts() >= MAX_HEARTS;
  gainHeart();
  const streakUp = addXp(5 + (r.mistakes === 0 ? 3 : 0));
  resultScreen({ title: "reviewDone", xp: 5 + (r.mistakes === 0 ? 3 : 0), acc, perfect: r.mistakes === 0, streakUp, heart: !hadFull });
}

async function unitLessons(unitId) {
  const c = await getCourse();
  const idx = c.units.findIndex((u) => u.id === unitId);
  return { c, idx, unit: c.units[idx] };
}

async function runTest(unitId) {
  const { unit } = await unitLessons(unitId);
  if (!unit || unit.soon) return go("#/");
  const ex = await testExercises(unit.lessons.map((l) => l.id), 12);
  const r = await play({ kind: "test", exercises: ex, hearts: false }, app);
  if (!r.finished) return go("#/");
  const acc = Math.round((100 * r.firstTry) / r.total);
  const pass = acc >= 80;
  const xp = pass ? 15 : 3;
  const streakUp = addXp(xp);
  resultScreen({ title: pass ? "testPassed" : "testFailed", xp, acc, perfect: r.mistakes === 0, streakUp });
}

/** Jump-ahead test: pass to unlock everything before this unit. */
async function runJump(unitId) {
  const { c, idx, unit } = await unitLessons(unitId);
  if (!unit || idx <= 0) return go("#/");
  const before = c.units.slice(0, idx).filter((u) => !u.soon).flatMap((u) => u.lessons.map((l) => l.id));
  const ex = await testExercises(before, 12);
  const r = await play({ kind: "test", exercises: ex, hearts: false }, app);
  if (!r.finished) return go("#/");
  const acc = Math.round((100 * r.firstTry) / r.total);
  const pass = acc >= 80;
  if (pass) {
    for (const id of before) {
      if (!state.done[id]) markDone(id, acc);
      addWords((await getLesson(id)).words, id);
    }
  }
  const xp = pass ? 15 : 3;
  const streakUp = addXp(xp);
  resultScreen({ title: pass ? "testPassed" : "testFailed", xp, acc, perfect: r.mistakes === 0, streakUp });
}

function resultScreen({ title, xp, acc, perfect, streakUp, heart, back = "#/" }) {
  if (state.settings.sfx !== false) sfx.done();
  app.replaceChildren(h("div", { class: "result" },
    h("div", { class: "confetti", "aria-hidden": "true" }, Array.from({ length: 18 }, (_, i) => h("i", { style: `--i:${i}` }))),
    h("div", { class: "result-badge" }, svg("trophy")),
    h("h1", {}, tx(title)),
    perfect ? h("p", { class: "perfect" }, tx("perfect")) : null,
    h("div", { class: "tiles" },
      h("div", { class: "tile-stat xp" }, h("small", {}, tx("xpEarned")), en("+" + xp)),
      h("div", { class: "tile-stat acc" }, h("small", {}, tx("accuracy")), en(acc + "%"))),
    streakUp ? h("p", { class: "streak-up" }, svg("fire"), en(String(currentStreak()) + " "), tx("streakUp")) : null,
    heart ? h("p", { class: "heart-up" }, svg("heart"), tx("heartBack")) : null,
    h("button", { class: "btn primary big", type: "button", onclick: () => go(back) }, tx("continue"))));
  app.querySelector(".btn").focus();
}

// ---------- stories ----------
async function storiesPage() {
  const stories = await getStories();
  const list = await lessonList();
  const titleOf = (id) => (list.find((l) => l.id === id) || {}).title;
  page("stories",
    h("div", { class: "page-head" }, h("h1", {}, tx("stories"))),
    h("p", { class: "muted" }, tx("storiesIntro")),
    h("div", { class: "story-list" }, stories.map((st) => {
      const open = !st.after || state.done[st.after];
      const done = state.done["story:" + st.id];
      return h(open ? "a" : "div", { class: "card story-card" + (open ? "" : " locked") + (done ? " done" : ""), href: open ? "#/story/" + st.id : null },
        h("span", { class: "story-emoji", "aria-hidden": "true" }, st.emoji || "📖"),
        h("div", { class: "story-info" },
          h("b", {}, ur(st.title)),
          en(st.title.en, "muted small"),
          open ? null : h("div", { class: "small muted" }, tx("storyAfter"), " ", ur(titleOf(st.after)))),
        h("span", { class: "story-state" }, svg(done ? "check" : open ? "star" : "lock")));
    })));
}

async function runStory(id) {
  const stories = await getStories();
  const meta = stories.find((s) => s.id === id);
  if (!meta || (meta.after && !state.done[meta.after])) return go("#/stories");
  const { exercises } = await storySession(id);
  const r = await play({ kind: "story", exercises, hearts: false }, app);
  if (!r.finished) return go("#/stories");
  const acc = r.total ? Math.round((100 * r.firstTry) / r.total) : 100;
  const first = !state.done["story:" + id];
  const xp = first ? 10 : 3;
  const streakUp = addXp(xp);
  markDone("story:" + id, acc);
  resultScreen({ title: "storyDone", xp, acc, perfect: r.mistakes === 0, streakUp, back: "#/stories" });
}

// ---------- words ----------
function wordsPage() {
  const cards = allCards().sort((a, b) => a.en.localeCompare(b.en));
  const due = dueCards().length;
  page("words",
    h("div", { class: "page-head" }, h("h1", {}, tx("wordsLearned")), en(String(cards.length), "count")),
    cards.length ? h("a", { class: "btn primary", href: "#/review" }, tx("review"), due ? en(" (" + due + ")") : null) : null,
    cards.length
      ? h("ul", { class: "word-list" }, cards.map((c) => {
          const s = strength(c);
          return h("li", {},
            h("button", { class: "spk small", type: "button", onclick: () => speak(c.en), "aria-label": "play" }, svg("speaker")),
            h("div", { class: "w" }, en(c.en, "w-en"), h("div", { class: "w-ur" }, ur(c))),
            h("span", { class: "bars s" + s, title: t("strength") }, h("i"), h("i"), h("i"), h("i")));
        }))
      : h("p", { class: "empty" }, tx("wordsEmpty")));
}

// ---------- me / settings ----------
function mePage() {
  const s = state.settings;
  const set = (k, v) => { s[k] = v; save(); mePage(); };
  const seg = (k, opts) => h("div", { class: "seg" }, opts.map(([v, label]) =>
    h("button", { class: s[k] === v ? "on" : "", type: "button", onclick: () => set(k, v) }, label)));
  const toggle = (k, label) => h("label", { class: "row" }, h("span", {}, tx(label)),
    h("input", { type: "checkbox", class: "switch", checked: s[k] !== false, onchange: (e) => set(k, e.target.checked) }));

  const lessonsDone = Object.keys(state.done).filter((k) => !k.startsWith("story:")).length;
  page("me",
    h("div", { class: "page-head" }, h("h1", {}, tx("stats"))),
    h("div", { class: "stat-grid" },
      statTile("fire", String(currentStreak()), "days"),
      statTile("trophy", String(state.streak.best || 0), "bestStreak"),
      statTile("star", String(state.xp), "totalXp"),
      statTile("book", String(lessonsDone), "lessonsDone"),
      statTile("cards", String(allCards().length), "words")),
    h("h2", { class: "section-title" }, svg("gear"), tx("settings")),
    h("div", { class: "card settings" },
      h("div", { class: "row col" }, h("span", {}, tx("script")),
        h("div", { class: "seg" },
          h("button", { class: s.script === "ur" ? "on" : "", type: "button", onclick: () => { s.script = "ur"; save(); route(); } }, h("span", { class: "ur", dir: "rtl" }, "اردو")),
          h("button", { class: s.script === "roman" ? "on" : "", type: "button", onclick: () => { s.script = "roman"; save(); route(); } }, h("span", { class: "roman" }, "Roman Urdu")))),
      h("div", { class: "row col" }, h("span", {}, tx("dailyGoal")),
        seg("dailyXp", [[10, en("10 XP")], [20, en("20 XP")], [30, en("30 XP")], [50, en("50 XP")]])),
      isNative() ? h("label", { class: "row" }, h("span", {}, tx("reminder")),
        h("input", { type: "time", class: "time-in", value: s.reminder || "", onchange: async (e) => {
          const v = e.target.value || null;
          const ok = await setReminder(v, t("reminderTitle"), t("reminderBody"));
          if (!ok && v) toast(tx("reminderOff"));
          s.reminder = ok ? v : null;
          save();
        } })) : null,
      toggle("sfx", "soundEffects"),
      toggle("autoplay", "autoplay"),
      canListen() ? toggle("speak", "speakEx") : null,
      h("div", { class: "row" },
        h("button", { class: "btn ghost", type: "button", onclick: () => speak("Hello! Welcome to Angrezi. Let's learn English together.") }, svg("speaker"), tx("voiceTest")),
        ttsAvailable() && hasEnglishVoice() ? null : h("small", { class: "warn" }, tx("noVoice"))),
      installEvent ? h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", onclick: async () => { installEvent.prompt(); installEvent = null; } }, tx("installApp"))) : null,
      h("div", { class: "row" }, h("button", { class: "btn danger", type: "button", onclick: async () => { if (await ask("resetQ", "reset", "cancel")) { resetAll(); go("#/"); } } }, tx("resetAll")))),
    h("p", { class: "about" }, tx("about"), " ", en("v" + VERSION)));
}

function statTile(ico, value, label) {
  return h("div", { class: "stat-tile" }, svg(ico), en(value, "v"), h("small", {}, tx(label)));
}

route();
