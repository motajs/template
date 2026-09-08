---
phase: 01-event
plan: 10
subsystem: map-event-lifecycle
tags: [typescript, vitest, map, events, persistence, dirty-tracking]
requires:
  - phase: 01-event/01-04
    provides: User-approved pointEvents persistence and resize contract
  - phase: 01-event/01-06
    provides: Validated raw event views and event-layer map construction
provides:
  - Raw tile default event baselines for static and dynamic tiles
  - Stable copied tile and point-event save snapshots
  - Point-event dirty/save/load/reset/resize lifecycle on MapLayer
  - Conversion and dynamic movement behavior preserving coordinate-owned point events
affects: [01-07, 01-09, phase-01-verification]
actuals:
  tokens: 6443
  tasks: 2
  commits: 2
  plan_head_before: a35e1e116d3447a765b17115d523b860d4415974
tech-stack:
  added: []
  patterns:
    - Tile event views rebuild from raw defaults before applying runtime overlays
    - Point-event saves use coordinate-indexed copied Maps and restore pure baselines before overlays
key-files:
  created:
    - packages-user/data-base/src/map/mapLifecycle.test.ts
  modified:
    - packages-user/data-base/src/map/types.ts
    - packages-user/data-base/src/map/staticTile.ts
    - packages-user/data-base/src/map/dynamicTile.ts
    - packages-user/data-base/src/map/mapLayer.ts
key-decisions:
  - "Static and dynamic tile defaults are reconstructed locally after construction and set; abstract base construction remains free of abstract raw() calls."
  - "Normal resize preserves and crops point events while resize2 clears them, exactly following the 01-04 decision record."
  - "Map-level save aggregation and production serialized-event registration remain deferred to the user's later revised 01-09 scope."
patterns-established:
  - "A saved dirty event Map is copied so subsequent runtime edits cannot mutate historical snapshots."
  - "Point events remain attached to coordinates independently of dynamic tile position indexes."
requirements-completed: [EVT-01, EVT-02, EVT-03]
coverage:
  - id: D1
    description: "Static/dynamic raw defaults, pure dynamic round trips, copied snapshots, conversion flags, and coordinate-bound movement are verified."
    requirement: EVT-03
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLifecycle.test.ts#tile defaults snapshots conversion and movement"
        status: pass
    human_judgment: false
  - id: D2
    description: "Point-event dirty transitions, all three compression save/load paths, baseline restoration, and resize semantics are verified."
    requirement: EVT-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLifecycle.test.ts#point event lifecycle"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLifecycle.test.ts#resize preserves in-range point events and resize2 clears them"
        status: pass
    human_judgment: false
duration: 25min
completed: 2026-09-09
status: complete
commits: 2
plan_head_before: a35e1e116d3447a765b17115d523b860d4415974
---

# Phase 01 Plan 10: Map Event Lifecycle Summary

**Raw tile defaults, immutable event snapshots, and coordinate-owned point-event persistence across conversion, loading, and resize**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-08T15:54:23Z
- **Completed:** 2026-09-09
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Static and dynamic tiles now rebuild default event ids from `ITileRawData.events` during construction, `set`, load, and static/dynamic conversion.
- Tile and point-event saves copy their Maps, preserving historical snapshots while runtime views continue to change.
- `MapLayer` now tracks point-event dirty state, saves independent coordinate-indexed snapshots for all compression levels, restores raw baselines before overlays, crops point events on `resize`, and clears them on `resize2`.
- Added behavior tests covering tile defaults, dynamic save round trips, conversion flags, actual dynamic movement, point-event state transitions, compression paths, and resize semantics.

## Task Commits

Each task was committed atomically:

1. **Task 1: 恢复图块默认事件、稳定快照与转换后移动不变量** - `bcfa1f9` (fix)
2. **Task 2: 按用户批准契约补齐点事件 dirty/save/load/reset/resize** - `d3eeb1e` (feat)

**Plan metadata:** pending state/summary commit

## Files Created/Modified

- `packages-user/data-base/src/map/staticTile.ts` - Restores raw tile defaults and copies dirty event snapshots.
- `packages-user/data-base/src/map/dynamicTile.ts` - Restores defaults on construction/set/load and preserves raw dirty baselines for overlays.
- `packages-user/data-base/src/map/mapLayer.ts` - Handles point-event baselines, lifecycle save/load, conversion defaults, movement independence, and resize semantics.
- `packages-user/data-base/src/map/types.ts` - Adds the approved nested `pointEvents` save field and documents resize behavior.
- `packages-user/data-base/src/map/mapLifecycle.test.ts` - Provides the lifecycle behavior matrix.

## Decisions Made

- Kept point-event persistence at the layer level using `index -> priority -> eventId`, independent from the map matrix dirty flag.
- Restored the user's exact resize decision: `resize` preserves/crops existing content and point events; `resize2` clears them.
- Did not implement map-level save aggregation or production event registration; those remain deferred to the revised 01-09 scope rather than being guessed here.

## Deviations from Plan

None - plan implementation stayed within the approved lifecycle contract. The pre-existing `GameMap` change remains unstaged and was not modified by this plan.

## Issues Encountered

- The test fixture initially exposed duplicate-priority logger calls and missing Node `location`; the fixture now stubs the browser global required by the existing logger, while the duplicate warning remains expected behavior.
- Full-project type/circular/lint debt remains outside this plan's focused verification scope.

## Known Stubs

None found in files created or modified by this plan.

## User Setup Required

None - no external service configuration required.

## Deferred Work

- Map-level save aggregation for layers containing only point events remains intentionally deferred with 01-09 Task 2 until a revised plan can safely isolate it without serialized-event registration.
- Production serialized-event registration remains deferred by the user's approved Phase 01 decision.

## Next Phase Readiness

- Plan 01-07 can use the complete point/tile source views and lifecycle state without changing the approved persistence field.
- The deferred 01-09 work must not infer a production registration API or assume map-level point-event aggregation is complete.

---
*Phase: 01-event*
*Completed: 2026-09-09*

## Self-Check: PASSED

- All five planned files and this summary exist.
- Task commits `bcfa1f9` and `d3eeb1e` are present in git history.
- Focused Vitest and ESLint verification passed; unrelated working-tree changes remain unstaged.
