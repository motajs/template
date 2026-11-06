# Phase 09 Plan 40: UI 与输入对等审计 Summary

**One-liner:** 逐条归属 29 个旧面板 ID、12 个输入动作、12 个状态栏项与 63 条新热键命令，并把所有依赖全局 `core.*` 的 UI 降级为 PARTIAL/UNCERTAIN，产出 `04-UI-INPUT.md`。

- 交付文档：`.planning/phases/09-minimum-browser-runnable/09-PARITY/04-UI-INPUT.md`（13 个固定小节，65,000+ 字节）
- 交付摘要：本文件
- 执行方式：文档审计，**零代码改动、零提交**；未更新 `STATE.md` / `ROADMAP.md`；未修改任何既有计划/摘要/前序 4 份审计文档。

## 0. 快照

| 项 | 值 |
| --- | --- |
| 旧引擎 HEAD / dirty | `3efb548e407ad2b8007b498cb98401e2012a0b55` / 0 |
| 新引擎 HEAD / dirty | `b2e94818e50cefea5e93963ddf66374763944a5d` / 148 |
| 快照时间 | `2026-11-03T12:04:43Z`（本地 `2026-11-03 20:04:43`，UTC+8） |
| 与 `00-INDEX.md` / `02-GAMEPLAY.md` 一致性 | HEAD 全部一致；dirty 138 → 140 → 142 → 145 → 148，增量含前序计划 Markdown 与用户并发工作树改动；**不影响 UI/输入结论** |
| 执行期间 HEAD 漂移（外部） | Task 4 期间用户提交 `bd4d263 docs: 更新 AGENTS 文档`，新引擎 HEAD 由 `b2e94818…` 前进到 `bd4d2630…`；该提交只含 `AGENTS.md` / `dev.md`，**未改动本审计涉及的源码**（范围闸门 `baselineSource 75 = nowSource 75`） |

- 采样与基线原文：`%TEMP%/gsd-09-parity-40-snapshot.txt`、`%TEMP%/gsd-09-parity-40-baseline.txt`。
- 旧仓库在整个执行前后 `git status --porcelain -uall` 均为空。

## 1. 覆盖结果

| 覆盖项 | 要求 | 实际 | 结果 |
| --- | --- | --- | --- |
| 旧面板/事件 ID | 29 | **29/29**（`## 2` 首列 29 行，每行含 `D:/github/mota-js/...:<行号>` + 「原文」） | 通过 |
| 旧输入动作 | 12 | **12/12**（`## 5` 逐项，全部以反引号出现） | 通过 |
| 旧状态栏项 | 12 | **12/12**（`## 3.1`），另单列样板隐含 `enableHPMax` 与新 14 项差异 | 通过 |
| 新热键命令表 | 11 group / 68（研究） | **11 group / 63 命令**（实测），`## 4.2` 逐个 group 列命令数 | 已记录差异 |
| 疑似缺口专项 | 17 | **17/17**（`## 9` 逐项，含检索路径、中文关键词、`core.*` 命中、原因、确认方式） | 通过 |
| 双记录（7 个样板覆写） | 7 | **7/7**（`## 1.1`，每行同时含 `libs/` 与 `project/functions.js:` 锚点） | 通过 |
| 工具栏按钮 | 8 + 3（研究） | **8 + 8**（实际 `main.js` 的 `btn1`–`btn8`） | 已记录差异 |

### 1.1 P5 判定计数（85 条主表条目）

| 小节 | 条目数 | MISSING | PARTIAL | DIFFERENT | UNCERTAIN | SUPPORTED |
| --- | --- | --- | --- | --- | --- | --- |
| `## 2` 29 面板/事件 ID | 29 | 6 | 11 | 12 | 0 | 0 |
| `## 3` 状态栏 12 项（含隐含 `enableHPMax`） | 13 | 1 | 10 | 2 | 0 | 0 |
| `## 3` 工具栏按钮 | 14 | 4 | 9 | 1 | 0 | 0 |
| `## 5` 12 输入动作 | 12 | 3 | 4 | 5 | 0 | 0 |
| `## 7` book/equipbox/toolbox/shop/viewmap/fly | 7 | 0 | 4 | 3 | 0 | 0 |
| `## 8` 文本/选择/输入/等待 | 10 | 0 | 0 | 10 | 0 | 0 |
| **合计** | **85** | **14** | **38** | **33** | **0** | **0** |

