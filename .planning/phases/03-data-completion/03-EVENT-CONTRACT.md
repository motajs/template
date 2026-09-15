# Phase 3 Event Built-in Contract

本文件记录七个 event built-ins 的稳定契约。范围只包含批准的七个 built-ins；不加入
完整 legacy 事件目录，不保留未决字段，也不把渲染行为放入数据端函数。

> **实现同步：** 内建函数为类式 `BuiltInFunction` 实现，函数名使用短名；触发来源收集
> 由 `GameEventSystem.collectEvent` 统一负责；注册收口为单一 `createEventRegistrations()`。

## Shared contract

- 每个 built-in 是一个类，实现 `BuiltInFunction<P, E>`（来自 `@motajs/anon-tokyo`）：
  以 `name` 声明稳定函数名，以 `func(param, env)` 方法实现行为。
- `env` 的类型固定为 `IBlockEventEnv`，其必填字段包含 `system: IGameEventSystem`；
  `heroFloor` 类型为 `string | undefined`。
- 目标解析顺序为：明确的 `env.layer` → `env.map` 的 `eventLayer` → 通过
  `env.heroFloor` 从 `env.state.maps` 取得的地图及其 `eventLayer`。该解析由
  `event/utils.ts` 的 `getPossibleLayer` 提供（`env.heroFloor` 为 nil 时跳过地图查询）。
- 目标、图块、勇士、事件存储或事件 id 缺失时，函数安全跳过并返回 `void`；不抛业务
  错误，不访问 DOM、render global 或 legacy global。
- 地图删除、移动、勇士移动和临时事件序列都等待完整的 Promise 动作；没有需要等待的
  动作时同步返回 `void`。
- 移动序列统一通过 `IObjectMover.push(steps)`（接受 `readonly ObjectMoveStep[]`）追加，
  再 `start()` 并等待控制器 `onEnd`。
- 共享功能性函数只放在 `event/utils.ts`（`getPossibleMap` / `getPossibleLayer`），
  **不经 `event/index.ts` 导出**；`map.ts` / `hero.ts` / `event.ts` 只包含 built-in 类，
  不包含落单函数；非公共功能性函数作为所属类的私有方法。
- 默认注册项由 `data-state/src/event/registrations.ts` 的唯一函数
  `createEventRegistrations()` 装配；`CoreState` 从该模块导入并传给 `GameEventSystem`。

## Trigger collection

事件来源的收集与触发环境的构造由 `GameEventSystem.collectEvent(layer, trigger, x, y)`
统一负责：按“先点事件、后图块事件”的顺序收集，各自按优先级降序排序；构造的 `env`
使用 `state = this.state`、`system = this`、`heroLocator = state.hero.location`、
`heroFloor = state.hero.location.floorId`、`triggerLocator = { x, y }`。

`DefaultHeroMoveTopImpl.enter / leave / hit` 复用该方法：

- `enter` 使用 `handler.nextLoc`，trigger 为 `OnEnter`；
- `leave` 使用 `handler.currLoc`，trigger 为 `OnLeave`；
- `hit` 使用 `handler.nextLoc`，trigger 为 `OnTouch`。

调用前移动器已将 `state.hero.location` 置为对应位置，因此 `heroLocator` 取自状态而非
handler 参数。`stepHero` 只负责让勇士向前一步；前方的撞击判定与 `OnTouch` 由移动器
的 hit 路径产生。

## Parameter contracts

### `setBlock` — `map.ts` 的 `EventSetBlock`

```ts
interface ISetBlockEventParam {
    readonly x: number;
    readonly y: number;
    readonly tile: number | string;
}
```

在解析出的目标图层设置 `(x, y)` 的静态图块。`tile` 通过 `env.state.tileStore` 解析；
图块 id、地图、图层或坐标目标不可用时安全返回 `void`。

### `moveBlock` — `map.ts` 的 `EventMoveBlock`

