#!/usr/bin/env bash
# Render a deck to PDF inside a network-isolated sandbox.
# Usage: ./build-pdf-sandboxed.sh [deck.html] [out.pdf]
#
# Use this for any HTML that came from a client. It is the strongest option.
#
# How the isolation works: bubblewrap puts Chrome in its own empty network
# namespace (`--unshare-net`), which is exactly what `docker run --network none`
# does. The namespace has no interfaces and its own isolated loopback, so
# network egress is physically impossible rather than merely blocked by DNS.
# A request to a literal IP such as http://127.0.0.1:8099 cannot reach the host,
# because that loopback is not the host's loopback.
#
# The filesystem is mounted read-only, except the output directory. Chrome's own
# renderer sandbox stays enabled on top of this.
#
# Fallback: build-pdf.sh renders with DNS resolution blocked instead. Use it
# only if bubblewrap is unavailable.
set -euo pipefail

HTML="${1:-deck-template.html}"
OUT="${2:-output/$(basename "${HTML%.html}").pdf}"

if [ ! -f "$HTML" ]; then
  echo "error: input file not found: $HTML" >&2
  exit 1
fi

if ! command -v bwrap >/dev/null 2>&1; then
  echo "error: bubblewrap (bwrap) not found, cannot sandbox." >&2
  echo "       Install bubblewrap, or use ./build-pdf.sh for the DNS blocked fallback." >&2
  exit 1
fi

CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
if [ -z "$CHROME" ]; then
  echo "error: no Chrome or Chromium found on PATH" >&2
  exit 1
fi

HTML_ABS="$(realpath "$HTML")"
OUT_ABS="$(realpath -m "$OUT")"
OUT_DIR="$(dirname "$OUT_ABS")"
mkdir -p "$OUT_DIR"

# Whole filesystem read only, output directory the single writable path,
# fresh tmpfs for Chrome's profile and scratch space.
bwrap \
  --unshare-net \
  --unshare-ipc \
  --unshare-uts \
  --ro-bind / / \
  --dev /dev \
  --proc /proc \
  --tmpfs /tmp \
  --bind "$OUT_DIR" "$OUT_DIR" \
  --die-with-parent \
  --new-session \
  "$CHROME" --headless=new --disable-gpu \
    --disable-extensions \
    --disable-plugins \
    --disable-sync \
    --disable-background-networking \
    --no-default-browser-check \
    --no-first-run \
    --user-data-dir=/tmp/chrome-profile \
    --no-pdf-header-footer \
    --print-to-pdf="$OUT_ABS" \
    "file://$HTML_ABS"

echo "wrote $OUT_ABS"
