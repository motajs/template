---
phase: 07-data-fixes
verified: 2026-09-16T05:49:24Z
status: passed
score: 15/15 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/WINDOWS.md
  - .planning/phases/07-data-fixes/07-01-PLAN.md
  - .planning/phases/07-data-fixes/07-01-SUMMARY.md
  - .planning/phases/07-data-fixes/07-02-PLAN.md
  - .planning/phases/07-data-fixes/07-02-SUMMARY.md
  - .planning/phases/07-data-fixes/07-03-PLAN.md
  - .planning/phases/07-data-fixes/07-03-SUMMARY.md
  - .planning/phases/07-data-fixes/07-04-PLAN.md
  - .planning/phases/07-data-fixes/07-04-SUMMARY.md
  - .planning/phases/07-data-fixes/07-05-PLAN.md
  - .planning/phases/07-data-fixes/07-05-SUMMARY.md
  - .planning/phases/07-data-fixes/07-06-PLAN.md
  - .planning/phases/07-data-fixes/07-06-SUMMARY.md
  - .planning/phases/07-data-fixes/07-07-PLAN.md
  - .planning/phases/07-data-fixes/07-07-SUMMARY.md
  - .planning/phases/07-data-fixes/07-08-PLAN.md
  - .planning/phases/07-data-fixes/07-08-SUMMARY.md
  - .planning/phases/07-data-fixes/07-CONTEXT.md
  - .planning/phases/07-data-fixes/07-REVIEW.md
  - .planning/phases/07-data-fixes/07-VALIDATION.md
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
  - packages-user/data-common/src/replay/types.ts
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
covered_digest: "v1:sha256:3bf6ed091cc87e9e495a7fea8e47719280754fca71eb0a29f4f2d5e2f401996e"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 15/15
  gaps_closed: []
  gaps_remaining: []
  regressions: []
advisory:
  - finding: "CR-01 — ReplayArray.set() shifts later indexArray entries from the byte offset paramStart + 1 instead of the command index, and reads nextParam from the unwritten indexArray[index + 1] for the last command (same defect family the phase fixed in delete())"
    category: other
    reason: "Already registered and user-adjudicated out of scope: 07-03-PLAN.md (:54, :105, :364) and 07-03-SUMMARY.md (:275-280, :302) record ReplayArray.set and insert(index === length) as 同族未登记缺口 — 只登记不修. No PLAN must-have claims set() is fixed; 07-03's truth only requires the existing set() green cases not to regress. array.ts was not modified since the prior verified: timestamp, so this is not a regression, and no named test fails on it (the review states current tests cannot catch it)."
    evidence_status: "none provided"
  - finding: "CR-02 — MapDamage leaves stale reduced damage when a source enemy's damage shrinks or disappears, because removeEnemyAffecting() never marks the removed indexes dirty nor clears their reducedCache entries"
    category: other
    reason: "Adjacent, unregistered defect outside the phase's must-haves. removeEnemyAffecting() is unchanged by this phase (verified via git diff 817201c..HEAD -- mapDamage.ts: it appears only as context, not as a hunk). The registered defect #06-01-2 (deleteEnemy clears enemy-sourced damage) is fixed and green; the review itself notes deleteEnemy masks this path and the current tests do not catch it. No must-have covers the shrink/disappear path."
    evidence_status: "none provided"
  - finding: "WR-01 — bigint byte-length field overflows for |value| ≥ 2^2040 (one-byte length wraps to 0, desyncing the param buffer)"
    category: other
    reason: "Pre-existing range guard/write convention (array.ts arr.length length byte + wall guard at 2^2047 were not introduced by this phase's hunks); no must-have truth covers magnitudes at that scale and no test exercises it."
    evidence_status: "none provided"
  - finding: "WR-02 — command param-count byte uses the untruncated params.length while only 255 params are written"
    category: other
    reason: "add()'s setCommandArray(..., params.length, ...) is unchanged by this phase (pre-existing; normalizeParamList's 255 truncation + warn 153 predate it). No must-have covers >255-parameter commands and no test exercises it."
    evidence_status: "none provided"
  - finding: "WR-03 — the param type-code renumbering is not backward compatible and IReplaySystemSave has no format-version marker"
    category: architectural
    reason: "Deliberate, user-adjudicated design (07-03-PLAN.md A8/A9/A10 + D-09 approve-both extended): the table was fully renumbered with no legacy codes retained, and the change is recorded in 07-03-SUMMARY.md. It contradicts no must-have — the must-have requires the renumbering to be consistent in encode/decode and the type-byte assertions updated, which holds."
    evidence_status: "none provided"
  - finding: "WR-04 — equipment modifier values are never persisted because this.value/this.percentage are only ever copied from item.equip"
    category: architectural
    reason: "Contract-level design question, not a must-have failure: the phase's registered expectation (#06-09-1) is that the definition base is restored and the saved diff overlaid, which the un-skipped saveLoad.test.ts cases assert and pass. Whether live modifier mutations should persist is an undesigned contract; the registered defects do not cover it."
    evidence_status: "none provided"
  - finding: "WR-05 — HeroAttribute.deleteModifierByIndex() does not unbind/clean the modifier graph like deleteModifier()"
    category: other
    reason: "Pre-existing method untouched by this phase (attribute.ts diff is confined to recalculateAttribute, #06-05-1, at :79-85). No must-have covers it; no test fails on it."
    evidence_status: "none provided"
  - finding: "WR-06 — HeroEquipment.loadState() appends spurious Equip replay commands because it restores through the recording public equip()"
    category: other
    reason: "Pre-existing loadState() body (equipment.ts diff is confined to getCouldEquipSlot :141 and saveState :331-332). The review notes the effect is masked by saveable iteration order in CoreState.loadState(). No must-have covers replay-route cleanliness during load; no test fails on it."
    evidence_status: "none provided"
  - finding: "WR-07 — ReplayArray.insert()/delete()/set() do not validate index bounds"
    category: other
    reason: "Pre-existing; insert(index === length) is explicitly registered as 只登记不修 in 07-03-PLAN.md (:54, :331, :364) and 07-03-SUMMARY.md. No must-have requires index validation; no named test fails."
    evidence_status: "none provided"
