---
phase: 03-data-completion
verified: 2026-09-10T13:09:33Z
status: gaps_found
score: 26/26 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/STATE.md
  - .planning/phases/03-data-completion/03-01-PLAN.md
  - .planning/phases/03-data-completion/03-01-SUMMARY.md
  - .planning/phases/03-data-completion/03-02-PLAN.md
  - .planning/phases/03-data-completion/03-02-SUMMARY.md
  - .planning/phases/03-data-completion/03-03-PLAN.md
  - .planning/phases/03-data-completion/03-03-SUMMARY.md
  - .planning/phases/03-data-completion/03-04-PLAN.md
  - .planning/phases/03-data-completion/03-04-SUMMARY.md
  - .planning/phases/03-data-completion/03-05-PLAN.md
  - .planning/phases/03-data-completion/03-05-SUMMARY.md
  - .planning/phases/03-data-completion/03-06-PLAN.md
  - .planning/phases/03-data-completion/03-06-SUMMARY.md
  - .planning/phases/03-data-completion/03-07-PLAN.md
  - .planning/phases/03-data-completion/03-07-SUMMARY.md
  - .planning/phases/03-data-completion/03-08-PLAN.md
  - .planning/phases/03-data-completion/03-08-SUMMARY.md
  - .planning/phases/03-data-completion/03-09-PLAN.md
  - .planning/phases/03-data-completion/03-09-SUMMARY.md
  - .planning/phases/03-data-completion/03-COMMON-CYCLE-CONTRACT.md
  - .planning/phases/03-data-completion/03-EVENT-CONTRACT.md
  - .planning/phases/03-data-completion/03-REPLAY-CONTRACT.md
  - .planning/phases/03-data-completion/03-REPLAY-DIAGNOSTICS.md
  - .planning/phases/03-data-completion/deferred-items.md
  - package.json
  - packages-user/data-base/src/game.ts
  - packages-user/data-base/src/hero/follower.ts
  - packages-user/data-base/src/hero/location.ts
  - packages-user/data-base/src/hero/mover.ts
  - packages-user/data-base/src/hero/state.ts
  - packages-user/data-base/src/hero/types.ts
  - packages-user/data-base/src/map/mapLayer.ts
  - packages-user/data-common/src/common/face.ts
  - packages-user/data-common/src/common/types.ts
  - packages-user/data-common/src/replay/array.ts
  - packages-user/data-common/src/replay/func.ts
  - packages-user/data-common/src/replay/index.ts
  - packages-user/data-common/src/replay/sandbox.ts
  - packages-user/data-common/src/save/index.ts
  - packages-user/data-common/src/save/memory.ts
  - packages-user/data-common/src/store/tileStore.test.ts
  - packages-user/data-common/src/store/tileStore.ts
  - packages-user/data-common/src/store/types.ts
  - packages-user/data-state/src/core.ts
  - packages-user/data-state/src/enemy/calculator.ts
  - packages-user/data-state/src/event/event.test.ts
  - packages-user/data-state/src/event/event.ts
  - packages-user/data-state/src/event/hero.ts
  - packages-user/data-state/src/event/index.ts
  - packages-user/data-state/src/event/map.ts
  - packages-user/data-state/src/event/types.ts
  - packages-user/data-state/src/index.ts
  - packages-user/data-state/src/legacy/dependencies.ts
  - packages-user/data-state/src/legacy/events.ts
  - packages-user/data-state/src/legacy/move.ts
  - packages-user/data-state/src/legacy/tile.ts
  - packages-user/data-state/src/replay/commands.test.ts
  - packages-user/data-state/src/replay/commands.ts
  - packages-user/data-state/src/replay/index.ts
  - packages-user/data-state/src/replay/types.ts
  - packages-user/data-state/test/coreNode.test.ts
  - packages-user/data-state/test/coreSerializedEvents.test.ts
  - packages-user/data-state/test/dataClosure.test.ts
  - packages-user/data-state/test/fixtures/closed-loop.ts
  - packages-user/data-state/test/nodeReplay.test.ts
  - packages-user/data-state/test/nodeTracer.test.ts
  - packages-user/data-state/test/replayVerifier.ts
  - packages-user/data-state/test/tileLegacy.test.ts
  - packages-user/data-system/src/event/system.ts
  - packages/common/src/logger.ts
  - packages/common/src/utils/types.ts
  - script/check-data-circular.ts
  - script/check-data-type.ts
  - script/test-data-node.ts
