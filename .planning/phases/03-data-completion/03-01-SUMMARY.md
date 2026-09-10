---
phase: 03-data-completion
plan: 01
subsystem: data-state
tags: [node, replay, core-state, memory-save, legacy-boundary, vitest]

requires:
  - phase: 02-pathfinding
    provides: awaited hero mover and source-aware movement integration path
provides:
  - Node-safe no-argument CoreState factory with independent memory-backed instances
  - Internal legacy converter/data-source boundary with browser compatibility loading
  - Fixed closed-loop replay fixture covering movement, event execution, map mutation, and normal replay end
affects: [03-02, 03-03, 03-04, 03-05, 03-06]

actuals:
  tokens: 7872
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Internal host-detection boundary selects MemorySaveSystem for Node and preserves SaveSystem for browser/legacy hosts
    - Focused replay tests use a private direct ReplaySystem harness and explicit state/map/event fixtures

key-files:
  created:
    - packages-user/data-common/src/save/memory.ts
    - packages-user/data-state/src/legacy/dependencies.ts
    - packages-user/data-state/test/fixtures/closed-loop.ts
    - packages-user/data-state/test/nodeTracer.test.ts
    - .planning/phases/03-data-completion/deferred-items.md
  modified:
    - packages/common/src/logger.ts
    - packages-user/data-base/src/game.ts
    - packages-user/data-base/src/hero/mover.ts
    - packages-user/data-base/src/map/mapLayer.ts
    - packages-user/data-common/src/replay/sandbox.ts
    - packages-user/data-common/src/save/index.ts
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/src/enemy/calculator.ts
    - packages-user/data-state/src/legacy/move.ts

key-decisions:
  - "createCoreState() remains parameterless and directly returns new CoreState(); Node composition is selected internally rather than through factory options."
  - "CoreState consumes the internal legacy dependency boundary only; the Node branch skips legacy loading and IndexedDB initialization."
  - "The tracer owns a private direct ReplaySystem harness until later top-level replay registration plans assemble the public compatibility path."

requirements-completed: []

coverage:
  - id: D1
    description: "Node imports CoreState without browser globals and creates two independent MemorySaveSystem-backed instances."
    verification:
      - kind: other
        ref: "pnpm exec tsx -e import createCoreState; create two instances and assert identity/save backend"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fixed replay fixture performs a real rightward hero move, awaits the event, mutates the event-layer matrix, and reaches ended state."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/test/nodeTracer.test.ts#replays movement, awaits event mutation, and ends normally"
        status: pass
      - kind: unit
        ref: "pnpm exec vitest run packages-user/data-state/test/nodeTracer.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "The existing four-package data test suite remains green after the Node-safe composition and replay fixes."
    verification:
      - kind: integration
        ref: "pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state"
        status: pass
    human_judgment: false

duration: 19 min
completed: 2026-09-10
status: complete
---

# Phase 3 Plan 1 Summary

**Node-safe four-layer state construction with injected legacy boundaries and an awaited replay movement/event/map tracer**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-10T15:27:00+08:00
- **Completed:** 2026-09-10T15:46:21+08:00
- **Tasks:** 2
- **Files modified:** 13 implementation/test files, plus planning ledgers

## Accomplishments

- Guarded logger and game-loading module evaluation against missing `main`, `window`, `document`, and `location` globals
- Added `MemorySaveSystem`, parameterless `createCoreState()`, independent Node-safe construction, and centralized legacy dependency injection
- Removed the enemy calculator singleton edge and legacy movement barrel edge without reintroducing a data-state singleton into the Node path
- Added a fixed three-cell map tracer that awaits hero movement and source-aware enter-event mutation before replay completion
- Removed two Node blockers: nonstandard `Map.getOrInsertComputed` use in the event path and the replay sandbox play-loop state guard

## Task Commits

Each task was committed atomically:

1. **Task 1: singleton back-edge 修复与 Node-safe CoreState construction tracer** - `a707be4` (feat)
2. **Task 2: Node-safe CoreState 与最小 replay→move→event→map tracer** - `4eec086` (feat)

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `packages-user/data-common/src/save/memory.ts` - in-memory save/global storage adapter that does not instantiate Dexie
- `packages-user/data-state/src/legacy/dependencies.ts` - internal host-aware legacy converter and loading boundary
- `packages-user/data-state/src/core.ts` - no-options factory and dependency-driven four-layer constructor
- `packages-user/data-state/test/fixtures/closed-loop.ts` - fixed map, event, and direct replay fixture
- `packages-user/data-state/test/nodeTracer.test.ts` - focused Node construction and replay closure tests with Chinese `it` comments
- `packages/common/src/logger.ts`, `packages-user/data-base/src/game.ts` - Node-safe global guards
- `packages-user/data-base/src/map/mapLayer.ts`, `packages-user/data-common/src/replay/sandbox.ts` - runtime fixes required by the tracer

