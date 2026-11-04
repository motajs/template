# Phase 9 Plan 38: 玩法系统对等审计 Summary

一句话：写出 `09-PARITY/02-GAMEPLAY.md`，完成玩法/行为层旧→新对等审计——**伤害管线恰好 18 个阶段**、临界 9 个分支、光环/支援/特殊光环 8 条、地图伤害 9 条、减益与状态 8 条、**129 个旧事件语句按能力类全量归并**、事件值表达式 5 条、寻路/移动/楼层切换 9 条、商店/升级/统计 11 条、**回放 15 个旧动作 vs 8 个新指令 + 24 个路线字母**；共 **246 条 `PAR-GAME-*` 条目**。**只写 2 个 Markdown、零代码改动、零提交。**

## 实际快照（写作时刻，Task 1 重新采样）

| 项 | 值 |
| --- | --- |
| 旧引擎根目录 / 分支 | `D:/github/mota-js` / `master` |
| 旧引擎 HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55` |
| 旧引擎 dirty 行数 | 0 |
| 新引擎根目录 / 分支 | `D:/github/template` / `refine/data-client` |
| 新引擎 HEAD | `b2e94818e50cefea5e93963ddf66374763944a5d` |
| 新引擎 dirty 行数 | 142 |
| 快照时间 | `2026-11-03T11:17:42Z`（本地 `2026-11-03 19:17:42`，UTC+8） |
| 与 `00-INDEX.md` / `01-DATA.md` 是否一致 | HEAD 一致；dirty 138 → 140 → **142**，每次 +2（分别为 09-36 与 09-37 各自的两份 Markdown）；**不影响玩法结论** |

- 快照与基线原文保存于 `%TEMP%/gsd-09-parity-38-snapshot.txt` 与 `%TEMP%/gsd-09-parity-38-baseline.txt`；未改动任何仓库文件。
- 工作树持续变动属已知状态；本计划结论只对上述快照时刻的最新工作树负责，不回滚、不触碰任何用户改动。

## 覆盖结果（18 阶段 / 129 语句 / 15 动作 / 8 指令 / 24 字母）

| 覆盖项 | 要求 | 实测 | 位置 |
| --- | --- | --- | --- |
| 伤害管线阶段 | 恰好 **18** 个，编号 1..18 | **18**（表首列 1..18；逐阶段给 `project/functions.js:646-803` 行号） | `## 2` |
| 旧事件语句 | **129** 个 `_action_*` 全部以反引号出现 | **129 / 129**（动态枚举自 `libs/events.js`） | `## 7.1`–`## 7.12` |
| 旧预编译 | 18 个 `_precompile_*` | **18 / 18** | `## 7.13`(a) |
| 旧系统触发器 | 8 个 `_sys_*` | **8 / 8**，并对照新 11 个 `EventTrigger` | `## 7.13`(b) |
| 旧回放动作 | **15** 个 `registerReplayAction` 全部以反引号出现 | **15 / 15** | `## 11.1` |
| 新回放指令 | 8 个 `ReplayCode` 全部出现 | **8 / 8**（Up/Right/Down/Left/Teleport/UseItem/Equip/Unequip） | `## 11.2` |
| 路线字母表 | 单字母行 ≥20 | **24**（研究写 21 / 实际 **24**：20 个单字符码 + `U D L R`） | `## 11.3` |
| 新内建函数 / 语句种类 | 7 内建 + 11 `StatementType` | **7 / 11** 全部列出 | `## 7.13`(c) |
| 特殊属性映射引用 | 按 `01-DATA.md` `## 3` 语义映射，不按编号对齐 | 旧 15/16/18/24/27 → 新 13/14/16/22/25；旧 17/22 明确「非地图伤害」 | `## 5`、`## 1` |
| 双记录（`libs` 默认 vs `project/functions.js` 覆盖） | 受影响条目同时给两处锚点 | 29 个覆写清单 + 各条目双锚点 | `## 1.2` 与全表 |