covered_digest: "v1:sha256:f3d5c0e554d5767552f375687aba39b7b87528151d761c44614d7e4bfc72a336"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 23/26
  gaps_closed:
    - "Production serialized event registration and map event-id binding"
    - "Nullish safety for all eight registered event built-ins"
    - "Production replay-safety decoration at state-changing entrances"
  gaps_remaining: []
  regressions: []
---

# Phase 3: 数据端完成 Verification Report

**Phase Goal:** 数据端 L0–L3 接口实现完成，数据层各系统可用并可在 Node 环境独立运行回放验证

**Verified:** 2026-09-10T13:09:33Z  
**Status:** passed  
**Re-verification:** Yes — after gap-closure plans 03-07, 03-08, and 03-09

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---:|---|---|---|
| R1 | 用户设计的 L0–L3 接口及地图、角色、敌人、flag、战斗、触发器、存档、回放系统可用 | ✓ VERIFIED | DATA-01 closure tests, serialized-event production-path tests, the 19-file/105-test data regression, and all scoped gates pass. |
| R2 | 数据端可在无 DOM 的 Node 环境独立运行回放验证 | ✓ VERIFIED | `pnpm test:data-node` exits 0 with `Node replay verifier passed`; `coreNode.test.ts` covers independent factory instances. |
| R3 | 数据端与渲染端保持双端分离 | ✓ VERIFIED | Data code has no direct client/render imports except the pre-existing legacy bridge path; that path is runtime-gated by `Mota.r()`/`Mota.require()`. The data packages do not push render updates. |
| R4 | 接口决策由用户确认，AI 仅实现 | ✓ VERIFIED | Decision-coverage gate reports 28/28 honored; the four approved contract records contain no unresolved placeholders. |
| P01.1 | Node can create two independent CoreState instances without browser/IndexedDB globals | ✓ VERIFIED | `createCoreState()` directly returns `new CoreState()`; `coreNode.test.ts` and the independent Node path pass. |
| P01.2 | Fixed replay movement awaits event mutation and normal replay end | ✓ VERIFIED | `nodeTracer.test.ts`, `coreSerializedEvents.test.ts`, and the Node verifier pass. |
| P01.3 | CoreState reaches legacy data only through the injected internal boundary | ✓ VERIFIED | `core.ts:124-125, 238-240` consumes `createLegacyDependencies()` and does not read legacy globals directly. |
| P01.4 | Node uses memory save while browser compatibility remains available | ✓ VERIFIED | `dependencies.ts:46-86` selects `MemorySaveSystem` without the host and retains the legacy `SaveSystem` branch. |
| P02.1 | All eight approved built-ins safely resolve void for null and undefined parameters | ✓ VERIFIED | `event/index.ts:126-131` guards the registration seam before parsing; `event.test.ts:239-259` invokes every real registration with both nullish values and asserts resolved `undefined`, no mutation. |
| P02.2 | Built-in behavior stays within the approved map/hero/event closure | ✓ VERIFIED | `event/index.ts:135-195` contains exactly the eight approved registrations; valid behavior tests pass. |
| P02.3 | Event registrations are assembled through CoreState/GameEventSystem | ✓ VERIFIED | `core.ts:222-227` passes `createEventBuiltinRegistrations()` to `GameEventSystem`; registration tests pass. |
| P03.1 | Replay safety is applied only to externally callable state-changing entrances | ✓ VERIFIED | `commands.ts:66-170` decorates exactly movement, pathfinding, item, equip, and unequip entrances; validation, slot resolution, queries, and registry assembly remain outside. |
| P03.2 | Decorated async actions retain collection through Promise settlement | ✓ VERIFIED | `func.ts:186-195` restores context only on Promise fulfillment/rejection; production movement test uses a deferred controller and passes. |
| P03.3 | Top-level registry contains exactly the eight approved ordered commands | ✓ VERIFIED | `commands.ts:184-276` emits eight stable entries and `commands.test.ts` verifies order and duplicate rejection. |
| P03.4 | Commands await complete actions and return false on failure | ✓ VERIFIED | `commands.ts:125-169, 207-273` awaits controllers and returns explicit false for invalid/unavailable actions; command tests pass. |
| P04.1 | Fixed fixture covers initialization, player replay, state/event change, and normal end | ✓ VERIFIED | `closed-loop.ts:84-153` defines serialized statements and raw map event ids; Node replay and focused tests pass. |
| P04.2 | First replay divergence throws a local diagnostic with index/code/params/reason | ✓ VERIFIED | `nodeReplay.test.ts` covers unknown, false, throw, and snapshot divergence; the dedicated Node runner passes on the normal route. |
| P04.3 | Final comparison is exact and only after normal replay end | ✓ VERIFIED | `script/test-data-node.ts:95-115` waits for `sandbox.ended` before comparing structured hero and every map/layer matrix. |
| P04.4 | `pnpm test:data-node` is an independent non-zero process gate | ✓ VERIFIED | `package.json:10` invokes `tsx script/test-data-node.ts`; the independently launched process exits 0. |
| P05.1 | Four data packages have zero in-scope TypeScript diagnostics | ✓ VERIFIED | `pnpm exec tsx script/check-data-type.ts`: 27 total, 0 in-scope, 27 outside-scope; exit 0. |
| P05.2 | Four packages and the transitive common boundary have zero cycles | ✓ VERIFIED | `pnpm exec tsx script/check-data-circular.ts`: 0 total, 0 in-scope, 0 outside-scope cycles; exit 0. |
| P05.3 | DATA-01 closure covers enemy/Flag/combat/save-load/trigger-event/replay | ✓ VERIFIED | `dataClosure.test.ts` has six active value/behavior tests and passes in the full data regression. |
| P05.4 | Data suite, Node verifier, type gate, and circular gate are repeatable non-watch commands | ✓ VERIFIED | Sequential full Phase 3 data gate passes with 19 files and 105 tests; all three independent gates pass. |
| P06.1 | Tile runtime consumes `events` and exposes defensive `getEvent(num)` | ✓ VERIFIED | TileStore tests pass and verify raw events, lookup, replacement, missing tiles, and mutation isolation. |
| P06.2 | Legacy conversion produces the same events-map contract without scalar trigger | ✓ VERIFIED | `tileLegacy.test.ts` and TileStore integration pass; conversion emits `events` only. |
| P06.3 | Tile tests are focused and separate from full legacy migration | ✓ VERIFIED | Both Tile test files have explicit fixtures and Chinese coverage comments; no disabled tests or Phase 5 expansion is present. |

