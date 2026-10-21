#!/usr/bin/env python3
"""Build a clean cut from a keep list and extract 30fps JPEG frames."""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

FFMPEG = os.environ.get("FFMPEG", "/opt/homebrew/bin/ffmpeg")
FFPROBE = os.environ.get("FFPROBE", "/opt/homebrew/bin/ffprobe")


def run(cmd):
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="Normalized 1080x1920 30fps SDR mp4")
    ap.add_argument("--keeps", required=True, help='JSON list: [{"start":3.35,"duration":37.58}]')
    ap.add_argument("--out", required=True, help="Output clean-cut mp4")
    ap.add_argument("--frames", required=True, help="Output frame directory")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1920)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    source = Path(args.source).resolve()
    keeps = json.loads(Path(args.keeps).read_text(encoding="utf-8"))
    out = Path(args.out).resolve()
    frames = Path(args.frames).resolve()

    if not source.is_file():
        sys.exit(f"source not found: {source}")
    if not keeps:
        sys.exit("keeps is empty")
    if out.exists() and not args.force:
        sys.exit(f"output exists (use --force): {out}")
    if frames.exists() and any(frames.iterdir()) and not args.force:
        sys.exit(f"frames directory is not empty (use --force): {frames}")

    parts, labels = [], []
    for i, k in enumerate(keeps):
        start = float(k["start"])
        duration = float(k["duration"]) if "duration" in k else float(k["end"]) - start
        if duration <= 0:
            sys.exit(f"invalid keep #{i}: {k}")
        parts.append(
            f"[0:v]trim=start={start}:duration={duration},setpts=PTS-STARTPTS,fps={args.fps}[v{i}];"
            f"[0:a]atrim=start={start}:duration={duration},asetpts=PTS-STARTPTS[a{i}]"
        )
        labels.append(f"[v{i}][a{i}]")

    chain = (
        ";".join(parts)
        + ";"
        + "".join(labels)
        + f"concat=n={len(keeps)}:v=1:a=1[v][a];"
        + f"[v]scale={args.width}:{args.height}:force_original_aspect_ratio=decrease,"
        + f"pad={args.width}:{args.height}:(ow-iw)/2:(oh-ih)/2,setsar=1[vout];"
        + "[a]aresample=48000[aout]"
    )

    out.parent.mkdir(parents=True, exist_ok=True)
    run([
        FFMPEG, "-y", "-v", "error", "-i", str(source),
        "-filter_complex", chain,
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
        "-r", str(args.fps), "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
        str(out),
    ])

    frames.mkdir(parents=True, exist_ok=True)
    run([FFMPEG, "-y", "-v", "error", "-i", str(out), "-vf", f"fps={args.fps}", "-q:v", "2", str(frames / "%05d.jpg")])

    duration = subprocess.check_output([
        FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)
    ], text=True).strip()
    count = len(list(frames.glob("*.jpg")))
    print(json.dumps({
        "base": str(out),
        "frames_dir": str(frames),
        "duration_s": float(duration),
        "frames": count,
        "fps": args.fps,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
