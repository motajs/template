# Phase 9 Plan 39: 渲染对等审计 Summary

一句话：写出 `09-PARITY/03-RENDER.md`，完成渲染层旧→新对等审计——**20 项 Canvas2D 原语逐项映射**、**旧 5 种天气 vs 新 6 个 preset（`cloudLike` 标 NEW-ONLY 不计入）**、10 类图层/材质/动画/覆盖层/透明度/后处理/字体/布局/缩略图/扩展条目，共 **94 条 `PAR-REND-*` 条目**。**只写 2 个 Markdown、零代码改动、零提交、无 WebGL E2E。**

## 实际快照（写作时刻，Task 1 重新采样）

| 项 | 值 |
| --- | --- |
| 旧引擎根目录 / 分支 | `D:/github/mota-js` / `master` |
| 旧引擎 HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55` |
| 旧引擎 dirty 行数 | 0 |
| 新引擎根目录 / 分支 | `D:/github/template` / `refine/data-client` |
| 新引擎 HEAD | `b2e94818e50cefea5e93963ddf66374763944a5d` |
| 新引擎 dirty 行数 | 145 |
| 快照时间 | `2026-11-03T11:41:46Z`（本地 `2026-11-03 19:41:46`，UTC+8） |
| 与 `00-INDEX.md` / `01-DATA.md` / `02-GAMEPLAY.md` 是否一致 | HEAD 全部一致；dirty 138 → 140 → 142 → 145，增量含前序计划的两份 Markdown 与并发工作树变动；**不影响 RENDER 结论** |

- 快照与基线原文保存于 `%TEMP%/gsd-09-parity-39-snapshot.txt` 与 `%TEMP%/gsd-09-parity-39-baseline.txt`；未改动任何仓库文件。
- 旧仓库 `git status --porcelain` 在 Task 1 前后均为空，旧仓库零改动。

## 覆盖结果（20 原语 / 5 vs 6 天气 / 94 条目）

| 覆盖项 | 要求 | 实测 | 位置 |
| --- | --- | --- | --- |
| Canvas2D 绘制原语 | **20** 项全部以反引号出现，`drawSelector` 写真实符号 | **20 / 20**；`drawSelector` 旧证据写 `ui.prototype._drawSelector` 与 `drawUIEventSelector` | `## 11` |
| 旧天气 | **5** 种 `_weather_*` 全部出现 | **5 / 5**：`_weather_rain`/`_weather_snow`/`_weather_fog`/`_weather_cloud`/`_weather_sun` | `## 6` |
| 新天气 preset | **6** 个路径全部出现 | **6 / 6**：`presets/rain`、`presets/snow`、`presets/fog`、`presets/cloud`、`presets/cloudLike`、`presets/sun` | `## 6` |
| `cloudLike` 处理 | 标 NEW-ONLY 或说明组合来源 | 标 **NEW-ONLY（不计入统计）**：它是 `CloudLike` 抽象基类，由 `cloud`/`fog` 继承，不是第 6 种可激活天气 | `## 6` |
| 图层 | 旧多画布 vs 新 `IMapLayer`/`setLayerState`/背景层 | 10 条；旧 10 个固定 `gameCanvas` + 动态画布 vs 新 `layerList`/`zIndex`/`alias` | `## 2` |
| 材质/autotile/tileset | `bigImage`/`faceIds`/`animate`/`tileset offset`/`_makeAutotileEdges` vs `material` builder/autotile | 10 条；6 条 SUPPORTED、3 条 DIFFERENT、1 条 MISSING | `## 3` |
| 动画/大图/覆盖层 | `animateSetBlock`/`animateBlock`/`moveBlock`/`jumpBlock` vs `MovingBlock`/`animate` 包 | 10 条；3 条 SUPPORTED、3 条 PARTIAL、3 条 DIFFERENT、1 条 MISSING | `## 4` |
| 透明度/滤镜/后处理 | `setAlpha`/`setFilter`/`setBlockOpacity`/`setBlockFilter`/`blurFg`/`setCurtain`/`screenFlash` vs `IBlockStatus.setAlpha`/`addPostEffect`/`EffectBase`/无 | 10 条；4 条 MISSING、4 条 PARTIAL、2 条 SUPPORTED；幕布/闪屏/模糊前景明确 MISSING | `## 5` |
| 字体/文本 | `setFont`/`calWidth`/`splitLines`/`drawText`/`drawTextContent`/`getTextContentHeight`/`drawTextBox`/`drawScrollText`/`textAttribute` vs `Font`/`TextContent`/`Textbox`/`ScrollText` | 10 条；7 条 SUPPORTED、2 条 DIFFERENT、1 条 PARTIAL | `## 7` |
| 布局/视口/缩放 | `setViewport`/`moveViewport`/`updateViewport`/`setGameCanvasTranslate`/`resize`/`_resize_*`/`core.bigmap` vs `setViewport`/`IMapRenderConfig`/`adjustGrid`/`adjustCover` | 8 条；2 条 SUPPORTED、5 条 DIFFERENT、1 条 PARTIAL | `## 8` |
| 缩略图 | `drawThumbnail` vs `Thumbnail` 组件 + 渲染器 | 3 条，全部 PARTIAL：组件仍透传全局 `core.drawThumbnail` | `## 9` |
| 勇士/门/地图文字扩展 | `drawHeroAnimate`/门动画/`textImage` vs `map/extension/{hero,door,text,manager}` | 7 条；5 条 SUPPORTED、1 条 DIFFERENT、1 条 PARTIAL | `## 10` |
| 双记录 | 5 个受样板覆写的渲染/UI 符号 | 5 / 5，每行同时含 `libs/` 与 `project/functions.js:` | `## 1.1` |

