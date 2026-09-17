---
phase: 07-data-fixes
plan: 14
subsystem: data-layer
tags: [wontfix, user-adjudication, data-fallback, legacy-compat, 06-17-7, audit-item-c, d-09, no-code-change, phase-07-closure]

requires:
  - phase: 07-data-fixes
    provides: "07-13 map invalidation boundaries (CR-02 / IN-01 / #06-17-8) and its D-44 file-level baseline (66 files / 737 passed / 0 failed / 1 skipped)"
  - phase: 07-data-fixes
    provides: "07-LOADSTATE-AUDIT.md item C (#06-17-7) — the last remaining open audit row feeding this plan"
  - phase: 06-unit-tests
    provides: "D-44 file-level three-step gate and D-06's retained code-147 skip"
provides:
  - "#06-17-7 / audit item C dispositioned as WONTFIX by user adjudication (2026-09-17): packages-user/data-fallback is a legacy-engine compatibility layer slated for deletion, so its core.status.hero proxy closure is intentionally NOT touched"
  - "Task 0 <record> of 07-14-PLAN.md carries the verbatim user answer, the per-Q (Q1..Q4 = 不改动) dispositions, the rationale and the verdict; committed alone in 25b213a"
  - "Phase 7 test:ci closure baseline re-recorded as 66 files / 737 passed / 0 failed / 1 skipped — unchanged from 07-13, because no new test file is created (file count stays 66, NOT the 67 the plan originally expected)"
  - "Zero code changes, zero new tests, zero new dependencies: hero.ts / hero.test.ts / flag.ts / index.ts and every data-side file untouched; the plan's declared must_haves artifacts are registered as an intentional, user-adjudicated deviation rather than an incomplete execution"
  - "Phase 7 tracking advanced to 14/14; 07-VERIFICATION.md flagged stale and /gsd-verify-work 7 required"
affects: [07-data-fixes, phase-07-verification, packages-user/data-fallback, phase-05-legacy-migration]

actuals:
  tokens: 662
  tasks: 3
  commits: 3
  plan_head_before: a80e383892b9b10af9342f02f2e5b5edbdb7244d

tech-stack:
  added: []
  patterns:
    - "WONTFIX by adjudication is a first-class Phase 7 close-out: an audit item may be closed by user ruling (不修复) under success criterion 1 without any code change, provided the ruling is locked verbatim in the plan's Task 0 <record>"
    - "A no-change plan still runs the phase closure baseline: the full suite is re-recorded so the phase-closure gate has a measured snapshot even when the plan touches no source file"
    - "Missing must_haves artifacts are reported as a recorded deviation with the authorising adjudication, never as an incomplete execution"

key-files:
  created: []
  modified:
    - .planning/phases/07-data-fixes/07-14-PLAN.md

key-decisions:
  - "Task 0 Q1..Q4 = 不改动 (user, 2026-09-17; verbatim: 「关于旧引擎的兼容部分不动，很快就要删除了，没必要改。」) — the legacy data-fallback compatibility layer is slated for deletion, so there is no proxy-resolution change, no get-semantics change, no regression test file, and no patchFlags handling"
  - "#06-17-7 / audit item C = wontfix (经用户裁定不修复): a legal Phase 7 success-criterion-1 disposition, not a leftover"
  - "Task 1 skipped in full by the adjudication — hero.ts is not modified and the package's first test file (hero.test.ts) is intentionally NOT produced; packages-user/data-fallback stays at zero tests"
  - "pnpm test:ci closure baseline stays 66 files / 737 passed / 1 skipped — the plan's original 66→67 expectation is superseded because no test file is created"
  - "No WINDOWS.md entry is created or modified (D-14: #06-17-7 has no ledger entry and must not get one)"

