---
phase: 07-data-fixes
reviewed: 2026-09-16T05:38:28Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - packages-user/data-system/src/combat/damage.ts
  - packages-user/data-system/src/combat/mapDamage.ts
  - packages-user/data-system/src/combat/combat.ts
  - packages-user/data-system/src/combat/context.ts
  - packages-user/data-system/src/combat/damage.test.ts
  - packages-user/data-system/src/combat/mapDamage.test.ts
  - packages-user/data-system/src/combat/combat.test.ts
  - packages-user/data-system/src/combat/context.test.ts
  - packages-user/data-base/src/enemy/manager.ts
  - packages-user/data-base/src/enemy/manager.test.ts
  - packages-user/data-common/src/replay/array.ts
  - packages-user/data-common/src/replay/types.ts
  - packages-user/data-common/src/replay/array.test.ts
  - packages-user/data-base/src/hero/equipStore.ts
  - packages-user/data-base/src/hero/equipment.ts
  - packages-user/data-base/src/hero/attribute.ts
  - packages-user/data-base/src/hero/attribute.test.ts
  - packages-user/data-base/src/hero/equipment.test.ts
  - packages-user/data-base/src/hero/saveLoad.test.ts
  - packages-user/data-base/src/map/dynamicTile.ts
  - packages-user/data-base/src/map/mapLayer.ts
  - packages-user/data-base/src/map/mapLayer.test.ts
  - packages-user/data-base/src/map/saveLoad.test.ts
  - packages-user/data-common/src/common/mover.ts
  - packages-user/data-common/src/common/mover.test.ts
  - packages-user/data-state/src/core.ts
  - packages-user/data-state/test/saveablesRoundTrip.test.ts
  - packages-user/data-state/test/replayPlayback.test.ts
findings:
  critical: 2
  warning: 7
  info: 5
  total: 14
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-09-16T05:38:28Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Phase 07 fixes 20 data-side defects across replay encoding, combat, hero equipment, map, and enemy reuse. The majority of the fixes are correct and I verified them against their intent:

- `array.ts` `insert()` / `delete()` shift directions are now correct; `getParamRange()` correctly handles the final command via `paramUsed`; the int64 decode multiplier `2147483647 → 2147483648` and the bigint magnitude encoding are correct.
- `combat.ts` `before()` flip matches the documented contract (`false` abandons the battle).
- `context.ts` `buildup()` view reset is safe because `EnemyView.reset()` / `Enemy.copyFrom()` mutate in place and clear specials, so `computedToView` identity and special rebuilds stay valid.
- `damage.ts` `findNextCritical()` now tracks `targetInfo` alongside `right`, which is the correct half of the binary search.
- `attribute.ts` no-modifier recalculation, `equipment.ts` empty-slot selection and snapshot copy, `equipment.ts`/`equipStore.ts` split-table save/load, `dynamicTile.ts` num restoration, `mapLayer.ts` code 128, `manager.ts` reuse resolution, `core.ts` code 178 direction (verified against `logger.json` text) and pathfinding wiring are all sound.

However, the phase applied the `delete()` index-shift fix to `delete()` but missed the identical defect in `set()` (data corruption in a public API), and the new `MapDamage` store writes are not paired with cache invalidation when a source enemy's damage shrinks or disappears (stale "ghost" map damage). Both are correctness defects. The remaining warnings are real but lower-impact: param codec edge cases, codec compatibility, equipment modifier persistence, and an attribute-modifier deletion that leaves the object graph inconsistent.

## Critical Issues

### CR-01: `ReplayArray.set()` corrupts the param index array (same defect the phase fixed in `delete()`)

**File:** `packages-user/data-common/src/replay/array.ts:502-539` (loop at `534`, `nextParam` at `507`)
**Issue:** `set()` still shifts later command indexes starting from the *byte offset* `paramStart` instead of the *command index* `index`:

```ts
// 最后调整索引数组
for (let i = paramStart + 1; i < this.length; i++) {
    this.indexArray[i] += deltaLength;
}
```

