---
phase: 07-data-fixes
plan: 02
subsystem: enemy
tags: [enemy, reuse-mapping, prefab, createEnemy, vitest, data-base]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 正确预期 it.skip 用例（enemy 2 条）与 06-TEST-FINDINGS.md #06-03-1 权威登记
  - phase: 07-data-fixes
    plan: 01
    provides: 波次 1 的串行执行基线（D-09 逐步确认与 D-12c 全量门禁的串行约束）
provides:
  - createEnemy/createEnemyById 与 getPrefab/deletePrefab/modifyPrefabAttribute 共用 internalGetPrefab 复用解析（#06-03-1）
  - 源码内不变式注释：所有按 code/id 取模板的公开入口必须经 internalGetPrefab（D-11）
affects: [07-verify-work, enemy]

actuals:
  tokens: 1360
  tasks: 3
  commits: 2
  plan_head_before: 657d9720aff06da6cdc5c14c5645d1b7c52d2c14

tech-stack:
  added: []
  patterns:
    - "单一解析入口：公开创建入口与既有读写入口统一经 internalGetPrefab 解析复用映射，避免新增入口再次绕过"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/enemy/manager.ts
    - packages-user/data-base/src/enemy/manager.test.ts
    - .planning/WINDOWS.md

key-decisions:
  - "Task 0（D-09 预执行汇报）经用户确认为 approve（含注释）：确认 createEnemy/createEnemyById 改用 this.internalGetPrefab，并执行可选步骤 ④ 加入中文不变式注释（D-08 / D-11）"

patterns-established:
  - "不改 internalGetPrefab/getPrefab 既有实现与返回类型：创建入口只是接入同一解析入口，未引入 as 断言、未调整方法顺序"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "#06-03-1 创建入口接入复用映射：createEnemy/createEnemyById 均经 internalGetPrefab 解析"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/manager.test.ts#creates enemies for reused codes and ids through the reuse mapping"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/enemy/manager.test.ts#creates four independent enemies from one prefab reused by four facing codes"
        status: pass
    human_judgment: false
  - id: D2
    description: "未注册复用映射的 code/id 行为不变（既有绿用例全绿，无回归）"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/manager.test.ts（19 passed / 0 skipped）"
        status: pass
      - kind: unit
        ref: "pnpm test:ci（66 files passed / 656 passed / 21 skipped）"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-44 文件级门禁通过；WINDOWS.md id 24 结清"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "pnpm exec eslint --fix + pnpm exec eslint packages-user/data-base/src/enemy/{manager.ts,manager.test.ts}（0 错误）"
        status: pass
      - kind: other
        ref: "pnpm exec vue-tsc --noEmit 按 enemy/manager 过滤（0 命中）"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-15
status: complete
---

# Phase 7 Plan 02: enemy 系统缺陷修复 Summary

**`#06-03-1` 创建入口接入复用映射：`createEnemy`/`createEnemyById` 统一经 `internalGetPrefab` 解析，两条正确预期用例取消 skip 全绿，全量套件 656 passed / 21 skipped**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-15T17:14:46Z
- **Completed:** 2026-09-15T17:18Z
- **Tasks:** 3 (Task 0 为已获用户确认的 checkpoint:decision，Task 1/2 为 auto)
- **Files modified:** 3 (1 生产源码 + 1 测试 + WINDOWS.md)

## Accomplishments

- **#06-03-1**：`manager.ts:119-131` 的 `createEnemy(code)` 与 `createEnemyById(id)` 由直接查 `prefabByCode`/`prefabById` 改为调用既有私有 `internalGetPrefab`，与同文件的 `getPrefab`/`deletePrefab`/`modifyPrefabAttribute` 使用同一复用解析入口。`if (!prefab) return null;` 与 `return prefab.clone();` 两行保持原样；未新增 `as` 断言、未改返回类型、未调整方法顺序。
- **不变式注释（D-11，用户确认的可选步骤 ④）**：在 `createEnemyById` 上方加入两行中文注释，说明「所有按 code/id 取模板的公开入口都必须经 `internalGetPrefab` 解析复用映射，复用映射把同一模板的多个朝向 code 别名到来源模板，绕过解析会让这些 code 取不到模板」——说明**为什么**必须走该入口，而非复述下一行调用。
- **用例处置（D-10）**：`manager.test.ts` 仅取消 `creates enemies for reused codes and ids through the reuse mapping`（`:272`）与 `creates four independent enemies from one prefab reused by four facing codes`（`:282`）两处 `it.skip`，**断言一字未改**；同步两处 it 前的中文单行注释为修复后行为描述。未新增任何用例、未新增任何 `it.skip`。
- **账本**：WINDOWS.md id 24（G-06-03-A）→ `fixed`（`open_count` 15→14，`fixed_count` 12→13），未新建条目、未 waive。

## Task Commits

Each task was committed atomically:

1. **Task 0: D-09 预执行汇报** - checkpoint:decision，由 orchestrator 呈现并由用户回复 **approve（含注释）**后解除；本执行者未停步（无提交，仅记录）
2. **Task 1: #06-03-1 resolve the reuse mapping in enemy creation** - `b70ccbd` (fix)
3. **Task 2: close windows ledger entry 24** - `ad0d704` (chore)

