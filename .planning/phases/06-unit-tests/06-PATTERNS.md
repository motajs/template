# Phase 6: 单元测试 - Pattern Map

**Mapped:** 2026-09-14
**Files analyzed:** 34 proposed test files (implementer may split/merge per 06-CONTEXT "the agent's Discretion")
**Analogs found:** 34 / 34 (all targets have a tracked existing analog)

**Scope note:** This phase writes **tests only** — no production code, no interface changes.
All new files are `*.test.ts`. The "Role / Data Flow" columns describe the **system under test**;
the file role itself is always `test`. Test file names below are the recommended co-located
split (dev.md: 测试文件与源码同级 `*.test.ts`); 06-CONTEXT leaves exact file split to the
implementer, so the planner may consolidate sibling files into one.

**Analog gate:** every analog path below was verified with `git ls-files` (all non-empty / tracked).

## Constraints carried from 06-CONTEXT (planner MUST reflect)

- **D-01** Mixed tiers: pure modules tested directly with fake / explicit DI; combat, replay and
  save/load also exercised through `CoreState` integration paths.
- **D-02** Minimal synthetic fixtures (small map matrix, small enemy attrs, small replay array);
  only reference `packages-user/data-state/test/fixtures/closed-loop.ts` when needed.
- **D-03** Fixtures constructed **inline per test file**; no shared cross-file fixture/factory helpers.
- **D-04** Real timers + `await controller.onEnd` for async actions; sync assert for pure math.
- **D-05** Suspected bugs → write to correct expectation but mark `it.skip` / `it.todo` with a
  Chinese comment pointing to `06-TEST-FINDINGS.md`; `pnpm test:ci` must stay green.
- **D-08** Gate = `pnpm test:ci` (`vitest run`, confirmed in `package.json:9`).
- **D-09** No coverage tooling.
- **D-10..D-13** Save/load is **saveables-level same-instance round-trip** across the 4 registered
  saveables × 3 compression levels; explicit key-field assertions only; no interface changes.
- **dev.md 注释规范** — every `it(...)` is immediately preceded by a single-line Chinese comment
  describing the covered behavior; the comment is updated when the test scope changes.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `data-system/src/combat/damage.test.ts` | test (target: calculation) | transform | `data-system/src/path/system.test.ts` | role-match |
