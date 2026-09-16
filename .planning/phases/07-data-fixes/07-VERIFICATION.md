---
phase: 07-data-fixes
verified: 2026-09-16T05:15:18Z
status: passed
score: 15/15 must-haves verified
covered_files:
  - .planning/phases/07-data-fixes/07-01-PLAN.md
  - .planning/phases/07-data-fixes/07-02-PLAN.md
  - .planning/phases/07-data-fixes/07-03-PLAN.md
  - .planning/phases/07-data-fixes/07-04-PLAN.md
  - .planning/phases/07-data-fixes/07-05-PLAN.md
  - .planning/phases/07-data-fixes/07-06-PLAN.md
  - .planning/phases/07-data-fixes/07-07-PLAN.md
  - .planning/phases/07-data-fixes/07-08-PLAN.md
  - .planning/phases/07-data-fixes/07-01-SUMMARY.md
  - .planning/phases/07-data-fixes/07-02-SUMMARY.md
  - .planning/phases/07-data-fixes/07-03-SUMMARY.md
  - .planning/phases/07-data-fixes/07-04-SUMMARY.md
  - .planning/phases/07-data-fixes/07-05-SUMMARY.md
  - .planning/phases/07-data-fixes/07-06-SUMMARY.md
  - .planning/phases/07-data-fixes/07-07-SUMMARY.md
  - .planning/phases/07-data-fixes/07-08-SUMMARY.md
  - .planning/phases/07-data-fixes/07-CONTEXT.md
  - .planning/phases/07-data-fixes/07-VALIDATION.md
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/WINDOWS.md
  - packages-user/data-base/src/enemy/manager.test.ts
  - packages-user/data-base/src/enemy/manager.ts
  - packages-user/data-base/src/hero/attribute.test.ts
  - packages-user/data-base/src/hero/attribute.ts
  - packages-user/data-base/src/hero/equipStore.ts
  - packages-user/data-base/src/hero/equipment.test.ts
  - packages-user/data-base/src/hero/equipment.ts
  - packages-user/data-base/src/hero/saveLoad.test.ts
  - packages-user/data-base/src/map/dynamicTile.ts
  - packages-user/data-base/src/map/mapLayer.test.ts
  - packages-user/data-base/src/map/mapLayer.ts
  - packages-user/data-base/src/map/saveLoad.test.ts
  - packages-user/data-common/src/common/mover.test.ts
  - packages-user/data-common/src/common/mover.ts
  - packages-user/data-common/src/replay/array.test.ts
  - packages-user/data-common/src/replay/array.ts
  - packages-user/data-state/src/core.ts
  - packages-user/data-state/test/replayPlayback.test.ts
  - packages-user/data-state/test/saveablesRoundTrip.test.ts
  - packages-user/data-system/src/combat/combat.test.ts
  - packages-user/data-system/src/combat/combat.ts
  - packages-user/data-system/src/combat/context.test.ts
  - packages-user/data-system/src/combat/context.ts
  - packages-user/data-system/src/combat/damage.test.ts
  - packages-user/data-system/src/combat/damage.ts
  - packages-user/data-system/src/combat/mapDamage.test.ts
  - packages-user/data-system/src/combat/mapDamage.ts
covered_digest: "v1:sha256:98780b1dd5915b369b84ba382a9cfa3abe7901c6c8c88e0f55cff1a9491c759d"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 7: 数据端缺陷修复 Verification Report

**Phase Goal:** 修复 Phase 6 单元测试暴露的数据端疑似缺陷，使正确预期用例转绿，且仅限数据端、不涉及渲染端
**Verified:** 2026-09-16T05:15:18Z
**Status:** passed
**Re-verification:** No — initial verification

