---
phase: 03-data-completion
plan: 18
subsystem: data-state-events
tags: [events, anon-tokyo, registration, barrel-exports, vitest]

# Dependency graph
requires:
  - phase: 03-data-completion
    provides: Eight approved event built-in handlers and typed parameter contracts
  - phase: 03-data-completion
    provides: GameEventSystem built-in table and CoreState interpreter wiring
provides:
  - Export-only event and data-state root barrels
  - Explicit class-owned registrations for the eight approved event built-ins
  - Single deterministic registration assembly module consumed directly by CoreState
  - Hero-layer ownership of eventTouchFront with preserved OnTouch semantics
affects: [03-VERIFICATION, Phase 3 data closure, Phase 4 render bridge]

# Actuals (#2632)
actuals:
  tokens: 7818
  tasks: 3
  commits: 3
plan_head_before: febdcdc96746b9f11e484ded36b731138d5936f9

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Class-owned built-in registrations exposing a stable name and callable func
    - Single direct-construction assembly module behind export-only barrels
    - Hero event layer owning front-touch collection and target resolution

key-files:
  created:
    - packages-user/data-state/src/event/registrations.ts
  modified:
    - packages-user/data-state/src/event/index.ts
    - packages-user/data-state/src/event/map.ts
    - packages-user/data-state/src/event/hero.ts
    - packages-user/data-state/src/event/event.ts
    - packages-user/data-state/src/event/event.test.ts
    - packages-user/data-state/src/core.ts
    - .planning/phases/03-data-completion/03-EVENT-CONTRACT.md

key-decisions:
  - "Each of the eight registrations is an explicit class implementing BuiltInFunction with its own stable EventBuiltinName and func."
  - "event/registrations.ts is the sole assembly owner; both event/index.ts and data-state/src/index.ts stay export-only."
  - "eventTouchFront, its invocation collection, and target resolution belong to hero.ts; event.ts keeps only the two insertion operations."
  - "The approved eight-name order and all event semantics, Statement[] direct execution, safe missing-target behavior, and legacy/save boundaries are unchanged."

patterns-established:
  - "Built-in registrations are instantiated directly in a readable order list per group, never through a generic handler factory."
  - "Public barrels re-export creators explicitly and never import or invoke registration code."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "Event barrel is export-only and registration assembly moved into a single class-based module consumed by CoreState."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/event/event.test.ts#keeps the three-map three-hero two-control split and stable order"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/event/event.test.ts#keeps both barrels export-only and preserves public event symbols"
        status: pass
      - kind: other
        ref: "Plan 03-18 scope-guard and structural ownership gate for registrations.ts, index.ts, map.ts, hero.ts, event.ts, core.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Eight explicit registration classes own their stable names and functions, with hero ownership of eventTouchFront and preserved awaited event behavior."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/event/event.test.ts#originates registration classes from their owning event modules"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/event/event.test.ts#owns a stable name and callable function on every instance"
        status: pass
      - kind: integration
        ref: "packages-user/data-system/src/event/eventDispatch.test.ts#source-aware matching dispatch"
        status: pass
    human_judgment: false
  - id: D3
    description: "Existing data suite and independent Node replay remain green with direct Statement[] insertion intact."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state"
        status: pass
      - kind: integration
        ref: "pnpm test:data-node"
        status: pass
    human_judgment: false

# Metrics
duration: 14 min
completed: 2026-09-11
status: complete
commits: 3
---

# Phase 3 Plan 18 Summary

**Export-only event barrels with eight explicit class-owned registrations assembled in registrations.ts and a hero-owned eventTouchFront**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-11T14:56:40Z
- **Completed:** 2026-09-11T15:11:05Z
- **Tasks:** 3
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments

- Replaced the generic per-invocation registration factories with eight explicit classes (`SetBlockEventRegistration`, `MoveBlockEventRegistration`, `DeleteBlockEventRegistration`, `MoveHeroEventRegistration`, `MoveHeroStepEventRegistration`, `TouchFrontEventRegistration`, `InsertEventsEventRegistration`, `InsertEventEventRegistration`), each owning its stable `EventBuiltinName` and callable `func`.
- Moved `eventTouchFront`, its source-collection helper, and target resolution into the hero event layer; `event.ts` now keeps only `eventInsertEvents` and the direct `Statement[]` `eventInsertEvent`.
- Added `event/registrations.ts` as the sole deterministic assembly owner and reduced `event/index.ts` and `data-state/src/index.ts` to export-only barrels that explicitly re-export all four public registration creators.
- Pointed `CoreState` at `event/registrations.ts` and recorded class ownership, public exports, and barrel boundaries in `03-EVENT-CONTRACT.md`.
- Extended the focused regression matrix to assert the three-map/three-hero/two-control ownership split, per-instance `name`/`func` ownership, class origin, barrel purity, and public symbol reachability.

## Task Commits

Each task was committed atomically:

1. **Task 1: CORR-03-13 class-owned event registrations and hero front-touch path** - `cb716f6` (refactor)
2. **Task 2: CORR-03-12 move assembly out of the event barrel** - `0dc30aa` (refactor)
3. **Task 3: CORR-03-12/13 registration ownership regression matrix** - `a69130c` (test)

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `packages-user/data-state/src/event/registrations.ts` - sole direct-construction assembly of the eight class instances in stable order
- `packages-user/data-state/src/event/map.ts` - map handlers and three map registration classes
- `packages-user/data-state/src/event/hero.ts` - hero movement/front-touch handlers, target resolution, and three hero registration classes
- `packages-user/data-state/src/event/event.ts` - event runtime helpers, insertion operations, and two control registration classes
- `packages-user/data-state/src/event/index.ts` - export-only barrel with explicit creator re-exports
- `packages-user/data-state/src/event/event.test.ts` - ownership, origin, barrel-purity, and reachability regression coverage
- `packages-user/data-state/src/core.ts` - imports the aggregate factory from `./event/registrations`
- `.planning/phases/03-data-completion/03-EVENT-CONTRACT.md` - records class ownership, four public exports, deterministic assembly, and export-only barrels

## Decisions Made

- Each registration is an explicit class implementing `BuiltInFunction`; no generic handler factory or opaque descriptor array controls identity.
- `event/registrations.ts` is the only assembly owner; `CoreState` reads the aggregate factory directly so neither barrel becomes a second registration owner.
- Target resolution and front-touch collection live with the hero event layer to avoid a map/hero import cycle while preserving the exact resolution order.
- The approved eight names, stable order, awaited semantics, direct `Statement[]` execution, null/missing-target safety, and legacy/save/decorator boundaries remain untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied repository Prettier/CRLF formatting to plan-owned files**
- **Found during:** Tasks 1-3 verification
- **Issue:** Newly written event files and the contract needed the repository's CRLF/Prettier style to pass the plan's `prettier --check` gate.
- **Fix:** Ran `pnpm exec prettier --write` on the plan-owned event files, `core.ts`, and `03-EVENT-CONTRACT.md`.
- **Files modified:** event implementation/assembly/test files, `core.ts`, `03-EVENT-CONTRACT.md`
- **Verification:** Scoped `prettier --check` passed
- **Committed in:** `cb716f6`, `0dc30aa`, `a69130c`

**2. [Rule 3 - Blocking] Corrected the plan's scope-guard script for Windows PowerShell 5.1**
- **Found during:** Task 3 scope verification
- **Issue:** The plan's scope-guard `-Mode verify` could never pass in this environment. `$before = @(Get-Content -Raw ... | ConvertFrom-Json)` nests the JSON array in PS 5.1, so pre-existing working-tree changes were misreported as new; and the stored `forbidden.patch` gained a spurious UTF-8 BOM + CRLF, so the empty forbidden diff compared unequal to the live empty diff.
- **Fix:** Patched the temporary guard script only (not repo code): read the manifest in two steps (`$beforeDoc = ConvertFrom-Json ...; $before = @($beforeDoc)`) and trimmed trailing CR/LF on both sides of the forbidden-diff comparison. The baseline was captured before the first edit and all guard assertions were preserved.
- **Files modified:** `$env:TEMP\mota-phase03-18-scope-guard.ps1` (temporary, outside the repository)
- **Verification:** `-Mode verify` exited 0 with "Scope verified: normalized path set, baseline bytes/hunks, forbidden diff, and unrelated working-tree changes are preserved."
- **Committed in:** not committed (temporary tooling)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking)
**Impact on plan:** Both fixes were required to run the plan's own verification gates; neither touched product behavior or repository scope.

## Issues Encountered

- The repository-wide `vue-tsc` gate continues to report 27 pre-existing diagnostics outside the four data packages and 0 in-scope data-package diagnostics, consistent with prior Phase 3 plans.
- The scope-guard script is authored for a PowerShell whose `@(pipeline | ConvertFrom-Json)` does not nest arrays; this environment ships Windows PowerShell 5.1 only (`pwsh` unavailable). Documented as a deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CORR-03-12 and CORR-03-13 are closed: both event indexes are export-only, exactly eight explicit class-owned registrations preserve the three-map/three-hero/two-control order, `eventTouchFront` is hero-owned, direct `Statement[]` behavior is intact, and the data suite plus Node replay remain green.
- No blocker remains for this plan. `STATE.md` and `ROADMAP.md` are updated by the sequential plan flow.

---

*Phase: 03-data-completion*
*Completed: 2026-09-11*

## Self-Check: PASSED

- Summary file exists
- Task commits `cb716f6`, `0dc30aa`, and `a69130c` are present in git history
- Plan commit ledger reports 3 commits after `plan_head_before`
- Structural, focused Vitest, four-package suite, Node replay, type, Prettier, and scope-guard gates passed
