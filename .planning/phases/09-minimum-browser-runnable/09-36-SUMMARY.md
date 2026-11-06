# Phase 9 Plan 36: 09-PARITY 总索引（口径与规则）Summary

一句话：写出 `09-PARITY/00-INDEX.md`，一次性固定「旧引擎 ↔ 新引擎功能对等性审计」的口径、deny-list、五值判定、证据等级、条目字段、7 个 ID 命名空间与 UNC 分区、6 份文档索引、25 项旧枚举源台账、汇总矩阵模板与快照协议；**不含任何对等结论、不填任何统计数字**。

## 实际快照（写作时刻）

| 项 | 值 |
| --- | --- |
| 旧引擎根目录 / 分支 | `D:/github/mota-js` / `master` |
| 旧引擎 HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55` |
| 旧引擎 dirty 行数 | 0 |
| 新引擎根目录 / 分支 | `D:/github/template` / `refine/data-client` |
| 新引擎 HEAD | `b2e94818e50cefea5e93963ddf66374763944a5d` |
| 新引擎 dirty 行数 | 138 |
| 快照时间 | `2026-11-03T10:43:32Z`（本地 `2026-11-03 18:43:32`，UTC+8） |

- 与 `09-PARITY-RESEARCH.md` 的快照（新 HEAD `ca62d283…`、dirty 58）不同：工作树在执行期间持续变动，本计划按「执行时最新工作树」记录，不回滚、不触碰用户改动。
- 执行期间 `git status --porcelain -uall` 的非空行数由 138 起算；除本计划两个 Markdown 外无新增行（见「门禁实测结果」与「偏差记录」）。

## 交付物

| 文件 | 状态 | 字节数（UTF-8） | 行数 | 行尾 |
| --- | --- | --- | --- | --- |
| `.planning/phases/09-minimum-browser-runnable/09-PARITY/00-INDEX.md` | 新建 | 21623 | 312 | LF |
| `.planning/phases/09-minimum-browser-runnable/09-36-SUMMARY.md` | 新建（本文件） | 见文末自检说明（自引用，写入后数值会漂移） | — | LF |

`00-INDEX.md` 含 12 个固定标题（一级标题 + `## 0`..`## 10`），`## 8` 台账恰好 25 行，汇总矩阵 P2..P6 全部为「待填」，无 `PAR-DATA-*` / `PAR-GAME-*` / `PAR-REND-*` / `PAR-UI-*` / `PAR-RT-*` 形式的正式审计条目，无任何 MISSING/PARTIAL/DIFFERENT/UNCERTAIN 的实际计数，无修复建议。

## 25 项旧枚举源实际规模（只读复核）

| # | 旧枚举源 | 实际规模 | 与研究的差异 |
| --- | --- | --- | --- |
| 1 | `control.prototype.*` 公开方法 | 124 | 一致 |
| 2 | `ui.prototype.*` 公开方法 | 61 | 一致 |
| 3 | `maps.prototype.*` 公开方法 | 81 | 一致 |
| 4 | `actions.prototype.*` 公开方法 | 15 | 一致 |
| 5 | `events.prototype.*` 公开方法 | 84 | 一致 |
| 6 | `events._action_*` | 129 | 一致 |
| 7 | `events._precompile_*` | 18 | 一致 |
| 8 | `events._sys_*` | 8 | 一致 |
| 9 | `registerReplayAction` + `_replayAction_*` | 15 | 一致 |
| 10 | 路线编码字母表 | 24（20 个单字符码 + 4 个移动字母） | 研究写 21，实际 24 |
| 11 | `getSpecials()` 行 | 27 | 一致 |
| 12 | `project/enemys.js` 条目 | 81 | 一致 |
| 13 | `project/items.js` 条目 | 51（`cls` 字段同为 51：tools 20 / items 23 / constants 8） | 研究写 63，实际 51 |
| 14 | `project/maps.js` 条目 | 224 | 一致 |
| 15 | `project/floors/*.js` 字段并集 | 29 | 一致 |
| 16 | `project/data.js` 的 `main/firstData/values/flags` 键 | 14 / 9 / 18 / 22 | 一致 |
| 17 | `project/icons.js` 类别 | 9 | 一致 |
| 18 | `project/plugins.js` 顶层函数 | 13 | 一致 |
| 19 | 天气注册 | 5（`registerWeather`：rain/snow/fog/cloud/sun） | 一致；按 `_weather_` 前缀匹配会把 `__animateFrame_weather_image` 误计为 6 |
| 20 | 面板 / 事件 ID | 29 | 一致 |
| 21 | `registerAction('<name>')` | 12 | 一致 |
| 22 | `statusBarItems` | 12 | 一致 |
| 23 | 图块 `cls` 类 | 项目数据 8 类；第 9 类 `tileset` 只在 `libs/maps.js` 运行时分支出现 | 研究写 9，样板数据 8 |
| 24 | 楼层 / 图块 `trigger` 值 | 8 个系统触发器（`_sys_*`）＋ `null`；项目数据显式值 4 个 | 研究写 8，口径需区分「注册表」与「项目数据」 |
| 25 | `runtime.d.ts` 声明类 | 12 | 一致 |

