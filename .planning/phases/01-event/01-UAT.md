---
status: partial
phase: 01-event
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md, 01-07-SUMMARY.md, 01-08-SUMMARY.md, 01-09-SUMMARY.md, 01-10-SUMMARY.md, 01-11-SUMMARY.md, 01-12-SUMMARY.md, 01-13-SUMMARY.md
started: 2026-09-09T05:10:00Z
updated: "2026-09-09T13:51:54.5913679+08:00"
---

## Current Test

<!-- OVERWRITE each test - shows where we are -->

[testing paused  E1 item outstanding]

## Tests

### 1. Cold Start Smoke Test

expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. App boots without errors and a primary query/interaction returns live data.
result: blocked
blocked_by: prior-phase
reason: "目前游戏还无法正常运行，这是颁E��行为�E�因为还有忁E��的收尾工作尚未完�E。游戏测试应该在后续进行，即在数据端完�E后进行、E

### 2. GameEvent compilation cached; MapStore from data-common barrel

expected: GameEvent compilation is cached and MapStore is available from the data-common barrel.
result: pass
source: automated
coverage_id: 01-01-D1

### 3. Tiles and points expose priority-based LayerEventView bindings

expected: Tiles and points expose priority-based LayerEventView bindings.
result: pass
source: automated
coverage_id: 01-01-D2

### 4. Tile save/load and raw-map assembly use event-id maps

expected: Tile save/load, conversions, and raw-map assembly use event-id maps instead of triggers.
result: pass
source: automated
coverage_id: 01-01-D3

### 5. EventExecutor and GameEventSystem honor existing async/cut/reduction contracts

expected: EventExecutor and GameEventSystem implement the existing async execution, cut, reduction, and store-replacement contracts.
result: pass
source: automated
coverage_id: 01-02-D1

### 6. CoreState owns event store; legacy triggers removed

expected: CoreState owns an event store and complete event system while the legacy trigger implementation is removed.
result: pass
source: automated
coverage_id: 01-02-D2

### 7. Hero enter/leave/hit hooks dispatch OnEnter/OnLeave/OnTouch in D-06 order

expected: Hero enter, leave, and hit hooks dispatch OnEnter, OnLeave, and OnTouch events in D-06 order.
result: pass
source: automated
coverage_id: 01-03-D1

### 8. Legacy ITrigger symbols absent from packages-user

expected: Legacy ITrigger symbols are absent from packages-user.
result: pass
source: automated
coverage_id: 01-03-D2

### 9. Registration boundary and intentional deferral recorded

expected: The production registration boundary and its intentional deferral are recorded without adding an event-registration API.
result: pass
source: automated
coverage_id: 01-04-D1

### 10. Raw point events populate event layer coordinate view

expected: Valid serialized point events populate the event layer's coordinate view and leave tile events clean.
result: pass
source: automated
coverage_id: 01-06-D1

### 11. Malformed raw map/event structures rejected with logger codes

expected: Malformed raw map/event structures are rejected without registering a floor and use semantic logger codes.
result: pass
source: automated
coverage_id: 01-06-D2

### 12. Source-aware dispatch with priority order and sequential await

expected: Point, static, and every dynamic event dispatch with trigger filtering, source environments, priority order, and sequential await is verified.
result: pass
source: automated
coverage_id: 01-07-D1

### 13. Cut/reduce modes, unknown-id recovery, trigger-coordinate mappings

expected: Cut/reduce modes, unknown-id recovery, and enter/leave/hit trigger-coordinate mappings are verified.
result: pass
source: automated
coverage_id: 01-07-D2

### 14. GameEventStore public-barrel behavior

expected: GameEventStore public-barrel add/get, unknown-id, duplicate warning, and overwrite behavior is executable.
result: pass
source: automated
coverage_id: 01-08-D1

### 15. Map preserves dirty-point-event-only layer

expected: GameMap preserves a layer containing only a dirty point event and keeps its z-index and nested event-id save shape.
result: pass
source: automated
coverage_id: 01-09-D1

### 16. Tile defaults, snapshots, conversions, coordinate-bound movement

expected: Static/dynamic raw defaults, pure dynamic round trips, copied snapshots, conversion flags, and coordinate-bound movement are verified.
result: pass
source: automated
coverage_id: 01-10-D1

### 17. Point-event dirty transitions, save/load paths, resize semantics

expected: Point-event dirty transitions, all three compression save/load paths, baseline restoration, and resize semantics are verified.
result: pass
source: automated
coverage_id: 01-10-D2

### 18. CoreState selects alias=event layer as each map's eventLayer

expected: CoreState legacy initialization selects the alias=event layer as each map's eventLayer without changing other map assembly.
result: pass
source: automated
coverage_id: 01-11-D1

### 19. Map-bound point event id reaches mover and executor

expected: An existing map-bound point-event id reaches DefaultHeroMoveTopImpl.enter and EventExecutor once with the approved source environment.
result: pass
source: automated
coverage_id: 01-11-D2

### 20. IBlockEventEnv resolution and approved environment fixtures

expected: EventExecutor resolves IBlockEventEnv and focused invocation fixtures use the complete approved environment shape.
result: pass
source: automated
coverage_id: 01-12-D1

### 21. Malformed raw-event and map lifecycle fixtures compile

expected: Malformed raw-event and map lifecycle fixtures compile against existing interfaces without changing assertions.
result: pass
source: automated
coverage_id: 01-12-D2

### 22. Phase 01 files pass focused ESLint/Prettier CRLF checks

expected: Reported Phase 01 files pass focused ESLint/Prettier CRLF checks.
result: pass
source: automated
coverage_id: 01-12-D3

### 23. LayerEventView stable refs with O(1) dirty state

expected: LayerEventView owns stable refs and maintains O(1) dirty state across mutation and restoration.
result: pass
source: automated
coverage_id: 01-13-D1

### 24. MapLayer flat point-event save/load, resize reindexing, crop

expected: MapLayer flat point-event save/load, ref reset, resize reindexing, crop, and resize2 clearing are covered.
result: pass
source: automated
coverage_id: 01-13-D2

### 25. Tile default restoration and dispatch regressions green

expected: Static and dynamic tile default restoration and source-aware dispatch regressions remain green.
result: pass
source: automated
coverage_id: 01-13-D3

### 26. Source-aware invocation shape decision (01-04)

expected: The recorded decision in 01-04  Ethe source-aware invocation shape and one-call full-sequence execution semantics for downstream implementation  Ematches your intended architecture.
result: pass

### 27. Point-event persistence semantics decision (01-04)

expected: The recorded decision in 01-04  Ethe independent point-event save field and pure-baseline load/resize lifecycle for downstream implementation  Ematches your intended persistence semantics.
result: pass

### 28. rawEvent aliasing and Promise<R> contract (01-05)

expected: The recorded decision in 01-05  Ethe public rawEvent aliasing and generic Promise<R> contract as currently implemented  Ematches your API compatibility intent.
result: pass

### 29. eventStore circular paths deferred baseline (01-05)

expected: The recorded decision in 01-05  Ethe eventStore circular paths preserved as a deferred Phase 01 baseline  Ematches your intent to defer the repair.
result: pass

## Summary

total: 29
passed: 28
issues: 0
pending: 0
skipped: 0
blocked: 1
blocked: 1

## Gaps

[none yet]
