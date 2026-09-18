---
phase: 06-unit-tests
plan: 13
subsystem: testing
tags: [vitest, save-load, saveState, loadState, compression, hero, map, core-state, replay, coverage-gap, it-skip]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 06-09 存档单测（各 saveLoad 类同实例往返 + CoreState 顶层公开 save/load 入口 D-45）
  - phase: 06-unit-tests
    provides: 06-05 勇士单测（HeroState/HeroItems/HeroEquipment 公开表面）与 06-06 地图单测（StaticTile/DynamicTile）
provides:
  - G-06-09-A 可跑绿：CoreState 顶层往返对每类 saveable 的全部关键状态逐一严格断言；录像 10 步多样化命令逐条 exact 断言
  - G-06-09-B 可跑绿：接受 compression 的类（EquipmentState/HeroItems/HeroState/StaticTile/DynamicTile）三档循环；无参类（HeroLocation/HeroRendering/FlagSystem/ReplaySystem）经 HeroState/CoreState 容器三档确认
  - G-06-09-B 受阻塞的正确预期 it.skip：EquipmentState 百分比加成 Low/High 压缩档（锚定 #06-09-1）、HeroEquipment 经容器三档（锚定 #06-09-2）
  - 06-COVERAGE-MAP.md 06-13 小节（缺口 → 用例 → 文件 → 计划 映射）
affects: [06-verify-work, 06-unit-tests 缺口收口]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 7700
  tasks: 3
  commits: 3
plan_head_before: 60be0c0a24e56e1d69f78943c165662b6d34b637

tech-stack:
  added: []
  patterns:
    - "三档压缩覆盖：接受 compression 参数的类 for (const compression of SAVE_COMPRESSIONS) 循环；不接受的类经 HeroState/CoreState 容器三档确认读取正确（G-06-09-B）"
    - "已知缺陷档位：按正确预期拆成独立 it，受阻塞档位 it.skip + 中文注释锚定既有 #06-09-N，绝不弱化为通过（D-05）"
    - "顶层关键状态逐一严格断言：seedState/mutateState/assertRestored 三者字段一一对应，录像以期望表逐条 exact 比对 command/params/index（D-13）"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/hero/saveLoad.test.ts
    - packages-user/data-base/src/map/saveLoad.test.ts
    - packages-user/data-state/test/saveablesRoundTrip.test.ts
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md

key-decisions:
  - "EquipmentState 百分比三档化：NoCompression 跑绿，Low/High 因 loadDiff 未回退装备原始定义（#06-09-1）而丢失未修改加成，按正确预期拆成 it.skip 而非弱化断言"
  - "HeroEquipment 经 HeroState 容器三档：saveState 未深拷贝 equipped/slots（#06-09-2），同实例容器往返必然丢失，按正确预期 it.skip 锚定既有条目"
  - "录像 10 步命令（0/1/2/3 移动、4 Teleport、5 UseItem×2、6 Equip、7 Unequip）参数类型含 number/boolean/string，确保命令不全相同且组合多样"
  - "flags/replay 不接受 compression 参数，经 CoreState.saveState(compression)/loadState(snapshot, compression) 三档容器往返满足 G-06-09-B"

patterns-established:
  - "roundTripPercentageModifier(compression) 文件内 helper：同一往返逻辑供三档（含 skip 档）复用，避免断言漂移"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "G-06-09-A：CoreState 顶层对每类 saveable 的全部关键状态逐一严格断言，录像 ≥10 步多样化命令逐条 exact"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/saveablesRoundTrip.test.ts#round-trips every registered saveable across all compressions"
        status: pass
    human_judgment: false
  - id: D2
    description: "G-06-09-B：hero 单档类三档化 + 经 HeroState 容器覆盖无 compression 参数类"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores a percentage modifier on the same instance in NoCompression"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores constant and consumable item tables across all compressions"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores attributes, modifiers and location across all compressions"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores location and rendering through the container across all compressions"
        status: pass
    human_judgment: false
  - id: D3
    description: "G-06-09-B：map StaticTile/DynamicTile 三档化"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/saveLoad.test.ts#restores covered events across all compressions (StaticTile)"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/map/saveLoad.test.ts#restores covered events across all compressions (DynamicTile)"
        status: pass
    human_judgment: false
  - id: D4
    description: "G-06-09-B：flags/replay 经 CoreState 容器三档确认读取正确"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/saveablesRoundTrip.test.ts#restores flags and replay through the container across all compressions"
        status: pass
    human_judgment: false
  - id: D5
    description: "受既有缺陷阻塞的档位：EquipmentState 百分比 Low/High（#06-09-1）与 HeroEquipment 容器三档（#06-09-2）的正确预期已登记，只能 it.skip"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores a percentage modifier on the same instance in LowCompression (it.skip)"
        status: unknown
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores a percentage modifier on the same instance in HighCompression (it.skip)"
        status: unknown
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores the equipped mapping through the container across all compressions (it.skip)"
        status: unknown
    human_judgment: true
    rationale: "既有缺陷 #06-09-1（压缩档不回退装备原始定义）与 #06-09-2（saveState 未深拷贝）未修复；三条 skip 经临时取消 skip 验证均为真实失败，跳过不代表通过，需人工确认是否进入修复批次。"

