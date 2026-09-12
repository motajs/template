---
phase: 02-pathfinding
verified: 2026-09-10T11:14:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/STATE.md
  - .planning/phases/02-pathfinding/02-01-PLAN.md
  - .planning/phases/02-pathfinding/02-01-SUMMARY.md
  - .planning/phases/02-pathfinding/02-02-PLAN.md
  - .planning/phases/02-pathfinding/02-02-SUMMARY.md
  - .planning/phases/02-pathfinding/02-03-PLAN.md
  - .planning/phases/02-pathfinding/02-03-SUMMARY.md
  - .planning/phases/02-pathfinding/02-04-PLAN.md
  - .planning/phases/02-pathfinding/02-04-SUMMARY.md
  - .planning/phases/02-pathfinding/02-05-PLAN.md
  - .planning/phases/02-pathfinding/02-05-SUMMARY.md
  - .planning/phases/02-pathfinding/02-06-SUMMARY.md
  - .planning/phases/02-pathfinding/02-CONTEXT.md
  - .planning/phases/02-pathfinding/02-DISCUSSION-LOG.md
  - .planning/phases/02-pathfinding/02-INTERFACE-DRAFT.md
  - .planning/phases/02-pathfinding/02-RESEARCH.md
  - .planning/phases/02-pathfinding/02-VALIDATION.md
  - .planning/phases/02-pathfinding/deferred-items.md
  - package.json
  - vite.config.ts
  - packages/common/src/logger.json
  - packages-user/data-base/src/hero/mover.ts
  - packages-user/data-base/src/map/eventPath.test.ts
  - packages-user/data-base/src/map/mapLifecycle.test.ts
  - packages-user/data-common/src/common/mover.test.ts
  - packages-user/data-common/src/common/mover.ts
  - packages-user/data-common/src/types.ts
  - packages-user/data-state/src/core.ts
  - packages-user/data-state/src/hero/index.ts
  - packages-user/data-state/src/hero/moverImpl.ts
  - packages-user/data-state/src/hero/predicate.ts
  - packages-user/data-state/src/index.ts
  - packages-user/data-system/src/event/eventDispatch.test.ts
  - packages-user/data-system/src/index.ts
  - packages-user/data-system/src/path/finder.ts
  - packages-user/data-system/src/path/graph.test.ts
  - packages-user/data-system/src/path/graph.ts
  - packages-user/data-system/src/path/index.ts
  - packages-user/data-system/src/path/performance.test.ts
  - packages-user/data-system/src/path/system.test.ts
  - packages-user/data-system/src/path/system.ts
  - packages-user/data-system/src/path/types.ts
covered_digest: "v1:sha256:9a240d6d07ec1d218c07f9e39ad36d4e2cf57344dd575db44c8063fac61f3945"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 23/24
  gaps_closed: []
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "移动端点击地图上的可达格时，角色自动寻路移动到该格"
    addressed_in: "Phase 4"
    evidence: "ROADMAP.md scope correction and D-11 assign rendering/mobile click wiring to Phase 4."
decision_coverage:
  honored: 11
  total: 11
  not_honored: []
---

# Phase 2: 寻路系统 Verification Report

**Phase Goal:** 引擎支持自动寻路，移动端点击地图即可触发移动
**Verified:** 2026-09-10T11:14:00Z
**Status:** passed
**Re-verification:** Yes — after the direct user-correction scope reset

## Verification Scope

This report verifies the corrected **L2-only** Phase 2 scope. The direct correction is authoritative:

- Graph contracts and their API documentation are in `packages-user/data-system/src/path/types.ts`.
- `HeroPathfinding`, its tests/barrel, and `CoreState` wiring were unauthorized and are intentionally absent. Their absence is not a regression and does not create a gap.
- `DirectionMapper` is supplied by `IDataCommon`; graph construction reads `layer.state.directionMapper` and does not instantiate a mapper.
- The generic pass predicate is in `packages-user/data-state/src/hero/predicate.ts` as `DefaultPassPredicate`; it is not hero-named.

