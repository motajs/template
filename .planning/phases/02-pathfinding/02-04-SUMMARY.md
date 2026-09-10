---
phase: 02-pathfinding
plan: 04
subsystem: pathfinding
tags: [pathfinding, public-contract, graph, nullable-types, event-sources]

# Dependency graph
requires:
  - phase: 02-pathfinding (plan 03)
    provides: L3 hero pathfinding integration, shared pass predicate, and source-aware movement events
provides:
  - User-owned path contract restored to commit 7a011b2 plus only the two authorized nullable returns
  - Implementation-only graph contracts exported from graph.ts while L2 pathfinding behavior remains intact
  - Nullable-safe static event collection with dynamic event collection and ordering preserved
affects: [02-05, phase-04-rendering, PATH-01]

# Actuals (#2632)
actuals:
  tokens: 2820
  tasks: 2
  commits: 2
plan_head_before: 3809b40b41d919b3ecfa69765ca9f31073237ac9

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "User-owned public contracts remain baseline-faithful; implementation-only graph types stay beside graph construction"
    - "Nullable static map data is narrowed before tile-event access while dynamic sources continue through the same sorted executor path"

key-files:
  created: []
  modified:
    - packages-user/data-system/src/path/types.ts
    - packages-user/data-system/src/path/graph.ts
    - packages-user/data-system/src/path/finder.ts
    - packages-user/data-system/src/path/system.ts
    - packages-user/data-state/src/hero/moverImpl.ts
    - packages-user/data-state/src/path/heroPathfinding.ts
    - .planning/phases/02-pathfinding/deferred-items.md

key-decisions:
  - "D-07 remains authoritative: path/types.ts matches the user baseline except for moveTo and teleportTo nullable returns."
  - "The concrete useMover bridge remains implementation-owned so HeroPathfinding can bind IObjectMover without expanding the user contract."
  - "D-11 remains intact: no client click adapter or Phase 1 file was modified."

patterns-established:
  - "Graph helper interfaces are exported from graph.ts rather than the user-owned contract file."
  - "Static event sources are collected only after a non-null guard; dynamic sources retain their existing priority and executor semantics."

requirements-completed: [PATH-01]

