---
phase: 06-unit-tests
plan: 09
subsystem: testing
tags: [vitest, save/load, saveables, CoreState, compression, round-trip]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 06-01..06-08 行为单测与既有测试基建（vitest、logger.catch、inline fixture 模式）
provides:
  - 6 个存读档测试文件：enemy/hero/map/replay/flag 逐类同实例往返 + CoreState 顶层 5 saveable × 3 压缩档往返
  - 06-SAVE-EXCLUSIONS.md：逐类排除清单（存档无关/元数据/派生/缓存字段及依据）
  - 06-COVERAGE-MAP.md 06-09 小节：11 个可达码 55/58/59/112/113/119/120/122/124/177/178 的触发断言映射
  - 06-TEST-FINDINGS.md `#06-09-1..5` 疑似缺陷 + 阻断项（既有 test:ci 回归）
affects: [07, verify-work, milestone-audit]

# Actuals (#2632) — chars/4 over the realized diff (new test files + appended planning sections)
actuals:
  tokens: 16600
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 存读档同实例往返：saveState → 改关键字段 → loadState → 仅显式断言关键字段（D-12/D-13）
    - 三档压缩循环（NoCompression/LowCompression/HighCompression）套用同实例往返
    - 错误/警告路径经 logger.catch 观测 code，绝不 expect(...).toThrow
    - 每条 it 前单行中文注释；疑似缺陷 it.skip + `#06-09-N` 锚定

key-files:
  created:
    - packages-user/data-base/src/enemy/saveLoad.test.ts
    - packages-user/data-base/src/hero/saveLoad.test.ts
    - packages-user/data-base/src/map/saveLoad.test.ts
    - packages-user/data-common/src/replay/saveLoad.test.ts
    - packages-user/data-base/src/flag/saveLoad.test.ts
    - packages-user/data-state/test/saveablesRoundTrip.test.ts
    - .planning/phases/06-unit-tests/06-SAVE-EXCLUSIONS.md
  modified:
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md

key-decisions:
  - "D-45 顶层验证经公开 CoreState.saveState/loadState（而非仅 getSaveableContent）驱动，5 saveable × 3 压缩档全绿"
  - "StaticTile/DynamicTile 的 saveState/loadState 签名按接口契约传 SaveCompression（实现忽略该参数），以通过类型门禁"
  - "EquipmentState 数值加成无法往返等 5 处缺陷按 D-05 写正确预期 it.skip，并注册 #06-09-1..5；经临时取消 skip 验证确为真实失败"
  - "cp 码 178 的现行实现按「存档缺失 key」触发，与文案相反；以实际触发路径写正常用例，另以 it.skip 记录正确预期（#06-09-5）"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "enemy + hero 各含 saveState/loadState 的类同实例往返（3 压缩档），触发码 119/120/58/59；排除清单落盘"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/saveLoad.test.ts#all"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#all"
        status: pass
    human_judgment: false
  - id: D2
    description: "map + replay（ReplaySystem 与 ReplayArray）+ flag 同实例往返，触发码 55/122/124"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/saveLoad.test.ts#all"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/saveLoad.test.ts#all"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/flag/saveLoad.test.ts#all"
        status: pass
    human_judgment: false
  - id: D3
    description: "CoreState 顶层经公开 saveState/loadState 对 5 saveable × 3 压缩档整体往返；getSaveableContent 辅助校验；触发码 112/113/177/178"
    requirement: TEST-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/test/saveablesRoundTrip.test.ts#all"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-44 质量门禁：eslint 0 错误、vue-tsc 文件级 0 类型错误、pnpm test:ci 全绿"
    requirement: TEST-01
    verification:
      - kind: other
        ref: "pnpm test:ci"
        status: fail
    human_judgment: true
    rationale: "pnpm test:ci 存在先于本计划的既有回归（commit cee8439 将录像记录接入 equipment/items/mover，4 个 data-base 既有测试与 2 个 data-state 文件失败）；本计划硬约束禁止修改这些越界文件，故 test:ci 无法全绿。eslint 与 vue-tsc 已通过，本计划未新增失败。"

