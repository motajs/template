---
phase: 01-event
plan: 13
subsystem: event
tags: [typescript, map, point-events, tile-events, vitest]

requires:
  - phase: 01-event
    provides: Source-aware event dispatch, raw map event loading, and tile event persistence
provides:
  - LayerEventView-owned reference snapshots with O(1) dirty reads
  - Flat MapLayer point-event storage with ref-first save overlay loading
  - Shared MapTileBase default-event restoration and regression coverage
affects: [event, map, save-load, resize]

actuals:
  tokens: 5379
  tasks: 3
  commits: 1
plan_head_before: a297311ea60082fd4c2f1454e1c6bee0286356be

tech-stack:
  added: []
  patterns:
    - LayerEventView maintains a mismatch count so dirty() is a flag read
    - MapLayer stores point events by serialized flat index and composes ref plus save overlay
    - MapTileBase owns protected default-event restoration for static and dynamic tiles

key-files:
  created:
    - packages-user/data-base/src/map/eventView.test.ts
    - .planning/phases/01-event/01-13-PLAN.md
  modified:
    - packages-user/data-base/src/map/eventView.ts
    - packages-user/data-base/src/map/mapLayer.ts
    - packages-user/data-base/src/map/tile.ts
    - packages-user/data-base/src/map/staticTile.ts
    - packages-user/data-base/src/map/dynamicTile.ts
    - packages-user/data-base/src/map/mapLifecycle.test.ts
    - packages-user/data-base/src/map/eventPath.test.ts
    - packages-user/data-system/src/event/eventDispatch.test.ts

key-decisions:
  - "Point-event references remain exclusively in LayerEventView; MapLayer has no second baseline collection."
  - "MapLayer load restores each view from ref() without markPure(), then applies copied save overlays."
  - "The native getOrInsertComputed path is used when available with a compatibility fallback for the repository's supported Node runtime."
  - "The two pre-existing user edits in types.ts and executor.ts remain untouched and unstaged."

patterns-established:
  - "Flat point-event index keys are reindexed during resize before new dimensions are exposed."
  - "Tile subclasses call one shared protected restoration path and cache repeated tileEvent() access locally."

requirements-completed: [EVENT-REF-01]

coverage:
  - id: D1
    description: "LayerEventView owns stable refs and maintains O(1) dirty state across mutation and restoration."
    requirement: EVENT-REF-01
    verification:
      - kind: unit
        ref: packages-user/data-base/src/map/eventView.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "MapLayer flat point-event save/load, ref reset, resize reindexing, crop, and resize2 clearing are covered."
    requirement: EVENT-REF-01
    verification:
      - kind: unit
        ref: packages-user/data-base/src/map/mapLifecycle.test.ts
        status: pass
      - kind: unit
        ref: packages-user/data-base/src/map/eventPath.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: "Static and dynamic tile default restoration and source-aware dispatch regressions remain green."
    requirement: EVENT-REF-01
    verification:
      - kind: unit
        ref: packages-user/data-system/src/event/eventDispatch.test.ts
        status: pass
      - kind: other
        ref: "pnpm lint:custom [all Plan 01-13 implementation/test files]"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-09-09
status: complete
---

# Phase 01 Plan 13 Summary

**Point-event references are now view-owned with flat index persistence, ref-first load composition, shared tile defaults, and focused dispatch/lifecycle regressions.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-09T04:20:00Z
- **Completed:** 2026-09-09T04:50:25Z
- **Tasks:** 3
- **Files modified:** 11 implementation/test/planning files, plus required planning metadata

## Accomplishments

- Added private LayerEventView references, stable ref(), and mutation-maintained O(1) dirty state
- Replaced nested MapLayer point-event storage and baseline tracking with flat index-to-view storage, ref restoration, copied save overlays, and resize reindexing
- Centralized static/dynamic tile default restoration in MapTileBase and extended lifecycle, raw-reference, and source-aware dispatch regression tests
- Preserved the approved save shape, resize/resize2 behavior, locked event-system deferrals, and both user-owned edits

## Task Commits

The user required exactly one final commit for this plan, so Tasks 1–3 are represented by the single scoped final commit:

1. **Task 1: Trace point-event reference ownership through save and load** — included in the final scoped commit
2. **Task 2: Centralize tile defaults and finish map lifecycle edge cases** — included in the final scoped commit
3. **Task 3: Lock dispatch regressions and create the final scoped commit** — included in the final scoped commit

