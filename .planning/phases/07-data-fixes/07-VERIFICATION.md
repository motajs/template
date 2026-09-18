---
phase: 07-data-fixes
verified: 2026-09-17T10:42:49Z
status: gaps_found
score: 24/24 must-haves verified
gaps: 4
gaps_recorded: 2026-09-17
gap_source: .planning/phases/07-data-fixes/07-REVIEW-recheck.md
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/WINDOWS.md
  - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md
  - .planning/phases/07-data-fixes/07-CONTEXT.md
  - .planning/phases/07-data-fixes/07-LOADSTATE-AUDIT.md
  - .planning/phases/07-data-fixes/07-REVIEW.md
  - .planning/phases/07-data-fixes/07-REVIEW-recheck.md
  - .planning/phases/07-data-fixes/07-SECURITY.md
  - .planning/phases/07-data-fixes/07-UAT.md
  - .planning/phases/07-data-fixes/07-VALIDATION.md
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
  - .planning/phases/07-data-fixes/07-09-PLAN.md
  - .planning/phases/07-data-fixes/07-09-SUMMARY.md
  - .planning/phases/07-data-fixes/07-10-PLAN.md
  - .planning/phases/07-data-fixes/07-10-SUMMARY.md
  - .planning/phases/07-data-fixes/07-11-PLAN.md
  - .planning/phases/07-data-fixes/07-11-SUMMARY.md
  - .planning/phases/07-data-fixes/07-12-PLAN.md
  - .planning/phases/07-data-fixes/07-12-SUMMARY.md
  - .planning/phases/07-data-fixes/07-13-PLAN.md
  - .planning/phases/07-data-fixes/07-13-SUMMARY.md
  - .planning/phases/07-data-fixes/07-14-PLAN.md
  - .planning/phases/07-data-fixes/07-14-SUMMARY.md
  - packages/common/src/logger.json
  - packages-user/data-base/src/enemy/manager.ts
  - packages-user/data-base/src/enemy/manager.test.ts
  - packages-user/data-base/src/flag/system.ts
  - packages-user/data-base/src/flag/system.test.ts
  - packages-user/data-base/src/flag/types.ts
  - packages-user/data-base/src/flag/saveLoad.test.ts
  - packages-user/data-base/src/hero/attribute.ts
  - packages-user/data-base/src/hero/attribute.test.ts
  - packages-user/data-base/src/hero/equipment.ts
  - packages-user/data-base/src/hero/equipment.test.ts
  - packages-user/data-base/src/hero/equipStore.ts
  - packages-user/data-base/src/hero/equipStore.test.ts
  - packages-user/data-base/src/hero/follower.ts
  - packages-user/data-base/src/hero/follower.test.ts
  - packages-user/data-base/src/hero/saveLoad.test.ts
  - packages-user/data-base/src/hero/state.ts
  - packages-user/data-base/src/hero/state.test.ts
  - packages-user/data-base/src/hero/types.ts
  - packages-user/data-base/src/map/dynamicTile.ts
  - packages-user/data-base/src/map/mapLayer.ts
  - packages-user/data-base/src/map/mapLayer.test.ts
  - packages-user/data-base/src/map/saveLoad.test.ts
  - packages-user/data-common/src/common/mover.ts
  - packages-user/data-common/src/common/mover.test.ts
  - packages-user/data-common/src/replay/array.ts
  - packages-user/data-common/src/replay/array.test.ts
  - packages-user/data-common/src/replay/saveLoad.test.ts
  - packages-user/data-common/src/replay/system.ts
  - packages-user/data-common/src/replay/types.ts
  - packages-user/data-common/src/types.ts
  - packages-user/data-state/src/core.ts
  - packages-user/data-state/src/enemy/aura.ts
  - packages-user/data-state/test/coreNode.test.ts
  - packages-user/data-state/test/dataClosure.test.ts
  - packages-user/data-state/test/nodeTracer.test.ts
  - packages-user/data-state/test/replayPlayback.test.ts
  - packages-user/data-state/test/saveablesRoundTrip.test.ts
  - packages-user/data-system/src/combat/combat.ts
  - packages-user/data-system/src/combat/combat.test.ts
  - packages-user/data-system/src/combat/context.ts
  - packages-user/data-system/src/combat/context.test.ts
  - packages-user/data-system/src/combat/damage.ts
  - packages-user/data-system/src/combat/damage.test.ts
  - packages-user/data-system/src/combat/enemy.ts
  - packages-user/data-system/src/combat/mapDamage.ts
  - packages-user/data-system/src/combat/mapDamage.test.ts
  - packages-user/data-system/src/combat/types.ts
covered_digest: "v1:sha256:0d7704327e079258816a3b53ad8ac4e7bc28ffb2f13cc53b8fbbbfd7f61362ef"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 15/15
  gaps_closed: []
  gaps_remaining: []
  regressions: []
