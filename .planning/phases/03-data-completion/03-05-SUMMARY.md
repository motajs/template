---
phase: 03-data-completion
plan: 05
subsystem: data-quality-gates
tags: [typescript, circular-dependencies, vitest, node, madge]

requires:
  - phase: 03-data-completion
    provides: Fixed Node replay verifier, deterministic fixture, and top-level replay registry
  - phase: 03-data-completion
    provides: Four-layer data integration and existing data-side test coverage
provides:
  - Approved common/data-common cycle-closure contract with the exact interface owner decision
  - Repeatable scoped type and transitive circular-dependency gates for the four data packages
  - DATA-01 focused closure tests for enemy, Flag, combat, save/load, trigger/event, and replay behavior
  - Final passing data-suite, Node verifier, type, circular, ESLint, and Prettier evidence
affects: [phase-4-render-adaptation, phase-6-testing]

actuals:
  tokens: 5800
  tasks: 3
  commits: 4
  plan_head_before: f59ab42c4a2a37bbdd6f8b7ee41916459de38001

tech-stack:
  added: []
  patterns:
    - Scoped compiler diagnostics are classified as in-scope or outside-scope and fail closed on unparseable diagnostics
    - Madge traverses all four data entry points plus the transitive common boundary and fails on every in-scope cycle
    - DATA-01 closure tests use explicit state and replay fakes without expanding public contracts

key-files:
  created:
    - .planning/phases/03-data-completion/03-COMMON-CYCLE-CONTRACT.md
    - script/check-data-type.ts
    - script/check-data-circular.ts
    - packages-user/data-state/test/dataClosure.test.ts
  modified:
    - packages/common/src/utils/types.ts
    - packages-user/data-common/src/common/types.ts
    - packages-user/data-common/src/common/face.ts
    - packages-user/data-common/src/store/types.ts
    - packages-user/data-base/src/hero/types.ts
    - packages-user/data-base/src/hero/state.ts
    - packages-user/data-base/src/hero/location.ts
    - packages-user/data-base/src/hero/follower.ts
    - packages-user/data-state/src/enemy/calculator.ts

key-decisions:
  - "IFacedTileLocator now belongs to the existing @user/data-common package; @user/common was not created, and @motajs/common no longer imports data-common for this type."
  - "The 13 current common/data-common cycles are all failures; D-20 covers the four data packages and their transitive common boundary, while unrelated render/legacy-only cycles remain outside scope."
  - "The scoped type gate reports the 27 existing render/legacy diagnostics without treating them as data-package failures."

patterns-established:
  - "Common low-level public types are owned by the lowest existing user data package that needs them, without adding a parallel common package."
  - "Quality gates print explicit scope classification and only pass with zero in-scope failures."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "IFacedTileLocator is owned by @user/data-common, the common back-edge is removed, and scoped type/circular gates pass."
    requirement: DATA-01
    verification:
      - kind: other
        ref: "pnpm exec tsx script/check-data-type.ts"
        status: pass
      - kind: other
        ref: "pnpm exec tsx script/check-data-circular.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "DATA-01 focused closure covers enemy creation/save, Flag save/load, deterministic combat, saveable hero round-trip, trigger/event mutation, and replay order/async/failure behavior."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/dataClosure.test.ts (6 tests)"
        status: pass
      - kind: integration
        ref: "pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state"
        status: pass
    human_judgment: false
  - id: D3
    description: "The independent Node replay verifier and final scoped quality checks pass as fixed non-watch commands."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "pnpm test:data-node"
        status: pass
      - kind: other
        ref: "pnpm exec eslint packages/common/src/logger.ts packages/common/src/utils/types.ts packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state script/check-data-type.ts script/check-data-circular.ts script/test-data-node.ts"
        status: pass
      - kind: other
        ref: "pnpm exec prettier --check packages/common/src/logger.ts packages/common/src/utils/types.ts packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state script/check-data-type.ts script/check-data-circular.ts script/test-data-node.ts"
        status: pass
    human_judgment: false

duration: 25 min
completed: 2026-09-10
status: complete
commits: 4
plan_head_before: f59ab42c4a2a37bbdd6f8b7ee41916459de38001
---

# Phase 3 Plan 5: Data Quality Gates Summary

**Four-package data gates now close the approved common/data-common boundary and provide repeatable DATA-01 closure evidence across Vitest and independent Node replay.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-10
- **Completed:** 2026-09-10
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Recorded the exact user-approved decision to move `IFacedTileLocator` into the existing `@user/data-common` package, with no `@user/common` package and no retained common/data-common back-edge.
- Added scoped TypeScript and Madge circular-dependency gates that classify outside render/legacy diagnostics while failing on all four-package, common/data-common, and transitive common cycles.
- Added six executable DATA-01 closure tests covering enemy, Flag, combat, save/load, trigger/event, and replay behavior.
- Re-ran the complete data Vitest suite, independent Node verifier, scoped gates, ESLint, and Prettier successfully.

## Task Commits

Each task was committed atomically:

