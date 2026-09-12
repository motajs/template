---
phase: 01-event
plan: 07
subsystem: event-dispatch
tags: [typescript, vitest, events, triggers, movement]
requires:
  - phase: 01-event/01-06
    provides: Coordinate point-event views and validated event-layer raw ingestion
  - phase: 01-event/01-10
    provides: Static/dynamic tile event defaults and complete source views
  - phase: 01-event/01-04
    provides: User-approved source-aware invocation, ordering, await, and reduction contract
provides:
  - Source-aware event invocations carrying the real point/static/dynamic environment
  - Trigger filtering before event execution and reduction/cut participation
  - Point-first, tile-priority-desc dispatch across static and all dynamic tiles
  - Complete enter/leave/hit behavior and mode/reduction test coverage
affects: [01-09, phase-01-verification, phase-02-pathfinding]
actuals:
  tokens: 7543
  tasks: 2
  commits: 2
  plan_head_before: 87f2252ccc26854720857d3c58a62944a894a553
tech-stack:
  added: []
  patterns:
    - One ordered invocation list carries heterogeneous event sources without a generic workflow abstraction
    - Trigger matching occurs after id lookup and before execute, cut, or reduce
key-files:
  created:
    - packages-user/data-system/src/event/eventDispatch.test.ts
  modified:
    - packages-user/data-base/src/map/types.ts
    - packages-user/data-system/src/event/types.ts
    - packages-user/data-system/src/event/executor.ts
    - packages-user/data-state/src/hero/moverImpl.ts
key-decisions:
  - "IGameEventInvocation is the only new public source-aware shape: id plus IBlockEventEnv; executor still makes one full-sequence call."
  - "Point sources precede a globally priority-descending static/dynamic tile group, and each source receives its actual tile or null."
  - "Serialized event registration and cannotEnter remain deferred; this plan only dispatches already-available event ids."
patterns-established:
  - "Unmatched triggers are invisible to execution results, reduction, and cut short-circuiting."
  - "Every selected event is awaited before the next selected invocation begins."
requirements-completed: [EVT-02, EVT-03]
coverage:
  - id: D1
    description: "Point, static, and every dynamic event dispatch with trigger filtering, source environments, priority order, and sequential await is verified."
    requirement: EVT-02
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/event/eventDispatch.test.ts#source-aware matching dispatch"
        status: pass
      - kind: unit
        ref: "packages-user/data-system/src/event/eventDispatch.test.ts#awaits each source before continuing to the next one"
        status: pass
    human_judgment: false
  - id: D2
    description: "Cut/reduce modes, unknown-id recovery, and enter/leave/hit trigger-coordinate mappings are verified."
    requirement: EVT-02
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/event/eventDispatch.test.ts#event execute modes and reductions"
        status: pass
      - kind: unit
        ref: "packages-user/data-system/src/event/eventDispatch.test.ts#enter leave hit trigger hooks"
        status: pass
    human_judgment: false
duration: 25min
completed: 2026-09-09
status: complete
commits: 2
plan_head_before: 87f2252ccc26854720857d3c58a62944a894a553
---

# Phase 01 Plan 07: Source-Aware Event Dispatch Summary

**Trigger-filtered point/static/dynamic event dispatch with real source environments, ordered awaits, and complete movement-hook coverage**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-09T00:09:00Z
- **Completed:** 2026-09-09
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added the approved `IGameEventInvocation { id, env }` shape and changed the executor to process one complete source-aware sequence.
- `DefaultHeroMoveTopImpl` now collects point events first, then static plus every dynamic tile by descending priority, preserving each source's real `BlockEventType` and tile identity.
- Trigger mismatches are skipped before execution and cannot affect cut/reduce; unknown ids still warn with code 171 and later valid events execute.
- Added behavior coverage for source identity, ordering, sequential awaits, all execution/reduction paths, unknown ids, and enter/leave/hit trigger-coordinate contracts.

## Task Commits

Each task was committed atomically:

1. **Task 1: 贯通一个来源正确、触发器匹配的 point→static→dynamic 分派** - `2205614` (fix)
2. **Task 2: 扩展 cut/reduce 与 enter/leave/hit 行为矩阵** - `ff41ab3` (test)

**Plan metadata:** pending state/summary commit

## Files Created/Modified

- `packages-user/data-base/src/map/types.ts` - Defines the source-aware invocation contract.
- `packages-user/data-system/src/event/types.ts` - Exposes the invocation-list executor signature.
- `packages-user/data-system/src/event/executor.ts` - Filters triggers and executes only matching source invocations while preserving await/cut/reduce behavior.
- `packages-user/data-state/src/hero/moverImpl.ts` - Collects point/static/dynamic sources and builds source-correct environments.
- `packages-user/data-system/src/event/eventDispatch.test.ts` - Verifies the complete dispatch and movement behavior matrix.

## Decisions Made

- Kept one executor call over one complete ordered invocation list, with source metadata carried per invocation.
- Kept point events as `PointEvent` with `tile: null`; static and dynamic events use `TileEvent` with the actual tile object.
- Did not add registration APIs, built-ins, or `cannotEnter` behavior; those remain outside the approved scope.

## Deviations from Plan

None - plan executed within the approved source-aware dispatch contract.

## Issues Encountered

- The test initially imported the data-state barrel, which eagerly constructed `CoreState` and required a full hero runtime. The test now imports `moverImpl` directly so it can isolate the approved movement implementation without changing production initialization.
- Expected logger warnings are emitted for the explicit unknown-id recovery cases; all focused tests pass.

## Known Stubs

None found in files created or modified by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The Phase 01 movement dispatch gap is closed for already-bound event ids and is ready for phase verification.
- Production serialized-event registration remains intentionally deferred; no plan should infer it from this dispatch implementation.

---
*Phase: 01-event*
*Completed: 2026-09-09*

## Self-Check: PASSED

- All five planned implementation/test files and this summary exist.
- Task commits `2205614` and `ff41ab3` are present in git history.
- Full focused Vitest and ESLint verification passed; unrelated working-tree changes remain unstaged.
