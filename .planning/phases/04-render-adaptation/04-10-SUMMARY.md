---
phase: 04-render-adaptation
plan: 10
subsystem: render-structure
tags: [structure-migration, client-base, client-modules, read-only, d51-d57, impact-inventory]
requires:
  - phase: 04-render-adaptation
    provides: 用户裁定 D-51..D-57（04-CONTEXT.md）与移植集合（39 文件）/ 目标布局
  - phase: 04-render-adaptation
    provides: 04-01..04-09 既有产物与 04-TEXTURE-INTERFACE-IMPACT.md 的台账版式与证据纪律
provides:
  - 渲染端结构性重构第一步只读影响台账 04-STRUCTURE-MIGRATION-IMPACT.md（10 节 / 39 文件 / A–F 六类）
  - A 9 行（8 方向 + 切片）/ B 9 行（8 文件族 + 3 包）/ C 8 行（7 节点）/ D 10 行 / E 6 行 / F 10 条
  - 五道门禁输出与人工复核结论
affects: [04-render-adaptation]
actuals:
  tokens: 13567
  tasks: 3
  commits: 1
  plan_head_before: 47e71b52aefdec6085b04604df230d72f9493433
tech-stack:
  added: []
  patterns: [只读影响清点（A–F 分列 + 行类型感知锚点 + 证据行 git grep 机器证据）, 零命名变更 / 零生产代码改动, 分层风险只登记不自拟解耦方案]
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-STRUCTURE-MIGRATION-IMPACT.md
    - .planning/phases/04-render-adaptation/04-10-SUMMARY.md
  modified: []
key-decisions:
  - "本步为只读清点（D-51 / D-57 第一步），生产代码零改动、零命名变更；唯一交付物 04-STRUCTURE-MIGRATION-IMPACT.md（+ 本 SUMMARY）"
  - "被移集合当日实测 39 文件（components 13 / elements 5 / map 20 / utils/layout.ts 1），与规划日一致"
  - "porcelain 基线当日实测为空：规划日的单条用户并发改动已随 47e71b5 refactor: EnemyManager（数据端）提交；本 run 未触碰用户任何改动"
  - "反向依赖候选 4 族 13 处（shared.ts 4 / render/renderer 3 / render/use.ts 5 / render/utils 1）+ @user/client-base 自包引用 5 处；只登记风险，解耦方案归 F 类由用户裁定"
  - "legacy 按 D-55 仅报告：core.* 30 处 / loading + Mota.require 3 处 / client.* 0 命中；不修、不登记为待办"
  - "五条证据行（A-09 / B-09 / E-01 / E-04 / E-05）带 [证据行] 标记 + git grep 原样证据，豁免 ≥2 锚点计数"
  - "第二步（移植实施）未规划，待用户审阅本文件后另行规划（D-57）；全部命名问题归 F 类由用户裁定"
requirements-completed: []
duration: ~35min
completed: 2026-09-24
status: complete
---

# Phase 4 Plan 10: 渲染端结构性重构只读影响清点 Summary

**交付渲染端结构性重构（D-51 / D-57）第一步只读影响台账 `04-STRUCTURE-MIGRATION-IMPACT.md`：10 节结构 + 39 文件被移集合清单 + A–F 六类分列（A 内部交叉引用 8 方向 / B 外部导入点 8 文件族 + 3 间接依赖包 / C 7 barrel 节点与断链判定 / D 反向依赖候选 4 族 13 处 + 依赖缺口 + ?raw / E legacy 仅报告 / F 10 条待裁决），五道门禁全绿，生产代码零改动、零命名变更。**

## Performance

- **Duration:** ~35min
- **Started:** 2026-09-24
- **Completed:** 2026-09-24
- **Tasks:** 3（Task 0 为只读汇报关卡，用户已回复「可以执行」，不计入工作任务）
- **Files modified:** 1（唯一交付文档；本 SUMMARY 为执行簿记）

## Accomplishments

