/* Kinetic Tech packaging for the 49.25s "谅解书" cut. */
const FPS = 30;
const DURATION = 49.25;
const BASE_COUNT = 1477;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const pr = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeExpo = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const $ = id => document.getElementById(id);
const subText = $('subtext');
const base = $('base'), brand = $('brand'), subsEl = $('subs'), tc = $('tc');
const title = $('title'), tl1 = $('tl1'), tl2 = $('tl2');
const ins1 = $('ins1'), ins2 = $('ins2'), warn = $('warn'), endcard = $('endcard');
const bar = $('personbar'), ticksEl = $('ticks'), railDot = $('railDot');
const fx = $('fx'), ctx = fx.getContext('2d');

const SUBS = [
  [0.00, 1.55, '对方出具了谅解书'],
  [1.55, 2.99, '案件就一定没事'],
  [2.99, 4.69, '或者一定能判缓刑吗'],
  [4.69, 6.11, '不能这样理解'],
  [6.11, 7.47, '取得谅解'],
  [7.47, 10.41, '当然有可能对案件处理产生有利影响'],
  [10.41, 12.51, '但是它的具体作用'],
  [12.51, 14.61, '要结合案件的性质'],
  [14.61, 15.93, '造成的后果'],
  [15.93, 17.29, '当事人的行为'],
  [17.29, 20.11, '以及其他量刑情节来进行判断'],
  [20.11, 22.31, '在拿到谅解书以后'],
  [22.31, 24.31, '还需要核对出具人'],
  [24.31, 27.41, '具体内容和相关赔偿履行情况'],
  [27.41, 29.69, '依法向办案机关提交'],
  [29.69, 31.37, '结合案件说明'],
  [31.37, 32.79, '它能够证明什么'],
  [32.79, 35.33, '谅解书绝对不能替代'],
  [35.33, 37.55, '对全案事实和证据的分析'],
  [37.58, 38.47, '如果你的家人'],
  [38.47, 39.93, '已经取得对方谅解'],
  [39.93, 42.57, '却不知道下一步应该怎样提交'],
  [42.57, 44.25, '谅解书怎样使用'],
  [44.25, 46.47, '可以联系本所'],
  [46.47, 47.37, '进行咨询']
].map(([s, e, t]) => ({ s, e, t }));

const F1 = [12.50, 14.60, 15.90, 17.30];
const F2 = [22.30, 24.30, 26.20];

function addChars(el, text) {
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'ch';
    span.textContent = ch;
    el.appendChild(span);
  }
}
addChars(tl1, '谅解书');
const neq = document.createElement('span');
neq.className = 'ch neq';
neq.textContent = '≠';
tl2.appendChild(neq);
addChars(tl2, '没事');

for (let i = 0; i < 44; i++) ticksEl.appendChild(document.createElement('span'));
const tickSpans = [...ticksEl.children];

let shownFrame = -1;
async function showFrame(i) {
  if (i === shownFrame) return;
  base.src = `base/frames-beauty-strong/${String(i + 1).padStart(5, '0')}.jpg`;
  try { await base.decode(); }
  catch (e) { await new Promise(r => { base.onload = r; base.onerror = r; }); }
  shownFrame = i;
}

function showEl(el, t, start, dist = 50, dur = 0.42) {
  const p = pr(t, start, start + dur);
  const e = easeOut(p);
  el.style.opacity = p;
  el.style.visibility = p > 0.002 ? 'visible' : 'hidden';
  el.style.transform = `translateY(${((1 - e) * dist).toFixed(2)}px)`;
}

function renderTitle(t) {
  if (t >= 5.06) { title.style.opacity = 0; return; }
  const fade = 1 - pr(t, 4.66, 5.02);
  title.style.opacity = fade;
  title.style.transform = `translateY(${(-9 * (1 - fade)).toFixed(2)}px)`;
  const spans = [...tl1.children, ...tl2.children];
  spans.forEach((sp, i) => {
    const start = 0.06 + i * 0.045;
    const p = pr(t, start, start + 0.34);
    const e = easeExpo(p);
    sp.style.opacity = p;
    sp.style.transform = `translateY(${((1 - e) * 72).toFixed(2)}px) scale(${(1 + (1 - p) * 0.14).toFixed(3)})`;
  });
  document.querySelector('.title-rule').style.width = `${(pr(t, 0.35, 1.15) * 300).toFixed(1)}px`;
}

