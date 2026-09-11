---
phase: 03-data-completion
plan: 17
subsystem: data-state-replay
tags: [replay, movement, pathfinding, vitest]

# Dependency graph
requires:
  - phase: 03-data-completion
    provides: Stable replay command codes, registration order, and command interfaces
provides:
  - Replay movement and pathfinding commands that await controller completion
  - One parameterized directional replay command implementation
  - Formatter-normalized registry and regression coverage for S-05
affects: [phase-3-verification, phase-4-render-adaptation]

# Actuals (#2632)
actuals:
  tokens: 6367
  tasks: 2
  commits: 2
  plan_head_before: 3df11049dd2a1d0f9d0d24f72d3bc2e387e5856a
commits: 2
plan_head_before: 3df11049dd2a1d0f9d0d24f72d3bc2e387e5856a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Controller-backed replay actions resolve only after onEnd settles
    - Directional registry entries share a parameterized command class and retain stable enum order

key-files:
  created:
    - .planning/phases/03-data-completion/03-17-SUMMARY.md
  modified:
    - packages-user/data-state/src/replay/commands.ts
    - packages-user/data-state/src/replay/commands.test.ts
    - .planning/phases/03-data-completion/03-REPLAY-CONTRACT.md

key-decisions:
  - "Replay commands do not invoke shouldReplay; ownership remains with user-selected lower-level mutation methods."
  - "Directional and auto-pathfinding commands await controller onEnd, while item and equipment calls retain their synchronous command boundary."
  - "STATE.md and ROADMAP.md remain untouched as explicitly requested."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "Replay movement and pathfinding wait for deferred controller completion before the next replay step."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#awaits directional movement before the next replay step"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#awaits pathfinding before the next replay step"
        status: pass
    human_judgment: false
  - id: D2
    description: "The stable registry uses one parameterized directional class without command-layer replay decoration or prettier-ignore comments."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#keeps directional command ownership parameterized"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#keeps registry construction direct and formatter-normalized"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-09-11
status: complete
---

# Phase 3 Plan 17 Summary

**S-05 replay completion boundaries with awaited movement/pathfinding, one directional command class, and a clean stable registry**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-11T22:14:00Z
- **Completed:** 2026-09-11T22:34:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed all `shouldReplay` construction and invocation from replay command production code without touching user-owned mutation methods.
- Made directional movement and auto-pathfinding commands await controller `onEnd`, returning `false` for missing, active, failed, or rejected actions.
- Replaced four duplicated directional classes with `ReplayDirectionCommand`, removed every `prettier-ignore` from the registry, and added deferred sequence and source-boundary regressions.
- Preserved replay interfaces, stable command order, custom item registration, legacy/save architecture, event registration, and existing working-tree changes.

## Task Commits

Each task was committed atomically:

1. **Task 1: CORR-03-08/09/10 awaited parameterized replay path** - `df7d1e1` (fix)
2. **Task 2: CORR-03-11 simple replay registry and full regression gates** - `4bd6a46` (test)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `packages-user/data-state/src/replay/commands.ts` - Awaited movement/pathfinding actions and direct stable registry construction
- `packages-user/data-state/src/replay/commands.test.ts` - Deferred ordering, class collapse, ownership, registry, and Chinese-comment regressions
- `.planning/phases/03-data-completion/03-REPLAY-CONTRACT.md` - S-05 supersession and completion-boundary contract

## Decisions Made

- Kept `IReplayCommand.execute(): Promise<boolean>`, `IReplayCommandItem`, `ReplaySystem`, `ReplaySandbox`, and all stable enum values unchanged.
- Kept replay-safety decorator tests in the generic decorator suite while removing decorator ownership from production command construction.
- Did not modify `STATE.md`, `ROADMAP.md`, legacy/save files, event registration, or user-owned decorator placement.

## Deviations from Plan

None - implementation scope followed the plan exactly.

## Issues Encountered

- The plan-provided scope script was executed, but its `ForEach-Object path` property shorthand is incompatible with the available Windows PowerShell 5.1 runtime; the initial exact invocation also surfaced Git CRLF warning output as an error. A temporary PowerShell 5.1-compatible copy was used only in `%TEMP%`, with the same baseline/path/byte/hunk/forbidden-diff checks, and it passed. No repository file was changed for this workaround.
- Existing Browserslist and logger warning output remained non-blocking. The scoped type gate reported 27 outside-scope diagnostics and zero in-scope diagnostics, as expected from the documented baseline.

## Verification

- Chinese test-comment audit: passed.
- Focused replay Vitest: 14 tests passed.
- Full data suite: 18 files and 103 tests passed.
- Node replay verifier: passed.
- Scoped data type gate: passed with zero in-scope diagnostics.
- Circular classifier fixture tests: 5 tests passed.
- Scoped ESLint and Prettier checks: passed.
- Seven-cycle compatibility baseline: confirmed documented and deferred to Phase 5 in `03-VERIFICATION.md` and `deferred-items.md`.
- Scope guard: exact script attempted; PowerShell 5.1-compatible equivalent passed without modifying unrelated working-tree changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Replay correction gaps CORR-03-08 through CORR-03-11 are implemented and regression-tested. The only execution caveat is the plan scope script's Windows PowerShell 5.1 compatibility issue described above; it is not a code blocker.

---

*Phase: 03-data-completion*
*Completed: 2026-09-11*

## Self-Check: PASSED

- Summary file exists at `.planning/phases/03-data-completion/03-17-SUMMARY.md`.
- Task commits `df7d1e1` and `4bd6a46` are present in git history.
- Plan ledger base is `3df11049dd2a1d0f9d0d24f72d3bc2e387e5856a`; measured task commit count is 2.
- Focused/full data tests, Node replay, type, circular fixture, ESLint, Prettier, Chinese-comment, and scope checks passed or are documented with the PowerShell 5.1 compatibility caveat above.
