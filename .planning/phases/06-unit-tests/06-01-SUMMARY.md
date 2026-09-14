---
phase: 06-unit-tests
plan: 01
subsystem: testing
tags: [vitest, unit-test, combat, damage, map-damage, enemy-context, combat-flow, data-system, node]

requires: []
provides:
  - "Layer-2 combat behavior coverage: DamageContext/DamageSystem, MapDamage, EnemyContext, CombatFlow"
  - "Node combat test harness pattern (vi.hoisted global stub + dynamic module bag + inline fakes + real-timer await)"
  - "COVERAGE.md api-coverage declaration and the shared 06-TEST-FINDINGS.md sink with #06-01-1..3 findings"
affects: [06-unit-tests, 06-02, 06-03, 06-08]

actuals:
  tokens: 15725
  tasks: 3
  commits: 6
  plan_head_before: 3bcf2fc40761989238aeacfdbeb5b6c84a64642b

tech-stack:
  added: []
  patterns:
    - "vi.hoisted global stub (main/location + Map.getOrInsert/getOrInsertComputed polyfill) + beforeAll dynamic module bag"
    - "Inline per-file fake collaborators; data-layer interfaces are never mocked"
    - "Real timers + manual deferred resolver for async combat ordering; logger.catch for warn-code assertions"
    - "Suspected bug -> correct-expectation test marked it.skip plus a Chinese pointer to 06-TEST-FINDINGS.md #06-01-N"

key-files:
  created:
    - packages-user/data-system/src/combat/damage.test.ts
    - packages-user/data-system/src/combat/mapDamage.test.ts
    - packages-user/data-system/src/combat/context.test.ts
    - packages-user/data-system/src/combat/combat.test.ts
    - .planning/phases/06-unit-tests/COVERAGE.md
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md
  modified: []

key-decisions:
  - "TEST-01 contribution for this plan = behavior unit tests over the combat Layer-2 contract, gated by `pnpm test:ci` green (D-01/D-08)"
  - "Three suspected bugs are recorded, not fixed: calculateCritical info/nextValue mismatch; MapDamage.deleteEnemy leaves sourced damage; CombatFlow.before truthy/falsy semantics inverted vs the interface doc"
  - "Map.getOrInsert polyfill added alongside getOrInsertComputed because EnemyContext uses it under Node"
  - "Effect-registry add/remove is asserted through observable buildup behavior because the registries have no public getter"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "DamageContext/DamageSystem behavior coverage (result spread, handler identity, warns 106/107, cache hit/invalidation, with(hero), calculateCritical)"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/damage.test.ts#DamageContext behaviour"
        status: pass
    human_judgment: false
  - id: D2
    description: "MapDamage behavior coverage (sourceless add/delete, sourced conversion, reduction caching, union, warns 102/103/104)"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/mapDamage.test.ts#MapDamage sourced conversion and reduction"
        status: pass
    human_judgment: false
  - id: D3
    description: "EnemyContext behavior coverage (register/lookup/unknown-null/delete/resize/scan/iterate, effect-registry add/remove)"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/context.test.ts#EnemyContext registry"
        status: pass
    human_judgment: false
  - id: D4
    description: "CombatFlow behavior coverage (same-state binding, warn 138, script priority sort/duplicate 140, guard warns 139/141, awaited ordering, truthy short-circuit)"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/combat.test.ts#CombatFlow async ordering"
        status: pass
    human_judgment: false
  - id: D5
    description: "Suspected-bug findings #06-01-1..3 triaged by the user (fix core code, amend interface contract, or defer)"
    verification: []
    human_judgment: true
    rationale: "The three skipped tests encode the expected contract against the current implementation; per D-05/D-07 only the user can decide whether to repair core code or amend the interface contract, and no core source is modified in this phase."

duration: 9min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 01: Combat Layer-2 Unit Tests Summary

**Behavior unit tests for the `data-system` combat Layer-2 contract (DamageContext/DamageSystem, MapDamage, EnemyContext, CombatFlow) proven end-to-end in Node, surfaced 3 suspected bugs**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-14T00:43:36Z
- **Completed:** 2026-09-14T00:52:20Z
- **Tasks:** 3
- **Files modified:** 6 created (4 test files + 2 planning artifacts), 0 production files touched

## Accomplishments

- Tracer proved the whole Node combat test path (`vi.hoisted` global stub, dynamic module bag, inline fake `IEnemyContext`/`IDamageCalculator`, `logger.catch` warn assertions, real-timer async) on `damage.test.ts` before any expansion.
- Full Layer-2 combat behavior covered: warn codes 106/107 (damage), 102/103/104 (map damage), 138/139/140/141 (combat flow), plus cache invalidation, `with(hero)`, critical generation and the documented script/hook execution order.
- Opened the shared `06-TEST-FINDINGS.md` sink with the D-06 schema and recorded three suspected bugs (`#06-01-1`..`#06-01-3`) as correct-expectation `it.skip` tests; `pnpm test:ci` stayed green (23 files, 153 passed, 3 documented skips).
- Declared `COVERAGE.md`: this test-only phase adds no external API integration.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tracer — DamageContext/DamageSystem behavior end-to-end (+ phase scaffolding)** - `59b709e` (test)
2. **Task 1 harness fix: Map.getOrInsert polyfill for the combat test harness** - `15f329b` (test)
3. **Task 2: MapDamage + EnemyContext behavior** - `484da2d` (test)
4. **Task 3: CombatFlow binding, script ordering, and battle flow** - `6c8f85a` (test)