| `data-system/src/combat/mapDamage.test.ts` | test (target: calculation) | transform | `data-system/src/path/system.test.ts` | role-match |
| `data-system/src/combat/combat.test.ts` | test (target: flow/service) | event-driven | `data-system/src/event/eventDispatch.test.ts` | role-match |
| `data-system/src/combat/context.test.ts` | test (target: registry/service) | CRUD | `data-common/src/store/tileStore.test.ts` | role-match |
| `data-state/src/enemy/calculator.test.ts` | test (target: calculation) | transform | `data-state/test/dataClosure.test.ts` | role-match |
| `data-state/src/enemy/aura.test.ts` | test (target: transform) | transform | `data-system/src/path/system.test.ts` | flow-match |
| `data-state/src/enemy/special.test.ts` | test (target: strategy) | CRUD | `data-common/src/store/tileStore.test.ts` | role-match |
| `data-state/src/enemy/mapDamage.test.ts` | test (target: calculation) | transform | `data-system/src/path/system.test.ts` | role-match |
| `data-state/src/enemy/comparer.test.ts` | test (target: sort/compare) | transform | `data-common/src/common/mover.test.ts` | flow-match |
| `data-state/src/enemy/final.test.ts` | test (target: transform) | transform | `data-common/src/common/mover.test.ts` | flow-match |
| `data-state/test/combatClosure.test.ts` | test (integration) | request-response | `data-state/test/dataClosure.test.ts` | exact |
| `data-base/src/enemy/enemy.test.ts` | test (target: model) | CRUD | `data-state/test/dataClosure.test.ts` | role-match |
| `data-base/src/enemy/manager.test.ts` | test (target: registry/model) | CRUD | `data-common/src/store/tileStore.test.ts` | exact |
| `data-base/src/enemy/special.test.ts` | test (target: model) | CRUD | `data-common/src/store/tileStore.test.ts` | role-match |
| `data-common/src/replay/array.test.ts` | test (target: array store) | streaming | `data-state/test/nodeReplay.test.ts` | role-match |
| `data-common/src/replay/system.test.ts` | test (target: system) | request-response | `data-state/src/replay/commands.test.ts` | role-match |
| `data-common/src/replay/sandbox.test.ts` | test (target: loop/state) | event-driven | `data-state/src/replay/commands.test.ts` | exact |
| `data-common/src/replay/func.test.ts` | test (target: decorators/helpers) | transform | `data-state/src/replay/commands.test.ts` | role-match |
| `data-state/test/replayIntegration.test.ts` | test (integration) | event-driven | `data-state/test/nodeReplay.test.ts` | exact |
| `data-base/src/hero/attribute.test.ts` | test (target: model) | CRUD | `data-state/test/dataClosure.test.ts` | role-match |
| `data-base/src/hero/modifier.test.ts` | test (target: transform) | transform | `data-system/src/path/system.test.ts` | flow-match |
| `data-base/src/hero/equipment.test.ts` | test (target: model) | CRUD | `data-state/src/replay/commands.test.ts` | role-match |
| `data-base/src/hero/equipStore.test.ts` | test (target: store) | CRUD | `data-common/src/store/tileStore.test.ts` | role-match |
| `data-base/src/hero/items.test.ts` | test (target: model/store) | CRUD | `data-state/src/replay/commands.test.ts` | role-match |
| `data-base/src/hero/follower.test.ts` | test (target: model) | CRUD | `data-common/src/store/tileStore.test.ts` | role-match |
| `data-base/src/hero/location.test.ts` | test (target: model) | CRUD | `data-state/src/event/event.test.ts` | role-match |
| `data-base/src/hero/mover.test.ts` | test (target: async mover) | event-driven | `data-common/src/common/mover.test.ts` | exact |
| `data-base/src/hero/state.test.ts` | test (target: model + save) | CRUD | `data-state/test/dataClosure.test.ts` | role-match |
| `data-base/src/map/gameMap.test.ts` | test (target: model) | CRUD | `data-base/src/map/mapLifecycle.test.ts` | exact |
| `data-base/src/map/mapState.test.ts` | test (target: registry) | CRUD | `data-base/src/map/eventPath.test.ts` | exact |
| `data-base/src/map/mapLayer.test.ts` | test (target: layer/tile) | CRUD | `data-base/src/map/mapLifecycle.test.ts` | exact |
| `data-base/src/map/tile.test.ts` | test (target: tile/dirty) | transform | `data-base/src/map/mapLifecycle.test.ts` | exact |
| `data-state/test/saveablesRoundTrip.test.ts` | test (integration) | transform | `data-state/test/dataClosure.test.ts` | exact |
| `data-base/src/flag/system.test.ts` | test (target: registry) | CRUD | `data-state/test/dataClosure.test.ts` | role-match |
| `data-common/src/common/utils.test.ts` | test (target: utility) | transform | `data-common/src/common/mover.test.ts` | role-match |
| `data-common/src/common/indexer.test.ts` | test (target: utility) | transform | `data-common/src/common/mover.test.ts` | role-match |
| `data-common/src/common/faceManager.test.ts` | test (target: registry) | CRUD | `data-common/src/store/tileStore.test.ts` | role-match |

---

## Pattern Assignments

### Shared boilerplate — apply to every `*.test.ts`

**1. Invalid-analog global stub + dynamic module bag** (use when the import chain touches
browser globals). Source: `data-base/src/map/mapLifecycle.test.ts:10-51`.

```typescript
// 测试图块默认事件、点事件存读档、压缩聚合和尺寸变化
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    Map.prototype.getOrInsertComputed ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        callback: (key: K) => V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        const value = callback(key);
        this.set(key, value);
        return value;
    };
});

interface TestModules {
    MapState: typeof import('./mapState').MapState;
    TileStore: typeof import('@user/data-common').TileStore;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const mapModule = await import('./mapState');
    const commonModule = await import('@user/data-common');
    modules = {
        MapState: mapModule.MapState,
        TileStore: commonModule.TileStore
    };
});
```