**Score:** 26/26 truths verified (0 present-but-behavior-unverified).

### Prior Blocker Closure

1. **Serialized event registration/map binding — CLOSED.** `ILegacyLoadData.serialized` enters `CoreState.initLegacyData()` before raw map construction. The symbol-keyed `LOAD_SERIALIZED_DATA` path calls `registerSerializedEvents()` and then `MapState.fromRaw()`. The fixed fixture supplies `Statement[]` plus `IMapRawData.events`; it no longer calls `eventStore.addEvent()` directly. `coreSerializedEvents.test.ts` proves trigger/raw statement preservation, coordinate id binding, one execution, and the final mutation.
2. **Nullish event built-ins — CLOSED.** `createBuiltin()` rejects null, undefined, and other non-object parameters before any `Object.getOwnPropertyDescriptor()` call. The regression invokes all eight actual registration functions for both null and undefined and checks resolved void plus unchanged state.
3. **Replay-safety production wiring — CLOSED.** `ReplayCommandEntrances` applies `shouldReplay()` to the five state-changing entrances used by the real registry. Deferred movement proves the collection remains active through `controller.onEnd`; item/equipment production calls produce safety records; pure path queries and invalid validation produce none.

## Plan/Summary Reconciliation

The nine Phase 3 PLAN/SUMMARY pairs were read. The prior SUMMARY claims were not accepted as evidence; the current source, focused tests, and independent commands were checked. Plans 03-07, 03-08, and 03-09 now match the implementation and close all three prior gaps. The ROADMAP file still has stale phase metadata (`6/6` and an unchecked 03-05 entry) while the actual phase directory contains nine plans; this is planning metadata drift, not a code or acceptance gap, and was not modified per instruction.

## Required Artifacts