---

# Phase 7: 数据端缺陷修复 Verification Report

**Phase Goal:** 修复 Phase 6 单元测试暴露的数据端疑似缺陷，使正确预期用例转绿，且仅限数据端、不涉及渲染端
**Verified:** 2026-09-16T05:49:24Z
**Status:** passed
**Re-verification:** Yes — after post-verification commits (0224c2e doc-only `replay/types.ts` param-table fix; 4f31627 untrack/ignore the dispatch sentinel; 9e91785 add `07-REVIEW.md`; plus `state.json`/`milestone.lock` tracking churn)

**Method note:** every PLAN `must_haves` block (all 8 plans), all 4 ROADMAP Success Criteria, and the 20 `06-TEST-FINDINGS.md` entries were re-derived from the codebase. SUMMARY.md claims were treated as unverified hypotheses and falsified or confirmed against source diffs, source files, and a fresh `pnpm test:ci` run. The stale previous fingerprint was replaced (covered set now includes the post-verification `replay/types.ts` change and the `07-REVIEW.md` artifact).

### Post-verification changes reconciled (delta vs prior report)

| Prior finding | Disposition now | Evidence |
| --- | --- | --- |
| ⚠️ W-01 stale replay param-type table in public jsdoc (`replay/types.ts`) | **RESOLVED** | Commit `0224c2e`. `types.ts:249-258` and `:336-347` now publish the post-renumbering table. Both byte-size columns were checked against the implementation and are correct (int64/float 9 Byte; bigint n+2 at `array.ts:284`; long string n+5 at `:300`; short string n+1 at `:293`). Residual cosmetic nit: `:341` labels type 4 `int64` and `:344` type 7 `bigint` where the sibling table says `非负 int64`/`非负 bigint` — byte sizes and renumbering are accurate, so this is ℹ️ Info only. |
| ℹ️ I-02 `.gsd/dispatch-isolation-sentinel.json` committed & un-gitignored | **RESOLVED** | Commit `4f31627`: file untracked, `.gitignore` now contains `.gsd/` (`git diff 615ff5f..HEAD -- .gitignore`). |
| ℹ️ I-03 `REQUIREMENTS.md` showed `FIX-01 … Pending`, `ROADMAP.md` showed Phase 7 `In Progress` | **RESOLVED** | `REQUIREMENTS.md:41` is `[x] FIX-01`, traceability row `:70` = `Complete`; `ROADMAP.md:327` = `7. … | 8/8 | Complete | 2026-09-16`. |
| ℹ️ I-04 Phase 7 Wave 8 checkbox `[ ]` | **RESOLVED** | `ROADMAP.md:312` is `[x]`. |
| — | **NEW** code review (`07-REVIEW.md`, 2 critical + 7 warnings) | All 9 findings classified **advisory** (see `advisory:` frontmatter and the Advisory section). None contradicts a must-have; CR-01 is explicitly registered as 只登记不修; neither critical touches a file modified since the prior verification. |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **SC1** — 登记的数据端疑似缺陷全部处置完毕（修复或经用户裁定改契约/不修复）：`#06-01-1..4`、`#06-03-1`、`#06-04-1..4`、`#06-05-1..3`、`#06-06-1`、`#06-07-1`、`#06-08-1`、`#06-09-1/2/3/5`、`#06-15-1` | ✓ VERIFIED | 19/20 fixed with production-code evidence (per-finding table below); `#06-05-3` retained by design (D-06); `#06-07-1` user wiring present in `core.ts:232-241`. `#06-09-4` correctly excluded (obsoleted by `c08f3f8`). |
| 2 | **SC2** — 对应的正确预期 `it.skip` 用例在修复后取消 skip 并通过；无法修复的缺陷经用户确认后同步修正接口文档/契约 | ✓ VERIFIED | Repo-wide disabled-test census = **1** (`equipment.test.ts:306`, `#06-05-3`, D-06 retained + comment at `:305`). All 19 target skips are active and green. Contract alignment verified: `#06-01-3` impl → `types.ts:772` jsdoc (impl aligned to doc, unchanged); `#06-06-1` → `logger.json` warn-128 text; `#06-09-5` → warn-178 text; the stale `replay/types.ts` table is now fixed (W-01 resolved). |
| 3 | **SC3** — `pnpm test:ci` 全绿且不新增跳过用例，数据范围 `check:type` / `check:circular` 门禁通过 | ✓ VERIFIED | Fresh run: `Test Files 66 passed (66)`, `Tests 680 passed | 1 skipped (681)`. `eslint` on all 28 changed data-side files = exit 0. `vue-tsc --noEmit` = 27 error lines, **0 in phase-7 changed files** (all in `client-modules`/`legacy-plugin-data`/`legacy-ui`, pre-existing). `check:circular` = 4 cycles, all in `packages/render`/`packages/anon-tokyo` (non-data). |
| 4 | **SC4** — 改动仅限数据端（`packages` 与 `packages-user/data-*`），不改动渲染端 `@user/client-*` 与 legacy 渲染接线 | ✓ VERIFIED | `git diff --name-only 817201c..HEAD` filtered for `client|legacy|render` → **empty**. Non-planning changes are `.gitignore`, the removed `.gsd` sentinel, and 28 `packages-user/data-*` files. No `package.json` / `pnpm-lock.yaml` change. |
| 5 | combat 四条根因（含同根因 `#06-15-1`）修复，4 个 `it.skip` 转绿 | ✓ VERIFIED | `damage.ts:229-234` (`targetInfo = middleInfo` inside the `right` branch); `context.ts:696-699` (all `enemyViewMap` views `reset()` before the full buildup, unconditional); `mapDamage.ts:266-285` `registerSourcedDamage` + `:412-425` skip deleted views; `combat.ts:179-180`. Tests un-skipped and green, incl. `mapDamage.test.ts:532` `removes enemy-sourced damage when the enemy is deleted`. |
| 6 | combat `before` 返回 `false` 才放弃战斗（对齐 `types.ts:772` jsdoc）；3 条既有完整流程用例纠偏后仍绿 | ✓ VERIFIED | `combat.ts:179` `const proceed = await script.before(...)` / `:180` `if (!proceed) return damage;`. `types.ts` jsdoc already said 返回 `false`…放弃战斗 and is unchanged (implementation aligned to doc, D-03). 3 existing cases updated; the corrected assertion is stronger (4-element call order), not weaker. |
| 7 | 07-01 不新增任何 `it.skip` | ✓ VERIFIED | Diff shows only `-it.skip(` → `+it(` transitions in the combat test files; repo-wide census remains 1. |
| 8 | enemy 创建入口接入复用映射；未注册复用映射的 code/id 仍返回模板克隆 | ✓ VERIFIED | `manager.ts:120` `createEnemy` and `:128` `createEnemyById` use `internalGetPrefab`; invariant comment at `:125-126`; 2 skips un-skipped, green. |
| 9 | replay 编解码精确往返（int64 乘数、多字节 bigint、负值 type 5/8）＋ `delete`/`insert` 索引位移正确＋类型码表整体重编号 | ✓ VERIFIED | `array.ts:647` decode `low + high * 2147483648` (was `2147483647`); `:653` type-5 negation; `:269-285` bigint magnitude bytes; `:660-666` type-8 `getUint8` read; `:377-394` write path; `:446-450` `insert` `copyWithin` direction reversed; `:467-495` `delete` uses new `getParamRange` + `for (let i = index; ...)`; `:677` `length = type - 9`. `array.test.ts` = 46 `it(` / 0 `it.skip(`. |
| 10 | hero `#06-09-1`（高）/`#06-09-2`/`#06-05-1`/`#06-05-2` 修复，8 个 skip 转绿 | ✓ VERIFIED | `equipStore.ts:119` `state.value` (was `state.percentage`) in `loadNoCompression`; `:137-150` `loadDiff` seeds from `this.item.equip.value/percentage` then overlays diff; `equipment.ts:331-332` `saveState` deep copy (`new Map`, `[...slots]`); `:141` `empty === -1`; `attribute.ts:82-85` `finalAttribute[name] = this.attribute[name]` when no modifier. 8 skips un-skipped, green. |
| 11 | 码 147 对应用例保留 `it.skip` 并带中文说明注释，生产代码一行未动 | ✓ VERIFIED | `equipment.test.ts:305-306`: comment 保留错误码 147…设计如此…生产代码不修改 immediately precedes the single `it.skip`. `equipment.ts` diff contains no 147-related change; `logger.json` warn-147 text unchanged. |
| 12 | 越图 `transferToDynamic` 发码 128；`DynamicTile.loadState` 恢复 `num`；码 131 既有断言不回退 | ✓ VERIFIED | `mapLayer.ts:441` `logger.warn(128, x.toString(), y.toString())`. `dynamicTile.ts:122-123` `loadState` calls `this.set(save.num)`. `logger.json` warn-131 text unchanged. |
| 13 | `backward(count>1)` 保持同轴、朝向不变；单步 `backward` 与 `forward(2)` 不回退；jsdoc 与实现一致 | ✓ VERIFIED | `mover.ts:501-505` backward basis is `this.faceDirection` (not `getCurrentDirection()`), so step 1's written opposite no longer becomes step 2's basis. 1 skip un-skipped, green. |
| 14 | 码 178 = `loaded.difference(total)`；缺 key 只触发 177 不触发 178；既有非 skip 用例按 D-05 纠偏 | ✓ VERIFIED | `core.ts:540` `const remain = loaded.difference(total);` — matches `logger.json` warn-178 文案 (saved but not be loaded) and stays disjoint from warn-177 (needed but absent). `saveablesRoundTrip.test.ts` case flipped to `toContain(177)` + `not.toContain(178)`; original skip un-skipped and green. |
| 15 | path `#06-07-1`：`core.ts` 提供 `useMapState`/`useMapLayer(null)`/`usePassPredicate`；测试侧绑定事件层后顶层录像瞬移转绿、用例重命名且不再 skip；AI 未修改生产源码；楼层切换重注入缺口登记为用户负责项 | ✓ VERIFIED | `core.ts:232-241` user wiring present (commit `1ff22dd`). `replayPlayback.test.ts:363` `it('plays a teleport step after the event layer is bound on floor activation', …)` — renamed, active, green. 07-08's commits (`123493c`,`4a25e2e`,`2f148c9`) touched only the PLAN and that test file. Residual gaps registered at `07-08-SUMMARY.md` coverage D2/D3 (`human_judgment: true`). |