**Method note:** every PLAN `must_haves` block (all 8 plans), all 4 ROADMAP Success Criteria, and the 20 `06-TEST-FINDINGS.md` entries were re-derived from the codebase. SUMMARY.md claims were treated as unverified hypotheses; each was falsified or confirmed against source diffs, source files and an actual `pnpm test:ci` run. All execution diffs were inspected commit-by-commit (`817201c..HEAD`).

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **SC1** — 登记的数据端疑似缺陷全部处置完毕（修复或经用户裁定改契约/不修复）：`#06-01-1..4`、`#06-03-1`、`#06-04-1..4`、`#06-05-1..3`、`#06-06-1`、`#06-07-1`、`#06-08-1`、`#06-09-1/2/3/5`、`#06-15-1` | ✓ VERIFIED | 19/20 fixed with production-code evidence (per-finding table below); `#06-05-3` retained by design (D-06); `#06-07-1` user wiring present in `core.ts:232-241`. `#06-09-4` correctly excluded (obsoleted by `c08f3f8`). |
| 2 | **SC2** — 对应的正确预期 `it.skip` 用例在修复后取消 skip 并通过；无法修复的缺陷经用户确认后同步修正接口文档/契约 | ✓ VERIFIED | Repo-wide skip census = **1** (`equipment.test.ts` `#06-05-3`, D-06 retained). 19 target skips un-skipped and green. Contract alignment verified: `#06-01-3` impl → `combat/types.ts:772` jsdoc; `#06-06-1` → `logger.json` warn-128 text; `#06-09-5` → `logger.json` warn-178 text; `#06-08-1` jsdoc reworded. See ⚠️ W-01 for one stale jsdoc table outside the plan's `files_modified`. |
| 3 | **SC3** — `pnpm test:ci` 全绿且不新增跳过用例，数据范围 `check:type` / `check:circular` 门禁通过 | ✓ VERIFIED | `pnpm test:ci` = **66 files / 680 passed, 1 skipped** (the planned D-06 skip). No `it.skip` added anywhere (diff audit). `eslint` on all 27 changed data-side files = exit 0. `vue-tsc --noEmit` = 27 errors, **0 in phase-7 changed files** (all in `client-modules`/`legacy-plugin-data`/`legacy-ui`, pre-existing). `check:circular` = 4 cycles, all in `packages/render`/`packages/anon-tokyo` (non-data). |
| 4 | **SC4** — 改动仅限数据端（`packages` 与 `packages-user/data-*`），不改动渲染端 `@user/client-*` 与 legacy 渲染接线 | ✓ VERIFIED | `git diff --name-only 817201c..HEAD` contains 26 `packages-user/data-*` files + `.planning/**` docs only. Filter for `client|legacy|render` → **empty**. No `package.json` / `pnpm-lock.yaml` change. |
| 5 | combat 四条根因（含同根因 `#06-15-1`）修复，4 个 `it.skip` 转绿 | ✓ VERIFIED | `damage.ts:229-234` (`targetInfo = middleInfo` moved into the `right` branch → info tracks `value: right`); `context.ts:696-699` (all `enemyViewMap` views `reset()` before full buildup); `mapDamage.ts:266-285` new `registerSourcedDamage` + `:412-425` skip deleted views; `combat.ts:179-180`. Tests un-skipped at `damage.test.ts`, `context.test.ts`, `mapDamage.test.ts`, `combat.test.ts`; all green. |
| 6 | combat `before` 返回 `false` 才放弃战斗（对齐 `types.ts:772` jsdoc）；3 条既有完整流程用例纠偏后仍绿 | ✓ VERIFIED | `combat.ts:179` `const proceed = await script.before(...)` / `:180` `if (!proceed) return damage;`. `types.ts` jsdoc already said "返回 `false` …放弃战斗" and is **unchanged** (implementation aligned to doc, D-03). 3 existing cases updated (`FakeScript(..., true)` at `combat.test.ts:292-294, 430`); the corrected assertion is *stronger* (4-element call order) not weaker. |
| 7 | 07-01 不新增任何 `it.skip` | ✓ VERIFIED | Diff shows only `-it.skip(` → `+it(` transitions in combat test files. |
| 8 | enemy 创建入口接入复用映射；未注册复用映射的 code/id 仍返回模板克隆 | ✓ VERIFIED | `manager.ts:120` `createEnemy` and `:126` `createEnemyById` now use `internalGetPrefab`. 2 skips un-skipped in `manager.test.ts`, green. |
| 9 | replay 编解码精确往返（int64 乘数、多字节 bigint、负值 type 5/8）＋ `delete`/`insert` 索引位移正确＋类型码表整体重编号 | ✓ VERIFIED | `array.ts:632` decode `low + high * 2147483648` (was `2147483647`); `:269-280` bigint magnitude bytes via `>> 8n*i & 0xffn`; `:640-668` `getUint8` reads + type 8 negation; `:377-419` `setParamArray` type 4/5 & 7/8; `:446-449` `insert` `copyWithin` direction reversed; `:468-495` `delete` new `getParamRange` + `for (let i = index; ...)`. 7 skips un-skipped; 4 A7-authorized new negative-value cases added. |
| 10 | hero `#06-09-1`（高）/`#06-09-2`/`#06-05-1`/`#06-05-2` 修复，8 个 skip 转绿 | ✓ VERIFIED | `equipStore.ts:119` `state.value` (was `state.percentage`) in `loadNoCompression`; `:137-150` `loadDiff` now seeds from `this.item.equip.value/percentage` then overlays diff; `equipment.ts:331-332` `saveState` deep copy (`new Map`, `[...slots]`); `:141` `empty === -1`; `attribute.ts:82-85` `finalAttribute[name] = this.attribute[name]` when no modifier. 8 skips un-skipped, green. |
| 11 | 码 147 对应用例保留 `it.skip` 并带中文说明注释，生产代码一行未动 | ✓ VERIFIED | `equipment.test.ts` retains the single `it.skip('warns code 147 when no equipment slot is available')` preceded by a comment stating 147 is a reserved, currently unreachable code, design as-is, production unmodified. `equipment.ts` diff contains **no** 147-related change; `logger.json` warn-147 text unchanged. |
| 12 | 越图 `transferToDynamic` 发码 128；`DynamicTile.loadState` 恢复 `num`；码 131 既有断言不回退 | ✓ VERIFIED | `mapLayer.ts:441` `logger.warn(128, x, y)` (was 131). `dynamicTile.ts:118-123` `loadState` now `this.set(save.num)` (was only `restoreDefaultEvents()`). `gameMap.test.ts:185` 131 assertion untouched (not in changed-file list). |
| 13 | `backward(count>1)` 保持同轴、朝向不变；单步 `backward` 与 `forward(2)` 不回退；jsdoc 与实现一致 | ✓ VERIFIED | `mover.ts:498-508` backward basis is now `this.faceDirection` (not `getCurrentDirection()`), so step 1's written opposite no longer becomes step 2's basis. `IObjectMover.backward` jsdoc rewritten (`:307-313`). 1 skip un-skipped, green. |
| 14 | 码 178 = `loaded.difference(total)`；缺 key 只触发 177 不触发 178；既有非 skip 用例按 D-05 纠偏 | ✓ VERIFIED | `core.ts:540` `const remain = loaded.difference(total)`. `saveablesRoundTrip.test.ts` existing case flipped to `expect(codes).toContain(177)` + `expect(codes).not.toContain(178)`; original `it.skip` un-skipped and green. |
| 15 | path `#06-07-1`：`core.ts` 提供 `useMapState`/`useMapLayer(null)`/`usePassPredicate`；测试侧绑定事件层后顶层录像瞬移转绿、用例重命名且不再 skip；AI 未修改生产源码；楼层切换重注入缺口登记为用户负责项 | ✓ VERIFIED | `core.ts:232-241` user wiring present (commit `1ff22dd`). `replayPlayback.test.ts` `createSmallMapScene` returns `map` (additive) and the case was renamed to `plays a teleport step after the event layer is bound on floor activation`, un-skipped, green. 07-08's own commits (`123493c`,`4a25e2e`,`2f148c9`) touched only the PLAN and that test file — production untouched. Residual gaps registered at `07-08-SUMMARY.md` coverage D2/D3 (`human_judgment: true`). |