patterns-established:
  - "Adjudicated WONTFIX recorded with a verbatim transcript in the Task 0 <record>, so a later verifier audits the rulings without re-deriving them"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "#06-17-7 / audit item C adjudicated WONTFIX and locked: 07-14-PLAN.md Task 0 <record> holds the verbatim user answer, Q1..Q4 不改动, the rationale (compat layer slated for deletion) and the verdict; committed alone in 25b213a"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "git show 25b213a -- .planning/phases/07-data-fixes/07-14-PLAN.md (Task 0 <record>; +20/-3, no other file in the commit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The plan's declared must_haves artifacts — a packages-user/data-fallback/src/hero.ts modification and a new hero.test.ts — were intentionally NOT produced per the adjudication; recorded as a deviation, not as an incomplete execution"
    verification: []
    human_judgment: true
    rationale: "The non-production of these artifacts IS the adjudicated outcome; no test or command can prove a deliberate omission is correct — only the user's ruling can. A verifier must read the Task 0 <record> and confirm the omission matches it."
  - id: D3
    description: "Phase 7 closure baseline re-recorded: pnpm test:ci = 66 files / 737 passed / 0 failed / 1 skipped; zero it.skip added; the single skip remains equipment.test.ts:353 code 147 (D-06)"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "pnpm test:ci (Test Files 66 passed (66); Tests 737 passed | 1 skipped (738))"
        status: pass
    human_judgment: false

# Metrics
duration: 3min
completed: 2026-09-17
status: complete
---

# Phase 7 Plan 14: Legacy hero proxy (`#06-17-7` / audit item C) Summary

**`#06-17-7`（审计条目 C，`data-fallback` 的 `core.status.hero` 代理闭包）经用户裁定判为 **WONTFIX**——旧引擎兼容层即将删除，Q1..Q4 一律不改动；本计划**零代码改动、零新增测试、零新增依赖**，Phase 7 收口基线复录为 **66 文件 / 737 通过 / 0 失败 / 1 跳过**。**

## Scope

- **条目:** `#06-17-7`（`07-LOADSTATE-AUDIT.md` 审计**条目 C**）：`packages-user/data-fallback/src/hero.ts` 的 `core.status.hero` 代理闭包持有 `state.hero.getModifiableAttribute()` 的一次性结果（`hero.ts:8-23`）；若仓外旧引擎读档后未重发 `resetHero`，代理会读写孤儿属性。
- **计划:** `07-14`（Phase 7 第 14 个、也是最后一个计划；`depends_on: 07-13`，Wave 14）。
- **性质:** 本计划产出**文档/裁决登记**，不产出任何源码或测试。

## Verdict — WONTFIX by user adjudication (经用户裁定不修复，本计划未执行修复)

**用户原话（逐字，锁于 `07-14-PLAN.md` 的 Task 0 `<record>`，提交 `25b213a`）：**

> 「关于旧引擎的兼容部分不动，很快就要删除了，没必要改。」

| 裁决点 | 结论 | 落地 |
| --- | --- | --- |
| Q1 代理的活属性解析方式 | **不改动**（选项 A/B/C 均不采用） | `hero.ts` 一行未改 |
| Q2 `get` 返回基础属性还是最终属性 | **不改动**（保持 `getBaseAttribute`） | `hero.ts` 一行未改 |
| Q3 回归测试的落点与入口 | **不新建测试** | `hero.test.ts` **未创建**；该包维持零测试 |
| Q4 `patchFlags` 是否一并处理 | **不改动** | `flag.ts` / `index.ts` 一行未改 |

**理由:** `packages-user/data-fallback` 是面向仓外旧引擎的**兼容层**，按规划**即将删除**；为很快消失的代码修复引用口径并新建测试不具价值。条目 C 的严重度本身为「低-中，取决于仓外 `resetHero` 是否重发」，风险随兼容层删除自然消解。

**合规性:** 本裁决是 `ROADMAP.md` Phase 7 成功标准第 1 条（「…全部处置完毕（**修复或经用户裁定改契约/不修复**）」）中的「经用户裁定不修复」一支——条目**已闭合**，而非遗留。

> ⚠️ **计划声明的 `must_haves.artifacts`（`hero.ts` 修改、`hero.test.ts`）按裁决有意未产出**——这是**已登记偏差**（见下方「Deviations from Plan」），**不是执行不完整**。

## Performance

- **Duration:** ~3 min（本地 18:00 → 18:03）；`pnpm test:ci` 单独占 ~21s，`vue-tsc --noEmit` 过滤检查占其余大半
- **Started:** 2026-09-17T10:00:04Z（本地 18:00:04）
- **Completed:** 2026-09-17T10:02:39Z（本地 18:02:39）
- **Tasks:** 3 个执行单元（Task 0 裁决锁 / Task 2 门禁+SUMMARY / Task 3 tracking）；**计划的 Task 1 经裁决整跳过**
- **Files modified:** 1（仅 `.planning/phases/07-data-fixes/07-14-PLAN.md`；**零源码、零测试**）
- **Diff size:** +20 / −3（`git diff --numstat a80e383..HEAD`，仅一个 `.md` 文件）；实测 `actuals.tokens = 662`（diff 字符数 2647 / 4），相对 `estimate.tokens = 40000` 偏低 60.4×（估算假设要写实现+首个测试文件，实际为纯文档裁决）

