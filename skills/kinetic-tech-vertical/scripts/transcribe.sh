#!/usr/bin/env bash
set -euo pipefail

WAV="${1:?usage: transcribe.sh <audio-16k.wav> <outdir>}"
OUT="${2:?usage: transcribe.sh <audio-16k.wav> <outdir>}"
WHISPER="${WHISPER:-/opt/homebrew/bin/whisper-cli}"
MODEL="${WHISPER_MODEL:-$HOME/.cache/whisper.cpp/ggml-large-v3.bin}"

mkdir -p "$OUT"
"$WHISPER" -m "$MODEL" -f "$WAV" -l zh -dtw large.v3 -nfa \
  -oj -osrt -of "$OUT/transcript" > "$OUT/whisper.log" 2>&1

echo "$OUT/transcript.json"
echo "$OUT/transcript.srt"