Pure modules that import `@user/data-common` barrel still need this stub (see
`data-common/src/store/eventStore.test.ts:21-31` for the stub-only, no `vi.hoisted` variant).

**2. Chinese single-line coverage comment immediately before every `it`** (dev.md mandatory).
Source: `data-common/src/store/tileStore.test.ts:20-32`.

```typescript
describe('TileStore events-map contract', () => {
    // 验证图块注册时会保存并按优先级返回默认事件映射
    it('returns the default events map for a registered tile', () => {
        const store = new TileStore();
        store.addTile(createTile(1, 'floor', { 20: 'late', 10: 'early' }));

        expect(store.getEvent(1)).toEqual(
            new Map([
                [20, 'late'],
                [10, 'early']
            ])
        );
    });
});
```

**3. `vi.stubGlobal` cleanup** for files that stub per-suite. Source:
`data-common/src/store/eventStore.test.ts:33-39`.

```typescript
afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    vi.unstubAllGlobals();
});
```

**4. `logger.catch` for error/warning paths** — never `expect(() => ...).toThrow`.
Source: `data-system/src/path/system.test.ts:400-414`.

```typescript
// 验证损失函数返回 NaN 时告警新码 174 并按默认损失 1 处理
it('warns the cost guard code and falls back to unit cost on NaN', () => {
    const result = modules.logger.catch(() =>
        fixture.system.finder.find({ x: 0, y: 1 }, { x: 2, y: 1 })
    );

    expect(result.info.map(info => info.code)).toContain(174);
    expect(result.ret).toHaveLength(2);
});
```

For code-emitting paths that do not throw, spy the logger instead. Source:
`data-state/src/replay/commands.test.ts:125-141`.

```typescript
const error = vi.spyOn(logger, 'error');
await expect(command.execute(step(ReplayCommandCode.Up, []))).resolves.toBe(false);
expect(error).toHaveBeenCalledWith(2003);
error.mockRestore();
```

**5. Async actions: real timers + `await controller.onEnd`.** Source:
`data-common/src/common/mover.test.ts:128-140`.

```typescript
const mover = createMover(tile);
mover.step(FaceDirection.Right);
const controller = mover.start();
expect(controller).not.toBeNull();
await controller!.onEnd;
expect(tile.x).toBe(1);
```

**6. CoreState factory** for integration: `createCoreState()` (Node-safe, independent
instances) — `data-state/test/coreNode.test.ts:1-44`.

**7. Inline fake injection** (D-03): build the collaborator inline, do not mock data-layer
interfaces (TESTING.md). Source: `data-system/src/path/system.test.ts:336-354`.

```typescript
const system = new modules.PathfindingSystem(commonState as never);
const tile = createTestTile();
system.useMover(tile.mover);
system.finder.useMapState(maps);
system.finder.useMapLayer(layer);
```

---

## A. Monster combat

Targets: `data-system/src/combat/*` (Layer 2, `ICombatFlow`/damage) ↔ `data-state/src/enemy/*`
(top-level implementation) and `data-base/src/enemy/*` (data model).

### `data-system/src/combat/damage.test.ts` and `.../mapDamage.test.ts` (calculation, transform)

**Analog:** `data-system/src/path/system.test.ts` (pure algorithm + injected collaborator).
**Secondary analog:** `data-common/src/common/mover.test.ts` (inline `implements` test class).

Inject a fake hero/enemy handler object (no mocking of interfaces) exactly as the source uses
its handler, then assert deterministic numbers:

```typescript
// data-system/src/path/system.test.ts:344-354 — injected predicate pattern to copy
function injectPredicate(fixture: SystemFixture): void {
    const predicate = new FixturePredicate(
        fixture.map,
        new modules.Dir8FaceHandler()
    );
    fixture.system.finder.usePassPredicate(predicate);
}
```

Use `logger.catch` (shared pattern 4) for guard/warn branches in `damage.ts` / `mapDamage.ts`.

### `data-system/src/combat/combat.test.ts` (flow/service, event-driven)

