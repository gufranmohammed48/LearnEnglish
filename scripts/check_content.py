"""Checks course.json and every lesson file for mistakes that would break the app.

Run:  python scripts/check_content.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
problems = []


def bad(where, msg):
    problems.append(f"{where}: {msg}")


def bilingual(where, o, need_en=False):
    if not isinstance(o, dict):
        return bad(where, "should be an object with ur/roman")
    for k in ("ur", "roman") + (("en",) if need_en else ()):
        if not str(o.get(k, "")).strip():
            bad(where, f"missing '{k}'")
    if o.get("ur") and re.search(r"[A-Za-z]{4,}", o["ur"]) and "'" not in o["ur"] and "IELTS" not in o["ur"]:
        pass  # Latin inside Urdu is allowed (English examples are quoted)
    if o.get("roman") and re.search(r"[؀-ۿ]", o["roman"]):
        bad(where, "Roman Urdu contains Urdu letters")


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[.,!?;:\"]", " ", s.lower())).strip()


def check_options(where, ex):
    opts = ex.get("options") or []
    if len(opts) < 2:
        bad(where, "needs at least 2 options")
    if not isinstance(ex.get("answer"), int) or not 0 <= ex["answer"] < len(opts):
        bad(where, "answer index out of range")
    seen = set()
    for i, o in enumerate(opts):
        if isinstance(o, dict):
            bilingual(f"{where} option {i}", o)
            key = o.get("ur")
        else:
            key = norm(o)
        if key in seen:
            bad(where, f"duplicate option {o}")
        seen.add(key)


def check_lesson(lid, unit_id):
    path = CONTENT / "lessons" / f"{lid}.json"
    if not path.exists():
        return bad(lid, "lesson file missing")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return bad(lid, f"invalid JSON: {e}")
    if data.get("id") != lid:
        bad(lid, "id inside file does not match file name")
    words = data.get("words") or []
    if not words:
        bad(lid, "no words listed")
    for i, w in enumerate(words):
        bilingual(f"{lid} word {i}", w, need_en=True)
    exs = data.get("exercises") or []
    graded = [e for e in exs if e.get("type") != "tip"]
    if len(graded) < 8:
        bad(lid, f"only {len(graded)} exercises (aim for 10+)")
    for n, ex in enumerate(exs):
        where = f"{lid} #{n} ({ex.get('type')})"
        t = ex.get("type")
        if t == "tip":
            bilingual(where, ex.get("text"))
            for e in ex.get("examples", []):
                bilingual(where + " example", e, need_en=True)
        elif t == "pick":
            q = ex.get("q") or {}
            if "en" not in q:
                bilingual(where + " q", q)
            check_options(where, ex)
            if "en" in q and "___" in q["en"] and any(isinstance(o, dict) for o in ex["options"]):
                bad(where, "gap questions need English options")
        elif t in ("listen", "reply"):
            if not ex.get("say"):
                bad(where, "missing 'say'")
            check_options(where, ex)
            if any(not isinstance(o, str) for o in ex.get("options", [])):
                bad(where, "options must be English strings")
        elif t == "build":
            bilingual(where + " q", ex.get("q"))
            if not ex.get("answer"):
                bad(where, "missing answer")
            for x in ex.get("extra", []):
                if norm(x) in norm(ex.get("answer", "")).split():
                    pass  # duplicate tiles are allowed but confusing
        elif t == "match":
            pairs = ex.get("pairs") or []
            if not 3 <= len(pairs) <= 6:
                bad(where, "match needs 3-6 pairs")
            if len({norm(p["en"]) for p in pairs}) != len(pairs):
                bad(where, "duplicate English in pairs")
            for p in pairs:
                if "to" in p:
                    if not p.get("en") or not p["to"]:
                        bad(where, "English pair needs 'en' and 'to'")
                else:
                    bilingual(where, p, need_en=True)
        elif t == "fix":
            words_ = ex.get("sentence", "").split(" ")
            if not ex.get("wrong") or any(not 0 <= i < len(words_) for i in ex["wrong"]):
                bad(where, "wrong indices out of range")
            if not ex.get("fixed"):
                bad(where, "missing fixed sentence")
            if ex.get("why"):
                bilingual(where + " why", ex["why"])
        elif t == "speak":
            if not ex.get("say"):
                bad(where, "missing 'say'")
        elif t == "type":
            if not ex.get("say") or not ex.get("answer"):
                bad(where, "needs 'say' and 'answer'")
        else:
            bad(where, "unknown exercise type")
        if ex.get("why") and t != "fix":
            bilingual(where + " why", ex["why"])


def main():
    course = json.loads((CONTENT / "course.json").read_text(encoding="utf-8"))
    ids = set()
    lesson_count = 0
    for u in course["units"]:
        bilingual(u["id"] + " title", u["title"], need_en=True)
        for l in u.get("lessons", []):
            if l["id"] in ids:
                bad(l["id"], "duplicate lesson id")
            ids.add(l["id"])
            bilingual(l["id"] + " title", l["title"], need_en=True)
            if not u.get("soon"):
                check_lesson(l["id"], u["id"])
                lesson_count += 1
    stories = json.loads((CONTENT / "stories" / "index.json").read_text(encoding="utf-8"))["stories"]
    for st in stories:
        where = "story " + st["id"]
        bilingual(where + " title", st["title"], need_en=True)
        if st.get("after") and st["after"] not in ids:
            bad(where, f"unlocks after unknown lesson {st['after']}")
        path = CONTENT / "stories" / f"{st['id']}.json"
        if not path.exists():
            bad(where, "story file missing")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        cast = data.get("cast", {})
        for n, item in enumerate(data.get("items", [])):
            w = f"{where} #{n}"
            if item.get("type"):
                if item["type"] in ("pick", "reply", "listen"):
                    check_options(w, item)
                if item.get("type") == "pick" and "en" not in item.get("q", {}):
                    bilingual(w + " q", item["q"])
            else:
                bilingual(w, item, need_en=True)
                if item.get("who") and item["who"] not in cast:
                    bad(w, f"'{item['who']}' is not in the cast")
        for k, g in data.get("glossary", {}).items():
            if k != k.lower():
                bad(where, f"glossary key '{k}' must be lowercase")
            bilingual(f"{where} glossary {k}", g)
    for f in (CONTENT / "lessons").glob("*.json"):
        if f.stem not in ids:
            bad(f.name, "lesson file not listed in course.json")
    if problems:
        print("\n".join(problems))
        print(f"\n{len(problems)} problem(s)")
        sys.exit(1)
    print(f"OK: {lesson_count} lessons and {len(stories)} stories checked")


if __name__ == "__main__":
    main()
