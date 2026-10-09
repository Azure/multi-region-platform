#!/usr/bin/env bash
# Rebuild every deliverable from source. Any failing step stops the build with a non-zero status.
#   ./build.sh            everything: pdf, decks, site, word, check
#   ./build.sh site       figures + website only (fast path after Markdown edits)
#   ./build.sh pdf        whitepaper + executive brief (PDF and single-file HTML); fails on overflow or layout warnings
#   ./build.sh decks      build both PowerPoint decks, run decks/qa.py on each, copy them to dist/ (not published)
#   ./build.sh word       Word editions: full guidance and executive brief (stay in dist/)
#   ./build.sh check      drift check, summary titles, color tokens, then the .docx/.pptx files in dist/; runs every check, fails if any fails
#   ./build.sh art        regenerate the art: city analogy, common-drivers figure, deck backgrounds (not part of "all")
#   ./build.sh clean      delete build outputs (dist/ PDF, HTML, PPTX and DOCX files, whitepaper/out*, decks/out, assembled HTML)
#   ./build.sh data       refresh the Azure data that the region planning workbook reads: prices, then latency (not part of "all")
#   ./build.sh latency    refresh only the latency data (needs GitHub, not prices.azure.com)
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
  python3 build.py full
  python3 render.py --pdf
  python3 build.py exec
  python3 render.py --pdf --exec
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
  node build_full.js
  node build_exec.js
  cd "$ROOT"
  # run both QA passes even if the first fails, then stop before anything reaches dist/
  local status=0
  python3 decks/qa.py full || status=1
  python3 decks/qa.py exec || status=1
  [ "$status" -eq 0 ] || { echo "  deck QA failed; the decks were not copied to dist/"; return 1; }
  cp decks/out/$NAME-Full.pptx decks/out/$NAME-Executive.pptx "$DIST/"
}

site() {
  echo "== figures + website"
  python3 site/tools/extract_figures.py
  python3 site/build.py
  # the website offers only the two PDFs as downloads; the decks and the Word documents stay local (dist/ is git-ignored)
  for f in "$NAME.pdf" "$NAME-Executive-Brief.pdf"; do
    if [ -f "$DIST/$f" ]; then cp "$DIST/$f" docs/downloads/; else echo "  (skipped $f — run ./build.sh pdf first)"; fi
  done
  python3 site/tools/qa.py
}

word() {
  echo "== Word editions (full guidance and executive brief)"
  python3 word/build.py full  "$DIST/$NAME.docx"
  python3 word/build.py brief "$DIST/$NAME-Executive-Brief.docx"
}

# Runs every check and reports all failures. Built files that are not in dist/ are skipped.
check() {
  local status=0 f opts
  echo "== drift check"
  python3 site/tools/drift.py whitepaper || status=1     # sentences not in site/tools/drift-baseline.txt, retired and required terms
  python3 site/tools/drift.py exec --terms || status=1
  python3 site/tools/drift.py brief || status=1
  python3 site/tools/drift.py summary || status=1
  python3 site/tools/check_tokens.py || status=1
  # the full Word edition is compared sentence by sentence (listed, not failed); the brief and the decks are summaries
  for f in "$NAME.docx" "$NAME-Executive-Brief.docx" "$NAME-Full.pptx" "$NAME-Executive.pptx"; do
    if [ ! -f "$DIST/$f" ]; then echo "$f: not built, skipped"; continue; fi
    echo "$f:"
    opts=--terms
    [ "$f" = "$NAME.docx" ] && opts=
    python3 site/tools/drift.py "$DIST/$f" $opts || status=1
  done
  [ "$status" -eq 0 ] || echo "check: FAILED"
  return "$status"
}

# Needs Playwright. The icon PNGs for the decks are not part of this target: `node icons.js` (run in decks/)
# regenerates them from icons.json and needs the optional `sharp` package.
art() {
  echo "== art"
  python3 art/city_analogy.py
  python3 art/common_drivers.py
  (cd "$ROOT/decks" && python3 render_art.py)
}

# Only generated files go; anything else in dist/ is left alone.
clean() {
  echo "== clean"
  rm -f "$DIST"/*.pdf "$DIST"/*.html "$DIST"/*.pptx "$DIST"/*.docx
  rm -rf "$ROOT/whitepaper/out" "$ROOT/whitepaper/out-exec" "$ROOT/decks/out"
  rm -f "$ROOT/whitepaper/whitepaper.html" "$ROOT/whitepaper/executive.html"
}

latency() {
  echo "== latency data for the region planning workbook"
  python3 site/tools/refresh_latency.py "$@"
}

# Extra arguments go to the price script. The latency script runs even when the price script fails, because it
# doesn't need prices.azure.com; the exit status still reports the failure.
data() {
  local status=0
  echo "== Azure price snapshot for the region planning workbook"
  python3 site/tools/refresh_data.py "${@:2}" || status=$?
  latency || status=$?
  return "$status"
}

case "$what" in
  all)   pdf; decks; site; word; check ;;
  pdf)   pdf ;;
  decks) decks ;;
  site)  site ;;
  word)  word ;;
  check) check ;;
  art)   art ;;
  clean) clean ;;
  data)  data "$@" ;;
  latency) latency "${@:2}" ;;
  *) echo "usage: ./build.sh [all|pdf|decks|site|word|check|art|clean|data|latency]"; exit 1 ;;
esac
echo "done."