**Analog:** `data-system/src/event/eventDispatch.test.ts` (async executor with fake store, DI,
await-ordering proof). **Secondary:** `data-state/src/event/event.test.ts` (`CoreState` fixture).

Copy the fake collaborator + manual-resolver await proof. Source:
`data-system/src/event/eventDispatch.test.ts:348-411`.

```typescript
// 验证来源事件按排序顺序逐个 await，不会并行执行
it('awaits each source before continuing to the next one', async () => {
    let release: () => void = () => {};
    const pending = new Promise<void>(resolve => {
        release = resolve;
    });
    // ... stub execute: async () => { calls.push(...); await pending; return true; }

    const running = fixture.mover.enter({ /* handler */ });
    await Promise.resolve();
    expect(calls.map(call => call.id)).toEqual(['slow-point']);
    release();
    await running;
    expect(calls.map(call => call.id)).toEqual([
        'slow-point',
        'dynamic-enter',
        'static-enter'
    ]);
});
```

Build a `CombatFlow` against a minimal fake `IStateBase` (inline object) and fake
enemy view / context; assert `bindContext`/`bindDamage` state-identity warn code 138 and
`addCombatScript` duplicate-priority warn code 140 (`data-system/src/combat/combat.ts:50-114`).

### `data-system/src/combat/context.test.ts` (registry/service, CRUD)

**Analog:** `data-common/src/store/tileStore.test.ts` (register/query/replace/unknown-returns-safe).
Copy its contract table pattern (`data-common/src/store/tileStore.test.ts:20-74`) for the
enemy-context registry: add → lookup by view / computed / origin, unknown → `null`, duplicate
handling, and "does not expose mutable internals".

### `data-state/src/enemy/calculator.test.ts` (calculation, transform)

**Analog:** `data-state/test/dataClosure.test.ts:134-166` — this is the *existing* partial
coverage of `MainDamageCalculator`; extend it. It builds a fake hero handler inline.

```typescript
// data-state/test/dataClosure.test.ts:135-166
const hero = {
    getBaseAttribute: (name: keyof IHeroAttr): IHeroAttr[typeof name] =>
        (name === 'hp' ? 100 : 0),
    getFinalAttribute: (name: keyof IHeroAttr): IHeroAttr[typeof name] => {
        if (name === 'atk') return 20;
        if (name === 'def') return 5;
        return 0;
    }
} as IReadonlyHeroAttribute<IHeroAttr>;
const handler = {
    enemy, context: state.enemyContext, locator: { x: 0, y: 0 }, hero, state
} as IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>;

const calculator = new MainDamageCalculator();
const first = calculator.calculate(handler);
const second = calculator.calculate(handler);

expect(first).not.toBeNull();
expect(second).toEqual(first);
expect(first?.damage).toBe(3);
expect(first?.turn).toBe(2);
```

Extend to the special branches in `calculator.ts`: 无敌(20)/吸血(11)/魔攻(2)/连击(4,5)/
多段(6)/支援 guard/先攻(1)/破甲(7)/反击(8)/净化(9)/固伤(22)/仇恨(17)/负伤 flag
(`data-state/src/enemy/calculator.ts:31-164`). For the support-enemy branch, inject a fake
`context.getEnemyByLocator` and assert warn code 137 for a missing guard.

### `data-state/src/enemy/aura.test.ts`, `special.test.ts`, `mapDamage.test.ts`, `comparer.test.ts`, `final.test.ts`

**Analog:** `data-system/src/path/system.test.ts` for pure transform (aura/final/mapDamage),
`data-common/src/store/tileStore.test.ts` for the special registry, and
`data-common/src/common/mover.test.ts` for tiny compare helpers.

- `aura.ts` / `final.ts` / `mapDamage.ts`: construct plain attribute objects inline, compute,
  assert exact values (transform pattern).
- `special.ts`: register strategies, assert get/has/add/iterate/delete plus duplicate warn
  (model 96) — tileStore registry pattern.
- `comparer.ts`: inline fake enemies, assert sort/comparison order (flow-match).

