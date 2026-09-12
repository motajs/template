---
phase: 01-event
plan: 04
subsystem: event-contract-decisions
tags: [typescript, events, dispatch, persistence, planning]
requires:
  - phase: 01-event/01-01
    provides: GameEventStore, event views, and event-aware map foundations
  - phase: 01-event/01-02
    provides: GameEventSystem and the existing sequential executor contract
  - phase: 01-event/01-03
    provides: Hero movement event collection and trigger mapping
provides:
  - Explicit deferral of serialized event registration, with only the CoreState initialization TODO retained
  - Exact source-aware invocation and full-sequence execute contract for downstream implementation
  - Exact point-event save, dirty, load, reset, and resize contract
affects: [01-06, 01-07, 01-09, 01-10, phase-01-verification]
actuals:
  tokens: 2206
  tasks: 3
  commits: 0
  plan_head_before: 6f6ed62b1b401a8e1d51207ba7b08c8e7935dfb2
tech-stack:
  added: []
  patterns:
    - User-owned contracts are recorded verbatim before downstream implementation
    - Event persistence is independent from map-matrix dirty state
key-files:
  created:
    - .planning/phases/01-event/01-04-SUMMARY.md
  modified:
    - packages-user/data-state/src/core.ts
key-decisions:
  - "Serialized event registration and map event-id binding remain deferred; CoreState retains only a TODO and no new public registration API is added."
  - "Source-aware dispatch uses IGameEventInvocation { id: string; env: IBlockEventEnv } and one full-sequence execute call."
  - "IMapLayerSave.pointEvents uses index -> priority -> eventId, independent of map-matrix dirty, with pure-baseline overlay loading and crop/clear resize semantics."
patterns-established:
  - "Point events use PointEvent with tile=null; static and each dynamic tile use TileEvent with the actual tile."
  - "Trigger filtering, point-first ordering, tile priority-desc ordering, await, cut, and reduce operate over one complete invocation sequence."
requirements-completed: [EVT-01, EVT-02]
coverage:
  - id: D1
    description: "The production registration boundary and its intentional deferral are recorded without adding an event-registration API."
    requirement: EVT-01
    verification:
      - kind: other
        ref: "CoreState TODO presence plus addEvent seam existence check"
        status: pass
    human_judgment: false
  - id: D2
    description: "The source-aware invocation shape and one-call full-sequence execution semantics are recorded for downstream implementation."
    requirement: EVT-02
    verification:
      - kind: other
        ref: "Existing single-env executor and TileEvent context verification"
        status: pass
    human_judgment: true
    rationale: "The selected public contract is a user-owned architecture decision; static checks only confirm that the pre-decision gap still exists."
  - id: D3
    description: "The independent point-event save field and pure-baseline load/resize lifecycle are recorded for downstream implementation."
    requirement: EVT-01
    verification:
      - kind: other
        ref: "IMapLayerSave absence of pointEvents verification before downstream implementation"
        status: pass
    human_judgment: true
    rationale: "The exact persistence semantics are a user-owned architecture decision and are not implemented by this decision-only plan."
duration: 7min
completed: 2026-09-08
status: complete
---

# Phase 01 Plan 04: Event Contract Decisions Summary

**User-approved event initialization, source-aware dispatch, and coordinate-bound point-event persistence contracts recorded for downstream gap plans**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-08T15:04:22Z
- **Completed:** 2026-09-08
- **Tasks:** 3
- **Files modified by this plan:** 1 implementation file was verified unchanged; 1 summary file was created

## Accomplishments

- Confirmed that `CoreState` already retains the requested initialization TODO and continues to assemble `GameEventStore` without registering serialized events or writing event bodies into saves.
- Recorded the exact source-aware dispatch decision: `IGameEventInvocation { id: string; env: IBlockEventEnv }`, a single full-sequence executor call, source-specific environments, trigger filtering, and unified cut/reduce behavior.
- Recorded the exact point-event persistence decision: `IMapLayerSave.pointEvents` as index → priority → event id, independent event-field dirtying, pure-baseline restoration before overlays, stable save snapshots, resize cropping, and `resize2` clearing.

