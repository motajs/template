---
phase: 01-event
plan: 11
subsystem: event-layer-wiring
tags: [typescript, vitest, events, movement, legacy]
requires:
  - phase: 01-event/01-06
    provides: validated raw map event ingestion and event alias selection
  - phase: 01-event/01-07
    provides: source-aware mover-to-executor dispatch
  - phase: 01-event/01-09
    provides: point-event map save aggregation
  - phase: 01-event/01-10
    provides: static/dynamic tile event lifecycle
provides:
  - CoreState legacy map initialization assigns the event alias layer to GameMap.eventLayer
  - Regression coverage for legacy layer ownership and existing map-bound point-event dispatch
affects: [phase-01-verification, phase-02-pathfinding]
actuals:
  tokens: 2191
  tasks: 2
  commits: 2
  plan_head_before: 701e06f8d15abcc80a0120b2bb169a0f4431c85f
tech-stack:
  added: []
  patterns:
    - Controlled fake map/state fixtures invoke the existing private legacy initializer without constructing the browser runtime
    - Existing event ids are placed directly in the test event store to verify the approved source-aware movement path
key-files:
  created:
    - packages-user/data-state/src/coreEventLayer.test.ts
    - .planning/phases/01-event/01-11-SUMMARY.md
  modified:
    - packages-user/data-state/src/core.ts
    - packages-user/data-system/src/event/eventDispatch.test.ts
key-decisions:
  - "Select the already-created legacy layer whose alias is event and pass that same object to GameMap.setEventLayer."
  - "Keep serialized event registration, map-id binding, rawEvent/cache/Promise/as cleanup, and eventStore cycle repair deferred."
patterns-established:
  - "CoreState legacy initialization preserves layer order, z-indexes, matrices, and compareWith input while wiring eventLayer."
  - "Point-event regressions assert PointEvent with tile=null and the approved hero/trigger locator environment."
requirements-completed: [EVT-02]
coverage:
  - id: D1
    description: "CoreState legacy initialization selects the alias=event layer as each map's eventLayer without changing other map assembly."
    requirement: EVT-02
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/coreEventLayer.test.ts#selects the event alias layer without changing map assembly"
        status: pass
      - kind: other
        ref: "pnpm exec eslint packages-user/data-state/src/core.ts packages-user/data-state/src/coreEventLayer.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "An existing map-bound point-event id reaches DefaultHeroMoveTopImpl.enter and EventExecutor once with the approved source environment."
    requirement: EVT-02
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/event/eventDispatch.test.ts#executes a map-bound point id through the event layer and mover"
        status: pass
      - kind: unit
        ref: "packages-user/data-system/src/event/eventDispatch.test.ts#source-aware matching dispatch"
        status: pass
    human_judgment: false
duration: 13min
completed: 2026-09-09
status: complete
commits: 2
plan_head_before: 701e06f8d15abcc80a0120b2bb169a0f4431c85f
---

# Phase 01 Plan 11: Legacy Event-Layer Wiring Summary

**CoreState now makes the legacy event alias reachable by the existing source-aware movement dispatcher without adding production registration APIs**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-09T02:48:00Z
- **Completed:** 2026-09-09T02:59:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Wired every legacy map's already-created `event` alias layer through `GameMap.setEventLayer`.
- Added a controlled initializer regression preserving aliases, z-indexes, matrices, and `compareWith` references.
- Added a named movement regression proving an existing point-event id reaches the executor with `PointEvent`, `tile=null`, and approved locators.
- Preserved point/static/dynamic ordering and source-aware filtering by reusing the existing mover and executor path.

## Task Commits

Each task was committed atomically:

1. **Task 1: 贯通 CoreState legacy 初始化到可用 eventLayer** - `5f855d0` (fix)
2. **Task 2: 固化 eventLayer 可达的 source-aware 踩踏闭环** - `073e009` (test)

**Plan metadata:** pending state/summary commit

## Files Created/Modified

- `packages-user/data-state/src/core.ts` - Assigns the legacy event alias layer to `GameMap.eventLayer`.
- `packages-user/data-state/src/coreEventLayer.test.ts` - Verifies legacy map initialization with controlled map/state doubles.
- `packages-user/data-system/src/event/eventDispatch.test.ts` - Verifies an existing point-event id traverses the event layer, mover, and executor.

## Decisions Made

- Only the existing `event` alias layer is wired; no serialized production event registration or map-id binding was introduced.
- Existing `IGameEventInvocation` source environments, trigger filtering, ordering, await, cut, reduce, and point-event persistence remain unchanged.
- The existing CoreState registration TODO and all locked rawEvent/cache/Promise/as and eventStore-cycle deferrals remain intact.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Isolated the CoreState initializer test from the eager legacy singleton cycle**

- **Found during:** Task 1 (贯通 CoreState legacy 初始化到可用 eventLayer)
- **Issue:** Importing `CoreState` directly for the controlled initializer fixture eagerly traversed legacy enemy/import modules and attempted to construct the incomplete singleton before the test could call the private initializer.
- **Fix:** Mocked only the unrelated enemy and legacy constructor exports in the test so the real `CoreState.initMapState` method runs against controlled fakes.
- **Files modified:** `packages-user/data-state/src/coreEventLayer.test.ts`
- **Verification:** Focused Vitest and ESLint commands pass.
- **Committed in:** `5f855d0`

---

**Total deviations:** 1 auto-fixed (1 blocking test-isolation fix)
**Impact on plan:** The fixture-only mocks avoid browser/runtime construction and do not alter production imports, initialization, or event behavior.

## Verification

- `pnpm exec vitest run "packages-user/data-state/src/coreEventLayer.test.ts"` — passed (1 test).
- `pnpm exec vitest run "packages-user/data-state/src/coreEventLayer.test.ts" "packages-user/data-system/src/event/eventDispatch.test.ts"` — passed (7 tests).
- `pnpm exec eslint "packages-user/data-state/src/core.ts" "packages-user/data-state/src/coreEventLayer.test.ts" "packages-user/data-system/src/event/eventDispatch.test.ts"` — passed.
- `git diff --check HEAD~2 HEAD` — passed.
- Expected logger 171 warnings were emitted for intentionally unregistered static/dynamic fixture ids; the named point id executed once as asserted.

## Known Stubs

- `packages-user/data-state/src/core.ts:153` — Serialized event registration and map-id binding remains an intentional locked TODO; this plan does not add that production seam. Existing ledger entry 1 in `.planning/WINDOWS.md` records it.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The legacy CoreState movement entry now reaches the already-approved event-layer and source-aware dispatch path.
- Locked deferrals remain explicit and continue to require a future user-approved scope change before implementation.

---
*Phase: 01-event*
*Completed: 2026-09-09*

## Self-Check: PASSED

- Summary, implementation, and regression test files exist.
- Task commits `5f855d0` and `073e009` are present in git history.
- Focused Vitest, focused ESLint, and diff-check verification passed.