### `data-state/test/combatClosure.test.ts` (integration, request-response)

**Analog:** `data-state/test/dataClosure.test.ts` (exact). It already builds an
`IEnemy` via `enemyManager`, a fake hero, and runs `MainDamageCalculator` against a real
`CoreState` (`data-state/test/dataClosure.test.ts:45-166`). Reuse that shape for the full
battle path (context + flow + calculator) driven through `createCoreState()`.

For async battle/event completion use the closed-loop fixture helpers:
`data-state/test/dataClosure.test.ts:97-102,182-193`.

```typescript
async function waitForEnded(sandbox: IReplaySandbox): Promise<void> {
    for (let index = 0; index < 1000 && !sandbox.ended; index++) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    if (!sandbox.ended) throw new Error('closure replay did not end');
}
```

### `data-base/src/enemy/enemy.test.ts` (model, CRUD)

**Analog:** `data-state/test/dataClosure.test.ts:104-118` (enemy create/mutate/save/load) —
this is the exact behavior D-14 asks to expand:

```typescript
// 验证敌人管理器能够创建敌人、修改属性并完成独立存档恢复
it('creates, mutates, and saves an enemy through the public manager', () => {
    const state = createCoreState();
    const enemy = addEnemy(state);

    enemy.setAttribute('hp', 31);
    const saved = enemy.saveState(SaveCompression.NoCompression);
    enemy.setAttribute('hp', 2);
    enemy.loadState(saved, SaveCompression.NoCompression);

    expect(enemy.getAttribute('hp')).toBe(31);
    expect(enemy.getAttribute('atk')).toBe(8);
    expect(enemy.id).toBe('closure-enemy');
});
```

Expand to `Enemy` model: attribute get/set/add, special add/get/has/iterate/delete,
`clone`/`cloneAttributes`/`copyFrom`, save/load round-trip, and duplicate-special warn 96
(`data-base/src/enemy/enemy.ts:5-107`). For load of a missing special, assert warn 120.

### `data-base/src/enemy/manager.test.ts` (registry/model, CRUD)

**Analog:** `data-common/src/store/tileStore.test.ts` (exact for registry contract).
Cover D-14: registry (special/attribute), prefab by code/id, reuse mapping, `compareWith` /
comparers. Use the tileStore "aligned indexes / replaces on conflict / missing returns safe"
shape (`data-common/src/store/tileStore.test.ts:42-74`).

### `data-base/src/enemy/special.test.ts` (model, CRUD)

**Analog:** `data-common/src/store/tileStore.test.ts`. Tiny synthetic special objects inline;
assert clone/save/load round-trip and registry lookups.

---

## B. Replay

Targets: `data-common/src/replay/*` (array/system/sandbox/func) plus integration via
`data-state/src/replay/*` and `CoreState`.

### `data-common/src/replay/array.test.ts` (array store, streaming)

**Analog:** `data-state/test/nodeReplay.test.ts` harness (`data-state/test/nodeReplay.test.ts:93-120`).
Build a `ReplayArray` with the same small init sizes used in
`data-common/src/replay/system.ts:31-42`, then assert add/read-stream/expand bounds and
`commandWidth` behavior (streaming reads).

### `data-common/src/replay/system.test.ts` (system, request-response)

**Analog:** `data-state/src/replay/commands.test.ts:49-93` (exact for registration order /
per-instance independence):

```typescript
// 验证每个 CoreState 都按稳定顺序装配八个指令
it('registers the eight stable commands in order on every CoreState', () => {
    const state = createCoreState();
    expect(REPLAY_COMMAND_ORDER).toEqual([
        ReplayCommandCode.Up, ReplayCommandCode.Right, ReplayCommandCode.Down,
        ReplayCommandCode.Left, ReplayCommandCode.Teleport,
        ReplayCommandCode.UseItem, ReplayCommandCode.Equip, ReplayCommandCode.Unequip
    ]);
    expect(REPLAY_COMMAND_ORDER.every(code => state.replaySystem.getCommand(code))).toBe(true);
});
```

Also cover `registerCommand` duplicate warn 163, `record` writing to `route`, and hook
dispatch (`data-common/src/replay/system.ts:50-86`).