**Plan metadata:** (final docs commit, recorded in STATE.md/ROADMAP.md)

## Files Created/Modified

- `packages-user/data-system/src/combat/damage.test.ts` - DamageContext/DamageSystem behavior + calculateCritical
- `packages-user/data-system/src/combat/mapDamage.test.ts` - MapDamage sourceless/sourced damage, reducer caching, warns 102/103/104
- `packages-user/data-system/src/combat/context.test.ts` - EnemyContext registry, resize/scan/iterate, effect-registry add/remove
- `packages-user/data-system/src/combat/combat.test.ts` - CombatFlow binding, script ordering/duplication, guard warns, awaited order
- `.planning/phases/06-unit-tests/COVERAGE.md` - api-coverage declaration for the test-only phase
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` - shared append-only findings sink with the `#06-01` section

## Decisions Made

- Treated TEST-01 as satisfied by behavior tests over the seven in-scope data-layer systems, gated by `pnpm test:ci` (the plan's flagged, unverified assumption).
- Wrote the three suspected-bug tests to the correct expectation and marked them `it.skip` (never weakened into passing), each with a Chinese comment pointing at its `#06-01-N` findings entry.
- Asserted effect-registry add/remove through observable `buildup()` behavior instead of a public getter, because `EnemyContext` exposes no registry accessors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing `Map.getOrInsert` polyfill under Node**

- **Found during:** Task 2 (EnemyContext effect registries)
- **Issue:** `EnemyContext.registerCommonQueryEffect` / `registerSpecialQueryEffect` call `Map.prototype.getOrInsert`, which does not exist in Node; only `getOrInsertComputed` was polyfilled by the existing harness pattern, so `context.test.ts` failed to load.
- **Fix:** Added a `Map.prototype.getOrInsert` stub next to the existing `getOrInsertComputed` stub in the combat test harness (uniform across all four files).
- **Files modified:** `context.test.ts`, `damage.test.ts` (harness-only)
- **Verification:** Focused vitest run green; full `pnpm test:ci` green.
- **Committed in:** `15f329b` (harness fix), folded into `484da2d`/`6c8f85a`

**2. [Rule 3 - Blocking] Cannot `extends` a dynamically imported class**

- **Found during:** Task 2 (mapDamage fixture)
- **Issue:** `class FakeRange extends modules.BaseRange` evaluated at module load, before `beforeAll` assigned the dynamic module bag, so `modules.BaseRange` was `undefined`.
- **Fix:** Replaced the `BaseRange` subclass with a small local `IFakeRange` implementation exposing only `bindHost`/`iterateLoc`, with a single narrow cast in `FakeView.getRange()`.
- **Files modified:** `mapDamage.test.ts`
- **Verification:** Focused vitest run green for `mapDamage.test.ts`.
- **Committed in:** `484da2d` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were test-harness-only fixes; no production source changed and no scope creep.

## Issues Encountered

- Commit staging: the first Task 2 commit accidentally swept in the Task 2 files under a harness-fix message. Corrected with `git reset --soft HEAD~1` (no working-tree change) and re-committed the harness fix and Task 2 separately.

## Known Stubs

None. Three `it.skip` tests are intentional D-05 markers for suspected bugs, tracked in `06-TEST-FINDINGS.md` (`#06-01-1` calculateCritical `info`/`nextValue` mismatch; `#06-01-2` `MapDamage.deleteEnemy` leaves sourced damage because `viewStore`/`damageStore` are never populated; `#06-01-3` `CombatFlow` short-circuits on truthy `before`, contradicting the interface doc's `false` semantics).

## Next Phase Readiness

- The combat Layer-2 contract is covered and green; later plans (06-02 `data-state/src/enemy`, 06-03 `data-base/src/enemy`, 06-08 `CoreState` integration) can reuse the established harness and append their own `#06-0X` findings sections.
- Open input for the user: triage the three `#06-01-N` findings (fix core code vs. amend the interface contract). Per D-07 no core code was modified in this phase.

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*

## Self-Check: PASSED

- Created files verified present: `damage.test.ts`, `mapDamage.test.ts`, `context.test.ts`, `combat.test.ts`, `COVERAGE.md`, `06-TEST-FINDINGS.md`, `06-01-SUMMARY.md`.
- Task commits verified in history: `59b709e`, `15f329b`, `484da2d`, `6c8f85a`, plus metadata `6cf828c`.
- Focused runs and full `pnpm test:ci` green (23 files, 153 passed, 3 documented skips).