**Score:** 15/15 truths verified (0 present-but-behavior-unverified)
**behavior_unverified:** 0 — every truth that asserts runtime behaviour is backed by an active, passing test executed in `pnpm test:ci`.

### Deferred Items

None. No later milestone phase (4 渲染适配 / 5 Legacy 移植) covers any Phase 7 deliverable. The residual path-side gaps and the adjacent review findings are registered/user-owned, not deferred phase deliverables.

### Advisory (New Scope, Unevidenced)

New-scope findings from Step 7 with no deterministic evidence — reported, not blocking, do not revert a completed must-have.

| # | Finding | Category | Why Advisory |
| --- | --- | --- | --- |
| 1 | **CR-01** `ReplayArray.set()` index-shift uses `paramStart + 1` and last-command `nextParam` is unwritten | other | Already registered in `07-03-SUMMARY.md:275-280` as 同族未登记缺口·只登记不修 (user-adjudicated out of scope). `array.ts` not modified since prior verification; no must-have claims `set()` is fixed; no test fails. |
| 2 | **CR-02** `MapDamage` stale reduced damage when a source enemy's damage shrinks/disappears | other | `removeEnemyAffecting()` is unchanged by this phase (context-only in the diff); registered defect `#06-01-2` is fixed and green; the review states current tests cannot catch it. |
| 3 | **WR-01** bigint length byte overflow for \|value\| ≥ 2^2040 | other | Pre-existing guard/write convention; no must-have covers that magnitude; no test. |
| 4 | **WR-02** param-count byte uses untruncated `params.length` when >255 | other | `add()`/`normalizeParamList` unchanged by the phase; no must-have covers >255 params; no test. |
| 5 | **WR-03** type-code renumbering not backward compatible, no format version | architectural | Deliberate, user-adjudicated (A8/A9/A10, D-09); recorded in `07-03-SUMMARY.md`; the renumbering must-have itself holds. |
| 6 | **WR-04** equipment modifier runtime values never persisted | architectural | Contract-level, not must-have: `#06-09-1`'s expectation (definition base restored + diff overlaid) is asserted and green. |
| 7 | **WR-05** `deleteModifierByIndex()` leaves the modifier graph inconsistent | other | Pre-existing method untouched (attribute.ts diff limited to `recalculateAttribute`); no test fails. |
| 8 | **WR-06** `HeroEquipment.loadState()` records replay commands via `equip()` | other | Pre-existing body; masked by saveable iteration order per the review; no must-have; no test. |
| 9 | **WR-07** `insert()`/`delete()`/`set()` do not validate `index` | other | Pre-existing; `insert(index === length)` explicitly registered 只登记不修; no test fails. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages-user/data-system/src/combat/damage.ts` | `findNextCritical` `info` aligned with yielded value | ✓ VERIFIED | `:229-234`; wired through `calculateCritical`; data flows from `calculator.calculate` |
| `packages-user/data-system/src/combat/context.ts` | Full buildup resets all `EnemyView` | ✓ VERIFIED | `:696-699` unconditional loop over `enemyViewMap.values()` |
| `packages-user/data-system/src/combat/mapDamage.ts` | Sourced-damage reverse index coherent across write/delete/refresh | ✓ VERIFIED | `:266-285`, `:318-324`, `:362-368`, `:412-425` |
| `packages-user/data-system/src/combat/combat.ts` | `before` short-circuit per jsdoc | ✓ VERIFIED | `:179-180` |
| `packages-user/data-base/src/enemy/manager.ts` | All code/id template lookups go through `internalGetPrefab` | ✓ VERIFIED | `:120`, `:128`; invariant comment `:125-126` |
| `packages-user/data-common/src/replay/array.ts` | Exact encode/decode round-trip + correct index edit | ✓ VERIFIED | type table `:11-26`, normalize `:225-310`, write `:377-398`, insert/delete `:437-499`, decode `:640-681` |
| `packages-user/data-common/src/replay/types.ts` | Public param-type table aligned with the renumbered codes | ✓ VERIFIED | `:249-258`, `:336-347`; byte sizes cross-checked against `array.ts` (W-01 resolved by `0224c2e`) |
| `packages-user/data-base/src/hero/equipStore.ts` | NoCompression restores value/percentage; compressed loads fall back to `item.equip` | ✓ VERIFIED | `:119`, `:137-150` |
| `packages-user/data-base/src/hero/equipment.ts` | `saveState` deep copy; prefer first empty slot | ✓ VERIFIED | `:331-332`, `:141` |
| `packages-user/data-base/src/hero/attribute.ts` | No-modifier `final` reflects `base` | ✓ VERIFIED | `:82-85` |
| `packages-user/data-base/src/map/mapLayer.ts` | Out-of-map `transferToDynamic` emits 128 | ✓ VERIFIED | `:441` |
| `packages-user/data-base/src/map/dynamicTile.ts` | `loadState` restores `num` | ✓ VERIFIED | `:122-123` |
| `packages-user/data-common/src/common/mover.ts` | `backward` basis fixed across multi-step | ✓ VERIFIED | `:501-505` |
| `packages-user/data-state/src/core.ts` | Code 178 = keys saved but not loaded; finder wiring | ✓ VERIFIED | `:540`; `:232-241` |
| `packages-user/data-state/test/replayPlayback.test.ts` | Top-level teleport regression witness | ✓ VERIFIED | `:363` renamed case, active, green |

All planned production artifacts exist, are substantive (no stubs / placeholders / empty returns — the `return null` matches are all guard clauses), and are wired to a real data source.

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `combat.ts:179` return-value test | `combat/types.ts:772` jsdoc (D-03 contract source) | `!proceed` semantics | ✓ WIRED | jsdoc unchanged; implementation now matches 返回 `false`…放弃战斗 |
| `context.ts buildup()` | `combat/enemy.ts` `EnemyView.reset()` | reuse of existing reset API | ✓ WIRED | `context.ts:698` |
| `mapDamage.ts` write path | `deleteEnemy`/`removeEnemyAffecting`/`refreshIndex` | `registerSourcedDamage` → `viewStore`/`damageStore` | ✓ WIRED | reader + deleter keyed by the same `viewItem`/`index`; `mapDamage.test.ts:532` green |
| `damage.ts findNextCritical` | `calculateCritical` info consumer | `targetInfo` tracks `value: right` | ✓ WIRED | verified by un-skipped `damage.test.ts` assertion |
| `array.ts` decode multiplier | `array.ts` encode high/low split | `2147483648` both sides | ✓ WIRED | `:647` ↔ `:380-381` |
| negative int64 type 5 | `setParamArray` magnitude write ↔ `decodeParam` negation | type code 5 | ✓ WIRED | `:377-383` ↔ `:653` |
| negative bigint type 8 | length prefix + magnitude bytes ↔ `getUint8` read + negation | type code 8 | ✓ WIRED | `:269-285` ↔ `:660-666` |
| short string `type = length + 9` | encode ↔ decode `length = type - 9` | type codes 10–255 | ✓ WIRED | `:288-294` ↔ `:677` |
| `equipStore.ts loadDiff` | `saveDiff` with `this.item.equip` as base | diff semantics | ✓ WIRED | `:137-150` |
| `equipment.ts saveState` deep copy | `ISaveableContent` contract | independent snapshot | ✓ WIRED | verified by un-skipped `saveLoad.test.ts` |
| `dynamicTile.ts loadState` | same-file `set` + `saveState` (`num`) | `set(save.num)` | ✓ WIRED | `:122-123` |
| `core.ts` finder injection | `path/finder.ts` `useMapState`/`useMapLayer`/`usePassPredicate` | `:236-241` | ✓ WIRED | teleport test green after test-side layer binding |
| `mapLayer.ts` code 128 | `logger.json` warn-128 text | D-04 | ✓ WIRED | "target position $3,$4 out of bounds" |
| `core.ts:540` code 178 | `logger.json` warn-178 text | D-05 | ✓ WIRED | `loaded.difference(total)` = saved-but-not-loaded |
| `replay/types.ts` param table | `array.ts` type table `:11-26` | align 0224c2e | ✓ WIRED | both tables now describe 4/5 int64, 6 float, 7/8 bigint, 9 long string, 10–255 short string |

No `NOT_WIRED` or `PARTIAL` key links.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `core.ts` `#06-09-5` | `remain` | `state.keys()` (real save map) `∩` `this.saveables.keys()` (real registry) | Yes | ✓ FLOWING |
| `mapDamage.ts registerSourcedDamage` | `index` / `damage` | `range.iterateLoc` + `viewItem.getDamageWithoutCheck` | Yes | ✓ FLOWING |
| `equipStore.ts loadDiff` | `this.value` / `this.percentage` | `this.item.equip` (item definition) + `state` diff tables | Yes | ✓ FLOWING |
| `mapLayer.ts` warn 128 | `x`, `y` | caller-supplied coordinates on the out-of-bounds branch | Yes | ✓ FLOWING |
| `mover.ts prepareStep` | `this.moveDirection` | `this.faceDirection` (real state) | Yes | ✓ FLOWING |
| `replay/types.ts` param table | jsdoc only | mirrors `array.ts` constants | N/A (doc) | ✓ FLOWING |

