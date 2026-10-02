#!/usr/bin/env bash
# Rebuild every deliverable from source.
#   ./build.sh            everything
#   ./build.sh site       figures + website only (fast path after Markdown edits)
#   ./build.sh pdf        whitepaper + executive brief (PDF and single-file HTML)
#   ./build.sh decks      PowerPoint decks (stay in dist/, not published)
#   ./build.sh word       Word edition generated from the Markdown (stays in dist/)
#   ./build.sh check      drift check of the Markdown against the other formats
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(pwd)"
DIST="$ROOT/dist"
NAME="Adaptable-Multi-Region-Azure-Platform"
what="${1:-all}"
mkdir -p "$DIST" "$ROOT/docs/downloads"

pdf() {
  echo "== whitepaper + executive brief"
  cd "$ROOT/whitepaper"
  python3 build.py full && python3 render.py --pdf
  python3 build.py exec && python3 render.py --pdf --exec
  cp out/whitepaper.pdf        "$DIST/$NAME.pdf"
  cp out-exec/executive.pdf    "$DIST/$NAME-Executive-Brief.pdf"
  python3 inline.py whitepaper.html "$DIST/$NAME.html"
  python3 inline.py executive.html  "$DIST/$NAME-Executive-Brief.html"
  cd "$ROOT"
}

decks() {
  echo "== decks"
  cd "$ROOT/decks"
  mkdir -p out
  node build_full.js && node build_exec.js
  cp out/$NAME-Full.pptx out/$NAME-Executive.pptx "$DIST/"
  cd "$ROOT"
}

site() {
  echo "== figures + website"
  python3 site/tools/extract_figures.py
  python3 site/build.py
  # the website offers only the two PDFs as downloads; the decks and the Word document stay local (dist/ is git-ignored)
  for f in "$NAME.pdf" "$NAME-Executive-Brief.pdf"; do
    [ -f "$DIST/$f" ] && cp "$DIST/$f" docs/downloads/ || echo "  (skipped $f — run ./build.sh pdf first)"
  done
  python3 site/tools/qa.py
}

word() {
  echo "== Word edition (from the Markdown)"
  python3 word/build.py "$DIST/$NAME.docx"
}

check() {
  echo "== drift check"
  python3 site/tools/drift.py whitepaper | tail -n 1
  python3 site/tools/drift.py exec --terms
  for f in "$DIST/$NAME.docx" "$DIST/$NAME-Full.pptx" "$DIST/$NAME-Executive.pptx"; do
    [ -f "$f" ] && { echo "$(basename "$f"):"; python3 site/tools/drift.py "$f" $([[ "$f" == *.docx ]] || echo --terms) | tail -n 1; }
  done
}

case "$what" in
  all)   pdf; decks; site; word; check ;;
  pdf)   pdf ;;
  decks) decks ;;
  site)  site ;;
  word)  word ;;
  check) check ;;
  *) echo "usage: ./build.sh [all|pdf|decks|site|word|check]"; exit 1 ;;
esac
echo "done."
