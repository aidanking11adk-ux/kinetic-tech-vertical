# Worked example: 谅解书

这是 2026-10-20/21 实际交付的 49.25 秒版本，用作 `kinetic-tech-vertical` 的起点，不是通用配置。

## 文件

- `index.html`：舞台、标题、四宫格、三行清单、警示条、片尾、人物条、字幕、HUD。
- `style.css`：Kinetic Tech 视觉系统（金属字、玻璃卡、字幕条、人物条、暗角）。
- `app.js`：时间轴、字幕、卡片高亮、人物条显隐、片尾。
- `audio.py`：轻量机械音效 + 原声混音，目标 -14.5 LUFS。

## 复用时要改

1. `app.js`
   - `DURATION`、`BASE_COUNT`；
   - `SUBS`：新剪口映射后的字幕；
   - `F1` / `F2`：整屏卡高亮时间；
   - `renderTitle` 里的标题文本；
   - `renderInsert1` / `renderInsert2` 的卡片文本（在 `index.html` 里）；
   - `renderWarn` 的警示时间；
   - `renderEndcard` 的片尾时间；
   - 人物条姓名/账号（在 `index.html` 里）；
   - `base.src` 的帧目录。
2. `index.html`
   - 标题、四宫格/清单文案、警示条、片尾文案、人物条两行。
3. `style.css`
   - 一般不用改；如改字号/位置，先读 `references/design-system.md`，不要把字幕条改回贴底或白字黑边。
4. `audio.py`
   - 事件时间与新剪口对齐；响度目标 -14.5 ~ -14.8 LUFS。

## 运行时素材

Skill 的 `assets/runtime/` 已包含：

```text
NotoSansSC.ttf
Geist-normal-600.woff2
Geist-normal-700.woff2
GeistMono-normal-400.woff2
GeistMono-normal-500.woff2
grain.png
logo.png        # 全屏透明占位 PNG，左上角已排好
logo-crop.png   # 片尾居中占位图，460×165
OFL-*.txt       # 字体/模板许可证
```

用 `scripts/bootstrap_project.sh <project>` 初始化项目时，这些文件会自动复制到项目的 `assets/`。
发布客户视频前，把 `logo.png` / `logo-crop.png` 换成律所自己的 Logo；不要把真实律师姓名、执业证账号或未授权品牌素材提交到公开仓库。
字体是 OFL；不要替换成未授权字体。

## 时间轴

```text
0.00–5.00    标题
12.25–20.11  四宫格
21.90–27.41  三行清单
32.85–37.55  警示条（字幕隐藏）
46.40–49.25  片尾
```

## 帧数对齐

`keeps.example.json` 只是结构示例；`build_base.py` 的实际输出可能是 49.27 秒 / 1478 帧（按帧取整）。以脚本输出为准，把 `DURATION` 和 `BASE_COUNT` 改成实际值，再渲染。

## 不要照搬

- 不要把“四项/三项”的文案直接套到新视频；按新文案重新设计。
- 不要把上一版的剪口/字幕时间套到新素材。
- 不要把人物条姓名/账号当成通用值；每次重新确认。
- 软件美颜不是剪映原生 8 项数值；不要写成原生。