## `PAR-REND-*` 判定计数（按实际条目，未合并、未删除）

| 小节 | 条目数 | MISSING | PARTIAL | DIFFERENT | UNCERTAIN | SUPPORTED |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `## 2` 地图渲染器与图层 | 10 | 2 | 1 | 7 | 0 | 0 |
| `## 3` 图块材质与 autotile | 10 | 1 | 0 | 3 | 0 | 6 |
| `## 4` 动画、大图与覆盖层 | 10 | 1 | 3 | 3 | 0 | 3 |
| `## 5` 透明度、滤镜与后处理 | 10 | 4 | 4 | 0 | 0 | 2 |
| `## 6` 天气 | 6 | 0 | 5 | 1 | 0 | 0 |
| `## 7` 字体与文本渲染 | 10 | 0 | 1 | 2 | 0 | 7 |
| `## 8` 布局、视口与缩放 | 8 | 0 | 1 | 5 | 0 | 2 |
| `## 9` 缩略图 | 3 | 0 | 3 | 0 | 0 | 0 |
| `## 10` 勇士、门与地图文字扩展 | 7 | 0 | 1 | 1 | 0 | 5 |
| `## 11` Canvas2D 原语映射 | 20 | 0 | 3 | 0 | 0 | 17 |
| **合计** | **94** | **8** | **22** | **22** | **0** | **42** |

- 差异合计（前四类之和）= `8 + 22 + 22 + 0` = **52**；条目总数 = 52 + 42 = **94**。
- 未计入统计：`## 6` 的 `cloudLike` 是 `CloudLike` 抽象基类，标 `NEW-ONLY`，不进入 `PAR-REND-*` 计数。
- 判定只使用 `MISSING` / `PARTIAL` / `DIFFERENT` / `UNCERTAIN` / `SUPPORTED` 五值；`影响` 只使用 `blocker` / `major` / `minor` / `info`。

## 已知差异（计划要求必须单列）