- 本文件**没有任何 SUPPORTED 条目**：`statusBar.tsx`、`viewmap.tsx`、`statistics.tsx`、`toolbar.tsx`、`settings.tsx` 全部因依赖全局 `core.*` 或数据未接线被降级（PARTIAL/UNCERTAIN）。
- 29 面板明细：MISSING 6 = `action`、`centerFly`、`cursor`、`help`、`keyBoard`、`notes`；PARTIAL 11；DIFFERENT 12。

## 2. 验证结果（真实命令输出）

| 门禁 | 命令要点 | 实际输出 | 退出码 |
| --- | --- | --- | --- |
| Task 1-面板/动作/状态栏 | `event.id` / `registerAction` / `statusBarItems` 动态枚举 | `panels 29 actions 12 statusItems 12` | 0 |
| Task 1-样板覆写 | `project/functions.js` 找 `onKeyUp` | `onKeyUpAt 27916` | 0 |
| Task 2-UI 文件 | `src/client/ui` 关键屏幕存在性 | `uiFiles 20 missing []` | 0 |
| Task 2-目录 | UI 栈/组件/热键/设置/存档目录存在性 | `missing []` | 0 |
| Task 3-标题 | 13 个固定标题 | `bytes 55644 missing []` | 0 |
| Task 3-面板/动作/状态栏 | 29 首列行 + 旧证据锚点 + 12 动作 + 12 状态栏 | `panels 29 panelRows 29 missingPanelsAnywhere [] missingPanelsCol [] noTick 0 actions 12 missingActions [] status 12 missingStatus [] panelBadEvidence 0 evidenceHeader true` | 0 |
| Task 3-缺口/deny | 17 缺口 + deny-list 扫描 + 夹具 | `missingGaps [] fixtureOk true entryRows 0 supported 0 supportedDenyHits 0 noAnchor 0` | 0 |
| Task 3-双记录 | 7 个覆写的 `libs/` + `project/functions.js:` 双锚点 | `doubleRecordRows 7 missing [] badDoubleRecord 0 badAuditRows 0` | 0 |
| Task 4-范围闸门 | 相对基线新增文件数、源码/前序文档变更 | `baselineSource 75 nowSource 75 added 2 touched 0`；新增仅 `04-UI-INPUT.md` + `09-40-SUMMARY.md` | 0 |
| Task 4-摘要闸门 | SUMMARY 必含关键词 | `missing []`（快照/29/12/17/五值/零改动/零提交/无 UAT/未校准/边界声明齐全） | 0 |

- 门禁全部通过，未放宽任何断言；deny-list 夹具（`packages/client-base`、`@motajs/legacy-`、`core.ready`）均被正确识别为命中。
- 说明：含全角引号/中文的行内 `node -e` 在 PowerShell 5.1 下易被引号改写，故把计划中的 `<automated>` 原文逐字提取到 `%TEMP%/gsd-09-parity-40-gate-N.js` 后以 `node <file>` 运行；命令逻辑未改动，仅规避 shell 引号问题（记为执行偏差）。

## 3. 范围闸门与纪律

- 与 `%TEMP%/gsd-09-parity-40-baseline.txt` 对比：新增恰好 2 个文件——`09-PARITY/04-UI-INPUT.md` 与 `09-40-SUMMARY.md`；**源码/配置行集合零变化**（`baselineSource 75 = nowSource 75`）；`00-INDEX.md` / `01-DATA.md` / `02-GAMEPLAY.md` / `03-RENDER.md` 未被修改（`touched 0`）。
- 外部漂移实况：Task 4 首次运行范围闸门时，用户正在暂存 `AGENTS.md` / `dev.md`，闸门短暂报 `added 4` 并退出 1；随后用户自行提交 `bd4d263`，同一闸门复跑得到 `added 2` 并退出 0。两次都没有本计划对这两个文件的任何写入；**未放宽断言、未删除外部改动**。
- **零代码改动、零提交**：未运行任何 `git add` / `git commit` / `git stash` / `git checkout` / `git restore` / `git reset`。
- **未更新 STATE/ROADMAP**：本计划是文档补全，`STATE.md` 与 `ROADMAP.md` 保持原样。
- **无 UAT**：未运行游戏、未做浏览器验证；所有结论为静态源码审计（E1/E2/E3）。
- **未判定 P2 数据字段、P3 战斗/事件数值、P4 渲染**：相关能力只写「转交」或交叉引用。
- **估算未校准**：`confidence: low`；本计划实际产出 1 份长文档 + 1 份摘要，未按 token 反推校准后续估算。
- 22:00 检查：执行结束时本地时间 `2026-11-03 20:13`（UTC+8），**未晚于 22:00**，可继续；若后续轮次晚于 22:00 必须停止。