| Artifact group | Level 1 existence | Level 2 substance | Level 3 wiring | Status |
|---|---|---|---|---|
| 03-01 Node CoreState, memory save, dependency boundary, tracer | Present | Concrete Node-safe construction and replay fixture | Factory → CoreState → injected dependencies → tests | ✓ VERIFIED |
| 03-02 event contracts, eight implementations, registrations, tests | Present | Eight bounded handlers with awaited behavior and safe target handling | data-state registrations → GameEventSystem → CoreState | ✓ VERIFIED |
| 03-03 replay contract, commands, decorator, registry tests | Present | Stable enum, explicit failures, Promise-aware decoration | CoreState → ReplaySystem → command entrances → state APIs | ✓ VERIFIED |
| 03-04 fixed fixture, Node runner, verifier, diagnostics | Present | Deterministic route and end-only exact snapshots | package script → Node runner → verifier harness → live state | ✓ VERIFIED |
| 03-05 scoped gates and DATA-01 closure | Present | Real `vue-tsc`/Madge classifiers and six value/behavior tests | compiler/graph output → fail-closed scope gates | ✓ VERIFIED |
| 03-06 TileStore and legacy events-map bridge | Present | Normalized, defensive event maps without scalar trigger | raw/legacy events → TileStore → `getEvent()` | ✓ VERIFIED |
| 03-07 serialized event loader and production-path fixture | Present | Validated `Statement[]` to `GameEvent` conversion and raw map binding | internal load payload → CoreState symbol path → event store/map state | ✓ VERIFIED |
| 03-08 nullish registration guard and matrix | Present | Shared runtime guard plus eight-entry null/undefined matrix | AnonTokyo `func` → guard → parser/handler | ✓ VERIFIED |
| 03-09 production replay entrances and boundary tests | Present | Five decorated state-changing entrances and pure-path exclusions | CoreState registry → decorated entrances → Promise settlement | ✓ VERIFIED |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| serialized load payload | `CoreState.eventStore` | `LOAD_SERIALIZED_DATA` → `registerSerializedEvents` | ✓ WIRED | `core.ts:267-282`; focused registration test passes. |
| `IMapRawData.events` | coordinate event view | `MapState.fromRaw()` | ✓ WIRED | `mapState.ts:228-243` converts raw ids into layer event views; test observes priority 10 → `mutate-map`. |
| registered `GameEvent` | event mutation | shared interpreter → `eventSetBlock` registration | ✓ WIRED | Fixture uses raw `StatementType.Call`; replay changes the event-layer matrix once. |
| all eight event registrations | safe result | `createBuiltin()` runtime object guard | ✓ WIRED | Actual `BuiltInFunction.func` values resolve null and undefined safely. |
| CoreState | event built-ins | `createEventBuiltinRegistrations()` → `GameEventSystem` | ✓ WIRED | Core assembly passes the module-owned registration list. |
| replay registry | state-changing entrances | `createReplayCommandItems()` → `ReplayCommandEntrances` | ✓ WIRED | All five production entrances are reached by real registry commands. |
| `shouldReplay` | async state collection | decorated entrance → returned Promise settlement | ✓ WIRED | Deferred movement test sees no early record and records after controller completion. |
| pure validation/path query | replay safety collection | validation before decorated call | ✓ WIRED | Pure/query regression records zero safety messages. |
| Node package command | verifier | `test:data-node` → direct `core.ts` factory | ✓ WIRED | No compatibility singleton or DOM entry is imported by the runner. |
| type gate | compiler diagnostics | `vue-tsc` output classifier | ✓ WIRED | In-scope failures are not hidden; 27 diagnostics are explicitly outside scope. |
| circular gate | dependency graph | Madge four entries plus transitive common boundary | ✓ WIRED | Gate reports zero cycles. |
| tile raw/legacy events | defensive accessor | bridge/TileStore normalization → `getEvent()` | ✓ WIRED | Tile tests verify real map flow, replacement, lookup, and isolation. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|---|---|---|---|---|
| `CoreState` | save/replay state | `MemorySaveSystem`, concrete hero/maps/enemy/flag state | Yes | ✓ FLOWING |
| serialized event adapter | event body/trigger | supplied `Statement[]` and `EventTrigger` load payload | Yes | ✓ FLOWING |
| raw map binding | coordinate event ids | `IMapRawData.events` consumed by `MapState.fromRaw()` | Yes | ✓ FLOWING |
| registered built-ins | map/hero/event mutations | AnonTokyo calls through `IBlockEventEnv` | Yes | ✓ FLOWING |
| replay commands | movement/item/equipment state | real CoreState APIs and awaited controllers | Yes | ✓ FLOWING |
| Node verifier | final snapshots | live `hero.attribute` and every map layer | Yes | ✓ FLOWING |
| TileStore | tile event maps | raw/legacy `events` input | Yes | ✓ FLOWING |
| type/circular gates | diagnostics/graph | real `vue-tsc` and Madge processes | Yes | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full Phase 3 data regression | `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` (sequential) | 19 files, 105 tests passed | ✓ PASS |
| Serialized event/map binding, all nullish built-ins, production replay safety | focused Vitest command for `coreSerializedEvents.test.ts`, `event.test.ts`, `commands.test.ts` | 3 files, 24 tests passed | ✓ PASS |
| Independent Node replay gate | `pnpm test:data-node` | `Node replay verifier passed`, exit 0 | ✓ PASS |
| Scoped type gate | `pnpm exec tsx script/check-data-type.ts` | 27 total, 0 in-scope, 27 outside-scope diagnostics; exit 0 | ✓ PASS |
| Scoped circular gate | `pnpm exec tsx script/check-data-circular.ts` | 0 total/in-scope/outside-scope cycles; exit 0 | ✓ PASS |
| Phase implementation lint | scoped `pnpm exec eslint ...` | 0 errors, 21 expected `no-console` warnings | ✓ PASS |
| Phase implementation formatting | scoped `pnpm exec prettier --check ...` | All matched files use Prettier code style | ✓ PASS |

