#!/usr/bin/env python3
"""Drift check: do the other formats still say what the Markdown (content/*.md) says?

    python3 site/tools/drift.py whitepaper            # whitepaper/pages/*.html
    python3 site/tools/drift.py exec                  # whitepaper/exec/pages/*.html (summary: use --terms)
    python3 site/tools/drift.py brief                 # word/brief.md against whitepaper/exec/pages
    python3 site/tools/drift.py summary               # shared/summary.json titles against content/*.md
    python3 site/tools/drift.py file.pdf|.pptx|.docx  # a built file
    options: --article NAME        limit the sentence check to one article
             --reverse             list target sentences that are not in the Markdown (information only)
             --terms               only check retired and required terms (and the summary titles for the whitepaper)
             --update-baseline     whitepaper only: accept the sentences that are missing now

Checks and output lines (the first word is parsed by decks/qa.py and build.sh):
    RETIRED TERM  '<match>'  in <where>     a name the guidance no longer uses (RETIRED below; case-insensitive)
    MISSING TERM  '<term>'  (<target>)      a name the target must carry (REQUIRED below, read from shared/summary.json)
    SUMMARY DRIFT  '<title>'  not in <file> a title in shared/summary.json that is not in the Markdown
    NEW DRIFT  <article>  '<sentence>'      a Markdown sentence missing from the whitepaper and not in the baseline
The whitepaper, the Word edition and the PDFs carry the full text; the executive brief and the decks are summaries.
Only the whitepaper has a sentence baseline (site/tools/drift-baseline.txt, one normalized sentence per line under
"# article" lines). Condensing the whitepaper on purpose: run --update-baseline and review the diff. For other
full-text targets the missing sentences are listed but do not change the exit status.
Exit status is 1 for any RETIRED TERM, MISSING TERM, SUMMARY DRIFT or NEW DRIFT (the brief has no baseline, so every
missing sentence counts), otherwise 0.
"""
import glob, html, json, os, re, subprocess, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASELINE = os.path.join(ROOT, "site", "tools", "drift-baseline.txt")
BRIEF = os.path.join(ROOT, "word", "brief.md")
SUMMARY = json.load(open(os.path.join(ROOT, "shared", "summary.json"), encoding="utf-8"))

# Regular expressions, matched case-insensitively on text with tags, <style> and <script> removed.
# The executive deck's speaker notes quote the executive talk track verbatim, and it says "lighter-weight" and
# "lightweight": the patterns in QUOTED_IN_NOTES are not applied to speaker notes (ppt/notesSlides).
RETIRED = [re.escape(t) for t in [
    "Multi-region workload design", "Scenario R1", "Scenario R2", "Scenario R3",
    "Select the supporting connectivity profile", "resiliency role separately",
    "Qualification and Enablement Framework", "Regional Qualification Framework", "five dimensions", "Dimension 5",
    "lightest", "Regional dependencies and resiliency"]] + [
    r"(?-i:\bApplication Landing Zone)",          # the retired construct name; Microsoft Learn's "application landing zones" is fine
    r"\bdimensions?\b", r"\bD[1-5]\b", r"\bfour parts\b", r"\bSection 0\d", r"Enablement Framework", r"\bright-siz",
    r"\blightest\b", r"\blighter(?:-weight)? (?:patterns?|profiles?)\b", r"\blightweight\b"]
QUOTED_IN_NOTES = [r"\blighter(?:-weight)? (?:patterns?|profiles?)\b", r"\blightweight\b"]

_names = lambda items: [i["name"] for i in items]
_outcomes = [o["name"].split(" as of")[0] for o in SUMMARY["outcomes"]]        # "Qualified as of the assessment date"
REQUIRED = {
    "full": _names(SUMMARY["parts"]) + ["four checks"] + _names(SUMMARY["choices"]) + _outcomes
            + ["selected", "ready for workloads"] + SUMMARY["profiles"] + SUMMARY["archetypes"],
    "exec": ["four checks"] + SUMMARY["profiles"] + SUMMARY["archetypes"],
}
# article -> (summary list, field that holds the title)
SUMMARY_ARTICLES = {"customer-scenarios": ("scenarios", "title"), "misconceptions": ("misconceptions", "claim"),
                    "getting-started": ("gettingStarted", "title")}


