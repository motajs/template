---
phase: 03-data-completion
plan: 03
subsystem: data-state-replay
tags: [replay, async, pathfinding, vitest, node]

requires:
  - phase: 03-data-completion
    provides: Node-safe CoreState construction, approved event built-ins, and awaited movement tracer
provides:
  - Stable top-level replay enum codes 0 through 7 in the approved D-25 order
  - Async-safe replay safety collection lifecycle and nested Promise coverage
  - Default replay command items for movement, pathfinding, item, and equipment actions
  - Independent CoreState-owned ReplaySystem and bound PathfindingSystem assembly
affects: [03-04, 03-05, phase-4-render-adaptation]

plan_head_before: dc7716c1451a8fcd8bf44e41872b8bffdb296a08
commits: 4
actuals:
  tokens: 9130
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - Stable numeric replay codes are owned by a top-level enum and validated before registration
    - Replay command items expose module behavior while CoreState owns final registry assembly
    - Async replay decorators restore collection context only after returned Promise settlement

key-files:
  created:
    - .planning/phases/03-data-completion/03-REPLAY-CONTRACT.md
    - packages-user/data-state/src/replay/types.ts
    - packages-user/data-state/src/replay/commands.ts
    - packages-user/data-state/src/replay/index.ts
    - packages-user/data-state/src/replay/commands.test.ts
  modified:
    - packages-user/data-common/src/replay/func.ts
    - packages-user/data-common/src/replay/index.ts
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/src/index.ts
    - .planning/WINDOWS.md

key-decisions:
  - "ReplayCommandCode uses stable values 0 through 7 for up, right, down, left, auto-pathfind-to-point, use-item, equip, and unequip respectively."
  - "CoreState owns the independent ReplaySystem and hero-bound PathfindingSystem; ICoreState is not expanded."
  - "Movement and pathfinding commands await controller.onEnd, while synchronous item/equipment results are converted to explicit replay booleans."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "The replay contract records stable enum codes, exact registration order, top-level ownership, CoreState/Node access boundaries, and controller.onEnd completion semantics."
    requirement: DATA-01
    verification:
      - kind: other
        ref: "contract token/order verification for .planning/phases/03-data-completion/03-REPLAY-CONTRACT.md"
        status: pass
    human_judgment: false
  - id: D2
    description: "Async-safe replay decorators and eight default command implementations cover deferred movement/pathfinding, nested collection, parameter validation, and explicit failure results."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/replay/commands.test.ts#replay commands and replay safety decorators"
        status: pass
      - kind: unit
        ref: "pnpm exec vitest run packages-user/data-state/src/replay/commands.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fresh CoreState instances independently assemble all eight stable replay commands and the hero-bound pathfinding system."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/src/replay/commands.test.ts#assembles an independent top-level registry for every CoreState"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state"
        status: pass
    human_judgment: false

duration: 16 min
completed: 2026-09-10
status: complete
---

# Phase 3 Plan 3 Summary

**Stable eight-command replay registry with awaited movement/pathfinding actions and Promise-safe replay safety collection**

## Performance

- **Duration:** 16 min of implementation after checkpoint approval
- **Started:** 2026-09-10T08:30:00Z
- **Completed:** 2026-09-10T08:46:05Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Recorded and implemented the stable numeric replay enum: `Up=0`, `Right=1`, `Down=2`, `Left=3`, `AutoPathfindToPoint=4`, `UseItem=5`, `Equip=6`, and `Unequip=7`
- Extended replay safety decorators so asynchronous collection context survives deferred nested actions and resets cleanly after collection completion
- Added validated default command items with awaited mover/pathfinding controllers and explicit false results for invalid or failed item/equipment actions
- Bound an independent `PathfindingSystem` and `ReplaySystem` to every fresh `CoreState`, with top-level ordered registration and duplicate-code rejection

## Task Commits

Each task was committed atomically:

1. **Task 1: 固化 replay 数值码与 top-level replay 访问边界** - `d909e97` (docs)
   - Formatting follow-up: `97ab1fc` (docs)
