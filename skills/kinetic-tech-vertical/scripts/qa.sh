#!/usr/bin/env bash
set -euo pipefail

VIDEO="${1:?usage: qa.sh <video> <qa-dir>}"
OUT="${2:?usage: qa.sh <video> <qa-dir>}"
FFMPEG="${FFMPEG:-/opt/homebrew/bin/ffmpeg}"
FFPROBE="${FFPROBE:-/opt/homebrew/bin/ffprobe}"

mkdir -p "$OUT/frames"

echo "=== specs ==="
"$FFPROBE" -v error -show_entries format=duration,size \
  -show_entries stream=codec_type,width,height,r_frame_rate,color_space,color_transfer,color_primaries \
  -of json "$VIDEO"

echo "=== frames ==="
"$FFPROBE" -v error -count_frames -select_streams v:0 \
  -show_entries stream=nb_read_frames -of csv=p=0 "$VIDEO"

echo "=== loudness ==="
"$FFMPEG" -hide_banner -i "$VIDEO" -af "ebur128=peak=true" -f null - 2>&1 \
  | grep -E "I:|Peak:" | tail -2

echo "=== decode ==="
"$FFMPEG" -v error -i "$VIDEO" -f null - && echo decode_ok

# Example times for the 49.25s 谅解书 edit; adjust for other cuts.
TIMES=(0.5 4.9 5.1 12.8 17.5 20.2 22.5 26.5 27.6 34.0 37.6 45.0 46.5 48.8)
for t in "${TIMES[@]}"; do
  "$FFMPEG" -y -v error -ss "$t" -i "$VIDEO" -frames:v 1 "$OUT/frames/t${t}.png"
done

echo "=== frames written ==="
ls -1 "$OUT/frames"
