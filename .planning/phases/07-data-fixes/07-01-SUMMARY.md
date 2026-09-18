---
phase: 07-data-fixes
plan: 01
subsystem: combat
tags: [combat, damage, map-damage, buildup, combat-script, vitest, data-system]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 正确预期 it.skip 用例（combat 4 条 + #06-15-1）与 06-TEST-FINDINGS.md 权威登记
provides:
  - findNextCritical 的 targetInfo 与 yield 的 nextValue 同源（#06-01-1）
  - buildup() 全量重建前置重置全部 EnemyView（#06-01-4 / #06-15-1）
  - 有来源地图伤害双向索引在写入/删除/重算三处自洽（#06-01-2，方案 A）
  - 战前脚本仅返回 false 才停止并放弃战斗，与 types.ts jsdoc 一致（#06-01-3）
affects: [07-verify-work, combat]

actuals:
  tokens: 3022
  tasks: 5
  commits: 5
  plan_head_before: 7ae08c6920b02b2d3f181e145e4a81bc33fc5cc5

tech-stack:
  added: []
  patterns:
    - "全量构建前置重置：buildup() 在各效果阶段前无条件 reset 全部视图"
    - "键控 Map 双向登记：写入有来源伤害时同步登记 viewStore/damageStore，重算后重新登记"

key-files:
  created: []
  modified:
    - packages-user/data-system/src/combat/damage.ts
    - packages-user/data-system/src/combat/context.ts
    - packages-user/data-system/src/combat/mapDamage.ts
    - packages-user/data-system/src/combat/combat.ts
    - packages-user/data-system/src/combat/damage.test.ts
    - packages-user/data-system/src/combat/context.test.ts
    - packages-user/data-system/src/combat/mapDamage.test.ts
    - packages-user/data-system/src/combat/combat.test.ts
    - .planning/WINDOWS.md

key-decisions:
  - "Task 0（D-09 预执行汇报）经用户确认为 approve-route-a：#06-01-2 采用方案 A（补齐 viewStore/damageStore 写入）"
  - "refreshIndex 重建循环内读取 viewStore.enemy 作为 sourceEnemy，并以 viewStore 是否存在作为视图存活判据——这是方案 A 在 deleteEnemy 读取路径不变前提下成立的必要细节"
  - "#06-01-3 的 3 条既有绿用例纠偏（显式 beforeResult=true、互补分支断言、注释同步）经用户确认属 D-10 允许范围"

patterns-established:
  - "视图存活判据：viewStore 存在即视图存活；deleteEnemy/removeEnemyAffecting 删除 viewStore 后，refreshIndex 重建时自动跳过失效视图"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "#06-01-1 临界点 info 与 nextValue 对齐（findNextCritical 的 targetInfo 移入临界分支）"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/damage.test.ts#reports the damage info matching the yielded critical value"
        status: pass
    human_judgment: false
  - id: D2
    description: "#06-01-2 deleteEnemy 清除有来源地图伤害（方案 A：补齐双向索引写入 + refreshIndex 重登记）"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/mapDamage.test.ts#removes enemy-sourced damage when the enemy is deleted"
        status: pass
    human_judgment: false
  - id: D3
    description: "#06-01-3 战前脚本仅返回 false 才放弃战斗；3 条既有用例纠偏后仍绿"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/combat.test.ts#abandons the battle when the before script returns false"
        status: pass
      - kind: unit
        ref: "packages-user/data-system/src/combat/combat.test.ts#runs hooks and after scripts when before returns truthy"
        status: pass
      - kind: unit
        ref: "packages-user/data-system/src/combat/combat.test.ts#sorts scripts by descending priority and rejects duplicates"
        status: pass
      - kind: unit
        ref: "packages-user/data-system/src/combat/combat.test.ts#awaits the before script before running hooks and after scripts"
        status: pass
    human_judgment: false
  - id: D4
    description: "#06-01-4 / #06-15-1 重复 buildup 不再累加、deleteAura 后回退到基础值"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/damage.test.ts#recomputes a repeat buildup from the base enemy without compounding"
        status: pass
      - kind: unit
        ref: "packages-user/data-system/src/combat/context.test.ts#applies a global aura after addAura and stops applying it after deleteAura"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-44 文件级门禁与全量套件通过；WINDOWS.md 19/20/21/27 结清"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "pnpm exec eslint <8 files> (0 errors) + pnpm exec vue-tsc --noEmit filtered to src/combat/ (0 errors)"
        status: pass
      - kind: other
        ref: "pnpm test:ci"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-09-15
status: complete
---

# Phase 7 Plan 01: combat 系统缺陷修复 Summary

**combat 四条根因修复（临界点 info 同源、重复 buildup 前置重置、有来源地图伤害双向索引、战前脚本 false 放弃语义），5 条正确预期用例取消 skip 全绿，3 条固化错误语义的既有用例纠偏，全量套件 654 passed / 23 skipped**

## Performance