**Plan metadata:** `docs(07-02): complete enemy data-fixes plan` (SUMMARY.md commit, see completion report)

## Files Created/Modified

- `packages-user/data-base/src/enemy/manager.ts` - `createEnemy`/`createEnemyById` 接入 `internalGetPrefab`；新增不变式中文注释
- `packages-user/data-base/src/enemy/manager.test.ts` - 2 条 skip 取消（断言不变）+ 2 处中文注释同步
- `.planning/WINDOWS.md` - id 24 → fixed（`open_count` 15→14，`fixed_count` 12→13）

## Decisions Made

- **Task 0（D-09 预执行汇报）**：用户回复 `approve（含注释）` —— 确认 D-08 的修法（`createEnemy`/`createEnemyById` 改用 `this.internalGetPrefab`），并选择执行可选步骤 ④（加入中文不变式注释，D-11）。本计划未在 Task 0 停步，直接进入 Task 1。
- **注释写法**：按 dev.md「注释必须包含价值、不得解释下一行」与「禁止非 jsDoc 多行注释、多行用多个单行注释代替」的要求，写成两行单行注释，说明不变式的**理由**（复用映射承载多朝向 code）而非复述调用。
- **提交粒度（D-13）**：源码+测试为一个 `fix` 原子提交；账本结清单独 `chore` 提交（与 07-01 的既有节奏一致）。

## Deviations from Plan

**None - plan executed exactly as written.**

- 计划称「不需要 `as`」：实测 `internalGetPrefab` 返回 `IEnemy<TEnemy> | null`，可直接 `.clone()`，未引入任何断言。
- 计划称调用方行为不变：`manager.test.ts` 中 `createEnemy(1)` 在 `deletePrefab(1)` 后仍返回 `null`（`:219`）、`createEnemy(99)`/`createEnemyById('missing')` 仍返回 `null`（`:205-206`）、`addPrefab` 后 `saveLoad.test.ts` 的 `createEnemy(9) === null` 均已由既有绿用例覆盖并通过。
- **未触发 D-09「方案失败即退出并修订计划」条件**：聚焦用例、D-44 三步门禁与全量套件一次通过。

## Verification Results

- **Task 1 聚焦：** `pnpm exec vitest run packages-user/data-base/src/enemy/manager.test.ts` → **1 file passed / 19 passed / 0 skipped**（修复前该文件为 19 tests 含 2 skipped）
- **D-44 文件级门禁（Task 2，对两个改动文件串行执行）：**
  - `pnpm exec eslint --fix <2 files>` 后 `pnpm exec eslint <2 files>` → **0 错误**（`--fix` 未产生额外改动）
  - `pnpm exec vue-tsc --noEmit` 输出按 `enemy/manager` 过滤 → **0 命中**（0 类型错误）；整仓退出码非零但全部为 `packages-user/client-modules/src/**` 的既有渲染端诊断（D-12 明确排除）
  - `pnpm test:ci` → **66 files passed / 656 passed / 21 skipped**（07-01 结束时基线 66 files / 654 passed / 23 skipped；+2 passed、−2 skipped，与 2 条取消 skip 用例精确对应）
- **`it.skip` 审计：** `manager.test.ts` 中已无任何 `it.skip`/`it.only`；本计划未新增任何跳过（D-10）。

## WINDOWS.md 对照

| id | 缺陷 | 结果 |
|----|------|------|
| 24 | G-06-03-A：复用映射未接入 `createEnemy`/`createEnemyById`（#06-03-1） | fixed |

`windows status` 结清后：`open_count 14` / `fixed_count 13` / `total_count 27`。本计划**未新建任何账本条目**、未执行任何 `waive`。

## Threat Flags

None — 未引入新的信任边界或外部接口。`threat_model` 中 `T-7-07`（Tampering：创建入口绕过复用映射）已由 Task 1 的「统一经 `internalGetPrefab` 解析」缓解；`T-7-SC`（依赖安装）本计划无安装动作（`package.json`/`pnpm-lock.yaml` 未变更）。

## Known Stubs

None — 本计划未新增 stub、未新增 `TODO`/`FIXME`、未留下占位实现。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- enemy 系统 `#06-03-1` 已修复并原子入库，2 条正确预期用例转绿；WINDOWS.md id 24 结清。
- 剩余 Phase 7 计划（replay / hero / map / flag+common / save / path）尚未执行；本计划源码层与其他计划无耦合，但按 D-09/D-12c 仍须**串行**执行。
- **STATE.md / ROADMAP.md 未由本执行者修改**（按 orchestrator 指示，由 orchestrator 在 wave 完成后统一写入）。

---
*Phase: 07-data-fixes*
*Completed: 2026-09-15*

## Self-Check: PASSED

- SUMMARY.md present at `.planning/phases/07-data-fixes/07-02-SUMMARY.md`
- Commits present: b70ccbd, ad0d704
- Modified files present: `packages-user/data-base/src/enemy/manager.ts`, `packages-user/data-base/src/enemy/manager.test.ts`, `.planning/WINDOWS.md`
