---
phase: 07-data-fixes
plan: 08
subsystem: testing
tags: [pathfinding, replay, teleport, event-layer, vitest, data-state]

# Dependency graph
requires:
  - phase: 07-data-fixes
    provides: "07-07 save code 178 语义修复（同文件 core.ts，串行依赖）"
provides:
  - "顶层录像瞬移回归见证：createSmallMapScene 返回 map、测试侧绑定 map.eventLayer、原 it.skip 用例重命名并转绿"
  - "接线事实与 layer 有意为 null 的确认；楼层切换重注入缺口与 teleportTo 自目标空路径缺陷的登记（本阶段不修）"
affects: [07-data-fixes 收尾, replay, pathfinding, 后续切层重注入]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 528
  tasks: 3
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "测试侧显式绑层：顶层装配把 layer 留 null（有意设计），测试在楼层激活后调用 finder.useMapLayer(map.eventLayer) 再播放录像"
    - "加法式返回值变更：createSmallMapScene 增加 return map，既有忽略返回值的调用方零改动"

key-files:
  created: []
  modified:
    - packages-user/data-state/test/replayPlayback.test.ts

key-decisions:
  - "保持 core.ts 原样（layer 为 null 属有意设计：勇士初始不在任何楼层），由测试侧绑定 map.eventLayer 验证真实装配（用户裁决 test-binds-layer）"
  - "瞬移目标由 (1,0) 改为 (2,0) 以规避 finder.find 的 startIndex === targetIndex 空路径早退；断言改为 x=2/y=0"
  - "teleportTo 自目标/空路径导致的 2005 + sandbox 挂起属未登记缺陷，仅登记不修"
  - "不为 #06-07-1 新建 WINDOWS.md 账本条目（该 ID 本就无条目，避免抬高 open_count 门禁）"

patterns-established:
  - "测试侧层绑定：当生产把 layer 有意留 null 时，回归测试在楼层激活后自行绑定事件层，而非要求生产改动"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "顶层录像瞬移用例在测试侧绑定 map.eventLayer 后转绿（用例重命名为 plays a teleport step after the event layer is bound on floor activation，不再以 it.skip 存在）"
    requirement: "FIX-01"
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/replayPlayback.test.ts#plays a teleport step after the event layer is bound on floor activation"
        status: pass
    human_judgment: false
  - id: D2
    description: "用户负责的楼层切换事件层重注入缺口登记为后续项（本阶段不修、不评价其设计、不新建账本条目）"
    verification: []
    human_judgment: true
    rationale: "该缺口归用户所有（D-07），本阶段仅登记；是否接受当前核心设计需用户判断"
  - id: D3
    description: "teleportTo 自目标/空路径缺陷（返回 null → 2005 → sandbox 挂起）登记为未登记缺陷（本阶段不修）"
    verification: []
    human_judgment: true
    rationale: "超出 #06-07-1 范围，用户裁决仅登记不修；后续是否修复需用户决策"

# Metrics
duration: 3min
completed: 2026-09-16
status: complete
---

# Phase 07 Plan 08: 数据端缺陷修复（#06-07-1 顶层装配缺口）Summary

**测试侧绑定事件层、重命名并取消 skip 后，顶层录像瞬移用例转绿（不再告警 173、不再下发 2005）；生产源码 core.ts 未改动**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-16T13:01:00Z
- **Completed:** 2026-09-16T13:04:00Z
- **Tasks:** 3（Task 0 确认为 test-binds-layer；Task 1 测试改动；Task 2 门禁与登记）
- **Files modified:** 1（`replayPlayback.test.ts`）

## Accomplishments

- `#06-07-1` 的顶层录像瞬移回归见证落地：`createSmallMapScene` 加法式返回 `map`，目标用例在楼层激活后调用 `state.pathfinding.finder.useMapLayer(map.eventLayer)`，用例由 `plays a teleport step without manual finder wiring` 重命名为 `plays a teleport step after the event layer is bound on floor activation` 并取消 skip（本计划未新增任何 `it.skip`）。
- 瞬移目标按用户裁决由 `(1,0)` 改为 `(2,0)`，断言改为 `x=2`/`y=0`，规避 `finder.find` 的 `startIndex === targetIndex` 空路径早退。
- 未修改任何生产源码（`core.ts` 保持用户接线原样）；`git show --name-only 2f148c9` 仅含该测试文件。
- 登记两类剩余项：楼层切换事件层重注入缺口（用户负责）、`teleportTo` 自目标/空路径缺陷（未登记，仅登记不修）。

## Task Commits

Each task was committed atomically:

1. **Task 0: D-07/D-09 确认（checkpoint:decision）** - 无提交（只读确认，用户裁决 `test-binds-layer`）
2. **Task 1: 测试侧绑定事件层、重命名用例并验证顶层录像瞬移转绿** - `2f148c9` (test)
3. **Task 2: D-44 门禁、全量套件与用户负责项处置登记** - 无独立代码提交（门禁执行 + SUMMARY 登记，随本计划元数据提交入库）

**Plan metadata:** 见本 SUMMARY 的最终 docs 提交

