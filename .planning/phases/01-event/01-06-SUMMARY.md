---
phase: 01-event
plan: 06
subsystem: event-map-ingestion
tags: [typescript, vitest, map, events, validation]
requires:
  - phase: 01-event/01-04
    provides: User-approved point-event ownership and event-layer contract
provides:
  - Validated raw map event ingestion into coordinate point-event views
  - Event-layer selection by the `event` layer alias
  - Malformed raw-input rejection before map registration with logger codes 62/63/64
affects: [01-07, 01-09, 01-10, phase-01-verification]
actuals:
  tokens: 4648
  tasks: 2
  commits: 3
  plan_head_before: 6f6ed62b1b401a8e1d51207ba7b08c8e7935dfb2
tech-stack:
  added: []
  patterns:
    - Runtime validation completes before `createMap` so malformed input cannot leave partial registration
    - Serialized coordinate events are loaded into `ILayerEventView` and marked pure
key-files:
  created:
    - packages-user/data-base/src/map/eventPath.test.ts
  modified:
    - packages-user/data-base/src/map/mapState.ts
    - packages-user/data-base/src/map/mapLayer.ts
    - packages/common/src/logger.json
key-decisions:
  - "Raw point events remain coordinate-owned and are never written into a static tile event view."
  - "Malformed map/event containers, ranges, and leaf values are rejected before map registration; codes 62, 63, and 64 retain distinct meanings."
patterns-established:
  - "Dynamic and point-event indexes use explicit Map lookup/insertion rather than unsupported runtime upsert methods."
requirements-completed: [EVT-01, EVT-02, EVT-03]
coverage:
  - id: D1
    description: "Valid serialized point events populate the event layer's coordinate view and leave tile events clean."
    requirement: EVT-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/eventPath.test.ts#raw point events and event layer"
        status: pass
    human_judgment: false
  - id: D2
    description: "Malformed raw map/event structures are rejected without registering a floor and use semantic logger codes."
    requirement: EVT-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/eventPath.test.ts#MapState malformed raw event structures"
        status: pass
    human_judgment: false
duration: 20min
completed: 2026-09-08
status: complete
commits: 3
plan_head_before: 6f6ed62b1b401a8e1d51207ba7b08c8e7935dfb2
---

# Phase 01 Plan 06: Raw Map Event Ingestion Summary

**Validated serialized map event ingestion with coordinate-bound point views, event-layer selection, and no-partial-registration guarantees**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-08T15:39:21Z
- **Completed:** 2026-09-08
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Connected `MapState.fromRaw` to the coordinate point-event view and selected the actual event layer by alias.
- Added pre-registration runtime validation for raw map/event containers, numeric keys, positions, priorities, and string event ids.
- Added focused Vitest coverage for valid ingestion, pure baselines, malformed input, semantic logger codes, and no half-registered floor.

## Task Commits

Each task was committed atomically:

1. **Task 1: 贯通 raw map → point event view → eventLayer 的真实地图路径** - `564ef25` (fix)
2. **Task 2: 在地图注册前拒绝 malformed raw event 结构** - `a730f33` (fix)
3. **Task 2 blocking runtime fix: replace unsupported Map upsert calls** - `974669b` (fix)

**Plan metadata:** pending state/summary commit

## Files Created/Modified

- `packages-user/data-base/src/map/mapState.ts` - Validates raw structures before registration and binds point events to coordinate views.
- `packages-user/data-base/src/map/eventPath.test.ts` - Covers valid point ingestion and malformed raw rejection.
- `packages/common/src/logger.json` - Adds code 63 for invalid containers and code 64 for invalid leaf/range values.
- `packages-user/data-base/src/map/mapLayer.ts` - Replaces unsupported Map upsert calls with explicit lookup/insertion required by the Node test path.

## Decisions Made

- Kept point-event ownership in the coordinate view and did not bind serialized point ids to static tile views.
- Kept event registration and event-store population deferred; this plan only establishes the map-side event-layer path.
- Used code 62 only for non-numeric keys, code 63 for missing/null/non-object containers, and code 64 for invalid leaf values or ranges.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced unsupported Map upsert runtime calls**
- **Found during:** Task 1 verification
- **Issue:** The Node Vitest runtime did not provide the `Map.prototype.getOrInsertComputed`/`getOrInsert` methods used by the point and dynamic indexes, so valid raw ingestion crashed before assertions.
- **Fix:** Replaced the affected `MapLayer` upsert calls with explicit get/create/set logic, including the dynamic save aggregation path in the same file.
- **Files modified:** `packages-user/data-base/src/map/mapLayer.ts`
- **Verification:** Focused Vitest and ESLint pass.
- **Committed in:** `974669b`

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** The fix was limited to the directly blocking runtime behavior and introduced no public API change.

## Issues Encountered

- Focused tests initially exposed the unsupported Map upsert runtime dependency; it was fixed inline before the plan verification was rerun.
- Repository-wide type, circular-dependency, and unrelated lint debt remains outside this plan's scope and was not changed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-10 can build on the validated layer and point-event views for tile defaults and lifecycle persistence.
- CoreState's legacy event-layer initialization and production serialized-event registration remain deferred to the user's later revised 01-09 decision.

---
*Phase: 01-event*
*Completed: 2026-09-08*

## Self-Check: PASSED

- All planned implementation/test files and this summary exist.
- Task commits `564ef25`, `a730f33`, and `974669b` are present in git history.
- Focused Vitest and ESLint verification passed; unrelated working-tree changes remain unstaged.
