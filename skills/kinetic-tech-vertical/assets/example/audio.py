# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy", "soundfile", "pyloudnorm"]
# ///
"""Light kinetic SFX bed under the lawyer's original voice."""
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 49.25
N = round(DUR * SR)


def norm(x):
    peak = np.max(np.abs(x))
    return x / peak if peak > 0 else x


def impact(seed, dur=0.5):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.linspace(95, 44, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 9.0)
    noise = r.normal(0, 1, n) * np.exp(-t * 28.0)
    noise = sosfilt(butter(2, 1100 / (SR / 2), btype='low', output='sos'), noise)
    return norm(body * 0.95 + noise * 0.55)


def whoosh(seed, dur=0.55):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = r.normal(0, 1, n)
    noise = sosfilt(butter(2, [260 / (SR / 2), 6800 / (SR / 2)], btype='band', output='sos'), noise)
    env = np.sin(np.pi * t / dur) ** 2
    return norm(noise * env)


def riser(seed, dur=0.65):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = r.normal(0, 1, n)
    noise = sosfilt(butter(2, 520 / (SR / 2), btype='high', output='sos'), noise)
    env = (t / dur) ** 2
    return norm(noise * env)


def tick(seed, dur=0.055):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2350 * t) * np.exp(-t * 95)
    x += r.normal(0, 1, n) * np.exp(-t * 130) * 0.35
    return norm(x)


def shimmer(seed, dur=1.1):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 1760 * t) * 0.5
         + np.sin(2 * np.pi * 2640 * t) * 0.3
         + np.sin(2 * np.pi * 3520 * t) * 0.2)
    return norm(x * np.exp(-t * 3.4))


sfx = np.zeros((N, 2), dtype=np.float64)


def add(x, at, gain, pan=0.0):
    i = max(0, int(round(at * SR)))
    if i >= N:
        return
    end = min(N, i + len(x))
    seg = x[:end - i]
    a = (pan + 1) * np.pi / 4
    sfx[i:end, 0] += seg * gain * np.cos(a)
    sfx[i:end, 1] += seg * gain * np.sin(a)


# title
add(impact(101), 0.18, 0.55, -0.05)
add(shimmer(102), 0.55, 0.12, 0.1)
add(whoosh(103), 0.82, 0.15, 0.2)

# insert 1: four factors
add(riser(201), 11.80, 0.10, -0.2)
add(impact(202), 12.25, 0.46, -0.1)
add(whoosh(203), 12.32, 0.14, 0.15)
for i, t in enumerate([12.50, 14.60, 15.90, 17.30]):
    add(tick(210 + i), t, 0.14, -0.35 + i * 0.14)
add(whoosh(204), 20.00, 0.13, 0.25)

# insert 2: three checks
add(riser(301), 21.45, 0.09, 0.2)
add(impact(302), 21.90, 0.42, 0.05)
add(whoosh(303), 21.97, 0.13, -0.15)
for i, t in enumerate([22.30, 24.30, 26.20]):
    add(tick(310 + i), t, 0.13, 0.3 - i * 0.2)
add(whoosh(304), 27.30, 0.13, -0.25)

# warning
add(impact(401), 32.85, 0.30, 0.0)
add(shimmer(402), 32.92, 0.08, 0.1)
add(whoosh(403), 37.40, 0.12, 0.2)

# end card
add(riser(501), 46.00, 0.10, -0.1)
add(impact(502), 46.40, 0.38, 0.0)
add(shimmer(503), 46.48, 0.14, 0.0)

sfx *= 0.072 / max(1e-9, np.max(np.abs(sfx)))

voice, sr = sf.read('out/voice.wav', dtype='float64')
if sr != SR:
    raise SystemExit(f'unexpected sample rate {sr}')
if voice.ndim == 1:
    voice = np.stack([voice, voice], axis=1)
if len(voice) < N:
    voice = np.pad(voice, ((0, N - len(voice)), (0, 0)))
voice = voice[:N]

mix = voice + sfx
meter = pyln.Meter(SR)
loud = meter.integrated_loudness(mix)
target = -14.5
gain = 10 ** ((target - loud) / 20)
mix *= gain
# Leave peaks above full scale; the ffmpeg limiter below catches them without
# pulling down the integrated loudness.

sf.write('out/sfx.wav', sfx, SR, subtype='FLOAT')
sf.write('out/mix-raw.wav', mix, SR, subtype='FLOAT')
print({'voice_luft': round(float(loud), 2), 'target': target, 'gain_db': round(float(20 * np.log10(gain)), 2),
       'mix_peak_dbfs': round(float(20 * np.log10(max(1e-9, np.max(np.abs(mix))))), 2)})
