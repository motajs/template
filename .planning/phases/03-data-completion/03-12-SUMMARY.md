---
phase: 03-data-completion
plan: 12
subsystem: data-state-events
tags: [events, anon-tokyo, registration, vitest]

# Dependency graph
requires:
  - phase: 03-data-completion
    provides: Eight approved event built-in implementations and typed parameter contracts
provides:
  - Thin event barrel limited to registration assembly and module exports
  - Module-owned map, hero, and control built-in registration builders
  - Real registration-table coverage for all eight approved event names and behaviors
affects: [03-VERIFICATION, Phase 3 data closure]

# Actuals (#2632)
actuals:
  tokens: 4778
  tasks: 2
  commits: 2
plan_head_before: 1077d5f65d416dea92df2f8aa5121b12b2f1e423

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Typed module-owned registration adapters at the AnonTokyo boundary
    - Stable registration order assembled once by the event barrel

key-files:
  created: []
  modified:
    - packages-user/data-state/src/event/index.ts
    - packages-user/data-state/src/event/map.ts
    - packages-user/data-state/src/event/hero.ts
    - packages-user/data-state/src/event/event.ts
    - packages-user/data-state/src/event/event.test.ts

key-decisions:
  - "Keep index.ts as registration assembly and barrel exports only; each event implementation module owns its registration builder."
  - "Remove generic per-invocation parameter and environment shape validation, relying on typed built-in contracts and existing handler target guards."
  - "Preserve the approved eight names, stable order, event behavior, legacy/save architecture, and user-owned shouldReplay placement."

patterns-established:
  - "Event implementation modules export typed registration builders that adapt directly to the AnonTokyo built-in boundary without runtime shape parsing."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "The event barrel assembles the stable eight-entry table while map, hero, and control modules own registration construction."
    requirement: DATA-01
    verification:
      - kind: other
        ref: "Structural registration ownership gate for packages-user/data-state/src/event/index.ts, map.ts, hero.ts, and event.ts"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/event/event.test.ts#registers exactly the approved built-ins in AnonTokyo"
        status: pass
    human_judgment: false
  - id: D2
    description: "All eight approved registrations retain valid awaited map, hero, and event behavior with safe missing-target handling."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/event/event.test.ts#event built-ins"
        status: pass
      - kind: integration
        ref: "packages-user/data-system/src/event/eventDispatch.test.ts#source-aware matching dispatch"
        status: pass
      - kind: other
        ref: "pnpm exec prettier --check packages-user/data-state/src/event/index.ts packages-user/data-state/src/event/map.ts packages-user/data-state/src/event/hero.ts packages-user/data-state/src/event/event.ts packages-user/data-state/src/event/event.test.ts"
        status: pass
    human_judgment: false

# Metrics
duration: 9 min
completed: 2026-09-11
status: complete
commits: 2
---

# Phase 3 Plan 12 Summary

**Module-owned AnonTokyo event registrations with a thin barrel and no repeated hot-path shape validation**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-11T03:03:36Z
- **Completed:** 2026-09-11T03:13:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Moved map, hero, and control registration construction beside their implementations; `index.ts` now only assembles the stable order and re-exports modules/types
- Removed generic per-call object/property and environment-shape validation from the built-in invocation path while retaining typed handler contracts and target guards
- Reworked event tests to invoke the real eight-entry registration table with valid parameters, awaited behavior, missing-target safety, and Chinese coverage comments before every `it`

## Task Commits

Each task was committed atomically:

1. **Task 1: CORR-03-03 move registration construction into event modules** - `9c39895` (refactor)
2. **Task 2: CORR-03-03 update performance-sensitive event regression coverage** - `d2ebf1c` (test)

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `packages-user/data-state/src/event/index.ts` - stable registration assembly and exports only
- `packages-user/data-state/src/event/map.ts` - map handlers and map registration builder
- `packages-user/data-state/src/event/hero.ts` - hero handlers and hero registration builder
- `packages-user/data-state/src/event/event.ts` - event-control handlers and registration builder
- `packages-user/data-state/src/event/event.test.ts` - real registration-table behavior regression coverage

## Decisions Made

- Preserved the exact eight approved names and existing registration order
- Left legacy/save architecture and user-owned `@shouldReplay()` placement untouched
- Kept handler-level target guards and removed only the repeated generic runtime validation layer

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- An intermediate focused run before Task 2 still exercised the prior nullish-guard tests and failed as expected after removing that guard. Task 2 replaced those tests; the final focused verification passed.
- The repository's broader `vue-tsc` command continues to report pre-existing diagnostics outside the plan-owned event files; no event-file diagnostics remained.

## Verification

- Structural ownership and no-runtime-shape-validation gate — passed
- Chinese comment-before-every-`it` gate — passed
- `pnpm exec vitest run packages-user/data-state/src/event/event.test.ts packages-user/data-system/src/event/eventDispatch.test.ts` — passed, 2 files / 14 tests
- Scoped Prettier check — passed
- Scoped ESLint check — passed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CORR-03-03 is closed: the event barrel is thin, module ownership is explicit, and the generic hot-path validation pipeline is gone
- Phase 3 context supersession records and `03-VERIFICATION.md` remain user-owned working-tree changes; STATE.md and ROADMAP.md were intentionally not modified

---
*Phase: 03-data-completion*
*Completed: 2026-09-11*

## Self-Check: PASSED

- Summary file exists
- Task commits `9c39895` and `d2ebf1c` are present in git history
- Production commit ledger reports 2 commits after `plan_head_before`
- Structural, focused Vitest, formatting, and lint gates passed
