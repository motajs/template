---
phase: 03-data-completion
plan: 11
subsystem: data-state-compatibility
tags: [save-system, compatibility, node-regression, data-state]

requires:
  - phase: 03-data-completion
    provides: Existing SaveSystem and compatibility loading path restored by Plan 03-10
provides:
  - Phase-3-only MemorySaveSystem implementation and save-barrel export removed
  - CoreState regression coverage asserting independent existing SaveSystem instances
  - Node replay construction and tracer coverage without a Node-specific save adapter
affects: [03-data-completion, Phase 4 render adaptation, Phase 5 legacy migration]

actuals:
  tokens: 1795
  tasks: 2
  commits: 2
  plan_head_before: 3bd90535a5aa6073079935ae9b0a627a6c3e0f1b
commits: 2

tech-stack:
  added: []
  patterns:
    - CoreState continues to use the existing SaveSystem and compatibility loading callback
    - Node regressions verify independent state construction without a parallel persistence implementation

key-files:
  created: []
  modified:
    - packages-user/data-common/src/save/index.ts
    - packages-user/data-state/test/coreNode.test.ts
    - packages-user/data-state/test/nodeTracer.test.ts
    - .planning/WINDOWS.md
  deleted:
    - packages-user/data-common/src/save/memory.ts

key-decisions:
  - "Followed S-01: remove the Phase-3 save adapter while preserving SaveSystem, compression, registration, and compatibility initialization."
  - "Did not move save to rendering, add a replacement adapter, or modify user-owned @shouldReplay() placement."

patterns-established:
  - "The existing SaveSystem remains the sole CoreState save implementation."
  - "Node tests cover construction and replay behavior without configuring save methods or introducing a test substitute."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "Phase-3 MemorySaveSystem is absent and the save barrel exports only the existing system/types modules."
    requirement: DATA-01
    verification:
      - kind: other
        ref: "Source checks for deleted adapter, barrel export, SaveSystem, and CoreState selection"
        status: pass
    human_judgment: false
  - id: D2
    description: "Independent CoreState construction and Node replay remain covered with the existing SaveSystem."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/coreNode.test.ts"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/test/nodeTracer.test.ts"
        status: pass
      - kind: integration
        ref: "pnpm test:data-node"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-11
status: complete
---

# Phase 3 Plan 11 Summary

**Phase-3 in-memory save adapter removed while CoreState preserves the existing SaveSystem and compatibility initialization path**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-11T06:04:00Z
- **Completed:** 2026-09-11T06:12:47Z
- **Tasks:** 2
- **Files modified:** 5 including the broken-windows ledger update

## Accomplishments

- Deleted `packages-user/data-common/src/save/memory.ts` and removed only its export from the save barrel.
- Preserved `SaveSystem`, `ISaveSystem`, save compression/configuration, saveable registration, and the existing compatibility `coreInit` loading callback in `CoreState`.
- Updated focused Node regressions to assert independent `SaveSystem` instances while retaining construction, independence, and replay behavior coverage.
- Marked the two obsolete MemorySaveSystem stub entries in `.planning/WINDOWS.md` fixed.
- Left `STATE.md` and `ROADMAP.md` untouched, including their unrelated existing working-tree changes.

## Task Commits

Each task was committed atomically:

1. **Task 1: CORR-03-02 remove the Phase-3 save adapter** - `4f606d9` (fix)
2. **Task 2: CORR-03-02 align CoreState and tracer regressions with existing save behavior** - `5a20674` (test)

## Files Created/Modified

- `packages-user/data-common/src/save/index.ts` - Retains only the existing save system and type exports.
- `packages-user/data-common/src/save/memory.ts` - Deleted Phase-3-only in-memory adapter.
- `packages-user/data-state/test/coreNode.test.ts` - Expects the existing SaveSystem for Node construction.
- `packages-user/data-state/test/nodeTracer.test.ts` - Retains independent SaveSystem and replay tracer coverage.
- `.planning/WINDOWS.md` - Closes obsolete adapter-stub entries.

## Decisions Made

- Followed S-01 exactly: save remains on the existing SaveSystem and compatibility loading path.
- Did not migrate save to rendering, add an adapter replacement, or alter user-owned `@shouldReplay()` placement.
- Did not modify `STATE.md` or `ROADMAP.md`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The first final source-gate callback check used an overly strict text pattern; the check was corrected without changing source and the complete plan gate then passed.
- Test output included the existing Browserslist freshness warning; it did not fail any gate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CORR-03-02 is closed: the Phase-3 save adapter is absent and CoreState still selects the existing SaveSystem.
- Plan 03-15 can proceed without any save architecture changes.

---
*Phase: 03-data-completion*
*Completed: 2026-09-11*

## Self-Check: PASSED

- Summary file and all modified test/source files exist.
- Task commits `4f606d9` and `5a20674` are present in git history.
- Final source, focused Vitest, and `pnpm test:data-node` gates passed.
- `STATE.md` and `ROADMAP.md` remain unmodified by this plan.