The verifier initially launched the full workspace and scoped Vitest commands concurrently; that contention caused a `coreEventLayer.test.ts` `beforeAll` timeout. The authoritative sequential Phase 3 regression was then run alone and passed all 19 files/105 tests. No source changes were made between those runs; the timeout is treated as an execution-contention note, not a code failure.

## Probe Execution

No `scripts/*/tests/probe-*.sh` probe was declared or found for this phase. The documented executable process gate, `pnpm test:data-node`, was run independently and passed.

## Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|---|---|---|---|---|
| DATA-01 | All nine Phase 3 plans; `.planning/REQUIREMENTS.md` | Complete usable L0–L3 data interfaces and independent Node replay verification | ✓ SATISFIED | All 26 truths verified; 19/105 data regression, Node process, type, circular, lint, and Prettier gates pass. |

No orphaned Phase 3 requirement was found. DATA-01 is the only requirement mapped to this phase and is declared by every Phase 3 plan.

## Test Quality Audit

| Test File | Active tests | Skipped | Circular expected-value generation | Assertion level | Verdict |
|---|---:|---:|---:|---|---|
| `data-common/src/store/tileStore.test.ts` | 5 | 0 | 0 | Value/behavioral | PASS |
| `data-common/src/store/eventStore.test.ts` | 3 | 0 | 0 | Value/behavioral | PASS |
| `data-common/src/common/mover.test.ts` | 4 | 0 | 0 | Behavioral | PASS |
| `data-base/src/map/mapLifecycle.test.ts` | 5 | 0 | 0 | Value/behavioral | PASS |
| `data-base/src/map/eventView.test.ts` | 2 | 0 | 0 | Value/behavioral | PASS |
| `data-base/src/map/eventPath.test.ts` | 9 | 0 | 0 | Behavioral | PASS |
| `data-system/src/event/eventDispatch.test.ts` | 6 | 0 | 0 | Behavioral/value | PASS |
| `data-system/src/path/system.test.ts` | 13 | 0 | 0 | Behavioral/value | PASS |
| `data-system/src/path/performance.test.ts` | 3 | 0 | 0 | Behavioral | PASS |
| `data-system/src/path/graph.test.ts` | 12 | 0 | 0 | Behavioral/value | PASS |
| `data-state/test/tileLegacy.test.ts` | 2 | 0 | 0 | Value/behavioral | PASS |
| `data-state/test/nodeTracer.test.ts` | 2 | 0 | 0 | Behavioral | PASS |
| `data-state/test/nodeReplay.test.ts` | 6 | 0 | 0 | Behavioral/value | PASS |
| `data-state/test/dataClosure.test.ts` | 6 | 0 | 0 | Value/behavioral | PASS |
| `data-state/test/coreSerializedEvents.test.ts` | 2 | 0 | 0 | Behavioral/value | PASS |
| `data-state/test/coreNode.test.ts` | 2 | 0 | 0 | Behavioral/value | PASS |
| `data-state/src/event/event.test.ts` | 10 | 0 | 0 | Behavioral/value | PASS |
| `data-state/src/replay/commands.test.ts` | 12 | 0 | 0 | Behavioral/value | PASS |
| `data-state/src/coreEventLayer.test.ts` | 1 | 0 | 0 | Value/behavioral | PASS |

