---
phase: 08-test-refactor-alignment
verified: 2026-10-08T17:05:00Z
status: passed
score: 12/12 must-haves verified
covered_files:
    - .planning/phases/08-test-refactor-alignment/08-01-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-02-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-03-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-04-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-05-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-06-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-07-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-08-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-09-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-10-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-11-PLAN.md
    - .planning/phases/08-test-refactor-alignment/08-01-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-02-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-03-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-04-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-05-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-06-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-07-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-08-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-09-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-10-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-11-SUMMARY.md
    - .planning/phases/08-test-refactor-alignment/08-CONTEXT.md
    - .planning/phases/08-test-refactor-alignment/08-RESEARCH.md
    - .planning/phases/08-test-refactor-alignment/08-PATTERNS.md
    - .planning/phases/08-test-refactor-alignment/08-REVIEW.md
    - .planning/REQUIREMENTS.md
    - packages-user/data-common/src/replay/sandbox.ts
    - packages-user/data-base/src/enemy/types.ts
    - packages-user/data-base/src/hero/location.ts
    - packages-user/data-base/src/hero/equipment.ts
    - packages-user/data-base/src/map/eventView.ts
    - packages-user/data-base/src/map/mapLayer.ts
    - packages-user/data-base/src/map/tile.ts
    - packages-user/data-base/src/map/types.ts
    - packages-user/data-system/src/path/graph.ts
    - packages-user/data-state/src/replay/commands.ts
    - script/test-data-node.ts
    - packages-user/data-state/src/loader/__test__/loader.test.ts
    - packages-user/data-state/__test__/fixtures/closed-loop.ts
covered_digest: "v3:sha256:46275a733938e3d096a45ec0aee4420c41c7ea64a71c8bc55f128c580f51dccb"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 08: 测试重构与接口对齐 Verification Report

