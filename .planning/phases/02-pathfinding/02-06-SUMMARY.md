---
phase: 02-pathfinding
plan: 06
type: execute
execution_mode: direct-user-correction
subsystem: pathfinding-structure
tags: [pathfinding, structure, data-common, predicate, scope-correction]

requires:
  - phase: 02-pathfinding
    provides: Existing L2 pathfinding implementation and Phase 2 execution artifacts
provides:
  - Graph contracts and their API documentation restored to data-system/src/path/types.ts
  - Shared DirectionMapper mounted on IDataCommon and consumed from the map state
  - Generic DefaultPassPredicate extracted to predicate.ts
  - Unauthorized HeroPathfinding L3 wrapper, tests, barrel, and CoreState wiring removed
affects: [phase-02 verification, phase-04-rendering]

user_constraints:
  - Graph type declarations and comments belong in types.ts
  - HeroPathfinding is outside the requested Phase 2 scope and must not exist
  - DirectionMapper is a shared DataCommon dependency, not a per-builder instance
  - Pass predicate is generic and is named DefaultPassPredicate

files_modified:
  - .planning/STATE.md
  - .planning/phases/02-pathfinding/02-DISCUSSION-LOG.md
  - packages-user/data-common/src/types.ts
  - packages-user/data-state/src/core.ts
  - packages-user/data-state/src/hero/index.ts
  - packages-user/data-state/src/hero/moverImpl.ts
  - packages-user/data-state/src/hero/predicate.ts
  - packages-user/data-state/src/index.ts
  - packages-user/data-system/src/path/types.ts
  - packages-user/data-system/src/path/graph.ts
  - packages-user/data-system/src/path/finder.ts
  - DataCommon test fixtures using IDataCommon

files_deleted:
  - packages-user/data-state/src/path/heroPathfinding.ts
  - packages-user/data-state/src/path/heroPathfinding.test.ts
  - packages-user/data-state/src/path/index.ts

verification:
  - command: pnpm test:ci
    result: 10 files passed, 58 tests passed
  - command: pnpm exec eslint <changed implementation and fixture files>
    result: pass
  - command: pnpm check:type
    result: repository baseline remains non-zero; no new diagnostic in path, predicate, or IDataCommon changes

status: complete
completed: 2026-09-10
---

# Phase 02 Direct Execution Correction

## Summary

This direct execution followed the user's structural review and intentionally skipped a new Plan phase. The L2 pathfinding contracts remain in `types.ts`, while graph construction now consumes the shared `IDataCommon.directionMapper`. The pass predicate is no longer named or declared as hero-specific and is implemented in `hero/predicate.ts` through the `DefaultPassPredicate` interface.

The previously added `HeroPathfinding` L3 wrapper was outside the requested scope. Its implementation, integration tests, barrel, and `CoreState` exposure were removed. Historical 02-03/02-05 artifacts describe the earlier implementation and are not evidence that the deleted wrapper remains in the codebase; the phase verification artifact must be regenerated against this corrected scope.

## Verification Notes

- `pnpm test:ci` passed with 10 test files and 58 tests.
- Targeted ESLint passed with no problems.
- `pnpm check:type` remains blocked by pre-existing repository diagnostics in client/legacy/TileStore areas; the changed path and predicate code introduced no reported diagnostics.