# Metrics
duration: 42min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 09: 存档（独立系统）Summary

**26+ 个含 `saveState`/`loadState` 的类逐类同实例往返 + `CoreState` 顶层 5 saveable × 3 压缩档经公开入口整体往返，11 个可达码全部触发，并落盘排除清单与 5 处疑似缺陷**

## Performance

- **Duration:** 42 min
- **Started:** 2026-09-14T18:34:00Z (approx)
- **Completed:** 2026-09-14T19:16:00Z (approx)
- **Tasks:** 3 (Task 1 为已预清关的用户确认门禁)
- **Files modified:** 9（6 新增测试 + 3 规划产物）

## Accomplishments

- **阶段 1（构件级）**：`Enemy`/`CommonSerializableSpecial`/`NonePropertySpecial`/`EnemyManager` 与 hero 全部子系统（modifier/location/rendering/equipment/equipStore/items/follower/state）同实例往返，三档压缩；码 119/120/58/59 触发。
- **阶段 2（组合/流水线）**：`StaticTile`/`DynamicTile`/`MapLayer`/`GameMap`/`MapState`、`ReplayArray`/`ReplaySystem`、`FlagSystem` 同实例往返；码 55/122/124 触发。
- **阶段 3（完整/集成）**：经公开 `CoreState.saveState(compression)` / `loadState(state, compression)` 对 `@system/hero`/`flags`/`maps`/`enemy`/`replay` × 3 压缩档整体往返，辅以 `getSaveableContent(id)`；码 112/113/177/178 触发。
- **排除清单** `06-SAVE-EXCLUSIONS.md` 逐类列出存档无关/元数据/派生/缓存字段与依据（D-42）。
- **11 个可达码** 全部有触发断言：55/58/59/112/113/119/120/122/124/177/178。
- 发现并登记 **5 处疑似缺陷**（`#06-09-1..5`），以正确预期 `it.skip` 记录，并经临时取消 skip 验证确为真实失败。

## Task Commits

Each task was committed atomically:

1. **Task 1: 执行前门禁 — 用户确认公开 save/load 入口与 5 个 saveable** — 无代码提交（用户已预确认「存读档入口已就绪，可以开始」；磁盘核对 `core.ts:237-241` 含 `@system/replay`）
2. **Task 2: 阶段 1（构件级）enemy + hero** - `3e29548` (test)
3. **Task 3: 阶段 2（组合/流水线）map + replay + flag** - `c707c87` (test)
4. **Task 4: 阶段 3（完整/集成）CoreState 顶层** - `502d87b` (test)

**Plan metadata:** `(see final docs commit)` (docs: complete plan)

## Files Created/Modified

- `packages-user/data-base/src/enemy/saveLoad.test.ts` - Enemy/special/EnemyManager 同实例往返，码 119/120
- `packages-user/data-base/src/hero/saveLoad.test.ts` - hero 各子系统同实例往返，码 58/59
- `packages-user/data-base/src/map/saveLoad.test.ts` - map tile/layer/gameMap/mapState 同实例往返，码 55/122/124
- `packages-user/data-common/src/replay/saveLoad.test.ts` - ReplayArray/ReplaySystem 同实例往返
- `packages-user/data-base/src/flag/saveLoad.test.ts` - FlagSystem 同实例往返与存档克隆
- `packages-user/data-state/test/saveablesRoundTrip.test.ts` - CoreState 顶层 5×3 往返，码 112/113/177/178
- `.planning/phases/06-unit-tests/06-SAVE-EXCLUSIONS.md` - 逐类排除清单
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` - 06-09 小节（11 码映射）
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` - `#06-09-1..5` 与阻断项

## Decisions Made