2. **Task 2: async-safe replay decorators 与模块默认 command items** - `e771489` (feat)
3. **Task 3: CoreState 顶层注册八个稳定 replay commands** - `0948145` (feat)

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `.planning/phases/03-data-completion/03-REPLAY-CONTRACT.md` - approved stable code/order and access-boundary record
- `packages-user/data-common/src/replay/func.ts` - Promise-aware collection restoration and lifecycle reset
- `packages-user/data-common/src/replay/index.ts` - replay function/system barrel exports
- `packages-user/data-state/src/replay/types.ts` - stable enum, command item, and state access contracts
- `packages-user/data-state/src/replay/commands.ts` - eight default command implementations and guarded registration
- `packages-user/data-state/src/replay/commands.test.ts` - async, failure, order, duplicate, and independent-assembly tests
- `packages-user/data-state/src/replay/index.ts` - replay module barrel
- `packages-user/data-state/src/core.ts` - CoreState pathfinding and replay assembly
- `packages-user/data-state/src/index.ts` - data-state replay barrel export

## Decisions Made

- The stable replay numeric values follow the approved registration order and are owned only by `ReplayCommandCode`.
- The concrete `CoreState` exposes replay/pathfinding assembly seams without changing the user-owned `ICoreState` interface.
- Replay commands preserve the existing `Promise<boolean>` interface; Plan 04 remains responsible for verifier-local first-divergence diagnostics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Exposed replay decorator and system primitives through the data-common replay barrel**

- **Found during:** Task 2
- **Issue:** The existing replay barrel exported only arrays, sandbox, and types, so the replay safety decorators and system implementation were not consumable through the package boundary used by the new replay tests and assembly.
- **Fix:** Exported `func.ts` and `system.ts` from `data-common/src/replay/index.ts` without introducing another registration owner.
- **Files modified:** `packages-user/data-common/src/replay/index.ts`
- **Verification:** Focused replay test and full four-package data suite passed
- **Committed in:** `e771489`

---

**Total deviations:** 1 auto-fixed (1 Rule 2 missing critical functionality)
**Impact on plan:** The export closes the declared replay package boundary without changing public replay command or `ICoreState` contracts.

## Known Stubs

- `packages-user/data-state/src/core.ts:166` — Existing deferred serialized event registration and map-event-id binding TODO; this plan preserves the prior Phase 1/3 deferral and does not add a public registration API. Recorded in `.planning/WINDOWS.md` as entry 14.

## Issues Encountered

- The repository-wide `pnpm exec vue-tsc --noEmit` remains non-zero on pre-existing client, legacy-plugin, and legacy-ui diagnostics. No diagnostics were reported in the changed replay/CoreState files; this remains outside Plan 03-03 scope and is not a blocker for the plan's required Vitest gates.
- Focused ESLint passed with three existing `no-console` warnings in `replay/func.ts`'s diagnostic logging; there were no lint errors.
- Expected logger output from the replay safety test confirms the diagnostic path and does not fail the suite.

## Verification

- PASS: contract token/order verification for `03-REPLAY-CONTRACT.md`
- PASS: `pnpm exec vitest run packages-user/data-state/src/replay/commands.test.ts` — 9 tests
- PASS: `pnpm exec vitest run packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` — 15 files, 84 tests
- PASS: scoped Prettier check
- PASS: scoped ESLint with no errors
- PASS: changed-file type diagnostics absent from `pnpm exec vue-tsc --noEmit` output
- DEFERRED: repository-wide type gate due to pre-existing out-of-scope client/legacy diagnostics

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03-04 can consume the stable command enum, CoreState-owned replay registry, concrete Node factory, and awaited pathfinding boundary.
- Plan 03-04 must preserve the recorded code/order contract and use verifier-local diagnostics without changing `IReplayCommand.execute(): Promise<boolean>`.
- `STATE.md` and `ROADMAP.md` were intentionally not modified per user instruction.

---
*Phase: 03-data-completion*
*Completed: 2026-09-10*

## Self-Check: PASSED

- Contract, replay module, CoreState, and test files exist on disk
- Task commits `d909e97`, `e771489`, `0948145`, and formatting follow-up `97ab1fc` are present in git history
- Focused replay and full four-package data suites passed