- **Duration:** 17 min
- **Started:** 2026-09-15T16:50Z (approx; first task commit 16:53:50 +08:00)
- **Completed:** 2026-09-15T17:05Z
- **Tasks:** 5 (Task 0 为已获用户确认的 checkpoint:decision)
- **Files modified:** 9 (4 生产源码 + 4 测试 + WINDOWS.md)

## Accomplishments

- **#06-01-1**：`damage.ts` `findNextCritical` 的 `targetInfo = middleInfo` 从 `else`（非临界点）分支移入 `damage < referenceDamage` 分支，使 `calculateCritical` 产出的 `info` 与 `nextValue` 同源。
- **#06-01-4 / #06-15-1（同根因，D-01 合并）**：`context.ts` `buildup()` 在清空拓扑后、各效果阶段前无条件对 `enemyViewMap.values()` 调用既有 `EnemyView.reset()`，消除重复构建的属性累加与 deleteAura 不回退。
- **#06-01-2（方案 A）**：`mapDamage.ts` 新增私有 `registerSourcedDamage` 助手，在 `refreshEnemy` / `refreshEnemyAndClearCache` 写入有来源伤害时登记 `damageStore` 与 `viewStore`，并在 `refreshIndex` 重建 `point.damages` 后重新登记；`deleteEnemy`/`removeEnemyAffecting` 既有读取路径不改即变正确。
- **#06-01-3**：`combat.ts` 改为 `const proceed = await script.before(...)` + `if (!proceed) return damage;`，与 `types.ts:772` jsdoc 一致；同步纠偏 3 条既有绿用例并取消目标 skip。
- **账本**：WINDOWS.md id 19/20/21/27 → fixed（`open_count` 19→15，`fixed_count` 8→12），未新增任何账本条目。

## Task Commits

Each task was committed atomically:

1. **Task 1: #06-01-1 align critical info with the yielded next value** - `9e96df4` (fix)
2. **Task 2: #06-01-4 reset enemy views before a full buildup** - `8225ef1` (fix)
3. **Task 3: #06-01-2 clear enemy-sourced map damage on delete** - `24534fb` (fix)
4. **Task 4: #06-01-3 abandon the battle only when before returns false** - `650b960` (fix)
5. **Task 5: close windows ledger entries 19/20/21/27** - `5d6381a` (chore)

**Plan metadata:** `docs(07-01): complete combat data-fixes plan` (SUMMARY.md commit, see completion report)

## Files Created/Modified

- `packages-user/data-system/src/combat/damage.ts` - `findNextCritical` 的 `targetInfo` 归属修正
- `packages-user/data-system/src/combat/context.ts` - `buildup()` 前置无条件 `view.reset()` 循环
- `packages-user/data-system/src/combat/mapDamage.ts` - 新增 `registerSourcedDamage` 私有助手；`refreshEnemy`/`refreshEnemyAndClearCache`/`refreshIndex` 登记与重登记
- `packages-user/data-system/src/combat/combat.ts` - `proceed`/`!proceed` 判定，`before` 返回 false 才放弃战斗
- `packages-user/data-system/src/combat/damage.test.ts` - 2 条 skip 取消（#06-01-1、#06-01-4）+ 注释同步
- `packages-user/data-system/src/combat/context.test.ts` - 1 条 skip 取消（#06-15-1）+ 注释同步
- `packages-user/data-system/src/combat/mapDamage.test.ts` - 1 条 skip 取消（#06-01-2）+ 注释同步
- `packages-user/data-system/src/combat/combat.test.ts` - 1 条 skip 取消（#06-01-3）+ 3 条既有用例纠偏 + `FakeScript.beforeResult` 注释同步
- `.planning/WINDOWS.md` - id 19/20/21/27 → fixed

## Decisions Made

