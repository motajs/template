# Phase 1: 事件系统 (event) - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 18 (create + modify + delete)
**Analogs found:** 18 / 18 (all have a codebase analog; no true "no-analog" files)

## File Classification

> 说明：接口层（L0/L1）已由用户设计完成（`EventTrigger`/`IGameEvent`/`GameEventStore`/`ITileBase.events`/`ILayerEventView`/`IBlockEvent*` 等）。本阶段是「落地已设计接口 + 删除旧 `ITrigger` 体系」。因此多数改造文件是**自我重构**（同一文件内 `triggers` → `events`），其 analog 即其自身。

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `data-system/src/event/types.ts` (新建) | service (接口) | event-driven | `data-system/src/trigger/types.ts` | exact |
| `data-system/src/event/executor.ts` (新建) | service | event-driven | `data-system/src/trigger/collector.ts` + `collection.ts` | exact |
| `data-system/src/event/index.ts` (新建) | config (桶导出) | — | `data-system/src/trigger/index.ts` | exact |
| `data-system/src/event/builtin.ts` (新建) | service (内建函数) | event-driven | `data-state/src/content/triggers.ts` (`ChangeFloorTrigger`) | role-match |
| `data-base/src/map/eventView.ts` (新建) | model (Map 视图 + dirty) | CRUD | `packages/common/src/dirtyTracker.ts` + `tile.ts` triggers 方法 | role-match |
| `data-common/src/store/index.ts` (改) | config (桶导出) | — | 自身 + `data-common/src/index.ts` | exact |
| `data-common/src/event/event.ts` (改) | model | transform | 自身 (`GameEvent.compile`) | exact |
| `data-common/src/store/tileStore.ts` (改) | store | CRUD | `store/itemStore.ts` | exact |
| `data-base/src/map/tile.ts` (改) | model | CRUD | 自身 (`MapTileBase` triggers 方法) | exact |
| `data-base/src/map/staticTile.ts` (改) | model | CRUD (存读档) | 自身 (`saveState`/`loadState`) | exact |
| `data-base/src/map/dynamicTile.ts` (改) | model | CRUD (存读档) | 自身 (`saveState`/`loadState`) | exact |
| `data-base/src/map/mapLayer.ts` (改) | model/service | CRUD (存读档) | 自身 (`syncStaticTrigger` + `compareWith`) | exact |
| `data-system/src/index.ts` (改) | config (桶导出) | — | 自身 | exact |
| `data-system/src/types.ts` (改) | config (接口) | — | 自身 (`IStateSystem`) | exact |
| `data-state/src/core.ts` (改) | provider (装配) | — | 自身 (L2 初始化 region) | exact |
| `data-state/src/hero/moverImpl.ts` (改) | controller | event-driven | 自身 (`commonTrigger`) | exact |
| `data-system/src/trigger/*` (删, 6 文件) | — | — | — (删除) | n/a |
| `data-state/src/content/triggers.ts` (删) | — | — | — (删除) | n/a |

---

## Pattern Assignments

### 1. `data-system/src/event/types.ts` (新建, service 接口, event-driven)

**Analog:** `data-system/src/trigger/types.ts`

这是「专门事件执行器」的接口层（D-10）。必须遵循项目「接口先行 + `implements`」的刚性约定（code.md 规则 14/15/16：公共方法必须先定义在接口、类成员必须 `readonly`、对象成员用接口类型不用类类型）。

**导入与依赖方向**（trigger/types.ts:1-7 为样板）：
```typescript
// 事件执行器依赖 L1 IStateBase，与旧 ITriggerHandler 同向
import { ITileLocator } from '@motajs/common';
import { IGameMap, IMapLayer, IStateBase, IDataBaseExtended } from '@user/data-base';
import { EventTrigger } from '@user/data-common';   // 注意：事件相关类型来自 L0，不是本层
```