`paramStart = this.indexArray[index]` is a param-buffer byte position, not a command index. It only happens to work when `index === 0` (where `paramStart === 0`). For any other command the loop starts too late (skips commands that must be shifted) or, when `paramStart + 1 >= length`, never runs at all. This is the exact bug the phase fixed in `delete()` (`for (let i = paramStart; …)` → `for (let i = index; …)`) but the mirror image in `set()` was left unfixed.

Trace with `add(1,[1]); add(2,[2]); add(3,[30])` then `set(1, 5, [true,true,true])`:
- `indexArray = [0,2,4]`, `paramStart = 2`, `nextParam = 4`, new param length `6`, `deltaLength = 4`.
- `paramArray.copyWithin(8, 4)` shifts command 2's params from byte 4 to byte 8.
- The loop runs from `i = 3` to `i < 3` → zero iterations, so `indexArray[2]` stays `4`.
- `get(2)` now decodes command 2 at byte 4, which is inside command 1's freshly written params → wrong command parameters (and, for multi-byte params, wrong byte lengths that desync the read stream).

A second, separate defect in the same method: `nextParam` is read directly from `indexArray[index + 1]`, which is never written for the last command (it stays `0`). `set()` on the last command therefore computes a negative `paramLength` and a huge `deltaLength`, then `paramArray.copyWithin(nextParam + deltaLength, nextParam)` shifts the entire param buffer. `delete()` was migrated to `getParamRange()` for exactly this reason; `set()` was not.

**Fix:**
```ts
const range = this.getParamRange(index);
const paramStart = range.start;
const nextParam = range.end;
// ...
// 最后调整索引数组
for (let i = index + 1; i < this.length; i++) {
    this.indexArray[i] += deltaLength;
}
```

### CR-02: `MapDamage` leaves stale reduced damage when a source enemy's damage shrinks or disappears

**File:** `packages-user/data-system/src/combat/mapDamage.ts:290-333` (with `removeEnemyAffecting` at `240-256`)
**Issue:** `refreshEnemyAndClearCache()` first calls `removeEnemyAffecting(view)`, which removes that enemy's damage objects from `point.damages` / `damageStore` / `viewStore`. It then only invalidates caches for the **new** set of affected indexes:

```ts
this.removeEnemyAffecting(view);          // drops old damage …
const set = new Set<IMapDamageView<any>>(views);
if (set.size === 0) return;               // … and returns without invalidating anything
// ...
collection.forEach(v => {
    this.dirtyIndexes.delete(v);
    this.reducedCache.delete(v);          // only the new indexes
});
```

`removeEnemyAffecting()` never adds the removed indexes to `dirtyIndexes` and never deletes their `reducedCache` entries. Consequences:

1. If the enemy's converted view set becomes empty (`set.size === 0`, e.g. its damaging aura/special is removed), its old damage is deleted from the point stores but `reducedCache` still returns the pre-removal reduced damage for every old location — permanent ghost damage, since nothing later marks those indexes dirty.
2. If the enemy's range/damage shrinks (e.g. a zone swaps to a smaller radius), the indexes that dropped out of the range keep their stale cached reduction that still includes the removed contribution.
3. `getSeparatedDamage()`/`getReducedDamage()` only call `refreshIndex()` for indexes present in `dirtyIndexes`, so the stale entries are never recomputed.

`deleteEnemy()` does mark affected indexes dirty, which masks the problem for full enemy deletion and is why the current tests do not catch this. The `markEnemyDirty` path (used by `EnemyContext.refreshEnemy()` and `setEnemyAt()` for an already-registered enemy) is the reachable one.

**Fix:** mark every index touched by the removal as dirty before re-registering, e.g. have `removeEnemyAffecting()` collect its indexes and call `this.markDirtyIndex(index)` for each, and let `refreshEnemyAndClearCache()` clear the flags again for indexes it re-registers:

```ts
private removeEnemyAffecting(view: IEnemyView<TEnemy>): Set<number> {
    const removed = new Set<number>();
    // ... inside store.damages.forEach((dam, index) => { ...; removed.add(index); })
    removed.forEach(index => this.markDirtyIndex(index));
    return removed;
}
```
Then, in `refreshEnemyAndClearCache()`, remove the early `if (set.size === 0) return;` short-circuit's implicit assumption by ensuring the invalidation above runs regardless of `set.size`, and keep the existing `dirtyIndexes.delete(v)` for freshly re-registered indexes.

## Warnings

### WR-01: bigint byte-length field overflows for |value| ≥ 2^2040, silently desyncing the param buffer

**File:** `packages-user/data-common/src/replay/array.ts:268-285` (write at `389`, read at `660`)
**Issue:** The bigint length is stored as one byte (`this.paramArray[index + 1] = arr.length`) but the range guard only warns above `2^2047`:

```ts
const wall = 2n ** 2047n;
if (param > wall - 1n || param < -wall) logger.warn(152);
```

A magnitude with a bit length ≥ 2041 produces `arr.length >= 256`, so `paramArray[index + 1] = 256` wraps to `0`. `decodeParam` then reads `length = 0`, returns `0n`, and advances only 2 bytes while the encoder reserved `arr.length + 2` (258) bytes → every subsequent parameter in the buffer decodes from the wrong offset. `byteLength` and the stored length agree only for `arr.length <= 255`, i.e. |value| < 2^2040.

**Fix:** reject values that do not fit the length byte, and warn accordingly:
```ts
if (param > wall - 1n || param < -wall || magnitude >= 1n << 2040n) {
    logger.warn(152);
    // and clamp/reject rather than writing a wrapped length
}
```

### WR-02: command param count uses the untruncated length, corrupting multi-command streams

**File:** `packages-user/data-common/src/replay/array.ts:316-323` and `426`
**Issue:** `normalizeParamList()` truncates to 255 entries and warns code 153, but `add()` writes `params.length` as the command's param-count byte while `setParamArray()` writes only the 255 truncated params:

```ts
arr = params.slice(0, 255);          // normalizeParamList
...
this.setCommandArray(commandStart, params.length, command);   // add()
this.setParamArray(this.paramUsed, normalized);
```

For `params.length === 256` the count byte becomes `0` (and for e.g. 300 it becomes 44) while 255 params' bytes are stored. `get(index)` then decodes 0 (or 44) params, and `createReadStream().read()` advances `currParam` by only the decoded bytes, so the stream desyncs from the next command. The index array itself stays consistent (it is byte-based), which is why the existing code-153 test does not catch it. The `insert()`/`set()` paths share the same `params.length` usage.

**Fix:** use the truncated list length when writing the count:
```ts
const normalized = this.normalizeParamList(params);
// ...
this.setCommandArray(commandStart, normalized.length, command);
```

### WR-03: Param type-code renumbering is not backward compatible and the save has no version marker

**File:** `packages-user/data-common/src/replay/array.ts:11-33, 593-688`; `packages-user/data-common/src/replay/types.ts:324-352`
**Issue:** Type codes 5/6/7/8 (and the short-string base) were reassigned (`5` was float → now negative int64; `6` was bigint → now float; `7` was string → now non-negative bigint; short strings moved from `length + 7` to `length + 9`). `ReplayArray.rebuildIndexArray()` decodes existing `paramBuffer` bytes with the new table, and `IReplaySystemSave` carries no format-version field (the save DB version at `data-common/src/save/system.ts:63` is the IndexedDB schema version, not the replay codec version). Any previously persisted recording containing a float, bigint, or string parameter will be misdecoded; the old bigint/string encodings have different byte lengths than their new interpretations, so the decode desyncs and the remainder of the recording is garbage.

**Fix:** Either (a) treat the codec as an append-only format (allocate new codes for new semantics, never reuse old ones), or (b) add a codec/save-format version to `IReplaySystemSave` and keep a legacy decode path. If existing recordings are explicitly out of scope, document the incompatibility; otherwise this is a data-loss fix that should be treated as a blocker.

