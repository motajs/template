---
phase: 08-test-refactor-alignment
reviewed: 2026-10-08T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
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
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-10-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the ten production files under Phase 08 scope at standard depth. Cross-file
tracing was performed against `ReplayArray`, `ReplaySystem`, `MapLocIndexer`, `RoleFaceBinder`,
`FaceManager`, `EquipmentState.getModifiers()`, `HeroMover`, and the path finder to validate
call contracts.

Three Critical defects were confirmed:

1. `HeroEquipment.equip` records an `Equip` step with **one** parameter, while the registered
   `ReplayEquip` command declares **three** parameter types — every replayed equip step fails
   parameter validation.
2. `MapTileBase.setFaceDirection` returns the degraded `dir4` identifier **without applying it**
   to the tile, unlike the `dir8` branch; the tile's `num` silently stays unchanged.
3. `MapLayer.putMapData` computes the source row offset incorrectly for clipped regions,
   writing wrong tile data into the map.

Additional robustness defects were found in `getMapData`/`resize` clipping, `ReplaySandbox.stop`,
`HeroLocation.loadState`, and the door helpers. The interface-only files (`enemy/types.ts`,
`map/types.ts`) and `eventView.ts`, `graph.ts`, `commands.ts` contain no Critical defects.
No security issues (injection/eval/secrets) were found in the reviewed set.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Recorded `Equip` step has 1 param but `ReplayEquip` expects 3 — replay of equip always fails

**File:** `packages-user/data-base/src/hero/equipment.ts:196`
**Issue:** `HeroEquipment.equip` records the replay step with only the uid:

```ts
replay.revert();
replay.array.add(ReplayCode.Equip, [uid]);
```

But the command registered for `ReplayCode.Equip` (`packages-user/data-state/src/replay/commands.ts:171-198`,
wired in `core.ts:249`) declares and consumes three parameters:

```ts
protected readonly paramTypes = ['number', 'number', 'boolean'];
// ...
const [uid, slot, autoUnload] = step.params as [number, number, boolean];
equipment.equip(uid, slot, autoUnload);
```

`BaseReplayCommand.assertParameter` rejects any parameter-count mismatch with `logger.error(2001)`
and returns `ReplayCommandResult.Failed`, so every equip action recorded through `HeroEquipment.equip`
becomes an unplayable replay step (playback halts). Recording only `[uid]` also means `slot`
and `autoUnload` are unrecoverable. This is masked by tests that record equip manually with 3 params
(`replayPlayback.test.ts:269`) and by `equipment.test.ts:412`, which asserts the buggy `[uid]` shape.

**Fix:** Record the actual slot that was used plus `autoUnload`, matching `ReplayEquip`:

```ts
replay.revert();
replay.array.add(ReplayCode.Equip, [uid, available, autoUnload]);
```

(`available` is the resolved numeric slot; update `equipment.test.ts:410-413` accordingly.)

### CR-02: `setFaceDirection` dir4 fallback returns the new id without applying it

**File:** `packages-user/data-base/src/map/tile.ts:63-70`
**Issue:** The `dir8` branch mutates the tile through `this.set(...)`, but the degraded `dir4`
fallback only returns the identifier:

```ts
if (next) {
    this.set(next.identifier);          // dir8: applied
    return next.identifier;
} else {
    const handler = this.state.faceManager.get(FaceGroup.Dir4);
    if (!handler) return cur;
    const degraded = handler.degrade(direction);
    const next = this.layer.faceBinder.getFaceOf(cur, degraded);
    if (next) return next.identifier;   // dir4: NOT applied
    else return cur;
}
```

`ITileBase.setFaceDirection` is documented as "设置图块朝向，会一并修改 `num`，返回设置后的当前图块数字".
In the `dir4` hit path the returned identifier differs from `this.num()`, so callers
(e.g. `map/mover.ts:55,59,65`, which ignore the return value and rely on the side effect)
believe the tile rotated while its block number is unchanged. This only triggers when the binder has a
mapping for the degraded direction but not the original diagonal, so existing tests
(`tile.test.ts:166-177`, `mapLayer.test.ts:313-324`) do not cover it.

**Fix:** Mirror the `dir8` branch:

```ts
if (next) {
    this.set(next.identifier);
    return next.identifier;
}
```

### CR-03: `putMapData` computes the wrong source offset for clipped regions

**File:** `packages-user/data-base/src/map/mapLayer.ts:206-214`
**Issue:** When the incoming region is partially out of bounds (or the provided row stride
`width` differs from the layer width), the copy loop derives the source position from `nw`
(the *clipped* width) instead of the provided `width`, and ignores the top/left clip offsets:

```ts
const nw = nr - nl;
for (let ny = 0; ny < nh; ny++) {
    const start = ny * nw;                                  // wrong stride
    const offset = (ny + nt) * w + nl;
    const sub = array.subarray(start, start + nw);
    this.mapArray.set(array.subarray(start, start + nw), offset);
}
```

Correct source start is `(ny + nt - y) * width + (nl - x)`. Example on a 2×2 layer:
`putMapData(new Uint32Array([1,2,3,4]), 1, 0, 3)` should place `[1,2]`/`[3,4]` clipped at
column 1, but the code writes `1` to (1,0) and `2` to (1,1) because it reads `array[1]`
instead of `array[3]` for the second row. The existing test only asserts warning code 9,
not the written values, so the corruption is untested.

**Fix:**

```ts
for (let ny = 0; ny < nh; ny++) {
    const sy = ny + nt - y;
    const sx = nl - x;
    const start = sy * width + sx;
    const offset = (ny + nt) * w + nl;
    const sub = array.subarray(start, start + nw);
    if (empty && sub.some(v => v !== 0)) empty = false;
    this.mapArray.set(sub, offset);
}
```

## Warnings

### WR-01: `getMapData` ignores the horizontal clip offset for negative `x`

**File:** `packages-user/data-base/src/map/mapLayer.ts:248-259`
**Issue:** For `x < 0`, `nl = 0` and `nw = nr`, but the destination offset is `dy * width`
without adding `nl - x` (i.e. `-x`). The map's column 0 lands at output column 0 instead of the
correct left-padded column. The vertical case is handled (`dy = ny - y`), so only negative-`x`
requests produce shifted data. The sign is documented by the sibling fix note in `a76137f`
("keep out-of-range zero padding"), which this path violates.
**Fix:**
```ts
res.set(arr.subarray(lineStart, lineStart + nw), dy * width + (nl - x));
```

### WR-02: `resize` corrupts or throws when width and height change in opposite directions

**File:** `packages-user/data-base/src/map/mapLayer.ts:564-575`
**Issue:** The two branches are chosen by total area (`beforeArea > area`) and assume the
non-looping dimension only grows/shrinks monotonically:

- Shrink branch (`beforeArea > area`) loops `ny < height` and copies `width` (new) elements
  per old row. If `width > beforeWidth` while height shrinks (e.g. 3×3 → 4×2), each
  `before.subarray(begin, begin + width)` reads across the old row boundary, corrupting rows.
- Grow branch (`else`) loops `ny < beforeHeight` and copies `beforeWidth` elements. If
  `beforeHeight > height` (e.g. equal-area 2×2 → 4×1), `newArray.set(..., ny * width)` writes
  past the end of the new buffer and throws `RangeError`; if `beforeWidth > width` the rows overlap.

Only single-dimension resizes and the equal-stride cases are correct, so
`IGameMap.resizeLayer` with mixed changes can corrupt or crash the layer.
**Fix:** Bound both loops and copy length explicitly:
```ts
const copy = Math.min(width, beforeWidth);
const rows = Math.min(height, beforeHeight);
for (let ny = 0; ny < rows; ny++) {
    const begin = ny * beforeWidth;
    newArray.set(before.subarray(begin, begin + copy), ny * width);
}
```

### WR-03: `ReplaySandbox.stop` never clears `playing`/`ended`, so `step()` keeps replaying after stop

