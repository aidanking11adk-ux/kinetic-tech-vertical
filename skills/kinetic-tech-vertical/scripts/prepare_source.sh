#!/usr/bin/env bash
set -euo pipefail

SRC="${1:?usage: prepare_source.sh <source> <workdir>}"
WORK="${2:?usage: prepare_source.sh <source> <workdir>}"
FFMPEG="${FFMPEG:-/opt/homebrew/bin/ffmpeg}"
FFPROBE="${FFPROBE:-/opt/homebrew/bin/ffprobe}"

mkdir -p "$WORK/media"

TRANSFER="$("$FFPROBE" -v error -select_streams v:0 \
  -show_entries stream=color_transfer -of default=nw=1:nk=1 "$SRC" | head -n 1 | tr -d '[:space:],')"

SDR="$SRC"
case "$TRANSFER" in
  arib-std-b67|smpte2084|smpte428)
    echo "HDR detected ($TRANSFER) -> SDR BT.709 via avconvert"
    SDR="$WORK/media/source-sdr.mov"
    /usr/bin/avconvert --source "$SRC" --preset Preset1920x1080 --output "$SDR" --replace >/dev/null
    ;;
  *)
    echo "Source transfer: ${TRANSFER:-unknown}; treating as SDR"
    ;;
esac

# Rotate/scale to 1080x1920, 30fps, SDR BT.709; keep original audio.
"$FFMPEG" -y -v error -i "$SDR" \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -c:a aac -b:a 256k -ar 48000 \
  "$WORK/media/source-1080x1920-30fps.mp4"

"$FFMPEG" -y -v error -i "$WORK/media/source-1080x1920-30fps.mp4" \
  -vn -ac 1 -ar 16000 -c:a pcm_s16le "$WORK/audio-16k.wav"

echo "---"
"$FFPROBE" -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,color_space,color_transfer,color_primaries \
  -of default=nw=1 "$WORK/media/source-1080x1920-30fps.mp4"
echo "audio: $WORK/audio-16k.wav"
