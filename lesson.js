// The lesson player: runs a list of exercises (lesson, review, test) and reports the result.
import { h, t, tx, en, ur, loc, svg, shuffle, ask } from "./ui.js";
import { speak, stopSpeaking, sfx, canListen, listen } from "./speech.js";
import { state, save, hearts, loseHeart, MAX_HEARTS } from "./store.js";
import { grade } from "./srs.js";

// ---------- text matching ----------
const CONTRACTIONS = {
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is",
  "it's": "it is", "that's": "that is", "what's": "what is", "where's": "where is", "who's": "who is", "how's": "how is",
  "isn't": "is not", "aren't": "are not", "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "can't": "cannot", "won't": "will not", "i'll": "i will", "you'll": "you will", "let's": "let us", "i've": "i have",
  "there's": "there is", "wasn't": "was not", "weren't": "were not", "haven't": "have not",
};
const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

export function normalize(s) {
  return String(s).toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.,!?;:"“”()]/g, " ")
    .replace(/\s+/g, " ").trim()
    .split(" ")
    .map((w) => CONTRACTIONS[w] || (/^\d+$/.test(w) && NUMBERS[+w]) || w)
    .join(" ")
    .replace(/\bcan not\b/g, "cannot");
}

function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

const answersOf = (ex) => [ex.answer, ...(ex.accept || [])].map(normalize);

// ---------- shared bits ----------
function speakerButtons(text, big = false) {
  return h("div", { class: "speakers" },
    h("button", { class: "spk" + (big ? " big" : ""), type: "button", "aria-label": "play", onclick: () => speak(text) }, svg("speaker")),
    h("button", { class: "spk slow", type: "button", "aria-label": "slow", onclick: () => speak(text, true) }, svg("slow")));
}

const autoplay = () => !state.settings || state.settings.autoplay !== false;

function optionButtons(options, onPick, speakEnglish = true) {
  let chosen = null;
  const order = shuffle(options.map((o, i) => ({ o, i })));
  const wrap = h("div", { class: "options" });
  order.forEach(({ o, i }, n) => {
    const b = h("button", { class: "opt", type: "button" },
      h("span", { class: "num" }, String(n + 1)),
      typeof o === "string" ? en(o) : ur(o));
    b.addEventListener("click", () => {
      wrap.querySelectorAll(".opt").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      chosen = i;
      if (typeof o === "string" && speakEnglish) speak(o);
      onPick(i);
    });
    b.dataset.i = i;
    wrap.append(b);
  });
  wrap.pickByNumber = (n) => wrap.querySelectorAll(".opt")[n - 1]?.click();
  wrap.chosen = () => chosen;
  return wrap;
}

const optionText = (o) => (typeof o === "string" ? en(o) : ur(o));

// ---------- exercise types ----------
// Each returns { el, check() -> { ok, answer?, why?, almost? }, keys?(e) }.
// api.ready(bool) enables the Check button; api.submit(result) finishes the exercise on its own.

const R = {};

R.tip = (ex) => ({
  el: h("div", { class: "tip" },
    h("div", { class: "tip-head" }, svg("book"), tx("tip")),
    h("p", { class: "tip-text" }, ur(ex.text)),
    (ex.examples || []).map((e) =>
      h("div", { class: "ex-row" },
        h("button", { class: "spk small", type: "button", onclick: () => speak(e.en) }, svg("speaker")),
        h("div", {}, en(e.en, "ex-en"), h("div", { class: "ex-ur" }, ur(e)))))),
  check: () => ({ ok: true }),
});

R.pick = (ex, api) => {
  const gap = ex.q.en && ex.q.en.includes("___");
  const promptKey = ex.prompt === "gap" || gap ? "pGap" : ex.prompt === "reply" ? "pReply" : ex.q.en ? "pMeaning" : "pToEnglish";
  const q = ex.q.en
    ? h("div", { class: "q q-en" }, gap ? null : speakerButtons(ex.q.en), en(ex.q.en.replace("___", "_____"), "big-en"))
    : h("div", { class: "q" }, ur(ex.q, "big-ur"));
  if (ex.q.en && !gap && autoplay()) setTimeout(() => speak(ex.q.en), 250);
  const opts = optionButtons(ex.options, () => api.ready(true), !gap);
  return {
    el: h("div", {}, h("h2", { class: "prompt" }, tx(promptKey)), q, ex.hint ? h("p", { class: "hint" }, ur(ex.hint)) : null, opts),
    check() {
      const ok = opts.chosen() === ex.answer;
      const right = ex.options[ex.answer];
      const full = gap ? ex.q.en.replace("___", right) : typeof right === "string" ? right : null;
      if (full) speak(full);
      return { ok, answer: gap ? en(full) : optionText(right), why: ex.why };
    },
    keys: (k) => opts.pickByNumber(k),
  };
};