## 4. 偏差与问题

### 4.1 外部工作树漂移（非本计划造成）

- 执行期间工作树已有大量用户改动：`10-docs-restructure` 文档、`packages-user/client-base/src/setting/*` 新文件、`src/client/ui/*` 多处修改、`packages/common/src/logger.json` 等（Task 1 基线 148 行已包含）。本计划未触碰这些文件，也未回滚。
- 执行后期用户又提交 `bd4d263 docs: 更新 AGENTS 文档`（`AGENTS.md` / `dev.md`），新引擎 HEAD 由 `b2e94818…` 变为 `bd4d2630…`；该提交不涉及本审计源码，范围闸门复跑仍为 `baselineSource 75 = nowSource 75`。
- 影响：新 UI 屏幕的源码行号以执行时刻工作树为准；`setting.tsx` 在基线中为未跟踪文件，`src/client/ui/statistics.tsx` 等为已修改状态，故行号可能与其它快照略有差异。

### 4.2 计数与命名差异

- 新热键命令：研究文档记 68，本次逐行统计 `system.addCommand` 为 **63**（11 group）；差异已写入 `## 4.2` 与 `## 10.3`，未凑数。
- 旧工具栏：研究记「8 + 3」，实际 `main.js:121-186` 为 **8 功能按钮 + 8 个 `btn1`–`btn8`**；`btn8` 是 Alt 模式开关。
- `src/client/ui/load.tsx` 是加载进度场景（`LoadScene`），不是读档面板；读档在 `save.tsx` 的 `SaveMode.Load`。已在 `## 6` 记录，避免把文件名当成能力。
- `hotkey.tsx` 是**热键设置**，不是旧 `_drawKeyBoard` 游戏内虚拟键盘；已在 `## 2` / `## 7` / `## 9` 明确。

### 4.3 门禁执行方式偏差

- 见 `## 2` 最后一条：把 `<automated>` 原文提取到 `%TEMP%/*.js` 后运行，规避 PowerShell 对全角引号/中文的改写；未修改任何断言。

## 5. 未决与转交

- P5 `UNCERTAIN` 区间 `PAR-UNC-300`–`305`：飞行/传送运行时、虚拟键盘未接线、设置项落点、`viewmap` 地图与统计接线、统计生产方、热键命令总数差异。详见 `04-UI-INPUT.md` `## 11.1`。
- 转交 P2（`hero.notes` 等字段）、P3（商店/回放/事件执行/飞行/寻路）、P4（地图画布/缩略图/显示设置）、P6（存档与同步后端/音频/素材/全局入口）。
- 本计划不写修复建议、不实现任何面板。

## 6. 自检

- [x] `04-UI-INPUT.md` 存在，13 个固定标题齐全（Task 3 门禁 `missing []`）。
- [x] 29 个面板 ID 以反引号出现在 `## 2` 首列，恰好 29 行，每行含 `file:line` + 「原文」。
- [x] 12 个输入动作、12 个状态栏项全部出现；17 个疑似缺口全部在 `## 9` 有专项记录。
- [x] `## 1.1` 双记录表覆盖 7 个样板覆写，双锚点齐全。
- [x] 所有 SUPPORTED 行无 deny-list；本文件实际无 SUPPORTED 条目。
- [x] 只新增 2 个 Markdown；源码/配置零变化；零提交；未更新 STATE/ROADMAP；无 UAT 声明。
