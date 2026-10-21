# kinetic-tech-vertical

把律所竖屏口播原片做成 Kinetic Tech（酷炫科技风）1080×1920 成片；处理 HDR/HLG→SDR、语义剪口、科技感字幕、人名条、整屏卡片与片尾，并完成渲染、混音和验收。当用户提供一条律所竖屏口播原片，要求按文案剪成 45–55 秒、保留律师出镜和原声、使用 Kinetic Tech 包装时使用；不适用于横屏、多机位或需要剪映原生草稿的任务。

## 安装

```bash
npx -y skills add <aidanking11adk-uxkinetic-tech-vertical -g --all
```

把 `<your-gaidanking11adk-ux所有者。

## 使用

安装后，可以这样开始：

> 使用 $kinetic-tech-vertical 把这条律所口播原片剪成 Kinetic Tech 竖屏成片，并完成抽帧和音频验收。

## 运行依赖

- macOS（HDR/HLG→SDR 使用系统 `avconvert`；其他平台需改用 ffmpeg `zscale`/`tonemap`）
- ffmpeg / ffprobe
- Node.js 18+ 与 `playwright-core`，以及本机 Chrome/Chromium
- Whisper CLI + `ggml-large-v3`（可选，用于转写）
- uv（可选，用于运行 `audio.py` 混音）

## 隐私

模板中的人名条和片尾使用占位符；使用前替换为你方信息。不要提交真实律师姓名、执业证账号、客户素材、Logo 或转写稿。

## 内容

本仓库只发布运行这个 Skill 所需的文件。本地评测样本、预期答案和运行记录不包含在公开包中。
