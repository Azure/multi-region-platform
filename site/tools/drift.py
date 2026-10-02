#!/usr/bin/env python3
"""Drift check: is every sentence of the Markdown (content/*.md) present in another format?

    python3 site/tools/drift.py whitepaper            # whitepaper/pages/*.html
    python3 site/tools/drift.py exec                  # whitepaper/exec/pages/*.html (summary: terms only)
    python3 site/tools/drift.py file.pdf|.pptx|.docx  # a built file
    options: --article NAME (limit to one article)  --reverse (target sentences missing from the Markdown)
             --terms (only check retired terms and names)

The whitepaper and the Word document carry the full text, so every sentence is expected.
The executive brief and the decks are summaries, so use --terms for them.
"""
import glob, html, os, re, subprocess, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RETIRED = ["Application Landing Zone", "Multi-region workload design", "Scenario R1", "Scenario R2", "Scenario R3",
           "Select the supporting connectivity profile", "resiliency role separately"]


def norm(t):
    t = html.unescape(t)
    t = t.replace("­", "").replace("‑", "-").replace(" ", " ")
    t = re.sub(r"[‘’]", "'", t); t = re.sub(r"[“”]", '"', t)
    t = re.sub(r"[–—]", "-", t)
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def md_sentences(path, site_only=True):
    s = open(path, encoding="utf-8").read().replace("\r\n", "\n")
    s = re.sub(r"^---\n.*?\n---\n", "", s, flags=re.S)
    s = re.sub(r"<!--\s*site-only:start\s*-->.*?<!--\s*site-only:end\s*-->", "", s, flags=re.S)
    s = re.sub(r":::image[^\n]*:::", "", s)
    s = re.sub(r":::[a-z-]*:::|:::[a-z-]+", "", s)
    s = re.sub(r"^## (Next step|Reference links|Related resources)\n.*?(?=^## |\Z)", "", s, flags=re.S | re.M)
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
            c = re.sub(r"[*_`]", "", c)
            for sent in re.split(r"(?<=[.!?:;])\s+", c):
                sent = re.sub(r"\s*See\b.*$", "", sent).strip()
                if len(norm(sent).split()) >= 4:
                    out.append(sent)
    return out


def text_of(target):
    if target in ("whitepaper", "exec"):
        d = "whitepaper/pages" if target == "whitepaper" else "whitepaper/exec/pages"
        parts = []
        for f in sorted(glob.glob(os.path.join(ROOT, d, "*.html"))):
            t = open(f, encoding="utf-8").read()
            t = re.sub(r"<(style|script).*?</\1>", " ", t, flags=re.S)
            t = re.sub(r"<!--.*?-->", " ", t, flags=re.S)
            parts.append((os.path.basename(f), re.sub(r"<[^>]+>", " ", t)))
        return parts
    if target.endswith(".pdf"):
        return [(target, subprocess.run(["pdftotext", "-layout", target, "-"], capture_output=True, text=True).stdout)]
    if target.endswith((".pptx", ".docx")):
        z = zipfile.ZipFile(target); parts = []
        for n in sorted(z.namelist()):
            if re.search(r"(slides/slide\d+|notesSlides/notesSlide\d+|word/document)\.xml$", n):
                x = z.read(n).decode("utf-8")
                x = re.sub(r"</(a:p|w:p)>", "\n", x)
                parts.append((n, re.sub(r"<[^>]+>", "", x)))
        return parts
    raise SystemExit("unknown target " + target)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opts = sys.argv[1:]
    target = args[0] if args else "whitepaper"
    only = opts[opts.index("--article") + 1] if "--article" in opts else None
    parts = text_of(target)
    blob = " " + " ".join(norm(t) for _, t in parts) + " "
    raw = " ".join(t for _, t in parts)
    bad = 0
    for term in RETIRED:
        hits = [n for n, t in parts if term.lower() in html.unescape(t).lower()]
        if hits:
            bad += 1; print(f"RETIRED TERM  {term!r}  in {', '.join(hits[:8])}")
    if "--terms" in opts:
        print("retired terms:", bad or "none"); return
    total = miss = 0
    for f in sorted(glob.glob(os.path.join(ROOT, "content", "*.md"))):
        name = os.path.basename(f)[:-3]
        if only and name != only: continue
        missing = []
        for sent in md_sentences(f):
            total += 1
            if norm(sent) not in blob:
                missing.append(sent)
        if missing:
            miss += len(missing)
            print(f"\n== {name}: {len(missing)} missing")
            for m in missing: print("  -", m[:230])
    print(f"\n{total - miss}/{total} Markdown sentences found in {target}; retired terms: {bad or 'none'}")


if __name__ == "__main__":
    main()