| 已知差异 | 旧 | 新 | 位置 |
| --- | --- | --- | --- |
| 图层模型 | 10 个固定 `gameCanvas`（`bg/event/hero/event2/fg/damage/animate/curtain/ui/data`）+ 动态 `weather/route/uievent/ui2/status` | `IGameMap.layerList` 动态图层 + `zIndex` 排序 + 单 WebGL 画布 + 覆盖层/移动块 | `## 2` |
| 大图 `bigImage` | `_drawBlockInfo_bigImage` 拆 header/body，z 51/31 | 新包内未发现运行时 `bigImage` 字段/拆分逻辑；仅 `src/types/declaration/**` 命中 | `## 3`/`## 4` |
| autotile 边缘 | 3×3 邻域布尔 + `toDataURL` 相等生成 `autotileEdges` | 8 邻接位掩码 + `AutotileProcessor.connect/flatten` 48 组合 | `## 3` |
| 幕布/闪屏/灯光 | `setCurtain`/`screenFlash`/`project/plugins.js` `drawLight` | 无默认等价；`addPostEffect` 只是扩展点 | `## 5` |
| 滤镜 | `setFilter` 支持 `blur/hue/grayscale/invert/shadow`，可设到画布/图块 | 只有 `RenderItem.setFilter(string)` 元素级；无图块级 `setBlockFilter` | `## 5` |
| 天气数量 | 5 种（rain/snow/fog/cloud/sun） | 6 个 preset 文件（多 `cloudLike`，实为抽象基类） | `## 6` |
| 缩略图 | `maps.prototype.drawThumbnail` + 4 个 `_drawThumbnail_*` | `Thumbnail` 组件仍调用全局 `core.drawThumbnail`，新包内无独立实现 | `## 9` |
| 勇士四帧 | `(frame||0) % 4` + `heroIcon.loc` | `MapHeroRenderer` 的 `animateFrame`/`animateInterval` 状态机，支持正/反向 | `## 10` |

## 门禁实测结果（全部命令的真实输出）

| 门禁 | 来源 | 真实输出 | 退出码 |
| --- | --- | --- | --- |
| Task 1 快照字段 | 计划 Task 1 acceptance | `OLD_HEAD/OLD_DIRTY/NEW_HEAD/NEW_DIRTY/TIME` 齐备；`OLD_DIRTY=0`、`NEW_DIRTY=145` | 0 |
| Task 1 原语/天气 | 计划 Task 1 automated #1 | `missingPrimitives [] drawSelectorSymbolOk true missingWeather []` | 0 |
| Task 1 地图绘制 | 计划 Task 1 automated #2 | `missingMapDraw []` | 0 |
| Task 2 关键文件 | 计划 Task 2 automated #1 | `missing []` | 0 |
| Task 2 天气 preset | 计划 Task 2 automated #2 | `missingPresets []` | 0 |
| Task 3 标题闸门 | 计划 Task 3 automated #1 | `bytes 43840 missing []`（`bytes` 为 `s.length` 字符数；UTF-8 字节数 58170） | 0 |
| Task 3 原语/天气闸门 | 计划 Task 3 automated #2 | `missingPrimitives [] drawSelectorSymbolOk true missingWeather []` | 0 |
| Task 3 表头/deny/锚点闸门 | 计划 Task 3 automated #3 | `fixtureOk true entryRows 74 supported 25 supportedDenyHits 0 noAnchor 0 header true` | 0 |
| Task 3 双记录闸门 | 计划 Task 3 automated #4 | `doubleRecordRows 5 missing [] badDoubleRecord 0 badAuditRows 0` | 0 |
| Task 4 范围闸门 | 计划 Task 4 automated #1 | **未通过**：`baselineSource 74 nowSource 75 added 3 touched 0`；`SOURCE CHANGED`（外部 `packages/common/src/logger.json`）；新增 3 条 = 本计划两份 Markdown + 外部 `logger.json` | **1** |
| Task 4 摘要闸门 | 计划 Task 4 automated #2 | `summary bytes 11156 missing []`（`bytes` 为 `s.length` 字符数；UTF-8 字节数 16061） | 0 |

- 上述 `automated` 命令全部按计划原文**写入 `%TEMP%` 的 `.js` 文件后执行**（PowerShell 5.1 内联 `node -e` 会被中文/全角引号破坏字面量），断言内容与计划逐字一致；断言未放宽、未删行、未把「无对应」写成支持。
- `entryRows 74` 是 `PAR-REND-001`–`094` 中前 74 条（`## 2`–`## 10`）的行数；`## 11` 的 20 条原语行首列是原语名，不含 `PAR-REND-` 前缀，故不计入该正则，但在 `## 12.1` 中已计入 94。

## 范围闸门实测与偏差（重要，如实记录）