No `STATIC`, `HOLLOW`, `HOLLOW_PROP` or `DISCONNECTED` data paths found.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Full data suite green, no new skips | `pnpm test:ci` | `Test Files 66 passed (66)`, `Tests 680 passed | 1 skipped (681)` | ✓ PASS |
| Lint gate on changed files | `pnpm exec eslint <28 changed data-side files>` | no output, `exit=0` | ✓ PASS |
| Type gate in data range | `pnpm exec vue-tsc --noEmit` | 27 error lines, **0** matching any changed phase-7 file | ✓ PASS |
| Circular gate in data range | `pnpm check:circular` | 4 cycles, all `packages/render/*` / `packages/anon-tokyo/*`; none in `packages-user/data-*` | ✓ PASS |
| Renderer/legacy untouched | `git diff --name-only 817201c..HEAD \| Select-String "client\|legacy\|render"` | empty | ✓ PASS |
| No new skip introduced | repo-wide disabled-test census | exactly **1** (`equipment.test.ts:306`, D-06 retained) | ✓ PASS |
| Debt markers in changed impl files | `Select-String "TBD\|FIXME\|XXX"` on every changed non-test `.ts` (14 files) | none | ✓ PASS |
| Retained skip comment present | `equipment.test.ts:305` | 保留错误码 147…设计如此…生产代码不修改 | ✓ PASS |
| Fingerprint fresh | `query verification.fingerprint <phaseDir> <50 files>` | `v1:sha256:3bf6ed09…` (matches frontmatter) | ✓ PASS |