**接口命名与结构样板**（trigger/types.ts:20-29 `ITriggerHandler`）：
```typescript
// 事件执行上下文 —— 替换旧 ITriggerHandler。字段用 readonly。
export interface ITriggerHandler {
    readonly state: IStateBase;
    readonly layer?: IGameMap;
    readonly mapLayer?: IMapLayer;
    readonly locator?: ITileLocator;
}
```

**before 类返回语义的关键参照**——「执行器如何表达 `OnBeforeBattle`/`OnBeforeOpenDoor`/`OnBeforeChangeFloor` 返回 `R` 决定是否继续」已经在 combat 层有现成样板，直接照抄其返回约定（combat/types.ts:767-790 `ICombatScript`）：
```typescript
// combat/types.ts:772-779 —— before 返回 boolean 表示「是否继续」的既定语义
before(
    info: IEnemyDamageInfo<TEnemy, THero>,
    handler: ICombatFlowHandler<TEnemy, THero>
): Promise<boolean>;
// 注释约定：返回 false 会立刻停止后续执行并放弃本次战斗
```

**错误/缺省处理**：执行器接口方法若拿不到 `eventStore` 中对应 id 的事件，按项目惯例 `logger.warn(code)` 后跳过（不抛异常）。参照 `eventStore.ts` 的 `getEvent` 返回 `null`，调用侧做空判。

---

### 2. `data-system/src/event/executor.ts` (新建, service, event-driven)

**Analog:** `data-system/src/trigger/collector.ts`（收集+排序） + `trigger/collection.ts`（异步派发）

D-06/D-10 要求「先点事件、后图块事件，各自按优先级降序，before 返回值集中解析」。旧 `TriggerCollector.collect` 就是这套排序/去重的唯一现成实现，直接沿用其结构。

**收集与优先级排序样板**（trigger/collector.ts:15-107）——核心逻辑是「优先级降序 + 重复优先级 warn」：
```typescript
// trigger/collector.ts:54-79（动态图块 > 2 的通用排序，含重复优先级警告）
const usedPriority = new Set<number>();
const duplicate = new Set<number>();
// ... 收集时
if (usedPriority.has(trigger.priority)) {
    duplicate.add(trigger.priority);
}
usedPriority.add(trigger.priority);
// ... 排序
triggers.sort((a, b) => b.priority - a.priority);
if (duplicate.size > 0) {
    logger.warn(136, [...duplicate].join(','));   // 136 = duplicate trigger priority
}
```

**异步顺序派发样板**（trigger/collection.ts:20-27）——事件执行是 `await` 顺序执行（D-09 长事件直接 await，不并行）：
```typescript
async trigger(condition: TriggerType, handler: ITriggerHandler): Promise<void> {
    for (const trigger of this.triggerList) {
        await this.dispatch(trigger, condition, handler);
    }
}
```

**核心差异点（执行器 vs 旧 collector）**：
- 旧 collector 输入 `ITriggerCollection`，新执行器输入「点事件 `ReadonlyMap<number,string>` + 图块事件 `ReadonlyMap<number,string>`」的 id，经 `state.eventStore.getEvent(id)` 取出 `IReadonlyGameEvent`，再 `event.execute(param, env)`（D-04/D-07/D-08）。
- `param` = `IBlockEventParam`（`{ custom: Record<string, any> }`，map/types.ts:35-38）；`env` = `IBlockEventEnv`（map/types.ts:40-55，含 `type`/`trigger`/`heroLocator`/`triggerLocator`/`tile`/`layer`/`map`）。
- before 类触发器（`EventTrigger.OnBeforeBattle/OnBeforeOpenDoor/OnBeforeChangeFloor`）的 `execute` 返回 `R`（boolean），由执行器统一解析后决定是否继续对应动作。

