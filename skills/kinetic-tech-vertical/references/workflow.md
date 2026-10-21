# Workflow

本文件是 `kinetic-tech-vertical` 的执行细节。主入口只保留判断和停止条件；这里记录可复现命令与踩过的坑。

## 0. 开工前

1. 读项目规则：

```text
剪辑规则.md
AGENTS.md
项目内原生剪辑技能（如果存在）
```

2. 按项目规则确认本次律师姓名、执业证账号、对应素材。不要沿用历史身份。
3. 新建独立工作目录，例如：

```text
work/<YYYYMMDD>-<任务名>/
├── media/
├── asr/
├── base/frames/
├── assets/
├── out/
└── qa/
```

## 1. 预处理：先色彩，后画幅

```bash
scripts/prepare_source.sh "<source.mov>" "<workdir>"
```

脚本做三件事：

1. `ffprobe` 读 `color_transfer`；
2. 如果是 `arib-std-b67`（HLG）或 `smpte2084`（PQ），用
   `avconvert --preset Preset1920x1080` 转 SDR BT.709；
3. 统一到 1080×1920 / 30fps，并抽 16k 单声道音频。

### 为什么必须先做

律所素材常见 iPhone HLG：

```text
profile=Main 10
pix_fmt=yuv420p10le
color_space=bt2020nc
color_transfer=arib-std-b67
color_primaries=bt2020
```

直接 `ffmpeg -i source.mov -c:v libx264 ...` 会把 HLG 当 SDR：
黑位抬高、颜色发灰、皮肤发白。播放器会做 HDR→SDR 映射，所以“原片”看起来正常，
成片却像蒙了一层灰。正确做法是先把 HLG 转 SDR BT.709，再做任何美颜或包装。

验证：

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=color_space,color_transfer,color_primaries,pix_fmt \
  -of json media/source-sdr.mov
```

应为 `bt709 / bt709 / bt709 / yuv420p`。

## 2. 转写

```bash
scripts/transcribe.sh "<workdir>/audio-16k.wav" "<workdir>/asr"
```

模型：`$HOME/.cache/whisper.cpp/ggml-large-v3.bin`（可用 `WHISPER_MODEL` 覆盖）
参数：`-l zh -dtw large.v3 -nfa -oj -osrt`

输出：

- `asr/transcript.json`：分段与时间；
- `asr/transcript.srt`：初稿字幕；
- `asr/whisper.log`。

转写只作为时间对齐证据，不等于人工复听。数字、姓名、法条、否定词要人工核对；
常见错字如“判缓行 → 判缓刑”“历史事务所 → 律师事务所”。

## 3. 建剪口

先找：

- 开场静音：`silencedetect` 或第一段语音起点；
- 句间长停顿（>0.6 秒）；
- 结尾静音；
- 重复、口误、无信息量的尾巴。

写 `keeps.json`：

```json
[
  {"start": 3.35, "duration": 37.58},
  {"start": 41.55, "duration": 11.65}
]
```

```bash
scripts/build_base.py \
  --source "<workdir>/media/source-1080x1920-30fps.mp4" \
  --keeps "<workdir>/keeps.json" \
  --out "<workdir>/base/base-clean.mp4" \
  --frames "<workdir>/base/frames"
