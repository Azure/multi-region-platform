#!/bin/bash
# usage: qa.sh name(without .pptx)
cd "$(dirname "$0")/out"
SK=/mnt/skills/public/pptx
rm -f "$1.pdf"
python3 $SK/scripts/office/soffice.py --headless --convert-to pdf "$1.pptx" >/dev/null 2>&1
rm -f $1-*.jpg
pdftoppm -jpeg -r 80 "$1.pdf" "$1"
ls $1-*.jpg | wc -l
