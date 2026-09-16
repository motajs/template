---
phase: 07-data-fixes
plan: 09
subsystem: data-layer
tags: [hero-attribute, save-load, same-reference, modifier-registry, loadstate-audit]

requires:
  - phase: 06-unit-tests
    provides: "#06-17-1 / #06-17-2 findings and the realistic-map save/load perf harness"
  - phase: 07-data-fixes
    provides: "07-LOADSTATE-AUDIT A/B rows; 07-08 path-system plan (serial predecessor)"
provides:
  - "HeroAttribute implements ISaveableContent<IHeroAttributeSave<THero>> with in-place saveState/loadState"
  - "modifier factory registry owned by HeroAttribute (option A) with thin HeroState delegates"
  - "HeroState.attribute readonly; attachAttribute removed (interface + impl + its only test case)"
  - "IHeroStateSave.attribute -> IHeroAttributeSave<THero>; top-level modifiers removed"
  - "equipment modifiers excluded from the attribute save (addModifier(..., false))"
  - "#06-17-1 and #06-17-2 regressions at attribute level and combat side, across all three compressions"
affects: [07-data-fixes, data-base-hero, data-system-combat, data-state]

actuals:
  tokens: 7889
  tasks: 3
  commits: 3
  plan_head_before: 94f6a70e38b34ab00cf8433936fd43f537c29f6e

tech-stack:
  added: []
  patterns:
    - "Same-reference save/load: a saveable performs loadState on its own instance"
    - "Modifier factory registry owned by the attribute, delegated by the container"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/hero/types.ts
    - packages-user/data-base/src/hero/attribute.ts
    - packages-user/data-base/src/hero/state.ts
    - packages-user/data-base/src/hero/equipment.ts
    - packages-user/data-base/src/hero/attribute.test.ts
    - packages-user/data-base/src/hero/saveLoad.test.ts
    - packages-user/data-base/src/hero/state.test.ts
    - packages-user/data-state/test/saveablesRoundTrip.test.ts
    - packages-user/data-state/test/dataClosure.test.ts

key-decisions:
  - "Registry moved into HeroAttribute (user option A); HeroState methods are thin delegates, so existing hero.registerModifier call sites are unchanged"
  - "attachAttribute deleted and HeroState.attribute made readonly (user adjudication): rebinding is impossible at type and implementation level, closing the A5 gap"
  - "Equipment modifiers mounted with save=false; HeroEquipment.loadState re-applies them on the same live instance so bonuses are never double-counted"
  - "Breaking save shape accepted (A2): no compatibility branch, no version field"
  - "Introduced IHeroModifierOwner so modifier owner typing stays assignable after IHeroAttribute gained ISaveableContent"

patterns-established:
  - "Same-reference save/load: long-lived holders (equipment, combat context) never need rebinding"
  - "Registry carried into clone() so cloned attributes can save/load independently"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "HeroAttribute owns its save state and loads in place; the attribute instance is stable across load"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/attribute.test.ts#HeroAttribute same-reference save and load"
        status: pass
    human_judgment: false
  - id: D2
    description: "#06-17-1: equipment bonuses survive hero.loadState across all three compressions and the attribute stays the same instance"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#HeroState same-reference attribute load (#06-17-1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "#06-17-2: enemyContext.getBindedHero() stays the live attribute after load without any rebinding"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/dataClosure.test.ts#CoreState hero attribute same-reference load (#06-17-2)"
        status: pass
    human_judgment: false
  - id: D4
    description: "HeroState.attribute is readonly and attachAttribute is fully removed together with its only test case"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/state.test.ts#exposes shared, readonly and isolated attribute views"
        status: pass
    human_judgment: false
  - id: D5
    description: "Equipment modifiers stay out of the attribute save (no doubling when the modifier type is registered)"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#does not double-count equipment bonuses when the type is registered"
        status: pass
    human_judgment: false

duration: 23min
completed: 2026-09-16
status: complete
---

# Phase 7 Plan 09: Hero attribute same-reference save/load Summary

**`HeroAttribute` now saves and loads itself in place (`ISaveableContent<IHeroAttributeSave<THero>>`), keeping equipment and combat references valid across every load and closing `#06-17-1` / `#06-17-2`.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-09-16T10:24:33Z
- **Completed:** 2026-09-16T10:47:52Z
- **Tasks:** 3 (Task 0 was a pre-resolved decision record; no code was written for it)
- **Files modified:** 9

