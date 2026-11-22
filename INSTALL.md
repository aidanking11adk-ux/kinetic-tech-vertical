# 安装与第一条成片

`kinetic-tech-vertical` 把一条律所竖屏口播原片做成 Kinetic Tech 风格的 1080×1920 成片。这个仓库包含 Skill、可运行示例、字体/颗粒/占位 Logo 和初始化脚本。
当前执行标准为 **2026-11-22**：每版成片还必须有匹配的 HTML 视频修改器，真实验证编辑、保存重开和带音频视频导出。安装后的 AI 执行者按本片构建修改器；本包的渲染示例并不是成品编辑器。

## 1. 安装

```bash
npx -y skills add aidanking11adk-ux/kinetic-tech-vertical -g --all
```

安装后在 ZCode / 支持 Agent Skills 的客户端里新开一个会话，确认能看到 `kinetic-tech-vertical`。
已经安装的同事可重新运行同一命令，按安装器提示更新；自己的修改先备份。检查实际安装位置的 `SKILL.md` 是否包含 `2026-11-22`，以及是否有 `references/delivery-and-editor.md`、`references/native-handoff.md` 和 `templates/delivery-checklist.json`。若客户端安装在其他目录，下面命令里的 `~/.agents/skills/kinetic-tech-vertical` 改为实际位置，不照抄制作电脑路径。

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
| HTML 修改器导出环境 | 修改后带音频导出 | 按交付文档实现并测试浏览器编码/封装，或随包提供可用本地服务；不能只装渲染依赖 |
| 剪映和原生操作工具 | 可编辑草稿与八项皮肤管理 | 单独安装；见 `references/native-handoff.md`，本仓库不内置官方程序、后端或会员权限 |

## 3. 初始化项目

```bash
bash ~/.agents/skills/kinetic-tech-vertical/scripts/bootstrap_project.sh "$HOME/Documents/kinetic-video"
```

脚本会：

- 创建项目目录和 `assets/`、`base/`、`out/`；
- 复制示例 `index.html`、`style.css`、`app.js`、`audio.py`；
- 从 Skill 的 `assets/runtime/` 复制 Noto Sans SC、Geist/Geist Mono、grain、占位 Logo；
- 生成 `project.json`；
- 复制全为 pending 的 `delivery-checklist.json`，刷新模板不覆盖已有检查记录；
- 检查 node/npm/ffmpeg/ffprobe/uv/whisper/Chrome/avconvert/OpenCV；
- 在项目里安装 `playwright-core`。

项目目录非空时脚本会拒绝；`--force` 会覆盖示例工程文件，先保留自己的修改。初始化只准备渲染项目与检查表，不会自动生成本片的字幕、动画、HTML 修改器或原生草稿。

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

# 3.5) 需要软件眼下修饰时：先生成美颜帧，再做局部处理
#      natural 保留少量结构；仅明确要求完全抹平时改用 full
python3 ~/.agents/skills/kinetic-tech-vertical/scripts/undereye.py \
  --src base/frames-beauty \
  --dst base/frames-beauty-undereye \
  --level natural
# 然后把 app.js 的 base.src 指到 base/frames-beauty-undereye/

# 4) 把 app.js 的 DURATION/BASE_COUNT 和 project.json 的 frames
#    改成 build_base.py 的实际输出

# 5) 改 index.html / app.js 里的标题、卡片、字幕、人物条

# 6) 渲染
node ~/.agents/skills/kinetic-tech-vertical/scripts/render.mjs --project project.json
```

渲染输出在 `out/silent.mp4`，它没有音轨，不是最终交付。未要求 BGM/音效时直接复用剪后原声；需要音效时按本片事件修改示例 `audio.py`，再混音。以下是采用音效的路径：

```bash
ffmpeg -i base/base-clean.mp4 -vn -ac 2 -ar 48000 -c:a pcm_s24le out/voice.wav
uv run --python 3.12 audio.py
ffmpeg -i out/mix-raw.wav -af "alimiter=limit=0.85:level=false:latency=true" -c:a pcm_s24le out/mix.wav
ffmpeg -i out/silent.mp4 -i out/mix.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart out/final.mp4
```

接着必须完成：

1. 按 [HTML 修改器交付流程](skills/kinetic-tech-vertical/references/delivery-and-editor.md) 保留干净底片和最终音轨，制作本版独立文字图层、编辑界面、保存重开及导出功能。预览与导出共用本片动画和数据。
2. 按 [原生交接](skills/kinetic-tech-vertical/references/native-handoff.md) 完成约定的剪映草稿和皮肤管理；原生处理后的底片也同步到 HTML，不能配旧版本底片。
3. 按 QA 清单实际修改标题/水印和字幕，改字体/字号/颜色及字幕时间，保存重开，再导出视频；检查新文字、新时间、动画和实际声音。
4. 将最终 MP4、HTML 及必要依赖、SRT、封面、原生草稿和验收说明放在同一版本目录。更新检查表，未做的项目不标通过。

## 5. 素材与许可

`assets/runtime/` 已包含：

- `NotoSansSC.ttf`（SIL OFL 1.1）；
- `Geist-normal-600/700.woff2`、`GeistMono-normal-400/500.woff2`（SIL OFL 1.1）；
- `grain.png`（Kinetic Tech 模板，MIT）；
- `logo.png` / `logo-crop.png`：**占位 Logo**，不是任何律所的真实标志；
- `OFL-*.txt` / `TEMPLATE-LICENSE.txt`：字体与模板许可证。

发布客户视频前，把 `assets/logo.png` 和 `assets/logo-crop.png` 换成律所自己的 Logo。**不要把真实律师姓名、执业证账号、客户素材或未授权的品牌 Logo 提交到公开仓库。**

## 6. 边界

- 本包直接提供的是包装渲染工具与执行规则；完整交付还需构建并验证 HTML 修改器。剪映原生草稿和八项皮肤管理另行完成；软件美颜只是近似，缺少原生环境不能声称完整交付已完成。
- HDR/HLG 必须先转 SDR BT.709；否则黑位抬高、颜色发灰。
- 戴眼镜时全局磨皮会保留镜框、镜片和泪沟边缘，眼袋磨不掉；用 `scripts/undereye.py` 做逐帧眼下蒙版。`full` 会把眼下结构一起抹平，适合用户明确要求“完全抹平”的场景。
- 每条新片都要重新确认律师姓名/证号，重新转写、剪口、写卡片和排时间轴；示例内容是「谅解书」，不是通用文案。
- 默认不加滤镜、不变速、不换背景，不等待粗剪确认；每条至少一段内容对应整屏动画。片头标题约 0–5 秒，人名条严格两行，动画前后隐藏；具体版式见 `references/design-system.md`。
- 目前原工作流只在 macOS / 本机 ZCode 上验证；其他机器先用一条 10 秒测试素材走通转码→包装→HTML 编辑→保存重开→带音频导出，再验证原生草稿和美颜。一次安装成功不能代替这轮验收。

## 7. 自检

```bash
node --version
ffmpeg -version | head -1
ffprobe -version | head -1
ls ~/.agents/skills/kinetic-tech-vertical/SKILL.md
```

有问题时优先检查：`ffmpeg`/`ffprobe` 路径、Chrome 路径、`playwright-core` 是否装在项目里、`WHISPER_MODEL` 是否存在、HDR 源是否已转 SDR。