```ts
interface IMoveBlockEventParam {
    readonly x: number;
    readonly y: number;
    readonly steps: readonly ObjectMoveStep[];
    readonly keepEvent?: boolean;
    readonly safe?: boolean;
}
```

从 `(x, y)` 将静态图块转为动态图块（`transferToDynamic(x, y, keepEvent)`），`push` 入
`steps` 后完整移动，再转回静态图块。`safe` 为 `true` 时使用 `transferToStaticIfSafe`，
否则使用 `transferToStatic`；`keepEvent` 决定是否在转换时保留图块事件。转换与移动控制器
不可用时安全返回 `void`。

### `removeBlock` — `map.ts` 的 `EventRemoveBlock`

```ts
interface IRemoveBlockEventParam {
    readonly x: number;
    readonly y: number;
    readonly dynamic?: boolean;
}
```

移除目标坐标的静态图块（`layer.removeBlock`）。`dynamic` 为 `true` 时先等待该坐标所有
动态图块的删除 Promise，再移除静态图块；默认只移除静态图块。地图、图层或坐标不可用时
安全返回 `void`。

### `moveHero` — `hero.ts` 的 `EventMoveHero`

```ts
interface IMoveHeroEventParam {
    readonly steps: readonly ObjectMoveStep[];
}
```

把完整 `steps` 队列 `push` 进 `env.state.hero.location.mover` 并启动一次移动。勇士或
移动器缺失、移动已在进行中或动作无法启动时安全返回 `void`；启动成功后等待
`IMoverController.onEnd`。

### `stepHero` — `hero.ts` 的 `EventStepHero`

```ts
interface IStepHeroEventParam {}
```

不读取额外字段，使用勇士当前移动方向执行一次 `forward(1)`。移动器缺失或控制器缺失、
移动已在进行中时安全返回 `void`，启动成功后等待 `onEnd`。

### `insertEvents` — `event.ts` 的 `EventInsertEvents`

```ts
interface IInsertEventsEventParam {
    readonly ids: readonly string[];
}
```

按 `ids` 顺序临时构造事件调用，复用当前 `env`，通过 `env.system.executor` 执行一次；
不把这些事件写入 `IGameEventStore`，也不改变地图持久化数据。有效 id 过滤由该类的私有
方法 `collectInvocations` 完成。空序列或无非空调用时安全跳过；执行 Promise 必须等待。

### `insertEvent` — `event.ts` 的 `EventInsertEvent`

```ts
type IInsertEventEventParam = Statement[];
```

接收一段 `Statement[]` 事件语句，直接使用 `env.system.executor.interpreter` 执行该语句
体。不读取事件存储、不解析事件 id，也不写入事件存储。空语句体时安全返回 `void`，
解释器 Promise 必须等待。

## Registration

`data-state/src/event/registrations.ts` 只导出一个函数
`createEventRegistrations()`，按稳定顺序直接构造七个类的实例并返回
`BuiltInFunction[]`；不做分类包装，不引入工厂或描述符数组。`CoreState` 在创建
`GameEventSystem` 时导入该函数并传入注册项集合。除这七项外，本阶段不注册任何 legacy
built-in。

稳定顺序与所有权：

1. `setBlock` — `map.ts` 的 `EventSetBlock`
2. `moveBlock` — `map.ts` 的 `EventMoveBlock`
3. `removeBlock` — `map.ts` 的 `EventRemoveBlock`
4. `moveHero` — `hero.ts` 的 `EventMoveHero`
5. `stepHero` — `hero.ts` 的 `EventStepHero`
6. `insertEvents` — `event.ts` 的 `EventInsertEvents`
7. `insertEvent` — `event.ts` 的 `EventInsertEvent`

`event/index.ts` 与 `data-state/src/index.ts` 保持 `export`-only，不成为第二装配者；
`event/utils.ts` 不参与导出。事件语义、等待语义、`Statement[]` 直接执行、缺失目标安全
返回、legacy/save 边界与用户自有的 decorator 落点均保持不变。