**Phase Goal:** 将全部测试文件（`.test.ts` / `.perf.ts`）迁入 `__test__` 目录，并按数据端「系统性收尾」后的当前接口重对齐测试、修复重构遗漏的细节问题，使 `pnpm test:ci` / `test:perf` 重新全绿
**Verified:** 2026-10-08T17:05:00Z
**Status:** passed
**Re-verification:** No — initial verification (`08-VERIFICATION.md` did not previously exist)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Roadmap SC1 — 全部数据端 `.test.ts`/`.perf.ts` 位于各自源码目录 `__test__/` 下，测试命令仍能发现并运行 | ✓ VERIFIED | `git ls-files` = 71 test files; 70 under `__test__/`; the only non-`__test__` file is `script/check-data-circular.test.ts` (explicitly out of scope per CONTEXT D-01). `test:ci` discovers 65 (64 data + 1 script), `test:perf` discovers 6. Old paths have no same-named files (migration = move). |
| 2 | Roadmap SC2 — 因接口变动失效的测试全部对齐 shipped 接口，`pnpm test:ci` 0 失败 | ✓ VERIFIED | Ran `pnpm test:ci`: **Test Files 65 passed (65); Tests 727 passed / 1 skipped (728); 0 failed** (duration 22.28s). |
| 3 | Roadmap SC3 — 重构遗漏细节已修复（测试面或经用户确认的数据端细节），不弱化既有断言 | ✓ VERIFIED | 10 production D-10 fixes present and ledger-reconciled (see artifacts). Retired test files' sources verified gone (`common/utils.ts`, `data-state/src/legacy/`). No `it` deleted except the 2 authorized file retirements; net test count rose (baseline ≈706 → 727 passed + 1 skip). All 11 SUMMARYs document each expectation rewrite as contract alignment. |
| 4 | Roadmap SC4 — `pnpm test:perf` 仍可运行；不新增跳过用例 | ✓ VERIFIED | Ran `pnpm test:perf`: **Test Files 6 passed (6); Tests 54 passed (54); 0 failed**. Repo-wide skip scan = exactly 1: `equipment.test.ts:353` (code 147, approved D-04). No `it.todo`/`describe.skip`. |
| 5 | Migration physical placement + external script paths + zero config changes | ✓ VERIFIED | `script/test-data-node.ts:67,122` now `require('../packages-user/data-state/__test__/{replayVerifier.ts,fixtures/closed-loop.ts}')`. `git diff 36d8b4f^..HEAD` over `vite.config.ts`, `vitest.perf.config.ts`, `tsconfig.json`, `eslint.config.js`, `package.json`, `pnpm-lock.yaml` = empty. |
| 6 | data-common alignment — `DirectionMapper` removed, `addHook().load()` removed, sandbox codes 158/175→72 | ✓ VERIFIED | `git grep DirectionMapper` over `packages/common/src` + `data-common/src` = NONE. `git grep "\.addHook(.*)\.load()"` over tests = NONE. `sandbox.test.ts:231,241` cover codes 73/194; suite green. |
| 7 | data-base alignment — enemy/flag real `TileStore`, `getPrefab(token: number\|string)`, hero replay stub `array`, `setFloor(IGameMap\|null)`, `getItem`→`addItem`, map `addLayer(alias)` + `MapState(state)` | ✓ VERIFIED | `enemy/types.ts`, `hero/location.ts`, `hero/equipment.ts`, `map/{eventView,mapLayer,tile,types}.ts` are the shipped D-10 files; 08-03/04/05 focused gates 60/114/108 passed; full suite green. |
| 8 | data-system alignment — combat `CombatFlow(state)`, `.load()` removed, `DirectionMapper` removed from eventDispatch, path `useMapState` removed + `useFaceHandler` injected | ✓ VERIFIED | 08-06/08-07 focused gates 96 + 28 passed; `path/graph.ts` is a D-10 file; full suite green. |
| 9 | data-state src + integration alignment — `CoreState({loadStarter,coreURL})`, `MapState.fromRaw`, closed-loop fixture, `tileLegacy.test.ts` retired | ✓ VERIFIED | `createCoreState` appears only as test-local helpers (no production export). `data-state/src/legacy/*` gone. `loader.test.ts` new. Full suite green. |
| 10 | 21-gap-code coverage + stale-code disposition + loader public surface | ✓ VERIFIED | Spot-checked assertions present (`code 73/194` sandbox, `66/67/69` loader). 08-10 matrix: 21 = 14 new + 5 already-registered + 2 unreachable (68/70, user-approved not-tested). `loader.test.ts` is substantive (176 lines, value-level assertions, Chinese comments per `it`). |
| 11 | Quality gate — eslint 0 errors on the four data packages | ✓ VERIFIED | Ran `pnpm exec eslint packages-user/data-{common,base,system,state}/src` → **6 problems (0 errors, 6 warnings)** (pre-existing `no-console`, user-approved non-blocking). |
| 12 | Production ledger — non-test source changes limited to the 10 user-authorized D-10 files, each registered | ✓ VERIFIED | `git diff --name-only 36d8b4f^..HEAD -- packages-user/data-*/src` filtered of `__test__` = exactly the 10 files in 08-11-SUMMARY's ledger. `packages/common/src` diff = empty. |

**Score:** 12/12 truths verified (0 present-but-behavior-unverified)

### Deferred Items