**Score:** 15/15 truths verified (0 present-but-behavior-unverified)
**behavior_unverified:** 0 — every truth that asserts runtime behaviour is backed by an un-skipped, passing test executed in `pnpm test:ci`.

### Deferred Items

None. No later milestone phase (4 渲染适配 / 5 Legacy 移植) covers any Phase 7 deliverable. The residual path gaps are user-owned registrations, not deferred phase deliverables (see ⚠️ W-04).

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages-user/data-system/src/combat/damage.ts` | `findNextCritical` `info` aligned with yielded value | ✓ VERIFIED | `:229-234`; existing, substantive, wired through `calculateCritical`; data flows from `calculator.calculate` |
| `packages-user/data-system/src/combat/context.ts` | Full buildup resets all `EnemyView` | ✓ VERIFIED | `:696-699` uses existing `EnemyView.reset()` |
| `packages-user/data-system/src/combat/mapDamage.ts` | Sourced-damage reverse index coherent across write/delete/refresh | ✓ VERIFIED | `:266-285`, `:315-323`, `:359-367`, `:412-425`; `deleteEnemy` → `removeEnemyAffecting` clears `viewStore`/`damageStore`/`sourcedDamage` |
| `packages-user/data-system/src/combat/combat.ts` | `before` short-circuit per jsdoc | ✓ VERIFIED | `:179-180` |
| `packages-user/data-base/src/enemy/manager.ts` | All code/id template lookups go through `internalGetPrefab` | ✓ VERIFIED | `:120`, `:126`; invariant comment added |
| `packages-user/data-common/src/replay/array.ts` | Exact encode/decode round-trip + correct index edit | ✓ VERIFIED | type table `:11-24`, normalize `:246-299`, write `:377-419`, insert/delete `:446-495`, decode `:632-680` |
| `packages-user/data-base/src/hero/equipStore.ts` | NoCompression restores value/percentage; compressed loads fall back to `item.equip` | ✓ VERIFIED | `:119`, `:137-150` |
| `packages-user/data-base/src/hero/equipment.ts` | `saveState` deep copy; prefer first empty slot | ✓ VERIFIED | `:331-332`, `:141` |
| `packages-user/data-base/src/hero/attribute.ts` | No-modifier `final` reflects `base` | ✓ VERIFIED | `:82-85` |
| `packages-user/data-base/src/map/mapLayer.ts` | Out-of-map `transferToDynamic` emits 128 | ✓ VERIFIED | `:441` |
| `packages-user/data-base/src/map/dynamicTile.ts` | `loadState` restores `num` | ✓ VERIFIED | `:118-123` |
| `packages-user/data-common/src/common/mover.ts` | `backward` basis fixed across multi-step | ✓ VERIFIED | `:498-508`; jsdoc `:307-313`, `:464-470`, `:479-484` |
| `packages-user/data-state/src/core.ts` | Code 178 = keys saved but not loaded; finder wiring | ✓ VERIFIED | `:540`; `:232-241` |
| `packages-user/data-state/test/replayPlayback.test.ts` | Top-level teleport regression witness | ✓ VERIFIED | renamed case un-skipped, green |

All 8 planned production artifacts exist, are substantive (no stubs / placeholders / empty returns), and are wired to a real data source.

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `combat.ts:179` return-value test | `combat/types.ts:772` jsdoc (D-03 contract source) | `!proceed` semantics | ✓ WIRED | jsdoc unchanged; implementation now matches "返回 `false`…放弃战斗" |
| `context.ts buildup()` | `combat/enemy.ts` `EnemyView.reset()` | reuse of existing reset API | ✓ WIRED | `context.ts:698` |
| `mapDamage.ts` write path | `deleteEnemy`/`removeEnemyAffecting`/`refreshIndex` | `registerSourcedDamage` → `viewStore`/`damageStore` | ✓ WIRED | reader + deleter both keyed by the same `viewItem`/`index` |
| `damage.ts findNextCritical` | `calculateCritical` info consumer (`:182-189`) | `targetInfo` tracks `value: right` | ✓ WIRED | verified by un-skipped `damage.test.ts` assertion (`nextValue=1` ↔ `info.damage=90`) |
| `array.ts` decode multiplier | `array.ts` encode high/low 32-bit split | `2147483648` both sides | ✓ WIRED | `:632` ↔ `:380-383` |
| negative int64 type 5 | `setParamArray` magnitude write ↔ `decodeParam` negation | type code 5 | ✓ WIRED | `:383-391` ↔ `:645-650` |
| negative bigint type 8 | length prefix + magnitude bytes ↔ `getUint8` read + negation | type code 8 | ✓ WIRED | `:269-280` ↔ `:654-666` |
| short string `type = length + 9` | encode ↔ decode `length = type - 9` | type codes 10–255 | ✓ WIRED | `:284-292` ↔ `:676-681` |
| `equipStore.ts loadDiff` | `saveDiff` (`:80-88`) with `this.item.equip` as base | diff semantics | ✓ WIRED | `:137-150` |
| `equipment.ts saveState` deep copy | `ISaveableContent` contract (`data-common/src/save/types.ts:12-17`) | independent snapshot | ✓ WIRED | verified by un-skipped `saveLoad.test.ts` |
| `dynamicTile.ts loadState` | same-file `set` + `saveState` (`num`) | `set(save.num)` | ✓ WIRED | `:118-123` |
| `core.ts` finder injection | `path/finder.ts` `useMapState`/`useMapLayer`/`usePassPredicate` | `:236-241` | ✓ WIRED | teleport test green after test-side layer binding |
| `mapLayer.ts` code 128 | `logger.json` warn-128 text ("target position … out of bounds") | D-04 | ✓ WIRED | code text semantically matches the out-of-map branch |
| `core.ts:540` code 178 | `logger.json` warn-178 text ("saved but not be loaded") | D-05 | ✓ WIRED | `loaded.difference(total)` = saved-but-not-loaded |

No `NOT_WIRED` or `PARTIAL` key links.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `core.ts` `#06-09-5` | `remain` | `state.keys()` (real save map) `∩` `this.saveables.keys()` (real registry) | Yes | ✓ FLOWING |
| `mapDamage.ts registerSourcedDamage` | `index` / `damage` | `indexer.locaterToIndex` + `viewItem.getDamageWithoutCheck` | Yes | ✓ FLOWING |
| `equipStore.ts loadDiff` | `this.value` / `this.percentage` | `this.item.equip` (item definition) + `state` diff tables | Yes | ✓ FLOWING |
| `mapLayer.ts` warn 128 | `x`, `y` | caller-supplied coordinates on the out-of-bounds branch | Yes | ✓ FLOWING |
| `mover.ts prepareStep` | `this.moveDirection` | `this.faceDirection` (real state) | Yes | ✓ FLOWING |