advisory:
  - finding: "07-REVIEW-recheck.md NEW findings (1 critical + 3 warnings + 4 info): compareEquip produces a wrong diff when either compared item is equipped (live-bound modifier objects rejected by addModifier with warn 108); normalizeParam returns byteLength 0 for unsupported types while setParamArray writes 2 bytes; checkBufferExpand recurses forever at multiplier 1; HeroAttribute.clone() drops modifierName so a clone's saveState emits modifiers:[]"
    category: other
    reason: "Out of Phase 7's registered scope and not user-adjudicated. The registered compareEquip defect (Q4 (i): index mismatch / splice(-1)) IS fixed and green; the recheck's compareEquip item is a different, newly-surfaced defect. clone() missing modifierName is explicitly registered as 只登记不修 in 07-09-PLAN A6. Reported as out-of-scope follow-ups only, per the phase brief; do not treat as phase gaps."
    evidence_status: "none provided"
  - finding: "script/check-data-circular.ts exits non-zero with 13 in-scope cycles, all routed through packages-user/data-state/src/legacy/move.ts -> packages-user/client-modules/*"
    category: architectural
    reason: "Pre-existing legacy/render boundary condition, not introduced by Phase 7: the core.ts -> ./legacy import was added in phase 3 (e4e39f7, 03-10) and the boundary is already registered in WINDOWS.md id 18 (phase 03, 2026-09-11, 'seven pre-existing legacy/render boundary cycles'). Phase 7's own commits touched no legacy/client-modules/render file (verified from the phase-tagged commit file lists). Success Criterion 4 explicitly forbids the phase from modifying that boundary, so it is not a fixable Phase 7 gap."
    evidence_status: "none provided"
  - finding: "Original 07-REVIEW.md Info items IN-04 (redundant null check in DamageContext.getDamageInfo) and IN-05 (EnemyManager.reusePrefab silently no-ops for an unregistered source) were not fixed"
    category: other
    reason: "Info-severity observations, not enumerated among the CR-01/CR-02 + WR-01..07 set that ROADMAP's 二次追加 note assigned to plans 07-10..07-13. 07-13-SUMMARY.md (:171) records them as 只登记不修·不登记为缺陷. Not a Phase 7 must-have."
    evidence_status: "none provided"
  - finding: "pnpm run check:circular (madge --circular src/main.ts) exits 1 with 4 cycles in packages/render/* and packages/anon-tokyo/*"
    category: architectural
    reason: "Non-data packages, unchanged by the phase, recorded identically by the prior verification. D-12 defines the phase's gate as the data range; the data-range madge output contains zero cycles referencing a phase-7 file."
    evidence_status: "none provided"
  - finding: "ROADMAP.md Progress table still shows Phase 7 as 'In Progress' (14/14) and REQUIREMENTS.md traceability row shows Complete"
    category: other
    reason: "Pre-transition bookkeeping, not a code gap: the phase was reopened for plans 07-09..07-14 and the roadmap note explicitly requires re-running /gsd-verify-work before the orchestrator advances the status. FIX-01 is already marked [x]/Complete in REQUIREMENTS.md."
    evidence_status: "none provided"
---

# Phase 7: 数据端缺陷修复 Verification Report

**Phase Goal:** 修复 Phase 6 单元测试暴露的数据端疑似缺陷，使正确预期用例转绿，且仅限数据端、不涉及渲染端
**Verified:** 2026-09-17T10:42:49Z
**Status:** passed
**Re-verification:** Yes — the previous `07-VERIFICATION.md` (2026-09-16T06:04:11Z, 15/15) covered only plans 07-01…07-08; plans 07-09…07-14 were appended afterwards and `query verification.status` reports the prior report **stale**. This run re-derives every must-have from the codebase, re-runs the suite, and supersedes the old report in full.

**Method / adversarial note.** Every SUMMARY.md claim was treated as an unverified hypothesis. Each registered finding was re-checked against the current source hunks (not against the summary), the un-skipped test cases were enumerated by name, and the full suite, the lint/type gates and both circular gates were executed in this run. Four things I actively tried to falsify and their outcomes:

1. **"All registered findings are fixed"** — falsified in form, confirmed in substance: one finding is a documented WONTFIX under user adjudication (`#06-17-7`), one is deliberately retained by design (`#06-05-3`), and one (`#06-09-4`) is obsolete. Every remaining finding has a real, wired code change and an active passing test.
2. **"`pnpm test:ci` green"** — confirmed by execution: `66 passed (66)`, `737 passed | 1 skipped (738)`, `0 failed`. The one skip is the D-06 retained code-147 case, and a repo-wide disabled-test census finds exactly that one.
3. **"Data-range gates pass"** — confirmed for the type gate (0 data-side `vue-tsc` errors) and for the data-scope madge output; **one independent gate (`script/check-data-circular.ts`) fails**, but the failure is a pre-existing legacy↔client-modules boundary (WINDOWS id 18, phase 03) that SC4 forbids touching — recorded as advisory, not a Phase 7 gap.
4. **"Changes are data-only"** — confirmed: every phase-tagged commit's file list is confined to `packages-user/data-*` plus the deliberately in-scope `packages/common/src/logger.json` (07-10). No `client-*`, `legacy-*`, `render` or `AGENTS.md` change belongs to a Phase 7 commit.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **SC1** — All `06-TEST-FINDINGS.md` data-side findings dispositioned (fixed or user-adjudicated): `#06-01-1..4`、`#06-03-1`、`#06-04-1..4`、`#06-05-1..3`、`#06-06-1`、`#06-07-1`、`#06-08-1`、`#06-09-1/2/3/5`、`#06-15-1` (+ audit A–H, + original-review CR/WR/IN) | ✓ VERIFIED | 20/21 fixed with production-code evidence (per-finding table below); `#06-05-3` retained by design (D-06); `#06-07-1` user wiring present; `#06-17-7` = user-adjudicated WONTFIX (07-14); `#06-09-4` obsolete; IN-04/IN-05 registered out-of-batch |
| 2 | **SC2** — Target correct-expectation `it.skip` cases un-skipped and passing; unfixable defects have contract/doc sync after user confirmation | ✓ VERIFIED | Repo-wide disabled-test census = **1** (`equipment.test.ts:353`, code 147, D-06). All 19 target cases re-confirmed as active `it(` by name (see Behavioral Spot-Checks) and green in the suite. Contract sync: D-03 impl→`combat/types.ts:771-772`; D-04 `mapLayer.ts:441`→`logger.json:205`; D-05 `core.ts:513`→`logger.json:255`; WR-03 append-only convention in `replay/types.ts:265`; WR-04 contract comment in `hero/types.ts` |
| 3 | **SC3** — `pnpm test:ci` green, no new skips, data-range `check:type` / `check:circular` pass | ✓ VERIFIED | Fresh run: `Test Files 66 passed (66)`, `Tests 737 passed | 1 skipped (738)`. `vue-tsc --noEmit` = 6 error lines, **0 in data-side files** (all in `packages-user/client-modules/*`, pre-existing render). `pnpm check:circular` = 4 cycles, all `packages/render`/`packages/anon-tokyo` (non-data). No debt markers in any changed impl file. The independent `script/check-data-circular.ts` fails on pre-existing legacy↔client-modules cycles — see Advisory |
| 4 | **SC4** — Changes confined to data side (`packages` + `packages-user/data-*`), render `@user/client-*` and legacy wiring untouched | ✓ VERIFIED | Union of all 14 PLAN `files_modified` = only `packages-user/data-*` + `packages/common/src/logger.json`. File lists of every phase-tagged commit (`(07-…)`/`(phase-07)`) contain **no** `client`/`legacy`/`render`/`AGENTS.md` path. `git status` clean except two untracked planning files |
| 5 | 07-01 · `#06-01-1` — `findNextCritical` info matches the yielded critical value | ✓ VERIFIED | `damage.ts:229-231` sets `targetInfo = middleInfo` inside the `middleInfo.damage < referenceDamage` branch; `:220-221` initial `targetInfo`. `damage.test.ts:579` active & green |
| 6 | 07-01 · `#06-01-2` — `deleteEnemy` removes the enemy's sourced map damage (reverse index coherent) | ✓ VERIFIED | `mapDamage.ts:286-289` `point.affectedBy.add` + `damageStore.set`; `:267-270` `enemyStore.delete` + `markDirtyIndex`. `mapDamage.test.ts:562` active & green |
| 7 | 07-01 · `#06-01-3` — `before` returning `false` abandons the battle (implementation aligned to interface doc, D-03) | ✓ VERIFIED | `combat.ts:179-180` `const proceed = await script.before(...)` / `if (!proceed) return damage;`; `combat/types.ts:771-772` jsdoc unchanged (`返回 false … 放弃此次战斗`). `combat.test.ts:488` active & green |
| 8 | 07-01 · `#06-01-4` + same-root `#06-15-1` — repeat `buildup()` recomputes from the base enemy; `deleteAura` reverts | ✓ VERIFIED | `context.ts:697-698` unconditional `for (const view of this.enemyViewMap.values()) view.reset();` before the effect passes. `damage.test.ts:677` and `context.test.ts:625` active & green |
| 9 | 07-02 · `#06-03-1` — `createEnemy`/`createEnemyById` resolve the reuse mapping | ✓ VERIFIED | `manager.ts:119-121` and `:127-131` both use `internalGetPrefab` (`:132-138`), falling back to the raw code/id when unmapped. `manager.test.ts:272` active & green |
| 10 | 07-03 · `#06-04-1..4` — exact replay encode/decode round-trip and correct `insert`/`delete` index shifts | ✓ VERIFIED | `array.ts:696` `low + high * 2147483648`; `:273-291` byte-shifted bigint magnitude (`param < 0n ? 8 : 7`); `:483` `copyWithin(paramStart + length, paramStart)`; `:538-540` delete shift from `index`. `array.test.ts:230/487/526/910` active & green (46+ active, 0 skip) |
| 11 | 07-04 · `#06-09-1` (high) — value/percentage equipment bonuses survive save/load | ✓ VERIFIED | `equipStore.ts:119` iterates `state.value` in `loadNoCompression` (was `state.percentage`); `:137-148` `loadDiff` seeds from `item.equip.value/percentage` then overlays `state.value/percentage`; `:46-55` `rebuildModifiers`. `saveLoad.test.ts:373` / `:391` active & green |
| 12 | 07-04 · `#06-09-2` + `#06-05-1` + `#06-05-2` — snapshot deep copy; no-modifier final reflects base; first empty named slot | ✓ VERIFIED | `equipment.ts:337-338` `new Map(this.equips)` / `[...this.slots]`; `attribute.ts:92-95` writes `finalAttribute[name] = attribute[name]` when no modifier list; `equipment.ts:142` `empty === -1 && !this.equips.has(index)`. Tests `saveLoad.test.ts:334`, `attribute.test.ts:133`, `equipment.test.ts:337` active & green |
| 13 | 07-04 · `#06-05-3` — code 147 deliberately unreachable; production untouched, `it.skip` retained with a Chinese comment (D-06) | ✓ VERIFIED | `equipment.test.ts:352` comment `147 为保留错误码，当前不可达，设计如此，生产代码不修改（#06-05-3）` immediately precedes `:353 it.skip(...)`. `logger.json:224` text unchanged by the phase; no `147` hunk in `equipment.ts` |
| 14 | 07-05 · `#06-06-1` + `#06-09-3` — out-of-map `transferToDynamic` emits 128; `DynamicTile.loadState` restores `num` | ✓ VERIFIED | `mapLayer.ts:441` `logger.warn(128, x, y)` matching `transferToStatic`/`IfSafe` (`:467`,`:487`); `dynamicTile.ts:123` `this.set(save.num)` before event restore. `mapLayer.test.ts:418` and `map/saveLoad.test.ts:164` active & green |
| 15 | 07-06 · `#06-08-1` — `backward(count>1)` retreats along one axis without flipping the face | ✓ VERIFIED | `mover.ts:501-505` backward basis is `this.faceDirection` (not `getCurrentDirection()`), so step 1's written opposite no longer drives step 2; jsdoc `:309-313`. `mover.test.ts:307` active & green |
| 16 | 07-07 · `#06-09-5` — code 178 = saved-but-not-loaded; existing non-skip case corrected (D-05) | ✓ VERIFIED | `core.ts:513` `const remain = loaded.difference(total);` disjoint from warn-177; `logger.json:255` text `saved but not be loaded`. `saveablesRoundTrip.test.ts:423` active & green |
| 17 | 07-08 · `#06-07-1` — finder wiring present in `CoreState`; teleport case renamed, active, no longer skipped | ✓ VERIFIED | `core.ts:222-225` `useMapState(this.maps)` / `useMapLayer(null)` / `usePassPredicate(DefaultPassPredicateImpl)`; `replayPlayback.test.ts:363` `it('plays a teleport step after the event layer is bound on floor activation', …)` active & green. 07-08 commits touched only the test + docs (user owned the production wiring per D-07) |
| 18 | 07-09 · `#06-17-1`/`#06-17-2` — attribute saved in place (same instance), `attribute` readonly, `attachAttribute` removed, equipment/enemyContext references stay valid; registry owned by `HeroAttribute` | ✓ VERIFIED | `state.ts:42` `readonly attribute`, `:143` `this.attribute.loadState(...)` (no reassignment); `attachAttribute` absent from `types.ts` and `state.ts`; `attribute.ts:59` `private readonly registry`, `:266-286` register/create, `:328-338` save (deep `toStructured`, save-enabled filter), `:341-359` in-place load, `:304-305` clone copies registry; `equipment.ts` `loadEquipEffect` mounts with `save = false`. Tests `saveLoad.test.ts:640`, `dataClosure.test.ts:306-353` (getBindedHero `toBe` live attribute), `attribute.test.ts:347` active & green |
| 19 | 07-10 · CR-01 (`set()` index shift + last-step `paramUsed`), `#06-17-3` (`setReplayArray` expires streams), WR-01 (bigint length guard), WR-02 (truncated param count), WR-07 (bounds guard + warn 179), WR-03 (append-only type-code convention) | ✓ VERIFIED | `array.ts:553-556` `getParamRange`; `:583-585` shift from `index + 1`; `:877` `expireStreams()` in `setReplayArray`; `:277-280` `magnitude >= 2n ** 2040n → warn 152 → null`; `:566` `normalized.length`; `:451-459`/`:503-511`/`:547-550` warn 179; `replay/types.ts:265` append-only convention, `:200/210/219` bounds jsdoc; no version field on `IReplaySystemSave` (`:331`). Tests `array.test.ts:288/1086`, `replay/saveLoad.test.ts:69` active & green |
| 20 | 07-11 · `#06-17-4`/`#06-17-5`/`#06-17-6` — equipment instances, flag fields and followers survive `loadState` by identity | ✓ VERIFIED | `equipStore.ts:267-290` reuses instances (`existing.loadState`); `flag/system.ts:65-84` reuses `fieldMap` entries; `state.ts:149` `followers.restoreFollowers(...)` (no `removeAllFollowers`). Tests `equipStore.test.ts:247`, `flag/system.test.ts:203`, `follower.test.ts:271`, `saveablesRoundTrip.test.ts` container test active & green |
| 21 | 07-12 · WR-05 (delegated deletion + bounds), WR-06 (read-path replay suppressed), compareEquip Q4(i) (object-based deletion), WR-04 design-as-is comment, IN-02 test-only `nextUid` | ✓ VERIFIED | `attribute.ts:230-242` validates then delegates to `deleteModifier`; `equipment.ts:351-358` `replay.disable()`/`try/finally revert()`; `:281-288` clone-side object lookup with `-1`/missing skip; `types.ts` non-behavioural WR-04 contract comment; `equipStore.ts:300-308` empty-save `nextUid=0`; `saveLoad.test.ts` IN-02 case. Tests `attribute.test.ts:222/250`, `equipment.test.ts` WR-06 + compareEquip regressions active & green |
| 22 | 07-13 · CR-02 (stale reduced damage on shrink/disappear), IN-01 (post-delete residue), `#06-17-8` (dynamic-block accumulation) | ✓ VERIFIED | `mapDamage.ts:247-269` `removeEnemyAffecting` marks removed indexes dirty; `:311-315`/`:356-361` register the empty view set before early return; `:153-172` `deleteEnemy` prunes `point.affectedBy` + `point.damages`; `:114-122` `deleteMapDamage` drops the empty `IPointInfo`; `mapLayer.ts:855-862` `clearDynamics` called first in `loadState` (`:936`), hooks fire without awaiting (A6). Tests `mapDamage.test.ts:594/612/641/657`, `mapLayer.test.ts:596`, `map/saveLoad.test.ts:220` active & green |
| 23 | 07-14 · `#06-17-7` (audit C) closed WONTFIX by user adjudication; declared `hero.ts`/`hero.test.ts` artifacts intentionally not produced | ✓ VERIFIED | `07-14-PLAN.md:173-185` `<record>` carries the verbatim ruling (兼容层即将删除，Q1..Q4 均不改动); `07-14-SUMMARY.md` frontmatter documents zero code/tests and the superseded 66→67 file expectation; `packages-user/data-fallback` no longer exists (`Test-Path` false, deleted in commit `e2e27d9`). Legitimate SC1 disposition (「修复或经用户裁定改契约/不修复」), not an incomplete execution |
| 24 | No new `it.skip` introduced; no debt markers in changed files; requirement `FIX-01` fully claimed and satisfied | ✓ VERIFIED | Repo-wide census (`it.skip`/`describe.skip`/`test.skip`/`xit`/`xdescribe`/`it.todo`) = **1** (D-06 retained). `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` scan of every changed impl file = none. All 14 PLANs declare `requirements: [FIX-01]`; `REQUIREMENTS.md:41` `[x] FIX-01`, traceability `:70` `Complete`; no orphaned requirement maps to Phase 7 |