### WR-04: Equipment modifier values are never persisted (`saveDiff` compares a snapshot that cannot change)

**File:** `packages-user/data-base/src/hero/equipStore.ts:34-36, 67-102, 259-288`
**Issue:** `this.value` / `this.percentage` are copied from `item.equip` in the constructor and are only ever overwritten by another save (which itself originated from the same source). They are never updated when the live modifiers created by `rebuildModifiers()` are mutated (`getModifiers()` is public and `BaseHeroModifier.setValue()` is the mutation API). Therefore:

- `saveDiff()` compares `this.value` against `this.item.equip.value`; in normal play the two are always identical, so the diff is always empty and Low/High compressed saves persist no equipment stat state at all.
- `saveNoCompression()` also saves `this.value`, not the modifier values, so even uncompressed saves drop runtime modifier changes (`modifier.setValue(99)` is lost).

The phase's own test at `packages-user/data-base/src/hero/saveLoad.test.ts:208-223, 351-366` demonstrates this: it mutates the modifier and asserts the *original* definition value comes back.

**Fix:** make the live modifier values the save source, e.g. serialize from `[...this.getModifiers()]` (comparing against `item.equip` for the diff form), or update `this.value`/`this.percentage` whenever a modifier is mutated. If runtime modifier mutation is intentionally not persisted, document that contract on `IEquipmentState`.

### WR-05: `HeroAttribute.deleteModifierByIndex()` leaves the modifier graph inconsistent

**File:** `packages-user/data-base/src/hero/attribute.ts:220-229`
**Issue:** Unlike `deleteModifier()` (`203-218`), `deleteModifierByIndex()` only splices the array:

```ts
const modifier = arr.splice(index, 1);
if (modifier.length === 0) return null;
else return modifier[0] as IHeroModifier<THero[K]>;
```

It does not call `modifier.bindAttribute(null)`, does not delete from `modifierName` / `modifierNosave`, and does not `markDirty(name)`. Effects:
- `iterateModifiers()` (which iterates `modifierName`) keeps yielding the removed modifier — callers see a modifier that is no longer applied.
- `getModifierIndex()` still resolves the removed modifier.
- The removed modifier keeps `owner` set, so any later `addModifier(name, modifier)` is rejected with warning 108 (`if (modifier.owner) … return`), making the modifier permanently unusable.
- `finalAttribute[name]` is not recomputed, so a stale value remains until some other operation dirties `name`. `compareEquip()` (`equipment.ts:280-283`) depends on this helper.

**Fix:** mirror `deleteModifier()`'s bookkeeping:
```ts
const removed = arr.splice(index, 1);
if (removed.length === 0) return null;
const modifier = removed[0] as IHeroModifier<THero[K]>;
modifier.bindAttribute(null);
this.modifierName.delete(modifier);
this.modifierNosave.delete(modifier);
this.markDirty(name);
return modifier;
```

### WR-06: `HeroEquipment.loadState()` records replay commands as a side effect of `equip()`

**File:** `packages-user/data-base/src/hero/equipment.ts:336-346` (via `equip()` at `168-196`)
**Issue:** `loadState()` restores equipped slots by calling the public `equip(uid, index)`, and `equip()` ends with `replay.revert(); replay.route.add(ReplayCommandCode.Equip, [uid]);`. Loading a save therefore appends spurious `Equip` commands to the live replay route. `ReplaySystem.loadState()` does not disable recording, and `setReplayArray()` resets `disabled` to `0`. Today this is masked only by saveable iteration order in `CoreState.loadState()` (hero is registered before replay at `core.ts:248-252`, so the route is overwritten afterwards). If a save has no `@system/replay` entry, or if the hero is loaded independently, the spurious commands persist and corrupt the recording.

**Fix:** restore equipment slots without replay side effects — either disable the route around the load (`this.state.replaySystem.disable()` / `revert()`), or introduce an internal equip helper that applies modifiers/validation without recording and have `loadState()` use it.

