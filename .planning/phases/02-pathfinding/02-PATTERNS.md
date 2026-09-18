# Phase 2: 寻路系统 - Pattern Map

**Mapped:** 2026-09-09
**Files analyzed:** 12（10 新建 + 4 修改，含 2 处 barrel 与 1 处 core 接线）
**Analogs found:** 12 / 12（全部有强匹配，无 no-analog 项）

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages-user/data-system/src/pathfinding/types.ts` | types | — | `packages-user/data-system/src/event/types.ts` | role-match |
| `packages-user/data-system/src/pathfinding/graph.ts` | utility (transform) | transform | `packages-user/data-system/src/combat/mapDamage.ts` | role-match |
| `packages-user/data-system/src/pathfinding/system.ts` | service (L2 system) | request-response | `packages-user/data-system/src/event/system.ts` + `combat/mapDamage.ts` | exact |
| `packages-user/data-system/src/pathfinding/index.ts` | barrel | — | `packages-user/data-system/src/event/index.ts` | exact |
| `packages-user/data-state/src/pathfinding/heroPathfinding.ts` | service (L3 wiring) | event-driven | `packages-user/data-state/src/hero/moverImpl.ts` + `core.ts` | exact |
| `packages-user/data-system/src/pathfinding/graph.test.ts` 等 | test | — | `packages-user/data-system/src/event/eventDispatch.test.ts` | exact |
| `packages-user/data-state/src/heroPathfinding.test.ts` | test (L3) | event-driven | `packages-user/data-system/src/event/eventDispatch.test.ts` | exact |
| `packages-user/data-common/src/common/mover.test.ts`（L0 回归） | test | — | `eventDispatch.test.ts` 桩模式 | role-match |
| 修改 `packages-user/data-common/src/common/mover.ts` | L0 core (bug fix) | — | 自身 `moveProgress` | exact |
| 修改 `packages-user/data-system/src/index.ts` | barrel | — | 自身 | exact |
| 修改 `packages-user/data-state/src/index.ts` | barrel | — | 自身 | exact |
| 修改 `packages-user/data-state/src/core.ts` | L3 init wiring | — | 自身 235-237 行 | exact |
| 修改 `packages/common/src/logger.json` | config (错误码注册) | — | 既有码位顺序分配 | role-match |

## Pattern Assignments

### `packages-user/data-system/src/pathfinding/system.ts`（service, request-response）

**Analog:** `packages-user/data-system/src/event/system.ts`（L2 system 类形态）+ `packages-user/data-system/src/combat/mapDamage.ts`（可注入策略 + logger 数字码形态）

**Imports pattern**（system.ts:1-5，逐字）——L2 层 import 顺序：外部包 → `@user/data-*` → 本目录相对路径：

```typescript
import { IStateBase } from '@user/data-base';
import { IGameEventStore } from '@user/data-common';
import { AnonTokyoInterpreter } from 'anon-tokyo';
import { EventExecutor } from './executor';
import { IGameEventExecutor, IGameEventSystem } from './types';
```

**类形态：构造器持 state、成员可空、注入方法**（system.ts:7-23，逐字）——PathfindingSystem 照此骨架，绑定 `IMapLayer`/`IObjectMovable`（D-03）用 `useXxx()` 槽位注入：

```typescript
export class GameEventSystem implements IGameEventSystem {
    readonly executor: IGameEventExecutor;
    store: IGameEventStore | null;

    constructor(readonly state: IStateBase) {
        this.store = state.eventStore;
        // …
    }

