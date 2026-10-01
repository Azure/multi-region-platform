#!/usr/bin/env bash
# Rebuild every deliverable from source.
#   ./build.sh            everything
#   ./build.sh site       figures + website only (fast path after Markdown edits)
#   ./build.sh pdf        whitepaper + executive brief (PDF and single-file HTML)
#   ./build.sh decks      PowerPoint decks
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
  node build_full.js && node build_exec.js
  cp out/$NAME-Full.pptx out/$NAME-Executive.pptx "$DIST/"
  cd "$ROOT"
}

site() {
  echo "== figures + website"
  python3 site/tools/extract_figures.py
  python3 site/build.py
  # the website offers the PDFs and decks as downloads
  for f in "$NAME.pdf" "$NAME-Executive-Brief.pdf" "$NAME-Full.pptx" "$NAME-Executive.pptx"; do
    [ -f "$DIST/$f" ] && cp "$DIST/$f" docs/downloads/ || echo "  (skipped $f — run ./build.sh pdf / decks first)"
  done
  python3 site/tools/qa.py
}

case "$what" in
  all)   pdf; decks; site ;;
  pdf)   pdf ;;
  decks) decks ;;
  site)  site ;;
  *) echo "usage: ./build.sh [all|pdf|decks|site]"; exit 1 ;;
esac
echo "done."