R.reply = (ex, api) => {
  if (autoplay()) setTimeout(() => speak(ex.say), 250);
  const opts = optionButtons(ex.options, () => api.ready(true));
  return {
    el: h("div", {}, h("h2", { class: "prompt" }, tx("pReply")),
      ex.scene ? h("p", { class: "scene" }, ur(ex.scene)) : null,
      h("div", { class: "bubble" }, h("button", { class: "spk small", type: "button", onclick: () => speak(ex.say) }, svg("speaker")), en(ex.say)),
      opts),
    check: () => ({ ok: opts.chosen() === ex.answer, answer: en(ex.options[ex.answer]), why: ex.why }),
    keys: (k) => opts.pickByNumber(k),
  };
};

R.listen = (ex, api) => {
  setTimeout(() => speak(ex.say), 300);
  const opts = optionButtons(ex.options, () => api.ready(true), false);
  return {
    el: h("div", {}, h("h2", { class: "prompt" }, tx("pListen")), h("div", { class: "q center" }, speakerButtons(ex.say, true)), opts),
    check: () => ({ ok: opts.chosen() === ex.answer, answer: en(ex.options[ex.answer]) }),
    keys: (k) => opts.pickByNumber(k),
  };
};

R.type = (ex, api) => {
  setTimeout(() => speak(ex.say), 300);
  const input = h("input", { class: "type-in en", dir: "ltr", lang: "en", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: t("typeHere") });
  input.addEventListener("input", () => api.ready(input.value.trim().length > 0));
  setTimeout(() => input.focus(), 350);
  return {
    el: h("div", {}, h("h2", { class: "prompt" }, tx("pType")), h("div", { class: "q center" }, speakerButtons(ex.say, true)),
      ex.meaning ? h("p", { class: "hint center" }, ur(ex.meaning)) : null, input),
    check() {
      input.disabled = true;
      const got = normalize(input.value);
      const best = Math.min(...answersOf(ex).map((a) => lev(got, a)));
      const allow = ex.answer.length > 12 ? 2 : ex.answer.length > 5 ? 1 : 0;
      return { ok: best <= allow, almost: best > 0 && best <= allow, answer: en(ex.answer) };
    },
  };
};

R.build = (ex, api) => {
  const words = ex.answer.replace(/[.,!?]/g, "").split(/\s+/);
  const tiles = shuffle([...words, ...(ex.extra || [])]);
  const line = h("div", { class: "build-line", dir: "ltr" });
  const bank = h("div", { class: "bank", dir: "ltr" });
  const update = () => api.ready(line.children.length > 0);
  tiles.forEach((w) => {
    const slot = h("span", { class: "slot" });
    const tile = h("button", { class: "tile en", type: "button" }, w);
    tile.addEventListener("click", () => {
      if (tile.parentNode === slot) { line.append(tile); speak(w); }
      else slot.append(tile);
      update();
    });
    slot.append(tile);
    bank.append(slot);
  });
  return {
    el: h("div", {}, h("h2", { class: "prompt" }, tx("pBuild")), h("div", { class: "q" }, ur(ex.q, "big-ur")), line, bank),
    check() {
      const said = Array.from(line.children).map((b) => b.textContent).join(" ");
      const ok = answersOf(ex).includes(normalize(said));
      speak(ex.answer);
      bank.querySelectorAll("button").forEach((b) => (b.disabled = true));
      line.querySelectorAll("button").forEach((b) => (b.disabled = true));
      return { ok, answer: en(ex.answer), why: ex.why };
    },
  };
};

R.fix = (ex, api) => {
  let chosen = null;
  const words = ex.sentence.split(" ");
  const row = h("div", { class: "fix-row", dir: "ltr" });
  words.forEach((w, i) => {
    const b = h("button", { class: "fixw en", type: "button" }, w);
    b.addEventListener("click", () => {
      row.querySelectorAll(".fixw").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      chosen = i;
      api.ready(true);
    });
    row.append(b);
  });
  return {
    el: h("div", {}, h("h2", { class: "prompt" }, tx("pFix")),
      h("div", { class: "q center" }, h("button", { class: "spk small", type: "button", onclick: () => speak(ex.sentence) }, svg("speaker"))),
      row),
    check() {
      speak(ex.fixed);
      return { ok: ex.wrong.includes(chosen), answer: en(ex.fixed), why: ex.why };
    },
  };
};