## Accomplishments

- `#06-17-7`（审计条目 C）**闭合为 WONTFIX**：用户裁决逐字写入 `07-14-PLAN.md` 的 Task 0 `<record>`（Q1..Q4 逐条 = 不改动 + 理由 + 处置结论 + 2026-09-17）。
- **零代码/零测试/零依赖**：`hero.ts`、`flag.ts`、`index.ts`、`hero.test.ts`（未创建）与所有数据侧文件均无改动。
- Phase 7 **收口基线复录**：`pnpm test:ci` = 66 文件 / 737 通过 / 0 失败 / 1 跳过；`it.skip` 仍恰 1 条（`equipment.test.ts:353` 码 147，D-06）。
- Phase 7 计划计数推进至 **14/14**，`07-VERIFICATION.md` 标记失效并要求重跑。

## Task Commits

`actuals.commits = 3`（`plan_head_before = a80e383892b9b10af9342f02f2e5b5edbdb7244d`；`git rev-list --count a80e383..HEAD`）。全部为**普通提交、钩子生效**，未使用 `--no-verify`、未 amend 任何提交：

1. **Task 0: 锁定用户裁决** — `25b213a` (docs) — `docs(07-14): lock user adjudication — #06-17-7 wontfix, compat layer slated for removal`；仅 `.planning/phases/07-data-fixes/07-14-PLAN.md`（+20/−3），无删除文件
2. **Task 2: SUMMARY** — `docs(07-14): complete legacy hero proxy plan as user-adjudicated wontfix`（本文件）
3. **Task 3: tracking** — `docs(phase-07): update tracking after plan 07-14`（`STATE.md` + `ROADMAP.md`，如 `state.json` 被工具改写则一并纳入）

**Task 1 无提交**（经裁决整跳过）。

## Files Created/Modified

- `.planning/phases/07-data-fixes/07-14-PLAN.md` — **唯一改动文件**：Task 0 `<record>` 由占位文字替换为完整裁决记录（用户原话逐字 + Q1..Q4 对照表 + 理由 + WONTFIX 结论 + 成功标准第 1 条合规说明 + 对 Task 1–2 的效力）。**未修改任何既有 jsDoc / 注释**（AGENTS.md 规则）——本文件是被编辑的 `PLAN.md`，其 `<record>` 属计划内授权填写的占位区。
- **未创建**：`packages-user/data-fallback/src/hero.test.ts`（按 Q3 裁决）。
- **未修改**：`packages-user/data-fallback/src/hero.ts`、`src/flag.ts`、`src/index.ts`、`WINDOWS.md`、以及任何 `packages*` 源码/测试。

## Decisions Made

| 裁决 | 落地位置 | 可观测证据 |
| --- | --- | --- |
| **Q1/Q2/Q3/Q4 = 不改动** | `07-14-PLAN.md` Task 0 `<record>` | `git show 25b213a -- .planning/phases/07-data-fixes/07-14-PLAN.md` |
| **处置 = wontfix（经用户裁定不修复）** | 同上 | 同上；`git log a80e383..HEAD -- packages-user/data-fallback/` **为空**（零提交触碰该包） |
| **Task 1 整跳过** | 本 SUMMARY「Deviations」 | `git status --short` 无 `data-fallback` 条目；`hero.test.ts` 不存在 |

**「不写台账」口径（D-14）**：`#06-17-7` 在 `WINDOWS.md` **无入账 id**，故**不新建条目、不执行 `fixed`/`waive`**；实测 `Select-String .planning/WINDOWS.md -Pattern "06-17"` 无命中，`git status --short -- .planning/WINDOWS.md` 为空，台账仍为 11 open / 0 waived / 17 fixed / 28 total。

## Deviations from Plan

### 经用户裁决的整任务跳过（记录为偏差，而非执行不完整）

