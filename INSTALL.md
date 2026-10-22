# 安装与第一条成片

`kinetic-tech-vertical` 把一条律所竖屏口播原片做成 Kinetic Tech 风格的 1080×1920 成片。这个仓库包含 Skill、可运行示例、字体/颗粒/占位 Logo 和初始化脚本。

## 1. 安装

```bash
npx -y skills add aidanking11adk-ux/kinetic-tech-vertical -g --all
```

安装后在 ZCode / 支持 Agent Skills 的客户端里新开一个会话，确认能看到 `kinetic-tech-vertical`。

## 2. 环境要求

| 依赖 | 用途 | 备注 |
| --- | --- | --- |
| macOS | HDR→SDR、原生 `avconvert` | Linux/Windows 需改用 ffmpeg `zscale`/`tonemap`，不能照抄 |
| Node.js 18+ / npm | 逐帧渲染 | 项目内需要 `playwright-core` |
| ffmpeg / ffprobe | 转码、抽帧、混音、QA | `/opt/homebrew/bin` 或可覆盖 `FFMPEG`/`FFPROBE` |
| Chrome / Chromium | HTML 逐帧截图 | 设置 `CHROME` 或安装到默认路径 |
| uv | 运行 `audio.py` 混音 | 可选；不加音效时不需要 |
| whisper-cli + `ggml-large-v3` | 本地转写 | 可选；模型约 3GB，设置 `WHISPER_MODEL` |
| Python 3.11+ | `adapter`/脚本 | `build_base.py` 用系统 Python 即可 |
| Python + OpenCV + numpy | 戴眼镜/眼袋的眼下局部修饰 | `scripts/undereye.py`；`python3 -m pip install opencv-python-headless numpy` 或 `uv run --with ...` |

## 3. 初始化项目

```bash
bash ~/.agents/skills/kinetic-tech-vertical/scripts/bootstrap_project.sh "$HOME/Documents/kinetic-video"
```

脚本会：

- 创建项目目录和 `assets/`、`base/`、`out/`；
- 复制示例 `index.html`、`style.css`、`app.js`、`audio.py`；
- 从 Skill 的 `assets/runtime/` 复制 Noto Sans SC、Geist/Geist Mono、grain、占位 Logo；
- 生成 `project.json`；
- 检查 node/npm/ffmpeg/ffprobe/uv/whisper/Chrome/avconvert/OpenCV；
- 在项目里安装 `playwright-core`。

项目目录非空时脚本会拒绝；确认要覆盖时加 `--force`。

## 4. 第一条片

```bash
cd "$HOME/Documents/kinetic-video"

# 1) 源片 -> SDR / 1080x1920 / 30fps
~/.agents/skills/kinetic-tech-vertical/scripts/prepare_source.sh "/path/to/source.mov" .

# 2) 本地转写（可选，但剪辑建议有）
~/.agents/skills/kinetic-tech-vertical/scripts/transcribe.sh audio-16k.wav asr

# 3) 写 keeps.json，按语义剪口建底板和帧
~/.agents/skills/kinetic-tech-vertical/scripts/build_base.py \
  --source media/source-1080x1920-30fps.mp4 \
  --keeps keeps.json \
  --out base/base-clean.mp4 \
  --frames base/frames

# 3.5) 戴眼镜/眼袋明显：先生成美颜帧，再做逐帧眼下局部修饰
#      （full = 完全抹平；natural = 保留少量结构）
python3 ~/.agents/skills/kinetic-tech-vertical/scripts/undereye.py \
  --src base/frames-beauty \
  --dst base/frames-beauty-undereye \
  --level full
# 然后把 app.js 的 base.src 指到 base/frames-beauty-undereye/

# 4) 把 app.js 的 DURATION/BASE_COUNT 和 project.json 的 frames
#    改成 build_base.py 的实际输出

# 5) 改 index.html / app.js 里的标题、卡片、字幕、人物条

# 6) 渲染
node ~/.agents/skills/kinetic-tech-vertical/scripts/render.mjs --project project.json
```

渲染输出在 `out/silent.mp4`。混音用示例 `audio.py`，再 mux 原声：

```bash
ffmpeg -i base/base-clean.mp4 -vn -ac 2 -ar 48000 -c:a pcm_s24le out/voice.wav
uv run --python 3.12 audio.py
ffmpeg -i out/mix-raw.wav -af "alimiter=limit=0.85:level=false:latency=true" -c:a pcm_s24le out/mix.wav
ffmpeg -i out/silent.mp4 -i out/mix.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart out/final.mp4
```

## 5. 素材与许可

`assets/runtime/` 已包含：

- `NotoSansSC.ttf`（SIL OFL 1.1）；
- `Geist-normal-600/700.woff2`、`GeistMono-normal-400/500.woff2`（SIL OFL 1.1）；
- `grain.png`（Kinetic Tech 模板，MIT）；
- `logo.png` / `logo-crop.png`：**占位 Logo**，不是任何律所的真实标志；
- `OFL-*.txt` / `TEMPLATE-LICENSE.txt`：字体与模板许可证。

发布客户视频前，把 `assets/logo.png` 和 `assets/logo-crop.png` 换成律所自己的 Logo。**不要把真实律师姓名、执业证账号、客户素材或未授权的品牌 Logo 提交到公开仓库。**

## 6. 边界

- 输出是渲染好的 MP4；**不是剪映原生可编辑草稿**，也不包含剪映原生 8 项皮肤管理。软件美颜只是近似。
- HDR/HLG 必须先转 SDR BT.709；否则黑位抬高、颜色发灰。
- 戴眼镜时全局磨皮会保留镜框、镜片和泪沟边缘，眼袋磨不掉；用 `scripts/undereye.py` 做逐帧眼下蒙版。`full` 会把眼下结构一起抹平，适合用户明确要求“完全抹平”的场景。
- 每条新片都要重新确认律师姓名/证号，重新转写、剪口、写卡片和排时间轴；示例内容是「谅解书」，不是通用文案。
- 目前只在 macOS / 本机 ZCode 上做过行为与安装验证；其他机器请先用一条 10 秒测试素材走通 HDR→预览→QA。

## 7. 自检

```bash
node --version
ffmpeg -version | head -1
ffprobe -version | head -1
ls ~/.agents/skills/kinetic-tech-vertical/SKILL.md
```

有问题时优先检查：`ffmpeg`/`ffprobe` 路径、Chrome 路径、`playwright-core` 是否装在项目里、`WHISPER_MODEL` 是否存在、HDR 源是否已转 SDR。
