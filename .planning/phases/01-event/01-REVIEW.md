---
phase: 01-event
reviewed: 2026-09-08T13:22:29Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - packages-user/data-base/src/map/dynamicTile.ts
  - packages-user/data-base/src/map/eventView.ts
  - packages-user/data-base/src/map/mapLayer.ts
  - packages-user/data-base/src/map/mapState.ts
  - packages-user/data-base/src/map/staticTile.ts
  - packages-user/data-base/src/map/tile.ts
  - packages-user/data-common/src/event/event.ts
  - packages-user/data-common/src/store/index.ts
  - packages-user/data-system/src/event/executor.ts
  - packages-user/data-system/src/event/index.ts
  - packages-user/data-system/src/event/system.ts
  - packages-user/data-system/src/index.ts
  - packages-user/data-system/src/types.ts
  - packages-user/data-state/src/core.ts
  - packages-user/data-state/src/hero/moverImpl.ts
  - packages/common/src/logger.json
findings:
  critical: 12
  warning: 2
  info: 0
  total: 14
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-08T13:22:29Z  
**Depth:** standard  
**Files Reviewed:** 16  
**Status:** issues_found

## Narrative Findings (AI reviewer)

### Summary

The event migration is not behaviorally complete. Trigger selection, point-versus-tile ownership, dynamic tiles, persistence, default events, and blocked-movement behavior are incorrect or absent. There are no automated tests for the new path.

Repository-wide type failures documented by the phase summaries were reproduced. Client/legacy errors and the out-of-scope `TileStore.getTrigger` mismatch are treated as baseline and are not counted below. Focused ESLint and `git diff --check` passed.

### Critical Issues

#### CR-01: Event trigger metadata is ignored

**Classification:** BLOCKER  
**File:** `packages-user/data-system/src/event/executor.ts:36-44`  
**Issue:** Every resolved event is executed unconditionally. `IGameEvent.trigger` is never compared with `env.trigger`, so an `OnLeave`, `None`, or battle event bound at a tile also runs during enter/touch dispatch.

**Fix:** Skip events whose trigger does not match the requested trigger before calling `execute`:

```ts
if (event.trigger !== env.trigger) continue;
const result = await event.execute(param, env);
```

#### CR-02: Raw point events are attached to movable tile instances

**Classification:** BLOCKER  
**File:** `packages-user/data-base/src/map/mapState.ts:101-119`  
**Issue:** `IMapRawData.events` represents coordinate-bound point events, but the loader writes them to `location.static.tileEvent()`. The point-event API remains empty, and converting the static tile to dynamic moves those events away from their coordinate, violating D-03.

**Fix:** Load through `layer.event(x, y)`, then call `markPure()` on that point view. Do not write raw point data to the static tile view.

#### CR-03: Tile defaults are initialized as an empty event set

**Classification:** BLOCKER  
**File:** `packages-user/data-base/src/map/tile.ts:26-31`  
**Issue:** Every tile starts with an empty, pure `LayerEventView`; `ITileRawData.events` is never copied into it. Default monster/item/custom events therefore never become dispatchable, contradicting D-05 and the documented dirty baseline.

**Fix:** Initialize each concrete tile from its raw definition's `events`, then mark that populated view pure. Reapply the correct default baseline when a static tile's number changes.

#### CR-04: Movement dispatch drops all dynamic-tile events

**Classification:** BLOCKER  
**File:** `packages-user/data-state/src/hero/moverImpl.ts:160-174`  
**Issue:** Collection reads only `loc.static.tileEvent()`. `loc.dynamics` is ignored, so events attached to movable objects never fire. This also regresses the deleted collector, which explicitly collected dynamic tiles.

**Fix:** Collect event entries from the static tile and every `loc.dynamics` tile, then sort all tile entries by descending priority after the point-event group.

#### CR-05: Point events receive tile-event execution context

**Classification:** BLOCKER  
**File:** `packages-user/data-state/src/hero/moverImpl.ts:168-188`  
**Issue:** Point and tile IDs are merged into one executor call with `type: BlockEventType.TileEvent` and `tile: loc.static`. Point scripts therefore receive a false source type and tile object; dynamic scripts would likewise receive the wrong tile if CR-04 were fixed naively.

**Fix:** Preserve source metadata per invocation. Point events need `PointEvent` and no triggering tile; each tile event needs `TileEvent` and its actual tile. If the current executor signature cannot preserve cut/reduce semantics across source-specific invocations, obtain approval to extend that interface rather than fabricating one shared environment.

#### CR-06: Point events have no dirty, save/load, or reset lifecycle

**Classification:** BLOCKER  
**File:** `packages-user/data-base/src/map/mapLayer.ts:51,585-637,713-815`  
**Issue:** `pointEvents` is absent from every save/load path and never contributes to layer dirty state. Runtime edits are lost from saves, while old in-memory point events can survive loading or resizing and later reappear. This violates D-12.

**Fix:** Add point-event data to the user-approved layer save contract, serialize only dirty views, restore/reset them against raw baselines on load, and clear or clip them during resize operations.