### WR-07: `ReplayArray.insert()` / `delete()` / `set()` do not validate `index`

**File:** `packages-user/data-common/src/replay/array.ts:437-465, 467-500, 502-539`
**Issue:** None of the three methods check `index` against `[0, this.length)`. `insert(length, …)` reads `this.indexArray[length]`, which is never written for the append position (it holds a stale `0`), so `paramArray.copyWithin(length, 0)` shifts the whole buffer and `setParamArray(0, …)` overwrites the first command's params. `delete(length)` similarly builds a range from a stale start. `set` on the last command is covered by CR-01. Silent buffer corruption on an out-of-range call is worse than a warning.

**Fix:** guard each mutating method, e.g. `if (index < 0 || index >= this.length) { logger.warn(...); return; }` for `delete`/`set`, and `index < 0 || index > this.length` for `insert`.

## Info

### IN-01: `MapDamage` leaves stale per-point residue after deletion

**File:** `packages-user/data-system/src/combat/mapDamage.ts:114-120, 150-167`
**Issue:** `deleteMapDamage()` deletes the damage from the set but never removes the now-empty `IPointInfo` from `sourcelessDamage`. `deleteEnemy()` deletes `damageStore`/`viewStore` entries and marks indexes dirty, but leaves the removed views in `point.affectedBy` and the removed damage objects in `point.damages`; `refreshIndex()` then skips those views via the `viewStore` check (line 417) without ever pruning them from `affectedBy`. This is lazy cleanup rather than a wrong result, but it leaks entries for every deleted enemy/view.
**Fix:** optionally delete the point entry when both damage sets are empty, and remove deleted views from `point.affectedBy` in `deleteEnemy()`.

### IN-02: `HeroEquipsStore.loadState()` does not reset `nextUid` for an empty save

**File:** `packages-user/data-base/src/hero/equipStore.ts:282-287`
**Issue:** When `state.equipments` is empty, `maxBy` returns `undefined`, warning code 58 is emitted, and the method returns without touching `nextUid`; new instances then continue from a stale counter. UIDs remain unique, so this is cosmetic only.
**Fix:** set `this.nextUid = 0` in the empty branch.

### IN-03: `set()` test cannot detect CR-01 because it keeps the param byte length unchanged

**File:** `packages-user/data-common/src/replay/array.test.ts:224-234`
**Issue:** `array.set(1, 5, [true])` replaces a 2-byte param with another 2-byte param, so `deltaLength === 0` and the broken index-shift loop is a no-op. The bug only manifests when the new param list has a different encoded length, and when the target index is not 0 or is the last command.
**Fix:** add cases such as `set(1, …, [true, true, true])` (growth), `set(lastIndex, …)` (last command), and a `set()` followed by a read-stream traversal of all steps.

### IN-04: Redundant null check in `DamageContext.getDamageInfo`

**File:** `packages-user/data-system/src/combat/damage.ts:81-83`
**Issue:** `hero` is assigned from `this.heroStatus` after `if (!this.heroStatus)` has already returned, so `!hero` can never be true. Minor dead condition.
**Fix:** `if (!locator) return null;`

### IN-05: `EnemyManager.reusePrefab()` silently no-ops when the source is not a registered prefab

**File:** `packages-user/data-base/src/enemy/manager.ts:193-198`
**Issue:** `internalGetPrefab(source)` returns `null` for an unregistered source and the method returns without registering any alias. In `core.ts:390-392` the faceIds branch calls `reusePrefab(num, leftCode, left)` using the tile number of the entity's own id as the source; if that number is not the same as `downCode`, the face-variant codes for left/up/right are never resolvable and `createEnemy()` returns `null` for them. Tests only exercise a registered source (`manager.test.ts:248-319`).
**Fix:** either log a warning when the reuse source cannot be resolved, or register the prefab under the source code in the same operation.

---

_Reviewed: 2026-09-16T05:38:28Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
