---
phase: 07-data-fixes
reviewed: 2026-09-17T12:00:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - packages-user/data-base/src/hero/types.ts
  - packages-user/data-base/src/hero/attribute.ts
  - packages-user/data-base/src/hero/state.ts
  - packages-user/data-base/src/hero/equipment.ts
  - packages-user/data-base/src/hero/equipStore.ts
  - packages-user/data-base/src/hero/follower.ts
  - packages-user/data-base/src/hero/attribute.test.ts
  - packages-user/data-base/src/hero/saveLoad.test.ts
  - packages-user/data-base/src/hero/state.test.ts
  - packages-user/data-base/src/hero/equipStore.test.ts
  - packages-user/data-base/src/hero/follower.test.ts
  - packages-user/data-base/src/hero/equipment.test.ts
  - packages-user/data-base/src/flag/system.ts
  - packages-user/data-base/src/flag/system.test.ts
  - packages-user/data-base/src/map/mapLayer.ts
  - packages-user/data-base/src/map/mapLayer.test.ts
  - packages-user/data-base/src/map/saveLoad.test.ts
  - packages-user/data-common/src/replay/array.ts
  - packages-user/data-common/src/replay/types.ts
  - packages-user/data-common/src/replay/system.ts
  - packages-user/data-common/src/replay/array.test.ts
  - packages-user/data-common/src/replay/saveLoad.test.ts
  - packages-user/data-system/src/combat/mapDamage.ts
  - packages-user/data-system/src/combat/mapDamage.test.ts
  - packages-user/data-state/test/saveablesRoundTrip.test.ts
  - packages-user/data-state/test/dataClosure.test.ts
  - packages/common/src/logger.json
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Phase 07: Code Review Recheck (plans 07-09 … 07-13)

**Reviewed:** 2026-09-17T12:00:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

Incremental recheck of the "same-reference principle" fix batch (plans 07-09 … 07-13, on top of the previous review at `9e91785`). I re-read every listed file in full and traced the changed paths.

**Prior findings — resolution status (verified, not re-reported):**

| Prior ID | Subject | Verdict on recheck |
| --- | --- | --- |
| CR-01 | `ReplayArray.set()` shifted indices from a byte offset | **Fixed.** `set()` now uses `getParamRange()` (`array.ts:554-557`) and shifts `for (let i = index + 1; …)` (`array.ts:583`). |
| CR-02 | `MapDamage` ghost damage when a source shrinks/disappears | **Fixed.** `removeEnemyAffecting()` collects removed indexes and calls `markDirtyIndex` (`mapDamage.ts:247-269`); both converters register the empty view set before early-returning (`mapDamage.ts:311-315`, `356-361`). |
| WR-01 | bigint length byte overflow | **Fixed.** `magnitude >= 2n ** 2040n → null` (`array.ts:273-280`), dropped by `normalizeParamList`. |
| WR-02 | param count used untruncated length | **Fixed.** `add`/`insert`/`set` now write `normalized.length` (`array.ts:438`, `469`, `487`, `566`). |
| WR-03 | codec renumbering / no version marker | **Documented** as an append-only convention with an explicit incompatibility note (`types.ts:263-266`, `356-360`, `array.ts:26-30`). Not re-flagged (adjudicated/documentation-only). |
| WR-04 | equipment modifier persistence | User-adjudicated *design-as-is* (07-12 Q1=C). Not re-flagged. |
| WR-05 | `deleteModifierByIndex` bookkeeping | **Fixed.** Delegates to `deleteModifier` (`attribute.ts:230-242`). |
| WR-06 | `HeroEquipment.loadState` appended replay commands | **Fixed.** `replay.disable()` + `try/finally revert()` (`equipment.ts:350-359`). |
| WR-07 | `insert`/`delete`/`set` index validation | **Fixed.** Guards warn 179 (`array.ts:451-459`, `503-511`, `547-549`). |
| IN-01 | `MapDamage` post-delete residue | **Fixed** for `deleteEnemy` and `deleteMapDamage`; `sourcedDamage` empty points are a registered non-goal. |
| IN-02 | empty save `nextUid` | **Fixed** (`equipStore.ts:300-309`). |
| IN-04 / IN-05 | damage null check, `reusePrefab` | Registered as not-in-batch; files changed here are still outside those code paths. Adjudicated. |

**New findings in the rechecked batch.** One real correctness defect in `compareEquip` (the tested paths only cover non-equipped items), plus latent codec/clone defects in the touched files. No security issues were found in this batch.

## Critical Issues

### CR-01: `HeroEquipment.compareEquip()` returns a wrong diff whenever either compared item is currently equipped

**File:** `packages-user/data-base/src/hero/equipment.ts:297-317` (with the removal block at `281-289`)
**Issue:** `compareEquip()` builds the comparison clone from the live attribute and then re-adds each compared item's modifiers with `clone.addModifier(name, modifier)`. The modifiers returned by `EquipmentState.getModifiers()` are the **same objects that `loadEquipEffect()` already bound to the live attribute** (`equipment.ts:80-86` calls `attribute.addModifier(name, modifier, false)`, which calls `modifier.bindAttribute(this)`). `HeroAttribute.addModifier()` rejects any modifier whose `owner` is set:

```ts
// attribute.ts:195-199
if (modifier.owner) {
    logger.warn(108, modiferName, String(name));
    return;
}
```

Consequently, when `equipA` (or `equipB`) is the item currently in `slot`, its modifiers are refused with warning 108 and never contribute to the clone. The result is a wrong attribute diff, not a warning-only nuisance.

Trace (base `atk = 10`, hero `ValueModifier(7, -1)`, currently equipped sword `atk + 5`, live final `atk = 22`), call `compareEquip(sword, axe, 0)` with axe `atk + 12`:

- clone = live (includes cloned sword) → `22`; removal block deletes the cloned sword → `17`
- add `sword` modifiers → owner set → **refused (108)** → `attrA.atk = 17`
- remove sword modifiers → no-op (never added)
- add `axe` modifiers → `29` → `attrB.atk = 29`
- `diff.atk = 17 - 29 = -12`

The documented contract (`types.ts:824-834`: "输出装备 A 时的属性减装备 B 时的属性") requires `22 - 29 = -7`. The symmetric call `compareEquip(axe, sword, 0)` returns `+12` instead of `+7`. Both the existing test `diffs the final attributes of two equipment instances` and the new `keeps foreign modifiers when the equipped instance was rebuilt` pass only because neither compared item is the equipped one in `slot`.

`compareEquip` currently has no production caller (only tests), so the impact is latent — but it is a public API of `IHeroEquipment` and the batch claims correctness for it.

**Fix:** add the item's *clone* to the comparison attribute so the live-bound object is never reused, and remove the same clone afterward. For example:

```ts
const addedA: [SelectKey<THero, number>, IHeroModifier<number>][] = [];
for (const [name, modifier] of stateA.getModifiers()) {
    const copy = modifier.clone();
    // @ts-expect-error 泛型无法推导
    clone.addModifier(name, copy);
    addedA.push([name, copy]);
}
for (const [name] of stateA.getModifiers()) {
    attrA[name] = clone.getFinalAttribute(name);
    keys.add(name);
}
for (const [name, copy] of addedA) {
    // @ts-expect-error 泛型无法推导
    clone.deleteModifier(name, copy);
}
```

(Do the same for `stateB`; the original `modifier` remains owned by the live attribute and must not be re-bound.)

## Warnings

### WR-01: `normalizeParam()` reports `byteLength: 0` for unsupported param types but `setParamArray()` writes 2 bytes — encode/decode desync

**File:** `packages-user/data-common/src/replay/array.ts:310-315` (write at `377-379`, advance at `411`; list at `322-335`)
**Issue:** The fallback for a value that is not `boolean | number | bigint | string` warns 148 and returns a type-0 record with `byteLength: 0`:

```ts
logger.warn(148, typeof param, String(param));
return { paramType: 0, paramValue: 0, byteLength: 0 };
```