R.match = (ex, api) => {
  const pairs = ex.pairs.map((p, i) => ({ ...p, i }));
  let selL = null, selR = null, left = pairs.length, mistakes = 0;
  const colL = h("div", { class: "col" });
  const colR = h("div", { class: "col" });
  const tryPair = () => {
    if (!selL || !selR) return;
    const a = selL, b = selR;
    selL = selR = null;
    if (a.dataset.i === b.dataset.i) {
      [a, b].forEach((x) => { x.classList.remove("sel"); x.classList.add("matched"); x.disabled = true; });
      sfx.right && state.settings?.sfx !== false && sfx.right();
      if (--left === 0) setTimeout(() => api.submit({ ok: true, soft: true, mistakes }), 350);
    } else {
      mistakes++;
      [a, b].forEach((x) => { x.classList.remove("sel"); x.classList.add("bad"); setTimeout(() => x.classList.remove("bad"), 500); });
    }
  };
  shuffle(pairs).forEach((p) => {
    const b = h("button", { class: "mbtn", type: "button", "data-i": p.i }, en(p.en));
    b.addEventListener("click", () => { colL.querySelectorAll(".sel").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); selL = b; speak(p.en); tryPair(); });
    colL.append(b);
  });
  shuffle(pairs).forEach((p) => {
    const b = h("button", { class: "mbtn", type: "button", "data-i": p.i }, ur(p));
    b.addEventListener("click", () => { colR.querySelectorAll(".sel").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); selR = b; tryPair(); });
    colR.append(b);
  });
  return {
    el: h("div", {}, h("h2", { class: "prompt" }, tx("pMatch")), h("div", { class: "match", dir: "ltr" }, colL, colR)),
    check: () => ({ ok: true }),
    noCheck: true,
  };
};

R.speak = (ex, api) => {
  const target = normalize(ex.say).split(" ");
  let best = 0, tries = 0;
  const said = h("div", { class: "said", dir: "ltr" });
  const words = h("div", { class: "speak-words", dir: "ltr" }, ex.say.split(" ").map((w) => h("span", { class: "sw en" }, w + " ")));
  const status = h("p", { class: "hint center" });
  const mic = h("button", { class: "mic", type: "button", "aria-label": "microphone" }, svg("mic"));
  if (autoplay()) setTimeout(() => speak(ex.say), 300);
  mic.addEventListener("click", async () => {
    if (mic.classList.contains("on")) { listen.stop && listen.stop(); return; }
    mic.classList.add("on");
    status.replaceChildren(tx("listening"));
    try {
      const alts = await listen();
      tries++;
      let top = { score: 0, text: alts[0] || "", hit: [] };
      for (const a of alts) {
        const got = normalize(a).split(" ");
        const hit = target.map((w) => got.includes(w));
        const score = hit.filter(Boolean).length / target.length;
        if (score > top.score) top = { score, text: a, hit };
      }
      best = Math.max(best, top.score);
      words.querySelectorAll(".sw").forEach((s, i) => { s.classList.toggle("good", !!top.hit[i]); s.classList.toggle("miss", !top.hit[i]); });
      said.replaceChildren(top.text ? h("span", {}, tx("youSaid"), " ", en(top.text)) : "");
      status.replaceChildren(best >= 0.8 ? "" : tx("tryAgain"));
      api.ready(true);
      if (best >= 0.8) setTimeout(() => api.submit({ ok: true, soft: true }), 600);
    } catch (e) {
      status.replaceChildren(tx("noMic"));
      api.ready(true);
    } finally {
      mic.classList.remove("on");
    }
  });
  return {
    el: h("div", {}, h("h2", { class: "prompt" }, tx("pSpeak")),
      h("div", { class: "q" }, speakerButtons(ex.say), words, ex.meaning ? h("p", { class: "hint" }, ur(ex.meaning)) : null),
      h("div", { class: "center" }, mic), status, said,
      h("button", { class: "link", type: "button", onclick: () => api.skipSpeaking() }, tx("cantSpeak"))),
    check: () => ({ ok: best >= 0.8, soft: true, answer: en(ex.say) }),
  };
};

// ---------- the player ----------
const DEBUG = /[?&]debug/.test(location.search);
/**
 * session: { kind: "lesson"|"review"|"test"|"practice", title, exercises, hearts: bool }
 * Resolves with { finished, firstTry, total, mistakes } (finished=false if the learner quit).
 */