**Score:** 24/24 truths verified (0 present-but-behavior-unverified)
**behavior_unverified:** 0 — every truth that asserts runtime behaviour (including the same-reference identity, cache-invalidation and cancellation/ordering invariants) is backed by an active test executed in this run's `pnpm test:ci`.

### Registered-Findings Disposition (SC1 detail)

| Finding | System | Disposition | Code witness | Active test |
| --- | --- | --- | --- | --- |
| `#06-01-1` | combat | fixed | `damage.ts:229-231` | `damage.test.ts:579` |
| `#06-01-2` | combat | fixed | `mapDamage.ts:267-289` | `mapDamage.test.ts:562` |
| `#06-01-3` | combat | fixed (D-03) | `combat.ts:179-180` | `combat.test.ts:488` |
| `#06-01-4` | combat | fixed | `context.ts:697-698` | `damage.test.ts:677` |
| `#06-03-1` | enemy | fixed | `manager.ts:119-131` | `manager.test.ts:272` |
| `#06-04-1..4` | replay | fixed | `array.ts:483/696/273-291` | `array.test.ts:230/487/526/910` |
| `#06-05-1` | hero | fixed | `attribute.ts:92-95` | `attribute.test.ts:133` |
| `#06-05-2` | hero | fixed | `equipment.ts:142` | `equipment.test.ts:337` |
| `#06-05-3` | hero | **design-as-is** (D-06) | production untouched | `equipment.test.ts:353` retained skip + comment |
| `#06-06-1` | map | fixed (D-04) | `mapLayer.ts:441` | `mapLayer.test.ts:418` |
| `#06-07-1` | path | fixed (user wiring, D-07) | `core.ts:222-225` | `replayPlayback.test.ts:363` |
| `#06-08-1` | common | fixed | `mover.ts:501-505` | `mover.test.ts:307` |
| `#06-09-1` | save | fixed | `equipStore.ts:119/137-148` | `saveLoad.test.ts:373/391` |
| `#06-09-2` | save | fixed | `equipment.ts:337-338` | `saveLoad.test.ts:334` |
| `#06-09-3` | save | fixed | `dynamicTile.ts:123` | `map/saveLoad.test.ts:164` |
| `#06-09-5` | save | fixed (D-05) | `core.ts:513` | `saveablesRoundTrip.test.ts:423` |
| `#06-15-1` | combat | fixed (same root as `#06-01-4`) | `context.ts:697-698` | `context.test.ts:625` |
| `#06-09-4` | save | **obsolete** (c08f3f8) | — | — |
| audit A `#06-17-1` | hero | fixed (07-09) | `state.ts:143` + `attribute.ts:341-359` | `saveLoad.test.ts:640` |
| audit B `#06-17-2` | combat/hero | fixed (07-09) | same, unchanged instance | `dataClosure.test.ts:306-353` |
| audit C `#06-17-7` | legacy | **WONTFIX** (user) | zero change (07-14) | — |
| audit D `#06-17-4` | hero | fixed (07-11) | `equipStore.ts:267-290` | `equipStore.test.ts:247` |
| audit E `#06-17-5` | flag | fixed (07-11) | `flag/system.ts:65-84` | `flag/system.test.ts:203` |
| audit F `#06-17-6` | hero | fixed (07-11) | `state.ts:149` | `follower.test.ts:271` |
| audit G `#06-17-8` | map | fixed (07-13) | `mapLayer.ts:855-862/936` | `mapLayer.test.ts:596` |
| audit H `#06-17-3` | replay | fixed (07-10) | `array.ts:877` | `replay/saveLoad.test.ts:69` |
| CR-01 | replay | fixed (07-10) | `array.ts:553-585` | `array.test.ts:288` |
| CR-02 | combat | fixed (07-13) | `mapDamage.ts:247-269` | `mapDamage.test.ts:612` |
| WR-01 | replay | fixed (07-10) | `array.ts:277-280` | `array.test.ts` bigint-boundary |
| WR-02 | replay | fixed (07-10) | `array.ts:566` (`normalized.length`) | `array.test.ts` 255-count |
| WR-03 | replay | documented append-only (07-10) | `replay/types.ts:265` | n/a (doc) |
| WR-04 | hero | **design-as-is** (07-12 Q1) | `hero/types.ts` contract comment | existing assertions retained verbatim |
| WR-05 | hero | fixed (07-12) | `attribute.ts:230-242` | `attribute.test.ts:222/250` |
| WR-06 | hero | fixed (07-12) | `equipment.ts:351-358` | `equipment.test.ts` WR-06 case |
| WR-07 | replay | fixed (07-10) | `array.ts:451-459/503-511/547-550` | `array.test.ts` bounds cases |
| IN-01 | combat | fixed (07-13) | `mapDamage.ts:153-172/114-122` | `mapDamage.test.ts:562/578/409` |
| IN-02 | hero | fixed (user `ba60ef9`) + test aligned (07-12) | `equipStore.ts:300-308` | `saveLoad.test.ts` nextUid case |
| IN-03 | replay | addressed by added coverage (07-10) | — | `array.test.ts` set() growth/last/readstream cases |
| IN-04 / IN-05 | combat/enemy | **registered out-of-batch** (07-13) | unchanged | — (Info-only, see Advisory) |