    useStore(store: IGameEventStore | null): void {
        this.store = store;
    }
}
```

**可注入策略模式**（mapDamage.ts:74-77、99-102，逐字）——D-05 回退策略与通行性谓词照此：`useXxx(impl)` 赋值槽位，未注入时内建默认或 `logger.warn(码)`：

```typescript
useConverter(converter: IMapDamageConverter<TEnemy, THero>): void {
    this.converter = converter;
    this.refreshAll();
}
// …
useReducer(reducer: IMapDamageReducer): void {
    this.reducer = reducer;
    this.reducedCache.clear();
}
```

**依赖缺失时 logger.warn 数字码 + 优雅返回**（mapDamage.ts:169-173，逐字）——寻路系统未绑定地图/对象时的守卫照此（新 warn 码从 173 起）：

```typescript
getReducedDamage(locator: ITileLocator): Readonly<IMapDamageInfo> | null {
    if (!this.reducer) {
        logger.warn(103);
        return null;
    }
```

**类成员规范**（mapDamage.ts:38-67）：所有成员显式类型；私有可变槽位不带下划线前缀；`private readonly` 用于不变成员；接口 `I` 前缀。

---

### `packages-user/data-system/src/pathfinding/types.ts`（types）

**Analog:** `packages-user/data-system/src/event/types.ts` / `combat/types.ts`（同目录 interface 集中）+ `packages-user/data-common/src/common/mover.ts`（函数类型别名惯例）

规范要点（dev.md 硬规则，从 analog 反推）：
- 接口 `I` 前缀大驼峰（如 `IPathfindingSystem`、`IPathfindingFallbackPolicy`）
- 对象类型单独开 `interface`，禁止内联对象类型
- 函数类型单独开 `type`（如 `type IPathCostFunction = (from: ITileLocator, to: ITileLocator) => number;`），除非短于 20 字符
- 每个 interface 成员必须 jsDoc 中文注释，方法之间空行；成员注释不换行、方法注释换行风格（参照 mover.ts:47-64 的 `IObjectMovable` 注释格式）
- 枚举用 `const enum`（参照 `EventTrigger`、`HeroMoveCode`）

**绑定面（直接引用既有接口，勿重定义）**：`IObjectMovable`（data-common/src/common/mover.ts:47-64）、`IMapLayer`（data-base/src/map/mapLayer.ts）、`ITileLocator`（@motajs/common）、`ObjectMoveStep`/`ObjectMoveType`（mover.ts:14-31、132-140）、`EventTrigger`（data-common/src/event/types.ts:7-17）。

---

### `packages-user/data-system/src/pathfinding/graph.ts`（utility, transform）

**Analog:** `packages-user/data-state/src/hero/moverImpl.ts` 的 `canPass`（有向边判定语义唯一事实源）+ `mapDamage.ts`（`ILocationHelper` 索引化坐标）

**有向边判定——逐字复制此语义**（moverImpl.ts:85-104），图构建的边 = `canLeave && canEnter`：

```typescript
const opposite = face.opposite(direction);
const leaveMask = this.directionToPassBit(direction);
const enterMask = this.directionToPassBit(opposite);

let canLeave = true;
let canEnter = true;

// 判断事件层
const curr = event.getLocationData(x, y);
const next = event.getLocationData(nx, ny);
const currRaw = curr?.static.raw();
const nextRaw = next?.static.raw();
if (currRaw) {
    canLeave = !!(leaveMask & currRaw.pass.outPass);
}
if (nextRaw) {
    canEnter = !!(enterMask & nextRaw.pass.inPass);
}
```

**多层逻辑必须完整复刻**（moverImpl.ts:107-122）：事件层永远参与判定；其余层仅当 `pass.onlyEvents` 为真时参与：

```typescript
for (const layer of map.layerList) {
    if (layer === event) continue;
    // …
    if (currRaw?.pass.onlyEvents) {
        canLeave = !!(leaveMask & currRaw.pass.outPass);
    }
    if (nextRaw?.pass.onlyEvents) {
        canEnter = !!(enterMask & nextRaw.pass.inPass);
    }
    if (!canLeave || !canEnter) return false;
}
```

**方向→PassBit 映射照抄**（moverImpl.ts:40-53，逐字），或抽公共供两处使用（单一事实源，dev.md 禁重复语义）：

```typescript
private directionToPassBit(dir: FaceDirection): number {
    switch (dir) {
        case FaceDirection.Up:
            return PassBit.Up;
        case FaceDirection.Right:
            return PassBit.Right;
        case FaceDirection.Down:
            return PassBit.Down;
        case FaceDirection.Left:
            return PassBit.Left;
        default:
            return 0;
    }
}
```

**推荐落法**：不复制实现，而是把 canPass 的边判定抽为可注入谓词（`useTopImplementation` 同款，见 Shared Patterns），graph.ts 消费谓词而非 import moverImpl（L2 禁 import L3，防循环依赖）。

**坐标索引化**参照 mapDamage.ts:105 `this.indexer.locaterToIndex(locator)` —— 图节点可用索引存邻接表（注意：项目用 `getOrInsertComputed` 扩展方法，mapDamage.ts:106 逐字用法）。

**边界守卫**参照 moverImpl.ts:55-61 `inBound`（isNil 判空 + width/height 比较）。

---

### `packages-user/data-state/src/pathfinding/heroPathfinding.ts`（service, event-driven）

**Analog:** `packages-user/data-state/src/hero/moverImpl.ts`（L3 实现类形态 + env 构造）+ `core.ts:235-237`（接线点）

**L3 实现类骨架**（moverImpl.ts:1-32，逐字 imports + 构造）——L3 从 L0/L1/L2 依赖（`@user/data-system` 在此合法）：

```typescript
import { ITileLocator } from '@motajs/common';
import {
    BlockEventType,
    IBlockEventEnv,
    IBlockEventParam,
    IGameEventInvocation,
    IHeroMoveTopHandler,
    IHeroMoveTopImpl,
    IMapState,
    IReadonlyTileBase
} from '@user/data-base';
import { EventTrigger, FaceDirection, PassBit } from '@user/data-common';
import { IGameEventExecutor, IStateSystem } from '@user/data-system';
import { isNil } from 'lodash-es';

export class DefaultHeroMoveTopImpl implements IHeroMoveTopImpl {
    /** 地图存储对象 */
    private readonly maps: IMapState;
    /** 游戏事件执行器 */
    private readonly executor: IGameEventExecutor;

    constructor(state: IStateSystem) {
        this.maps = state.maps;
        this.executor = state.eventSystem.executor;
    }
```

**D-08 直派 OnTouch：env 构造逐字复刻**（moverImpl.ts:206-222，`commonTrigger` 内）：

```typescript
const param: IBlockEventParam = { custom: {} };
const invocations: IGameEventInvocation[] = [];
for (const source of [...pointSources, ...tileSources]) {
    const env: IBlockEventEnv = {
        state: handler.state,
        type: source.type,
        trigger,
        heroLocator: heroLoc,
        triggerLocator: { x, y },
        tile: source.tile,
        layer: event,
        map
    };
    invocations.push({ id: source.id, env });
}

await this.executor.execute<void>(invocations, param);
```

**事件收集（点事件 + 静态/动态图块事件）**（moverImpl.ts:169-204）——默认回退策略"路径上存在事件"（D-05）按同款方式探测事件：`event.getPointEvent(x, y)`、`loc.static.tileEvent().get()`、`loc.dynamics` 遍历。

**逐步执行判定链（复用，勿重写）**：`packages-user/data-base/src/hero/mover.ts:160-208` `onStepStart`——顺序为 `inBound → canPass → shouldHit`，产出 `HeroMoveCode.Step/Hit/CannotMove/Stop`；`onStepEnd`（mover.ts:223-243）在 `CannotMove/Stop/Hit` 时 `controller.stop()`（注意 mover.ts:227 注释：**这里不能 await controller.stop**）。

**接线点照抄**（core.ts:235-237，逐字）——新寻路系统在 CoreState 构造器 `//#endregion 勇士顶层初始化` region 同处接线：

```typescript
// 勇士顶层初始化
const heroMoveTopImpl = new DefaultHeroMoveTopImpl(this);
this.hero.location.mover.useTopImplementation(heroMoveTopImpl);
```

**打断接管（D-10）**：`start()` 移动中返回 `null`（data-common/src/common/mover.ts:670 `if (this.moving) return null;`）→ 必须 `stop()` 旧移动后再 start；`stop()` 在当前步完成后兑现（mover.ts:695-698）。

---

### `packages-user/data-system/src/pathfinding/index.ts` + barrel 修改（barrel）

**Analog:** `packages-user/data-system/src/event/index.ts`（逐字）与 `packages-user/data-system/src/index.ts`（逐字）：

```typescript
export * from './executor';
export * from './system';
export * from './types';
```

```typescript
export * from './combat';
export * from './event';

export * from './types';
```

**修改**：`data-system/src/index.ts` 追加 `export * from './pathfinding';`；`data-state/src/index.ts` 追加寻路接线导出（置于 `export * from './hero';` 之后）。dev.md：不转发导出——barrel 只导出本 monorepo 内容。

---

### 测试文件 `*.test.ts`（test）

**Analog:** `packages-user/data-system/src/event/eventDispatch.test.ts`（既有 6 个测试文件的标准形态）

**桩模式逐字复制**（eventDispatch.test.ts:19-33）——logger 有 DOM 代码，必须 stub；`getOrInsertComputed` 必须 polyfill；模块动态 import：

```typescript
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
```

**fixture 工厂逐字照抄**（eventDispatch.test.ts:105-179 `createFixture`）——寻路测试的地图 fixture 直接复用此组合：`TileStore.addTile`（pass 位掩码：`{ onlyEvents: false, outPass: 15, inPass: 15 }`，eventPass）→ `FaceManager.register(1, new Dir8FaceHandler())` → `MapState.fromRaw`（`floorId/width/map/layerAlias/events`）→ `getLayerByAlias('event')` → `createDynamic`。**单向边用例**：把某格 pass 改为 `outPass: 0b0010, inPass: 0` 即得单向门（Pitfall 4 要求 A→B 可行、B→A 不可行的测试）。

**模块收集模式**（eventDispatch.test.ts:58-103）：`TestModules` interface + `beforeAll` 动态 import + `vi.stubGlobal` 二次确认。

**it 注释规范**（eventDispatch.test.ts:228-229 模式）：每个 `it` 前单行中文注释说明覆盖内容（dev.md 硬规则）：

```typescript
describe('source-aware matching dispatch', () => {
    // 验证地图绑定的点事件 ID 能经过 event layer 和 mover 执行一次
    it('executes a map-bound point id through the event layer and mover', async () => {
```

**mock 事件**（eventDispatch.test.ts:181-211 `addEvent`）：`events.set(id, { trigger, execute })` 收集 calls 数组断言 env 字段——D-08 OnTouch 直派测试照此。

---

### 修改 `packages-user/data-common/src/common/mover.ts`（L0 bug fix，Pitfall 1）

**缺陷实测定位（行号较 RESEARCH.md 修正）**：`moveProgress` 内 **651 行**（RESEARCH 记为 648-654，实际逐字如下，mover.ts:648-654）：

```typescript
const loc = await this.onStepEnd(code, step, this.tile, controller);
const before: ITileLocator = { x: this.tile.x, y: this.tile.y };
const curr: ITileLocator = { x: loc.x, y: loc.y };
if (this.tile.x !== loc.x && this.tile.y !== loc.y) {   // ← 651 行：&& 疑为 ||
    this.tile.setPos(loc.x, loc.y);
}
```

**修改模式**：`&&` → `||`（用户确认后，D-07 关卡），并补 L0 回归测试（正交/斜向/传送步的 setPos 回写）。相关机制：`start()`（mover.ts:669-710）——`moving` 期间返回 null、`controller.stop()` 置 `shouldStop` 并返回 `onEnd`。

**IMoverController 接口**（mover.ts:142-164，逐字，寻路控制器消费面）：

```typescript
export interface IMoverController {
    /** 本次移动是否已经全部完成 */
    done: boolean;
    /** 当本次移动结束时兑现 */
    onEnd: Promise<void>;

    /**
     * 向当前移动队列末尾追加步骤
     * @param steps 要追加的步骤列表
     */
    push(...steps: Readonly<ObjectMoveStep>[]): void;

    /**
     * 停止当前移动，在当前步骤完成后兑现
     */
    stop(): Promise<void>;
}
```

**步骤类型（翻译目标）**（mover.ts:14-31、66-71）：逐步 → `{ type: ObjectMoveType.Dir, move: FaceDirection }`；瞬移 → `ObjectMoveType.Teleport`；面朝 → `ObjectMoveType.Face`。

---

### 修改 `packages-user/data-state/src/core.ts`（L3 init wiring）

**Analog:** 自身 235-237 行（见上）。寻路系统接线紧随 `useTopImplementation` 之后新增：

```typescript
// 寻路系统接线（示例，签名以 D-07 拍板草案为准）
const heroPathfinding = new HeroPathfinding(this);
// 绑定 hero mover / 注入默认谓词与回退策略
```

---

### 修改 `packages/common/src/logger.json`（config）

**Analog:** 既有码位顺序分配（RESEARCH 已枚举验证：error 已用 1-64，warn 已用 1-172）。本阶段新码：**error ≥ 65、warn ≥ 173**，在本阶段内一次性集中登记（避免撞码）。

## Shared Patterns

### 1. 可注入策略槽位（`useXxx()`）
**Source:** `data-system/src/combat/mapDamage.ts:74-77`、`data-base/src/hero/mover.ts:72-74`（`useTopImplementation`）
**Apply to:** PathfindingSystem 的通行性谓词（D-02）、回退策略（D-05）
```typescript
useTopImplementation(impl: IHeroMoveTopImpl | null): void {
    this.topImpl = impl;
}
```
**Why:** L2（data-system）禁 import L3（data-state）的 `DefaultHeroMoveTopImpl`——循环依赖。谓词/策略由 L3 接线时注入，L2 只持有函数类型槽位。

### 2. logger 数字错误码
**Source:** `data-system/src/combat/mapDamage.ts:140,171,337`（`logger.warn(104/103/102)`）
**Apply to:** 所有寻路文件；新 error 码 ≥65、warn 码 ≥173，先在 `packages/common/src/logger.json` 登记
```typescript
if (!this.reducer) {
    logger.warn(103);
    return null;
}
```

### 3. IBlockEventEnv 构造（事件派发）
**Source:** `data-state/src/hero/moverImpl.ts:206-222`
**Apply to:** D-08 相邻格 OnTouch 直派、默认回退策略的事件探测
```typescript
const env: IBlockEventEnv = {
    state: handler.state,
    type: source.type,
    trigger,
    heroLocator: heroLoc,
    triggerLocator: { x, y },
    tile: source.tile,
    layer: event,
    map
};
await this.executor.execute<void>(invocations, param);
```

### 4. 有向边 / 通行性判定语义
**Source:** `data-state/src/hero/moverImpl.ts:63-125`（canPass 全文，事件层 + onlyEvents 多层）
**Apply to:** graph.ts 边构建（推荐抽公共谓词注入，两处共用单一事实源）；单向门天然由掩码不对称产生

### 5. 打断/停旧起新时序
**Source:** `data-common/src/common/mover.ts:669-710`（start 返回 null / stop 语义）、`data-base/src/hero/mover.ts:223-243`（onStepEnd 自行 stop，且不能 await）
**Apply to:** D-10 打断接管——持有当前 controller 引用；stop → 等兑现（或 onEnd 回调）→ 查新位置 → 起新路径；需识别"移动已自然终止"

### 6. 测试桩与 fixture
**Source:** `data-system/src/event/eventDispatch.test.ts:19-33, 105-179`
**Apply to:** 全部新测试文件（stub `main.replayChecking` + location origin + `getOrInsertComputed` polyfill + 动态 import + `createFixture` 地图工厂）；运行 `npx vitest run <path>`（`pnpm test` 是 watch 模式）

### 7. dev.md 硬规范（全部新文件）
- 模块无顶层副作用；无 `import type`（普通引入）；禁循环引用（`pnpm check:circular` 验证）
- 禁非必要 `any`；尽量不用 `as`（测试 fixture 例外用 `as never`，analog 同款）；类成员显式类型；对象类型单独 `interface`
- 命名：接口 `I` 前缀；文件名小驼峰；不变常量全大写；私有成员无下划线前缀
- CRLF 换行；jsDoc 中文注释 40-60 字符换行；接口方法间空行
- 双端分离：无 DOM，Node 回放可验证

## No Analog Found

无。所有新建文件在仓库内均有直接 analog。唯"图构建 + Dijkstra 搜索"的**算法体本身**无现成实现（仓库无寻路代码），其**外壳**（类形态/注入/守卫/logger）全部按上述 analog 落；算法内部按 RESEARCH.md D-01/D-02 语义自写（~40 行 Dijkstra，O(V²) 足够）。

## 注意：与 RESEARCH.md 的行号偏差

Pitfall 1 缺陷行实测为 **mover.ts:651**（RESEARCH.md 记为 648-654 区间，指向同一处 `&&`）。 planner 引用时以 651 行为准。

## Metadata

**Analog search scope:** `packages-user/data-system/src`、`packages-user/data-state/src`、`packages-user/data-common/src`、`packages-user/data-base/src`
**Files scanned:** 14（含 glob 全列表 + 7 个精读）
**Tracked-source gate:** 全部 analog 经 `git ls-files` 验证为 git-tracked（无 `.gsd/` 镜像路径）
**Pattern extraction date:** 2026-09-09
