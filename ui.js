// Small DOM helpers shared by all screens.
import { STRINGS } from "./strings.js";
import { state } from "./store.js";

export const script = () => (state.settings && state.settings.script) || "ur";

/** Interface text in the learner's script. Arrays (e.g. "correct") give a random item. */
export function t(key) {
  const s = STRINGS[key];
  if (!s) return key;
  const v = s[script()];
  return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v;
}

/** Content text { ur, roman } in the learner's script. */
export function loc(o) {
  if (!o) return "";
  if (typeof o === "string") return o;
  return o[script()] || o.ur || o.roman || "";
}

/** Creates an element: h("div", { class: "x", onclick: fn }, child, "text", ...) */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

/** English text: always left-to-right with a Latin font, even inside Urdu. */
export const en = (text, cls = "") => h("span", { class: ("en " + cls).trim(), dir: "ltr", lang: "en" }, text);

/** Urdu/Roman Urdu text with the right direction and font. */
export const ur = (o, cls = "") => {
  const roman = script() === "roman";
  return h("span", { class: (roman ? "roman " : "ur ") + cls, dir: roman ? "ltr" : "rtl", lang: roman ? "ur-Latn" : "ur" }, loc(o));
};

/** Interface text element. */
export const tx = (key, cls = "") => ur(fixed(key), cls);
function fixed(key) {
  const s = STRINGS[key];
  if (!s) return { ur: key, roman: key };
  const pick = (v) => (Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v);
  return { ur: pick(s.ur), roman: pick(s.roman) };
}

export function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Simple yes/no dialog. Resolves true for the first (main) button. */
export function ask(questionKey, yesKey, noKey) {
  return new Promise((resolve) => {
    const close = (v) => { wrap.remove(); resolve(v); };
    const wrap = h("div", { class: "modal-wrap", onclick: (e) => e.target === wrap && close(false) },
      h("div", { class: "modal", role: "dialog", "aria-modal": "true" },
        h("p", {}, tx(questionKey)),
        h("button", { class: "btn primary", onclick: () => close(true) }, tx(yesKey)),
        h("button", { class: "btn ghost", onclick: () => close(false) }, tx(noKey))));
    document.body.append(wrap);
    wrap.querySelector("button").focus();
  });
}

export function toast(node, ms = 2200) {
  const el = h("div", { class: "toast" }, node);
  document.body.append(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, ms);
}

export const icon = {
  speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  slow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16c0-4 3.5-7 8-7s8 3 8 7H3z" fill="currentColor"/><circle cx="20" cy="12" r="2" fill="currentColor"/><path d="M5 16v2M17 16v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1.1 8.4 3.2 5 6.6 5c2 0 3.3 1 5.4 3 2.1-2 3.4-3 5.4-3 3.4 0 5.5 3.4 4.1 6.7C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>',
  fire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-4-1-6 1-9.5z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="currentColor"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  path: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="6" r="3" fill="currentColor"/><circle cx="17" cy="12" r="3" fill="currentColor"/><circle cx="7" cy="18" r="3" fill="currentColor"/></svg>',
  cards: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="15" rx="2" fill="currentColor" opacity=".55"/><rect x="8" y="3" width="13" height="15" rx="2" fill="currentColor"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21a8 8 0 0 1 16 0z" fill="currentColor"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" fill="currentColor"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H3v2a4 4 0 0 0 4 4M17 5h4v2a4 4 0 0 1-4 4M12 13v4M8 21h8l-1-4H9z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
};

export const svg = (name, cls = "ico") => h("span", { class: cls, html: icon[name] });