**执行器持有解释器**：参照 `EnemyContext` 的「attach + constructor(state)」装配风格（combat/context.ts:103），执行器构造器注入 `state`，内部从 `state` 取 `eventStore`。若执行器负责编译，则持有 `AnonTokyoInterpreter` 实例（anon-tokyo `.d.ts:19-29`）。

---

### 3. `data-system/src/event/index.ts` (新建, 桶导出)

**Analog:** `data-system/src/trigger/index.ts`（5 行）与 `combat/index.ts`（5 行）

```typescript
// trigger/index.ts:1-5 样板
export * from './builtin';
export * from './executor';
export * from './types';
```

---

### 4. `data-system/src/event/builtin.ts` (新建, 内建函数, event-driven)

**Analog:** `data-state/src/content/triggers.ts`（`ChangeFloorTrigger`，领域动作实现）

内建函数是 `BuiltInFunction[]`（anon-tokyo `.d.ts:61-65`），对应「对话 / 开门 / 道具 / 战斗」等游戏动作（EVT-02）。旧的 `ChangeFloorTrigger` 是唯一现成的「领域动作」实现，其 `trigger(handler)` 方法（content/triggers.ts:140-161）展示了如何从 `handler` 取 `layer`/`locator`/`mapLayer` 并驱动游戏状态（`hero.changeFloor`）。

**内建函数签名样板**（anon-tokyo `.d.ts:61-65` + `LanguageFeature` 153-156）：
```typescript
export declare interface BuiltInFunction {
    name: string;
    save?: boolean;
    func: (parameters: Record<string, any>, env: Record<string, any>) => any;
}
export declare interface LanguageFeature {
    builtInFunctions: BuiltInFunction[];
    globalFunctions: [name: string, Block][];
}
```

**参数校验惯例**：内建函数参数来自外部编辑器（不可信输入，RESEARCH Security Domain V5）。用 `isNil`（lodash-es）+ `logger.warn(code)` 缺省跳过，**绝不抛异常中断**（参照 content/triggers.ts:141-150 的 `if (!handler.layer || !handler.locator) { logger.warn(164); return; }` 模式）。

> ⚠️ A2 待定：具体内建函数清单/命名由用户主导（blockly 编辑器约定）。清单未定前，此文件仅含最小集（如 `openDoor`），其余留空。

---

### 5. `data-base/src/map/eventView.ts` (新建, ILayerEventView 实现, CRUD+dirty)

**Analog:** `packages/common/src/dirtyTracker.ts`（`PrivateMapDirtyTracker`）+ `tile.ts`（triggers 增删改方法）

`IReadonlyEventView` / `ILayerEventView`（map/types.ts:83-119）已定义但无实现。核心是「priority → eventId 的 Map」+ `dirty()`/`markPure()`。dirty 语义（D-12：初始 dirty=false，变动且与基准不同则 true）与 `PrivateMapDirtyTracker` 完全同构。

**dirty 追踪样板**（dirtyTracker.ts:92-133 `PrivateMapDirtyTracker`）：
```typescript
// mark() 返回一个 symbol 快照；dirtySince(mark) 比较 dirtyFlag 判断是否变化
private dirtyFlag: number = 0;
protected dirty(data: T): void {
    this.dirtyFlag++;
    this.markMap.set(data, this.dirtyFlag);
}
```

**增删改方法样板**（tile.ts:47-65，旧 `addTrigger`/`deleteTrigger`/`clearTrigger`，新实现直接改名/换类型为 `set`/`delete`/`clear` 对应 `ILayerEventView`）：
```typescript
clearTrigger(): void { this.triggers = null; }
addTrigger(trigger: number): void {
    if (!this.triggers) this.triggers = new Set();
    this.triggers.add(trigger);
}
// → 新接口为 set(priority, eventId) / delete(priority) / clear() / markPure()
```

> 注：`ILayerEventView` 用 `set(priority, event)` 带「优先级冲突则覆盖并 warn」语义（map/types.ts:96-102），冲突警告沿用 `logger.warn(136, ...)`（duplicate priority）惯例。

