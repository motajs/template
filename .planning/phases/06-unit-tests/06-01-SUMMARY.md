---
phase: 06-unit-tests
plan: 01
subsystem: testing
tags: [vitest, combat, layer-2, enemy-context, aura-pipeline, damage-system, map-damage, combat-flow]

# Dependency graph
requires:
  - phase: 03-data-completion
    provides: Node-safe data packages, logger.catch assertions, co-located *.test.ts convention, pnpm test:ci gate
provides:
  - 4 co-located combat Layer-2 behavior tests (EnemyContext, DamageContext/DamageSystem, MapDamage, CombatFlow)
  - Stage-level 06-COVERAGE-MAP.md mapping 15 reachable warn/error codes to cases
  - 4 suspected-bug it.skip regressions (#06-01-1..4) anchored in 06-TEST-FINDINGS.md
affects: [06-07, 06-09, combat consumers, verify-work]

actuals:
  tokens: 17606
  tasks: 3
  commits: 3
plan_head_before: ef5e4e918078b82cbb119355b6f4a3c8cc29fd5e

tech-stack:
  added: []
  patterns:
    - "Staged test design D-43: component -> pipeline -> integration, each stage green before the next"
    - "vi.hoisted global stub + dynamic-import harness with Map.getOrInsert + getOrInsertComputed polyfills"
    - "Manual EnemyContext assembly with inline fake IAuraConverter/IAuraView/fake IMapDamage/IDamageSystem"
    - "logger.catch / logger spy for warn codes; real timers + manual deferred for await ordering"

key-files:
  created:
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md
  modified:
    - packages-user/data-system/src/combat/context.test.ts
    - packages-user/data-system/src/combat/damage.test.ts
    - packages-user/data-system/src/combat/mapDamage.test.ts
    - packages-user/data-system/src/combat/combat.test.ts
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md

key-decisions:
  - "D-22 range mapping: system-layer FullRange(haloRange<=0) / RectRange(haloSquare) / ManhattanRange each asserted separately with out-of-range enemies unchanged"
  - "Global addAura auras require at least one registered aura converter before buildupBase runs; tests register a no-match converter to enable the base phase"
  - "D-26 linkage invalidates via setEnemyAt + clear (not a second buildup) because repeat buildup compounds attributes (#06-01-4)"
  - "Newly observed buildup compounding registered as #06-01-4 it.skip instead of being worked around silently (D-05)"

patterns-established:
  - "Stage-gated execution: stop and report if a stage reveals a blocking bug; non-blocking suspects become correct-expectation it.skip + findings row"
  - "Idempotent create-or-append coverage map keyed by a fixed | code | module | case | plan | header"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "EnemyContext public-method, single-aura range (Full/Rect/Manhattan), single-effect and lifecycle component coverage"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/context.test.ts#EnemyContext registry and lookups / single aura ranges / lifecycle"
        status: pass
    human_judgment: false
  - id: D2
    description: "EnemyContext aura pipeline: nested auras, priority boundary, four-stage order, both refresh paths, warn codes 97/98/99/100/101/110"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/context.test.ts#EnemyContext aura pipeline / effect stage ordering / refresh paths and DEV warnings"
        status: pass
    human_judgment: false
  - id: D3
    description: "DamageContext/DamageSystem (cache, with(hero), calculateCritical, D-26 attribute linkage) and warn codes 106/107"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/damage.test.ts#DamageContext behaviour / DamageSystem caching / critical generation / attribute linkage"
        status: pass
    human_judgment: false
  - id: D4
    description: "MapDamage (sourceless add/delete, sourced conversion/reduction, markEnemyDirty, deleteEnemy) and warn codes 102/103/104"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/mapDamage.test.ts#MapDamage sourceless damage / sourced conversion and reduction"
        status: pass
    human_judgment: false
  - id: D5
    description: "CombatFlow (state-identity binding, script priority/dedupe, guards 139/141, off-map and standalone computed paths, awaited script order) and warn codes 138/139/140/141"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/combat.test.ts#CombatFlow binding / scripts and guards / async ordering"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-09-14
status: complete
---

# Phase 6 Plan 01: 战斗系统（data-system/src/combat）单元测试 Summary

**战斗 Layer-2 契约（EnemyContext 光环流水线、DamageContext/DamageSystem、MapDamage、CombatFlow）以 74 条行为用例覆盖，15 个可达 warn/error 码全部触发，4 处疑似缺陷以正确预期 it.skip 登记在案。**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-14T12:45:00Z (approx, host local)
- **Completed:** 2026-09-14T04:59:54Z (UTC)
- **Tasks:** 3
- **Files modified:** 6 (4 test files + 2 planning artifacts)

## Accomplishments
- 阶段 1（构件级）：`EnemyContext` 每个公开方法至少一条正常用例；Full/Rect/Manhattan 三种范围各自单独断言且范围外怪物不被加成；单光环/单效果单次施加有数值断言；`resize`/`clear`/`destroy` 生命周期清空与附件解绑断言齐备。
- 阶段 2（组合/流水线）：一层/两层嵌套光环、优先级边界 99、四阶段顺序 `buildupSpecials → buildupBase → buildupQuery → buildupFinal` 与阶段间可见性、全量/局部两条刷新路径，以及 97/98/99/100/101/110 全部经 `logger.catch` 观测。
- 阶段 3（完整/集成）：`DamageContext`/`DamageSystem`（缓存、`markDirty`/`markAllDirty`/`deleteEnemy`/`useCalculator`/`bindHeroStatus`、`with(hero)`、`calculateCritical`、D-26 属性→伤害联动）、`MapDamage`（无来源/有来源、合并、`markEnemyDirty`、`deleteEnemy`）、`CombatFlow`（同源绑定/外来 138、脚本优先级/去重 140、缺参 139/141、非地图与独立怪物路径、真实计时器 await 顺序）。
- 建立阶段级 `06-COVERAGE-MAP.md`（幂等表头 + 15 行 code → 模块 → 用例），并追加 `#06-01-4` 到共用的 `06-TEST-FINDINGS.md`。
- 门禁：聚焦运行 4 文件 74 通过 / 4 跳过；`pnpm test:ci` 全量 29 文件 255 通过 / 4 跳过，保持全绿。

## Task Commits

Each stage was committed atomically:

1. **Task 1: 阶段 1（构件级）** - `2e4e6d7` (test)
2. **Task 2: 阶段 2（组合/流水线）** - `f536901` (test)
3. **Task 3: 阶段 3（完整/集成）** - `a9b6e72` (test)

**Plan metadata:** (this docs commit) (docs: complete 06-01 plan)

## Files Created/Modified
- `packages-user/data-system/src/combat/context.test.ts` - EnemyContext 全接口、三范围、效果阶段顺序、嵌套/优先级、刷新路径与 97/98/99/100/101/110
- `packages-user/data-system/src/combat/damage.test.ts` - DamageContext/DamageSystem、106/107、缓存与 with、临界生成、D-26 联动
- `packages-user/data-system/src/combat/mapDamage.test.ts` - MapDamage、102/103/104、markEnemyDirty 与 deleteEnemy
- `packages-user/data-system/src/combat/combat.test.ts` - CombatFlow、138/139/140/141、非地图/独立怪物路径、await 顺序
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` - 阶段级 code → 模块 → 用例表（新建）
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` - 追加 `#06-01-4`

## Decisions Made
- D-22 的范围映射在系统层用真实 `FullRange`/`RectRange`/`ManhattanRange` 表达，并对每种范围单独断言范围外怪物属性不变。
- 发现「仅注册全局 `addAura` 而无任何光环转换器时 `buildupBase` 不执行」这一实现前提：相关用例各注册一个不命中的转换器以启用基础阶段，未修改生产代码。
- 重复 `buildup()` 会累加属性（见 #06-01-4），因此 D-26 缓存失效改用 `setEnemyAt` + `clear` 驱动，避免把缺陷固化进正常用例。
- 发现新疑似缺陷按 D-05 以正确预期 `it.skip` 保留并登记，不弱化为通过、不修改核心代码。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 阶段 1 提交意外包含既有的 superseded SUMMARY 删除**
- **Found during:** Task 1 commit
- **Issue:** 会话开始时 `.planning/phases/06-unit-tests/06-01-SUMMARY.md` / `06-02-SUMMARY.md` 已被前一次 D-29 操作 staged 为删除，`git commit` 连同它们一起提交。
- **Fix:** 该删除与 D-29（superseded 改名保留）意图一致，未做恢复；仅在 SUMMARY 记录说明，未影响测试范围或门禁。
- **Files modified:** 无（仅提交既有的删除）
- **Verification:** `git log --oneline` 显示 `06-01-SUMMARY-superseded.md` / `06-02-SUMMARY-superseded.md` 仍在；`pnpm test:ci` 全绿。
- **Committed in:** `2e4e6d7`

**2. [Rule 2 - Missing Critical] 新增疑似缺陷 #06-01-4 的正确预期 skip 与 findings 登记**
- **Found during:** Task 3 (D-26 联动用例)
- **Issue:** 重复 `EnemyContext.buildup()` 未将计算后怪物重置为原始怪物，导致光环效果在既有计算结果上累加（预期 17 实得 22）。
- **Fix:** 按 D-05 以正确预期编写 `it.skip`，并在共用 `06-TEST-FINDINGS.md` 追加 `#06-01-4`（模块/现象/最小复现/疑似原因/影响面/建议方向/关联用例/严重度）。
- **Files modified:** `packages-user/data-system/src/combat/damage.test.ts`、`.planning/phases/06-unit-tests/06-TEST-FINDINGS.md`
- **Verification:** 聚焦运行 4 文件 74 通过 / 4 跳过；`pnpm test:ci` 全绿。
- **Committed in:** `a9b6e72`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical per D-05)
**Impact on plan:** 无范围蔓延——仅新增测试与规划产物；未修改任何生产/核心源码。

## Issues Encountered
- 已登记 4 条疑似缺陷（均为“只记录不修复”，等用户确认）：`#06-01-1` `calculateCritical` 的 `info` 与 `nextValue` 不对应；`#06-01-2` `MapDamage.deleteEnemy` 幽灵伤害；`#06-01-3` `CombatFlow` 的 `before` 真值短路与文档相反；`#06-01-4` `buildup` 重复构建累加属性。
- 4 条 `it.skip` 均按正确预期编写，锚定 `#06-01-N`，并有对应 `06-TEST-FINDINGS.md` 条目；修复后取消 skip 转为回归用例。

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 战斗系统（系统层）单测完成，为 06-07 顶层伤害组合/录像集成提供系统层回归基线。
- 待用户确认 4 条疑似缺陷的处理方向（修复或调整接口文档）；确认前不修改核心代码。
- 未发现阻断性 bug：三个阶段均跑绿，可继续后续计划。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*

## Self-Check: PASSED
