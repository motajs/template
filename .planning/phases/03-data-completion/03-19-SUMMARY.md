---
phase: 03-data-completion
plan: 19
subsystem: data-state-documentation
tags: [jsdoc, typescript-ast, replay, events, vitest]

# Dependency graph
requires:
  - phase: 03-data-completion
    provides: S-05 awaited replay movement/pathfinding command contracts (03-17)
  - phase: 03-data-completion
    provides: Export-only event barrels with class-owned registrations (03-18)
provides:
  - Multiline JSDoc for every touched replay and event top-level function and class method
  - Declaration-aware script/check-touched-jsdoc.ts scanner with explicit constructor exemptions
  - Structural regression evidence that the JSDoc cleanup preserved replay/event behavior
affects: [03-VERIFICATION, Phase 3 data closure, Phase 4 render bridge]

# Actuals (#2632)
actuals:
  tokens: 4616
  tasks: 2
  commits: 2
plan_head_before: b1b9603ff676835330fd90e0109c95c460bc47b6

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TypeScript-AST declaration inventory that enumerates top-level functions, class methods, and constructors
    - Constructors reported as explicit exemptions while every other declaration must carry multiline JSDoc
    - Multiline JSDoc normalization scoped to correction-owned replay/event files only

key-files:
  created:
    - script/check-touched-jsdoc.ts
  modified:
    - packages-user/data-state/src/replay/commands.ts
    - packages-user/data-state/src/event/map.ts
    - packages-user/data-state/src/event/hero.ts
    - packages-user/data-state/src/event/event.ts
    - packages-user/data-state/src/event/registrations.ts

key-decisions:
  - "The scanner derives its inventory from the passed files: top-level function declarations plus class methods, with ConstructorDeclaration nodes enumerated and explicitly exempt."
  - "Multiline means the JSDoc opener is alone on its line and the closing marker is on its own line, so single-line /** ... */ forms fail the audit."
  - "JSDoc work is limited to the replay/event correction files; legacy, save, render, and user-owned decorator placements are untouched."
  - "appendMoveSteps regained an accurate description (appends steps only), separating it from startHeroMove which owns starting and awaiting."

patterns-established:
  - "Documentation audits are structural (TypeScript AST) instead of regex-based, so class methods and constructors are classified explicitly."
  - "Touched-function JSDoc normalization is proven by a scoped Prettier gate plus the scanner rather than a whole-file reformat."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "Every touched non-constructor replay/event top-level function and class method has multiline JSDoc while constructors are explicitly exempt."
    requirement: DATA-01
    verification:
      - kind: other
        ref: "pnpm exec tsx script/check-touched-jsdoc.ts packages-user/data-state/src/replay/commands.ts packages-user/data-state/src/event/map.ts packages-user/data-state/src/event/hero.ts packages-user/data-state/src/event/event.ts packages-user/data-state/src/event/registrations.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Declaration-aware scanner reports the fully-qualified inventory, labels constructors exempt, and fails any other declaration without multiline JSDoc."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "script/check-touched-jsdoc.ts (43-declaration inventory over five correction files, 5 constructors exempt)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Corrected replay/event behavior, Chinese test comments, data suite, Node replay, type gate, formatting, and scope boundaries remain green."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts (14 tests) and packages-user/data-state/src/event/event.test.ts + packages-user/data-system/src/event/eventDispatch.test.ts (32 focused tests)"
        status: pass
      - kind: integration
        ref: "pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state (18 files, 107 tests)"
        status: pass
      - kind: integration
        ref: "pnpm test:data-node"
        status: pass
      - kind: other
        ref: "pnpm exec tsx script/check-data-type.ts (zero in-scope diagnostics) and scope-guard -Mode verify"
        status: pass
    human_judgment: false

# Metrics
duration: 8 min
completed: 2026-09-12
status: complete
commits: 2
---

# Phase 3 Plan 19 Summary

**Multiline JSDoc normalization for every touched replay/event declaration, enforced by a TypeScript-AST scanner that explicitly exempts constructors**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-12T05:18:41Z
- **Completed:** 2026-09-12T05:26:23Z
- **Tasks:** 2
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- Converted every touched replay and event top-level function and non-constructor class method JSDoc into multiline form across `commands.ts`, `map.ts`, `hero.ts`, `event.ts`, and `registrations.ts`.
- Added `script/check-touched-jsdoc.ts`, a declaration-aware TypeScript-AST scanner that prints the fully-qualified 43-declaration inventory, labels the five constructors as explicitly exempt, and fails any other declaration without multiline JSDoc.
- Corrected the stale `appendMoveSteps` description while leaving `startHeroMove`'s awaited-movement wording intact, so the two replay/event movement helpers read accurately.
- Preserved the S-05 awaited replay command contracts, export-only barrels, class-owned registration order, direct `Statement[]` insertion, hero front-touch ownership, and the Chinese single-line coverage comments before every `it` call.

