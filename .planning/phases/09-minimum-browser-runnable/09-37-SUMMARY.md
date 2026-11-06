# Phase 9 Plan 37: 数据与内容对等审计 Summary

一句话：写出 `09-PARITY/01-DATA.md`，逐条审计 81 个旧怪物模板、27 项特殊属性的旧→新编号映射、51 条实际道具与装备、224 个实际图块数字键、29 个楼层字段、地图/事件存储、内容表与存档结构；每条枚举行都带 `D:/github/mota-js/...:<行号>` + 「原文摘录」，并给出新检索、五值结论、影响与证据等级。**只写 2 个 Markdown，零代码改动、零提交。**

## 实际快照（写作时刻，Task 1 重新采样）

| 项 | 值 |
| --- | --- |
| 旧引擎根目录 / 分支 | `D:/github/mota-js` / `master` |
| 旧引擎 HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55` |
| 旧引擎 dirty 行数 | 0 |
| 新引擎根目录 / 分支 | `D:/github/template` / `refine/data-client` |
| 新引擎 HEAD | `b2e94818e50cefea5e93963ddf66374763944a5d` |
| 新引擎 dirty 行数 | 140 |
| 快照时间 | `2026-11-03T10:53:00Z`（本地 `2026-11-03 18:53:00`，UTC+8） |
| 与 `00-INDEX.md` 是否一致 | HEAD 一致；dirty 由 138 → 140，增量 +2 为 09-36 产出的 `00-INDEX.md` 与 `09-36-SUMMARY.md`；不影响 DATA 结论 |

- 快照与基线原文保存于 `%TEMP%/gsd-09-parity-37-snapshot.txt` 与 `%TEMP%/gsd-09-parity-37-baseline.txt`，未改动任何仓库文件。
- 工作树持续变动属已知状态；本计划结论只对上述快照时刻的最新工作树负责。

## 实际数量与口径差异

| 项 | 研究口径 | 实际（只读枚举） | 差异处理 |
| --- | --- | --- | --- |
| 怪物模板 | 81 | 81 | 一致；逐条写入 2.3 |
| 道具 | 63 | **51** | 已在 `### 1.2 口径差异` 写「研究 63 / 实际 51」；`cls` 分布 tools 20 / items 23 / constants 8；未凑数 |
| 图块 | 224 | 224 | 数字键 1..330 含空洞（缺 17-19、66-67、74-80、95-100、105-108、110-120、139-150、154-160、171-200、268-269、273-274、276、281-299）；键集合与 `Object.keys(project/maps.js)` 逐键一致 |
| 楼层字段 | 29 | 29 | 4 个楼层文件顶层键并集 |
| 特殊属性 | 27 | 27 | `getSpecials` 1..27 逐行 |
| `project/data.js` | 14/9/18/22 | 14/9/18/22 | `### 9.1` 逐键 63 行 |
| `project/icons.js` | 9 | 9 | `### 9.2` 逐类 9 行 |
| `project/events.js` `commonEvent` | 未给数量 | 2 键（加点事件、回收钥匙商店） | `### 9.3` 逐键 2 行 |
| 图块 `cls` 类 | 研究 9 | **数据 8** | 第 9 类 `tileset` 只在 `libs/maps.js:210` 运行时分支 |
| 图块字段 | 研究 18 | 项目数据 16（含 doorInfo 子字段） | `event`/`height`/`bigImage`/`enable`/`bg`/`fg` 不在项目数据，已在 1.2 与 6.2 标注 |

- 内容层另有观察（只记录事实，不判定成因，待用户确认）：`item.jsonc` 62 条中有 11 条重复「新物品」（num 115..126），且仅 sword0/shield0 为 Equipment(4)；`tile.jsonc` 235 条比旧多 11 条 `I331`..`I341`；`enemy.jsonc` 的 `special` 键出现了超出引擎注册范围 0..26 的 27。

## P2 判定计数（按实际条目统计，未合并、未删除）

| 表 | 行数 | MISSING | PARTIAL | DIFFERENT | UNCERTAIN | SUPPORTED |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 怪物模板（2.3） | 81 | 0 | 15 | 15 | 0 | 51 |
| 特殊属性（3） | 27 | 0 | 0 | 18 | 0 | 9 |
| 道具（4.2） | 51 | 0 | 2 | 12 | 24 | 13 |
| 图块（6.3） | 224 | 18 | 48 | 0 | 0 | 158 |
| 楼层字段（7） | 29 | 15 | 7 | 2 | 2 | 3 |
| `PAR-DATA-*` 能力级条目 | 48 | 9 | 8 | 25 | 3 | 3 |
| **合计（含重复维度）** | 460 | 42 | 80 | 72 | 29 | 237 |