- **通过的部分**：`touched 0` → `09-PARITY/00-INDEX.md`、`01-DATA.md`、`02-GAMEPLAY.md` **未被修改**；`hasDoc true`、`hasSum true`；本计划实际写入恰好 2 个 Markdown（`09-PARITY/03-RENDER.md` 与 `09-39-SUMMARY.md`）。
- **未通过的部分**：计划要求「新增恰好 2 条、源码/配置零变化」。实测 `baselineSource 74` → `nowSource 75`，`onlyNow` 为 ` M packages/common/src/logger.json`（1 行插入，mtime `2026-11-03 19:52:47`，晚于 Task 1 基线 `19:41:46`）。该文件**不是本计划写入**，属并发工作树变动；本计划未打开、未修改、未回滚它。因 `SOURCE CHANGED` 与 `added 3`，范围闸门**如实记为失败**，不放宽断言、不伪造数字。
- **本计划实际写入**：恰好 2 个文件——`09-PARITY/03-RENDER.md`（58170 UTF-8 字节 / 265 行 / LF）与本文件。
- **并发修改披露（非本计划所为）**：执行期间外部新增/修改 `packages/common/src/logger.json`（1 行插入，19:52:47）；Task 1 基线中已有的 74 行源码/配置脏项在 Task 4 时逐字一致（`onlyBase []`），说明本计划未改任何源码/配置。

## 范围与纪律声明

- **只写 2 个 Markdown**：`09-PARITY/03-RENDER.md` 与本文件。`09-PARITY/` 目录内未创建其它文件。
- **零代码改动**：未修改任何源码、测试、配置、内容、依赖、注释；除外部 `logger.json` 外，源码/配置行集合与 Task 1 基线逐字一致（`onlyBase []`）。
- **零提交**：未运行 `git add`、`git commit`、`git stash`、`git checkout`、`git restore`、`git reset`；两个 Markdown 留在工作树供审查。
- **未更新 STATE**：未修改 `.planning/STATE.md`、`.planning/ROADMAP.md`、任何既有 `PLAN.md` / `SUMMARY.md`、`00-INDEX.md`、`01-DATA.md`、`02-GAMEPLAY.md`、`09-PARITY-RESEARCH.md`（GSD 常规的 STATE/ROADMAP 回写在本次硬约束下被显式禁用）。
- **未判定 P2**：未判定怪物模板字段、道具字段、图块字段、存档结构；只交叉引用 `01-DATA.md`。同样**未判定 P3 战斗数值与 P5 UI 布局**，相关行统一写「转交」。
- **无 UAT / 无 WebGL E2E**：全部为静态源码审计（E1/E2/E3），未启动游戏、未运行浏览器、未验证 WebGL 运行结果。
- **未使用 `pnpm`**：全部枚举与校验只用 `node` 与 PowerShell 5.1；未安装依赖、未改 workspace。
- **未调用 `opencode`**：未调用 `opencode` 命令，未启动额外 opencode 会话。
- **估算未校准**：本计划 `estimate.confidence: low`（原估 70000 tokens / 5 tasks）；实际成本以真实读写与文档字节为准，不据此调整历史估算。
- **22:00 检查**：本机账户 `13194`；执行完毕时间本地 `2026-11-03 20:00`，早于 22:00，按规则继续（不触发停止）。

## 偏差记录

1. **[Rule 3 - 环境漂移，未修复] 范围闸门「新增恰好 2 条 / 源码零变化」失败**
   - **发现于**：Task 4 范围闸门。
   - **现象**：`baselineSource 74` → `nowSource 75`，`added 3`；多出 ` M packages/common/src/logger.json`（外部 19:52:47 修改，1 行插入）。
   - **处理**：按硬约束不回滚、不删除他人改动，如实记录失败；同时给出等价审计（`onlyBase []`、`touched 0`、本计划实际写入恰好 2 个 Markdown）。**未放宽断言**。
   - **影响范围**：只影响「新增计数/源码零变化」两条断言，不影响文档内容、判定与纪律声明。