duration: 14min
completed: 2026-09-15
status: complete
---

# Phase 06 Plan 13: 存档缺口补测（G-06-09-A/B）Summary

**按 D-43 三阶段补齐 G-06-09-A（CoreState 顶层全关键状态严格一致 + 录像 ≥10 步多样化）与 G-06-09-B（所有 saveState/loadState 类三档覆盖，无参类经容器三档），只扩展 3 个 `*.test.ts` 与覆盖表，无任何生产代码改动。本计划是本批次唯一测试 `saveState`/`loadState` 的计划（D-32）。**

## Performance

- **Duration:** 14min
- **Started:** 2026-09-15T11:14:00Z
- **Completed:** 2026-09-15T11:28:00Z
- **Tasks:** 3
- **Files modified:** 4（3 个测试文件 + 1 个覆盖表）

## Accomplishments

- **阶段 1（构件级，`hero/saveLoad.test.ts`）**：`EquipmentState` 百分比加成按档拆分——NoCompression 跑绿，Low/High 命中既有 `#06-09-1` 按正确预期 `it.skip`；`HeroItems` 永久/消耗分表与 `HeroState` 属性/修饰器/位置改为 `for (const compression of SAVE_COMPRESSIONS)` 三档循环；新增「经 `HeroState` 容器三档」用例覆盖 `HeroLocation`/`HeroRendering`，`HeroEquipment` 经容器的正确预期因 `#06-09-2` 以 `it.skip` 登记。既有 `#06-09-1`/`#06-09-2` skip 原样保留。
- **阶段 2（组合，`map/saveLoad.test.ts`）**：`StaticTile` 与 `DynamicTile` 的覆盖事件往返改为三档循环（每档新建 fixture/tile），断言覆盖事件映射恢复与 `saved.num`；既有 `#06-09-3` skip 原样保留；既有 `MapLayer`/`GameMap`/`MapState` 三档用例未回归。
- **阶段 3（完整/集成，`saveablesRoundTrip.test.ts`）**：`seedState`/`mutateState`/`assertRestored` 扩为逐类 saveable 的**全部关键状态**并严格断言——勇士 base hp/atk/def/money/exp + 修饰器最终 atk(15) + 位置/楼层/朝向；flags score/coins/stage；地图两块 `(0,0)=5`/`(1,1)=7` + 激活状态；enemy hp 30/atk 9；录像 **10 步多样化命令**逐条 exact（command/params/index）。新增 flags/replay 容器三档用例；既有 `#06-09-5` skip 原样保留。
- `06-COVERAGE-MAP.md` 以 create-or-append 方式追加 06-13 小节（缺口 → 用例 → 文件 → 计划），明确「本计划无新增码」。

## Task Commits

Each task was committed atomically:

1. **Task 1: 阶段 1（构件级）hero 三档化 + 容器覆盖无参类** - `6d7e57a` (test)
2. **Task 2: 阶段 2（组合）map tile 三档化** - `8a7cda9` (test)
3. **Task 3: 阶段 3（完整/集成）CoreState 全关键状态 + 录像 10 步 + 覆盖表** - `992ca9d` (test)

**Plan metadata:** _(docs: complete 06-13 plan — 见最终提交)_

## Files Created/Modified

- `packages-user/data-base/src/hero/saveLoad.test.ts` - 新增 `roundTripPercentageModifier` helper；`EquipmentState` 百分比按档拆分（1 绿 + 2 正确预期 skip）；`HeroItems`/`HeroState` 三档循环；新增容器覆盖 describe（location/rendering 绿 + equip 正确预期 skip）
- `packages-user/data-base/src/map/saveLoad.test.ts` - `StaticTile`/`DynamicTile` 覆盖事件往返三档化，改名 `restores covered events across all compressions`
- `packages-user/data-state/test/saveablesRoundTrip.test.ts` - 新增 `REPLAY_STEPS` 期望表与 `seedReplay`；`seedState`/`mutateState`/`assertRestored` 扩为全关键状态；新增 flags/replay 容器三档 describe
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` - create-or-append 06-13 小节

## Decisions Made

- **已知缺陷档位不弱化**：`EquipmentState` 百分比在 Low/High 读档后修饰器消失（`loadDiff` 未回退 `item.equip`，`#06-09-1`）；`HeroEquipment` 经容器三档丢失装备映射（`saveState` 未深拷贝，`#06-09-2`）。二者均按正确预期写成独立 `it.skip`，不复用 NoCompression 的通过断言掩盖缺陷。
- **无 compression 参数类经容器确认**：`FlagSystem`/`ReplaySystem` 的 `saveState` 不接受压缩档，按 plan 要求经 `CoreState.saveState(compression)`/`loadState(snapshot, compression)` 三档容器往返确认读取正确。
- **录像多样化**：10 步覆盖 8 种命令码中的 8 类（含 Teleport/UseItem/Equip/Unequip），参数类型含 number/boolean/string；逐条 `toEqual({ command, params, index })`。
- **不新建 finding**：三条新 skip 均复用既有 `#06-09-1`/`#06-09-2` 锚点，`06-TEST-FINDINGS.md` 无新增 `#06-13-N` 缺陷条目。

