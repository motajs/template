---
phase: 02-pathfinding
plan: 03
subsystem: pathfinding
tags: [pathfinding, hero-mover, pass-predicate, teleport, interruption, events]

# Dependency graph
requires:
  - phase: 02-pathfinding (plan 02)
    provides: L2 PathfindingSystem、IPathfindingStep、usePassPredicate/useFallbackPolicy 接线槽位与 mover 控制器契约
  - phase: 01-event-system
    provides: source-aware enter/leave/touch 事件执行链与地图事件层
provides:
  - DefaultHeroMoveTopImpl predicate() 通行性实现与 HeroMover 新 IPassPredicate 调用链
  - HeroPathfinding L3 数据端入口，支持逐步移动、瞬移、事件路径回退与 D-08 相邻格触碰
  - 新寻路/interrupt 的 stop-then-await 接管时序、CoreState/barrel 装配与路径日志码
affects: [phase-04-rendering, PATH-01, PATH-02]

# Actuals (#2632)
actuals:
  tokens: 9881
  tasks: 4
  commits: 4
plan_head_before: 3770e56c4d6e589c565172800565ff28c9f5159b
commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "L3 通过 IPassPredicate 注入 L2，HeroMover 与寻路图共享同一通行性语义"
    - "事件路径默认回退逐步移动；无事件路径使用 Teleport 步骤"
    - "D-08 采用相邻格移动完成后直接构造 source-aware OnTouch invocation"
    - "接管控制器先停止并等待旧 mover，再从最新坐标重算新路径"

key-files:
  created:
    - packages-user/data-state/src/path/heroPathfinding.ts
    - packages-user/data-state/src/path/heroPathfinding.test.ts
    - packages-user/data-state/src/path/index.ts
  modified:
    - packages-user/data-state/src/hero/moverImpl.ts
    - packages-user/data-base/src/hero/mover.ts
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/src/index.ts
    - packages/common/src/logger.json
    - .planning/phases/02-pathfinding/deferred-items.md

key-decisions:
  - "通行性判定从 DefaultHeroMoveTopImpl 提取为 IPassPredicate，反向方向由 FaceDirection 映射计算，不再依赖 handler.face"
  - "D-08 no-pass 目标沿可达相邻格完成移动后直接派发 OnTouch，并让勇士面朝目标"
  - "新寻路调用通过 queued controller 实现 stop 后 await，再从旧步兑现后的坐标接管"
  - "路径错误启动增加 error 65；已有寻路告警继续使用 warn 173/174，保持数字码集中登记"

