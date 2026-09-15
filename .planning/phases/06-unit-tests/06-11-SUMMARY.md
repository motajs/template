---
phase: 06-unit-tests
plan: 11
subsystem: testing
tags: [vitest, unit-tests, data-base, hero, map, equipment, map-layer, gap-fill]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 06-05 hero coverage (equipment store/attribute) and 06-06 map coverage (MapState/GameMap/MapLayer) whose review gaps this plan closes
provides:
  - G-06-05-A multi-slot simultaneous equip → merged final attribute (weapon + armor)
  - G-06-06-A static→dynamic→move→static full chain with both keepEvent branches verified after movement
  - G-06-06-B content generation and read-back on a floor created by MapState.createMap
  - G-06-06-C multiple coexisting layers of different zIndex with independent data and per-zIndex compareWith
  - 06-COVERAGE-MAP.md 06-11 gap-fill section (create-or-append)
affects: [06-12, 06-13, verify-work, milestone v1.0 audit]

actuals:
  tokens: 1832
  tasks: 3
  commits: 3

plan_head_before: 7cb1aaec92ce0284287e6cfca8fe7d2c8152af1d
commits: 3

tech-stack:
  added: []
  patterns:
    - "Stage gate (D-43): component → combination → full/integration, focused run green before the next stage starts"
    - "Real timers + await controller.onEnd for async dynamic-tile movement (D-04)"
    - "Pre-materialize the source StaticTile via layer.getTile(0,0) before transferToDynamic so the dynamic tile inherits the default events"
    - "Exact expected values for event maps (toEqual(new Map([...]))) instead of loose checks"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/hero/equipment.test.ts
    - packages-user/data-base/src/map/mapState.test.ts
    - packages-user/data-base/src/map/gameMap.test.ts
    - packages-user/data-base/src/map/mapLayer.test.ts
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md

key-decisions:
  - "G-06-06-A keeps the plan's corrected expectation that keepEvent=false re-derives defaults from the written-back block num (1 → [[10,'base-event']]), not from the target cell's original block 2 ([[20,'alternate-event']])"
  - "G-06-06-C reference arrays must equal each layer's current content including non-zero cells, otherwise per-zIndex compareWith would mark clean layers dirty"
  - "Used `const result = logger.catch(...)` + `result.ret` instead of a single object destructure, per dev.md destructuring rule"

patterns-established:
  - "Multi-slot equipment merge: assert combined final attributes plus per-slot retention after unequip"
  - "Full round-trip map test: materialize → transfer → real-timer step → transfer back, asserting position/block/event map/dirty/index at each step"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "G-06-05-A: two different slots (weapon value slot 0 + armor value slot 1) equipped simultaneously produce the merged final attributes, and unequipping one keeps the other slot's modifier"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/equipment.test.ts#merges the final attributes of two equipped slots"
        status: pass
    human_judgment: false
  - id: D2
    description: "G-06-06-A: static→dynamic→move→static full chain; keepEvent=true keeps the dynamic-exclusive event merged with defaults ([[10,'base-event'],[30,'moved-event']], dirty) and keepEvent=false discards it and re-derives defaults from the written-back block num ([[10,'base-event']], clean)"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLayer.test.ts#keeps the moved dynamic events across a full static round trip"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLayer.test.ts#drops the moved dynamic events across a full static round trip"
        status: pass
    human_judgment: false
  - id: D3
    description: "G-06-06-B: a floor returned by MapState.createMap can be written to and read back — layer alias, block, point event, event layer binding and dirty flag"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mapState.test.ts#generates and reads content on a map created by createMap"
        status: pass
    human_judgment: false
  - id: D4
    description: "G-06-06-C: three layers with zIndex 1/5/9 coexist with independent block data, and per-zIndex compareWith judges each one separately (missing reference marks dirty)"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/gameMap.test.ts#keeps layers of different z-index coexisting with independent data"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-09-15
status: complete
---

# Phase 06 Plan 11: Hero + Map Coverage Gap-Fill Summary

**Four reviewed coverage gaps closed with runnable exact-value tests — merged multi-slot equipment attributes, createMap content generation, coexisting multi-zIndex layers, and the full static→dynamic→move→static chain for both `keepEvent` branches — with zero production-code changes**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-09-15T10:19:00Z
- **Completed:** 2026-09-15T10:28:12Z
- **Tasks:** 3 / 3
- **Files modified:** 5

## Accomplishments

- **G-06-05-A** (`equipment.test.ts`): `setSlots(['weapon','armor'])` + `equip(sword, 0)` + `equip(shield, 1)` asserts the merged finals `atk === 15` / `def === 8`, both `equipped()` flags and slot lookups, then asserts `atk` falls back to `10` while `def` stays `8` after `unequip(0)`.
- **G-06-06-B** (`mapState.test.ts`): on a `createMap('F1',2,2)` floor, an added layer is aliased `'event'`, bound via `setEventLayer`, written (`setBlock(5,0,0)`, `event(1,0).set(9,'gen-event')`) and read back, with `map.dirty() === true` — proving `createMap` output is immediately usable for content generation.
- **G-06-06-C** (`gameMap.test.ts`): three layers at zIndex `1/5/9` are each retrievable by alias, carry independent block data (each `getBlock` only reflects its own writes), and `compareWith` judges them per zIndex — low/mid compare clean against exact references while high (no reference key) is marked dirty.
- **G-06-06-A** (`mapLayer.test.ts`): two chained tests run the real-timer path `getTile(0,0)` → `transferToDynamic` → `step(FaceDirection.Right)` + `await controller.onEnd` → `transferToStatic`. `keepEvent=true` yields `[[10,'base-event'],[30,'moved-event']]` with `dirty() === true`; `keepEvent=false` yields `[[10,'base-event']]` (block 1's default, **not** the target cell's original block 2 `[[20,'alternate-event']]`) with `dirty() === false`. Both assert position `(1,0)`, written-back block `1`, cleared source cell `0` and emptied dynamic index.
- Appended the `06-11` gap-fill section to `06-COVERAGE-MAP.md` (create-or-append, no other section rewritten).

