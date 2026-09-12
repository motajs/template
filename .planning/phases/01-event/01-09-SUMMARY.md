---
phase: 01-event
plan: 09
subsystem: map-event-persistence
tags: [typescript, vitest, map, events, persistence, compression]
requires:
  - phase: 01-event/01-04
    provides: Approved pointEvents index -> priority -> eventId persistence contract and registration deferral
  - phase: 01-event/01-10
    provides: MapLayer point-event dirty/save lifecycle
provides:
  - GameMap retention of layers whose only saved content is pointEvents
  - LowCompression and HighCompression point-event-only aggregation regression coverage
affects: [phase-01-verification]
actuals:
  tokens: 732
  tasks: 2
  commits: 3
plan_head_before: cb9934343ab1182d714ef9467a4fe0f15c240407
tech-stack:
  added: []
  patterns:
    - Map-level save retention is driven by every non-empty serialized field, including pointEvents
    - Compression-specific aggregation tests use a zero matrix and dirty point-event view without production registration
key-files:
  created: []
  modified:
    - packages-user/data-base/src/map/gameMap.ts
    - packages-user/data-base/src/map/mapLifecycle.test.ts
key-decisions:
  - "A non-empty pointEvents map is valid layer save content even when fullMap, rows, staticBlocks, and dynamicBlocks are empty."
  - "LowCompression and HighCompression share one independent point-event-only fixture; production registration and map-id binding remain deferred."
patterns-established:
  - "Point-event persistence is asserted as index -> priority -> eventId without serializing event bodies."
requirements-completed: [EVT-01]
coverage:
  - id: D1
    description: "GameMap preserves a layer containing only a dirty point event and keeps its z-index and nested event-id save shape."
    requirement: EVT-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLifecycle.test.ts#map saves layers containing only point events"
        status: pass
    human_judgment: false
duration: 8min
completed: 2026-09-09
status: complete
---

# Phase 01 Plan 09: GameMap Point-Event Aggregation Summary

**GameMap now retains point-event-only layer saves across LowCompression and HighCompression using the approved index-priority-eventId contract**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-09T10:19:00Z
- **Completed:** 2026-09-09
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added the missing `pointEvents` non-empty check to `GameMap.isEmptyLayerSave`.
- Added a real map-level regression using a zero matrix and a dirty point event, proving the layer is retained by `GameMap.saveState`.
- Covered both LowCompression and HighCompression while asserting z-index retention and `index -> priority -> eventId` nesting.
- Kept the fixture independent of serialized production registration, map-id binding, eventStore, CoreState, and rawEvent changes.

## Task Commits

1. **Task 1: 贯通 dirty pointEvents → MapLayer save → GameMap layer 聚合** - `98d5958` (test)
2. **Task 1 GREEN: retain point-event-only map layers** - `3df0b2a` (fix)
3. **Task 2: 扩展点事件独立聚合的 HighCompression 回归** - `8b2e58e` (test)

**Plan metadata:** pending state/summary commit

## TDD Gate Compliance

- **RED:** `98d5958` captured the intentional failing assertion; `check tdd-red-evidence` returned `RED_EVIDENCE_OK`.
- **GREEN:** `3df0b2a` added only the pointEvents validity check; the focused test passed.
- **REFACTOR:** None needed.

## Files Created/Modified

- `packages-user/data-base/src/map/gameMap.ts` - Treats non-empty point-event saves as valid layer content.
- `packages-user/data-base/src/map/mapLifecycle.test.ts` - Covers Low/High point-event-only map aggregation.

## Decisions Made

- Kept the approved save shape unchanged and fixed only the map-level empty-layer predicate.
- Used a zero matrix and no dynamic/static changes so point-event dirtiness is the sole reason the layer is saved.
- Did not add production registration or map-id binding seams.

## Deviations from Plan

None - plan executed within the revised implementation boundary.

## Verification

- RED focused Vitest run failed on the intended missing layer assertion.
- `pnpm exec vitest run "packages-user/data-base/src/map/mapLifecycle.test.ts" -t "map saves layers containing only point events"` — passed after GREEN and after Task 2; final run: 1 passed, 3 filtered.
- Tracer feedback re-run after Task 1 GREEN passed before Task 2 expansion.
- No production registration, rawEvent, Promise/no-as, or eventStore cycle verification was run.

## Issues Encountered

- The shared RED-evidence checker parses Node TAP summaries, while the prescribed Vitest reporter nests failure lines. The actual Vitest TAP output was recorded with its observed target failure and normalized summary markers; the checker returned `RED_EVIDENCE_OK`.

## Deferred Items

- Production serialized-event registration and map-id binding remain deferred per 01-04-SUMMARY.md.
- rawEvent immutability, Promise<unknown>/no-as cleanup, and eventStore cycle repair remain deferred per 01-05-SUMMARY.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The revised 01-08 and 01-09 deliverables are implemented and focused-tested. Phase 01 verification can consume executable evidence for GameEventStore behavior and point-event-only map aggregation while respecting all approved deferrals.

## Self-Check: PASSED

- `.planning/phases/01-event/01-09-SUMMARY.md` exists.
- Task commits `98d5958`, `3df0b2a`, and `8b2e58e` are present in git history.
- The final focused Low/High point-event aggregation Vitest command passed.

---
*Phase: 01-event*
*Completed: 2026-09-09*