**口径差异汇总（只记录，不判断对错）：** 第 10、13、19、23、24 项与研究文档不一致。第 13 项差异最大（研究 63 / 实际 51）；INDEX 台账已写成「研究 X / 实际 Y」，未凑数、未改判研究文档。

## 门禁实测结果（全部命令的真实输出）

| 门禁 | 命令来源 | 真实输出 | 退出码 |
| --- | --- | --- | --- |
| Task 1 快照字段 | `snapshot.txt` 五字段检查 | `OLD_HEAD/OLD_DIRTY/NEW_HEAD/NEW_DIRTY/TIME` 齐全，`missing []` | 0 |
| Task 1 枚举源 | enemys/maps/floorFields/actions/precompile/sys 断言 | `enemys 81 maps 224 floorFields 29 actions 129 precompile 18 sys 8 bad []` | 0 |
| Task 2 目录与 UI | 关键目录 + `src/client/ui` 文件数 | `missing []`、`ui files 20` | 0 |
| Task 2 研究小节 | `### 1.5` / `### 6.1` / `### 6.3` / `### 7.2` | `research bytes 68118 missing []` | 0 |
| Task 3 标题 | 12 个固定标题 | `bytes 13362 missing []`（JS 字符数；文件 21623 字节） | 0 |
| Task 3 台账 | `^\|\s*\d+\s*\|` 行数 + 6 文档 + 7 前缀 | `ledgerRows 25 missingDocs [] missingPrefixes []` | 0 |
| Task 3 结论闸门 | deny 夹具 + SUPPORTED 行扫描 + 正式条目行 + `## 2` deny 8 条 + 矩阵待填 | `fixtureOk true supportedDenyHits 0 entryRows 0 denyMissingInSection2 [] section2Bytes 1257 filledMatrixRows 0` | 0 |
| Task 4 范围闸门 | 基线比较 + 源码行逐字一致 + 新增恰好 2 条 | `baselineSource 74 nowSource 74 added 2`；`added` 恰为 `09-PARITY/00-INDEX.md` 与 `09-36-SUMMARY.md` | 0 |
| Task 4 摘要闸门 | SUMMARY 关键字 | 关键字全部命中：`missing []`（SUMMARY 为自引用文档，字符数随编辑漂移，故不写死） | 0 |

- Task 3 的标题闸门与结论闸门在 PowerShell 下直接内联执行时，`“”` 等全角字符会被命令行编码破坏（脚本解析错误，非文档问题）。为保证与计划断言逐字等价，已把两条命令**原样**写入 `%TEMP%` 下的临时脚本再执行，断言内容与计划完全一致，结果如上表。
- 全部 gate 均为真实执行结果；任一条失败会在此如实记账，未放宽断言、未删表格行、未把「待填」改成数字。

## 范围与纪律声明