- 顶层验证以**公开入口** `CoreState.saveState/loadState` 为主路径（D-45），`getSaveableContent(id)` 作辅助逐 id 校验（断言同一实例与未知 id 返回 null）。
- `StaticTile`/`DynamicTile` 调用 `saveState(SaveCompression.*)` / `loadState(save, SaveCompression.*)`：其接口契约声明压缩参数（实现忽略），按契约传参以通过类型门禁。
- `EquipmentState` 数值加成无法往返、`HeroEquipment` 存档未深拷贝、`DynamicTile` 不恢复 num、`ReplayArray` 不恢复 length、码 178 语义反转：按 D-05 写正确预期 `it.skip` 并登记为 `#06-09-1..5`。
- 码 178：以现行实现的实际触发路径（存档缺失 saveable key）写正常用例，另以 `it.skip` 记录「存档多出 key」的正确预期。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] hero 测试的道具分类与 modifier 类型门禁**
- **Found during:** Task 2（阶段 1）
- **Issue:** HeroItems 往返用例最初误用 `ItemCategory.Equipment` 道具，导致分表为空；`registerModifier`/`addModifier` 的泛型签名在具体类上产生类型错误。
- **Fix:** 新增 `createPlainItem`（Constant/Consumable）；将 `createHeroState` 返回类型改为接口 `IHeroState<IHeroAttr>` 并用 `setModifierSaveEnabled` 表达 save=false 语义。
- **Files modified:** `packages-user/data-base/src/hero/saveLoad.test.ts`
- **Verification:** 聚焦运行全绿；vue-tsc 本文件 0 错误。
- **Committed in:** `3e29548`

**2. [Rule 3 - Blocking] map tile 存读档需按接口契约传压缩参数**
- **Found during:** Task 4（D-44 vue-tsc）
- **Issue:** `IStaticTile`/`IDynamicTile` 经 `ISaveableContent` 声明 `saveState(compression)`/`loadState(state, compression)`，0/1 参调用触发 TS2554。
- **Fix:** 传 `SaveCompression.NoCompression`（实现忽略）；测试语义不变。
- **Files modified:** `packages-user/data-base/src/map/saveLoad.test.ts`
- **Verification:** vue-tsc 本文件 0 错误。
- **Committed in:** `c707c87`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** 均为类型/分类门禁修正，无范围蔓延；未修改任何生产/核心源码。

## Issues Encountered

**阻断项（超出本计划范围，未修复）**：`pnpm test:ci` 在本计划执行时**已存在**先于本计划的既有回归 —— commit `cee8439` 将 `this.state.replaySystem.route.add(...)` 接入 `data-base/src/hero/{equipment,items,mover}.ts`，但 4 个既有 `data-base` 测试（equipment/follower/items/mover）的假 `IDataCommon` 不含 `replaySystem`，另 2 个 `data-state` 文件因未处理 rejection 计为失败，共 6 文件 / 15 用例失败。本计划硬约束仅允许新增 6 个 `*.test.ts` 与规划产物，**不得修改这些越界文件**，故 D-44(c) 无法全绿。经复核：本计划新增 6 文件 **41 通过 / 6 跳过，未新增任何失败**；失败集合与改动前完全一致。详见 `06-TEST-FINDINGS.md` `#06-09` 阻断项。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 存读档测试（D-32 唯一承接计划）已完成；`saveState`/`loadState` 接口覆盖与 CoreState 顶层往返就绪。
- **待用户处理**：修复 `cee8439` 引入的既有测试回归（补齐 4 个 `data-base` 测试的假 `replaySystem` 或为生产侧加空值守卫），使 `pnpm test:ci` 恢复全绿；并裁决 `#06-09-1..5` 的修复方案。
- 07/milestone 验证可基于本 SUMMARY 的 coverage 与 `06-COVERAGE-MAP.md` 继续。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*

## Self-Check: PASSED

- 6 个 `*.test.ts` + `06-SAVE-EXCLUSIONS.md` + `06-09-SUMMARY.md` 均存在于磁盘。
- 提交 `3e29548`、`c707c87`、`502d87b` 均存在于历史。
- `git status` 仅含规划产物（SUMMARY/STATE/ROADMAP）；未改动任何生产/核心源码。