The final commit message is exactly `refactor(event): centralize point event references`.

## Files Created/Modified

- `packages-user/data-base/src/map/eventView.ts` - View-owned reference snapshot and O(1) dirty bookkeeping
- `packages-user/data-base/src/map/mapLayer.ts` - Flat point-event storage, ref-first load, save overlays, and resize handling
- `packages-user/data-base/src/map/tile.ts` - Shared protected default-event restoration
- `packages-user/data-base/src/map/staticTile.ts` - Shared restoration and cached event-view usage
- `packages-user/data-base/src/map/dynamicTile.ts` - Shared restoration and cached event-view usage
- `packages-user/data-base/src/map/eventView.test.ts` - Focused dirty/ref regression coverage
- `packages-user/data-base/src/map/mapLifecycle.test.ts` - Load, save, resize, crop, and tile-default coverage
- `packages-user/data-base/src/map/eventPath.test.ts` - Raw point-event reference coverage
- `packages-user/data-system/src/event/eventDispatch.test.ts` - Source metadata dispatch assertions
- `.planning/phases/01-event/01-13-PLAN.md` - Executed plan retained for traceability

## Decisions Made

- Point-event reference state is owned only by LayerEventView; MapLayer no longer captures a second baseline.
- Loading copies ref() into existing views before applying save entries and never calls markPure() from MapLayer load paths.
- Flat indexes are reindexed from old dimensions during resize so in-range coordinates survive width changes.
- Runtime support for environments without Map.prototype.getOrInsertComputed uses a local compatibility fallback without changing the storage contract.
- `packages-user/data-base/src/map/types.ts` and `packages-user/data-system/src/event/executor.ts` were hash-verified unchanged and remain unstaged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Runtime compatibility] Added a fallback for unavailable `Map.getOrInsertComputed`**

- **Found during:** Task 1 focused Vitest run
- **Issue:** The repository's current Node/Vitest runtime does not expose `Map.prototype.getOrInsertComputed`, although the project targets the API and uses it where available.
- **Fix:** Retained the getOrInsertComputed path and added a local get/set fallback for MapLayer event creation.
- **Files modified:** `packages-user/data-base/src/map/mapLayer.ts`
- **Verification:** Focused lifecycle tests and the complete focused suite pass.

**2. [Rule 3 - Test setup] Added the existing replay-checking global setup to the new event-view test**

- **Found during:** Task 1 focused Vitest run
- **Issue:** Importing LayerEventView directly initializes the shared logger, which requires the test suite's `main` and `location` globals.
- **Fix:** Added the same `vi.hoisted` globals used by the adjacent map tests.
- **Files modified:** `packages-user/data-base/src/map/eventView.test.ts`
- **Verification:** The event-view test passes.

---

**Total deviations:** 2 auto-fixed (Rule 1: 1, Rule 3: 1)
**Impact on plan:** Both fixes were local compatibility/test-infrastructure corrections and did not expand the approved architecture or public API.

## Issues Encountered

- `pnpm check:type` was run as required but remains red only for pre-existing diagnostics outside the plan-owned files. The exact scope is recorded in `.planning/phases/01-event/deferred-items.md`; no diagnostics were reported in the changed implementation or test files.
- Focused Vitest runs emit existing logger warnings for duplicate priorities and missing fixture event IDs; all focused assertions pass.

## Verification

- `pnpm exec vitest run packages-user/data-base/src/map/eventView.test.ts packages-user/data-base/src/map/mapLifecycle.test.ts` — PASS (7 tests)
- `pnpm exec vitest run packages-user/data-base/src/map/mapLifecycle.test.ts packages-user/data-base/src/map/eventPath.test.ts` — PASS (14 tests)
- Complete focused Vitest suite across all four plan test files — PASS (22 tests)
- Grounded `pnpm lint:custom ...` command — PASS
- `git diff --check` for all plan-owned implementation/test paths — PASS
- `pnpm check:type` — deferred repository-wide diagnostics only; documented above

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The event reference/storage refactor is ready for phase verification. The repository-wide type gate remains blocked by the pre-existing legacy/client diagnostics documented in the phase deferred-items ledger.

## Self-Check: PASSED

- All listed implementation, test, plan, summary, and deferred-item files exist
- The pre-existing `types.ts` and `executor.ts` hashes match their start-of-plan hashes
- The final scoped commit is prepared to contain one commit for all three tasks