### `data-common/src/replay/sandbox.test.ts` (loop/state, event-driven)

**Analog:** `data-state/src/replay/commands.test.ts:255-288` (manual sandbox stepping) and
`data-state/test/dataClosure.test.ts:225-246` (stops on first failure).

```typescript
// data-state/test/dataClosure.test.ts:225-246
const replay = new ReplaySystem();
let laterExecuted = false;
replay.registerCommand(0, { execute: async () => false });
replay.registerCommand(1, { execute: async () => { laterExecuted = true; return true; } });
replay.record(0);
replay.record(1);
const sandbox = replay.createReplaySandbox({
    route: replay.route,
    reseter: { reset: () => {} }
}) as IManualReplaySandbox;
sandbox.pausing = false;
sandbox.playing = true;

await expect(sandbox.step()).resolves.toBe(false);
expect(sandbox.getReplayed()).toBe(1);
expect(laterExecuted).toBe(false);
```

Also cover `play`/`pause`/`resume`/`stop`, `finalizeLast` (`notExecuted`), and warn codes
156/157/158/175 (`data-common/src/replay/sandbox.ts:64-185`). No fake timers (D-04).

### `data-common/src/replay/func.test.ts` (decorators/helpers, transform)

**Analog:** `data-state/src/replay/commands.test.ts:350-417` (decorator/collection-context
fixture with `console`/`logger` spies). Cover the replay safety decorator lifecycle:
begin → nested calls → end → detail, and reset lifecycle (codes 159/161).

### `data-state/test/replayIntegration.test.ts` (integration, event-driven)

**Analog:** `data-state/test/nodeReplay.test.ts` (exact) — it already drives
`ReplaySystem` + sandbox through a step harness (`data-state/test/nodeReplay.test.ts:93-120`).
Per D-16, cross-check against `03-REPLAY-CONTRACT.md` / `03-REPLAY-DIAGNOSTICS.md`; on first
divergence stop and report command index/code/params.

---

## C. Hero

Targets: `data-base/src/hero/*` (attribute, equipment, equipStore, follower, items, location,
modifier, mover, state) — D-17: verify each subsystem.

### Pure/model subsystems: `attribute.test.ts`, `modifier.test.ts`, `follower.test.ts`, `equipStore.test.ts`, `items.test.ts`

**Analog:** `data-common/src/store/tileStore.test.ts` (registry CRUD contract) and
`data-system/src/path/system.test.ts` (transform, injected inputs).

- `attribute.ts` / `modifier.ts`: inline base/final/modifier objects; assert base vs final
  computation and modifier ordering (transform).
- `equipStore.ts` / `follower.ts` / `items.ts`: registry CRUD — add/get/unknown-safe/replace.

### `equipment.test.ts` (model, CRUD)

**Analog:** `data-state/src/replay/commands.test.ts:200-253` — the established equipment
boundary (`equip`/`unequip`/`getEquipped`) with `vi.spyOn`:

```typescript
// 验证卸下指令复用既有装备边界并以最终槽位校验结果
it('unequips through the existing equipment boundary', async () => {
    const equipment = state.hero.equip;
    const getEquipped = vi.spyOn(equipment, 'getEquipped');
    getEquipped.mockReturnValueOnce(undefined);
    // ... assert equip/unequip return values
});
```

### `location.test.ts` (model, CRUD)

**Analog:** `data-state/src/event/event.test.ts:54-92` — minimal `CoreState` fixture sets
`hero.location.setFloor/setPos` and `mover.setFaceDir`; assert position/floor/face getters
and bounds.

### `mover.test.ts` (async mover, event-driven)

**Analog:** `data-common/src/common/mover.test.ts` (exact — same abstract mover pattern) and
`data-system/src/path/system.test.ts:485-521`. Use real timers + `await controller.onEnd`.

### `state.test.ts` (model + save, CRUD)

**Analog:** `data-state/test/dataClosure.test.ts:169-179` (saveable hero round-trip):