- **Task 0（D-09 预执行汇报）**：用户回复 `approve-route-a` —— 确认 combat 四条修复方案，`#06-01-2` 采用**方案 A**（补齐 `viewStore`/`damageStore` 写入），并确认 `#06-01-3` 的 3 条既有用例纠偏属 D-10 允许范围。本计划未在 Task 0 停步，直接进入 Task 1。
- **#06-01-2 方案 A 的必要细节**：`refreshIndex` 的重建循环需以 `viewStore` 是否存在判断视图是否仍存活（`deleteEnemy`/`removeEnemyAffecting` 会删除 `viewStore`）。该守卫是「既有读取路径不改即变正确」得以成立的关键，详见下方 Deviations。
- **#06-01-3 纠偏范围**：仅按 Task 0 点名处理 3 条既有用例（显式 `beforeResult=true`、互补分支断言、`FakeScript` 注释），未改动 `:369-396`（内联 `return false`）与 `:399-421`（未注册脚本）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] `refreshIndex` 重建时以 `viewStore` 存在性过滤失效视图**
- **Found during:** Task 3（#06-01-2，方案 A）
- **Issue:** 方案 A 要求在 `refreshIndex` 重建 `point.damages` 后重新登记 `damageStore`/`viewStore`，而重登记需要 `sourceEnemy`（只能经 `viewStore.enemy` 取得）。但既有 `deleteEnemy` 只删除 `viewStore`/`damageStore`，**并不清除 `point.affectedBy`**；因此若重建循环仍无条件 `point.damages.add(view.getDamageWithoutCheck(...))`，被删怪物会经 `affectedBy` 的残留条目把伤害重新加回，目标用例不会转绿。
- **Fix:** 在 `refreshIndex` 的重建循环内取 `const viewStore = this.viewStore.get(view); if (!viewStore) return;`，再调用 `registerSourcedDamage(point, view, viewStore.enemy, index, damage)`。这样 `viewStore` 的存在性即成为「视图是否存活」的判据：被删视图不再重建其伤害，方案 A 在不修改 `deleteEnemy`/`removeEnemyAffecting` 的前提下成立。
- **Files modified:** `packages-user/data-system/src/combat/mapDamage.ts`
- **Verification:** `pnpm exec vitest run packages-user/data-system/src/combat/mapDamage.test.ts` 全绿（15 passed，0 skipped），既有 `:410-590` 用例群无回归。
- **Committed in:** `24534fb` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** 方案 A 的核心（写入/重登记）与计划一致；此守卫是计划「既有读取路径不改即变正确」得以成立的必要实现细节，未扩大变更面（仍只触及 `mapDamage.ts`），未引入新依赖或新用例。

## Issues Encountered

- **方案 A 的字面描述不足以单独转绿**：计划称「`deleteEnemy` 既有实现无需改动即变正确」，但按源码逐条推演，`deleteEnemy` 不清 `point.affectedBy`，需上述 `viewStore` 存活守卫配合。已按 D-09 先实施方案 A 原样结构并验证，确认为实现细节补全（非改用方案 B、非另辟他法），已如实记录为偏差。**未触发 D-09 的「方案失败退出」条件。**
- **无其他问题**。所有聚焦命令、D-44 三步门禁与全量套件一次通过。

## Verification Results

- **Task 1 聚焦：** `pnpm exec vitest run .../damage.test.ts` → 16 passed / 1 skipped（当时 #06-01-4 尚未修）
- **Task 2 聚焦：** `.../context.test.ts` → 40 passed / 0 skipped；`.../damage.test.ts .../mapDamage.test.ts .../combat.test.ts` → 42 passed / 2 skipped
- **Task 3 聚焦：** `.../mapDamage.test.ts` → 15 passed / 0 skipped；三文件 → 43 passed / 1 skipped
- **Task 4 聚焦：** `.../combat.test.ts` → 12 passed / 0 skipped
- **Task 5 D-44 门禁：**
  - `pnpm exec eslint --fix <8 files>` 后 `pnpm exec eslint <8 files>` → 0 错误
  - `pnpm exec vue-tsc --noEmit` 输出按 `src/combat/` 过滤 → 0 命中（0 类型错误）
  - `pnpm test:ci` → **66 files passed / 654 passed / 23 skipped**（修复前基线 66 files / 649 passed / 28 skipped；+5 passed、-5 skipped，与 5 条取消 skip 用例精确对应）
- **`it.skip` 审计：** 4 个 combat 测试文件中已无任何 `it.skip`；本计划未新增任何 `it.skip`。

## WINDOWS.md 对照

| id | 缺陷 | 结果 |
|----|------|------|
| 19 | #06-01-1 `calculateCritical` info 与 nextValue 不匹配 | fixed |
| 20 | #06-01-2 `MapDamage.deleteEnemy` 残留来源伤害 | fixed |
| 21 | #06-01-3 `CombatFlow.before` 语义反向 | fixed |
| 27 | #06-15-1 `deleteAura` 后 buildup 不回退 | fixed |

`#06-01-4` 按研究核对在 WINDOWS.md 中**无对应条目**（19–27 的 9 条与本阶段登记的映射关系已确认），故**未新建条目**，避免抬高 `open_count` 门禁。未对任何条目执行 `waive`。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- combat 系统 4 条根因已修复并原子入库，5 条正确预期用例转绿；WINDOWS.md 19/20/21/27 结清。
- 剩余 Phase 7 计划（enemy / replay / hero / map / flag+common / save / path）尚未执行；本计划 `depends_on` 为空，与其他计划无源码层前置。
- **STATE.md / ROADMAP.md 未由本执行者修改**（按 orchestrator 指示，由 orchestrator 在 wave 完成后统一写入）。

---
*Phase: 07-data-fixes*
*Completed: 2026-09-15*

## Self-Check: PASSED

- SUMMARY.md present at `.planning/phases/07-data-fixes/07-01-SUMMARY.md`
- Commits present: 9e96df4, 8225ef1, 24534fb, 650b960, 5d6381a
- All 4 modified production files present under `packages-user/data-system/src/combat/`