1. **Task 1: 批准 common/data-common back-edge 的最小闭环契约** - `86a4385` (docs)
2. **Task 2: 闭合 common/data-common 与剩余数据包循环并建立 scoped gates** - `64b97bc` (fix)
3. **Task 3: 补齐 DATA-01 focused closure 并执行最终门禁** - `232df08` (fix)

Task 2 formatting follow-up: `2794dfc` (style)

## Files Created/Modified

- `.planning/phases/03-data-completion/03-COMMON-CYCLE-CONTRACT.md` - exact approved interface move, 13-cycle failure policy, and D-20 scope
- `packages/common/src/utils/types.ts` - removes the data-common back-edge and old locator owner
- `packages-user/data-common/src/common/types.ts` - owns and exports `IFacedTileLocator`
- `packages-user/data-common/src/common/face.ts` - removes internal barrel back-edges
- `packages-user/data-common/src/store/types.ts` - consumes the local data-common locator type
- `packages-user/data-base/src/hero/{types,state,location,follower}.ts` - imports the locator from data-common
- `script/check-data-type.ts` - scoped vue-tsc diagnostic classifier
- `script/check-data-circular.ts` - four-entry transitive common Madge gate
- `packages-user/data-state/test/dataClosure.test.ts` - six focused DATA-01 closure tests
- `packages-user/data-state/src/enemy/calculator.ts` - uses state flags instead of an unconditional Node-unsafe `core` global

## Decisions Made

- `IFacedTileLocator` is a data-common public type because its `FaceDirection` contract is user-owned; the move preserves the existing shape and export behavior.
- The current 13 common/data-common cycles are explicit failures under D-20. Common-only cycles are not silently allowed; only unrelated render/legacy-only graphs remain outside this plan.
- Existing 27 render/legacy TypeScript diagnostics are printed as outside-scope evidence, not disguised as a clean repository-wide type check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed remaining data-common barrel cycles**

- **Found during:** Task 2 gate execution
- **Issue:** After removing the approved common back-edge, `common/index.ts -> common/face.ts -> common/index.ts` remained in the in-scope graph.
- **Fix:** Changed `face.ts` imports from the common barrel and `.` to the direct `./types` module without changing public exports.
- **Files modified:** `packages-user/data-common/src/common/face.ts`
- **Verification:** `pnpm exec tsx script/check-data-circular.ts` passed with zero cycles.
- **Committed in:** `64b97bc`

**2. [Rule 1 / Rule 2 - Node safety bug] Removed unconditional combat dependency on legacy global `core`**

- **Found during:** Task 3 focused closure execution
- **Issue:** `MainDamageCalculator` evaluated `core.flags.enableNegativeDamage` in Node even for non-negative damage, causing the focused combat assertion to throw `ReferenceError: core is not defined`.
- **Fix:** Read the flag through `handler.state.flags.getFieldValueDefaults()` so the calculation uses the explicit data-state boundary.
- **Files modified:** `packages-user/data-state/src/enemy/calculator.ts`
- **Verification:** focused closure test and complete data suite passed in Node-safe Vitest execution.
- **Committed in:** `232df08`

**3. [Rule 3 - Blocking] Made the type gate executable on Windows and normalized gate formatting**

- **Found during:** Task 2 gate execution
- **Issue:** Direct `spawnSync('pnpm.cmd', ...)` returned `EINVAL`; initial scoped gate files also needed repository Prettier normalization.
- **Fix:** Enabled the Windows shell path for the fixed `pnpm exec vue-tsc` invocation and normalized the scoped gate files.
- **Files modified:** `script/check-data-type.ts`, `packages-user/data-base/src/hero/location.ts`, `packages-user/data-base/src/hero/types.ts`
- **Verification:** scoped type gate, ESLint, and Prettier checks passed.
- **Committed in:** `2794dfc`

---

**Total deviations:** 3 auto-fixed (1 Rule 1/2, 2 Rule 3)
**Impact on plan:** All fixes were directly required for the approved cycle/type gates or Node-safe DATA-01 verification; no unrelated cleanup, new package, or public contract expansion was introduced.

## Issues Encountered

- The scoped type gate reports 27 pre-existing client/render/legacy diagnostics outside the four data-package scope. They are printed and intentionally do not affect the scoped pass result.
- ESLint reports 21 existing/non-blocking `no-console` warnings, including the new gate scripts; there are zero ESLint errors and the required command exits successfully.
- Existing expected test logger output remains visible, including equipment snapshot and replay failure warnings used by the focused tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 Plan 05 is complete with all required data tests and independent Node acceptance green.
- `STATE.md` and `ROADMAP.md` were intentionally not modified, per user instruction.
- The data-side quality boundary is ready for phase-level verification; unrelated render/legacy diagnostics remain explicitly outside D-20 scope.

---
*Phase: 03-data-completion*
*Completed: 2026-09-10*

## Self-Check: PASSED

- Summary file exists on disk.
- Task commits `86a4385`, `64b97bc`, `232df08`, and `2794dfc` are present in git history.
- Required data suite, Node verifier, scoped type/circular gates, ESLint, and Prettier checks passed.
- `STATE.md` and `ROADMAP.md` were not modified.