```typescript
// 验证可存档勇士内容在修改后能够恢复保存时的属性快照
it('round-trips a saveable hero state', () => {
    const state = createCoreState();
    const hero = state.hero.getModifiableAttribute();
    hero.set('hp', 88);
    const saved = state.hero.saveState(SaveCompression.NoCompression);

    hero.set('hp', 1);
    state.hero.loadState(saved, SaveCompression.NoCompression);

    expect(state.hero.attribute.getBaseAttribute('hp')).toBe(88);
});
```

---

## D. Map (expanded coverage, D-18)

Targets: `data-base/src/map/*`. Existing tests: `eventPath.test.ts`, `eventView.test.ts`,
`mapLifecycle.test.ts`. New files extend matrix / point events / layers / dirty / resize-crop.

**Analog (exact) for all four new files:** `data-base/src/map/mapLifecycle.test.ts`.

Inline fixture + global stub — copy verbatim shape (`data-base/src/map/mapLifecycle.test.ts:10-98`):

```typescript
function createMapState(
    pointEvents: Record<number, Record<number, string>> = {},
    blocks: number[] = [1, 1, 1, 1]
) {
    const tileStore: ITileStore = new modules.TileStore() as never;
    tileStore.addTile({
        num: 1, id: 'base', events: { 10: 'base-event' }, type: 0,
        pass: { onlyEvents: false, outPass: 15, inPass: 15 }, eventPass: true
    });
    const faceManager = new modules.FaceManager();
    faceManager.register(1, new modules.Dir8FaceHandler());
    const state: IDataCommon = { tileStore, /* ... */ } as never;
    const mapState = new modules.MapState(tileStore, state);
    const map = mapState.fromRaw({
        floorId: 'F1', width: 2, map: { 0: blocks },
        layerAlias: { 0: 'event' }, events: { 0: pointEvents }
    });
    return { map: map!, layer: map!.getLayerByAlias('event')! as IResizableMapLayer };
}
```

All-compression loop + explicit key-field assertions (D-13) — copy
`data-base/src/map/mapLifecycle.test.ts:203-234`:

```typescript
const compressionLevels = [
    SaveCompression.NoCompression,
    SaveCompression.LowCompression,
    SaveCompression.HighCompression
];
for (const compression of compressionLevels) {
    point.set(7, 'saved-point');
    const save = layer.saveState(compression);
    expect(save.pointEvents?.get(1)).toEqual(new Map([[5, 'raw-point'], [7, 'saved-point']]));
    point.set(7, 'changed-after-save');
    layer.loadState(save, compression);
    expect(point.get()).toEqual(new Map([[5, 'raw-point'], [7, 'saved-point']]));
}
```

Resize/crop/reindex pattern — `data-base/src/map/mapLifecycle.test.ts:278-319`.
`mapState.test.ts` also mirrors `eventPath.test.ts:44-60` for `fromRaw` validation and
logger warning paths.

---

## E. Save / load (saveables round-trip, D-10..D-13)

### `data-state/test/saveablesRoundTrip.test.ts` (integration, transform)

**Analog:** `data-state/test/dataClosure.test.ts` (exact) + `closed-loop.ts` envelope +
`mapLifecycle.test.ts` compression loop.

**Entry point (no interface change):** `CoreState.getSaveableContent(id)`
(`data-state/src/core.ts:486-489`); the four registered ids are set at
`data-state/src/core.ts:237-240`:

```typescript
this.addSaveableContent('@system/hero', this.hero);
this.addSaveableContent('@system/flags', this.flags);
this.addSaveableContent('@system/maps', this.maps);
this.addSaveableContent('@system/enemy', this.enemyManager);
```

Snapshot envelope (same shape as the closed-loop fixture) —
`packages-user/data-state/test/fixtures/closed-loop.ts:174-179`:

```typescript
const initialState: IClosedLoopInitialState = {
    hero: state.hero.saveState(SaveCompression.NoCompression),
    flags: state.flags.saveState(SaveCompression.NoCompression),
    maps: state.maps.saveState(SaveCompression.NoCompression),
    enemy: state.enemyManager.saveState(SaveCompression.NoCompression)
};
```