def norm(t):
    t = html.unescape(t)
    t = t.replace("­", "").replace("‑", "-").replace(" ", " ")
    t = re.sub(r"[‘’]", "'", t); t = re.sub(r"[“”]", '"', t)
    t = re.sub(r"[–—]", "-", t)
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def md_sentences(path, brief=False):
    s = open(path, encoding="utf-8").read().replace("\r\n", "\n")
    s = re.sub(r"^---\n.*?\n---\n", "", s, flags=re.S)
    s = re.sub(r"<!--\s*site-only:start\s*-->.*?<!--\s*site-only:end\s*-->", "", s, flags=re.S)
    s = re.sub(r":::image[^\n]*:::", "", s)
    s = re.sub(r":::[a-z-]*:::|:::[a-z-]+", "", s)
    s = re.sub(r"^## (Next step|Reference links|Related resources)\n.*?(?=^## |\Z)", "", s, flags=re.S | re.M)
    if brief:
        s = re.sub(r"!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?", "", s)                 # figures: skip alt text
        s = re.sub(r"<!--\s*(?:\w+:)?\s*(.*?)\s*-->", r"\1", s, flags=re.S)    # eyebrow and standfirst comments are text
        s = re.sub(r"^:::.*$", "", s, flags=re.M)
        s = re.sub(r"^\|[^\n]*\n(?=\|?[-| :]+\|?\n)", "", s, flags=re.M)        # table header rows
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)        # links -> text
    s = re.sub(r"> \[![A-Z]+\]", "", s)
    out = []
    for line in s.split("\n"):
        line = line.strip()
        if not line or re.fullmatch(r"\|?[-| :]+\|?", line):
            continue
        cells = [c for c in line.strip("|").split("|")] if line.startswith("|") else [line]
        for c in cells:
            c = re.sub(r"^[#>\-*\d. ]+", "", c.strip())
            c = re.sub(r"[*`]|(?<!\w)_|_(?!\w)", "", c)       # emphasis marks; an underscore inside a name stays
            for sent in re.split(r"(?<=[.!?:;])\s+", c):
                sent = re.sub(r"\s*See\b.*$", "", sent).strip()
                if len(norm(sent).split()) >= 4:
                    out.append(sent)
    return out


def _drivers_figure_text():
    fig = SUMMARY["driversFigure"]
    words = [fig["title"], " ".join(fig["hub"]), fig["openTitle"], fig["openText"], fig["nextTitle"], fig["captionLeft"], fig["captionRight"]]
    for d in SUMMARY["drivers"]:
        words.append(d["name"])
        words += [t for row in d["triggers"] for t in (row if isinstance(row, list) else [row])]
    return " . ".join(words)


def text_of(target):
    if target in ("whitepaper", "exec"):
        d = "whitepaper/pages" if target == "whitepaper" else "whitepaper/exec/pages"
        parts = []
        for f in sorted(glob.glob(os.path.join(ROOT, d, "*.html"))):
            t = open(f, encoding="utf-8").read()
            t = re.sub(r"<(style|script).*?</\1>", " ", t, flags=re.S)
            t = re.sub(r"<!--.*?-->", " ", t, flags=re.S)
            if "{{PY:drivers.pdf_figure" in t:          # the drivers figure is drawn at build time from shared/summary.json
                t += " " + _drivers_figure_text()
            parts.append((os.path.basename(f), re.sub(r"<[^>]+>", " ", t)))
        return parts
    if target == "brief":
        t = open(BRIEF, encoding="utf-8").read()
        return [("word/brief.md", re.sub(r"<!--\s*(?:\w+:)?\s*(.*?)\s*-->", r"\1", t, flags=re.S))]
    if target.endswith((".pdf", ".pptx", ".docx")) and not os.path.exists(target):
        raise SystemExit(f"{target}: file not found")
    if target.endswith(".pdf"):
        return [(target, subprocess.run(["pdftotext", target, "-"], capture_output=True, text=True).stdout)]
    if target.endswith((".pptx", ".docx")):
        z = zipfile.ZipFile(target); parts = []
        for n in sorted(z.namelist()):
            if re.search(r"(slides/slide\d+|notesSlides/notesSlide\d+|word/document)\.xml$", n):
                x = z.read(n).decode("utf-8")
                x = re.sub(r"</(a:p|w:p)>", "\n", x)
                parts.append((n, re.sub(r"<[^>]+>", "", x)))
        return parts
    raise SystemExit("unknown target " + target)


def kind(target):
    """Which REQUIRED list applies: 'full', 'exec', or None."""
    base = os.path.basename(target)
    if target == "whitepaper": return "full"
    if target in ("exec", "brief"): return "exec"
    if base.endswith(".pptx"): return "exec" if "Executive" in base else "full" if "Full" in base else None
    return "exec" if "Executive" in base else "full"


def retired_terms(parts):
    bad, seen = 0, set()
    for pattern in RETIRED:
        found = {}
        for name, t in parts:
            if pattern in QUOTED_IN_NOTES and "notesSlides/" in name:
                continue
            for m in re.finditer(pattern, html.unescape(t), flags=re.I):
                found.setdefault(m.group(0).lower(), (m.group(0), []))[1].append(name)
        for key, (match, names) in found.items():
            if key in seen: continue                    # a literal and a pattern for the same word report once
            seen.add(key); bad += 1; print(f"RETIRED TERM  {match!r}  in {', '.join(dict.fromkeys(names[:8]))}")
    return bad


