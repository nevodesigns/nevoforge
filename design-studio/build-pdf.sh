#!/usr/bin/env bash
# Render a NevoForge deck HTML file to PDF with headless Chrome.
# Usage: ./build-pdf.sh [deck.html] [out.pdf]
#
# SECURITY: decks may contain client-supplied HTML, so this renders with all
# network access disabled. `--host-resolver-rules="MAP * ~NOTFOUND"` makes DNS
# fail for every host, so a deck cannot reach your machine, your local network,
# or the internet, and cannot phone home or exfiltrate anything.
#
# Consequence, and it is intended: remote images, fonts, scripts, and iframes
# will NOT load. Download any legitimate asset, check it, and reference it
# locally before rendering. Never relax these flags to make a client file work.
set -euo pipefail

HTML="${1:-deck-template.html}"
OUT="${2:-output/$(basename "${HTML%.html}").pdf}"

if [ ! -f "$HTML" ]; then
  echo "error: input file not found: $HTML" >&2
  exit 1
fi

CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
if [ -z "$CHROME" ]; then
  echo "error: no Chrome or Chromium found on PATH" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

# Throwaway profile so nothing persists between renders.
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT

"$CHROME" --headless=new --disable-gpu \
  --host-resolver-rules="MAP * ~NOTFOUND" \
  --disable-extensions \
  --disable-plugins \
  --disable-sync \
  --disable-background-networking \
  --no-default-browser-check \
  --no-first-run \
  --user-data-dir="$PROFILE" \
  --no-pdf-header-footer \
  --print-to-pdf="$OUT" \
  "file://$(realpath "$HTML")"

echo "wrote $OUT"
