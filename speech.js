// English voice (text-to-speech), speech recognition and the small correct/wrong sounds.
// Uses what the phone/browser already has; no download, no account, no cost.

let voice = null;
let voices = [];
const FEMALE = /female|zira|samantha|jenny|aria|susan|hazel|libby|sonia|karen|moira|tessa|victoria|serena/i;
const MALE = /male|david|mark|guy|george|daniel|ryan|alex|fred|james|thomas/i;

export const ttsAvailable = () => typeof window !== "undefined" && "speechSynthesis" in window;

function pickVoice() {
  const vs = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  const score = (v) =>
    (/en[-_]US/i.test(v.lang) ? 4 : /en[-_]GB/i.test(v.lang) ? 3 : 0) +
    (/natural|neural|google|samantha|aria|jenny/i.test(v.name) ? 2 : 0) +
    (v.localService ? 1 : 0);
  voices = vs.sort((a, b) => score(b) - score(a));
  voice = voices[0] || null;
}

/** A voice for a story character: "f" or "m" if the device has one, else the default voice. */
function voiceFor(gender) {
  if (!gender) return voice;
  const re = gender === "f" ? FEMALE : MALE;
  const v = voices.find((x) => re.test(x.name) && !(gender === "m" && /female/i.test(x.name)));
  return v || voice;
}

if (ttsAvailable()) {
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

export const hasEnglishVoice = () => !!voice;

/** Speaks English. Returns a promise that resolves when done (or right away if no voice). */
export function speak(text, slow = false, gender = null) {
  return new Promise((resolve) => {
    if (!ttsAvailable() || !text) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(gender);
    if (v) u.voice = v;
    u.lang = v ? v.lang : "en-US";
    u.rate = slow ? 0.55 : 0.9;
    // same voice for everyone? change the pitch a little so characters sound different
    if (gender && v === voice) u.pitch = gender === "f" ? 1.2 : 0.85;
    u.onend = u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (ttsAvailable()) speechSynthesis.cancel();
}

// ---- speech recognition ----
const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = () => !!Recognition;

/**
 * Listens once for English. Resolves with the list of things it may have heard (best first),
 * or [] if nothing was heard. Rejects with an error name ("not-allowed", ...) on failure.
 */
export function listen() {
  return new Promise((resolve, reject) => {
    if (!Recognition) return reject(new Error("unsupported"));
    stopSpeaking();
    const r = new Recognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 5;
    let results = [];
    r.onresult = (e) => {
      results = Array.from(e.results[0]).map((a) => a.transcript);
    };
    r.onerror = (e) => (e.error === "no-speech" || e.error === "aborted" ? resolve([]) : reject(new Error(e.error)));
    r.onend = () => resolve(results);
    try { r.start(); } catch (err) { reject(err); }
    listen.stop = () => { try { r.stop(); } catch (err) {} };
  });
}

// ---- sound effects (generated, no audio files) ----
let ctx = null;
function tone(freqs, dur = 0.12, type = "sine", gap = 0.09) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      const t = t0 + i * gap;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    });
  } catch (e) {}
}
export const sfx = {
  right: () => tone([660, 880]),
  wrong: () => tone([220, 180], 0.18, "triangle", 0.12),
  done: () => tone([523, 659, 784, 1047], 0.16, "sine", 0.11),
};