## `PAR-GAME-*` 判定计数（按实际条目，未合并、未删除）

| 小节 | 条目数 | MISSING | PARTIAL | DIFFERENT | UNCERTAIN | SUPPORTED |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `## 2` 伤害管线 18 阶段 | 18 | 1 | 1 | 11 | 0 | 5 |
| `## 3` 临界算法 | 9 | 3 | 4 | 2 | 0 | 0 |
| `## 4` 光环、支援与特殊光环 | 8 | 0 | 2 | 4 | 0 | 2 |
| `## 5` 地图伤害 | 9 | 2 | 1 | 5 | 0 | 1 |
| `## 6` 减益与状态 | 8 | 0 | 2 | 4 | 0 | 2 |
| `## 7` 事件 129 语句能力归并 | 129 | 87 | 31 | 0 | 0 | 11 |
| `## 8` 事件值表达式 | 5 | 1 | 0 | 3 | 1 | 0 |
| `## 9` 寻路、移动与楼层切换 | 9 | 2 | 3 | 4 | 0 | 0 |
| `## 10` 商店、升级、统计 | 11 | 4 | 2 | 3 | 1 | 1 |
| `## 11` 回放命令与路线编码 | 40 | 27 | 4 | 8 | 0 | 1 |
| **合计** | **246** | **127** | **50** | **44** | **2** | **23** |

- 差异合计（前四类之和）= `127 + 50 + 44 + 2` = **223**；条目总数 = 223 + 23 = **246**。
- 未计入统计：`## 4` 的新 26「特殊光环」标 `NEW-ONLY`；`## 7.13` 的预编译/触发器对照表（18 + 8 + 11 行）为对照表，不是独立条目，避免与 `## 7` 重复计数。

## 已知差异（计划要求必须单列，全部已写成 DIFFERENT）

| 已知差异 | 旧 | 新 | 位置 |
| --- | --- | --- | --- |
| 连击编号 | 特殊码 **4 / 5 / 6** 三码（2 连击 / 3 连击 / n 连击） | 统一为新码 **4**「n连击」，次数在 `value` | `## 2` 阶段 6 |
| 支援 `extraInfo.turn` | `guard_before_current_enemy = false` 时支援怪回合**不并入**当前怪 | 无条件 `turn += extraInfo.turn`（直接相加） | `## 2` 阶段 13、`## 4` |
| 临界上限（坚固 / 模仿） | 坚固 3 与模仿 10 都走 `_nextCriticals_special` 返回 `[]` | 只有坚固返回 `Infinity`；**模仿无短路**，会进入二分 | `## 3` |
| 无敌返回值 | `null`（不可战斗） | `{damage: Infinity, turn: 0}` | `## 2` 阶段 3 / 11 |
| `counterAttack` 默认值 | 回退全局 `values.counterAttack`，按 `turn` 次计入 | 特殊值缺省 **0**，并入每回合伤害后按 `(turn - 1)` 次计入 | `## 2` 阶段 7 / 14 |
| 自爆（旧 19 → 新 17） | 战后无条件 `hp = 1`，差值计入统计 | 计算器内 `damage = Math.max(damage, hp - 1)` | `## 2` 补充 |
| 光环与坚固/模仿顺序 | 先坚固/模仿，后乘光环 | 先光环 `buildupBase`，后最终效果 `buildupFinal` | `## 4` |
| 光环叠加 | 百分比求和后一次乘 | 逐光环 `floor(base×pct/100)` 线性相加，且无 id 去重 | `## 4` |

## 门禁实测结果（全部命令的真实输出）