## Files Created/Modified

- `packages-user/data-state/test/replayPlayback.test.ts` — `createSmallMapScene` 返回 `map`（+注释）；目标用例捕获 map 并绑定 `map.eventLayer`、瞬移目标 `(2,0)`、断言 `x=2`/`y=0`、重命名并取消 skip、注释中性化。

## 接线事实与处置登记

### ① 已确认的接线事实（用户产出，提交 `1ff22dd`；本计划只读）

- `packages-user/data-state/src/core.ts:236` — `pathfinding.finder.useMapState(this.maps)`
- `packages-user/data-state/src/core.ts:238` — `pathfinding.finder.useMapLayer(null)`（其上中文注释原意：初始状态下勇士不在任何楼层，切换楼层后再具体设置）
- `packages-user/data-state/src/core.ts:239-240` — `pathfinding.finder.usePassPredicate(new DefaultPassPredicateImpl(this.maps))`

### ② `core.ts` 的 `layer` 为 `null` 是**有意设计**（非遗漏）

因此单纯取消 skip 仍会命中 `finder.ts:212-215` 的告警 173 → 空路径 → 2005。故本计划由**测试侧**绑定事件层，而非改动生产源码。

### ③ 本计划的测试侧处置

- `createSmallMapScene` 返回 `map`（对既有忽略返回值的调用方为加法式变更；`withReplayDisabled` 返回值可穿透）。
- 目标用例在楼层激活后、播放前调用 `state.pathfinding.finder.useMapLayer(map.eventLayer)`。
- 用例由 `plays a teleport step without manual finder wiring` 重命名为 `plays a teleport step after the event layer is bound on floor activation`。
- 瞬移目标由 `(1,0)` 改为 `(2,0)`，断言改为 `x=2`/`y=0`（用户裁决的「改瞬移目标」），用于规避自目标空路径早退。
- `wireFinder=true` 的三个兄弟用例一字未改；`core.ts` 未改动。

### ④ 剩余的用户负责缺口（本阶段**不修复**）

`core.ts:238` 的一次性 `useMapLayer(null)` 在楼层切换（`gameMap.ts:43` 的 `eventLayer` 变化）时不会被重新注入，仓库内除测试外无对应生产调用点。该缺口登记为**用户负责后续项**，本阶段不实现、不评价其设计。

### ⑤ 未登记缺陷登记（本阶段**不修复**，仅登记）

D-09 首跑发现 `PathfindingSystem.teleportTo` 对「空路径 / 瞬移目标等于勇士当前格」返回 null（`system.ts:96-98`，源于 `finder.find` 的 `startIndex === targetIndex` 早退，`finder.ts:150`），进而下发 2005，并使 `ReplaySandbox.step` 返回 false、`ending` 未置位、`waitForEnded` 抛 `replay sandbox did not end`。该行为属未登记缺陷、超出 `#06-07-1` 范围；用户裁决为「仅登记不修」。

### 账本事实

`#06-07-1` 在 `.planning/WINDOWS.md` 中无对应条目（已核验无 `06-07` 匹配），D-14 的 waive 没有可 waive 的对象；按用户确认**不新建条目**，`open_count` 不变。本计划未调用 `gsd-tools windows append`。

## Decisions Made

- 保持 `core.ts` 原样（layer 有意为 null），测试侧绑定 `map.eventLayer` 并重命名用例，不新建账本条目（用户裁决 `test-binds-layer`）。
- 瞬移目标改为 `(2,0)`、断言改为 `x=2`/`y=0`。
- `teleportTo` 自目标/空路径行为仅登记不修。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - focused test、D-44 门禁与全量套件均一次通过。仓库级 `vue-tsc --noEmit` 退出码为 2，但本计划按 D-12/D-44 的文件级判定过滤 `data-state/test/replayPlayback.test.ts` 命中 0 条；27 条 type error 全部位于渲染端 `packages-user/client-modules/**` 与 `packages-user/legacy-plugin-data/**`（模块导出缺失），属改动前既有基线，与本计划无关。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `#06-07-1` 的测试侧回归见证已落地并转绿；Phase 7 唯一顶层装配缺口在数据端获得可跑证据。
- 待用户决策的两个后续项：楼层切换时事件层的重注入（`core.ts`）、`teleportTo` 自目标/空路径的 2005 + sandbox 挂起行为。

---

## TDD Gate Compliance

不适用（本计划非 `type: tdd`）。本计划为回归见证类改动：先取消既有 skip，再验证转绿；未新增用例。

---

*Phase: 07-data-fixes*
*Completed: 2026-09-16*

## Self-Check: PASSED

- FOUND: `.planning/phases/07-data-fixes/07-08-SUMMARY.md`
- FOUND: commit `2f148c9` (test(07-08): #06-07-1 bind the event layer in the teleport playback test)
- VERIFIED: `packages-user/data-state/src/core.ts` unchanged vs baseline `4a25e2e`
- VERIFIED: `git diff 4a25e2e --stat` shows only `replayPlayback.test.ts` modified by code commits