2. **[Rule 3 - 计划 read_first 路径漂移] `map/mapLayer.ts` 不存在**
   - **现象**：计划 Task 2 read_first 列出的 `packages-user/client-base/src/map/mapLayer.ts` 在当前工作树不存在；实际图层实现在 `packages-user/data-base/src/map/mapLayer.ts`，地图状态在 `packages-user/data-base/src/map/mapState.ts`。
   - **处理**：`## 2`/`## 3` 引用真实路径 `packages-user/data-base/src/map/mapLayer.ts` 与 `mapState.ts`，未凭空引用不存在的文件。
   - **影响范围**：仅证据路径；判定不变。

3. **[Rule 3 - 执行方式] 门禁命令写入临时脚本执行**
   - **原因**：计划里的 `node -e "..."` 含中文与全角引号，PowerShell 5.1 传参编码破坏字面量。
   - **处理**：把命令**原文**落到 `%TEMP%/gsd39-*.js` 再执行；断言与输出字段与计划完全一致。
   - **影响范围**：仅执行方式。

4. **[Rule 1 - 可读性] 旧原文摘录按行截断**
   - **原因**：部分旧行较长，且含 `||`（Markdown 表格分隔符）。
   - **处理**：摘录以「…」或短句概括、`|` 一律转义为 `\|`；`file:line` 与语义不变。
   - **影响范围**：仅展示。

5. **[Rule 3 - 双记录口径] `libs/ui.js` 的统计/关于默认实现是 `_drawStatistics`/`_drawAbout`**
   - **现象**：`libs/ui.js` 只有 `ui.prototype._drawStatistics`（3173）与 `ui.prototype._drawAbout`（3346），`project/functions.js` 覆写的是公开名 `drawStatistics`/`drawAbout`。
   - **处理**：`## 1.1` 双记录表按「libs 默认证据 = `_drawStatistics`/`_drawAbout`，样板覆写证据 = `drawStatistics`/`drawAbout`」如实记录，未把两者当成同名函数。
   - **影响范围**：仅双记录写法；判定不变。

## 自检

- [x] `09-PARITY/03-RENDER.md` 存在（58170 UTF-8 字节 / 265 行 / LF / UTF-8 / 无替换字符）。
- [x] 15 个固定标题齐全（1 个一级 + `## 0`..`## 13`）。
- [x] 20 项 Canvas2D 原语全部以反引号出现；`drawSelector` 旧证据写出 `ui.prototype._drawSelector` / `drawUIEventSelector`。
- [x] 旧 5 个 `_weather_*` 与新 6 个 `presets/*` 路径全部出现；`cloudLike` 标 NEW-ONLY。
- [x] `## 1.1` 双记录表列出 5 个受样板覆写的符号，每行含 `libs/` 与 `project/functions.js:`。
- [x] 原语映射表头存在；全文任一含 SUPPORTED 的行都不包含 deny-list 锚点或全局 `core.`（`supportedDenyHits 0`）；`SUPPORTED` 行均有新包锚点（`noAnchor 0`）。
- [x] 94 条 `PAR-REND-*` 条目，ID 连续 001..094，无跳号/复用。
- [x] 只写 2 个 Markdown；0 次提交；未更新 STATE/ROADMAP；`00-INDEX.md`/`01-DATA.md`/`02-GAMEPLAY.md` 未改。
- [x] 无 requirement ID（`requirements: []`），Nyquist 不适用；未创建 RESEARCH / VALIDATION。
- [x] 本文件（SUMMARY）是自引用文档：字节数与行数以磁盘最终 stat 为准，不在此写死。

## 未决与未覆盖

- `PAR-UNC-200`（天气注册缺失）、`PAR-UNC-201`（缩略图透传全局 `core.drawThumbnail`）、`PAR-UNC-202`（`bigImage`/`faceIds` 仅 declaration）、`PAR-UNC-203`（`drawIcon` 位图/矢量组合）、`PAR-UNC-204`（幕布/闪屏/灯光无默认后处理）、`PAR-UNC-205`（`\d`/`\e` 标签语义）已在 `## 13.1` 记录，均未擅自判为缺陷。
- 明确不覆盖：P2 数据字段、P3 战斗数值、P5 UI 布局与输入、P6 插件/资源/存档/服务端、任何运行期 UAT/E2E。