| 门禁 | 来源 | 真实输出 | 退出码 |
| --- | --- | --- | --- |
| Task 1 快照字段 | 计划 Task 1 acceptance | `OLD_HEAD/OLD_DIRTY/NEW_HEAD/NEW_DIRTY/TIME` 齐备；`OLD_DIRTY=0`、`NEW_DIRTY=142` | 0 |
| Task 1 枚举源 | 计划 Task 1 automated #1 | `actions 129 precompile 18 sys 8 replay 15 bad []` | 0 |
| Task 1 18 阶段 | 计划 Task 1 automated #2 | `getDamageInfoLines 964 stageRows 18` | 0 |
| Task 2 关键文件 | 计划 Task 2 automated #1 | `missing []` | 0 |
| Task 2 `ReplayCode` | 计划 Task 2 automated #2 | `missingReplayCodes []` | 0 |
| Task 3 标题闸门 | 计划 Task 3 automated #1 | `GATE-A bytes 84265 missing []` | 0 |
| Task 3 129 反引号闸门 | 计划 Task 3 automated #2 | `GATE-B actionNames 129 missing 0 []` | 0 |
| Task 3 阶段/回放/字母闸门 | 计划 Task 3 automated #3 | `GATE-C stageRows 18 replayActs 15 missingActs [] letterRows 24 missingCmd []` | 0 |
| Task 3 表头/deny/锚点闸门 | 计划 Task 3 automated #4 | `GATE-D fixtureOk true entryRows 10 supported 0 supportedDenyHits 0 noAnchor 0 header true` | 0 |
| Task 4 范围闸门 | 计划 Task 4 automated #1 | **未通过**：`SCOPE baselineSource 74 nowSource 74 added 3 touched 0 hasDoc true hasSum true`；新增 3 条 = 本计划两份 Markdown + 并发出现的 `09-42-PLAN.md`（非本计划产出，未触碰） | **1** |
| Task 4 摘要闸门 | 计划 Task 4 automated #2 | 见「范围闸门实测与偏差 1」 | 0 |

- 上述 `automated` 命令全部按计划原文**写入 `%TEMP%` 的 `.js` 文件后执行**（PowerShell 5.1 内联 `node -e` 会被中文/全角引号破坏字面量），断言内容与计划逐字一致；断言未放宽、未删行、未把「无对应」写成支持。
- `GATE-D` 的 `entryRows` 为 10 是 `## 12.1` 的 ID 区间行数（`PAR-GAME-001–PAR-GAME-018` 等 10 行 + 合计行不匹配前缀）；`supported`/`noAnchor` 均为 0 表示这些行没有冒充支持判定。

## 范围闸门实测与偏差（重要，如实记录）

- **通过的部分**：`baselineSource 74` 与 `nowSource 74` 逐字一致 → 源码/配置**零变化**；`touched 0` → `09-PARITY/00-INDEX.md` 与 `01-DATA.md`**未被修改**；`hasDoc true`、`hasSum true`。
- **未通过的部分**：计划要求「新增恰好 2 条」。实测 `added 3`，多出的一条是 `.planning/phases/09-minimum-browser-runnable/09-42-PLAN.md`（`??` 未跟踪），它在 Task 1 基线之后由**并发流程**产生，不是本计划写入。按硬约束「工作树可能并发变动，记录快照、绝不回滚或触碰用户改动」，本计划**未删除、未修改**该文件，因此范围闸门的「恰好 2 条」断言**如实记为失败**，不放宽断言、不伪造数字。
- **本计划实际写入**：恰好 2 个文件——`09-PARITY/02-GAMEPLAY.md` 与 `09-38-SUMMARY.md`。
- **并发修改披露（如实记录，非本计划所为）**：执行期间工作树还有他人/其它流程的改动——`.planning/phases/09-minimum-browser-runnable/09-35-PLAN.md`（19:32:06）、`09-42-PLAN.md`（19:34:49）、`.planning/phases/10-docs-restructure/10-CONTEXT.md`（19:38:05），以及**源码** `packages-user/client-base/src/setting/system.ts`（19:31:21）与 `.../setting/types.ts`（19:30:15）。后两者在基线时已是 dirty（`??` / ` M`），内容变化不会改变 porcelain 行，因此「porcelain 逐字一致」的门禁无法感知；本计划**从未打开这两个文件写入**，也未回滚它们。`09-PARITY/00-INDEX.md`（18:47:38）与 `01-DATA.md`（19:16:17）的 mtime 均早于本计划快照（19:17:42），可证未被改动。