#### CR-07: Saved event data is a live mutable map

**Classification:** BLOCKER  
**File:** `packages-user/data-base/src/map/staticTile.ts:38-47`; `packages-user/data-base/src/map/dynamicTile.ts:100-112`  
**Issue:** Both save methods store `tileEvent().get()`, which is the view's internal `Map`. Later event edits mutate earlier autosave/undo snapshots retained by `SaveSystem`, causing historical saves to change after creation.

**Fix:** Snapshot the map when saving:

```ts
events: new Map(this.tileEvent().get())
```

Apply the same rule to future point-event saves.

#### CR-08: `keepEvent=false` clears events instead of restoring defaults

**Classification:** BLOCKER  
**File:** `packages-user/data-base/src/map/mapLayer.ts:123-132`  
**Issue:** `syncStaticEvent` always clears the static view and leaves it empty when `keepEvent` is false. The public contract says this mode falls back to the static tile's own events.

**Fix:** When `keepEvent` is false, repopulate the static view from the restored tile's `raw()?.events` baseline and mark it pure; only copy dynamic overrides when true.

#### CR-09: The new compiled cache can execute stale source

**Classification:** BLOCKER  
**File:** `packages-user/data-common/src/event/event.ts:14-26,46-49`  
**Issue:** Compilation is now cached, but `rawEvent` is a public mutable `Statement[]`. Type-safe callers can mutate it with `push`/`splice` without calling `setRaw`, leaving `compiled` valid-looking but stale.

**Fix:** Make event source immutable to callers and keep a private mutable backing value that can only be replaced through `setRaw`, which must invalidate the cache. This requires a user-approved interface adjustment or a justified read-only accessor.

#### CR-10: Malformed external map events can crash loading

**Classification:** BLOCKER  
**File:** `packages-user/data-base/src/map/mapState.ts:88-105`  
**Issue:** `Object.entries(raw.events[z])` assumes every layer has an object. Missing/null external serialized data throws before the existing numeric validation and leaves a partially registered map.

**Fix:** Validate `raw.events`, each layer entry, and each priority map before creating/registering the map; log and reject malformed input rather than passing it to `Object.entries`.

#### CR-11: Blocked-movement callbacks were replaced with a no-op

**Classification:** BLOCKER  
**File:** `packages-user/data-state/src/hero/moverImpl.ts:224-229`  
**Issue:** `IHeroMover` still calls `cannotEnter` for blocked movement, and the interface documents it as a trigger hook. The replacement silently resolves, deleting existing behavior because `EventTrigger` lacks a corresponding value.

**Fix:** Obtain an interface decision for an `OnCannotEnter`-equivalent trigger and dispatch it. Do not remove the behavior while the movement contract still promises it.

#### CR-12: The configured interpreter cannot deliver the phase's simple built-in flows

**Classification:** BLOCKER  
**File:** `packages-user/data-system/src/event/system.ts:11-17`  
**Issue:** The interpreter is permanently created with empty built-in/global function lists, and the system provides no initialization path to register them. Dialogue/open-door/item/battle behavior was documented as deferred, yet the phase summary claims EVT-02 complete; those end-to-end flows cannot currently be implemented through this assembled system.

**Fix:** Implement the approved event initialization/registration path, configure the required built-ins before interpreter construction, and verify at least dialogue and open-door flows end to end before marking EVT-02 complete.

### Warnings

#### WR-01: No behavioral verification exists for the new event path

**Classification:** WARNING  
**File:** `packages-user/data-state/src/hero/moverImpl.ts:146-188`  
**Issue:** The repository contains no test/spec files. Focused type/lint checks cannot detect the trigger, ownership, ordering, environment, dynamic-tile, or persistence failures above.

**Fix:** Add automated tests covering trigger filtering, point-before-tile ordering, dynamic tiles, source-specific environments, map conversion, save/undo snapshots, malformed raw data, and all three movement hooks.

#### WR-02: Forbidden type assertions remain in the reviewed event implementation

**Classification:** WARNING  
**File:** `packages-user/data-common/src/event/event.ts:31,35,37-41`  
**Issue:** Three `as Promise<R>` assertions violate the project's absolute no-`as` review rule and can conceal an interpreter return-contract mismatch. These assertions predate the Phase 01 cache change, so this is scoped pre-existing quality debt rather than a Phase regression.

**Fix:** Align the interpreter adapter's generic return type with `Promise<R>` so `GameEvent.execute` can return it without assertions.

### Baseline and Verification Notes

- `pnpm check:type` remains red in documented client/legacy areas and in the out-of-scope `TileStore.getTrigger`/`ITileRawData.trigger` migration. Those diagnostics, including the two resulting `core.ts` assignment errors, are not counted as Phase 01 findings here.
- Focused ESLint over the reviewed TypeScript files passed.
- `git diff --check` over all 16 reviewed files passed.
- No security injection primitive was found in the reviewed glue code; the principal risks are incorrect dispatch and save-state corruption.

---

_Reviewed: 2026-09-08T13:22:29Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