- **只写 2 个 Markdown**：`09-PARITY/00-INDEX.md` 与 `09-36-SUMMARY.md`。未创建其它文件（`09-PARITY/` 目录内只有 INDEX）。
- **零代码改动**：未修改任何源码、测试、配置、内容、依赖；`git status --porcelain -uall` 中所有 `.ts` / `.tsx` / `.js` / `.mjs` / `.cjs` / `.json` / `.jsonc` 行与 Task 1 基线逐字一致。
- **零提交**：未运行 `git add`、`git commit`、`git stash`、`git checkout`、`git restore`、`git reset`；两个 Markdown 留在工作树供审查。
- **未更新 STATE**：未修改 `.planning/STATE.md`、`.planning/ROADMAP.md`、任何既有 `PLAN.md` / `SUMMARY.md` / `09-CONTEXT.md`。
- **无对等结论**：INDEX 只定义口径与索引；未判定任何功能为 MISSING/PARTIAL/DIFFERENT/UNCERTAIN/SUPPORTED，未填任何统计数字。
- **未使用 `pnpm`**：所有校验只用 `node` 与 PowerShell 5.1 内建命令；未安装依赖、未改 workspace。
- **未调用 `opencode`**：未调用 `opencode` 命令，未启动额外 opencode 会话。
- **22:00 检查**：本机账户 `13194`；本计划执行完毕时间为本地 `2026-11-03 18:49`，早于 22:00，按规则继续（不触发停止）。

## 偏差记录

1. **[Rule 1 - 工具缺陷自纠] 基线文件首行前导空格被截断**
   - **发现于**：Task 4 范围闸门首次比较时，基线中 ` M .planning/phases/10-docs-restructure/10-CONTEXT.md` 被记成 `M ...`，导致该行被误判为「新增」。
   - **原因**：Task 1 的快照脚本对 `git status` 输出调用了 `.trim()`，把首行状态码的前导空格一并裁掉；被裁的只是空白，不是内容。
   - **处理**：仅在 `%TEMP%/gsd-09-parity-36-baseline.txt` 中恢复首行的 1 个前导空格（porcelain 的 `XY` 状态位格式），不改动仓库任何文件；恢复后比较结果为「新增 1 条 = INDEX」，写入 SUMMARY 后为「新增 2 条」。
   - **影响范围**：仅临时基线文件；`00-INDEX.md`、仓库文件与用户改动均未受影响。

2. **[Rule 3 - 阻断项] Task 3 两条门禁命令无法在 PowerShell 内联执行**
   - **原因**：门禁断言内含 `“”` 全角引号与中文，PowerShell 5.1 传参编码破坏脚本字面量，`node -e` 直接报语法错误。
   - **处理**：把计划里的命令**原样**落到 `%TEMP%` 的两个 `.js` 文件执行，断言与输出字段完全一致；未修改断言内容。
   - **影响范围**：仅执行方式，不影响文档内容与判定。

## 自检

- [x] `09-PARITY/00-INDEX.md` 存在（21623 字节 / 312 行 / LF）。
- [x] 12 个固定标题齐全（`# 09 …` + `## 0`..`## 10`）。
- [x] `## 8` 台账恰好 25 行，序号 1..25 与计划 Task 0 ⑦ 逐项对应。
- [x] 8 条 deny-list 在 `## 2` 中逐字出现（含全局 `core.`）。
- [x] 7 个 ID 前缀、6 个文档路径全部出现。
- [x] 汇总矩阵 P2..P6 全部「待填」，无新增列。
- [x] 无正式审计条目行、无实际统计数字、无修复建议、无对等结论。
- [x] 新增文件恰好 2 个 Markdown；源码/配置零变化；0 次提交。
- [x] 无 requirement ID（`requirements: []`），Nyquist 不适用；未创建 RESEARCH / VALIDATION。
- [x] 本文件（SUMMARY）是自引用文档：字节数与行数以磁盘最终 stat 为准（约 10 KB / 119 行），不在此写死，避免编辑后数值漂移。

## 估算与未覆盖

- **估算未校准**：本计划 `estimate.confidence: low`，原估 45000 tokens / 5 tasks；实际成本以本次执行的真实读写与文档字节为准，不据此调整历史估算。
- **明确不覆盖**：任何新旧引擎功能判定、任何 MISSING/PARTIAL/DIFFERENT/UNCERTAIN 计数、任何浏览器运行行为、任何修复建议。逐条对等结论由 09-37..09-41 产出。
