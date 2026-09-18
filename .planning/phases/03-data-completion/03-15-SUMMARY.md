---
phase: 03-data-completion
plan: 15
subsystem: data-state-replay
tags: [replay, command-classes, isolation, vitest]

# Dependency graph
requires:
    - phase: 03-data-completion
      provides: Synchronous replay commands, stable command codes, and existing replay registration interfaces
provides:
    - Eight independent replay instruction classes with per-class state ownership
    - Stable ordered registration with fresh command instances and preserved custom item extension
    - Structural regression coverage for ownership isolation and cross-state instance independence
affects: [phase-3-verification, phase-4-render-adaptation]

# Actuals (#2632)
actuals:
    tokens: 6505
    tasks: 2
    commits: 3
    plan_head_before: a6b432f106405d295b7fda5c88986d00805da64c
commits: 3

# Tech tracking
tech-stack:
    added: []
    patterns:
        - Each replay instruction owns its state reference, validation, synchronous action, and execute boundary
        - Top-level replay registration remains the sole stable-order assembly point

key-files:
    created:
        - .planning/phases/03-data-completion/03-15-SUMMARY.md
    modified:
        - packages-user/data-state/src/replay/commands.ts
        - packages-user/data-state/src/replay/commands.test.ts
        - .planning/phases/03-data-completion/03-REPLAY-CONTRACT.md
        - .planning/phases/03-data-completion/deferred-items.md
        - .planning/WINDOWS.md

key-decisions:
    - 'Keep the existing IReplayCommand, IReplayCommandItem, ReplaySystem, stable enum order, and custom registration boundary unchanged.'
    - 'Keep replay actions synchronous and retain command-level safety behavior without changing user-owned decorator placement.'
    - 'Do not alter legacy/save architecture or eventInsertEvent semantics; the correction is limited to replay command ownership.'

patterns-established:
    - 'Eight command classes are independently instantiated in stable ReplayCommandCode order; no shared mutable entrance object or cross-command delegation remains.'
    - 'Pure parameter helpers remain outside command ownership only when they do not carry mutable command state.'

requirements-completed: [DATA-01]

# Coverage metadata (#1602)
coverage:
    - id: D1
      description: 'Eight replay instructions are distinct classes with per-class execute implementations and fresh instances per registry and CoreState.'
      requirement: DATA-01
      verification:
          - kind: unit
            ref: 'packages-user/data-state/src/replay/commands.test.ts#keeps replay command ownership isolated in the command module'
            status: pass
          - kind: other
            ref: 'Structural class/instance probe from 03-15-PLAN.md Task 1'
            status: pass
      human_judgment: false
    - id: D2
      description: 'Stable registration order, invalid-parameter false results, synchronous behavior, and existing custom IReplayCommandItem registration remain intact.'
      requirement: DATA-01
      verification:
          - kind: unit
            ref: 'packages-user/data-state/src/replay/commands.test.ts#registers an existing custom command item through the current interface'
            status: pass
          - kind: integration
            ref: 'pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state'
            status: pass
          - kind: integration
            ref: 'pnpm test:data-node'
            status: pass
      human_judgment: false
    - id: D3
      description: 'Scoped data type checking and replay decorator/event/save boundaries remain unaffected by the class split.'
      requirement: DATA-01
      verification:
          - kind: other
            ref: 'pnpm exec tsx script/check-data-type.ts'
            status: pass
          - kind: unit
            ref: 'commands.test.ts#does not change user-owned attribute decorator placement'
            status: pass
      human_judgment: false

# Metrics
duration: 24 min
completed: 2026-09-11
status: complete
---

# Phase 3 Plan 15 Summary

**Independent replay instruction classes with stable registration, synchronous behavior, and isolated ownership regressions**

## Performance