### Deferred Items

None. No later milestone phase (4 渲染适配与双布局 / 5 Legacy 移植) covers a Phase 7 deliverable; `packages-user/data-fallback` is recorded as Phase 5 territory and has now been deleted.

### Advisory (Out-of-scope, not Phase 7 gaps)

| # | Finding | Category | Why not a Phase 7 gap |
| --- | --- | --- | --- |
| 1 | `07-REVIEW-recheck.md` NEW findings (compareEquip wrong diff with equipped items; `normalizeParam` byteLength 0; `checkBufferExpand` recursion at multiplier 1; `clone()` drops `modifierName`) | other | New unadjudicated scope. The registered compareEquip item (index mismatch) is fixed; the clone `modifierName` gap is explicitly 只登记不修 in 07-09-PLAN A6 |
| 2 | `script/check-data-circular.ts` exits 1 with 13 cycles through `data-state/src/legacy/move.ts` → `client-modules/*` | architectural | Pre-existing phase-03 legacy/render boundary (WINDOWS id 18), unreachable without violating SC4; the `core.ts → ./legacy` import predates Phase 7 (`e4e39f7`, 03-10) |
| 3 | Original review IN-04 / IN-05 unfixed | other | Info-only, explicitly outside the ROADMAP 二次追加 fix list; 07-13-SUMMARY records 只登记不修 |
| 4 | `pnpm run check:circular` exits 1 (4 render/anon-tokyo cycles) | architectural | Non-data packages, unchanged by the phase, identical to the prior report |
| 5 | ROADMAP Progress table still `In Progress` | other | Pre-transition bookkeeping; the roadmap note itself requires this re-verification before advancing |

### Required Artifacts