```

`build_base.py` 会：

- 用 `trim/atrim` + `concat` 重建画面和原声；
- 统一 1080×1920 / 30fps；
- 输出 30fps JPEG 帧，供 HTML 包装层逐帧读取。

注意：剪口要按帧取整；`build_base.py` 输出几帧就以几帧为准，同步更新模板的 `DURATION` / `BASE_COUNT`。字幕时间必须通过同一组 keeps 映射，不能只改视频不改字幕。
跨剪口的段要拆分：段前部属于前一段，段后部属于后一段。

## 4. 包装层

复制模板：

```bash
cp -R assets/example/* "<workdir>/"
```

模板包含：

- `index.html`：舞台、标题、整屏卡、警示条、片尾、人物条、字幕、HUD；
- `style.css`：Kinetic Tech 视觉系统；
- `app.js`：时间轴、字幕、卡片高亮、人物条显隐、片尾；
- `audio.py`：轻量音效 + 原声混音（可选）。

需要替换：

1. `DURATION`、`BASE_COUNT`；
2. `SUBS`：按新剪口映射的字幕；
3. 标题文本与强调符号；
4. 整屏卡标题、条目、出现时间和高亮时间；
5. 警示条文案与时间；
6. 片尾文案；
7. 人物条姓名/账号；
8. `base/frames` 路径（如使用美颜帧则改为对应目录）。

### 人物条

```html
<div id="personbar">
  <div class="pb-accent"></div>
  <div class="pb-name">律师：{姓名}</div>
  <div class="pb-id">律师证账号：{账号}</div>
</div>
```

CSS 要点：

- `width:540px; height:auto; padding:16px 24px 14px 26px;`
- `display:flex; flex-direction:column; justify-content:center; gap:12px;`
- 姓名 40px / 账号 28px；
- 严格两行，不换第三行；账号按字符串原样保留；
- 整屏卡和片尾隐藏，前后 0.2 秒淡出/淡入。

### 字幕

```html
<div id="subs">
  <span class="subpanel"><span id="subtext"></span></span>
</div>
```

CSS 要点：

- `#subs{left:0;right:0;bottom:560px;width:100%;text-align:center}`；
- 不要用 `left:50%` + 无宽度，否则可用宽度被压缩成一半，长句会折行；
- `.subpanel` 玻璃底、蓝色左边、左上角小括角；
- `#subtext` 54px，白色，轻微蓝色光晕；
- `max-width:1000px`，长句单行优先；必要时允许两行。

### 整屏卡

- 2×2 四宫格或三行清单；
- 所有卡片在段落开头一起出现（错开 0.06 秒），再按口播逐条高亮；
- 不要让前两秒只有一张卡、下面一大片空白；
- 高亮用边框/外发光，不改变布局；
- 整屏卡背景加 `.ins-vig` 暗角；人物画面不加。

### 暗角

只在 `.insert` 和 `#endcard` 内加 `.ins-vig` / `.end-vig`。
人物画面保持干净，只保留美颜。

## 5. 渲染

写 `project.json`：

```json
{
  "root": "/abs/path/to/workdir",
  "out": "/abs/path/to/workdir/out/final-silent.mp4",
  "index": "index.html",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "frames": 1477
}
```

```bash
node scripts/render.mjs --project project.json
# 预览
node scripts/render.mjs --project project.json --preview --time 2.0
```

要求：

- 系统 Chrome 可用；
- `playwright-core` 可解析；
- 页面暴露 `window.READY` 和 `window.renderAt(t)`；
- 用绝对路径调用 ffmpeg（Node `spawn('ffmpeg')` 在部分环境会失败）。

## 6. 混音

保留原声，只加轻量机械音效：

```bash
ffmpeg -i base/base-clean.mp4 -vn -ac 2 -ar 48000 -c:a pcm_s24le out/voice.wav
uv run --python 3.12 audio.py
ffmpeg -i out/mix-raw.wav -af "alimiter=limit=0.85:level=false:latency=true" \
  -c:a pcm_s24le out/mix.wav
ffmpeg -i out/final-silent.mp4 -i out/mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart out/final.mp4
```

响度目标：-14.5 ~ -14.8 LUFS；真峰值 -1.3 ~ -1.6 dBFS。

**不要**在 Python 里对整段做 `if peak > 0.98: mix *= ...`，这会为了防削波把整体响度拉低 3–4 dB。
把峰值交给 ffmpeg `alimiter`。

## 7. 验收与交付

```bash
scripts/qa.sh out/final.mp4 qa
```

逐项对照 `references/qa-checklist.md`。交付目录：

```text
交付/<任务名>/
├── <任务名>.mp4
├── 字幕.srt
├── 封面.png
├── 画面抽查.png
├── 本次人员确认.json
├── 人员确认记录.md
└── 剪辑说明.md
```

剪辑说明必须写清：剪口、包装、人物条、美颜是原生还是软件近似、已验证项、未完成项。
