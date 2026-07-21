#!/usr/bin/env bash
# Render a NevoForge deck HTML file to PDF with headless Chrome.
# Usage: ./build-pdf.sh [deck.html] [out.pdf]
set -euo pipefail

HTML="${1:-deck-template.html}"
OUT="${2:-output/$(basename "${HTML%.html}").pdf}"

CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
if [ -z "$CHROME" ]; then
  echo "error: no Chrome or Chromium found on PATH" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

"$CHROME" --headless=new --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$OUT" \
  "file://$(realpath "$HTML")"

echo "wrote $OUT"