**File:** `packages-user/data-common/src/replay/sandbox.ts:291-295`
**Issue:** `stop()` only awaits `pause()` and fires `onStopReplay`, leaving `playing === true`
and `ended === false`. The `IReplaySandbox` contract says `playing` is true only "当调用 play 后，调用
stop 前". After a stop, `play()` is still blocked (early-returns because `playing` is truthy) and
`step()` still proceeds through `replayStep()` (guarded only by `playing`/`ended`), so the "stopped"
sandbox continues advancing. The stop test (`sandbox.test.ts:373-397`) never asserts `playing`.
**Fix:** Terminate the sandbox state in `stop()`:
```ts
async stop(): Promise<void> {
    if (this.pausing || this.ended || !this.playing) return;
    await this.pause();
    this.playing = false;
    this.forEachHook(hook => hook.onStopReplay?.());
}
```

### WR-04: `HeroLocation.loadState` restores `floorId` but not `map`

**File:** `packages-user/data-base/src/hero/location.ts:81-86`
**Issue:** `setFloor` is the only writer of `this.map` and sets both `floorId` and `map`
together, but `loadState` restores only `floorId`:

```ts
loadState(state: IHeroLocationSave): void {
    this.x = state.x;
    this.y = state.y;
    this.floorId = state.floorId;
    this.mover.setFaceDir(state.direction);
}
```

After loading a save, `location.map` still points at the pre-load floor (or remains `null` on a
fresh instance), while `floorId` reports the saved floor. `HeroMover.onStepStart` reads
`this.tile.map` for pass checks (`mover.ts:205`), so movement after a load can be evaluated
against the wrong floor. No save executor re-resolves the map (the only `afterLoad` usages are
test stubs).
**Fix:** Re-resolve `map` from `floorId` during load (via the state's map store), or invoke
`setFloor(this.state.maps.getMap(state.floorId) ?? null)` semantics from `loadState`.

### WR-05: `openDoor`/`closeDoor` lack in-map bounds checks

**File:** `packages-user/data-base/src/map/mapLayer.ts:457-484`
**Issue:** Both methods index the map array directly (`this.indexer.index(x, y)`) without
`inMap(x, y)`. With a negative `x`, `y * width + x` still resolves to an in-bounds index for the
*wrong* cell (e.g. `x = -1, y = 1, width = 3` → index 2 = cell (2,0)), so `openDoor` can fire
`onOpenDoor` and `setBlock` for the wrong location, and `closeDoor` may open/report on the wrong
cell. Other mutators (`setBlock`, `getBlock`, `getTile`) all guard with `inMap`.
**Fix:** Return early when `!this.inMap(x, y)` in both methods (log warning code 9 / 81 style).

## Info

### IN-01: Leftover TODO in the save/load region

**File:** `packages-user/data-base/src/map/mapLayer.ts:841`
**Issue:** `// TODO: 不同大小的图层读取` remains in the shipped save/load path with no linked work.
**Fix:** Track it in the phase backlog or remove if obsolete.

### IN-02: `ReplayUnequip` reports Success when nothing was unequipped

**File:** `packages-user/data-state/src/replay/commands.ts:210-222`
**Issue:** `unequip` returns `undefined` for an empty slot, and the guard
`if (equipment.getEquipped(slot) !== void 0)` then passes, yielding `Success` for a no-op step.
`ReplayEquip` treats the analogous no-op as `Failed` (error 2007); the asymmetry weakens replay
integrity checks.
**Fix:** Capture the uid and treat `undefined` as `Failed`:
```ts
const removed = equipment.unequip(slot);
if (removed === void 0 || equipment.getEquipped(slot) !== void 0) { /* Failed 2008 */ }
```

### IN-03: `transferToStatic`/`toStatic` skip the documented moving/non-integer guard

**File:** `packages-user/data-base/src/map/mapLayer.ts:376-408` (contract in `map/types.ts:177-186`, `165-186`)
**Issue:** `IDynamicTile.toStatic`/`toStaticIfSafe` are documented to fail and return `null` when
the tile coordinate is non-integer or the tile is moving, but neither `transferToStatic`,
`transferToStaticIfSafe`, nor `toStatic` performs such a check; a moving tile can be converted
(with `setBlock` using its current grid coordinates), diverging from the documented contract.
**Fix:** Guard with the tile mover state / integer check and return `null` (with the appropriate
warning) before calling `toStatic`.

---

_Reviewed: 2026-10-08T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