- 说明：上表按「表」分行统计，同一能力可能同时出现在图块行与 `PAR-DATA-*` 能力条目中，因此合计不是去重后的条目数；`PAR-DATA-*` 48 行是可直接供 P6 汇总的口径。
- 图块的 `SUPPORTED` 只指条目**定义字段**（`cls`/`id`）有对应承载；通行性新旧差异统一记在 6.2 `canPass` 行（DIFFERENT），不重复计入每条图块。
- 特殊属性 `SUPPORTED` 9 项为无参数语义项（先攻、魔攻、坚固、模仿、诅咒、无敌、重生、支援、捕捉）；参数化项均因编号与参数承载变化记 DIFFERENT。

## 门禁实测结果（全部命令的真实输出）

| 门禁 | 来源 | 真实输出 | 退出码 |
| --- | --- | --- | --- |
| Task 1 枚举门禁 | 计划 Task 1 automated #1 | `enemies 81 items 51 tiles 224 floorFields 29 bad []` | 0 |
| Task 1 特殊属性门禁 | 计划 Task 1 automated #2 | `specialRows 27` | 0 |
| Task 2 关键文件门禁 | 计划 Task 2 automated #1 | `missing []` | 0 |
| Task 2 新特殊属性门禁 | 计划 Task 2 automated #2 | `specialEntries 27 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26` | 0 |
| Task 3 标题门禁 | 计划 Task 3 automated #1 | `bytes 151866 missing []` | 0 |
| Task 3 反引号键门禁 | 计划 Task 3 automated #2 | `enemies 81 missing 0 []` / `items 51 missing 0 []` | 0 |
| Task 3 行数门禁 | 计划 Task 3 automated #3 | `specialRows 27 tileRows 224 floorFields 29 missingFloors []` | 0 |
| Task 3 逐行证据门禁 | 计划 Task 3 automated #4 | `monsterRows 81 expectedMonster 81 badMonster 0 missingMonster 0 dupMonster 0`；`itemRows 51 expectedItem 51 badItem 0 missingItem 0 dupItem 0`；`tileKeys 224 tileRange 1-330 tileRows 224 extraTile 0 missingTile 0 dupTile 0 badTile 0 field18Rows 19 bad18 0`；`floorRows 29 expectedFloor 29 badFloor 0 missingFloor 0 dupFloor 0` | 0 |
| Task 3 内容表门禁 | 计划 Task 3 automated #5 | `dataKeys 63 iconKeys 9 commonEventKeys 2 missing 0 [] bad 0 []` | 0 |
| Task 3 deny/字段门禁 | 计划 Task 3 automated #6 | `fixtureOk true entryRows 48 supported 3 supportedDenyHits 0 noAnchor 0 header true` | 0 |
| Task 4 范围闸门 | 计划 Task 4 automated #1 | 见下节「范围闸门实测」 | 0 |
| Task 4 摘要闸门 | 计划 Task 4 automated #2 | 见下节「摘要闸门实测」 | 0 |

- 12 条 `automated` 命令均按计划原文执行；其中含全角引号/中文的命令无法在 PowerShell 5.1 内联 `node -e` 中稳定运行，改为把命令**原文**写入 `%TEMP%/gsd-37-gate-<n>.js` 再执行，断言内容与计划逐字一致（见偏差记录）。

## 范围闸门实测

- 新增文件恰好 2 个：`09-PARITY/01-DATA.md` 与 `09-37-SUMMARY.md`（均未提交）。
- `git status --porcelain -uall` 中所有 `.ts` / `.tsx` / `.js` / `.mjs` / `.cjs` / `.json` / `.jsonc` 行与 Task 1 基线逐字一致。
- `09-PARITY/00-INDEX.md` 未被修改；`09-PARITY-RESEARCH.md`、`STATE.md`、`ROADMAP.md`、既有 `PLAN`/`SUMMARY` 均未被修改。

## 范围与纪律声明

