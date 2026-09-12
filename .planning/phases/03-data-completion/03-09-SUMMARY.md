---
phase: 03-data-completion
plan: 09
subsystem: data-state-replay
tags: [replay, safety, async, vitest, registry]

requires:
  - phase: 03-data-completion
    provides: Stable replay command registry, async replay-safety decorator, and CoreState command assembly
provides:
  - Production replay command entrances decorated at the five approved state-changing boundaries
  - Regression proof that real registry calls preserve async replay-safety collection until settlement
  - Regression proof that pure path queries and parameter validation remain outside the safety boundary
affects: [phase-3-verification, phase-4-render-adaptation]

actuals:
  tokens: 4409
  tasks: 2
  commits: 2
plan_head_before: 3509be39dd64a62205ad5e57394ef81fc56a415f
commits: 2

tech-stack:
  added: []
  patterns:
    - Internal replay command-entry class owns one replay-safety decoration boundary per state-changing action
    - Command parameter validation, slot resolution, and pure path queries execute before decorated entrances

key-files:
  created: []
  modified:
    - packages-user/data-state/src/replay/commands.ts
    - packages-user/data-state/src/replay/commands.test.ts

key-decisions:
  - "Use one internal ReplayCommandEntrances seam with five decorated methods; the four directional registry items share moveHero."
  - "Keep validation, slot resolution, path queries, and registration assembly outside decorated methods while preserving all replay/public contracts."

patterns-established:
  - "Production registry calls, rather than test-local wrappers, are the source of replay-safety boundary coverage."
  - "Async state-changing entrances remain collected until their returned Promise settles."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "Production movement, item, and equipment registry calls use the approved replay-safety decoration."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/src/replay/commands.test.ts#decorates real registry item and equipment actions"
        status: pass
      - kind: unit
        ref: "pnpm exec vitest run packages-user/data-state/src/replay/commands.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Deferred production movement keeps replay-safety collection active through controller Promise settlement."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/src/replay/commands.test.ts#decorates real registry movement through Promise settlement"
        status: pass
      - kind: other
        ref: "pnpm test:data-node"
        status: pass
    human_judgment: false
  - id: D3
    description: "Pure path queries and invalid command validation do not manufacture replay-safety records."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#keeps pure path queries and validation outside the safety boundary"
        status: pass
      - kind: other
        ref: "pnpm exec tsx script/check-data-type.ts; pnpm exec tsx script/check-data-circular.ts"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-09-10
status: complete
---

# Phase 3 Plan 9 Summary

**Production replay registry entrances now collect state-changing safety diagnostics across complete async actions without decorating pure command paths**

## Performance

- **Duration:** 17 min
- **Started:** 2026-09-10T19:38:00+08:00
- **Completed:** 2026-09-10T19:55:16+08:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added an internal production command-entry seam with replay-safety decoration on movement, auto-pathfinding, item use, equipment, and unequipment; directional commands share the decorated movement entrance
- Kept parameter validation, slot resolution, path queries, and registry assembly outside the decoration boundary while preserving stable codes, `Promise<boolean>`, failure booleans, and existing state APIs
- Added real `ReplaySystem` registry regression coverage for decorated async movement, item/equipment actions, and pure path/validation exclusion

## Task Commits

Each task was committed atomically:

1. **Task 1: GAP-03-03 decorate production replay command entrances** - `fc9a1ad` (feat)
2. **Task 2: GAP-03-03 production decoration and async-boundary regression** - `160a0d5` (test)

**Plan metadata:** `f8d7b70` (docs)

## Files Created/Modified

- `packages-user/data-state/src/replay/commands.ts` - production decorated command-entry class and validation-to-entrance routing
- `packages-user/data-state/src/replay/commands.test.ts` - real registry, async settlement, and undecorated pure-path regression tests

## Decisions Made

- One internal `ReplayCommandEntrances` class owns exactly five decoration boundaries; the four directional commands delegate to `moveHero`
- Validation and pure helpers remain before the decorated call, preventing invalid or non-mutating paths from adding replay-safety records
- No replay command enum, public interface, route recording behavior, or controller-awaiting contract changed

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope expansion; GAP-03-03 is closed within the two planned files.

## Issues Encountered

- Verification emitted the repository's existing Browserslist staleness notice and expected data-layer logger diagnostics; these did not affect exit status.
- The scoped type gate reported 27 pre-existing diagnostics outside the four data packages and zero in-scope diagnostics.

## Verification

- PASS: `pnpm exec vitest run packages-user/data-state/src/replay/commands.test.ts` — 12 tests
- PASS: `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` — 18 files, 103 tests
- PASS: `pnpm test:data-node` — Node replay verifier passed
- PASS: `pnpm exec tsx script/check-data-type.ts` — zero in-scope diagnostics
- PASS: `pnpm exec tsx script/check-data-circular.ts` — zero cycles
- PASS: focused Prettier check and ESLint — formatted, no lint errors

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

GAP-03-03 is ready for phase verification. `STATE.md` and `ROADMAP.md` were intentionally not modified per user instruction.

## Self-Check: PASSED

- Production and regression files exist on disk
- Task commits `fc9a1ad` and `160a0d5` are present in git history
- Focused, full data-suite, Node, type, circular, lint, and formatting gates passed

---
*Phase: 03-data-completion*
*Completed: 2026-09-10*
