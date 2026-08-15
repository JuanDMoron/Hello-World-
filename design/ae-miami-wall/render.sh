#!/usr/bin/env bash
# Rebuild wall.html and screenshot it at full resolution.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
OUT="${1:-$DIR/ae-miami-graffiti-wall-2160x3840.png}"

node "$DIR/generate.js"

"$CHROME" \
  --headless \
  --no-sandbox \
  --disable-gpu \
  --hide-scrollbars \
  --force-device-scale-factor=1 \
  --window-size=2160,3840 \
  --screenshot="$OUT" \
  "file://$DIR/wall.html" 2>/dev/null

echo "rendered -> $OUT"