- **只写 2 个 Markdown**：`09-PARITY/01-DATA.md`（183468 字节）与 `09-37-SUMMARY.md`（本文件）。`09-PARITY/` 目录内未创建其它文件。
- **零代码改动**：未修改任何源码、测试、配置、内容、依赖；未改任何既有注释。
- **零提交**：未运行 `git add`、`git commit`、`git stash`、`git checkout`、`git restore`、`git reset`；两个 Markdown 留在工作树供审查。
- **未更新 STATE**：未修改 `.planning/STATE.md`、`.planning/ROADMAP.md`、任何既有 `PLAN.md` / `SUMMARY.md`、`00-INDEX.md`、`09-PARITY-RESEARCH.md`（按本计划硬约束，GSD 常规的 STATE/ROADMAP 回写被显式禁用）。
- **未判定 P3**：未判定伤害公式、临界、光环/支援运行时语义、地图伤害、事件语义；也未判定 P4 渲染与 P5 UI，只在 `## 12` 写转交。
- **未使用 `pnpm`**：全部枚举与校验只用 `node` 与 PowerShell 5.1；未安装依赖。
- **未调用 `opencode`**：未调用 `opencode` 命令，未启动额外 opencode 会话。
- **估算未校准**：本计划 `estimate.confidence: low`；实际成本以真实读写与文档字节为准，不据此调整历史估算。
- **22:00 检查**：本机账户 `13194`；执行完毕时间本地 `2026-11-03 19:12`，早于 22:00，按规则继续（不触发停止）。

## 偏差记录

1. **[Rule 3 - 阻断项] 门禁命令改为临时脚本执行**
   - **原因**：计划中的部分 `node -e "..."` 含全角引号与中文，PowerShell 5.1 传参编码会破坏脚本字面量。
   - **处理**：用脚本从 `09-37-PLAN.md` 原样提取 12 条 `<automated>`，剥掉 `node -e "` 包装后写入 `%TEMP%/gsd-37-gate-<n>.js` 执行；断言内容未改。
   - **影响范围**：仅执行方式，不影响文档内容与判定。

2. **[Rule 1 - 可读性] 旧原文摘录按行截断**
   - **原因**：部分旧行（如 `bomb` 的 `useItemEffect`、单行 `doorInfo`）超过 300 字符，直接入表会破坏可读性。
   - **处理**：原文摘录最多取 1-3 个物理行，单行超过 110/240 字符时以 `…` 截断；截断只影响展示，不影响行号与条目判定。
   - **影响范围**：仅展示，`file:line` 与语义不变。

3. **[Rule 1 - 口径澄清] 图块 `SUPPORTED` 的判定粒度**
   - **原因**：简单图块（如 `ground`）只有 `cls`+`id` 两个定义字段，但旧通行性由全局默认规则推导。
   - **处理**：图块行的 `SUPPORTED` 只表示定义字段有承载；通行性差异统一记在 6.2 `canPass` 行，避免同一差异在 224 行里重复计入。
   - **影响范围**：仅在文档内注明口径，未放大 `SUPPORTED` 的含义。

4. **[Rule 1 - 事实记录] 内容层现状只记录不判因**
   - **原因**：`item.jsonc` 的 11 条重复「新物品」、多数装备仍记 Consumable、`enemy.jsonc` 出现 special 键 27，均属内容层现状。
   - **处理**：按 AGENTS.md 只记录事实并标注「待用户确认」，未擅自判定为缺陷。
   - **影响范围**：`## 9` 与 `### 1.2` 的事实说明。

## 自检

- [x] `09-PARITY/01-DATA.md` 存在（183468 字节 / 903 行 / LF / UTF-8）。
- [x] 15 个固定标题/子标题齐全（含 `### 1.2 口径差异`、`### 9.1`..`### 9.3`）。
- [x] 81 个怪物键、51 个道具键全部以反引号出现；`## 3` 恰好 27 行；`## 6` 恰好 224 行且首列为实际数字键；29 个楼层字段全覆盖。
- [x] 每个枚举行都有独立 `旧证据`（`file:line` + 「原文」）；10 列条目表头存在。
- [x] `SUPPORTED` 行无 deny-list/全局 `core.` 锚点，且 `PAR-DATA-*` 的 `SUPPORTED` 行均有 `packages/` 或 `src/` 锚点。
- [x] 只写 2 个 Markdown；源码/配置零变化；0 次提交；未更新 STATE/ROADMAP；`00-INDEX.md` 未改。
- [x] 无 requirement ID（`requirements: []`），Nyquist 不适用；未创建 RESEARCH / VALIDATION。
- [x] 本文件（SUMMARY）是自引用文档：字节数以磁盘最终 stat 为准，不在此写死。

## 估算与未覆盖

- **估算未校准**：`estimate.confidence: low`，原估 90000 tokens / 5 tasks；实际读写与文档规模（约 183 KB）显著高于预估，差异如实记录，不回头修改历史估算。
- **明确不覆盖**：伤害公式/临界/光环/支援/地图伤害（P3）、渲染表现与材质/autotile/大图/天气（P4）、UI 面板与状态栏展示（P5）、插件机制与存储后端细节（P6）。逐条归属见 `## 12`。