---

### 6. `data-common/src/store/index.ts` (改, 桶导出)

**Analog:** 自身 + `data-common/src/index.ts`

当前内容（store/index.ts:1-4）已含 `eventStore` 导出，**缺失 `mapStore`**（`core.ts:79` 只能写相对路径 `'../../data-common/src/store/mapStore'` 绕过桶导出——RESEARCH Pitfall 2）。

```typescript
// 需补为（参照 data-common/src/index.ts:1-7 的完整桶导出风格）
export * from './eventStore';
export * from './itemStore';
export * from './mapStore';   // ← 缺失，补上
export * from './tileStore';
export * from './types';
```

---

### 7. `data-common/src/event/event.ts` (改, compile 缓存回写)

**Analog:** 自身 (`GameEvent.compile`)

RESEARCH Pitfall 4：`compile()` 返回编译结果但未写回 `this.compiled`，导致 `execute()` 每次走 compile 分支。修复样板：

```typescript
// event/event.ts:24-26 现状
compile(): AnonTokyoExecutable | null {
    return this.interpreter.compile(this.rawEvent);
}
// → 改为写回缓存（this.compiled 是 readonly 接口成员，但类内可写）：
compile(): AnonTokyoExecutable | null {
    this.compiled = this.interpreter.compile(this.rawEvent);
    return this.compiled;
}
```
`setRaw`（event.ts:45-48）已正确置 `this.compiled = null`，缓存回写后即可生效。

---

### 8. `data-common/src/store/tileStore.ts` (改, 类型对齐)

**Analog:** `store/itemStore.ts`（`getData`/`getCategory` 的 `??` 缺省取值模式）

当前 `tileStore.ts:27-29` 的 `getTrigger` 返回 `dataMap.get(num)?.trigger ?? -1`，但 `ITileRawData` 已把 `trigger: number[]` 改为 `events: Record<number, string>`（store/types.ts:53），`ITileStore.getTrigger` 签名声明返回 `number[]`（store/types.ts:85）——实现与接口脱节，属「落地已设计接口」必改项。

**getter 缺省样板**（itemStore.ts:20-22）：
```typescript
getCategory(num: number): ItemCategory {
    return this.dataMap.get(num)?.category ?? ItemCategory.Unknown;
}
```

---

### 9. `data-base/src/map/tile.ts` (改, MapTileBase triggers → events)

**Analog:** 自身（`MapTileBase` 现有 `triggers`/`addTrigger`/`clearTrigger`/`useEmptyTrigger`，tile.ts:18,47-65）

`ITileBase` 接口（map/types.ts:148-170）已定义 `tileEvent(): ILayerEventView` 与 `pointEvent(): ILayerEventView | null`，但 `MapTileBase` 未实现（`implements ITileBase` 会报缺成员）。改造方向：

- `triggers: Set<number> | null` → 图块事件视图（`ILayerEventView`，含 priority→id Map + dirty 标记）
- `addTrigger`/`deleteTrigger`/`clearTrigger`/`useEmptyTrigger` → 委托给 `tileEvent()` 视图的 `set`/`delete`/`clear`
- 新增 `tileEvent()`/`pointEvent()` 实现（pointEvent 来自 `layer.event(x, y)`，map/types.ts:573）

私有成员必须加 jsDoc 注释（code.md 规则 8）。

---

### 10/11. `data-base/src/map/staticTile.ts` / `dynamicTile.ts` (改, 存读档 events)

**Analog:** 自身（现有 `saveState`/`loadState`/`shouldSave` 结构）

`IStaticBlockSave`/`IDynamicBlockSave` 继承 `IMapBlockSaveBase.events?: ReadonlyMap<number, string>`（map/types.ts:71-74），但实现仍写 `save.triggers = this.triggers`（staticTile.ts:41-43、dynamicTile.ts:105-107）。改造样板（保持现有结构，只换字段类型与存取方式）：