No `STATIC`, `HOLLOW`, `HOLLOW_PROP` or `DISCONNECTED` data paths found. No static fallback or hardcoded literal stands in for a real source in any changed artifact.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Full data suite green, no new skips | `pnpm test:ci` | `Test Files 66 passed (66)`, `Tests 680 passed | 1 skipped (681)` | ✓ PASS |
| The 14 test files owning the 20 findings | `pnpm exec vitest run <14 files>` | `Test Files 14 passed (14)`, `Tests 279 passed | 1 skipped (280)` | ✓ PASS |
| Lint gate on changed files | `pnpm exec eslint <27 changed data-side files>` | no output, `exit=0` | ✓ PASS |
| Type gate in data range | `pnpm exec vue-tsc --noEmit` filtered to 27 changed files | 27 total error lines, **0** matching any changed file (all in `client-modules`/`legacy-plugin-data`/`legacy-ui`) | ✓ PASS |
| Circular gate in data range | `pnpm check:circular` | 4 cycles — `packages/render/src/core/*`, `packages/anon-tokyo/*`; none in `packages-user/data-*` | ✓ PASS |
| Renderer/legacy untouched | `git diff --name-only 817201c..HEAD \| Select-String "client\|legacy\|render"` | empty | ✓ PASS |
| No new skip introduced | repo-wide `it.skip`/`describe.skip` census | exactly **1** (`equipment.test.ts`, D-06 retained) | ✓ PASS |
| Debt markers in changed impl files | `Select-String "TBD\|FIXME\|XXX\|HACK\|PLACEHOLDER"` on every changed non-test `.ts` | none | ✓ PASS |