requirements-completed: [PATH-01, PATH-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Hero mover 通行性判断重构为 IPassPredicate，Phase 1 enter/leave/hit 行为保持"
    requirement: PATH-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/coreEventLayer.test.ts (1 passed)"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src (16 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "HeroPathfinding 逐步移动沿最小路径执行，途经 OnEnter/OnLeave 事件链自然触发"
    requirement: PATH-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/src/path/heroPathfinding.test.ts#moves the hero to the target and triggers the traversed event"
        status: pass
    human_judgment: false
  - id: D3
    description: "瞬移、路径事件默认回退、D-08 相邻格 OnTouch/面朝与不可达空路径语义"
    requirement: PATH-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/src/path/heroPathfinding.test.ts (7 passed: teleport/fallback/D-08)"
        status: pass
    human_judgment: false
  - id: D4
    description: "新寻路与显式 interrupt 采用 stop-then-await 接管，旧移动停止后可再次启动"
    requirement: PATH-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/src/path/heroPathfinding.test.ts#hands over a moving path to a new target"
        status: pass
      - kind: integration
        ref: "packages-user/data-state/src/path/heroPathfinding.test.ts#leaves the mover restartable after explicit interruption"
        status: pass
    human_judgment: false
  - id: D5
    description: "CoreState/barrel 装配、logger 数字码与阶段质量门禁"
    requirement: PATH-02
    verification:
      - kind: other
        ref: "logger.json enumeration: warn 173/174 and error 65 unique; check:circular path filter empty"
        status: pass
      - kind: other
        ref: "target-file eslint: 0 problems; full vitest: 11 files, 65 tests passed"
        status: pass
    human_judgment: true
    rationale: "Repository-wide type gate retains two pre-existing CoreState TileStore diagnostics and lint:user retains unrelated client/legacy diagnostics; both are recorded in deferred-items.md."

# Metrics
duration: 30min
completed: 2026-09-09
status: complete
---

# Phase 02 Plan 03: L3 寻路接线 Summary

**HeroPathfinding 数据端闭环：共享 IPassPredicate 的逐步/瞬移执行、事件回退、D-08 相邻格触碰与可接管中断控制器**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-09T12:55:00Z
- **Completed:** 2026-09-09T13:24:37Z
- **Tasks:** 4
- **Files modified:** 9 implementation/test/config files plus planning ledgers

## Accomplishments

- Task 1 将 `DefaultHeroMoveTopImpl` 的掩码与 `eventPass` 判定提取为 `IPassPredicate`，HeroMover 改为构造 `IPassCheckHandler` 调用 predicate，既有事件回归全绿
- Task 2 新建并装配 `HeroPathfinding`，将 hero predicate、地图事件层和 mover 绑定到 L2，逐步路径真实执行并触发途经事件
- Task 3 实现无事件路径瞬移、事件路径默认逐步回退、D-08 no-pass 相邻格 + OnTouch + 面朝，以及四邻不可达空路径
- Task 4 实现 queued controller 接管与显式 interrupt，登记 error 65，并完成 65 个全量 Vitest 测试与路径循环依赖门禁

## Task Commits

Each task was committed atomically:

1. **Task 1: moverImpl 通行性判断重构为 IPassPredicate** - `68a1508` (refactor)
2. **Task 2: 逐步自动寻路端到端接线** - `2759df5` (feat)
3. **Task 3: 瞬移、回退策略与 D-08 相邻格触碰** - `6cde84e` (feat)
4. **Task 4: 打断接管、logger 码与阶段门禁** - `7a3b6e3` (fix)

## Files Created/Modified

- `packages-user/data-state/src/hero/moverImpl.ts` - 共享 hero 通行性 predicate 与原有事件 hooks
- `packages-user/data-base/src/hero/mover.ts` - predicate 调用点与完整 pass-check handler
- `packages-user/data-state/src/path/heroPathfinding.ts` - L3 寻路、回退、D-08、接管控制器
- `packages-user/data-state/src/path/heroPathfinding.test.ts` - 逐步、瞬移、回退、D-08、interrupt 集成测试
- `packages-user/data-state/src/core.ts` - CoreState 寻路系统初始化
- `packages-user/data-state/src/index.ts` / `path/index.ts` - data-state barrel 导出
- `packages/common/src/logger.json` - error 65，合并已有 warn 173/174
- `.planning/phases/02-pathfinding/deferred-items.md` - 记录未触碰的 CoreState 泛型与 legacy lint 基线

## Decisions Made

- 延续用户拍板的方案 A：D-08 触碰事件在相邻格移动完成后通过 `IGameEventInvocation` 直接执行
- 由于接口是同步返回 controller，接管使用 queued controller 暴露稳定的 `onEnd`，内部仍严格 stop → await → 重算 → start
- 渲染端点击接线保持延后至 Phase 4；本计划只暴露并验证数据端入口

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 补齐 IPassCheckHandler 的 state 字段**
- **Found during:** Task 2 type gate
- **Issue:** predicate 契约继承 `IDataCommonExtended`，初始调用对象缺少 `state`，阻塞严格类型检查
- **Fix:** 从既有 hero handler 转发 `state`，保持 predicate 所需完整契约
- **Files modified:** `packages-user/data-base/src/hero/mover.ts`
- **Verification:** path 集成测试、全量 Vitest 与目标 ESLint 通过
- **Committed in:** `2759df5`

**2. [Rule 2 - Missing Critical] 为 mover 已激活竞争登记 logger error 65**
- **Found during:** Task 4 logger gate
- **Issue:** L3 启动路径在底层 mover 仍激活时只能静默返回 null，缺少数字码诊断
- **Fix:** 登记并调用 error 65；warn 173/174 与既有寻路诊断保持不变
- **Files modified:** `packages-user/data-state/src/path/heroPathfinding.ts`, `packages/common/src/logger.json`
- **Verification:** logger enumeration confirms unique warn 173/174 and error 65
- **Committed in:** `7a3b6e3`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical diagnostic)
**Impact on plan:** Both fixes are directly required for strict predicate correctness and observable mover handoff failures; no architectural scope expansion.

## Issues Encountered

- `pnpm check:type` still reports the two pre-existing `data-state/src/core.ts` TileStore generic diagnostics; the new path files and mover predicate call chain add no diagnostics. Recorded in `deferred-items.md`.
- `pnpm lint:user` still reports 52 errors in untouched `client-modules` and `legacy-plugin-*` files; plan-owned files pass ESLint and the baseline is recorded in `deferred-items.md`.
- Existing CoreState serialized event registration TODO remains intentionally deferred from Phase 1 and is already tracked in `WINDOWS.md` entry 1; it is unrelated to this plan.

## Known Stubs

| File | Location | Reason |
| ---- | ---- | ---- |
| `packages-user/data-state/src/core.ts` | line 156 | Pre-existing serialized event registration/map-id binding TODO from Phase 1; not part of pathfinding and already tracked in the broken-windows ledger |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PATH-01 data端自动寻路闭环已具备 Node 验证；PATH-02 的渲染端点击接线仍按 D-11 留给 Phase 4
- Phase 02 plans are complete and ready for phase-level verification/transition
- Repository-wide type/lint baseline issues remain open as documented; they do not affect the plan-owned pathfinding tests, circular dependency scan, or target-file lint

---
*Phase: 02-pathfinding*
*Completed: 2026-09-09*

## Self-Check: PASSED

- All three created path files exist; all four task commits (`68a1508`, `2759df5`, `6cde84e`, `7a3b6e3`) are present in git history
- Verification rerun: full Vitest 11 files / 65 tests passed; core event regression 1 passed; data-base tests 16 passed; path circular filter empty; target-file ESLint 0 problems
- `requirements-completed` copies `[PATH-01, PATH-02]`; shared requirement status is advanced only after this SUMMARY is present
- Known pre-existing type/lint issues are explicitly recorded in `deferred-items.md`; no untracked generated files remain
