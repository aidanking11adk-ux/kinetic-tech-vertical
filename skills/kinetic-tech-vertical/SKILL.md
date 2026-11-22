---
name: kinetic-tech-vertical
description: 制作律师知识口播 Kinetic Tech 竖屏成片，按语义精剪，添加字幕、标题、人名条和整屏动画，同时交付可编辑文字并导出带音频视频的 HTML 修改器。用于单律师竖屏口播；剪映原生草稿和指定美颜需另配原生工具，不用于活动纪实或多机位剪辑。
---

# kinetic-tech-vertical

把律师知识口播原片按语义精剪，保留律师出镜和原声，用 Kinetic Tech 包装层完成标题、字幕、人名条、整屏动画与片尾。片长服从完整意思，49.25 秒示例不是时长上限。

**执行标准更新：2026-11-22。每版成片必须同时交付匹配的 HTML 视频修改器，并实际验证编辑、保存重开和带音频导出。仅有 MP4、SRT、渲染页面或剪映草稿均不算完成全部交付。**

## 适用与边界

**适用**：单律师、单机位、竖屏或可旋转为竖屏的口播原片；需要 1080×1920 成片和科技风包装。

**不适用**：活动纪实、横屏、多机位和纯文字模板片。需要剪映原生可编辑草稿或原生美颜时，按 [原生交接](references/native-handoff.md) 衔接；本包不包含剪映、Headless 后端或会员权益。

**开工前必读**：项目内 `剪辑规则.md`、`AGENTS.md`（如果存在），以及 [交付与 HTML 修改器](references/delivery-and-editor.md)。用户本次明确要求优先。确认本次律师姓名、执业证账号和对应素材；同一人批量确认一次，多人分别确认，有历史也不自动沿用。只确认展示文字，不索要证件照片。未确认不生成正式人物条或正式导出。

## 固定剪辑规则

- 不询问粗剪确认；内部完成语义、切口和字幕检查后继续后期。
- 删除明确重复、口误、无内容开头、无意义尾巴和过长停顿，保留前提、否定词、数字及完整结论。停顿检测只是候选，不能按阈值机械切断一句话。
- 字幕先校正文字、划分完整语义，再用逐词时间定位并复听。禁止固定字数跨句拼接、整段时间均分、把上句后半与下句前半合成一条。没有实际复听时不得记录已复听。
- 用同一份剪口映射更新视频、音频、字幕和动画。跨剪口字幕分开映射，切口前后必须检查字头字尾和音画同步。
- **不加滤镜**（旧“甜韩粉白”规则已取消），不默认换背景、抠像、变速或添加 BGM。用户另有明确要求时按本次要求。
- 保留已认可的动画设计、素材与关键帧；修改文字或字幕不重做无关动画。每条至少有一段与口播内容对应的整屏图示，不能只替换通用卡片标题。
- 原素材及用户修改稿不覆盖；独立目录保存新版本。清理另按本次授权。

## 硬门槛（顺序不能反）

1. **先查色彩**。`ffprobe` 看 `color_transfer`；`arib-std-b67`（HLG）或 `smpte2084`（PQ）必须先 `avconvert --preset Preset1920x1080` 转 SDR BT.709，再做剪切、美颜、包装。把 HDR 当 SDR 会抬高黑位、褪色发灰，是本流程最大的返工来源。
2. **再统一画幅**。1080×1920 / 30fps；保留源片旋转信息。
3. **再转写、剪口、处理人物画面、包装**。需要眼下修饰时用 `scripts/undereye.py`；不要把软件处理算作剪映原生八项美颜。保留尚未叠加后期文字的干净底片及最终音轨，供修改器复用。
4. **最后必须抽帧、检查音频并验证修改器导出**。命令成功、能解码，都不等于字幕、人物条、卡片、音画同步或 HTML 编辑导出正确。

## 流程