All 14 PLAN `files_modified` production/test artifacts exist, are substantive (no stubs/placeholders/empty returns beyond legitimate guard clauses) and are wired. Representative set:

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages-user/data-system/src/combat/damage.ts` | `findNextCritical` info aligned | ✓ VERIFIED | `:229-231` |
| `packages-user/data-system/src/combat/context.ts` | full buildup resets views | ✓ VERIFIED | `:697-698` |
| `packages-user/data-system/src/combat/mapDamage.ts` | reverse index + invalidation + residue cleanup | ✓ VERIFIED | `:114-122`, `:153-172`, `:247-269`, `:286-289`, `:311-315` |
| `packages-user/data-system/src/combat/combat.ts` | `before` short-circuit per jsdoc | ✓ VERIFIED | `:179-180` |
| `packages-user/data-base/src/enemy/manager.ts` | all lookups via `internalGetPrefab` | ✓ VERIFIED | `:119-138` |
| `packages-user/data-common/src/replay/array.ts` | exact codec + correct index edits + bounds + guard | ✓ VERIFIED | `:277-291`, `:449-588`, `:850-878` |
| `packages-user/data-common/src/replay/types.ts` | bounds contract + append-only convention | ✓ VERIFIED | `:200-225`, `:265` |
| `packages-user/data-base/src/hero/attribute.ts` | in-place save/load + registry + delegated deletion | ✓ VERIFIED | `:92-95`, `:230-242`, `:328-359` |
| `packages-user/data-base/src/hero/state.ts` | readonly attribute, no rebinding, followers preserved | ✓ VERIFIED | `:42`, `:143-149` |
| `packages-user/data-base/src/hero/equipment.ts` | deep copy, empty-slot, replay-suppressed load, object-based compare | ✓ VERIFIED | `:142`, `:281-288`, `:337-338`, `:351-358` |
| `packages-user/data-base/src/hero/equipStore.ts` | split tables + diff base + instance reuse + nextUid | ✓ VERIFIED | `:119-148`, `:267-308` |
| `packages-user/data-base/src/flag/system.ts` | field instances preserved | ✓ VERIFIED | `:65-84` |
| `packages-user/data-base/src/hero/follower.ts` | preserve-restore entry | ✓ VERIFIED | `restoreFollowers` used at `state.ts:149` |
| `packages-user/data-base/src/map/mapLayer.ts` | code 128 + clearDynamics | ✓ VERIFIED | `:441`, `:855-862`, `:936` |
| `packages-user/data-base/src/map/dynamicTile.ts` | `loadState` restores num | ✓ VERIFIED | `:123` |
| `packages-user/data-common/src/common/mover.ts` | backward basis fixed | ✓ VERIFIED | `:501-505` |
| `packages-user/data-state/src/core.ts` | code 178 + finder wiring | ✓ VERIFIED | `:222-225`, `:513` |
| `packages/common/src/logger.json` | warn 152 text aligned; new warn 179 registered | ✓ VERIFIED | `:224`, `:255`, `:256` |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `combat.ts:180` | `combat/types.ts:772` jsdoc (D-03) | `!proceed` | ✓ WIRED | impl aligned to unchanged doc |
| `context.ts buildup()` | `EnemyView.reset()` | `:697-698` | ✓ WIRED | active `damage.test.ts:677` |
| `mapDamage delete/refresh` | `damageStore`/`enemyStore`/`markDirtyIndex` | `:153-172`, `:247-269` | ✓ WIRED | `mapDamage.test.ts:594/612` |
| `array.ts:583` shift | `getParamRange` `:554-556` | command index | ✓ WIRED | `array.test.ts:288` |
| `array.ts:877 expireStreams` | `ReplaySandbox.reader` expiry | `#06-17-3` | ✓ WIRED | `replay/saveLoad.test.ts:69` |
| `state.ts:143 attribute.loadState` | `HeroEquipment` captured attribute | same instance | ✓ WIRED | `saveLoad.test.ts:640` |
| `core.ts bindHero` | `EnemyContext.getBindedHero()` | same instance | ✓ WIRED | `dataClosure.test.ts:306-353` |
| `equipStore.ts add` | `loadState` empty-save `nextUid` | `:300-308` | ✓ WIRED | IN-02 case |
| `mapLayer.loadState` | `clearDynamics` | `:936` → `:855-862` | ✓ WIRED | `mapLayer.test.ts:596` |
| `core.ts:513 loaded.difference` | `logger.json` 178 text | D-05 | ✓ WIRED | `saveablesRoundTrip.test.ts:423` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `hero/attribute.ts` save/load | `values` / `modifiers` | live `this.attribute` (`toStructured`) + `iterateModifiers()` + per-modifier `saveState` | Yes | ✓ FLOWING |
| `hero/equipStore.ts loadDiff` | `this.value`/`this.percentage` | `item.equip` base + `state.value/percentage` diff | Yes | ✓ FLOWING |
| `combat/mapDamage.ts registerSourcedDamage` | `index`/`damage` | `range.iterateLoc` + `getDamageWithoutCheck` | Yes | ✓ FLOWING |
| `replay/array.ts decodeParam` | `value` | param buffer bytes (`low + high * 2^31`) | Yes | ✓ FLOWING |
| `data-state/core.ts` `remain` | save keys ∩ saveable keys | real save map + registry | Yes | ✓ FLOWING |
| `logger.json` 179 | static text | mirrors `array.ts` guards | N/A (doc) | ✓ FLOWING |