- 交付 `04-STRUCTURE-MIGRATION-IMPACT.md`：标题 + 7 行元信息块 + 恰好 **10** 个二级标题（`## 背景` / `## 方法` / `## 被移集合清单（39 文件）` / `## A ` / `## B ` / `## C ` / `## D ` / `## E ` / `## F ` / `## 处置`）。
- 被移集合逐条列全 **39** 文件（`components` 13 / `elements` 5 / `map` 20 / `utils/layout.ts` 1），每条含目标路径（D-53）与职责；明写「不新建 `client-base/src/render/`」「本步不移动、不复制、不预建」。
- A 类 **9** 行覆盖 8 个内部引用方向（`components→elements` / `elements→map` / →`render/renderer` / →`render/use.ts` / →`shared.ts` / →`@user/client-base` 自包 / `extension/*→map/types` + 零命中证据行）与 `layout.ts` 切片；B 类 **9** 行覆盖 8 个外部导入点文件族 + 3 个 monorepo 包间接依赖 + 对照扫描证据行；C 类 **8** 行覆盖 7 个 barrel 节点 + 导出面链条小结；D 类 **10** 行；E 类 **6** 行；F 类 **10** 条。
- 五道门禁全部转绿（详见下节）；两处「零命中」结论由 `git grep -n -F` 机器复验（`client-base` 对 `client-modules` 零命中、被移集合对 `ui`/`fx`/`weather` 零命中、`packages/` 与 `src/` 对被移集合目录零命中）。
- 人工复核抽查 16 处锚点全部指向正确（见「Issues Encountered」）；未发现偏差。

## Task Commits

1. **Task 1（tracer）：交付文档骨架 + 被移集合 39 文件清单 + `layout.ts` 端到端切片** — 与 Task 2 / 3 合并于单一提交（本计划为单文件只读台账，逐任务提交会产生空提交）
2. **Task 2：A / B / C 三类横向补齐** — 同上
3. **Task 3：D / E / F 补齐 + `## 处置` 定稿 + 五道门禁 + `04-10-SUMMARY.md`** — 本 `docs(04-10)` 提交（与交付文档一并提交）

**Plan metadata:** 同上一提交（本 SUMMARY 与交付文档一并提交）

_说明：本计划 `files_modified` 仅一个交付文档，Task 1/2/3 均写同一文件；按提交纪律「不得产生空提交」，三个任务的产出合并为一次 `docs(04-10)` 提交。_

## Files Created/Modified

- `.planning/phases/04-render-adaptation/04-STRUCTURE-MIGRATION-IMPACT.md` — 渲染端结构性重构第一步只读影响台账（唯一交付物）
- `.planning/phases/04-render-adaptation/04-10-SUMMARY.md` — 本执行簿记

## 当日实测与规划日数值对照

| 项 | 规划日（2026-09-24，HEAD `3bc37b5`） | 当日实测（HEAD `47e71b5`） | 差异 |
|---|---|---|---|
| 被移集合 | 39 文件（13 / 5 / 20 / 1） | **39** 文件（13 / 5 / 20 / 1） | 一致 |
| porcelain 基线 | 单条 ` M packages-user/data-base/src/enemy/types.ts` | **空** | 用户并发改动已随 `47e71b5 refactor: EnemyManager` 提交 |
| A 类 | 8 方向（约 30 处） | 8 方向（9 行，含切片 + 证据行） | 事实一致，行数含切片/证据行 |
| B 类 | 8 文件族（约 17 处）+ 3 包 | 8 文件族 + 3 包（9 行） | 事实一致 |
| C 类 | 7 节点 | 7 节点（8 行） | 事实一致 |
| D 类 | 9 条 | 10 行 | 事实一致，含切片基准行 |
| E 类 | 8 文件（`core.*` 约 30 处 + `loading`/`Mota.require` 3 处） | 8 文件（`core.*` **30** 处 + `loading`/`Mota.require` **3** 处） | 一致 |
| F 类 | ≥ 9 条 | **10** 条 | 一致（多 1 条装配链归属） |

## 五道门禁实测结果（Task 3）

| # | 门禁 | 命令要点 | 结果 |
|---|---|---|---|
| 1 | 只读门禁 | porcelain 逐条一致 + `04-CONTEXT.md` 未提交改动仍在 + `REQUIREMENTS.md` 未改动且 REND 仍 Pending | ✅ `OK read-only unchanged entries 0; REND-01/REND-02 still Pending` |
| 2 | 类别门禁 | A ≥ 8 / B ≥ 8 / C ≥ 7 / D ≥ 9 / E ≥ 6 / F ≥ 9、事实·基准行双锚点、证据行 `[证据行]` + `git grep`、关键词齐备、`## 处置` 存在 | ✅ `OK A9 B9 C8 D10 E6 F10` |
| 3 | 机器证据复验 | `client-base` 对 `client-modules` 零命中 + 被移集合对 `ui`/`fx`/`weather` 零命中 | ✅ `OK zero-hit claims verified` |
| 4 | 既有产物保护 + 计划范围门禁 | `04-01..04-09-*` porcelain 为空 + `-PLAN.md` 恰 10 个 + `04-10-SUMMARY.md` 已落盘 | ✅（SUMMARY 落盘后） |
| 5 | CRLF 门禁 | 交付文档 `\n` 总数 == `\r\n` 总数 | ✅ `OK CRLF lines 236` |

**Task 2 门禁：** A/B/C 行数 + 双锚点 + 证据行白名单 ✅ `OK A9 B9 C8`；零命中复验 ✅；CRLF ✅。