### Probe Execution

**SKIPPED** — no probe scripts exist (`scripts/**/probe-*.sh` → none) and no PLAN/SUMMARY declares a probe/PASS-marker/stage-marker contract. Validation is Vitest-based (`07-VALIDATION.md`: full suite `pnpm test:ci`), which was executed above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| FIX-01 | 07-01 … 07-08 (all 8 plans declare `requirements: [FIX-01]`) | 修复数据端单元测试暴露的缺陷（仅数据端，不含渲染端），使正确预期用例转绿 | ✓ SATISFIED | 19/20 defects fixed + `#06-05-3` by user adjudication (D-06) + `#06-07-1` user wiring; 19 target skips un-skipped and green; `pnpm test:ci` 680 passed / 1 skipped; changes confined to `packages-user/data-*` |

**Orphaned requirements:** none. `REQUIREMENTS.md` traceability maps only `FIX-01 → Phase 7`; every plan claims it. `TEST-01` (Phase 6) and all other IDs are outside this phase.

> Note: `REQUIREMENTS.md` still shows `FIX-01 … Pending` and `ROADMAP.md` shows Phase 7 `In Progress` — these are the orchestrator's post-verification bookkeeping writes, not phase deliverables. Flagged as ℹ️ I-03.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `packages-user/data-common/src/replay/types.ts` | 246-257, 334-346 | Stale param-type table in public jsdoc (`getParamArray()`, `IReplaySystemSave.paramArray`) — still documents pre-renumbering codes (4 int64 / 5 float / 6 bigint / 7 string / 8–255 `n-7`); implementation now uses 4 non-neg int64 / 5 neg int64 / 6 float / 7 non-neg bigint / 8 neg bigint / 9 string / 10–255 `n+9` | ⚠️ Warning | Documentation-only drift introduced by this phase's A10 renumbering. **Zero runtime/test impact** (231 focused tests + full suite green). `replay/types.ts` was outside 07-03's `files_modified`, so the executor was prohibited from updating it. See Gaps Summary → W-01. |
| `.planning/phases/07-data-fixes/07-03-SUMMARY.md` | 301 | Claim "本计划范围内已确认无其他消费方：`types.ts` 的 `ReplayParamValue` 不暴露类型码" is incomplete — the check covered only `ReplayParamValue` and missed the two type-code tables in the same file | ⚠️ Warning | SUMMARY accuracy (not code). No effect on the goal; recorded because SUMMARY claims are not evidence. |
| `.gsd/dispatch-isolation-sentinel.json` | — | GSD harness bookkeeping file committed inside `1ff22dd`; not gitignored | ℹ️ Info | Non-source, 2-line tool state; no functional impact. |
| `.planning/ROADMAP.md` | 312 | Phase 7 Wave 8 checkbox still `[ ]` while the Plans list (`:280`) and the Plan itself are `[x]` | ℹ️ Info | Tracking-only inconsistency; orchestrator bookkeeping. |

