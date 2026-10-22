#!/usr/bin/env bash
set -euo pipefail

PROJECT="${1:?usage: bootstrap_project.sh <project-dir> [--force]}"
FORCE="${2:-}"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE="$SKILL_DIR/assets/example"
RUNTIME="$SKILL_DIR/assets/runtime"

if [[ -e "$PROJECT" && -n "$(ls -A "$PROJECT" 2>/dev/null || true)" && "$FORCE" != "--force" ]]; then
  echo "目标目录非空：$PROJECT" >&2
  echo "换一个空目录，或明确加 --force。" >&2
  exit 1
fi
mkdir -p "$PROJECT/assets" "$PROJECT/out" "$PROJECT/base"

for f in index.html style.css app.js audio.py; do
  cp "$TEMPLATE/$f" "$PROJECT/$f"
done
for f in NotoSansSC.ttf Geist-normal-600.woff2 Geist-normal-700.woff2 \
         GeistMono-normal-400.woff2 GeistMono-normal-500.woff2 \
         grain.png logo.png logo-crop.png; do
  cp "$RUNTIME/$f" "$PROJECT/assets/$f"
done

# The worked example reads beauty frames; a fresh project starts from base/frames.
python3 - "$PROJECT/app.js" <<'PY'
import sys
from pathlib import Path
p = Path(sys.argv[1])
s = p.read_text(encoding='utf-8')
s = s.replace('base/frames-beauty-strong/', 'base/frames/')
p.write_text(s, encoding='utf-8')
PY

PROJECT_ABS="$(cd "$PROJECT" && pwd)"
cat > "$PROJECT/project.json" <<JSON
{
  "root": "$PROJECT_ABS",
  "out": "$PROJECT_ABS/out/silent.mp4",
  "index": "index.html",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "frames": 1477
}
JSON

export PATH="$HOME/.local/bin:$PATH"

check() {
  local name="$1" cmd="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "OK    $name"
  else
    echo "MISS  $name"
  fi
}
echo "=== dependencies ==="
check "node" node
check "npm" npm
check "ffmpeg" ffmpeg
check "ffprobe" ffprobe
check "uv (audio.py)" uv
check "whisper-cli (optional)" whisper-cli
if python3 -c 'import cv2' >/dev/null 2>&1; then
  echo "OK    OpenCV (undereye)"
else
  echo "MISS  OpenCV (undereye; python3 -m pip install opencv-python-headless numpy)"
fi
if [[ -x "/usr/bin/avconvert" ]]; then echo "OK    avconvert (macOS HDR)"; else echo "MISS  avconvert (macOS HDR; other platforms need zscale/tonemap)"; fi
if [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" || -x "/Applications/Chromium.app/Contents/MacOS/Chromium" ]]; then
  echo "OK    Chrome/Chromium"
else
  echo "MISS  Chrome/Chromium (set CHROME to an executable path)"
fi

echo "=== project ==="
echo "$PROJECT_ABS"
echo "template: index.html, style.css, app.js, audio.py"
echo "assets:   assets/NotoSansSC.ttf, Geist*, grain.png, logo*.png (placeholder)"
echo "config:   project.json (frames placeholder: 1477)"

if command -v npm >/dev/null 2>&1; then
  echo "=== npm: playwright-core ==="
  (cd "$PROJECT_ABS" && npm install --no-audit --no-fund playwright-core) || {
    echo "npm install failed; run it manually in $PROJECT_ABS" >&2
  }
fi

cat <<'TXT'
=== next ===
1. prepare:  scripts/prepare_source.sh <source.mov> <project>
2. transcribe: scripts/transcribe.sh <project>/audio-16k.wav <project>/asr
3. keeps: write keeps.json, then scripts/build_base.py --source <project>/media/source-1080x1920-30fps.mp4 --keeps <project>/keeps.json --out <project>/base/base-clean.mp4 --frames <project>/base/frames
4. update app.js DURATION / BASE_COUNT and project.json frames to match the actual base output
5. replace the placeholder logo.png / logo-crop.png with the firm's own assets
6. replace the example title/cards/subtitles in index.html + app.js
7. render: node scripts/render.mjs --project <project>/project.json
TXT
