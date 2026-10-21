---
name: kinetic-tech-vertical
description: 把律所竖屏口播原片做成 Kinetic Tech（酷炫科技风）1080×1920 成片；处理 HDR/HLG→SDR、语义剪口、科技感字幕、人名条、整屏卡片与片尾，并完成渲染、混音和验收。当用户提供一条律所竖屏口播原片，要求按文案剪成 45–55 秒、保留律师出镜和原声、使用 Kinetic Tech 包装时使用；不适用于横屏、多机位或需要剪映原生草稿的任务。
---

# kinetic-tech-vertical

把一条未剪辑的律所口播原片，按文案语义剪成 45–55 秒竖屏成片，保留律师出镜和原声，用 Kinetic Tech 包装层完成标题、要点卡、警示条、片尾和人物条。

## 适用与边界

**适用**：单律师、单机位、竖屏或可旋转为竖屏的口播原片；需要 1080×1920 成片和科技风包装。

**不适用**：横屏成片、多机位剪辑、纯文字模板片、需要剪映原生可编辑草稿或原生美颜（另行处理）。

**开工前必读**：项目内 `剪辑规则.md`、`AGENTS.md`（如果存在）。确认本次律师姓名、执业证账号和对应素材；未确认不进入正式导出。

## 硬门槛（顺序不能反）

1. **先查色彩**。`ffprobe` 看 `color_transfer`；`arib-std-b67`（HLG）或 `smpte2084`（PQ）必须先 `avconvert --preset Preset1920x1080` 转 SDR BT.709，再做剪切、美颜、包装。把 HDR 当 SDR 会抬高黑位、褪色发灰，是本流程最大的返工来源。
2. **再统一画幅**。1080×1920 / 30fps；保留源片旋转信息。
3. **再转写、剪口、包装、美颜**。
4. **最后必须抽帧和测音频验收**。命令成功、能解码，都不等于字幕、人物条、卡片和音画同步正确。

## 流程

1. 预处理：`scripts/prepare_source.sh <源片> <workdir>`
2. 转写：`scripts/transcribe.sh <workdir>/audio-16k.wav <workdir>/asr`
3. 建剪口：写 `keeps.json`（`[{"start":3.35,"duration":37.58}, ...]`），运行 `scripts/build_base.py`
4. 包装：运行 `scripts/bootstrap_project.sh <project>`（复制示例和 `assets/runtime/` 素材），按文案替换标题、字幕、卡片和人物条；规则见 `references/design-system.md`
5. 渲染：写 `project.json`，运行 `scripts/render.mjs --project project.json`
6. 混音：以 `assets/example/audio.py` 为底改事件时间；或保留原声直接 mux
7. 验收：`scripts/qa.sh <成片> <qa目录>`，对照 `references/qa-checklist.md`
8. 交付：MP4、SRT、封面、画面抽查、人员确认、剪辑说明

## 运行素材

`assets/runtime/` 已包含 Noto Sans SC、Geist/Geist Mono、grain、占位 `logo.png`/`logo-crop.png` 和许可证。`scripts/bootstrap_project.sh` 会把它们复制到项目 `assets/`。占位 Logo 必须换成律所自己的；许可证在 `assets/runtime/`。

## 版式要点

- **字幕**：54px 玻璃科技条，距底约 560px（画面中下方），`max-width:1000px`，单行优先；不要白字黑边。
- **人名条**：540px 宽、自动高度；姓名 40px、账号 28px、行距 12px，两行填满黑框；严格两行；整屏卡和片尾隐藏。
- **整屏卡**：2×2 或清单；先整体出现，再按口播逐条高亮，避免前两秒空白。
- **暗角**：只在整屏卡和片尾；人物画面只用美颜，不加暗角。
- **标题**：0–5 秒；金属字 + 金色强调（如 `≠`）；不压脸。
- **美颜**：软件双边平滑是近似，不是原生。剪映原生 8 项数值（磨皮37、美白42、均肤52、丰盈52、祛斑祛痘47、去法令纹47、祛黑眼圈47、清晰47）必须 UI 逐项应用；没做就明确说没做。

## 停止条件

- HDR→SDR 转换失败或无法验证；
- 律师身份未确认；
- 成片抽帧或音频验收不通过；
- 用户要求原生剪映美颜或可编辑草稿，而当前没有 UI 条件。

## 参考

- `references/workflow.md`：完整命令、剪口映射、渲染和混音细节。
- `references/design-system.md`：字体、间距、时间轴、卡片和暗角规则。
- `references/qa-checklist.md`：逐项验收清单。
- 可运行示例：`assets/example/`（谅解书，49.25 秒）。
