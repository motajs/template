---
phase: 03-data-completion
plan: 16
subsystem: circular-gate
tags: [madge, circular-dependencies, compatibility, vitest, fixtures]

# Dependency graph
requires:
    - phase: 03-data-completion
      provides: Four-package and transitive-common circular-gate boundary
provides:
    - All-members compatibility-only cycle classification
    - Deterministic process-level circular-gate fixtures
    - CORR-03-07 scope rationale and regression coverage
affects: [phase-3-verification, phase-4-render-adaptation]

# Actuals (#2632)
actuals:
    tokens: 3505
    tasks: 2
    commits: 2
    plan_head_before: 5c962520ef3713a1831ff02419f9143a73d4761c
commits: 2
plan_head_before: 5c962520ef3713a1831ff02419f9143a73d4761c

# Tech tracking
tech-stack:
    added: []
    patterns:
        - Pure normalized cycle classification is shared by repository and fixture gate paths
        - Allow-listed synthetic fixtures validate process exit behavior independently of the repository graph

key-files:
    created:
        - script/check-data-circular.test.ts
        - .planning/phases/03-data-completion/03-16-SUMMARY.md
    modified:
        - script/check-data-circular.ts
        - .planning/phases/03-data-completion/03-COMMON-CYCLE-CONTRACT.md

key-decisions:
    - 'Exclude a cycle for compatibility reasons only when every normalized member is under the legacy or client compatibility prefixes.'
    - 'Keep any approved data/common member in scope, including mixed legacy+data and legacy+common cycles, so the existing non-zero gate remains fail-closed.'
    - 'Honor S-01 and S-04 by changing only the circular gate, focused test, and circular contract documentation.'

patterns-established:
    - 'Classifier scope is determined independently from compatibility-only detection; approved data/common boundaries remain authoritative.'
    - 'Child-process fixture assertions invoke the real tsx script entry rather than reproducing exit logic in tests.'

requirements-completed: [DATA-01]

# Coverage metadata (#1602)
coverage:
    - id: D1
      description: 'Circular scope classification excludes only all-member legacy/client compatibility cycles and keeps approved data/common mixed cycles in scope.'
      requirement: DATA-01
      verification:
          - kind: unit
            ref: 'script/check-data-circular.test.ts#classifies client-only and legacy-client cycles as outside scope'
            status: pass
          - kind: unit
            ref: 'script/check-data-circular.test.ts#keeps legacy-data cycles in scope'
            status: pass
          - kind: unit
            ref: 'script/check-data-circular.test.ts#keeps legacy-common and approved boundary cycles in scope'
            status: pass
      human_judgment: false
    - id: D2
      description: 'Supported synthetic fixture mode proves compatibility-only process success and mixed-boundary process failure.'
      requirement: DATA-01
      verification:
          - kind: integration
            ref: 'script/check-data-circular.test.ts#uses the real fixture process for pass and fail exit statuses'
            status: pass
          - kind: integration
            ref: 'pnpm exec tsx script/check-data-circular.ts --fixture {legacy-only,client-only,legacy-data,legacy-common}'
            status: pass
      human_judgment: false

# Metrics
duration: 10min
completed: 2026-09-11
status: complete
---

# Phase 3 Plan 16 Summary

**Fail-closed circular-gate compatibility classification with deterministic legacy/client and mixed-boundary process fixtures**

## Performance

- **Duration:** 10 min
- **Started:** 2026-09-11T15:07:00Z
- **Completed:** 2026-09-11
- **Tasks:** 2
- **Files modified:** 3 implementation/contract files plus this summary

## Accomplishments

- Added normalized all-members compatibility-only classification for `packages-user/data-state/src/legacy/` and `packages-user/client-modules/`.
- Preserved the approved data/common scope and existing non-zero exit behavior for mixed and approved-boundary cycles.
- Added allow-listed `legacy-only`, `client-only`, `legacy-data`, and `legacy-common` fixture modes and child-process regression coverage.
- Recorded the CORR-03-07 rationale without changing legacy, save, replay, event, or user-owned decorator implementation.

## Task Commits

Each task was committed atomically:

1. **Task 1: CORR-03-07 wire the compatibility-only circular scope classifier** - `07fd6c9` (fix)
2. **Task 2: CORR-03-07 regression-test compatibility-only and mixed-cycle boundaries** - `8d71282` (test)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `script/check-data-circular.ts` - Pure normalized classifier, fixture selector, shared report, and fail-closed process entry.
- `script/check-data-circular.test.ts` - Unit boundary coverage and real child-process fixture assertions.
- `.planning/phases/03-data-completion/03-COMMON-CYCLE-CONTRACT.md` - Exact compatibility-only and mixed-cycle scope rationale.

## Decisions Made

- Compatibility exclusion requires every cycle member to match a named legacy/client prefix.
- A cycle with any approved non-compatibility data or common member remains in scope and fails non-zero.
- S-01 and S-04 remain untouched; this correction is limited to circular-gate logic, tests, and contract documentation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made the compatibility-only result participate in the live scope decision**

- **Found during:** Task 2 implementation review
- **Issue:** The initial classifier computed `compatibilityOnly` but did not use it in the returned gate decision.
- **Fix:** The in-scope result now requires both a non-compatibility-only cycle and an approved data/common member.
- **Files modified:** `script/check-data-circular.ts`
- **Verification:** Focused Vitest suite, fixture process assertions, ESLint, and Prettier passed.
- **Committed in:** `8d71282`

**2. [Rule 1 - Bug] Made Windows child-process fixture execution reliable**

- **Found during:** Task 2 verification
- **Issue:** `spawnSync('pnpm.cmd', ...)` returned `EINVAL` in the Vitest Windows process environment.
- **Fix:** Spawned `pnpm` through the Windows shell while retaining the exact `pnpm exec tsx` fixture command.
- **Files modified:** `script/check-data-circular.test.ts`
- **Verification:** All five focused tests passed, including all four actual fixture processes.
- **Committed in:** `8d71282`

---

**Total deviations:** 2 auto-fixed Rule 1 issues; no scope expansion
**Impact on plan:** Both fixes were required for the classifier and mandated process-level regression to be truthful on Windows.

## Issues Encountered

- The live Madge repository graph currently reports seven in-scope mixed legacy/data-state/client cycles and three outside-scope render cycles. The command correctly exits non-zero under the corrected fail-closed policy; no legacy implementation was changed because those mixed cycles are intentionally retained as gate failures by CORR-03-07.
- ESLint reports eight existing `no-console` warnings in the diagnostic script but no errors; the plan gate passed. Browserslist emitted its existing stale-data advisory during Vitest.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CORR-03-07 is closed at the classifier and regression level.
- The circular gate now distinguishes compatibility-only cycles from mixed approved-boundary cycles without weakening the data/common boundary.
- `STATE.md` and `ROADMAP.md` were intentionally not modified per the execution request.

---

_Phase: 03-data-completion_
_Completed: 2026-09-11_

## Self-Check: PASSED

- Summary file exists at `.planning/phases/03-data-completion/03-16-SUMMARY.md`.
- Task commits `07fd6c9` and `8d71282` are present in git history.
- Plan ledger base is `5c962520ef3713a1831ff02419f9143a73d4761c`; measured task commit count is 2.
- Focused Vitest, ESLint, Prettier, Chinese coverage-comment, direct fixture exit, and source/contract token gates passed.
- The live Madge gate was run and correctly failed on the seven approved mixed cycles; this is recorded above rather than hidden or repaired outside plan scope.