**Total:** 105 active tests across 19 files; 0 disabled requirement-linked tests; 0 circular expected-value generators. Expected values are explicit fixtures/literals or independently constructed fakes, not generated by the system under test.

## Decision Coverage

The decision coverage gate ran against `03-CONTEXT.md`: **28/28 decisions honored**, with no non-honored decisions. This is non-blocking corroboration and does not replace the source/test evidence above.

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| Phase 3 changed implementation/test files | `TBD`/`FIXME`/`XXX` debt markers | ✓ NONE | No unreferenced debt-marker blocker. |
| `packages-user/data-common/src/save/memory.ts` | Intentional empty IndexedDB persistence branch | ℹ️ INFO | Node adapter must not touch IndexedDB; covered by the Node boundary and documented as an accepted adapter behavior. |
| `packages-user/data-state/src/legacy/dependencies.ts` | Intentional empty Node loading callback | ℹ️ INFO | Node path deliberately does not register browser loading; browser/legacy branch remains implemented. |
| `packages-user/data-state/src/ins.ts` | Pre-existing `TODO` about singleton weakening | ℹ️ INFO | File was not modified by the Phase 3 implementation/gap-closure commits; not a phase debt marker. |

No stub, orphaned artifact, hardcoded rendered data, or console-only implementation was found in the phase-owned gap-closure paths.

## Advisory (New Scope, Unevidenced)

None. Re-verification anti-pattern findings introduced no unevidenced blocker; no advisory item is carried forward.

## Human Verification Required

N/A — this is an infrastructure/data-layer phase with no user-facing UI or external-service acceptance step. All behavior-dependent phase truths have passing named tests, so `behavior_unverified` is 0.

## Gaps Summary

The prior implementation passed its original behavioral gate, but the user structural review identified principle-level corrections that supersede parts of the Phase 3 design. These corrections must be planned and verified before the phase can be considered structurally acceptable.

## Gaps

- gap_id: CORR-03-01
  truth: "Phase 3 must not add new legacy systems or new legacy loading boundaries; legacy code remains compatibility-only."
  status: failed
  reason: "Phase 3 introduced legacy dependency and serialized-event loading infrastructure instead of limiting legacy changes to retention."
  severity: blocker
  test: structural-review
- gap_id: CORR-03-02
  truth: "Data-state CoreState must not add a MemorySaveSystem or a Node-specific save adapter; save-system restructuring is deferred to the rendering refactor."
  status: failed
  reason: "CoreState and legacy dependencies select MemorySaveSystem for Node execution and move save initialization behind a new dependency boundary."
  severity: blocker
  test: structural-review
- gap_id: CORR-03-03
  truth: "data-state/src/event/index.ts contains exports and registration only; event handlers do not perform repeated runtime parameter-shape validation."
  status: failed
  reason: "The event barrel contains parser helpers, environment guards, and parameter type checks on every built-in invocation."
  severity: blocker
  test: structural-review
- gap_id: CORR-03-04
  truth: "eventInsertEvent receives a Statement[] event body and executes that body directly; it does not resolve an event by ID."
  status: failed
  reason: "The current implementation interprets eventInsertEvent as a one-ID wrapper around eventInsertEvents."
  severity: blocker
  test: structural-review
- gap_id: CORR-03-05
  truth: "Replay command execution remains synchronous and preserves the existing replay system with only the minimum required changes."
  status: failed
  reason: "Phase 3 added Promise-based movement/equipment command execution and async replay-safety context restoration."
  severity: blocker
  test: structural-review
- gap_id: CORR-03-06
  truth: "Each replay instruction is an independent class in one replay command file, with no shared command entrance object or inter-command dependency."
  status: failed
  reason: "The current implementation centralizes all commands in ReplayCommandEntrances and creates command closures around that shared object."
  severity: blocker
  test: structural-review

## Deferred Follow-Ups

- item: "Move @shouldReplay() decorators onto the actual state-changing methods such as HeroAttribute.set and HeroAttribute.mul."
  status: user-owned
  reason: "The user will implement and validate the Stage 3 decorator placement; this correction run must not modify it."

---

_Verified: 2026-09-10T13:09:33Z_  
_Verifier: the agent (gsd-verifier)_