## Task Commits

Each task was committed atomically:

1. **Task 1: CORR-03-14 replay documentation and ordering audit** - `cabee3c` (style)
2. **Task 2: CORR-03-14 event documentation and phase gates** - `521413f` (style)

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `script/check-touched-jsdoc.ts` - declaration-aware AST scanner with constructor exemptions and multiline-JSDoc enforcement
- `packages-user/data-state/src/replay/commands.ts` - multiline JSDoc for helpers, the five command classes (methods), and the two registry exports
- `packages-user/data-state/src/event/map.ts` - multiline JSDoc for the three map event functions
- `packages-user/data-state/src/event/hero.ts` - multiline JSDoc for target resolution, step append/start, movement, invocation collection, and front-touch functions
- `packages-user/data-state/src/event/event.ts` - multiline JSDoc for the runtime, invocation filter, and insertion functions
- `packages-user/data-state/src/event/registrations.ts` - multiline JSDoc for the four registration-assembly functions

## Decisions Made

- The scanner treats "touched" as "declared in the correction-owned files" and requires multiline JSDoc from all non-constructor declarations, so it cannot silently skip a newly touched method.
- Constructor JSDoc stays absent per `dev.md`; the scanner enumerates and labels them `EXEMPT` instead of silently ignoring them.
- No test-file edits were needed: both `commands.test.ts` and `event.test.ts` already carried a Chinese coverage comment immediately before every `it`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Patched the temporary scope-guard script for Windows PowerShell 5.1**
- **Found during:** Task 1 scope capture
- **Issue:** The plan's `-Mode capture`/`-Mode verify` script exited non-zero in this environment: native git stderr (the CRLF warning) was surfaced as a terminating `NativeCommandError`, `@(Get-Content -Raw ... | ConvertFrom-Json)` nested the JSON array, and `Set-Content -Encoding UTF8` added a BOM plus CRLF to `forbidden.patch` so the empty forbidden diff compared unequal.
- **Fix:** Patched only the temporary script at `$env:TEMP\mota-phase03-19-scope-guard.ps1` (outside the repository): relaxed `$ErrorActionPreference` to `Continue` with explicit `$LASTEXITCODE` checks retained, read the manifest in two steps, and trimmed BOM/CRLF on both sides of the forbidden-diff comparison. The baseline was captured before the first edit and every guard assertion was preserved.
- **Files modified:** `$env:TEMP\mota-phase03-19-scope-guard.ps1` (temporary, not committed)
- **Verification:** `-Mode capture` and `-Mode verify` both exited 0 with no warning pollution in the saved hunks.
- **Committed in:** not committed (temporary tooling)

**2. [Rule 2 - Documentation accuracy] Corrected the stale `appendMoveSteps` JSDoc**
- **Found during:** Task 2 (event documentation)
- **Issue:** `appendMoveSteps` shared the `启动勇士移动并等待其完整结束` description with `startHeroMove`, but it only appends steps and never starts or awaits movement.
- **Fix:** Gave it an accurate multiline description (`将移动步骤按顺序追加到移动器，不启动移动`) while keeping `startHeroMove`'s awaited-movement comment.
- **Files modified:** `packages-user/data-state/src/event/hero.ts`
- **Verification:** `check-touched-jsdoc.ts`, focused Vitest, and Prettier all pass
- **Committed in:** `521413f`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 documentation accuracy)
**Impact on plan:** Both were required to run the plan's own gates or to keep the JSDoc accurate; neither changed runtime behavior or repository scope.

## Issues Encountered

- The plan's scope-guard and native git stderr behavior remain the same Windows PowerShell 5.1 caveat documented by plans 03-17 and 03-18; the patched temporary script reproduced the same baseline/bytes/hunk/forbidden checks and passed.
- The repository-wide `vue-tsc` gate continues to report pre-existing diagnostics outside the four data packages and 0 in-scope data-package diagnostics, consistent with prior Phase 3 plans.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CORR-03-14 is closed: all touched replay/event declarations are multiline-documented, constructors are explicitly exempted, and the scanner plus scoped Prettier gate prevent regression.
- All Phase 3 plans (03-01 through 03-19) now have summaries; no blocker remains for Phase 3 verification. `STATE.md`, `ROADMAP.md`, and `REQUIREMENTS.md` are updated by the sequential plan flow.

---

*Phase: 03-data-completion*
*Completed: 2026-09-12*

## Self-Check: PASSED

- Summary file exists at `.planning/phases/03-data-completion/03-19-SUMMARY.md`
- Task commits `cabee3c` and `521413f` are present in git history
- Plan commit ledger (`plan_head_before: b1b9603...`) measures exactly 2 commits
- Scanner, focused Vitest, full data suite, Node replay, type, Prettier, and scope-guard gates passed