## 范围与纪律声明

- **只写 2 个 Markdown**：`09-PARITY/02-GAMEPLAY.md`（117655 字节 / 540 行 / LF / UTF-8）与本文件。`09-PARITY/` 目录内未创建其它文件。
- **零代码改动**：未修改任何源码、测试、配置、内容、依赖、注释；`git status --porcelain -uall` 的全部 `.ts/.tsx/.js/.mjs/.cjs/.json/.jsonc` 行与 Task 1 基线逐字一致（74 行对 74 行）。注：执行期间他人对 `packages-user/client-base/src/setting/{system,types}.ts` 的改动属并发工作，不计入本计划（见上节披露）。
- **零提交**：未运行 `git add`、`git commit`、`git stash`、`git checkout`、`git restore`、`git reset`；两个 Markdown 留在工作树供审查。
- **未更新 STATE**：未修改 `.planning/STATE.md`、`.planning/ROADMAP.md`、任何既有 `PLAN.md` / `SUMMARY.md`、`00-INDEX.md`、`01-DATA.md`、`09-PARITY-RESEARCH.md`（GSD 常规的 STATE/ROADMAP 回写在本次硬约束下被显式禁用）。
- **未判定 P2**：未判定怪物模板字段、道具字段、图块字段、存档结构；只引用 `01-DATA.md` `## 3` 的特殊属性映射。同样**未判定 P4 渲染与 P5 UI**，相关行统一写「转交」。
- **技能系统等缺口不作修复建议**：只记录「旧有/新无/差异/不确定」。
- **无 UAT / 无 E2E**：全部为静态源码审计（E1/E2/E3），未启动游戏、未运行浏览器。
- **未使用 `pnpm`**：全部枚举与校验只用 `node` 与 PowerShell 5.1；未安装依赖、未改 workspace。
- **未调用 `opencode`**：未调用 `opencode` 命令，未启动额外 opencode 会话。
- **估算未校准**：本计划 `estimate.confidence: low`（原估 85000 tokens / 5 tasks）；实际成本以真实读写与文档字节为准，不据此调整历史估算。
- **22:00 检查**：本机账户 `13194`；执行完毕时间本地 `2026-11-03 19:40`，早于 22:00，按规则继续（不触发停止）。

## 偏差记录

1. **[Rule 3 - 环境漂移，未修复] 范围闸门「新增恰好 2 条」失败**
   - **发现于**：Task 4 范围闸门。
   - **现象**：`added 3`，多出 `?? .planning/phases/09-minimum-browser-runnable/09-42-PLAN.md`；该文件在基线（19:17:42）之后出现，不是本计划写入。
   - **处理**：按硬约束不回滚、不删除他人改动，如实记录失败；同时给出等价审计（源码 74=74、`touched 0`、本计划实际写入恰好 2 个 Markdown）。**未放宽断言**。
   - **影响范围**：只影响「新增计数」这一条断言，不影响文档内容、判定与纪律声明。

2. **[Rule 3 - 工具缺陷自纠] 基线首行 BOM 导致误判「新增」**
   - **发现于**：Task 4 范围闸门首次执行，`M .planning/phases/10-docs-restructure/10-CONTEXT.md` 被误判为新增。
   - **原因**：`Set-Content -Encoding UTF8`（PowerShell 5.1）给 `%TEMP%/gsd-09-parity-38-baseline.txt` 首行加了 UTF-8 BOM，porcelain 的 ` M ` 前导空格被 BOM 顶掉。
   - **处理**：仅对**临时基线文件**去除 BOM（不涉及任何仓库文件），使首行恢复为 ` M …`；修正后比较通过（该文件不再计入新增）。
   - **影响范围**：仅 `%TEMP%` 临时文件。