None. All four roadmap success criteria are met within Phase 8.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `packages-user/data-state/src/loader/__test__/loader.test.ts` | New loader coverage (codes 66/67/69 + `MotaDataLoader` surface) | ✓ VERIFIED | 176 lines, value-level assertions, `git`-tracked, collected by `test:ci`. |
| `script/test-data-node.ts` | Require paths synced to `__test__/` | ✓ VERIFIED | Lines 67, 122 point at `packages-user/data-state/__test__/...`. |
| 10 production D-10 files | Authorized minimal fixes | ✓ VERIFIED | All 10 present and registered in the 08-11 ledger; each is a targeted fix (see 08-11-SUMMARY §生产改动终审). |
| `packages-user/data-state/__test__/fixtures/closed-loop.ts` | Shared integration fixture aligned | ✓ VERIFIED | Real `IGameMap` `setFloor`, `.load()` removed; consumers (`dataClosure`, `nodeTracer`) green. |
| `packages-user/data-state/__test__/replayVerifier.ts` | Migrated helper | ✓ VERIFIED | Present under `__test__/`; required by `test-data-node.ts`. |
| Retired: `data-common/.../utils.test.ts`, `data-state/__test__/tileLegacy.test.ts` | Removed with sources | ✓ VERIFIED | Both absent from `git ls-files`; sources (`common/utils.ts`, `data-state/src/legacy/`) confirmed deleted. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `script/test-data-node.ts:67,122` | `data-state/__test__/{replayVerifier.ts,fixtures/closed-loop.ts}` | `createRequire` paths | ✓ WIRED | Paths updated; no residual `data-state/test/` references in the script. |
| `data-state/__test__/fixtures/closed-loop.ts` | `closed-loop` consumers (`coreNode`, `dataClosure`, `nodeTracer`, `replayPlayback`, `saveablesRoundTrip`) | shared fixture | ✓ WIRED | Consumers green in `test:ci`. |
| `packages-user/data-*/src/**` non-test files | Phase diff | git range `36d8b4f^..HEAD` | ✓ WIRED | Exactly the 10 registered D-10 files; `packages/common/src` zero diff. |
| `vite.config.ts` default include glob | `__test__/` discovery | Vitest default `**/*.{test,spec}.*` | ✓ WIRED | `test:ci` collected 65 files after migration (discovery preserved) — no config change needed. |

### Data-Flow Trace (Level 4)

N/A — infrastructure/test-only phase. No rendered UI or dynamic data flow was introduced; the deliverables are test files, a migrated fixture, and 10 targeted production fixes verified by running the test suites.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| CI suite green | `pnpm test:ci` | 65 files / 727 passed / 1 skipped / 0 failed | ✓ PASS |
| Perf suite green | `pnpm test:perf` | 6 files / 54 passed / 0 failed | ✓ PASS |
| No new skips | `git grep "it.skip\|it.todo\|describe.skip"` | exactly 1 (`equipment.test.ts:353`, code 147) | ✓ PASS |
| File census / placement | `git ls-files "*.test.ts" "*.perf.ts"` | 71 total, 70 under `__test__/`, 1 out-of-scope script | ✓ PASS |
| Lint errors | `pnpm exec eslint packages-user/data-{common,base,system,state}/src` | 6 problems (0 errors, 6 warnings) | ✓ PASS |
| Config untouched | `git diff 36d8b4f^..HEAD -- {vite,vitest.perf,tsconfig,eslint.config,package.json,pnpm-lock}` | empty | ✓ PASS |

### Probe Execution

N/A — no `scripts/*/tests/probe-*.sh` probes are declared or implied by this phase.

### Test Quality Audit