### Probe Execution

**SKIPPED** — no probe scripts exist (`scripts/**/probe-*.sh` → none) and no PLAN/SUMMARY declares a probe/PASS-marker/stage-marker contract. Validation is Vitest-based (`07-VALIDATION.md`: full suite `pnpm test:ci`), which was executed above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| FIX-01 | 07-01 … 07-08 (all 8 plans declare `requirements: [FIX-01]`) | 修复数据端单元测试暴露的缺陷（仅数据端，不含渲染端），使正确预期用例转绿 | ✓ SATISFIED | 19/20 defects fixed + `#06-05-3` by user adjudication (D-06) + `#06-07-1` user wiring; 19 target skips active and green; `pnpm test:ci` 680 passed / 1 skipped; changes confined to `packages-user/data-*` |

**Orphaned requirements:** none. `REQUIREMENTS.md` traceability maps only `FIX-01 → Phase 7` (now `Complete`); every plan claims it. `TEST-01` (Phase 6) and all other IDs are outside this phase.

### Decision Coverage

`check.decision-coverage-verify` → `{ total: 14, honored: 14, not_honored: [], blocking: false }`.

> **Decision Coverage** — All trackable CONTEXT.md decisions are honored by shipped artifacts.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `combat/{damage,context,combat,mapDamage}.test.ts` | FIX-01 | yes | 0 | no | Behavioral | ✓ |
| `replay/array.test.ts` | FIX-01 | 46 | 0 | no | Value (exact round-trip) | ✓ |
| `hero/{attribute,equipment,saveLoad}.test.ts` | FIX-01 | yes | 1 (D-06, unrelated code 147) | no | Value | ✓ |
| `map/{mapLayer,saveLoad}.test.ts` | FIX-01 | yes | 0 | no | Value | ✓ |
| `common/mover.test.ts` | FIX-01 | yes | 0 | no | Value | ✓ |
| `enemy/manager.test.ts` | FIX-01 | yes | 0 | no | Behavioral | ✓ |
| `data-state/test/{saveablesRoundTrip,replayPlayback}.test.ts` | FIX-01 | yes | 0 | no | Behavioral | ✓ |

