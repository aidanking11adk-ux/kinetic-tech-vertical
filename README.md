# kinetic-tech-vertical

把律师知识口播原片做成 Kinetic Tech（科技风）1080×1920 成片，保留律师出镜和原声，按语义精剪，添加标题、字幕、人名条及内容对应的整屏动画。片长服从完整意思，不固定为 45–55 秒。

**2026-11-22 标准：每版同时交付 MP4 和匹配的 HTML 视频修改器。**后加文字、水印文字和字幕必须独立可编辑，支持改文字、字体、字号、颜色和字幕时间，并实际验证保存重开及带音频视频导出。不是只提供一个预览页面或 SRT。

原生剪映草稿和八项皮肤管理另需剪映及可用的原生工具；本包不内置后端，也不把软件近似当作原生完成。完整清单见 [交付标准](skills/kinetic-tech-vertical/references/delivery-and-editor.md) 和 [原生交接](skills/kinetic-tech-vertical/references/native-handoff.md)。

## 安装

```bash
npx -y skills add aidanking11adk-ux/kinetic-tech-vertical -g --all
```

更完整的依赖、素材和第一条片流程见 [INSTALL.md](INSTALL.md)。
已有安装可重新执行上面的命令，按安装器提示更新，并新开客户端会话。确认安装后的 `SKILL.md` 显示 `2026-11-22` 标准以及 `references/delivery-and-editor.md`；先备份自己改过的技能文件。

## 使用

安装后，可以这样开始：

> 使用 $kinetic-tech-vertical 按律师口播标准剪辑本次素材。先确认人员信息，不加滤镜，不等粗剪确认，每条添加与内容对应的整屏动画。交付 MP4、匹配的 HTML 视频修改器及约定的原生草稿；实际测试改字、改字幕时间、保存重开和带音频导出。依赖不足请列出未完成项，不能只交成片就宣布完成。

## 运行依赖

- macOS（HDR/HLG→SDR 使用系统 `avconvert`；其他平台需改用 ffmpeg `zscale`/`tonemap`）
- ffmpeg / ffprobe
- Node.js 18+ 与 `playwright-core`，以及本机 Chrome/Chromium
- Whisper CLI + `ggml-large-v3`（可选，用于转写）
- Python + OpenCV + numpy（戴眼镜/眼袋的眼下局部修饰）
- uv（可选，用于运行 `audio.py` 混音）
- 运行时素材：`assets/runtime/` 已包含字体、颗粒和占位 Logo；发布前替换成律所自己的 Logo
- HTML 修改器：执行者基于本版包装工程制作并验证；现有渲染示例不是现成编辑器。使用的浏览器、导出库或本地服务须随交付说明和依赖一起提供
- 原生草稿/美颜：另配合法安装的剪映和 Computer Use，或匹配版本的 Headless/原生技能；安装本 Skill 不等于原生环境已就绪

## 隐私

模板中的人名条和片尾使用占位符；使用前替换为你方信息。不要提交真实律师姓名、执业证账号、客户素材、Logo 或转写稿。

## 内容

本仓库只发布运行这个 Skill 所需的文件。本地评测样本、预期答案和运行记录不包含在公开包中。