No debt markers (`TBD`/`FIXME`/`XXX`) in any file changed by this phase → debt-marker gate clean. No stub, no weakened assertion, no removed assertion: the only changed assertions across all 20 test files are the user-authorized ones (A10 type-token renumbering in `array.test.ts`, D-05 code 177/178 in `saveablesRoundTrip.test.ts`, D-09 route revision `x=1`→`x=2` in `replayPlayback.test.ts`, and the D-09 combat correction which is *stronger* than before). Every other un-skipped test kept its Phase-6 correct-expectation assertion byte-for-byte.

### Human Verification Required

None. Every must-have truth resolves to a passing, un-skipped automated test or to programmatically verifiable source state. No visual, real-time, external-service or performance behaviour is claimed by this phase (it is a headless data-layer phase, D-12).

Items deliberately **not** raised as human-verification items, with rationale:

- **`#06-05-3` code 147 retained** — user adjudication already recorded in `07-CONTEXT.md` D-06; verified statically (skip + comment present, production unchanged).
- **Residual path gaps (W-04)** — user adjudication already recorded in `07-08-SUMMARY.md` D2/D3 (`只登记不修`, `human_judgment: true`). They are registered outcomes, not unverified claims of this phase.

## Gaps Summary

**No phase-goal gap.** All 20 registered data-side defects are disposed of as the user adjudicated; all 19 un-skippable correct-expectation cases are green; `pnpm test:ci` is 680 passed / 1 skipped (the single remaining skip is the D-06-by-design one); lint/type gates are clean in the data range; the renderer/legacy boundary is untouched.