- **Duration:** 24 min
- **Started:** 2026-09-11T06:06:00Z
- **Completed:** 2026-09-11T06:31:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Replaced `ReplayCommandEntrances` and the directional closure factory with eight independent instruction classes in `commands.ts`
- Preserved the stable eight-entry registration order, fresh per-state command instances, existing replay interfaces, synchronous command behavior, and custom command-item extension
- Added regression coverage for class identity, ownership isolation, order, invalid parameters, synchronous safety behavior, and user-owned decorator boundaries
- Left legacy/save architecture and `eventInsertEvent` semantics untouched

## Task Commits

Each task was committed atomically; the final method-ordering adjustment was committed separately to satisfy `dev.md`/`AGENTS.md` conventions:

1. **Task 1: CORR-03-06 split replay instructions into independent classes** - `13162b2` (fix)
2. **Task 2: CORR-03-06 verify isolation, order, and user extensibility** - `f5c6b06` (test)
3. **Task 2 follow-up: order private replay actions before execute callers** - `4e318e6` (refactor)

## Files Created/Modified

- `packages-user/data-state/src/replay/commands.ts` - independent command classes and stable registration assembly
- `packages-user/data-state/src/replay/commands.test.ts` - class, instance, order, behavior, extension, and source-ownership regressions
- `.planning/phases/03-data-completion/03-REPLAY-CONTRACT.md` - independent class ownership contract note
- `.planning/phases/03-data-completion/deferred-items.md` - records the unrelated circular-gate finding
- `.planning/WINDOWS.md` - broken-windows entry for the unrelated circular-gate finding

## Decisions Made

- Preserved `IReplayCommand.execute(): Promise<boolean>`, `IReplayCommandItem`, `IReplayCommandRegistry`, `ReplaySystem`, and the stable enum order
- Kept command-level replay-safety behavior and did not alter user-owned `@shouldReplay()` placement
- Made no changes to legacy/save architecture or `eventInsertEvent` direct `Statement[]` semantics

## Deviations from Plan

### Auto-fixed Issues

**1. [AGENTS.md-driven adjustment] Ordered private command methods before their execute callers**

- **Found during:** Task 2 implementation review
- **Issue:** The initial class layout placed private action methods after the public method that calls them, contrary to the repository's method-ordering rule
- **Fix:** Moved each private action method before its class `execute` implementation
- **Files modified:** `packages-user/data-state/src/replay/commands.ts`
- **Verification:** Focused replay tests, full data suite, type gate, and structural probes passed
- **Committed in:** `4e318e6`

---

**Total deviations:** 1 repository-guided adjustment; no behavior or scope expansion
**Impact on plan:** Implementation remains limited to independent replay ownership and its regression coverage

## Issues Encountered

- The required scoped circular gate ran but failed on seven pre-existing legacy/render boundary cycles through `packages-user/data-state/src/legacy/move.ts`. These cycles are outside the replay class changes and were not altered; the finding is recorded in `deferred-items.md` and `.planning/WINDOWS.md`.
- The scoped type gate passed with zero in-scope diagnostics and 27 outside-scope diagnostics.
- Existing Browserslist and replay-safety warning output appeared during tests without affecting pass/fail results.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CORR-03-06 is closed: each approved replay instruction is independently owned, stable registration and extensibility remain intact, and synchronous behavior is regression-tested
- `STATE.md` and `ROADMAP.md` were intentionally not modified, preserving the user's existing unrelated planning changes
- The circular-gate finding remains deferred to the legacy/render boundary work; it is unrelated to this plan's replay ownership correction

---

_Phase: 03-data-completion_
_Completed: 2026-09-11_

## Self-Check: PASSED

- Summary file exists at `.planning/phases/03-data-completion/03-15-SUMMARY.md`
- Task commits `13162b2`, `f5c6b06`, and `4e318e6` are present in git history
- Plan ledger base is `a6b432f106405d295b7fda5c88986d00805da64c`; measured implementation commit count is 3
- Structural probes, focused replay tests, full data suite, Node replay verifier, scoped type gate, ESLint, and Prettier checks passed
- Scoped circular gate was executed and its unrelated pre-existing legacy/render cycles were recorded as deferred