function renderInsert1(t) {
  const on = t >= 12.25 && t < 20.11;
  if (!on) { ins1.style.display = 'none'; ins1.style.opacity = 0; return; }
  ins1.style.display = 'block';
  ins1.style.opacity = Math.min(pr(t, 12.25, 12.42), 1 - pr(t, 19.92, 20.11));
  showEl($('ins1-badge'), t, 12.28, 30, 0.3);
  showEl($('ins1-title'), t, 12.30, -30, 0.35);
  showEl($('ins1-sub'), t, 12.36, 30, 0.35);
  const act1 = F1.filter(x => t >= x).length - 1;
  [$('fc1'), $('fc2'), $('fc3'), $('fc4')].forEach((c, i) => {
    const st = 12.45 + i * 0.06;
    const p = pr(t, st, st + 0.36);
    const e = easeOut(p);
    c.style.opacity = (p * (i <= act1 || act1 < 0 ? 1 : 0.7)).toFixed(3);
    c.style.visibility = p > 0.002 ? 'visible' : 'hidden';
    c.style.transform = `translateY(${((1 - e) * 30).toFixed(2)}px)`;
    c.classList.toggle('active', i === act1);
  });
  showEl($('ins1-foot'), t, 17.90, 24, 0.4);
}

function renderInsert2(t) {
  const on = t >= 21.90 && t < 27.41;
  if (!on) { ins2.style.display = 'none'; ins2.style.opacity = 0; return; }
  ins2.style.display = 'block';
  ins2.style.opacity = Math.min(pr(t, 21.90, 22.06), 1 - pr(t, 27.22, 27.41));
  showEl($('ins2-badge'), t, 21.93, 30, 0.3);
  showEl($('ins2-title'), t, 21.95, -30, 0.35);
  showEl($('ins2-sub'), t, 22.01, 30, 0.35);
  const act2 = F2.filter(x => t >= x).length - 1;
  [$('ck1'), $('ck2'), $('ck3')].forEach((c, i) => {
    const st = 22.00 + i * 0.06;
    const p = pr(t, st, st + 0.34);
    const e = easeOut(p);
    c.style.opacity = (p * (i <= act2 || act2 < 0 ? 1 : 0.7)).toFixed(3);
    c.style.visibility = p > 0.002 ? 'visible' : 'hidden';
    c.style.transform = `translateY(${((1 - e) * 30).toFixed(2)}px)`;
    c.classList.toggle('active', i === act2);
  });
  showEl($('ins2-foot'), t, 26.30, 24, 0.35);
}

function renderWarn(t) {
  const on = t >= 32.85 && t < 37.55;
  if (!on) { warn.style.display = 'none'; warn.style.opacity = 0; return; }
  warn.style.display = 'flex';
  const p = Math.min(pr(t, 32.85, 33.10), 1 - pr(t, 37.30, 37.55));
  warn.style.opacity = p;
  const e = easeOut(pr(t, 32.85, 33.25));
  warn.style.transform = `translateX(${((1 - e) * -70).toFixed(2)}px)`;
}

function renderEndcard(t) {
  const on = t >= 46.40;
  if (!on) { endcard.style.display = 'none'; endcard.style.opacity = 0; return; }
  endcard.style.display = 'block';
  endcard.style.opacity = pr(t, 46.40, 46.70).toFixed(3);
  brand.style.opacity = 0;
}

function renderBar(t) {
  let o = pr(t, 0, 0.30);
  if (t >= 12.05 && t < 27.60) o = Math.min(o, 1 - pr(t, 12.05, 12.25), pr(t, 27.40, 27.60));
  if (t >= 46.20) o = Math.min(o, 1 - pr(t, 46.20, 46.40));
  bar.style.opacity = o.toFixed(3);
}

let subIndex = -2;
function renderSubs(t) {
  if (t >= 46.40) { subsEl.style.opacity = 0; subIndex = -1; return; }
  if (t >= 32.85 && t < 37.55) { subsEl.style.opacity = 0; subIndex = -1; return; }
  let idx = -1;
  for (let i = 0; i < SUBS.length; i++) {
    if (t >= SUBS[i].s && t < SUBS[i].e) { idx = i; break; }
  }
  if (idx < 0) { subsEl.style.opacity = 0; subIndex = -1; return; }
  if (idx !== subIndex) { subText.textContent = SUBS[idx].t; subIndex = idx; }
  const s = SUBS[idx];
  subsEl.style.opacity = Math.min(pr(t, s.s, s.s + 0.08), 1 - pr(t, s.e - 0.08, s.e));
}