Because the value is non-null it is **kept** by `normalizeParamList()` (contrary to the new doc "无法表示的参数会被丢弃"), counted in `normalized.length` (so the command's param count includes it) and then written by `setParamArray()`'s type-0 branch, which writes 2 bytes (`setInt8(index, type)` + `setInt8(index + 1, value)`) while `index += param.byteLength` advances **0**. `calculateParamsLength` also under-counts by 2, so `indexArray[…]` points at the wrong byte for every later command.

Repro: `array.add(1, [undefined]); array.add(2, [20])`. `paramUsed` stays `0` after the first add, so the second add overwrites the first step's bytes; `array.get(0).params` then decodes `[20]` instead of the fallback, and `get(1)` reads from the same offset. `array.test.ts` only asserts the 148 warning and `array.length === 1`, so it does not catch the desync.

**Fix:** make the fallback consistent — either drop the param (return `null`, matching the documented "discard" semantics) or report the bytes actually written:

```ts
logger.warn(148, typeof param, String(param));
return null; // 与 normalizeParamList 的“丢弃”语义一致
```

### WR-02: `checkBufferExpand()` recurses forever when an expand multiplier is exactly `1`

**File:** `packages-user/data-common/src/replay/array.ts:158-211` (recursion at `207-210`)
**Issue:** The constructor accepts multipliers `>= 1` (`array.ts:113-127` only rejects `< 1`, and warns "need to be greater than 1"). With `commandExpand === 1` / `paramExpand === 1`, `Math.ceil(byteLength * 1) === byteLength`, so `nextSize === current size`, a same-size `ArrayBuffer` is allocated, `expanded = true` is set, and `checkBufferExpand(paramLength)` recurses with identical arguments — infinite recursion / stack overflow the first time the buffer needs to grow. Defaults (`system.ts` uses `1.2`) and the tests (`2`) avoid it, but the validation explicitly permits `1`.

**Fix:** reject `<= 1` (or clamp the computed next size to be strictly larger):

```ts
if (config.commandExpandMultiplier <= 1) { logger.warn(149, 'command', str); this.commandExpand = 2; }
// and/or
const nextSize = Math.max(currentByteLength + 1, Math.min(Math.ceil(currentByteLength * this.paramExpand), this.paramMax));
```

### WR-03: `HeroAttribute.clone()` bypasses `modifierName`/binding, so a cloned attribute silently loses its modifiers on `saveState()`/`iterateModifiers()`

**File:** `packages-user/data-base/src/hero/attribute.ts:296-314`
**Issue:** `clone()` inserts cloned modifiers directly into `cloned.modifier`, but never populates `cloned.modifierName`, never binds them (`bindAttribute`), and never adds them to `modifierNosave`. All clone-consuming paths that read `modifierName` are therefore wrong for cloned modifiers:

- `cloned.iterateModifiers()` yields nothing → `cloned.saveState()` serializes `modifiers: []`, silently dropping every cloned modifier (`attribute.ts:328-339`).
- `cloned.getModifierIndex(m)` returns `-1` for cloned modifiers.
- `m.setValue(...)` on a cloned modifier cannot notify the clone (`owner` is `null`), so `cloned.getFinalAttribute(name)` goes stale after a mutation.

The batch made clones more functional by copying the registry (`attribute.ts:303-306`), and `HeroState.getIsolatedAttribute()` (`state.ts:85-87`) exposes clones publicly, so this is reachable. The new test `carries the modifier registry into cloned attributes` uses `clone({ cloneModifier: false })` and sidesteps it.

**Fix:** route the cloned modifiers through the same bookkeeping as `addModifier`:

```ts
for (const [name, modifiers] of this.modifier) {
    const arr: IHeroModifier[] = modifiers.map(v => {
        const copy = v.clone();
        copy.bindAttribute(cloned);
        cloned.modifierName.set(copy, name);
        return copy;
    });
    cloned.modifier.set(name, arr);
    cloned.recalculateAttribute(name);
}
```

## Info

### IN-01: `onRecordCommand` emits the new length, not the new command's index

**File:** `packages-user/data-common/src/replay/system.ts:63-68`
**Issue:** `hook.onRecordCommand?.(code, this.route.length, params)` passes the post-append length, so the first command reports index `1` while its actual index is `0` — contradicting the hook doc "新记录的指令的索引" (`types.ts:307-317`). There are no consumers today and `system.test.ts:94` locks the 1-based value, so this is a documentation/behavior mismatch only.
**Fix:** pass `this.route.length - 1` (and update the test expectation), or reword the hook doc.

### IN-02: `FlagSystem.loadState()` omits the `compression` parameter declared on `IFlagSystem`

**File:** `packages-user/data-base/src/flag/system.ts:65`; `packages-user/data-base/src/flag/types.ts:144`
**Issue:** The interface declares `loadState(state, compression)` (with jsDoc for `compression`), while the class implements `loadState(state)`; TypeScript permits the narrower signature, and `CoreState.loadState()` calls with the extra argument which is ignored (`core.ts:505`). Functionally harmless, but the two declarations disagree and the interface doc advertises a parameter that has no effect.
**Fix:** align signatures (`loadState(state: IFlagSystemSave): void` in the interface, dropping the `compression` line from the jsDoc), or accept and ignore the parameter explicitly.

### IN-03: `MapDamage.refreshEnemy()` and `refreshEnemyAndClearCache()` are near-duplicate implementations

**File:** `packages-user/data-system/src/combat/mapDamage.ts:303-347` vs `352-387`
**Issue:** The two methods differ only in whether they add affected indexes to a `collection` and clear `dirtyIndexes`/`reducedCache` for them. The duplicated registration loop (`range.bindHost` → `iterateLoc` → `getOrInsertComputed` → `getDamageWithoutCheck` → `registerSourcedDamage`) is a maintenance hazard: fixes applied to one path (e.g. the empty-set registration from this batch) must be mirrored manually.
**Fix:** extract the shared conversion/registration body into a private helper returning the affected index set, and let `refreshEnemy`/`refreshEnemyAndClearCache` differ only in the post-processing.

### IN-04: `ReplaySystem.loadState()` resets the disable counter, which can silently unbalance nested `disable()`/`revert()` windows

**File:** `packages-user/data-common/src/replay/system.ts:106-113` → `packages-user/data-common/src/replay/array.ts:856`
**Issue:** `setReplayArray()` starts with `this.disabled = 0`. Loading a save therefore force-clears any disable window that is open at the time. The batch's WR-06 fix deliberately relies on nesting disable windows (`HeroEquipment.loadState` wraps `equip()`, which itself disables), and the current `CoreState.loadState()` order happens to load replay after hero, so it is not triggered today. If a save is ever loaded inside another disable window (or saveable order changes), the counter is destroyed and recording leaks.
**Fix:** preserve the counter (`const disabled = this.disabled; …; this.disabled = disabled;`) instead of zeroing it in `setReplayArray()`.

---

_Reviewed: 2026-09-17T12:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