## Task Commits

No task commits were created, per the explicit user instruction not to create git commits. Tasks 2 and 3 are decision-recording tasks; no downstream implementation was performed.

## Files Created/Modified

- `.planning/phases/01-event/01-04-SUMMARY.md` — Records all three approved contracts and the exact downstream implementation boundary.
- `packages-user/data-state/src/core.ts` — Verified the existing event-store initialization TODO; no additional code change was made in this plan.

## Decisions Made

### 1. Serialized registration is deferred

The production initialization path keeps a TODO for later registration of external serialized event definitions and map event-id bindings. This plan does not add a registration API, does not register event bodies into maps or saves, and does not expand the deferred built-in function scope.

### 2. Dispatch carries its source per invocation

Downstream code must introduce `IGameEventInvocation { id: string; env: IBlockEventEnv }` and make one execute call over the complete ordered invocation sequence. Point events use `BlockEventType.PointEvent` and `tile: null`; static tile events and every dynamic tile event use `BlockEventType.TileEvent` and their actual tile. The sequence is point-first, then static and dynamic tile entries in descending priority order. The executor filters each event against `event.trigger === invocation.env.trigger`, awaits each selected event, and applies cut/reduce over this same complete sequence rather than across separate calls.

### 3. Point-event persistence is an independent save field

`IMapLayerSave.pointEvents` is a nested read-only map shaped as `index -> priority -> eventId`. It is independent from the map matrix dirty flag: matrix dirtiness must not substitute for event-field dirtiness, and point-event or tile-event changes must cause their corresponding save fields to be emitted. Loading first restores the pure baseline and then overlays the serialized event data. A `resetToPure()` operation may be added to `ILayerEventView` if needed. Normal resize preserves and crops in-range point events; `resize2` clears them. Point events remain attached to their original coordinates and do not move with dynamic tiles. Save values must be stable snapshots, not live internal maps.

## Verification

- Task 1 precondition and context check passed: `data-common/src/store/types.ts` exists with `addEvent`, and `CoreState` contains the deferred registration TODO.
- Task 2 context check passed: the current executor still has the single-env `events: string[]` seam and the mover still contains the pre-decision `TileEvent` path.
- Task 3 context check passed: `IMapLayerSave` exists and does not yet contain `pointEvents`, confirming downstream implementation remains pending.
- No package installation, downstream-plan implementation, or behavioral test was performed.

## Deviations from Plan

None - the plan was executed as a decision-recording gap closure. The existing `CoreState` TODO already matched Task 1, so no implementation edit was necessary.

## Known Stubs

- `packages-user/data-state/src/core.ts:153` — The serialized event registration and map-id binding TODO is intentional and explicitly deferred by this plan; downstream plans must not infer or add an API before the deferred scope is reopened.

## Issues Encountered

None. Repository-wide implementation gaps remain intentionally assigned to downstream plans 01-06, 01-07, 01-09, and 01-10; this plan did not attempt to resolve them.

## User Setup Required

None.

## Next Phase Readiness

- 01-06/01-09/01-10 may implement only the exact `pointEvents` lifecycle recorded above.
- 01-07 may implement only the exact source-aware invocation and full-sequence executor contract recorded above.
- Serialized registration remains deferred; no downstream plan may invent a registration API from this summary.

## Self-Check: PASSED

- `.planning/phases/01-event/01-04-SUMMARY.md` exists.
- The verified `CoreState` TODO and all three decision sections are present in this summary.
- Git HEAD remains `6f6ed62b1b401a8e1d51207ba7b08c8e7935dfb2`; no commit was created.
- No downstream plan files or implementation files outside the retained `CoreState` context were changed.

---
*Phase: 01-event*
*Completed: 2026-09-08*