Four non-blocking observations are recorded above. The only one that warrants a developer decision:

**W-01 — stale public param-type table in `replay/types.ts` (documentation drift, plan-boundary blocked).**
The A10 renumbering (user-approved mid-execution) changed the byte-level meaning of every replay parameter type code and updated the table in `array.ts:11-24`, but two public jsdoc blocks in the same module still publish the old table:

- `types.ts:246-257` — `IReplayArray.getParamArray()` jsdoc
- `types.ts:334-346` — `IReplaySystemSave.paramArray` jsdoc

Both say `4: int64 / 5: float / 6: bigint / 7: string / 8~255: n-7`. Correct table: `4 非负 int64 / 5 负 int64 / 6 float / 7 非负 bigint / 8 负 bigint / 9 长字符串 / 10–255 短字符串 (type = length + 9)`. Before this phase `array.ts` and `types.ts` agreed, so this phase introduced the divergence — a D-11 ("文档与实现一致") gap. It was **not** a must-have failure: 07-03's prohibition restricted edits to `array.test.ts`/`array.ts` (`files_modified`), so the executor was forbidden from touching `types.ts`, and no PLAN truth covers this doc. It is reported as ⚠️ Warning (not a 🛑 Blocker) because it does not prevent goal achievement: no test exercises it and no runtime behaviour depends on it. Recommended resolution: one doc-only commit updating both tables (no code change, no new tests, safe under D-10).

**W-04 (registered, no action this phase)** — the two residual path-side production gaps the user ruled "只登记不修":
(a) `pathfinding.teleportTo` self-target/empty-path returns `null` → code 2005 → sandbox hang (`finder.find` early-returns when `startIndex === targetIndex`); (b) no production call site re-invokes `useMapLayer` on floor switch, so the event layer is `null` after switching floors and `teleportTo` hits warn 173 in real gameplay. Both are documented at `07-08-SUMMARY.md` coverage D2/D3 with `human_judgment: true`, and are outside all 8 plans' must-haves. Recorded here so they are not lost at phase close.

---

_Verified: 2026-09-16T05:15:18Z_
_Verifier: the agent (gsd-verifier)_