3. **[Rule 3 - 执行方式] 门禁命令写入临时脚本执行**
   - **原因**：计划里的 `node -e "..."` 含中文与全角引号，PowerShell 5.1 传参编码破坏字面量。
   - **处理**：把命令**原文**落到 `%TEMP%/g-*.js` / `%TEMP%/gsd-09-parity-38-*.js` 再执行；断言与输出字段与计划完全一致。
   - **影响范围**：仅执行方式。

4. **[Rule 4 - 口径声明（已按 00-INDEX 折中，不视为阻断）] 条目 ID 采用「区间 + 小节行序」映射**
   - **原因**：`## 2` 阶段表首列必须是数字（用于 18 行闸门）、`## 11.3` 首列必须是单字母（用于 ≥20 行闸门）、`## 7` 首列必须是旧类型名，三者都不能再塞 `ID` 列。
   - **处理**：在 `## 12.1` 给出连续 `PAR-GAME-001`–`PAR-GAME-246` 区间，并声明「区间内按该小节表行序一一对应」；ID 连续、不跳号、不复用。**未新增/删改任何条目**。
   - **影响范围**：仅 ID 呈现方式；判定与计数不受影响。

5. **[Rule 1 - 可读性] 旧原文摘录按行截断**
   - **原因**：部分旧行较长，且含 `||`（Markdown 表格分隔符）。
   - **处理**：摘录以 `…` 截断、`|` 一律转义为 `\|`；`file:line` 与语义不变。
   - **影响范围**：仅展示。

## 自检

- [x] `09-PARITY/02-GAMEPLAY.md` 存在（117655 字节 / 540 行 / LF / UTF-8 / 无替换字符）。
- [x] 15 个固定标题齐全（1 个一级 + `## 0`..`## 13`），另有 28 个 `###` 子标题。
- [x] `## 2` 恰好 18 行且首列为 1..18；129 个 `_action_*` 全部以反引号出现；15 个旧回放动作全部以反引号出现；`## 11.3` 单字母行 24 行（≥20）；8 个 `ReplayCode` 全部出现。
- [x] 事件归并表头存在（`| 旧类型 | 能力类 | 旧证据 | 新 builtin / StatementType / 无 | 新检索 | 新结论 | 影响 | 证据等级 | 备注 |`）。
- [x] 全文任一含 SUPPORTED 的行都不包含 deny-list 锚点或全局 `core.`；`PAR-GAME-*` 行的支持判定均有 `packages/`/`packages-user/`/`src/` 锚点（实测 `supportedDenyHits 0`、`noAnchor 0`）。
- [x] 文档内引用的 57 个新引擎路径全部存在（脚本校验 `paths 57 missing 0`）。
- [x] 只写 2 个 Markdown；源码/配置零变化；0 次提交；未更新 STATE/ROADMAP；`00-INDEX.md`/`01-DATA.md` 未改。
- [x] 无 requirement ID（`requirements: []`），Nyquist 不适用；未创建 RESEARCH / VALIDATION。
- [x] 本文件（SUMMARY）是自引用文档：字节数与行数以磁盘最终 stat 为准，不在此写死。

## 未决与未覆盖

- `PAR-UNC-100`（旧文本前缀 `\t[名字,图标]` 的新承接，P5）、`PAR-UNC-101`（统计计算数据源，P6+P5）、`PAR-UNC-102`（非当前楼层怪物的伤害/光环/支援是否与旧一致）、`PAR-UNC-103`（新 26 特殊光环多层叠加顺序）已在 `## 13.1` 记录，均未擅自判为缺陷。
- 明确不覆盖：P2 数据字段、P4 渲染表现、P5 UI 布局与输入、P6 插件/资源/存档/服务端、任何运行期 UAT/E2E。