No `STATIC`, `HOLLOW`, `HOLLOW_PROP` or `DISCONNECTED` data path found.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Full data suite green, no new skips | `pnpm test:ci` | `Test Files 66 passed (66)`, `Tests 737 passed | 1 skipped (738)`, `0 failed`, 24.9s | ✓ PASS |
| No new skip introduced | repo-wide disabled-test census | exactly **1** (`equipment.test.ts:353`, D-06) | ✓ PASS |
| Retained skip comment present | `equipment.test.ts:352` | `147 为保留错误码…设计如此，生产代码不修改` | ✓ PASS |
| 19 target cases active (not skipped) | named `it(` titles across all findings | all present active, none `it.skip` | ✓ PASS |
| Type gate (data range) | `pnpm exec vue-tsc --noEmit` | 6 error lines, all `packages-user/client-modules/*`; **0 data-side** | ✓ PASS |
| Circular gate (data range) | `pnpm check:circular` | 4 cycles, all `packages/render*`/`packages/anon-tokyo*` | ✓ PASS |
| Data-scope circular script | `pnpm exec tsx script/check-data-circular.ts` | exit 1, 13 legacy↔client-modules cycles | ✗ FAIL — pre-existing, outside SC4 (advisory #2) |
| Debt markers in changed impl files | `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` scan | none | ✓ PASS |
| Renderer/legacy untouched | phase-tagged commit file lists filtered for `client|legacy|render|AGENTS.md` | empty | ✓ PASS |
| Requirements tracking | `REQUIREMENTS.md:41/70` | `[x] FIX-01`, `Complete` | ✓ PASS |
| Fingerprint fresh | `query verification.fingerprint <phaseDir> <87 files>` | `v1:sha256:0d770432…` (matches frontmatter) | ✓ PASS |

### Probe Execution

**SKIPPED** — no probe scripts exist (`scripts/**/probe-*.sh` → none) and no PLAN/SUMMARY declares a probe/PASS-marker/stage contract. Validation is Vitest-based (`07-VALIDATION.md`: full suite `pnpm test:ci`), executed above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| FIX-01 | all 14 plans declare `requirements: [FIX-01]` | 修复数据端单元测试暴露的缺陷（仅数据端，不含渲染端），使正确预期用例转绿 | ✓ SATISFIED | 20/21 registered findings fixed + `#06-05-3` by D-06 design + `#06-17-7` by user WONTFIX + `#06-09-4` obsolete; audit A–H and original CR/WR/IN dispositioned; 19 target skips active and green; `pnpm test:ci` 737 passed / 1 skipped; changes confined to `packages-user/data-*` + `packages/common/src/logger.json` |

**Orphaned requirements:** none. `REQUIREMENTS.md` maps only `FIX-01 → Phase 7` (`Complete`); `TEST-01` (Phase 6) is outside this phase.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `packages-user/data-base/src/hero/equipment.ts` | 297-317 | `compareEquip` re-adds live-bound modifiers to the clone (recheck CR-01) | 📋 Advisory | New/unadjudicated, out of scope; registered Q4(i) fix intact; no production caller |
| `packages-user/data-common/src/replay/array.ts` | 310-315, 158-211 | `normalizeParam` byteLength 0; `checkBufferExpand` recursion at multiplier 1 (recheck WR-01/02) | 📋 Advisory | New/unadjudicated; no test exercises; defaults avoid the recursion |
| `packages-user/data-base/src/hero/attribute.ts` | 296-314 | `clone()` omits `modifierName`/binding (recheck WR-03 = 07-09 A6) | 📋 Advisory | Registered 只登记不修 by 07-09 A6 |
| `.planning/phases/07-data-fixes/07-REVIEW.md` | — | left unchanged as required | ℹ️ Info | Preserved read-only; recheck report kept separate |

No debt markers (`TBD`/`FIXME`/`XXX`) in any file changed by this phase → debt-marker gate clean. No stubs, no weakened assertions: the only changed assertions are the user-authorized ones (type-token renumbering, D-05 177/178, D-09 route revision, the 07-09 snapshot-shape migration, and the IN-02 test-only realignment).

### Human Verification Required

None. This is a headless data-layer phase (D-12): no UI, CLI output or real-time behaviour is claimed. Every must-have truth resolves to a passing, active automated test or to programmatically verifiable source state. `07-UAT.md` auto-passes (6 passed / 0 issues).

## Gaps Summary

**No phase-goal gap.** All registered data-side defects are disposed of exactly as the user adjudicated; all target correct-expectation cases are active and green; `pnpm test:ci` is 737 passed / 1 skipped / 0 failed; the data-range lint/type gates are clean; the renderer/legacy boundary is untouched; and requirement `FIX-01` is fully claimed and satisfied. The only non-green signal (`script/check-data-circular.ts`) is a pre-existing phase-03 legacy↔client-modules boundary that Success Criterion 4 forbids this phase from touching. The remaining items are the out-of-scope advisories recorded above — none contradicts a must-have and none carries deterministic (failing-test) evidence.

### Review-Recheck Gaps (recorded 2026-09-17, user-confirmed for repair)

Source: `07-REVIEW-recheck.md` — the incremental code review run after the phase first closed (committed `cd8a4c4`). Of its 8 findings, the 4 Info items (IN-01..IN-04) were fixed by the user directly (`34ba9e8`, `219ac49`, `3a3a6ac`, `a2a8e6e`); the 4 below are recorded here as Phase 7 gap-closure work by user decision (2026-09-17). Common root cause: the second fix batch was executed to make the target test green, without aligning each change's contract, bookkeeping and boundary conditions with the design language already documented in the same files.

#### Critical Gaps (Block Progress)

1. **CR-01 — `HeroEquipment.compareEquip()` returns a wrong diff whenever a compared item is currently equipped**
   - Missing: `compareEquip` (`equipment.ts:255-331`) re-adds a compared item's modifiers to a comparison clone via `clone.addModifier(name, modifier)`, but those very objects are already bound to the live attribute by `loadEquipEffect` (`equipment.ts:80-86` → `attribute.addModifier(name, modifier, false)`), so `HeroAttribute.addModifier` rejects them with warning 108 (`attribute.ts:195-199`) and that item contributes nothing.
   - Impact: wrong attribute diff for the equipped item (traced: returns `-12` where the `types.ts:824-834` contract requires `-7`). It is a public API of `IHeroEquipment`; no production caller today, so the impact is latent.
   - Fix: clone each compared modifier before adding it to the comparison clone, and delete the same clone objects afterwards.
   - Evidence: `07-REVIEW-recheck.md:74-121`.

2. **WR-01 — `normalizeParam()` reports `byteLength: 0` for unsupported param types while `setParamArray()` writes 2 bytes**
   - Missing: the fallback branch (`array.ts:310-315`) returns a type-0 record with `byteLength: 0` instead of `null`, contradicting the method's own jsDoc ("return `null`") and `normalizeParamList`'s documented "discard" semantics (`array.ts:318-335`).
   - Impact: the param is kept and counted in the command's param count, but the cursor advances 0 while 2 bytes are written (`indexArray` points at the wrong byte for every later command). Repro: `add(1, [undefined])` then `add(2, [20])` overwrites the first step's bytes.
   - Fix: make the fallback consistent with the documented contract (return `null`), or report the bytes actually written and align the docs.
   - Evidence: `07-REVIEW-recheck.md:125-144`.

3. **WR-02 — `checkBufferExpand()` recurses forever when an expand multiplier is exactly `1`**
   - Missing: the constructor accepts multipliers `>= 1` (`array.ts:113-127` rejects only `< 1`, while warning 149's own text says they must be greater than 1). With `1`, `Math.ceil(size * 1) === size`, so a same-size buffer is allocated and the recursion at `array.ts:207-210` repeats with identical arguments.
   - Impact: infinite recursion / stack overflow the first time the buffer needs to grow under such a config. Defaults (1.2) and tests (2) mask it.
   - Fix: reject `<= 1`, or clamp the computed next size to be strictly larger than the current one.
   - Evidence: `07-REVIEW-recheck.md:146-157`.

4. **WR-03 — `HeroAttribute.clone()` bypasses `modifierName`/binding, so a cloned attribute silently loses its modifiers on `saveState()`/`iterateModifiers()`**
   - Missing: `clone()` (`attribute.ts:296-314`) inserts cloned modifiers directly into `cloned.modifier` without populating `cloned.modifierName`, without `bindAttribute`, and without mirroring `modifierNosave`.
   - Impact: `cloned.iterateModifiers()` yields nothing → `cloned.saveState()` serializes `modifiers: []`, dropping every cloned modifier; `getModifierIndex(m)` returns `-1`; `m.setValue(...)` on a cloned modifier cannot notify the clone, so `getFinalAttribute(name)` goes stale. Reachable through the public `HeroState.getIsolatedAttribute()`.
   - Fix: route cloned modifiers through the same bookkeeping `addModifier` establishes.
   - Evidence: `07-REVIEW-recheck.md:159-183`.

### Post-Refactor Test Breakage (recorded 2026-09-17, user-requested repair) — **DEFERRED 2026-09-17**

> **暂缓（2026-09-17，用户指示）**：下面的清单是 **2026-09-17 的测量快照**。用户仍在手工重构数据端、接口与形状会继续变化，因此还会产生更多测试报错——那是进行中的工作，不是缺陷。计划 `07-16`（本批测试对齐）**暂缓**，待数据端全部改完后再启动；**启动前必须重新测量并据此重规划**（本清单很可能已过期），然后走 `/gsd-execute-phase 7 --gaps-only`，最后 `/gsd-verify-work 7`。**不要**把用户并发改动引入的失败当作缺陷登记或修复。

Source: the user's own in-flight refactors — the pathfinding-system refactor plus the earlier `ReplaySystem.route` → `.array` rename (`a2a8e6e`) and the `onRecordCommand` index fix (`34ba9e8`). These are NOT review findings; they are test files that no longer match the shipped interfaces/behaviour. The user asked for one Phase 7 plan to repair them (2026-09-17).

Measured at `19ad1ea`+ (first full run after plan 07-15): **17 failed test files / 73 failed tests / 667 passed / 1 skipped**.

| # | Test file | Failed | First observed error | Category |
|---|-----------|--------|----------------------|----------|
| 1 | `packages-user/data-system/src/path/graph.test.ts` | 12 | `TypeError: builder.useMapState is not a function` | interface change (pathfinding refactor) |
| 2 | `packages-user/data-system/src/path/system.test.ts` | 13 | `TypeError: system.finder.useMapState is not a function` | interface change (pathfinding refactor) |
| 3 | `packages-user/data-system/src/path/performance.test.ts` | 3 | `TypeError: system.finder.useMapState is not a function` | interface change (pathfinding refactor) |
| 4 | `packages-user/data-state/test/replayPlayback.test.ts` | 4 | `TypeError: state.pathfinding.finder.useMapState is not a function` | interface change (pathfinding refactor) |
| 5 | `packages-user/data-base/src/hero/equipment.test.ts` | 14 | `TypeError: Cannot read properties of undefined (reading 'add')` | replay stub still exposes `route`, production renamed to `array` (`a2a8e6e` missed this file) |
| 6 | `packages-user/data-base/src/hero/saveLoad.test.ts` | 10 | mix: `reading 'add'` (replay stub) + `expected undefined to be 'F2'` | replay stub + floor/location save-shape |
| 7 | `packages-user/data-base/src/hero/items.test.ts` | 1 | `TypeError: Cannot read properties of undefined (reading 'add')` | replay stub |
| 8 | `packages-user/data-common/src/replay/system.test.ts` | 1 | `expected [[5, +0, [1, true]]] to deeply equal [[5, 1, [1, true]]]` | test still asserts the old 1-based `onRecordCommand` index (`34ba9e8` changed it to `length - 1`) |
| 9 | `packages-user/data-base/src/hero/location.test.ts` | 1 | `AssertionError: expected undefined to be 'F2'` | floor/location save-shape |
| 10 | `packages-user/data-base/src/hero/state.test.ts` | 1 | `AssertionError: expected undefined to be 'F2'` | floor/location save-shape |
| 11 | `packages-user/data-state/test/saveablesRoundTrip.test.ts` | 1 | `AssertionError: expected undefined to be 'F1'` | floor/location save-shape |
| 12 | `packages-user/data-state/src/coreEventLayer.test.ts` | 1 | `TypeError: initializer.initMapState is not a function` | interface change (map/state initializer) |
| 13 | `packages-user/data-base/src/hero/mover.test.ts` | 6 | `Error: Test timed out in 30000ms` | behaviour/timeout — needs adjudication |
| 14 | `packages-user/data-base/src/hero/follower.test.ts` | 1 | `Error: Test timed out in 30000ms` | behaviour/timeout — needs adjudication |
| 15 | `packages-user/data-state/src/event/event.test.ts` | 1 | `AssertionError: expected +0 to be 1` | assertion drift — needs adjudication |
| 16 | `packages-user/data-state/test/dataClosure.test.ts` | 2 | `AssertionError: expected false to be true` | assertion drift — needs adjudication |
| 17 | `packages-user/data-state/test/nodeTracer.test.ts` | 1 | `AssertionError: expected +0 to be 1` | assertion drift — needs adjudication |

**User's framing (2026-09-17):** "应该主要都是接口变动，测试内容基本不变" — rows 1–12 match that framing; rows 13–17 may carry real behavioural change and must be adjudicated by the user at the plan's Task 0 gate before any test is rewritten. A test must never be aligned to a behaviour the user has not confirmed as intended.

**Also note:** plan 07-15's CR-01 witness stays red solely because of row 5 — its production fix is committed (`53f067a`) and was independently evidenced by temporarily aliasing the stub (uncommitted). Aligning the stub is the one-line remedy.

## Recommended Fix Plans

### 07-16-PLAN.md: Post-refactor test alignment (pathfinding + replay + floor/state interfaces)

**Objective:** Bring the 17 test files back in line with the shipped interfaces/behaviour so `pnpm test:ci` is green again, without changing production behaviour and without weakening assertions. Interface-alignment rows (1–12) are mechanical; behavioural rows (13–17) require explicit user adjudication at the plan's Task 0 gate.

**Estimated scope:** Medium–Large (17 files, test-only)

### 07-15-PLAN.md: Review-recheck defect batch (CR-01 / WR-01 / WR-02 / WR-03)

**Objective:** Close the 4 review-recheck defects by aligning each one with its documented contract and sibling paths, each with a correct-expectation regression case (no assertion weakening, no new `it.skip`).

**Tasks:**
1. CR-01 — clone modifiers before adding them in `compareEquip`
2. WR-01 — make the unencodable-param fallback consistent with the documented discard semantics
3. WR-02 — make `checkBufferExpand` terminate for every accepted multiplier
4. WR-03 — restore `modifierName` / binding / `nosave` / `recalculateAttribute` bookkeeping in `clone()`
5. D-12/D-44 gates + `pnpm test:ci` + SUMMARY

**Estimated scope:** Medium

---

_Verified: 2026-09-17T10:42:49Z_
_Verifier: the agent (gsd-verifier)_