**1. [WONTFIX 裁决 - Task 1 整跳过] `#06-17-7` 的修复与其回归测试按用户裁定不产出**

- **Found during:** Task 0 关卡（D-09）——用户裁决 `Q1..Q4 = 不改动`
- **Issue:** 计划 Task 1 原本要求修改 `packages-user/data-fallback/src/hero.ts`（代理解析改活属性）并**新建该包首个测试文件** `hero.test.ts`。裁决判定兼容层整体不动，故两项产出均不应发生。
- **处置:** **整跳过 Task 1**，不修改 `hero.ts`、不创建 `hero.test.ts`、不触碰 `flag.ts`/`index.ts`。计划 `must_haves.artifacts` 中的 `hero.ts` 修改与 `hero.test.ts` **按裁决有意未产出**；`must_haves.truths` 中三条含「新增回归断言」的表述**随裁决作废**（改由 Task 0 `<record>` 的 WONTFIX 结论取代）。
- **Files affected:** **零**（无源码/测试改动）
- **Verification:** `git log a80e383..HEAD -- packages-user/data-fallback/` 为空；`Test-Path packages-user/data-fallback/src/hero.test.ts` = false；`git diff --name-only a80e383..HEAD` 仅一个 `.md`
- **Committed in:** `25b213a`（裁决锁）与本 SUMMARY

### 基线预期偏差（计划表述校准）

**2. [基线口径 - 文件数 66→67 未发生] 计划 `<objective>` 预期的「66→67」被裁决取代**

- **Found during:** Task 2 全量套件复录
- **Issue:** 计划 `<objective>`/Task 2 预期「执行后文件数应变为 67（新增 `hero.test.ts`），这是唯一被允许的基线变化」。因 Task 1 跳过，**无新增测试文件**。
- **处置:** 基线**维持 66 文件 / 737 通过 / 1 跳过**（与 07-13 收尾一致）；计划中「67」的表述按裁决 superseded。如实登记，不改任何文件。
- **Files affected:** 表述面（本 SUMMARY）
- **Committed in:** 本 SUMMARY

**Total deviations:** 2 recorded（1 项经裁决的整任务跳过 + 1 项基线预期校准）。均为**用户裁决的直接后果**，非 auto-fix；无 Rule 1–3 自动修复、无 Rule 4 架构变更。

## Gate Results (Task 2 — D-12/D-44 文件级 + 全量基线)

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| ESLint（计划声明文件，**只读、未用 `--fix`**） | `pnpm exec eslint packages-user/data-fallback/src/{hero,flag,index}.ts` | **exit 0，无输出**（0 错误） |
| 类型（文件级，**vacuous clean**） | `pnpm exec vue-tsc --noEmit` → 过滤 `packages-user/data-fallback` | **0 命中**（整仓 27 条诊断均属并发 WIP 的 `client-*`/legacy 渲染端，与本计划无关；**未以整仓退出码判定**，按 06-RESEARCH Pitfall 4） |
| 全量套件 | `pnpm test:ci` | **`Test Files  66 passed (66)`** / **`Tests  737 passed | 1 skipped (738)`**（0 失败，Duration 21.12s） |
| 跳过项 | `git grep "it\.skip(" -- "*.test.ts"` | 仓库恰 **1 条**：`packages-user/data-base/src/hero/equipment.test.ts:353`（码 147，D-06）；**未新增 `it.skip`** |
| 改动面 | `git diff --name-only a80e383..HEAD` | 仅 `.planning/phases/07-data-fixes/07-14-PLAN.md`；**零源码、零测试** |

> **vacuous clean 说明：** 本计划**无任何改动文件**，故 D-44(b)「改动文件类型错误」与文件级 eslint 均**为空集上成立**（vacuously clean）。上列的 eslint/vue-tsc 结果是对**计划声明路径**（未被改动）的只读复核，用于给出收口时的具体观测值，不构成「因为改动而通过」的判据。

## Phase 7 本轮（07-10..07-14）完整闭合清单

> 供 `/gsd-verify-work 7` 重跑核对。C–H + CR-01/CR-02 全部收口后，`07-14` 是本轮**最后一个**计划。