```typescript
// staticTile.ts:34-58 现状（triggers），改 events 后结构不变
shouldSave(): boolean { return !!this.triggers; }        // → 图块事件视图 dirty() 或非空判断
saveState(): Readonly<IStaticBlockSave> {
    const save: IStaticBlockSave = {};
    if (this.triggers) save.triggers = this.triggers;     // → save.events = 视图.get() 的 ReadonlyMap
    return save;
}
loadState(save: Readonly<IStaticBlockSave>): void {
    // triggers.size === 0 → useEmptyTrigger()，否则逐条 addTrigger
    // → events 为空 Map → clear()，否则逐条 set(priority, id)
}
```

> dirty 标记（D-12）语义：图块事件视图初始以「原始图块 `ITileRawData.events`」为基准（`markPure()`），存档时仅当 `dirty()` 为 true 才写入 `events`。参照 `MapLayer.saveStatics`（mapLayer.ts:580-589）里 `tile.shouldSave()` 决定是否写存档的门控。

---

### 12. `data-base/src/map/mapLayer.ts` (改, 事件视图 + 点事件)

**Analog:** 自身（`syncStaticTrigger`、`compareWith`、`event(x,y)`/`getPointEvent` 待实现）

接口 `IMapLayer.event(x,y): ILayerEventView | null`（map/types.ts:573）与 `getPointEvent`（581）已声明未实现。改造点：

- `syncStaticTrigger`（mapLayer.ts:118-134）：`triggers` 复制 → 图块事件视图的 `set`/`clear`（对应 `transferToDynamic`/`transferToStatic`/`transferToStaticIfSafe` 的 `keepEvent` 参数，map/types.ts:409-435 已定义）
- `createDynamic`（mapLayer.ts:314-329）：从 `location.static.triggers` 复制 → 复制图块事件视图
- 新增 `event(x,y)` / `getPointEvent(x,y)`：点事件存于 `IMapRawData.events`（store/types.ts:310，`Record<z, Record<pos, Record<priority, id>>>`），不随图块移动（D-03）

**脏标记对照**（mapLayer.ts:481-503 `dirty()`/`markDirty`/`compareWith`/`isEqualToRef`）：点事件的 dirty 应与图层 dirty 协同（RESEARCH A1），沿用 `layerDirty` + `refArray` 对比模式。

---

### 13/14. `data-system/src/index.ts` / `types.ts` (改, 桶导出 + IStateSystem)

**Analog:** 自身

- `index.ts`（data-system/index.ts:1-4）：`export * from './trigger'` → `export * from './event'`
- `types.ts`（data-system/types.ts:6-13）：`IStateSystem` 删除 `triggerRegistry`/`triggerCollector` 两个成员，替换为事件执行器成员（如 `readonly eventExecutor: IEventExecutor`，接口名由用户定/待确认）

```typescript
// data-system/types.ts:6-13 现状
export interface IStateSystem extends IStateBase {
    readonly enemyContext: IEnemyContext<IEnemyAttr, IHeroAttr>;
    readonly triggerRegistry: ITriggerRegistry;    // ← 删
    readonly triggerCollector: ITriggerCollector;  // ← 删
    // ← 增：事件执行器成员
}
```

---

### 15. `data-state/src/core.ts` (改, 装配)

**Analog:** 自身（L2 初始化 region，core.ts:184-209）

- 删 `TriggerRegistry`/`TriggerCollector` 装配（core.ts:203-207）
- L0 增 `eventStore` 实例化：`const eventStore = new GameEventStore(); this.eventStore = eventStore;`（`IDataCommon.eventStore` 已声明，types.ts:54；`GameEventStore` 已实现，store/eventStore.ts:5-28）
- 修 `import { MapStore } from '../../data-common/src/store/mapStore'`（core.ts:79）为桶导出 `@user/data-common`
- L2 增事件执行器装配（构造器注入 `this`），参照 combat 的 `EnemyContext`/`DamageSystem` 装配风格（core.ts:187-200）

