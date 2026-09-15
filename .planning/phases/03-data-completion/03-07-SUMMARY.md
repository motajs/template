---
phase: 03-data-completion
plan: 07
subsystem: data-state-events
tags: [serialized-events, map-binding, anon-tokyo, node-replay, vitest]

requires:
  - phase: 03-data-completion
    provides: Node-safe CoreState, approved event built-ins, raw map event-id contract, and fixed replay fixture
provides:
  - Internal serialized Statement[] event registration through the CoreState data-load boundary
  - Raw IMapRawData.events binding through MapState.fromRaw before replay execution
  - Production-path Node replay regression coverage for trigger preservation, id binding, awaited mutation, and final snapshots
affects: [03-VERIFICATION, Phase 3 data closure, Phase 4 render adaptation]

actuals:
  tokens: 3508
  tasks: 2
  commits: 3
  plan_head_before: 8f3f5cad7dfb15c9d95636348699e61151f4296a

tech-stack:
  added: []
  patterns:
    - Internal symbol-keyed CoreState load seam keeps serialized registration out of the public state contract
    - GameEvent instances share the assembled GameEventSystem AnonTokyo interpreter
    - Raw map event references are bound only by MapState.fromRaw and remain id-only in map data

key-files:
  created:
    - packages-user/data-state/src/legacy/events.ts
    - packages-user/data-state/test/coreSerializedEvents.test.ts
  modified:
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/src/legacy/dependencies.ts
    - packages-user/data-state/test/fixtures/closed-loop.ts

key-decisions:
  - "Keep serialized loading behind the internal LOAD_SERIALIZED_DATA symbol and outside ICoreState, so no public event-registration API is added."
  - "Construct serialized events with the existing GameEventSystem interpreter and preserve the supplied EventTrigger and Statement[] references."
  - "Use IMapRawData.events plus MapState.fromRaw for coordinate binding; do not persist event bodies in maps or saves."

patterns-established:
  - "Production replay fixtures must enter through the same internal serialized load seam as CoreState rather than calling eventStore.addEvent directly."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "CoreState registers validated serialized events before binding raw map event ids."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/coreSerializedEvents.test.ts#registers serialized event data before binding map event ids"
        status: pass
      - kind: other
        ref: "pnpm exec tsx script/check-data-type.ts; pnpm exec tsx script/check-data-circular.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fixed Node fixture uses serialized eventSetBlock statements and raw map coordinate references instead of manual event-store insertion."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/test/coreSerializedEvents.test.ts#executes the registered event once through the replay path"
        status: pass
      - kind: other
        ref: "pnpm test:data-node"
        status: pass
    human_judgment: false
  - id: D3
    description: "The scoped data regression suite remains green with the exact replay snapshot and existing boundaries preserved."
    requirement: DATA-01
    verification:
      - kind: other
        ref: "pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state"
        status: pass
      - kind: other
        ref: "focused ESLint, Prettier, Chinese coverage-comment scan"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-10
status: complete
---

# Phase 3 Plan 7 Summary

**Serialized Statement[] events now load through the internal CoreState boundary and drive the fixed Node replay through raw map event-id binding**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-10T12:11:50Z
- **Completed:** 2026-09-10T12:20:54Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added an internal serialized-event adapter that validates event ids, trigger values, statement containers, and registers real `GameEvent` instances with the assembled interpreter
- Wired serialized registration before raw map construction and routed `IMapRawData.events` through `MapState.fromRaw`, preserving id-only map event storage
- Replaced the fixed fixture's direct `eventStore.addEvent` call with the production load seam and added Chinese-commented regression coverage for registration, binding, one execution, and exact replay state

## Task Commits

Each task was committed atomically:

1. **Task 1: GAP-03-01 serialized event registration and CoreState load-order tracer** - `a111b8d` (feat)
2. **Task 2: GAP-03-01 production-path replay fixture and map-event binding regression** - `1b93deb` (test)

Additional quality commit:

3. **Prettier/CRLF normalization for changed serialized-event files** - `4b91a0b` (style)

**Plan metadata:** `19df30e` (docs)

## Files Created/Modified

- `packages-user/data-state/src/legacy/events.ts` - internal serialized event validation, `GameEvent` construction, trigger preservation, and store registration
- `packages-user/data-state/src/core.ts` - load-order wiring and raw-map initialization through `MapState.fromRaw`
- `packages-user/data-state/src/legacy/dependencies.ts` - internal serialized-load payload and symbol boundary
- `packages-user/data-state/test/fixtures/closed-loop.ts` - fixed replay fixture using serialized `eventSetBlock` and raw coordinate event ids
- `packages-user/data-state/test/coreSerializedEvents.test.ts` - focused production-path registration and replay regression tests

## Decisions Made

- Kept the new load seam symbol-keyed and absent from `ICoreState` and the public package barrel
- Reused `GameEvent`, `EventTrigger`, `Statement[]`, `GameEventStore`, and `GameEventSystem.executor.interpreter` rather than introducing a second event model
- Preserved the existing no-argument `createCoreState()` and Node-safe dependency selection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied required CRLF and Prettier formatting**

- **Found during:** Overall quality-gate checks after Task 2
- **Issue:** The patch tool left changed files with LF line endings and one formatting layout rejected by the repository ESLint/Prettier checks
- **Fix:** Ran Prettier write on only the five plan-owned files and committed the resulting normalization
- **Files modified:** `packages-user/data-state/src/core.ts`, `packages-user/data-state/src/legacy/dependencies.ts`, `packages-user/data-state/src/legacy/events.ts`, `packages-user/data-state/test/fixtures/closed-loop.ts`, `packages-user/data-state/test/coreSerializedEvents.test.ts`
- **Verification:** Focused ESLint and Prettier checks passed
- **Committed in:** `4b91a0b`

---

**Total deviations:** 1 auto-fixed (Rule 3: 1)
**Impact on plan:** Formatting-only correction; no scope or runtime contract expansion.

## Known Stubs

- `packages-user/data-state/src/legacy/dependencies.ts:63` — the pre-existing Node branch intentionally registers no browser loading callback; this is required for the DOM-free Node path and is already recorded in `.planning/WINDOWS.md` as an accepted boundary stub

## Issues Encountered

- The scoped type gate reports 27 pre-existing diagnostics outside the four data packages and zero in-scope diagnostics; this remains non-blocking and no changed plan file is implicated
- Vitest and Node replay output includes the repository's existing Browserslist notice and expected data-layer logger diagnostics; all assertions and process gates passed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GAP-03-01 is closed: CoreState's internal serialized load path registers events before raw map binding, and the fixed Node replay consumes that path without manual event-store insertion
- Existing Phase 3 scope boundaries remain intact: no public registration API, scalar tile triggers, event-body map persistence, browser globals, or Phase 4–6 behavior were added
- `STATE.md` and `ROADMAP.md` were intentionally not modified per the execution request

---
*Phase: 03-data-completion*
*Completed: 2026-09-10*

## Self-Check: PASSED

- Summary file exists
- Task commits `a111b8d`, `1b93deb`, and formatting commit `4b91a0b` are present in git history
- Focused regression, scoped data suite, Node replay, type, circular, ESLint, Prettier, and Chinese coverage-comment checks passed
