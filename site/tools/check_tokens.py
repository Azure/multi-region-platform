#!/usr/bin/env python3
"""Check that the color tokens are the same in every format.

    python3 site/tools/check_tokens.py

shared/summary.json "tokens" is the reference. whitepaper/styles.css (:root), decks/lib.js (C) and
word/build.py (color constants) must carry the same values. Exits 1 on any difference.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ref = {k: v.upper().lstrip("#") for k, v in json.load(open(os.path.join(ROOT, "shared", "summary.json"), encoding="utf-8"))["tokens"].items()}
bad = []

css = open(os.path.join(ROOT, "whitepaper", "styles.css"), encoding="utf-8").read()
css_tok = {k: v.upper() for k, v in re.findall(r"--([a-z0-9-]+):\s*#([0-9A-Fa-f]{6})", css)}
for k, v in ref.items():
    if css_tok.get(k) != v:
        bad.append(f"whitepaper/styles.css  --{k}: {css_tok.get(k, 'missing')} (expected {v})")

DECK_NAMES = {"soft": "line-soft", "white": "paper"}
lib = open(os.path.join(ROOT, "decks", "lib.js"), encoding="utf-8").read()
block = re.search(r"const C = \{(.*?)\};", lib, flags=re.S).group(1)
for k, v in re.findall(r"(\w+): '([0-9A-Fa-f]{6})'", block):
    name = DECK_NAMES.get(k, k)
    if ref.get(name) != v.upper():
        bad.append(f"decks/lib.js  C.{k}: {v.upper()} (expected {ref.get(name, 'a token named ' + name)})")

WORD_NAMES = {"INK": "ink", "BLUE": "b600", "BLUE_D": "b700", "TEXT": "text", "MUTED": "muted", "FAINT": "faint", "LINE": "line", "WASH": "wash", "SOFT": "b50",
              "TEAL": "t600", "TEAL_D": "t700", "TEAL_SOFT": "t50", "WARM": "w600", "WARM_SOFT": "w50", "GREEN": "g600", "GREEN_SOFT": "g100", "AMBER": "a700", "AMBER_SOFT": "a100", "SLATE": "s800"}
word = open(os.path.join(ROOT, "word", "build.py"), encoding="utf-8").read()
word_val = {}   # constant name -> value, from lines such as  INK, BLUE = "0A2340", "0F6CBD"
for m in re.finditer(r"^([A-Z_, ]+) = ((?:\"[0-9A-Fa-f]{6}\",? ?)+)$", word, flags=re.M):
    names = [n.strip() for n in m.group(1).split(",")]
    vals = re.findall(r'"([0-9A-Fa-f]{6})"', m.group(2))
    if len(names) == len(vals):
        word_val.update(zip(names, (v.upper() for v in vals)))
for k, name in WORD_NAMES.items():
    if k in word_val and word_val[k] != ref[name]:
        bad.append(f"word/build.py  {k}: {word_val[k]} (expected {ref[name]}, token {name})")

for b in bad:
    print("TOKEN MISMATCH  " + b)
print("tokens: " + ("consistent" if not bad else f"{len(bad)} mismatch(es)"))
sys.exit(1 if bad else 0)