export function play(session, root) {
  return new Promise((resolve) => {
    const speakOff = !canListen() || state.settings?.speak === false || state.noSpeakUntil > Date.now();
    let queue = session.exercises.filter((e) => !(e.type === "speak" && speakOff));
    const graded = queue.filter((e) => e.type !== "tip");
    let total = graded.length;
    const firstTry = new Set();
    const seen = new Set();
    let done = 0, mistakes = 0, current = null, result = null, renderer = null;
    const isTest = session.kind === "test";

    const bar = h("i");
    const heartsEl = h("span", { class: "hearts" });
    const drawHearts = () => {
      if (!session.hearts) return heartsEl.replaceChildren();
      heartsEl.replaceChildren(svg("heart"), h("b", {}, String(hearts())));
    };
    const body = h("section", { class: "pbody" });
    const fb = h("div", { class: "fb" });
    const btn = h("button", { class: "btn primary big", type: "button" });
    const foot = h("footer", { class: "pfoot" }, fb, btn);
    const closeBtn = h("button", { class: "icon-btn", type: "button", "aria-label": "close" }, svg("close"));
    const top = h("header", { class: "ptop" }, closeBtn, h("div", { class: "bar" }, bar), heartsEl);
    const view = h("div", { class: "player" }, top, body, foot);
    root.replaceChildren(view);
    drawHearts();

    const finish = (finished) => {
      stopSpeaking();
      document.removeEventListener("keydown", onKey);
      resolve({ finished, firstTry: firstTry.size, total, mistakes });
    };

    closeBtn.addEventListener("click", async () => {
      if (await ask("quitQ", "quit", "keepGoing")) finish(false);
    });

    const progress = () => (bar.style.width = (total ? Math.round((100 * done) / total) : 100) + "%");

    const api = {
      ready(v) { if (!result) btn.disabled = !v; },
      submit(r) { if (!result) showResult(r); },
      skipSpeaking() {
        state.noSpeakUntil = Date.now() + 15 * 60 * 1000;
        save();
        const before = queue.length;
        queue = queue.filter((e) => e.type !== "speak");
        total -= 1 + (before - queue.length); // skipped exercises don't count for or against
        progress();
        next();
      },
    };

    function next() {
      stopSpeaking();
      result = null;
      body.classList.remove("answered");
      fb.replaceChildren();
      foot.className = "pfoot";
      if (session.hearts && hearts() <= 0) return outOfHearts();
      if (!queue.length) return finish(true);
      current = queue.shift();
      renderer = (R[current.type] || R.tip)(current, api);
      if (DEBUG) document.body.dataset.ex = JSON.stringify(current); // lets test scripts drive lessons
      body.replaceChildren(renderer.el);
      body.scrollTop = 0;
      if (current.type === "tip") {
        btn.disabled = false;
        btn.replaceChildren(tx("continue"));
        btn.onclick = () => next();
      } else {
        btn.disabled = true;
        btn.replaceChildren(tx("check"));
        btn.onclick = () => showResult(renderer.check());
        btn.hidden = !!renderer.noCheck;
      }
    }

    function showResult(r) {
      result = r;
      body.classList.add("answered");
      btn.hidden = false;
      const firstTime = !seen.has(current);
      seen.add(current);
      if (current.word && firstTime) grade(current.word, r.ok);
      const sound = state.settings?.sfx !== false;
      if (r.ok) {
        if (firstTime && !r.mistakes) firstTry.add(current);
        done++;
        if (sound) sfx.right();
        foot.className = "pfoot good";
        fb.replaceChildren(h("div", {},
          h("div", { class: "fb-title" }, svg("check"), r.almost ? tx("almost") : tx("correct")),
          r.almost && r.answer ? h("div", { class: "fb-ans" }, r.answer) : null));
      } else {
        mistakes++;
        if (sound) sfx.wrong();
        foot.className = "pfoot bad";
        fb.replaceChildren(h("div", {},
          h("div", { class: "fb-title" }, tx("wrongTitle")),
          r.answer ? h("div", { class: "fb-ans" }, r.answer) : null,
          r.why ? h("p", { class: "fb-why" }, ur(r.why)) : null));
        if (r.soft || isTest) {
          done++; // speaking misses and test questions are not repeated
        } else {
          queue.push(current); // try it again at the end, like Duolingo
          if (session.hearts) { loseHeart(); drawHearts(); }
        }
      }
      progress();
      btn.disabled = false;
      btn.replaceChildren(tx("continue"));
      btn.onclick = () => next();
      btn.focus();
    }

    function outOfHearts() {
      body.replaceChildren(h("div", { class: "empty-state" },
        h("div", { class: "big-heart" }, svg("heart")),
        h("h2", {}, tx("outOfHearts")),
        h("p", {}, tx("outOfHeartsHint"))));
      btn.hidden = false;
      btn.disabled = false;
      btn.replaceChildren(tx("refillByReview"));
      btn.onclick = () => { stopSpeaking(); document.removeEventListener("keydown", onKey); resolve({ finished: false, needHearts: true }); };
    }

    function onKey(e) {
      if (document.querySelector(".modal-wrap")) return;
      const typing = e.target && e.target.tagName === "INPUT";
      if (e.key === "Enter" && !btn.disabled && !btn.hidden) { e.preventDefault(); btn.click(); }
      else if (!typing && !result && /^[1-9]$/.test(e.key) && renderer && renderer.keys) renderer.keys(+e.key);
    }
    document.addEventListener("keydown", onKey);

    progress();
    next();
  });
}

export { MAX_HEARTS };