**装配样板**（core.ts:202-207 现状 → 替换）：
```typescript
// 触发器注册与收集器（待删）
const triggerRegistry = new TriggerRegistry(this);
const triggerCollector = new TriggerCollector();
triggerCollector.attachRegistry(triggerRegistry);
// → 事件执行器（新）
const eventExecutor = new EventExecutor(this);   // 类名/接口名待定
```

---

### 16. `data-state/src/hero/moverImpl.ts` (改, 踩踏触发重写)

**Analog:** 自身（`commonTrigger` + enter/leave/hit/cannotEnter，moverImpl.ts:141-184）

`commonTrigger` 统一「收集 → 执行」流程（moverImpl.ts:141-164）是执行器委托的唯一入口。重写方向：

- `this.collector`（moverImpl.ts:19,23 `state.triggerCollector`）→ `state.eventExecutor`（或直接访问 `state.eventStore`）
- `triggers.trigger(type, handler)` → 委托执行器，`type`（旧 `TriggerType.Enter/Leave/Hit/CannotEnter`）→ `EventTrigger.OnEnter/OnLeave/OnTouch`（映射待用户确认，RESEARCH A4）

**委托样板**（moverImpl.ts:166-184）：
```typescript
async enter(handler: IHeroMoveTopHandler): Promise<void> {
    const { x, y } = handler.nextLoc;
    return this.commonTrigger(TriggerType.Enter, handler, x, y);   // → OnEnter
}
async hit(handler: IHeroMoveTopHandler): Promise<void> {
    const { x, y } = handler.nextLoc;
    return this.commonTrigger(TriggerType.Hit, handler, x, y);     // → OnTouch（待确认）
}
```

---

### 17/18. 删除 `data-system/src/trigger/*` 与 `data-state/src/content/triggers.ts`

纯代码删除（D-13）。`content/triggers.ts` 的 `ChangeFloorTrigger`（楼层切换）语义改由 `OnBeforeChangeFloor`/`OnAfterChangeFloor` 事件承载，其 `getFloorTarget`/`getPosTarget` 逻辑（content/triggers.ts:47-134）可作为新「切换楼层」内建函数（builtin.ts）的实现参照，而非直接丢弃。

---

## Shared Patterns

### 分层与依赖方向（本项目核心架构）
**Source:** `core.ts` 的 L0/L1/L2/L3 分区注释（core.ts:82-103）+ `data-base/types.ts`/`data-system/types.ts`

- **L0 `@user/data-common`**：无依赖的序列化契约与 store（`event/types.ts`、`store/eventStore.ts`）。事件类型只依赖 `anon-tokyo`。
- **L1 `@user/data-base`**：可存档数据（`ITileBase.events`、`IMapBlockSaveBase.events`、`ILayerEventView`），`IDataBaseExtended.state: IStateBase`。
- **L2 `@user/data-system`**：游戏逻辑系统（事件执行器），`IStateSystem extends IStateBase`（含 `IStateSystemExtended.state: IStateSystem`）。
- **L3 `@user/data-state`**：装配（`core.ts`）与顶层集成（`moverImpl`）。

依赖**只向下**：event 执行器（L2）依赖 `IStateBase`（L1），绝不可反向。`check:circular` 是硬门禁。

### 接口先行 + `implements` + `readonly`（code.md 规则 14/15/16，刚性）
**Source:** 全部接口文件（`store/types.ts`、`map/types.ts`、`trigger/types.ts`）
**Apply to:** 所有新建/修改文件

```typescript
// 公共方法必须在 interface 定义，class 用 implements 实现
// 接口成员一律 readonly；对象成员用接口类型不用类类型
export interface IGameEventStore {
    addEvent(id: string, event: IReadonlyGameEvent<...>): void;   // 接口签名
    getEvent<P, E, R>(id: string): IReadonlyGameEvent<P, E, R> | null;
}
// class GameEventStore implements IGameEventStore { ... }
```