| 计划 | 条目 | 处置 | 状态 |
| --- | --- | --- | --- |
| **07-10** | replay：CR-01（`set()` 索引数组损坏）/ 审计 H `#06-17-3`（`setReplayArray` 漏 `expireStreams`）/ WR-01（bigint 长度字节溢出）/ WR-02（参数计数用未截断长度）/ WR-03（编解码格式版本）/ WR-07（`insert`/`delete`/`set` 越界校验） | 修复 | **已闭合（已执行）** |
| **07-11** | 容器同引用：`#06-17-4`（`equipStore` 重建实例脱钩）/ `#06-17-5`（`flag/system` 字段脱钩）/ `#06-17-6`（followers 重建脱钩） | 修复 | **已闭合（已执行）** |
| **07-12** | 装备/属性存档正确性：WR-04（装备修饰器活值未持久化）/ WR-05（`deleteModifierByIndex` 簿记残留）/ WR-06（`HeroEquipment.loadState` 读档写录像） | 修复 | **已闭合（已执行）** |
| **07-13** | 地图：CR-02（`MapDamage` 幽灵伤害）/ `#06-17-8`（`MapLayer.setMapRef` 失效契约 + 读档旧动态块累积） | 修复（Q2=A 零改动的契约保留） | **已闭合（已执行，`07-13-SUMMARY.md`）** |
| **07-14** | legacy：`#06-17-7`（`data-fallback` `core.status.hero` 代理闭包持有读档前属性） | **WONTFIX（经用户裁定不修复）** | **本条：已闭合（零代码，`25b213a`）** |

### 审计 `/` 登记对照

| 条目 | 结论 | 锚点 |
| --- | --- | --- |
| **`#06-17-7`（审计 C）** | **WONTFIX / 经用户裁定不修复**：`packages-user/data-fallback` 兼容层即将删除，Q1..Q4 一律不改动；条目按 Phase 7 成功标准第 1 条闭合 | `25b213a`（仅 `<record>` 裁决锁；无源码提交） |
| 审计「未确定项 1（仓外 `resetHero` 是否重发）」 | **随 WONTFIX 消解**：兼容层删除后该不确定性不再影响本仓正确性；本计划**不**依赖该事件，也**不**为其做任何重绑 | 同上 |
| Q4 `patchFlags` 处置 | **不改动**（`flag.ts`/`index.ts` 一行未改） | 无提交（零改动） |
| `WINDOWS.md` | **未新建、未改动、未 `fixed`/`waive`**（D-14：`#06-17-7` 无入账 id） | 无 |

## Issues Encountered

**1. 工作树存在并发用户 WIP（未纳入任何提交）**

- **现象:** `git status --short` 显示 `AGENTS.md`、`packages-user/client-base/src/types.ts`、`packages-user/client-modules/src/types.ts` 为已修改，另有未跟踪的 `.planning/milestone.lock` 与 `.planning/phases/07-data-fixes/.continue-here.md`。
- **处置:** 全部为**用户并行重构渲染端的 WIP**，按硬约束**只 stage 计划声明的确切文件**，未使用 `git add -A`/`git add .`/`git commit -a`/`git stash`/`git clean`/`git reset --hard`。提交后这些文件仍为 ` M`/`??` 未暂存状态（见 Self-Check）。
- **未登记为缺陷**（AGENTS.md：发现问题须经用户确认后才可记录；此处仅作事实登记）。

**2. 无其它阻塞**

- `pnpm test:ci`、`eslint`、`vue-tsc` 过滤检查均一次性通过，无重试、无 auto-fix 循环。

## User Setup Required

None - no external service configuration required.

## Known Stubs

None —— 本计划**未引入任何**硬编码空值、占位文案、未接线数据源或新增 `TODO`/`FIXME`/`it.skip`（零源码改动）。计划声明的 `hero.ts` 修改与 `hero.test.ts` 属**经用户裁决有意不产出**，已在「Deviations from Plan」登记为偏差，**不是 stub**，故**不写 `WINDOWS.md`**（D-14，且该条无入账 id）。

## Threat Model Disposition

本计划**不引入任何新威胁面**（无新端点、无鉴权路径、无文件访问、无依赖安装：`git status --short -- package.json pnpm-lock.yaml` 为空）。计划 `<threat_model>` 中依赖 Task 1 落地的缓解项**随 WONTFIX 裁决转为 `accept`（由用户裁决承担）**，如实登记：

