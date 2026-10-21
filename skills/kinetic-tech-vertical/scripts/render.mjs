import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const val = k => args.includes(k) ? args[args.indexOf(k) + 1] : undefined;
const projectPath = val('--project');
if (!projectPath) throw Error('usage: render.mjs --project project.json [--preview --time 2.0]');

const project = JSON.parse(fs.readFileSync(path.resolve(projectPath), 'utf8'));
const root = path.resolve(project.root);
const index = project.index || 'index.html';
const width = project.width || 1080;
const height = project.height || 1920;
const fps = project.fps || 30;
const frames = Number(project.frames);
if (!Number.isInteger(frames) || frames <= 0) throw Error('project.frames must be a positive integer');

function loadPlaywright() {
  for (const base of [import.meta.url, path.join(root, 'package.json')]) {
    try {
      return createRequire(base)('playwright-core');
    } catch (e) {
      // try next base
    }
  }
  throw Error('playwright-core not found. Run `npm i playwright-core` in the project root.');
}

function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ].filter(Boolean);
  for (const file of candidates) {
    try {
      fs.accessSync(file, fs.constants.X_OK);
      return file;
    } catch (e) { /* next */ }
  }
  throw Error('No Chrome/Chromium found. Set CHROME to an executable path.');
}

const { chromium } = loadPlaywright();
const out = path.resolve(val('--out') || path.join(root, 'out', 'silent.mp4'));
const preview = args.includes('--preview');

const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml',
};
const server = http.createServer((req, res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');

let browser, enc;
const errors = [];
try {
  if (!preview && fs.existsSync(out)) throw Error('Preserve existing outputs: ' + out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  browser = await chromium.launch({
    headless: true,
    executablePath: findChrome(),
    args: ['--force-color-profile=srgb', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', e => errors.push(e.stack));
  page.on('requestfailed', r => errors.push(r.url()));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });

  await page.goto(`http://127.0.0.1:${server.address().port}/${index}`);
  await page.evaluate(async () => await window.READY);
  if (errors.length) throw Error(errors.join('\n'));

  if (preview) {
    const t = +(val('--time') ?? 1);
    await page.evaluate(async t => await window.renderAt(t), t);
    await page.screenshot({ path: out });
    console.log(JSON.stringify({ preview: out, time: t, errors }));
  } else {
    const gamma = 'scale=in_primaries=bt709:in_transfer=iec61966-2-1:in_range=full:out_primaries=bt709:out_transfer=iec61966-2-1:out_color_matrix=bt709:out_range=full,format=yuv444p,colorspace=ispace=bt709:irange=pc:iprimaries=bt709:itrc=srgb:space=bt709:range=tv:primaries=bt709:trc=bt709:format=yuv420p,sidedata=mode=delete';
    enc = spawn(process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg', [
      '-v', 'error', '-n', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0',
      '-vf', gamma, '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p',
      '-frames:v', String(frames), '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-colorspace', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', out,
    ], { stdio: ['pipe', 'ignore', 'pipe'] });
    let log = '';
    enc.stderr.on('data', d => log += d);
    const finish = once(enc, 'exit');
    for (let f = 0; f < frames; f++) {
      await page.evaluate(async t => await window.renderAt(t), f / fps);
      if (errors.length) throw Error(errors.join('\n'));
      const image = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!enc.stdin.write(image)) await once(enc.stdin, 'drain');
      if (f % 150 === 0) console.log(JSON.stringify({ seconds: +(f / fps).toFixed(1), total: frames / fps }));
    }
    enc.stdin.end();
    const [code] = await finish;
    if (code !== 0) throw Error(log);
    fs.writeFileSync(out + '.json', JSON.stringify({ frames, fps, width, height, duration_s: frames / fps, errors }, null, 2) + '\n');
    console.log(JSON.stringify({ video: out, frames, errors }));
  }
} finally {
  if (enc && !enc.killed && enc.exitCode === null) enc.kill('SIGTERM');
  if (browser) await browser.close();
  server.close();
}