coverage:
  - id: D1
    description: "Restored path/types.ts to the authorized user contract with only nullable moveTo/teleportTo return corrections."
    requirement: PATH-01
    verification:
      - kind: other
        ref: "normalized git comparison against 7a011b2 path/types.ts"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run packages-user/data-system/src/path packages-user/data-state/src/path/heroPathfinding.test.ts (35 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Kept graph/search/hero pathfinding behavior reachable after moving graph helper contracts out of types.ts."
    requirement: PATH-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/path (28 path tests plus performance tests passed)"
        status: pass
      - kind: integration
        ref: "packages-user/data-state/src/path/heroPathfinding.test.ts (7 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Closed the moverImpl nullable static diagnostic without changing dynamic event collection or core event behavior."
    requirement: PATH-01
    verification:
      - kind: other
        ref: "pnpm check:type output contains no moverImpl.ts diagnostic"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/coreEventLayer.test.ts (1 passed)"
        status: pass
      - kind: integration
        ref: "packages-user/data-state/src/path/heroPathfinding.test.ts (7 passed)"
        status: pass
    human_judgment: false

# Metrics
duration: 10 min
completed: 2026-09-10
status: complete
---

# Phase 02 Plan 04: Pathfinding Contract and Type-Gap Closure Summary

**The user-authored path contract is restored, graph helper types are implementation-owned, and nullable static event collection is type-safe without changing pathfinding behavior.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-09-10T01:30:00Z
- **Completed:** 2026-09-10T01:39:49Z
- **Tasks:** 2
- **Files modified:** 6 plan-listed files plus the required compatibility adjustment in `heroPathfinding.ts`

## Accomplishments

- Restored `path/types.ts` to the exact `7a011b2` user baseline with only the authorized `moveTo` and `teleportTo` `| null` corrections
- Relocated `IPathGraphEdge`, `IPathGraphNode`, `IPathGraph`, and `IPathfindingGraphBuilder` to `graph.ts`, preserving L2 search, controller, fallback, and HeroPathfinding integration
- Guarded nullable `loc.static` access in `moverImpl.ts`; dynamic tile events, source ordering, environments, and the single executor call remain unchanged
- Recorded the resolved `moverImpl.ts` TS18047 diagnostic while leaving unrelated repository type/lint baselines open

## Task Commits

Each task was committed atomically:

1. **Task 1: Restore the authorized path contract while preserving the end-to-end path stack** - `a2aedb3` (refactor)
2. **Task 2: Close the nullable static event-source type gap** - `93453db` (fix)

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `packages-user/data-system/src/path/types.ts` - baseline-faithful user-owned path contract
- `packages-user/data-system/src/path/graph.ts` - implementation-owned graph contracts and builder
- `packages-user/data-system/src/path/finder.ts` - graph contract import relocation
- `packages-user/data-system/src/path/system.ts` - public `useMovable` plus implementation-only `useMover` bridge
- `packages-user/data-state/src/hero/moverImpl.ts` - nullable-safe static event-source collection
- `packages-user/data-state/src/path/heroPathfinding.ts` - compatibility implementation of the restored `useMovable` contract
- `.planning/phases/02-pathfinding/deferred-items.md` - TS18047 marked resolved

## Verification Results

- Normalized baseline comparison: **PASS**
- `pnpm exec vitest run "packages-user/data-system/src/path" "packages-user/data-state/src/path/heroPathfinding.test.ts"`: **4 files, 35 tests passed**
- `pnpm exec vitest run "packages-user/data-state/src/coreEventLayer.test.ts"`: **1 test passed**
- Targeted ESLint for all modified TypeScript path/mover files: **0 problems**
- `pnpm check:type`: **repository command exits 2**, but contains no diagnostic for `packages-user/data-state/src/hero/moverImpl.ts`; remaining diagnostics are unrelated client, legacy, TileStore, and pre-existing data-state baseline errors
- No client-side click wiring or Phase 1 file was modified; D-11 remains preserved

## Decisions Made

- D-07 remains authoritative over later implementation convenience: the user-authored contract is not expanded with graph/helper types or `useMover`.
- `useMover` is retained only as a concrete implementation bridge in `PathfindingSystem`; the public user contract continues to expose `useMovable`.
- D-11 remains data-side only; mobile click integration is deferred to Phase 4.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored HeroPathfinding compatibility with the user contract**
- **Found during:** Task 2 type-gate verification after Task 1 restored `useMovable`
- **Issue:** `HeroPathfinding` still implemented the restored `IPathfindingSystem` through its local interface but lacked the newly required `useMovable` method, producing TS2420
- **Fix:** Added a delegating `useMovable` method; the existing implementation-only `useMover` bridge remains unchanged
- **Files modified:** `packages-user/data-state/src/path/heroPathfinding.ts`
- **Verification:** `pnpm check:type` no longer reports the HeroPathfinding contract diagnostic; focused hero integration tests pass
- **Committed in:** `93453db`

**2. [Rule 3 - Blocking] Restored repository-required CRLF/Prettier formatting after edits**
- **Found during:** Task 1 targeted ESLint verification
- **Issue:** Patch tooling wrote LF line endings, and the project Prettier rule reported line-ending and import-format errors
- **Fix:** Ran the existing Prettier formatter on the edited TypeScript files, then re-ran ESLint and the focused tests
- **Files modified:** `packages-user/data-system/src/path/types.ts`, `graph.ts`, `finder.ts`, `system.ts`, `packages-user/data-state/src/hero/moverImpl.ts`, `heroPathfinding.ts`
- **Verification:** Targeted ESLint reports 0 problems; focused tests pass
- **Committed in:** `a2aedb3` and `93453db`

---

**Total deviations:** 2 auto-fixed (2 blocking issues)
**Impact on plan:** Both fixes were required by the restored contract and repository formatting gate; no client-side or Phase 1 scope was added.

## Known Stubs

- `packages-user/data-state/src/hero/moverImpl.ts:284` — `cannotEnter()` remains intentionally empty because the event model has no trigger for movement blocked by an impassable mask. D-08 allowed adjacent no-pass targets use the direct source-aware OnTouch path instead. Recorded in `.planning/WINDOWS.md` entry 6.

## Issues Encountered

- The repository-wide `pnpm check:type` command remains non-zero because of unrelated client, legacy, TileStore, and existing data-state diagnostics. The plan-owned `moverImpl.ts`, path contract, and HeroPathfinding contract diagnostics are clean; the existing phase ledger remains scoped to unrelated baselines.
- Browserslist emitted its existing stale `caniuse-lite` informational notice during Vitest; no package update was performed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02-04 is complete and ready for Plan 02-05's full-suite timeout and CI-command gap closure.
- PATH-01 data-side behavior remains reachable and D-07/D-11 boundaries are preserved.
- The repository-wide type baseline and pre-existing broken-windows entries remain open outside this plan's scope.

---
*Phase: 02-pathfinding*
*Completed: 2026-09-10*

## Self-Check: PASSED

- All listed implementation, ledger, and SUMMARY files exist
- Task commits `a2aedb3` and `93453db` are present in git history
- Normalized contract comparison, focused path/hero tests, core-event test, target ESLint, and the moverImpl type-diagnostic filter passed
- No client-side or unrelated Phase 1 changes were introduced