function timecode(t) {
  const totalFrames = Math.round(t * FPS);
  const ff = totalFrames % FPS;
  const totalSeconds = Math.floor(totalFrames / FPS);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60) % 60;
  const hh = Math.floor(totalSeconds / 3600);
  const p = n => String(n).padStart(2, '0');
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`;
}

function renderHUD(t) {
  tc.textContent = timecode(t);
  const active = Math.floor(t / DURATION * 44);
  tickSpans.forEach((s, i) => s.className = i <= active ? 'on' : '');
  railDot.style.top = `${(210 + (t / DURATION) * 1320).toFixed(1)}px`;
}

function sparkBurst(t0, t, cx, cy, seed, n = 28, life = 0.8) {
  const dt = t - t0;
  if (dt < 0 || dt > life) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = hash(seed + i * 3.1) * Math.PI * 2;
    const sp = 150 + hash(seed + i * 7.7 + 2) * 500;
    const g = 420;
    const x = cx + Math.cos(a) * sp * dt;
    const y = cy + Math.sin(a) * sp * dt + 0.5 * g * dt * dt;
    const al = Math.max(0, 1 - dt / life) * (0.35 + hash(seed + i) * 0.65);
    const r = 1 + hash(seed + i * 5.3) * 2.1;
    ctx.fillStyle = i % 4 === 0 ? `rgba(245,185,46,${al})` : `rgba(190,215,255,${al})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawFX(t) {
  ctx.clearRect(0, 0, 1080, 1920);
  for (let i = 0; i < 52; i++) {
    const x = (hash(i * 2.3) * 1080 + t * (4 + hash(i + 9) * 7)) % 1080;
    const y = (hash(i * 5.1 + 4) * 1920 - t * (7 + hash(i + 3) * 10) + 3840) % 1920;
    const a = 0.018 + hash(i + 21) * 0.05;
    ctx.fillStyle = `rgba(180,205,235,${a})`;
    ctx.beginPath(); ctx.arc(x, y, 0.8 + hash(i + 7) * 1.8, 0, Math.PI * 2); ctx.fill();
  }
  sparkBurst(0.18, t, 540, 360, 11, 32, 0.95);
  sparkBurst(12.30, t, 300, 480, 23, 24, 0.75);
  sparkBurst(21.95, t, 540, 480, 37, 24, 0.75);
  sparkBurst(46.45, t, 540, 420, 51, 30, 0.9);
}

window.renderAt = async function (t) {
  const frame = Math.min(BASE_COUNT - 1, Math.floor(t * FPS + 1e-6));
  renderTitle(t);
  renderInsert1(t);
  renderInsert2(t);
  renderWarn(t);
  renderEndcard(t);
  if (t < 46.40) brand.style.opacity = 1;
  renderBar(t);
  renderSubs(t);
  renderHUD(t);
  drawFX(t);
  const fl = Math.max(0, 1 - pr(t, 12.25, 12.42)) * (t >= 12.25 ? 0.045 : 0)
    + Math.max(0, 1 - pr(t, 21.90, 22.06)) * (t >= 21.90 ? 0.04 : 0)
    + Math.max(0, 1 - pr(t, 46.40, 46.62)) * (t >= 46.40 ? 0.05 : 0);
  $('flash').style.opacity = fl.toFixed(3);
  $('fade').style.opacity = pr(t, 48.92, 49.25).toFixed(3);
  await showFrame(frame);
  await new Promise(r => requestAnimationFrame(r));
};

window.READY = (async () => {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('900 40px PuHuiTi', '字ABC0123'),
    document.fonts.load('700 40px PuHuiTi', '字ABC0123'),
    document.fonts.load('500 20px "Geist Mono"', '字ABC0123'),
    document.fonts.load('700 20px Geist', '字ABC0123')
  ]);
  if (!brand.complete) await new Promise(r => { brand.onload = r; brand.onerror = r; });
  try { await brand.decode(); } catch (e) {}
  await showFrame(0);
  document.title = 'done';
})();
