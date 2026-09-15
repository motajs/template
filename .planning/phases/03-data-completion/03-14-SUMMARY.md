---
phase: 03-data-completion
plan: 14
subsystem: data-state-replay
tags: [replay, synchronous, safety, vitest]

# Dependency graph
requires:
  - phase: 03-data-completion
    provides: Existing ReplaySystem contracts, stable command registry, and replay-safety decorator wiring
provides:
  - Synchronous replay command state-changing bodies with the existing Promise<boolean> command boundary
  - Immediate replay-safety collection restoration at decorated method return
  - Regression coverage for synchronous commands, nested safety context, and user-owned decorator placement
affects: [phase-3-verification, 03-15-replay-command-classes]

# Actuals (#2632)
actuals:
  tokens: 4823
  tasks: 2
  commits: 2
  plan_head_before: d9a7faa5b975f470c75da03a163e636561b81176
commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Synchronous command entrances adapt immediate boolean results with Promise.resolve at the unchanged IReplayCommand boundary
    - Replay-safety decorators restore nested collection context immediately after synchronous method return

key-files:
  created: []
  modified:
    - packages-user/data-common/src/replay/func.ts
    - packages-user/data-state/src/replay/commands.ts
    - packages-user/data-state/src/replay/commands.test.ts
    - .planning/phases/03-data-completion/03-REPLAY-CONTRACT.md

key-decisions:
  - "Keep IReplayCommand.execute(): Promise<boolean>, ReplaySystem, ReplaySandbox, stable command codes, and registry order unchanged; only adapt immediate command results at the existing boundary."
  - "Keep replay-safety decoration on the existing command entrances while restoring collection context synchronously; do not place decorators on user-owned HeroAttribute methods."

patterns-established:
  - "Movement and pathfinding commands start existing state APIs without awaiting controller lifecycle Promises."
  - "Nested synchronous replay-safety calls are tested for both nesting and post-return context restoration."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "Replay command bodies invoke movement, pathfinding, item, and equipment state APIs synchronously without added command sequencing."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#completes directional movement without awaiting the controller"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#completes pathfinding without awaiting the controller"
        status: pass
      - kind: other
        ref: "pnpm test:data-node"
        status: pass
    human_judgment: false
  - id: D2
    description: "Replay-safety restoration is synchronous and user-owned HeroAttribute decorator placement remains unchanged."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#restores collection context after synchronous nested actions"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#does not change user-owned attribute decorator placement"
        status: pass
      - kind: other
        ref: "scoped structural, ESLint, and Prettier checks"
        status: pass
    human_judgment: false

# Metrics
duration: 14 min
completed: 2026-09-11
status: complete
---

# Phase 3 Plan 14 Summary

**Synchronous replay command execution with immediate safety-context restoration and unchanged replay interfaces**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-11T13:30:00+08:00
- **Completed:** 2026-09-11T13:44:30+08:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Removed Promise-aware replay-safety restoration and restored the prior collection immediately after decorated methods return
- Removed async command bodies and controller waits while preserving stable command order, failure booleans, and the existing `Promise<boolean>` interface boundary
- Replaced deferred replay assertions with immediate command completion, synchronous nested collection, and user-owned decorator-placement regressions
- Corrected the replay contract to record the synchronous supersession without changing legacy/save architecture or event insertion work

## Task Commits

Each task was committed atomically:

1. **Task 1: CORR-03-05 restore synchronous replay command and decorator behavior** - `7ffc6c4` (fix)
2. **Task 2: CORR-03-05 replace async replay assertions with synchronous regressions** - `32fb115` (test)

**Plan metadata:** summary-only docs commit follows self-check; `STATE.md` and `ROADMAP.md` remain intentionally untouched

## Files Created/Modified

- `packages-user/data-common/src/replay/func.ts` - immediate replay-safety collection restoration
- `packages-user/data-state/src/replay/commands.ts` - synchronous state-changing command entrances and Promise boundary adapters
- `packages-user/data-state/src/replay/commands.test.ts` - synchronous command, safety-context, and decorator-placement regressions
- `.planning/phases/03-data-completion/03-REPLAY-CONTRACT.md` - corrected synchronous replay contract

## Decisions Made

- Preserved `IReplayCommand.execute(): Promise<boolean>`, `ReplaySystem`, `ReplaySandbox`, stable codes/order, and existing command registry ownership; no replay architecture redesign was introduced
- Kept existing command-entry replay-safety decoration but changed its lifecycle to synchronous restoration; `HeroAttribute.set`, `HeroAttribute.mul`, and all other user-owned state methods were not modified
- Left legacy/save architecture and the completed `eventInsertEvent` correction untouched

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied repository line-ending and formatting corrections**
- **Found during:** Task 1 verification
- **Issue:** The direct patch introduced LF formatting that failed the repository's CRLF-aware ESLint/Prettier gate
- **Fix:** Ran Prettier on the two Task 1 implementation files
- **Files modified:** `packages-user/data-common/src/replay/func.ts`, `packages-user/data-state/src/replay/commands.ts`
- **Verification:** Scoped ESLint passed with only three pre-existing `no-console` warnings; scoped Prettier passed
- **Committed in:** `7ffc6c4`

**2. [Rule 1 - Bug] Corrected the nested safety regression's logger-leaf assertion**
- **Found during:** Task 2 verification
- **Issue:** The detailed safety logger emits labeled leaf names such as `inner: inner`, so the initial exact-string assertion did not observe the two expected nested/root leaves
- **Fix:** Matched the emitted `inner:` labels while retaining the two-leaf assertion that proves nested and post-return collections are distinct
- **Files modified:** `packages-user/data-state/src/replay/commands.test.ts`
- **Verification:** Focused Vitest suite passed with 13 tests and Node replay passed
- **Committed in:** `32fb115`

---

**Total deviations:** 2 auto-fixed (1 Rule 1, 1 Rule 3)
**Impact on plan:** Both fixes were limited to planned files and verification correctness; no scope expansion occurred.

## Issues Encountered

- Verification emitted the existing Browserslist staleness notice, expected replay safety warning diagnostics, and three existing `no-console` lint warnings; all required gates passed.
- Pre-existing `.planning/STATE.md` and deleted `.planning/HANDOFF.json` working-tree changes were preserved and not staged, per the instruction not to modify `STATE.md` or `ROADMAP.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CORR-03-05 is closed: replay state handling and safety restoration are synchronous while existing replay interfaces remain intact
- Plan 03-15 can proceed with the independent replay command class correction
- No legacy/save architecture, event insertion implementation, or user-owned state-method decorator placement was changed

---
*Phase: 03-data-completion*
*Completed: 2026-09-11*

## Self-Check: PASSED

- Summary file exists at `.planning/phases/03-data-completion/03-14-SUMMARY.md`
- Task commits `7ffc6c4` and `32fb115` are present in git history
- Plan ledger base is `d9a7faa5b975f470c75da03a163e636561b81176`; measured task commit count is 2
- Structural, focused Vitest, Node replay, ESLint, and Prettier gates passed
