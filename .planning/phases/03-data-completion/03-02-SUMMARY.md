---
phase: 03-data-completion
plan: 02
subsystem: data-state-events
tags: [events, anon-tokyo, data-state, data-system, vitest]

requires:
  - phase: 03-data-completion
    provides: Node-safe CoreState construction and awaited replay/event tracer from 03-01
provides:
  - User-confirmed contract for the eight approved event built-ins
  - Map, hero, front-touch, and temporary-event built-in implementations
  - Stable AnonTokyo registration assembled by CoreState without legacy catalog expansion
affects: [03-03, 03-04, 03-05]

actuals:
  tokens: 9313
  tasks: 2
  commits: 2
  plan_head_before: 3e2b80a3e3c13dd1b947357c4516049a3ca80277

tech-stack:
  added: []
  patterns:
    - Event built-ins expose independent parameter interfaces and `(param, env)` handlers
    - CoreState passes module-owned AnonTokyo BuiltInFunction entries into GameEventSystem
    - Data-side fixtures use real Node-safe state with explicit maps, hero, and event-store dependencies

key-files:
  created:
    - .planning/phases/03-data-completion/03-EVENT-CONTRACT.md
    - packages-user/data-state/src/event/event.test.ts
  modified:
    - packages-user/data-state/src/event/types.ts
    - packages-user/data-state/src/event/map.ts
    - packages-user/data-state/src/event/hero.ts
    - packages-user/data-state/src/event/event.ts
    - packages-user/data-state/src/event/index.ts
    - packages-user/data-system/src/event/system.ts
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/src/index.ts

key-decisions:
  - "The checkpoint confirmation records exactly eight built-ins and no legacy event catalog expansion."
  - "Event parameters use the existing movement and map APIs; invalid targets safely return void."
  - "Temporary insertion executes existing event ids through the current executor without mutating the event store, with a bounded nested-insertion guard."

patterns-established:
  - "Built-in registration remains module-owned while CoreState owns final assembly order."
  - "Long-running map, hero, delete, touch, and temporary-event actions await their completion Promise."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "The eight approved event built-in names, fields, safe-failure behavior, awaited boundaries, and registration seam are recorded in the confirmed event contract."
    requirement: DATA-01
    verification:
      - kind: other
        ref: "contract token/marker verification for .planning/phases/03-data-completion/03-EVENT-CONTRACT.md"
        status: pass
    human_judgment: false
  - id: D2
    description: "Map set, dynamic transfer/move/static safe handling, delete, hero sequence/forward movement, front onTouch, and temporary event sequence/id insertion have explicit fixture coverage."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/event/event.test.ts#event built-ins"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run packages-user/data-state/src/event/event.test.ts packages-user/data-system/src/event/eventDispatch.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "CoreState assembles exactly the eight stable AnonTokyo built-ins through the data-state event module."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "Node event registration probe via pnpm exec tsx"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run packages-user/data-state/src/event/event.test.ts packages-user/data-system/src/event/eventDispatch.test.ts"
        status: pass
    human_judgment: false

duration: 8 min
completed: 2026-09-10
status: complete
---

# Phase 3 Plan 2 Summary

**Eight confirmed AnonTokyo event built-ins with awaited map/hero/event behavior, safe no-op failure handling, and explicit Node fixtures**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-10T08:17:00Z
- **Completed:** 2026-09-10T08:25:39Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Recorded the user-confirmed eight-function event contract, including independent fields,
  `(param, env)`, `IBlockEventEnv`, safe `void` failure, await boundaries, and registration seam
- Implemented map set/move/delete, hero sequence/forward, front `onTouch`, and temporary event
  sequence/id built-ins with target validation and bounded nested insertion
- Added stable AnonTokyo registration through `GameEventSystem` and `CoreState`, plus eight
  explicit fixture-backed behavior tests

## Task Commits

Each task was committed atomically:

1. **Task 1: 固化八个 event built-in 的参数字段与注册语义** - `e9e89fd` (docs)
2. **Task 2: 实现最小 event built-ins、默认注册项与行为测试** - `3134537` (feat)

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `.planning/phases/03-data-completion/03-EVENT-CONTRACT.md` - confirmed eight-function event contract
- `packages-user/data-state/src/event/types.ts` - independent parameter interfaces and stable names
- `packages-user/data-state/src/event/map.ts` - map set, dynamic move/static conversion, and delete
- `packages-user/data-state/src/event/hero.ts` - hero sequence and forward-step movement
- `packages-user/data-state/src/event/event.ts` - front touch and temporary event execution
- `packages-user/data-state/src/event/index.ts` - parameter adapters and default registration items
- `packages-user/data-state/src/event/event.test.ts` - explicit Node-safe behavior fixtures
- `packages-user/data-system/src/event/system.ts` - AnonTokyo built-in injection seam
- `packages-user/data-state/src/core.ts` - top-level registration assembly
- `packages-user/data-state/src/index.ts` - public data-state event barrel export

## Decisions Made

- Kept the approved scope to exactly eight names; no legacy event catalog was registered
- Reused `ObjectMoveStep`, map layer transfer/delete, hero mover, and `EventExecutor` APIs rather
  than introducing parallel movement or event abstractions
- Temporary event insertion reuses existing event-store ids and executor ordering without storing
  inserted events permanently

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Exposed the event module through the public data-state barrel**

- **Found during:** Task 2 acceptance review
- **Issue:** The plan required all eight functions to be consumable from the data-state barrel,
  but `packages-user/data-state/src/index.ts` did not export `./event`
- **Fix:** Added the event barrel export without copying implementations into `CoreState`
- **Files modified:** `packages-user/data-state/src/index.ts`
- **Verification:** Vitest registration test and Node registration probe passed
- **Committed in:** `3134537`

---

**Total deviations:** 1 auto-fixed (1 Rule 2 missing critical functionality)
**Impact on plan:** The deviation closes the declared public-consumption acceptance criterion and
does not expand the approved event scope.

## Issues Encountered

- The repository-wide `pnpm check:type` remains non-zero on pre-existing client/legacy diagnostics;
  no diagnostics were reported in the changed event, CoreState, or GameEventSystem files. The
  focused data-side type check for changed files passed.
- Existing test fixtures emit expected logger warnings for intentionally missing event ids and an
  unknown tile; all focused and full data-suite assertions passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 03-03 can consume the stable event registration seam and awaited built-in behavior
- 03-04 can use the confirmed event ids and Node-safe CoreState registration in its replay fixture
- Phase 3 remains incomplete overall until its later replay, closure, and type/circular plans finish

---

*Phase: 03-data-completion*
*Completed: 2026-09-10*

## Self-Check: PASSED

- Contract file exists and contains all eight names with required contract tokens
- Task commits `e9e89fd` and `3134537` are present in git history
- Focused event tests, event dispatch regression tests, full four-package data suite, lint, and
  Node registration probe passed