The historical 02-03/02-04 artifacts mention the removed L3 wrapper, but those claims were not used as evidence. The live source and live tests below are authoritative.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | L2 builds a reachable directed graph from map data, honors injected pass decisions, and marks terminal nodes | ✓ VERIFIED | `path/graph.ts` performs BFS from the start over injected `IPassPredicate`; `graph.test.ts` passed 12 tests covering directionality, walls, reachability, and terminal nodes. |
| 2 | L2 finds minimum-loss paths, supports custom costs, path-only retrieval, movement mode selection, fallback policy, and interruption | ✓ VERIFIED | `path/finder.ts` and `path/system.ts` are substantive and wired; `system.test.ts` passed 13 tests. Named movement and interruption tests each passed independently. |
| 3 | Graph construction consumes the shared `IDataCommon.directionMapper`, with no per-builder `DirectionMapper` construction | ✓ VERIFIED | `IDataCommon.directionMapper` is declared in `data-common/src/types.ts`, initialized once by `CoreState`, exposed through `IMapLayer.state`, and read at `graph.ts:114`; static scope check found no mapper construction in `path/graph.ts`. |
| 4 | Graph contracts and documentation live in `data-system/src/path/types.ts` and are exported through the L2 barrel | ✓ VERIFIED | `IPathGraphEdge`, `IPathGraphNode`, `IPathGraph`, and `IPathfindingGraphBuilder` plus their JSDoc are in `path/types.ts`; `path/index.ts` and `data-system/src/index.ts` export the path API. |
| 5 | The pass predicate is generic, lives in `data-state/src/hero/predicate.ts`, and is consumed through the existing mover predicate contract | ✓ VERIFIED | `DefaultPassPredicate`/`DefaultPassPredicateImpl` are the only predicate names in the live implementation; `moverImpl.ts` imports and constructs it, and `HeroMover` calls `predicate().canPass/shouldHit`. |
| 6 | Role-specific L3 automatic movement through `HeroPathfinding` | ⏭ OUT OF SCOPE | Explicitly removed by the direct user correction. `data-state/src/path/` is absent, `CoreState` has no pathfinding property/import, and no live source reference remains. Do not recreate it. |
| 7 | Mobile map click triggers role movement | ⏭ DEFERRED | No click adapter is present by design; D-11 and the roadmap assign this rendering integration to Phase 4. |

**Score:** 5/5 corrected in-scope truths verified. The two excluded/deferred rows are not counted as L2 must-haves.

### Scope Exclusions