**Disabled tests on requirements:** 1 — `#06-05-3` (D-06, intentionally retained by user adjudication). It is NOT the only test proving FIX-01 (19 other active tests cover the requirement) → WARNING at most, not a blocker.
**Circular patterns detected:** 0.
**Insufficient assertions:** 0.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `packages-user/data-common/src/replay/types.ts` | 341, 344 | Table labels type 4 `int64` / type 7 `bigint` where the sibling `getParamArray()` table says `非负 …` | ℹ️ Info | Cosmetic wording only; renumbering and byte sizes are accurate (W-01 substantively resolved) |
| `packages-user/data-common/src/replay/array.ts` | 502-539 | `set()` index-shift / last-command `nextParam` (CR-01) | 📋 Advisory | Already registered 只登记不修; pre-existing; no test impact |
| `packages-user/data-system/src/combat/mapDamage.ts` | 240-256, 290-333 | Stale reduced-damage cache on source shrink/disappear (CR-02) | 📋 Advisory | Pre-existing path unchanged by this phase; no test impact |
| `.planning/phases/07-data-fixes/07-03-SUMMARY.md` | 301 | Claim 本计划范围内已确认无其他消费方 (`ReplayParamValue` only) missed the two type-code tables in the same file | ℹ️ Info | SUMMARY accuracy (not code); the tables are now corrected by `0224c2e` |