def required_terms(target, blob):
    k = kind(target)
    missing = [t for t in REQUIRED.get(k, []) if f" {norm(t)} " not in blob]
    for t in missing:
        print(f"MISSING TERM  {t!r}  ({os.path.basename(target)})")
    return len(missing)


def summary_drift():
    md = {}
    for f in glob.glob(os.path.join(ROOT, "content", "*.md")):
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", open(f, encoding="utf-8").read())
        md[os.path.basename(f)[:-3]] = f" {norm(text)} "
    everything = " ".join(md.values())
    bad = 0
    for article, (key, field) in SUMMARY_ARTICLES.items():
        for item in SUMMARY[key]:
            if f" {norm(item[field])} " not in md[article]:
                bad += 1; print(f"SUMMARY DRIFT  {item[field]!r}  not in content/{article}.md")
    for key in ("parts", "checks"):
        for item in SUMMARY[key]:
            if f" {norm(item['name'])} " not in everything:
                bad += 1; print(f"SUMMARY DRIFT  {item['name']!r}  not in content/*.md")
    return bad


def read_baseline():
    accepted, article = set(), None
    if os.path.exists(BASELINE):
        for line in open(BASELINE, encoding="utf-8").read().split("\n"):
            if line.startswith("# "): article = line[2:]
            elif line.strip(): accepted.add((article, line.strip()))
    return accepted


def write_baseline(missing):
    lines = []
    for article in sorted(missing):
        lines += [f"# {article}"] + sorted({norm(s) for s in missing[article]})
    with open(BASELINE, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    return sum(len({norm(s) for s in v}) for v in missing.values())


def main():
    argv = sys.argv[1:]
    args = [a for i, a in enumerate(argv) if not a.startswith("--") and not (i and argv[i - 1] == "--article")]
    target = args[0] if args else "whitepaper"
    only = argv[argv.index("--article") + 1] if "--article" in argv else None
    update = "--update-baseline" in argv
    if update and (target != "whitepaper" or only):
        raise SystemExit("--update-baseline works on the whole whitepaper target only")
    if target == "brief" and not os.path.exists(BRIEF):
        print("brief: word/brief.md not found, skipped"); return
    bad = 0
    if target == "summary":
        bad = summary_drift()
        print("summary: " + ("titles match the Markdown" if not bad else f"{bad} title(s) not in the Markdown"))
        sys.exit(1 if bad else 0)
    parts = text_of(target)
    blob = " " + " ".join(norm(t) for _, t in parts) + " "
    bad += retired_terms(parts) + required_terms(target, blob)
    if target == "whitepaper":
        bad += summary_drift()
    if "--terms" in argv:
        print("terms: " + ("all clear" if not bad else f"{bad} problem(s)")); sys.exit(1 if bad else 0)

    # sentence check: Markdown sentences against the target (the brief is checked against the executive pages)
    if target == "brief":
        sources = [("brief", md_sentences(BRIEF, brief=True))]
        blob = " " + " ".join(norm(t) for _, t in text_of("exec")) + " "
    else:
        sources = [(os.path.basename(f)[:-3], md_sentences(f)) for f in sorted(glob.glob(os.path.join(ROOT, "content", "*.md")))]
    sources = [(n, s) for n, s in sources if not only or n == only]
    missing = {n: [s for s in sents if norm(s) not in blob] for n, sents in sources}
    missing = {n: m for n, m in missing.items() if m}
    total = sum(len(s) for _, s in sources)
    miss = sum(len(m) for m in missing.values())
    if update:
        print(f"baseline: {write_baseline(missing)} sentences written to {os.path.relpath(BASELINE, ROOT)}"); return
    if target in ("whitepaper", "brief"):
        accepted = read_baseline() if target == "whitepaper" else set()
        new = 0
        for n, m in missing.items():
            for s in m:
                if (n, norm(s)) not in accepted:
                    new += 1; print(f"NEW DRIFT  {n}  '{s[:230]}'")
        bad += new
        print(f"{total - miss}/{total} found; {miss - new} accepted in baseline; {new} new")
    else:
        for n, m in missing.items():
            print(f"\n== {n}: {len(m)} missing")
            for s in m: print("  -", s[:230])
        print(f"\n{total - miss}/{total} Markdown sentences found in {os.path.basename(target)} (information only)")
    if "--reverse" in argv:
        md_files = [BRIEF] if target == "brief" else glob.glob(os.path.join(ROOT, "content", "*.md"))
        md_blob = " " + " ".join(norm(open(f, encoding="utf-8").read()) for f in md_files) + " "
        for name, t in text_of("exec" if target == "brief" else target):
            for s in re.split(r"(?<=[.!?:;])\s+", re.sub(r"\s+", " ", html.unescape(t))):
                if len(norm(s).split()) >= 4 and norm(s) not in md_blob:
                    print(f"NOT IN MARKDOWN  {name}  '{s.strip()[:230]}'")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