### 错误处理：`logger` 数字错误码，绝不抛异常中断（code.md 规则 12/13）
**Source:** `packages/common/src/logger.ts:112-171` + `logger.json`
**Apply to:** 所有文件

```typescript
import { logger } from '@motajs/common';
import { isNil } from 'lodash-es';

// warn（可恢复，继续运行）：logger.warn(code, ...params)
// error（严重，记录但继续）：logger.error(code, ...params)
// 每个错误码唯一，不得用 0 或复用无关 code；params 为字符串

// 非空判断：对象 if (!obj)；字面量 if (isNil(value)) —— 禁止 if (value === undefined)
```

本阶段新增/复用的事件相关错误码（logger.json 已知占用）：`132` registry 重复、`135` 缺 registry、`136` 重复优先级、`170` eventStore 重复 id。执行器「event id 未找到」需分配**新** code。

### Map 工具方法 `getOrInsert` / `getOrInsertComputed`（全局 Map 原型扩展）
**Source:** 用法遍布 `mapLayer.ts:82-83,598`、`combat/context.ts:138,159,405`
**Apply to:** 执行器收集/排序、事件视图内部映射

```typescript
const xMap = this.tilePosMap.getOrInsertComputed(y, () => new Map());
const list = blocks.getOrInsert(index, []);
```

### 桶导出 `index.ts`
**Source:** `data-common/src/index.ts`、`data-system/src/index.ts`
**Apply to:** 所有新模块

每个模块目录有 `index.ts`，`export * from './xxx'`；改动文件导出时同步改 `index.ts`（否则 `check:type` 失败）。

### Hooks（Hookable/HookController）
**Source:** `packages/common/src/hook.ts` + `gameMap.ts`/`mapLayer.ts` 的 `forEachHook`
**Apply to:** 若执行器/内建函数需对外通知（对话/开门动画），沿用 `Hookable<H>` + `createController` 模式（gameMap.ts:213-217）；若不需要，则不用（D-09 长事件直接 await，无需挂起状态）。

### 存读档 `ISaveableContent` + `SaveCompression`
**Source:** `mapLayer.ts:694-810`（saveState/loadState 三分支 No/Low/HighCompression）
**Apply to:** `staticTile`/`dynamicTile`/`mapLayer` 的 events 存档（事件本体不进存档，只存 id Map）

---

## No Analog Found

无。本阶段是「落地已设计接口 + 删除旧体系」的 refactor，所有文件的模式都能在代码库中找到同构参照。唯二的**语义待用户确认**项（非「无 analog」，而是接口未定）如下，planner 应标注为待定而非自行拍板（code.md 规则 3「歧义提问」）：

| 文件 | 待定项 | 依据 |
|------|--------|------|
| `data-system/src/event/builtin.ts` | 内建函数清单/命名（对话/开门/道具/战斗的块名与参数结构） | RESEARCH A2 / Open Question 2 |
| `data-base/src/map/mapLayer.ts` (点事件) | 点事件承载字段（`IMapPointRawData` 尚不存在，`IMapRawData.events` 已有但未落地） | RESEARCH A1 / Open Question 1 |
| `data-state/src/hero/moverImpl.ts` | 移动四钩子 → `EventTrigger` 映射（`cannotEnter` 是否有对应、`OnTouch` 与 `OnEnter` 边界） | RESEARCH A4 / Open Question 3 |

## Metadata

**Analog search scope:** `packages-user/{data-common,data-base,data-system,data-state}`, `packages/common`, `node_modules/anon-tokyo/dist/index.d.ts`
**Files scanned:** ~40（事件/存储/地图/触发器/战斗/核心装配/移动/日志/dirty-tracker/解释器类型）
**Pattern extraction date:** 2026-09-07