## Accomplishments

- `HeroAttribute<THero> implements ISaveableContent<IHeroAttributeSave<THero>>`: `saveState` deep-copies base values and enumerates save-enabled modifiers, `loadState` resets base values in place, clears the modifier bookkeeping, rebuilds modifiers from its **own** registry (unregistered types silently skipped), and recomputes `final` per key. Instance identity is preserved.
- `#06-17-1` closed: across `NoCompression` / `LowCompression` / `HighCompression`, `hero.loadState(saved, compression)` keeps `getFinalAttribute('atk') === 15` and `getModifiableAttribute()` is the **same** instance before and after (`HeroEquipment`'s `private readonly` capture stays valid).
- `#06-17-2` closed: `enemyContext.getBindedHero()` remains `=== hero.getModifiableAttribute()` after `hero.loadState` across all three compressions, with no rebinding call anywhere (`core.ts:219` still binds exactly once).
- Registry ownership (option A): `HeroAttribute` owns the `type -> () => IHeroModifier` registry and implements `registerModifier` / `createModifier` / `createAndInsertModifier`; `HeroState`'s three methods are thin delegates, so the four existing `hero.registerModifier(...)` call sites are unchanged. `clone()` copies registry entries.
- Reference immutability: `attachAttribute` removed from `IHeroState` and `HeroState` (repo-wide zero residue) and its only test case deleted; `HeroState.attribute` is `readonly` and `loadState` never reassigns it.
- Equipment modifiers are excluded from the attribute save (`loadEquipEffect` uses `addModifier(name, modifier, false)`), and `HeroEquipment.loadState` re-applies them on the same live instance — verified by a "registered type does not double-count" regression (10 base + 5 hero + 5 equip = 20, never 25).

## Task Commits

Each task was committed atomically on `refactor/data`:

1. **Task 1: HeroAttribute owns its save state in place** - `6a60476` (feat)
2. **Task 2: #06-17-1 load in place + equipment bonuses** - `1f0af69` (fix)
3. **Task 3: #06-17-2 combat-side regression + shape migration** - `940e31f` (test)

**Plan metadata:** committed separately by the orchestrator (STATE.md / ROADMAP.md are orchestrator-owned per this run's brief).

## Files Created/Modified

- `packages-user/data-base/src/hero/types.ts` - new `IHeroAttributeSave<THero>`; `IHeroAttribute` extends `ISaveableContent` and gains the registry API; new `IHeroModifierOwner`; `IHeroStateSave.attribute: IHeroAttributeSave<THero>` with top-level `modifiers` removed; `attachAttribute` declaration deleted
- `packages-user/data-base/src/hero/attribute.ts` - owns `registry`; `registerModifier`/`createModifier`/`createAndInsertModifier`; in-place `saveState`/`loadState`; `clone()` copies registry entries; `owner`/`bindAttribute` retyped to `IHeroModifierOwner`
- `packages-user/data-base/src/hero/state.ts` - `attribute` readonly; `attachAttribute` deleted; registry methods delegate; `saveState` delegates `attribute.saveState`; `loadState` delegates `attribute.loadState` before `items`/`equip`
- `packages-user/data-base/src/hero/equipment.ts` - `loadEquipEffect` mounts equipment modifiers with `save = false`
- `packages-user/data-base/src/hero/attribute.test.ts` - +5 tests: all-compression in-place restore, snapshot separation, save-disabled exclusion, deep-copy independence, registry carried into clones
- `packages-user/data-base/src/hero/saveLoad.test.ts` - +3 `#06-17-1` tests; one assertion migrated to `saved.attribute.modifiers`
- `packages-user/data-base/src/hero/state.test.ts` - deleted the `attachAttribute` case; kept `getIsolatedAttribute` and the code-116 registry case
- `packages-user/data-state/test/saveablesRoundTrip.test.ts` - snapshot assertion migrated to `heroSave.attribute.values.hp`
- `packages-user/data-state/test/dataClosure.test.ts` - +3 `#06-17-2` tests (before-load binding, after-load without rebinding, all compressions)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Introduced `IHeroModifierOwner` to keep modifier owner typing assignable**
- **Found during:** Task 1 (type gate)
- **Issue:** After `IHeroAttribute<THero>` gained `ISaveableContent<IHeroAttributeSave<THero>>`, it stopped being assignable to `IHeroAttribute<unknown>` (the save shape is invariant in `THero` via `IModifierStateSave<THero>.name: keyof THero`). This broke `modifier.bindAttribute(this)` in `attribute.ts` **and** the unmodified `hero/modifier.test.ts:103`.
- **Fix:** Added a small structural interface `IHeroModifierOwner` (`markModifierDirty`) in `types.ts` and retyped `IHeroModifier.owner` / `bindAttribute` (and `BaseHeroModifier`) to it. This restores assignability for every `IHeroAttribute<THero>` without touching `hero/modifier.test.ts` (outside the declared `files_modified`).
- **Files modified:** `packages-user/data-base/src/hero/types.ts`, `packages-user/data-base/src/hero/attribute.ts`
- **Verification:** `vue-tsc --noEmit` shows 0 errors in all nine changed files; `hero/modifier.test.ts` is green.
- **Committed in:** `6a60476` (Task 1 commit)

**2. [Rule 3 - Blocking] Generic `Object.keys` is not callable on an unconstrained `THero`**
- **Found during:** Task 1 (type gate)
- **Issue:** The plan's `loadState` sketch used `Object.keys(this.attribute)` for the own-key delete/assign loops, but `Object.keys(o: object)` rejects an unconstrained type parameter.
- **Fix:** Enumerate keys with `for (const key in …)` (which TypeScript permits on a type parameter) and determine membership with `Object.prototype.hasOwnProperty.call(state.values, key)` exactly as the plan's threat register T-7-13 requires. Semantics are unchanged for plain attribute objects.
- **Files modified:** `packages-user/data-base/src/hero/attribute.ts`
- **Verification:** attribute-level regressions green; `vue-tsc` clean on changed files.
- **Committed in:** `6a60476` (Task 1 commit)

**3. [Rule 3 - Blocking] Save/load tests use a numeric-only hero fixture**
- **Found during:** Task 1 (type gate)
- **Issue:** The plan's mandated interface signature `registerModifier(type, cons: <K extends keyof THero>() => IHeroModifier<THero[K]>)` cannot be satisfied by a concrete `IHeroModifier<number>` factory when the hero type also has a non-numeric member (`TestHero.tag`).
- **Fix:** Added `TestNumericHero` / `createNumericAttribute()` in `attribute.test.ts` for the registry-driven save/load tests. No assertions were weakened and no cast was introduced.
- **Files modified:** `packages-user/data-base/src/hero/attribute.test.ts`
- **Verification:** `attribute.test.ts` 17 passed.
- **Committed in:** `6a60476` (Task 1 commit)

### Known Impact (not auto-fixed)

- **`IHeroAttribute<THero>` invariance cascades into whole-repo `vue-tsc` reports.** Because `IHeroAttributeSave<THero>.modifiers: readonly IModifierStateSave<THero>[]` is invariant in `THero`, `IReadonlyHeroAttribute<THero>` (through `clone(): IHeroAttribute<THero>`) is no longer assignable to `IReadonlyHeroAttribute<unknown>`. Whole-repo `vue-tsc --noEmit` error count measured: **27 at plan head → 72 after** (45 new, all in `data-system`/`data-state`, none in any file this plan touched). The repository's `check:type` is **already red at plan head (27 errors)**, and the plan's D-12/D-44 gate is explicitly file-filtered ("按改动文件相对路径过滤输出 0 类型错误（不以整仓退出码判定）"), which passes. Removing the cascade would require changing the mandated save shape (e.g. dropping `IModifierStateSave<THero>` or `keyof THero`), which the plan forbids, or editing `data-system`/`data-state` production types, which the plan's scope guard forbids. Recorded here for the Phase 7 re-verification and for a possible follow-up plan.

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking, all type-gate correctness), 1 known impact recorded.
**Impact on plan:** No scope creep: only the nine declared files were touched; no new dependency, file, error code, `it.skip`, or weakened assertion was introduced.

## Account ledger / findings cross-reference

- **Fixed:** `#06-17-1` (A) -> `hero/saveLoad.test.ts` `#06-17-1` describe (3 tests) and `attribute.test.ts` same-reference describe (5 tests). `#06-17-2` (B) -> `dataClosure.test.ts` `#06-17-2` describe (3 tests).
- **No ledger entries:** `#06-17-1` / `#06-17-2` have **no entry in `.planning/WINDOWS.md`** (verified: no `06-17` occurrence). Per the 07-03 precedent, **no new entries were created** (creating them would raise `open_count`); `WINDOWS.md` was not modified. Entry id 28 (`saveablesReal.perf.ts` deviation) is unrelated and stays `open`.
- **Registered but NOT fixed (C–H, scope guard):**
  - `#06-17-3` - `data-common/src/replay/array.ts:801-826` `setReplayArray` misses `expireStreams`
  - `#06-17-4` - `hero/equipStore.ts:271/:278` rebuilds `EquipmentState` instances (detached holders)
  - `#06-17-5` - `flag/system.ts:66/:68` rebuilds field instances (detached holders)
  - `#06-17-6` - `hero/state.ts` followers rebuilt in `loadState` (detached holders) — note line numbers shifted by this plan
  - `#06-17-7` - `data-fallback/src/hero.ts:8-23` Proxy closure holds the old attribute (depends on out-of-repo `resetHero`)
  - `#06-17-8` - `map/mapLayer.ts:371-391` `setMapRef` swaps buffers
- **Adjacent gap:** A6 - `HeroAttribute.clone()` now copies registry entries (per option A) but still does **not** copy `modifierName` / `modifierNosave`, so `getModifierIndex` / `markModifierDirty` remain inert on cloned modifiers. Registered only.
- **Closed by user adjudication:** A5 (`attachAttribute` rebinding) is no longer a gap — the capability was deleted from interface, implementation, and tests (repo-wide zero residue).

## Phase 7 reopen notice

This plan was appended after Phase 7 was marked `Complete` (2026-09-16), so the phase verification is **invalidated**:

- `.planning/phases/07-data-fixes/07-VERIFICATION.md` no longer describes the current worktree (its "8/8 plans", "orphaned requirements: none" conclusions predate 07-09). Re-run `/gsd-verify-work` (or `gsd-verify-work 7`) to re-issue the conclusion.
- `.planning/phases/07-data-fixes/07-VALIDATION.md`'s Per-Task Verification Map does not list `#06-17-1` / `#06-17-2`; that map should be updated during re-verification. This plan intentionally did not edit either file.

## Gate results (measured)

| Gate | Result |
|------|--------|
| `eslint --fix` + `eslint` on the 9 changed files | 0 errors |
| `vue-tsc --noEmit` filtered to the 9 changed files | 0 type errors |
| `pnpm test:ci` | 66 files / **690 passed / 1 skipped** (green) |
| `pnpm test:perf` | 5 files / 45 passed (green) |
| `attachAttribute` residue | none repo-wide |
| `this.attribute =` / `new HeroAttribute` in `state.ts` | none |

`pnpm test:ci` count movement vs plan head (66 / 680 / 1): **+5** (`attribute.test.ts`), **-1** (`state.test.ts` `attachAttribute` case deleted), **+3** (`saveLoad.test.ts` `#06-17-1`), **+3** (`dataClosure.test.ts` `#06-17-2`) = +10 net to 690. `skipped` is unchanged at 1; no `it.skip` was added.

## Issues Encountered

- The intermediate Task 2 commit was red on exactly one test (`saveablesRoundTrip.test.ts > keeps a snapshot separated from the live saveables`), because the plan groups the top-level shape migration into Task 3. Task 2's own `<verify>` (the three hero test files) was green, so the commit proceeded per the plan; the migration in `940e31f` restored the full suite to green. Task boundaries were followed exactly as written.
- Distinguishing new from pre-existing type errors required a baseline `vue-tsc` capture (the role's per-file gate is the plan's D-44 rule); the baseline is 27 pre-existing errors at plan head.

## User Setup Required

None - no external service configuration required. No new dependency, file, or error code was introduced.

## Next Phase Readiness

- The `#06-17-1` / `#06-17-2` root cause is eliminated rather than patched: no consumer needs a rebinding hook, and the plan's prohibition on touching `data-system` combat code was honoured.
- Outstanding: re-run phase verification (`07-VERIFICATION.md` invalidated), optionally register the C–H items in `WINDOWS.md`, and decide whether to address the whole-repo `vue-tsc` invariance cascade (needs a shape change outside this plan's scope).

---
*Phase: 07-data-fixes*
*Completed: 2026-09-16*

## Self-Check: PASSED

- All nine declared source/test files and this SUMMARY exist.
- Commits `6a60476`, `1f0af69`, `940e31f` all present in `git log --all`.