No debt markers (`TBD`/`FIXME`/`XXX`) in any file changed by this phase → debt-marker gate clean. No stub, no weakened assertion, no removed assertion: the only changed assertions are the user-authorized ones (A10 type-token renumbering in `array.test.ts`, D-05 code 177/178 in `saveablesRoundTrip.test.ts`, D-09 route revision in `replayPlayback.test.ts`, and the D-09 combat correction which is *stronger* than before). Every other un-skipped test kept its Phase-6 correct-expectation assertion intact.

### Human Verification Required

None. Every must-have truth resolves to a passing, active automated test or to programmatically verifiable source state.

**Infrastructure/foundation phase scoping:** this is a headless data-layer phase (D-12) — no UI, CLI output, or real-time behaviour is claimed. Per the infrastructure-phase gate, UAT auto-passes; `human_verification: []`.

Items deliberately **not** raised as human-verification items, with rationale:

- **`#06-05-3` code 147 retained** — user adjudication recorded in `07-CONTEXT.md` D-06; verified statically (skip + comment present, production unchanged).
- **Residual path gaps** — user adjudication recorded in `07-08-SUMMARY.md` D2/D3 (`只登记不修`, `human_judgment: true`). Registered outcomes, not unverified claims.
- **`07-REVIEW.md` findings** — classified advisory above; none is a must-have failure and none has deterministic (failing-test) evidence.

## Gaps Summary

**No phase-goal gap.** All 20 registered data-side defects are disposed of as the user adjudicated; all 19 un-skippable correct-expectation cases are active and green; `pnpm test:ci` is 680 passed / 1 skipped (the single remaining skip is the D-06-by-design one); lint/type/circular gates are clean in the data range; the renderer/legacy boundary is untouched; the post-verification doc fix and review-report artifacts are reconciled.

No must-have truth, artifact, or key link failed. The four previously-recorded informational observations (W-01, I-02, I-03, I-04) are all resolved by post-verification commits. The only remaining items are the 9 advisory review findings, none of which contradicts a must-have and none of which carries deterministic evidence — they are recorded in the `advisory:` frontmatter for a future decision, not as phase blockers.

---

_Verified: 2026-09-16T05:49:24Z_
_Verifier: the agent (gsd-verifier)_