Same-instance round-trip (D-12): capture via `getSaveableContent(id).saveState(level)` →
mutate a known key field → `loadState(snapshot, level)` → assert only the key fields
(D-13). Loop over the 4 ids × 3 `SaveCompression` levels. Do **not** touch
`saveSystem.init` / IndexedDB and do not add `fake-indexeddb` (D-10).

---

## F. Flag

### `data-base/src/flag/system.test.ts` (registry, CRUD)

**Analog:** `data-state/test/dataClosure.test.ts:120-132` (existing flag round-trip) +
`data-common/src/store/tileStore.test.ts` (registry contract).

```typescript
// 验证 Flag 的设置读取和 save/load round trip 保留字段值
it('round-trips Flag values through save and load', () => {
    const state = createCoreState();
    state.flags.setFieldValue('closureScore', 7);
    state.flags.addFieldValue('closureScore', 5);
    const saved = state.flags.saveState(SaveCompression.NoCompression);

    state.flags.setFieldValue('closureScore', 0);
    state.flags.loadState(saved, SaveCompression.NoCompression);

    expect(state.flags.getFieldValue<number>('closureScore')).toBe(12);
    expect(state.flags.occupied('closureScore')).toBe(true);
});
```

Per D-19 cover the full public surface of `FlagSystem`
(`data-base/src/flag/system.ts:8-72`): `occupied`, `insertField`, `getField`, `getOrInsert`,
`getOrInsertComputed`, `deleteField`, `setFieldValue`, `addFieldValue`, `getFieldValue`,
`getFieldValueDefaults`, `saveState`/`loadState`. Note: flag `saveState()` takes **no**
compression argument. `FlagSystem` uses `Map.getOrInsertComputed`, so include the
`vi.hoisted` polyfill when the import chain requires it.

---

## G. Common

### `data-common/src/common/utils.test.ts`, `indexer.test.ts`, `faceManager.test.ts` (utility/registry)

**Analog:** `data-common/src/common/mover.test.ts` (same directory, exact boilerplate).
`utils.ts` helpers are pure (`getFaceMovement`, `degradeFace` — `data-common/src/common/utils.ts:8-40`);
`indexer.ts` `MapLocIndexer` is a pure round-trip (`data-common/src/common/indexer.ts:38-59`);
`faceManager.ts` is a registry (`register`/lookup by direction) — use the tileStore registry
shape.

Per D-20: only add these direct tests for helpers the main suites do not naturally exercise;
otherwise prefer coverage via combat/map/hero tests.

---

## No Analog Found

None. Every proposed test file maps to a tracked existing analog. Two thin spots the planner
should call out explicitly:

| Target | Reason / guidance |
|--------|-------------------|
| `data-common/src/replay/array.ts` (825 lines) | No dedicated array test exists; the stream/expand API is only exercised indirectly. Use `nodeReplay.test.ts` harness as the closest analog and assert through the public `IReplayArray` surface. |
| `data-system/src/combat/combat.ts` `combatFlow` | No existing test drives `CombatFlow` directly; model the fake collaborators on `eventDispatch.test.ts` and assert against the documented hook/script ordering (`combat.ts:164-194`). |

## Test-skip / findings workflow (D-05, D-06)

No existing analog uses `it.skip` for suspected bugs yet — all current tests pass. Establish
the convention in this phase:

```typescript
// 疑似 bug：xxx 行为与接口预期不一致，详见 06-TEST-FINDINGS.md #N，修复后取消 skip
it.skip('...', () => {
    // 按正确预期编写断言
});
```

`06-TEST-FINDINGS.md` is created in the phase directory with columns: 模块/接口、现象、
最小复现、疑似原因、影响面、建议修复方向、关联 skip 用例、严重度.

## Metadata

**Analog search scope:** `packages-user/data-common/src`, `packages-user/data-base/src`,
`packages-user/data-system/src`, `packages-user/data-state/src` and `data-state/test`
**Files scanned:** 18 existing test files + 9 fixtures/target modules
**Analog gate:** all cited analog paths return non-empty from `git ls-files` (tracked source)
**Pattern extraction date:** 2026-09-14