| Check | Result |
| ----- | ------ |
| Disabled tests linked to requirement | 1 total repo-wide: code 147 unreachable (approved D-04), not the only proof of TEST-02 → not a blocker |
| Circular test patterns | None detected (`writeFileSync`/fixture-generating scripts not coupled to the system-under-test) |
| Assertion strength on new gap-code tests | Value-level (`logger.catch` code assertions) and behavioral (`MotaDataLoader.start()` iteration) |
| Coverage quantity | 21 gap codes accounted (14 new assertions + 5 already-covered + 2 approved-unreachable) |

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (`check.decision-coverage-verify`: total 10, honored 10, not_honored []). D-01..D-10 accounted for; D-05 ("no interface changes") is satisfied via the explicitly user-authorized D-10 exceptions (e.g. `getPrefab` widened to `number | string`, `ITileBase.restoreDefaultEvents` declared) which are registered in the 08-11 ledger.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| TEST-02 | 08-01..08-11 (all 11 plans declare `requirements: [TEST-02]`) | 测试文件统一归入 `__test__` 目录，并按数据端当前接口对齐既有测试、修复重构遗漏导致的测试失效 | ✓ SATISFIED | Migration verified; `test:ci` 65/727/0 and `test:perf` 6/54/0 observed; skip = 1; 10-file production ledger reconciled. |
| (orphaned?) | — | REQUIREMENTS.md maps only TEST-02 to Phase 8. No additional IDs expected. | ✓ NONE | `grep "Phase 8"` on the traceability table returns only TEST-02. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| (phase-touched files) | — | `TBD`/`FIXME`/`XXX` debt markers | ℹ️ None | Zero debt markers in the 10 production files or in changed test files. |
| production `data-*/src` | various | `TODO` comments (e.g. `mapLayer.ts:841`) | ℹ️ Info | All pre-existing; outside the phase diff; not the debt-marker gate class. |
| test fixtures | various | `as never` casts | ℹ️ Info | Generic partial-fixture casts predating the phase; no `Object.create` and no `DirectionMapper` fabrication (the specific prohibition) — `git grep` = NONE. |

### Human Verification Required

N/A — Infrastructure/foundation phase (test reorganization + interface alignment; no user-facing elements). All acceptance criteria are verifiable programmatically and were verified by running the gates. No ⚠️ PRESENT_BEHAVIOR_UNVERIFIED or `insufficient_spec` truth was identified.

### Out-of-Scope Observations (not phase requirements — surfaced, not recorded as problems)

Per the verification brief and `AGENTS.md` (do not record issues as problems without user confirmation), the following are surfaced for the user, do **not** affect the verdict, and are **not** part of Phase 8's goal/SC:

1. **`08-REVIEW.md` (advisory)** — the code review of the 10 D-10 production files reported 3 Critical / 5 Warning / 3 Info findings (e.g. `hero/equipment.ts` equip replay param count, `map/tile.ts` dir4 face direction, `mapLayer.ts` `putMapData`/`resize` clipping). These were explicitly declared **not** Phase 8 requirements; they are handled by the separate review/remediation track and were not evaluated as gaps here.
2. **`pnpm test:data-node` currently exits 1** — "Replay verifier divergence: index=0; code=1; params=[]". This is an external Node harness, not one of the phase's acceptance gates (`test:ci`/`test:perf`). It is **pre-existing**: at the phase base `109fad3` `ReplaySandbox.step()` had no lazy pre-read while the harness manually sets `sandbox.playing = true`, so the same divergence already occurred before Phase 8 (the lazy pre-read was introduced by user refactor `75a39ad`, dated 2026-10-04, prior to Phase 8). The harness retains the obsolete manual `playing=true` bypass that 08-09 removed from `dataClosure.test.ts`.
3. **Approved dispositions (confirmed, not gaps)** — unreachable dead codes 68/70 recorded but not tested; `transferToDynamic` default-event behavior noted with production unchanged; pre-existing `no-console` warnings (6) retained.

### Gaps Summary

No gaps. All four roadmap success criteria are observably met: (1) all data-package test files live under `__test__/` and are still discovered; (2) `pnpm test:ci` is fully green (65 files / 727 passed / 1 skipped / 0 failed, independently re-run); (3) refactor-omission fixes are present and the production-change scope reconciles exactly to the 10 user-authorized D-10 files with no assertion-count erosion; (4) `pnpm test:perf` is green (6 / 54 / 0) with the skip count exactly 1. Decision coverage is 10/10. The only observations are out-of-scope (advisory code review + a pre-existing Node-harness failure) and do not bear on the phase goal.

---

_Verified: 2026-10-08T17:05:00Z_
_Verifier: the agent (gsd-verifier)_