| Threat ID | 计划处置 | 实际处置 | 依据 |
| --- | --- | --- | --- |
| T-7-43 `patchHero` 的 `attr` 闭包（medium / mitigate） | 原要求 Task 1 按 Q1 修 | **accept（不缓解）** | 用户裁决：兼容层即将删除，不为很快消失的代码修引用口径 |
| T-7-44 legacy 数值口径（基础值 vs 最终值，low / mitigate） | 原要求 Q2 裁决 + 断言 | **accept（不改动）** | 同上；`get` 保持 `getBaseAttribute` |
| T-7-45 flags 代理与 `window.flags` 绑定（low / mitigate） | 原要求 Task 1 断言 | **accept（不改动）** | 同上；`hero.ts:26-37` 逐字保留 |
| T-7-46 告警 56 文案（low / accept） | accept | **accept（不变）** | 零代码改动，文案未触及 |
| T-7-47 测试 stub 泄漏（low / mitigate） | 原要求 Task 1 用 `vi.hoisted`+`afterAll` | **N/A（无测试创建）** | Task 1 跳过，无 stub 引入 |
| T-7-SC 依赖安装（high / mitigate） | 不新增依赖 | **未新增** | `package.json`/`pnpm-lock.yaml` 零改动 |

## Phase 7 验证失效与重跑要求

**`07-VERIFICATION.md`（`verified: 2026-09-16T06:04:11Z`，`status: passed`，`score: 15/15`）已失效**：其结论仅覆盖 8/8 计划的工作树，**不覆盖** 07-09 之后追加的 07-10..07-14（含本计划的 WONTFIX 裁决）。本计划执行完毕后**必须重跑 `/gsd-verify-work`（或 `gsd-verify-work 7`）**重新出具验证结论，方可评估 Phase 7 收口。`ROADMAP.md` 的 Phase 7 计划计数与 Wave 列表已按 SUMMARY 数同步（07-14 完成后为 **14/14**）。

## Next Phase Readiness

- Phase 7 全部 14 个计划均有对应 SUMMARY；`#06-17-7` 以 WONTFIX 闭合，C–H 与 CR-01/CR-02 全部收口。
- **待办（非本计划）：** ① **重跑 `/gsd-verify-work 7`** 重新出具 Phase 7 验证结论（现结论已失效）；② `IN-04`/`IN-05` 保留在册、未修；③ `sourcedDamage` 空点条目为已知惰性残留（07-13 Q4=A 非目标）；④ `packages-user/data-fallback` 整体待 **Phase 5（Legacy 移植）** 删除——该包零测试为已知现状（本计划按裁决未改变）。
- **未修复且经裁定保留：** `#06-17-7`（本条，WONTFIX）；`data-fallback` 的删除归属 Phase 5。

---

## Self-Check: PASSED

- FOUND: `25b213a`（Task 0 裁决锁；`git show --stat` = 1 file, +20/−3, 无删除）
- FOUND: `.planning/phases/07-data-fixes/07-14-PLAN.md` 的 Task 0 `<record>` 含用户原话逐字、Q1..Q4 = 不改动、理由、WONTFIX 结论、2026-09-17
- VERIFIED: `git diff --name-only a80e383..HEAD` = 仅 `.planning/phases/07-data-fixes/07-14-PLAN.md`（零源码、零测试）
- VERIFIED: `pnpm test:ci` = `Test Files 66 passed (66)` / `Tests 737 passed | 1 skipped (738)`
- VERIFIED: `git grep "it\.skip(" -- "*.test.ts"` 恰 1 条，`equipment.test.ts:353` 码 147（D-06），未新增
- VERIFIED: `packages-user/data-fallback/src/hero.test.ts` 不存在；`git log a80e383..HEAD -- packages-user/data-fallback/` 为空
- VERIFIED: `pnpm exec eslint` 计划声明 3 文件 exit 0；`vue-tsc --noEmit` 过滤 `data-fallback` 0 命中
- VERIFIED: `WINDOWS.md` 零改动（`Select-String "06-17"` 无命中；`git status` 无该文件）
- VERIFIED: 用户 WIP（`AGENTS.md`、`client-base/src/types.ts`、`client-modules/src/types.ts`）未被暂存/提交（`git status --short` 仍为 ` M`）

---

*Phase: 07-data-fixes*
*Completed: 2026-09-17*