1. 预处理：`scripts/prepare_source.sh <源片> <workdir>`
2. 转写：`scripts/transcribe.sh <workdir>/audio-16k.wav <workdir>/asr`
3. 建剪口：写 `keeps.json`（`[{"start":3.35,"duration":37.58}, ...]`），运行 `scripts/build_base.py`
4. 美颜/眼下修饰：先按项目美颜链生成 `base/frames-beauty*`；戴眼镜或眼袋明显时运行 `scripts/undereye.py` 输出新帧目录，并把 `app.js` 的 `base.src` 指过去。`--level natural` 保留少量结构，`--level full` 完全抹平。
5. 包装：运行 `scripts/bootstrap_project.sh <project>`（复制示例、运行素材及交付检查表），按文案替换标题、字幕、卡片和人物条；规则见 `references/design-system.md`。后期文字同时维护为独立图层数据，不烧入底片。
6. 渲染：写 `project.json`，运行 `scripts/render.mjs --project project.json`
7. 混音：以 `assets/example/audio.py` 为底改事件时间；或保留原声直接 mux
8. 修改器：按 `references/delivery-and-editor.md` 制作本版 HTML，包含底片、最终音轨、字体、图片及独立文字/字幕时间数据；保留已确认的动画。
9. 原生交接：按 `references/native-handoff.md` 完成约定的剪映草稿与原生皮肤管理；缺少条件只报告实际完成的部分，不把软件近似或 HTML 冒充原生交付。
10. 验收：`scripts/qa.sh <成片> <qa目录>`，对照 `references/qa-checklist.md`；实际改字、改样式、改字幕时间，保存重开 HTML，导出带音频视频并检查。
11. 交付：MP4、匹配的 HTML 修改器及全部依赖、SRT、封面、约定的原生草稿、画面抽查、人员确认和剪辑说明。逐项更新 `delivery-checklist.json`，未测试项保持 pending。

## 运行素材

`assets/runtime/` 已包含 Noto Sans SC、Geist/Geist Mono、grain、占位 `logo.png`/`logo-crop.png` 和许可证。`scripts/bootstrap_project.sh` 会把它们复制到项目 `assets/`。占位 Logo 必须换成律所自己的；许可证在 `assets/runtime/`。

`scripts/undereye.py` 需要 Python 3 + OpenCV + numpy；系统 Python 没有 OpenCV 时用 `uv run --with opencv-python-headless --with numpy python scripts/undereye.py ...`。

## 版式要点

- **字幕**：54px 玻璃科技条，距底约 560px（画面中下方），`max-width:1000px`，单行优先；不要白字黑边。
- **人名条**：有证律师 540px 宽、姓名 40px、账号 28px；无证实习律师写 `律师：{姓名}` / `实习律师`，不展示证号，底框收窄到约 360px。自动高度、行距 12px，两行贴住文字；严格两行；整屏卡和片尾隐藏。
- **整屏卡**：2×2 或清单；先整体出现，再按口播逐条高亮，避免前两秒空白。
- **暗角**：只在整屏卡和片尾；人物画面只用美颜，不加暗角。
- **标题**：0–5 秒；金属字 + 金色强调（如 `≠`）；不压脸。
- **美颜**：软件双边平滑是近似，不是原生。戴眼镜时全局磨皮会保留镜框、镜片和泪沟边缘，眼袋是结构性阴影，光靠双边滤波磨不掉；必须用 `scripts/undereye.py` 做逐帧眼下蒙版（低频压平 + 提亮 + 降饱和），并避开镜框下沿。用户要求“完全抹平”时用 `--level full`，不要保留眼袋结构；但仍要保证镜框和镜片清晰。剪映原生 8 项数值（磨皮37、美白42、均肤52、丰盈52、祛斑祛痘47、去法令纹47、祛黑眼圈47、清晰47）必须 UI 逐项应用；没做就明确说没做。

## 停止条件

- HDR→SDR 转换失败或无法验证；
- 律师身份未确认；
- 戴眼镜/眼袋明显但没做局部眼下修饰，却声称已经去眼袋；
- 成片抽帧或音频验收不通过；
- HTML 缺少独立文字图层、无法保存重开或无法导出带音频视频：继续修复，不能宣称全部交付；
- 用户要求原生剪映美颜或可编辑草稿，而当前没有 UI 条件：可继续离线工作，明确原生部分未完成。

## 参考

- `references/workflow.md`：完整命令、剪口映射、眼下修饰、渲染和混音细节。
- `references/design-system.md`：字体、间距、时间轴、卡片和暗角规则。
- `references/qa-checklist.md`：逐项验收清单。
- `references/delivery-and-editor.md`：每版必交的 HTML 修改器、图层数据、音轨、导出和真实浏览器验收。
- `references/native-handoff.md`：剪映草稿、八项皮肤管理及原生保存重开验收。
- `templates/delivery-checklist.json`：初始化时复制到项目的待验收记录；不得预填通过。
- `scripts/undereye.py`：戴眼镜/眼袋的逐帧眼下修饰，`natural` / `full` 两档。
- 可运行示例：`assets/example/`（谅解书，49.25 秒）。