## Deviations from Plan

**1. [Rule 3 — 计划措辞与实现的类型约束] `EquipmentState` 百分比用例改为三档拆分而非单条 for 循环**

- **Found during:** Task 1
- **Issue:** Plan 要求把「百分比加成恢复」用例改为 `for (const compression of SAVE_COMPRESSIONS)` 三档循环，但 Low/High 档命中既有缺陷 `#06-09-1`（`loadDiff` 清空后未回退装备原始定义）。若保留单条循环并弱化断言即违反 D-05（不得弱化为通过）；若整条 skip 则会连带取消 NoCompression 的既有跑绿覆盖。
- **Fix:** 抽取 `roundTripPercentageModifier(compression)`，拆成 3 条 `it`（NoCompression 跑绿；Low/High 正确预期 `it.skip` 锚定 `#06-09-1`）。plan 的 execution_rules 明确授权「若某档命中已知缺陷，按 D-05 将该档改为正确预期 `it.skip` 并锚定既有 `#06-09-N`」。
- **Files modified:** `packages-user/data-base/src/hero/saveLoad.test.ts`
- **Commit:** `6d7e57a`

**2. [Rule 3 — 类型约束] `roundTripPercentageModifier` 返回类型取 `unknown`**

- **Found during:** Task 1（D-44 类型门禁）
- **Issue:** `IHeroModifier<number>` 的 `getValue()` 实际返回 `unknown`（`IHeroModifier<H=unknown, V=unknown>`），标注为 `number | undefined` 触发 `TS2322`。
- **Fix:** 返回类型改为 `unknown`，断言侧仍用 `toBe(0.5)`，不引入 `as`。
- **Files modified:** `packages-user/data-base/src/hero/saveLoad.test.ts`
- **Commit:** `6d7e57a`

## Issues Encountered

None. 三阶段均先聚焦跑绿再进入下一阶段，未出现阻断后续阶段的 bug；未触碰任何生产/核心源码。

## Verification Evidence

- **阶段 1 聚焦运行**：`pnpm exec vitest run packages-user/data-base/src/hero/saveLoad.test.ts` → 1 file passed / 14 passed / 6 skipped（新增 3 条正确预期 skip）。
- **阶段 2 聚焦运行**：`pnpm exec vitest run packages-user/data-base/src/map/saveLoad.test.ts` → 1 file passed / 8 passed / 1 skipped（既有 `#06-09-3` 不变）。
- **阶段 3 聚焦运行**：`pnpm exec vitest run packages-user/data-state/test/saveablesRoundTrip.test.ts` → 1 file passed / 8 passed / 1 skipped（既有 `#06-09-5` 不变）。
- **D-44 门禁（每次提交前）**：
  - `pnpm exec eslint --fix <改动文件>` 后 `pnpm exec eslint <改动文件>` → exit 0（3 次均 0 错误）。
  - `pnpm exec vue-tsc --noEmit` 输出按三个改动测试文件路径过滤 → 0 匹配（阶段 1 曾出现 1 处 `TS2322`，按 deviation 2 修正后归零）；全局既有无关错误 28 行不在本门禁范围。
  - `pnpm test:ci` → 全绿：阶段 1 后 66 文件 / 645 通过 / 25 跳过；阶段 3 后 **66 文件 / 646 通过 / 25 跳过**，无失败。
- **skip 真实性**：三条新增 `it.skip` 经临时取消 skip 运行确认均为真实失败（百分比档读回 `undefined` 修饰器值；容器 equip 档 `getEquipped(0)` 为 `undefined`），随后恢复 skip。
- **变更范围**：`git status` 仅显示 3 个 `*.test.ts` 与 `06-COVERAGE-MAP.md`；无生产/核心源码改动。既有 `#06-09-1..5` 的 skip 全部保持原样。

## Known Stubs

None - 无桩代码；3 条 `it.skip` 为受既有缺陷阻塞的正确预期登记（D-05/D-46），锚定 `06-TEST-FINDINGS.md` 既有 `#06-09-1`/`#06-09-2`。

## Next Phase Readiness

- 06-09（存档）人工评审发现的覆盖缺口 G-06-09-A/B 已全部收口（可跑绿部分补齐；受既有缺陷阻塞的档位以正确预期 skip 登记）。
- 后续若修复 `#06-09-1`（压缩档回退装备原始定义）与 `#06-09-2`（`saveState` 深拷贝），需取消对应 3 条 `it.skip` 并转为回归用例（D-05）。
- Wave 4 的 06-14（G-06-04-C 录像读取流）仍待执行。

## Self-Check: PASSED

- FOUND: .planning/phases/06-unit-tests/06-13-SUMMARY.md
- FOUND: 6d7e57a (Task 1)
- FOUND: 8a7cda9 (Task 2)
- FOUND: 992ca9d (Task 3)

---
*Phase: 06-unit-tests*
*Completed: 2026-09-15*