| Item | Disposition | Evidence |
|---|---|---|
| `HeroPathfinding` implementation, tests, barrel, and `CoreState` wiring | Explicitly out of scope; intentionally deleted | `02-06-SUMMARY.md`, `02-DISCUSSION-LOG.md`, ROADMAP scope correction, and live absence checks. |
| Hero-specific end-to-end movement claims from historical plans | Not verified and not claimed | No live HeroPathfinding artifact exists; L2 tests use generic movable fixtures. |

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|---|---|---|
| 1 | Mobile click → L2 pathfinding/movement adapter | Phase 4 | ROADMAP Phase 4 rendering/mobile scope and D-11. |

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages-user/data-system/src/path/types.ts` | Public graph and path contracts with API documentation | ✓ VERIFIED | Graph helper contracts and JSDoc are present in the corrected source file. |
| `packages-user/data-system/src/path/graph.ts` | Reachable directed graph builder | ✓ VERIFIED | Uses real `IMapLayer` locations, shared direction mapper, injected predicate, costs, and terminal-node classification. |
| `packages-user/data-system/src/path/finder.ts` | Minimum-loss path search | ✓ VERIFIED | Consumes `IPathGraph` and returns real `IPathfindingStep[]`; no static fallback. |
| `packages-user/data-system/src/path/system.ts` | L2 pathfinding system | ✓ VERIFIED | Wires finder, generic movable/mover bridge, path-only access, movement modes, fallback, and interruption. |
| `packages-user/data-system/src/path/index.ts` | L2 path barrel | ✓ VERIFIED | Exports finder, graph, system, and types. |
| `packages-user/data-common/src/types.ts` | Shared `IDataCommon.directionMapper` dependency | ✓ VERIFIED | `IDirectionMapper` field is part of the shared contract. |
| `packages-user/data-state/src/core.ts` | Shared mapper initialization | ✓ VERIFIED | Constructs one `DirectionMapper` for the common state; HeroPathfinding wiring is correctly absent. |
| `packages-user/data-state/src/hero/predicate.ts` | Generic `DefaultPassPredicate` contract/implementation | ✓ VERIFIED | Substantive pass-mask and hit logic, no hero-specific class/interface name. |
| `packages-user/data-state/src/hero/moverImpl.ts` | Existing mover consumes generic predicate and preserves event-source behavior | ✓ VERIFIED | Imports `DefaultPassPredicate`, guards nullable static sources, and retains dynamic event collection/order. |
| `packages-user/data-system/src/path/graph.test.ts` | Graph behavior coverage | ✓ VERIFIED | 12 active tests passed. |
| `packages-user/data-system/src/path/system.test.ts` | L2 path/system behavior coverage | ✓ VERIFIED | 13 active tests passed. |
| `packages-user/data-system/src/path/performance.test.ts` | Performance sanity coverage | ✓ VERIFIED | 3 active tests passed, including map-size and real-map cases. |
| `package.json` / `vite.config.ts` | Deterministic test gate | ✓ VERIFIED | `test:ci` runs `vitest run`; test and hook budgets are 30 seconds. |

The deleted `packages-user/data-state/src/path/*` files are intentionally not required artifacts for the corrected phase and are not reported as missing.

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `IMapLayer.state` | `IDataCommon.directionMapper` | `layer.state.directionMapper.map(this.group)` | ✓ WIRED | `IMapLayer` extends `IDataCommonExtended`; `MapLayer.state` is the shared common state. |
| `PathfindingGraphBuilder` | graph contracts | imports from `./types` | ✓ WIRED | `graph.ts` imports all graph interfaces from `types.ts`; no duplicate declarations remain. |
| `PathfindingFinder` | `PathfindingGraphBuilder` | builder construction and `build(start)` | ✓ WIRED | Each find constructs a graph from current map/predicate/cost state, then searches it. |
| `PathfindingSystem` | `PathfindingFinder` / `IObjectMover` | finder calls and mover controller | ✓ WIRED | L2 tests exercise path-only, step, teleport, fallback, and stop behavior with a generic movable fixture. |
| `DefaultHeroMoveTopImpl` | `DefaultPassPredicate` | constructor + `predicate()` | ✓ WIRED | Existing mover behavior obtains the generic predicate implementation from `predicate.ts`. |
| `data-system/src/index.ts` | `data-system/src/path/index.ts` | `export * from './path'` | ✓ WIRED | L2 path API is publicly reachable. |
| `HeroPathfinding` | L2 pathfinding | — | ⏭ OUT OF SCOPE | No link is expected after the authorized deletion. |
| Mobile click adapter | L2 pathfinding | — | ⏭ DEFERRED | Rendering integration belongs to Phase 4. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `PathfindingGraphBuilder` | nodes/edges | Current `IMapLayer` locations + shared direction mapper + injected predicate | Yes | ✓ FLOWING |
| `PathfindingFinder` | path steps | Reachable graph + node costs from current map state | Yes | ✓ FLOWING |
| `PathfindingSystem` | movement controller/path | Current generic `IObjectMover` position → finder → mover queue | Yes | ✓ FLOWING |
| `DefaultPassPredicate` | pass/hit decisions | `IMapState` event/layer pass data | Yes | ✓ FLOWING |
| Mobile click flow | target coordinate | No client pointer/touch source in this phase | No | ⏭ DEFERRED |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full corrected phase regression suite | `pnpm test:ci` | Exit 0; 10 files passed, 58 tests passed, 0 skipped, 0 failed | ✓ PASS |
| L2 movement transition | `pnpm exec vitest run packages-user/data-system/src/path/system.test.ts -t "moves step by step to the target and wraps the controller"` | 1 named test passed | ✓ PASS |
| L2 interruption transition | `pnpm exec vitest run packages-user/data-system/src/path/system.test.ts -t "interrupts the ongoing pathfinding move safely"` | 1 named test passed | ✓ PASS |
| Targeted implementation/fixture ESLint | `pnpm exec eslint` over changed implementation and fixture files | Exit 0; no problems | ✓ PASS |
| Scope/static checks | `git diff --check` plus live-source checks for HeroPathfinding, graph-local mapper construction, and hero-named predicate | No production scope violations; diff whitespace warnings only on planning files | ✓ PASS |

Filtered named-test runs report 12 Vitest-filtered tests; those are test-selection exclusions, not disabled tests. The full suite reports zero skipped tests.

## Probe Execution

No phase-declared or conventional `probe-*.sh` probe exists. Probe execution was not applicable.

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| PATH-01 | 02-01/02-02/02-03/02-04/02-05 | Engine supports automatic pathfinding | ✓ SATISFIED (corrected L2 scope) | Directed reachable graph, minimum-loss search, obstacle avoidance, path-only and movement APIs are live and covered by 12 graph tests, 13 system tests, 3 performance tests, and the full suite. |
| PATH-02 | 02-01/02-02/02-03/02-05 | Mobile map click triggers automatic movement | ⏭ DEFERRED | Mobile click wiring is explicitly excluded by D-11 and assigned to Phase 4; no click implementation is claimed. |

No orphaned Phase 2 requirements were found.

## Decision Coverage

`check.decision-coverage-verify` reported **11/11** trackable context decisions honored. This is a non-blocking warning gate and produced no unhonored decisions.

## Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|---|---|---:|---:|---:|---|---|
| `data-system/src/path/graph.test.ts` | PATH-01 | 12 | 0 | 0 | Behavioral/value | PASS |
| `data-system/src/path/system.test.ts` | PATH-01 | 13 | 0 | 0 | Behavioral/value | PASS |
| `data-system/src/path/performance.test.ts` | PATH-01 | 3 | 0 | 0 | Status/value | PASS |
| `data-common/src/common/mover.test.ts` | PATH-01 regression | 4 | 0 | 0 | Behavioral/value | PASS |

No disabled-test pattern was found in the path test files. No requirement-linked test generates expected values from the system under test.

## Quality Gates and Baseline Diagnostics

- `pnpm test:ci`: **PASS** — 10 files, 58 tests, no skipped or failed tests.
- Targeted ESLint: **PASS** — no problems in changed implementation/fixture files.
- `pnpm check:type`: **baseline non-zero** — unrelated client/legacy and TileStore diagnostics remain. `CoreState` still reports the pre-existing TileStore TS2322/TS2345 pair; no path, predicate, `moverImpl.ts`, or `IDataCommon` diagnostic was reported.
- `pnpm check:circular`: **baseline non-zero** — 18 existing cycles reported; none traverses `data-system/src/path` or `data-state/src/hero/predicate.ts`. The existing `data-common/src/types.ts` cycle is not new: that file already imported `@motajs/common` before this correction.
- `git diff --check`: no code whitespace errors; it reports only existing LF→CRLF warnings for modified planning documents.
- Runtime warnings during tests: stale Browserslist data and expected fixture/logger warnings; none caused test failure.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `packages-user/data-state/src/core.ts` | 154 | Existing `TODO` for serialized event registration | Info | Pre-existing Phase 1/deferred work; not a `TBD`/`FIXME`/`XXX` debt marker and unrelated to L2 pathfinding. |
| `packages-user/data-system/src/path/finder.ts`, `system.ts` | guard returns | `return []` / `return null` | Info | Contract-prescribed invalid/unreachable/no-controller results; directly covered by tests, not stubs. |

No unreferenced `TBD`, `FIXME`, or `XXX` marker was found in the corrected implementation files. No placeholder or console-only pathfinding implementation was found.

## Human Verification Required

None. This is an infrastructure/data-system phase with no user-facing UI in the corrected scope. Visual/mobile click verification belongs to Phase 4, not this report.

## Gaps Summary

The corrected L2 deliverable is present, substantive, wired, and behaviorally covered. The graph contracts and JSDoc are in the user-required `path/types.ts`; graph construction consumes the shared `IDataCommon.directionMapper`; and the generic `DefaultPassPredicate` is extracted without hero-specific naming.

The deleted `HeroPathfinding` L3 implementation and its CoreState/barrel/test wiring are intentional scope exclusions, not gaps. Mobile click integration remains a Phase 4 deferred item. Repository-wide type and circular-dependency failures are documented baseline diagnostics outside the corrected L2 path deliverable.

---

_Verified: 2026-09-10T11:14:00Z_
_Verifier: the agent (gsd-verifier)_