## Decisions Made

- Kept the public factory contract parameterless; host selection and legacy injection remain internal to the constructor boundary
- Kept the compatibility singleton available through the existing barrel while direct Node tests import `src/core.ts`
- Used the existing `DefaultHeroMoveTopImpl`, `EventExecutor`, and `ReplaySandbox` instead of creating a parallel movement or event engine

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoided reading an uninitialized hero mover during construction**
- **Found during:** Task 1
- **Issue:** `HeroLocation` constructs `HeroMover` before assigning `location.mover`, while the mover constructor read `tile.getCurrentFaceDirection()` and crashed in Node
- **Fix:** Initialize the base mover with `FaceDirection.Unknown`; the location constructor applies the requested initial direction immediately afterward
- **Files modified:** `packages-user/data-base/src/hero/mover.ts`
- **Verification:** Node factory probe and focused tracer pass
- **Committed in:** `a707be4`

**2. [Rule 3 - Blocking] Removed the event-layer dependency on a nonstandard Map prototype extension**
- **Found during:** Task 2 tracer execution
- **Issue:** The real movement path called `Map.getOrInsertComputed`, which is absent in a clean Node process and stalled the movement Promise
- **Fix:** Replaced it with explicit `Map.get`/`Map.set` construction
- **Files modified:** `packages-user/data-base/src/map/mapLayer.ts`
- **Verification:** Focused tracer and full four-package data suite pass without a global Map shim
- **Committed in:** `4eec086`

**3. [Rule 1 - Bug] Allowed ReplaySandbox.play() to execute its command loop**
- **Found during:** Task 2 tracer execution
- **Issue:** `ReplaySandbox.play()` sets `pausing` false, but `step()` rejected every step while not paused, so replay never reached `ended`
- **Fix:** `step()` now rejects only inactive or already-ended sandboxes, preserving paused single-step behavior while allowing the play loop
- **Files modified:** `packages-user/data-common/src/replay/sandbox.ts`
- **Verification:** Replay tracer reaches normal end after the awaited movement/event Promise; full data suite passes
- **Committed in:** `4eec086`

---

**Total deviations:** 3 auto-fixed (1 Rule 1 bug, 1 Rule 3 blocking issue, 1 Rule 1 replay bug)
**Impact on plan:** All fixes were direct blockers for the requested Node/replay vertical tracer; no new public interface or package dependency was introduced.

## Known Stubs

- `packages-user/data-common/src/save/memory.ts:90` — `saveAutosaveToDB()` is intentionally a no-op in the Node adapter because the Node path must not persist to IndexedDB; recorded in `.planning/WINDOWS.md`.
- `packages-user/data-state/src/legacy/dependencies.ts:51` — the Node boundary intentionally registers no browser loading callback; recorded in `.planning/WINDOWS.md`.
- `packages-user/data-state/src/core.ts:156` — serialized external event registration remains the existing deferred TODO for later Phase 3 assembly; recorded in `.planning/WINDOWS.md`.

## Issues Encountered

- `pnpm check:type` remains non-zero on pre-existing render/legacy diagnostics and the user-owned Tile events contract mismatch (`TileStore`/`TileLegacyBridge` still use the old `trigger` shape). No new diagnostics were reported in the new fixture/test files or the memory/dependency boundary files. The issue is logged in `deferred-items.md` and `.planning/WINDOWS.md` for the later tile-events/type closure plan.

## Verification

- PASS: `pnpm exec vitest run packages-user/data-state/test/nodeTracer.test.ts` — 2 tests
- PASS: `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` — 11 files, 60 tests
- PASS: exact canonical madge back-edge check for `enemy/calculator.ts -> ins.ts` and `legacy/move.ts -> index.ts`
- PASS: direct Node factory probe creates two distinct `MemorySaveSystem`-backed states
- DEFERRED: repository-wide `pnpm check:type`, due only to pre-existing render/legacy and Tile contract diagnostics

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The next replay/event plans can consume a direct Node-safe `CoreState` and fixed fixture without browser globals or IndexedDB.
- Top-level replay enum/registration and event built-ins remain intentionally delegated to the subsequent Phase 3 plans.
- The repository-wide type gate remains deferred as documented; the focused Node tracer and all current data-package tests are green.

---
*Phase: 03-data-completion*
*Completed: 2026-09-10*

## Self-Check: PASSED

- Summary and all declared created artifacts exist on disk
- Task commits `a707be4` and `4eec086` are present in git history
- Focused tracer and full data-package test suite passed