**Task 1 tracer 门禁：** 结构（10 标题）/ 清单（39 文件）/ CRLF / 只读基线 / 分层基线五道在最终文档上均 ✅；tracer 切片门禁（gate 3）按设计只白名单 `E-01` 一条证据行，在**最终文档**上因 Task 2 引入的 `A-09` / `B-09` 证据行而报 `BAD EVIDENCE ROW`——该门禁的契约对象是 Task 1 的**骨架中间态**（此时 A-09/B-09 尚不存在）。已用 Task-1 骨架快照（仅保留 `A-01`/`B-01`/`C-01`/`D-01`/`E-01` 切片行与 `F-01`/`F-02`）复跑该门禁，结果 ✅ `OK tracer slice rows in A-E + F items`。此为计划内部的中间态/最终态口径差，非文档缺陷。

## 人工复核结论

抽查 16 处锚点，逐条打开当日源码确认「命中处指向的确实是该符号 / 成员的引用」「目标锚点指向的确实是该声明 / barrel 行」，**全部通过，无偏差**：

- A 类：`render/components/tip.tsx:7`（`import { texture } from '../elements'`）、`render/elements/index.ts:2`（`import { MapRenderItem } from '../map'`）、`render/elements/index.ts:3`（`import { mainRenderer, tagManager } from '../renderer'`）、`render/map/renderer.ts:53`（`} from '../../shared'`）。
- B 类深层导入：`render/ui/toolbar.tsx:13`（`} from '../components/icons'`）、`render/ui/toolbar.tsx:19`（`import { Progress } from '../components/misc'`）、`fallback/ui.ts:2`（`import { TipStore } from '../render/components/tip'`）。
- C 类断链点：`render/index.tsx:45`（`export * from './components'`）、`render/index.tsx:46`（`export * from './elements'`）、`render/utils/index.ts:1`（`export * from './layout'`）。
- D 类：`render/map/renderer.ts:43-46`（4 个 `./shader/*?raw` 导入）、`client-base/package.json` 依赖集合（`@motajs/audio` / `@motajs/render` / `@motajs/client-base` / `@user/data-base` / `@user/data-state`）。
- E 类：`render/elements/cache.ts:491-492`（`const { loading } = Mota.require('@user/data-base'); loading.once('loaded', ...)`）。
- 切片：`render/utils/layout.ts:1`（`import { ElementLocator } from '@motajs/render'`）、`layout.ts:28`（`export function adjustGrid(`）。

## Decisions Made

- 三个任务的产出合并为一次 `docs(04-10)` 提交：本计划唯一 `files_modified` 是同一份只读台账，逐任务提交会产生空提交。
- 反向依赖 / 命名 / barrel 补位等全部未决项一律只登记进 D / F 类，不自拟解耦方案、不为目标文件命名拍板（AGENTS.md 命名须先反馈）。
- legacy 命中一律只报告（D-55），不修、不登记为待办。

## Deviations from Plan

None - plan executed exactly as written（无 Rule 1–4 偏差）。

说明：当日 porcelain 基线为空、与规划日（单条）不同，属计划 assumptions 明示的「执行日一律以当日实测为准」情形，已如实写入交付文档 `## 方法` 并在上表记录差异，不构成偏差。

## Issues Encountered

- **Task 1 tracer 门禁的中间态口径：** 见「五道门禁实测结果」末段——tracer 切片门禁按设计只允许 `E-01` 带 `[证据行]` 标记，最终文档含 Task 2 引入的 `A-09`/`B-09` 证据行故报 `BAD EVIDENCE ROW`；已用 Task-1 骨架快照复跑通过。属计划内部口径差，非文档缺陷。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 用户可据 `04-STRUCTURE-MIGRATION-IMPACT.md` 审阅 A / B / C 三类事实与断链点、D 类分层风险、E 类 legacy 自有面、F 类待裁决项，并裁定第二步（移植实施）的移植方案与 import 重写集。
- **第二步（移植实施）未规划**，待用户审阅后另行规划（D-57）。
- `REND-01` / `REND-02` 仍为 **Pending**（本步只清点分层纠正的影响面，未实施移植、未实施接口适配与双布局）。
- 约束提醒：`material/`、加载面、`packages/`、`src/` 均未触碰；用户并发改动（`04-CONTEXT.md` 未提交改动）未触碰、未提交。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-24*

## Self-Check: PASSED

- deliverable `04-STRUCTURE-MIGRATION-IMPACT.md`: FOUND
- summary `04-10-SUMMARY.md`: FOUND
- commit `docs(04-10)`: FOUND
- commits measured from ledger (`47e71b5..HEAD`): 1
