#!/usr/bin/env python3
"""Per-frame under-eye retouch for talking-head footage (especially glasses).

Why this exists
---------------
A global bilateral/"skin smoothing" pass smooths texture but preserves the
strong edges of glasses frames, lenses and the tear trough. Under-eye bags are
mostly a low-frequency shadow, so global smoothing either does nothing or makes
the bag stand out after the surrounding skin gets brighter. This script builds
a soft mask below each eye and flattens the low-frequency luminance inside it,
lifts it slightly and desaturates the shadow, while keeping the lens rim sharp.

Profiles
--------
natural : keeps some under-eye structure (subtle, everyday beauty).
full    : removes the bag structure ("完全抹平"); stronger low-frequency
          replacement and lift. Glasses should still stay sharp.

Usage
-----
python3 scripts/undereye.py \
  --src base/frames-beauty \
  --dst base/frames-beauty-undereye \
  --level full

Then point app.js at the new frame directory and render.

Dependencies: opencv-python(-headless), numpy.
If the system Python lacks cv2:
  uv run --with opencv-python-headless --with numpy python scripts/undereye.py ...
"""
import argparse
import json
import math
import os
import sys
import time

try:
    import cv2
    import numpy as np
except ImportError as exc:
    sys.exit(
        "Missing OpenCV/numpy. Install with:\n"
        "  python3 -m pip install opencv-python-headless numpy\n"
        "or run with:\n"
        "  uv run --with opencv-python-headless --with numpy python scripts/undereye.py ...\n"
        f"Original error: {exc}"
    )


PROFILES = {
    "natural": {
        "mask_w": 0.155,
        "mask_h": 0.067,
        "feather": 0.026,
        "blur": 5.0,
        "blend": 0.50,
        "lift": 0.22,
        "desat_a": 0.18,
        "desat_b": 0.12,
    },
    "full": {
        "mask_w": 0.165,
        "mask_h": 0.078,
        "feather": 0.030,
        "blur": 10.0,
        "blend": 0.96,
        "lift": 0.30,
        "desat_a": 0.32,
        "desat_b": 0.20,
    },
}

IMAGE_EXTS = (".jpg", ".jpeg", ".png")


def detect_box(detector, image, scale_factor, min_neighbors, min_face):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = detector.detectMultiScale(
        gray, scaleFactor=scale_factor, minNeighbors=min_neighbors,
        minSize=(min_face, min_face),
    )
    if len(faces) == 0:
        return None
    return max(faces, key=lambda r: r[2] * r[3])


def smooth_box(prev, raw):
    """Follow the face, but reset immediately on a shot change / large jump."""
    if raw is None:
        return prev
    raw = np.asarray(raw, dtype=np.float32)
    if prev is None:
        return raw
    pcx, pcy = prev[0] + prev[2] / 2, prev[1] + prev[3] / 2
    rcx, rcy = raw[0] + raw[2] / 2, raw[1] + raw[3] / 2
    jump = math.hypot(rcx - pcx, rcy - pcy)
    width_diff = abs(raw[2] - prev[2]) / max(1.0, prev[2])
    if jump > 0.09 * prev[2] or width_diff > 0.07:
        return raw
    return 0.35 * raw + 0.65 * prev


def build_mask(shape, box, profile):
    x, y, w, h = box
    mask = np.zeros(shape[:2], dtype=np.uint8)
    axes = (max(2, int(round(profile["mask_w"] * w))),
            max(2, int(round(profile["mask_h"] * h))))
    for fx in (0.319, 0.687):
        center = (int(round(x + fx * w)), int(round(y + 0.513 * h)))
        cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
    sigma = max(6.0, profile["feather"] * w)
    return cv2.GaussianBlur(mask, (0, 0), sigma)


def retouch(image, mask, profile):
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB).astype(np.float32)
    light, a, b = cv2.split(lab)
    m = mask.astype(np.float32) / 255.0
    low = cv2.GaussianBlur(light, (0, 0), profile["blur"])
    light = light * (1.0 - profile["blend"] * m) + low * (profile["blend"] * m)
    light = light + (255.0 - light) * profile["lift"] * m
    a = a * (1.0 - profile["desat_a"] * m) + 128.0 * (profile["desat_a"] * m)
    b = b * (1.0 - profile["desat_b"] * m) + 128.0 * (profile["desat_b"] * m)
    out = np.dstack([light, a, b]).clip(0, 255).astype(np.uint8)
    return cv2.cvtColor(out, cv2.COLOR_LAB2BGR)


def main():
    ap = argparse.ArgumentParser(description="Per-frame under-eye retouch for glasses/eye bags.")
    ap.add_argument("--src", required=True, help="Input frame directory")
    ap.add_argument("--dst", required=True, help="Output frame directory")
    ap.add_argument("--level", choices=sorted(PROFILES), default="full",
                    help="natural keeps some structure; full flattens the bag")
    ap.add_argument("--quality", type=int, default=95, help="JPEG quality (1-100)")
    ap.add_argument("--face-scale", type=float, default=1.08)
    ap.add_argument("--min-neighbors", type=int, default=5)
    ap.add_argument("--min-face", type=int, default=250)
    ap.add_argument("--limit", type=int, default=0, help="Only process first N frames (debug)")
    ap.add_argument("--force", action="store_true", help="Allow writing into a non-empty dst")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    profile = PROFILES[args.level]
    if not os.path.isdir(args.src):
        sys.exit(f"src not found: {args.src}")
    os.makedirs(args.dst, exist_ok=True)
    existing = [f for f in os.listdir(args.dst) if f.lower().endswith(IMAGE_EXTS)]
    if existing and not args.force:
        sys.exit(f"dst is not empty ({len(existing)} images); use --force to overwrite")

    detector = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    if detector.empty():
        sys.exit("OpenCV Haar cascade not found")

    files = sorted(f for f in os.listdir(args.src) if f.lower().endswith(IMAGE_EXTS))
    if args.limit:
        files = files[:args.limit]
    if not files:
        sys.exit(f"no images in {args.src}")

    prev = None
    missing = 0
    no_face = 0
    boxes = {}
    started = time.time()
    for n, name in enumerate(files, 1):
        image = cv2.imread(os.path.join(args.src, name))
        if image is None:
            sys.exit(f"cannot read {name}")
        raw = detect_box(detector, image, args.face_scale, args.min_neighbors, args.min_face)
        if raw is None:
            missing += 1
        box = smooth_box(prev, raw)
        if box is None:
            no_face += 1
            out = image
        else:
            prev = box
            boxes[name] = [round(float(v), 2) for v in box]
            out = retouch(image, build_mask(image.shape, box, profile), profile)
        params = [int(cv2.IMWRITE_JPEG_QUALITY), args.quality] if name.lower().endswith((".jpg", ".jpeg")) else []
        cv2.imwrite(os.path.join(args.dst, name), out, params)
        if not args.quiet and n % 200 == 0:
            print(json.dumps({
                "done": n, "total": len(files), "missing_face": missing,
                "elapsed_s": round(time.time() - started, 1),
            }), flush=True)

    print(json.dumps({
        "src": os.path.abspath(args.src),
        "dst": os.path.abspath(args.dst),
        "level": args.level,
        "frames": len(files),
        "missing_face_frames": missing,
        "no_face_frames": no_face,
        "elapsed_s": round(time.time() - started, 1),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