## Task Commits

Each task was committed atomically:

1. **Task 1: Stage 1 (component) — G-06-05-A + G-06-06-B** - `436386e` (test)
2. **Task 2: Stage 2 (combination) — G-06-06-C** - `41da613` (test)
3. **Task 3: Stage 3 (full/integration) — G-06-06-A + coverage map** - `309f1b1` (test)

_Note: no TDD tasks in this plan; each commit is a single test-only commit._

## Files Created/Modified

- `packages-user/data-base/src/hero/equipment.test.ts` — added `merges the final attributes of two equipped slots` (G-06-05-A, +23 lines)
- `packages-user/data-base/src/map/mapState.test.ts` — added `generates and reads content on a map created by createMap` (G-06-06-B, +20 lines)
- `packages-user/data-base/src/map/gameMap.test.ts` — added `keeps layers of different z-index coexisting with independent data` (G-06-06-C, +44 lines)
- `packages-user/data-base/src/map/mapLayer.test.ts` — added `keeps the moved dynamic events across a full static round trip` and `drops the moved dynamic events across a full static round trip` (G-06-06-A, +67 lines)
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — appended the `## 06-11 勇士与地图缺口补测` section (+17 lines)

## Decisions Made

- **G-06-06-A expectation source.** The plan explicitly corrects the `keepEvent=false` expectation: `transferToStatic` writes `tile.num()` (1) into the target cell first and `syncStaticEvent` then calls `set(num())` → `restoreDefaultEvents()` against the **new** block num, so the result is block 1's default `[[10,'base-event']]`, not the target cell's original block 2 default `[[20,'alternate-event']]`. Tests assert exactly that and are distinguished from `keepEvent=true` solely by whether `30:'moved-event'` survives.
- **Source cell materialization.** `layer.getTile(0, 0)` is called **before** `transferToDynamic` so the `StaticTile` is constructed while the source cell still holds block 1; otherwise `setBlock(0,0,0)` would zero `num()` and the dynamic tile would carry no default events. This mirrors the existing `transfers a dynamic tile back to static keeping events` test.
- **Reference arrays in G-06-06-C.** The `compareWith` reference arrays are the layers' own current contents (including non-zero cells). A zero-filled reference would (correctly) mark low/mid dirty, so the test asserts the clean path with exact content.
- **dev.md destructuring rule.** Used `const result = logger.catch(...)` + `result.ret` rather than a single object destructure.

## Deviations from Plan

None - plan executed exactly as written. (One stylistic adjustment inside the plan's own guidance: `logger.catch` results are read via `result.ret` instead of a single-property object destructure, per `dev.md`.)

## Issues Encountered

None. All three stages ran green on the first focused run; the D-44 gate passed before each commit.

## Verification Evidence

| Gate | Result |
| --- | --- |
| Stage 1 focused: `vitest run equipment.test.ts mapState.test.ts` | 2 files passed — 35 passed / 2 skipped (both pre-existing `#06-05-2`/`#06-05-3`) |
| Stage 2 focused: `vitest run gameMap.test.ts` | 1 file passed — 10 passed |
| Stage 3 focused: `vitest run mapLayer.test.ts` | 1 file passed — 34 passed / 1 skipped (pre-existing `#06-06-1`) |
| `eslint --fix` + `eslint <changed files>` (per stage) | 0 errors |
| `vue-tsc --noEmit` filtered to the 4 changed test files | 0 type errors (only pre-existing unrelated diagnostics remain in `client-modules` / `legacy-plugin-data` / `legacy-ui`) |
| `pnpm test:ci` after each stage | green — 638 → 639 → **641 passed / 20 skipped, 66 files** |

## Stub / Findings Tracking

- No stubs, no `it.skip` / `it.todo` added by this plan; no existing test or skip was weakened or deleted.
- `06-TEST-FINDINGS.md` has **no `#06-11-N`** entry — no suspected bug was surfaced.
- `06-COVERAGE-MAP.md` 06-11 section notes this plan introduces **no new diagnostic codes**; existing reachable-code coverage (84/121/127/128/129/131 etc.) is unchanged.

## Threat Flags

None. Test-only change: synthetic fixtures, no network/DOM/file access, no new dependency.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 06-11 gap-fill complete; the remaining D-46 plans are 06-12 and 06-13.
- `pnpm test:ci` is green on `refactor/data`, so the D-44(c) gate is available to the next plan.
- Working tree is clean apart from this SUMMARY/state update.

## Self-Check: PASSED

- Files verified present: `06-11-SUMMARY.md`, `06-COVERAGE-MAP.md`, `equipment.test.ts`, `mapState.test.ts`, `gameMap.test.ts`, `mapLayer.test.ts`.
- Commits verified present: `436386e`, `41da613`, `309f1b1`.
- `06-COVERAGE-MAP.md` contains the `06-11` section with all four gap rows.
