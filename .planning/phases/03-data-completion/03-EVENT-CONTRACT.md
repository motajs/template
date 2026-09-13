# Phase 3 Event Built-in Contract

本文件记录八个 event built-ins 的稳定契约。范围只包含批准的八个 built-ins；不加入
完整 legacy 事件目录，不保留未决字段，也不把渲染行为放入数据端函数。

> **实现同步（quick 260913-qtq）：** 内建函数改为类式 `BuiltInFunction` 实现，函数名
> 使用短名（`setBlock` 等），注册收口为单一 `createEventRegistrations()`，共享工具
> 迁至 `event/utils.ts`。本节取代下方任何与旧类名 / 旧注册函数 / `EventBuiltinName`
> 相关的历史描述。

## Shared contract

- 每个 built-in 是一个类，实现 `BuiltInFunction<P, E>`（来自 `@motajs/anon-tokyo`）：
  以 `name` 声明稳定函数名，以 `func(param, env)` 方法实现行为。
- `env` 的类型固定为 `IBlockEventEnv`。目标解析顺序为：明确的 `env.layer` →
  `env.map` 的 `eventLayer` → 通过 `env.heroFloor` 从 `env.state.maps` 取得的地图及其
  `eventLayer`（由 `event/utils.ts` 的 `getPossibleLayer` 提供）。
- 目标、图块、勇士、事件存储或事件 id 缺失时，函数安全跳过并返回 `void`；不抛业务
  错误，不访问 DOM、render global 或 legacy global。
- 地图删除、移动、勇士移动和临时事件序列都等待完整的 Promise 动作；没有需要等待的
  动作时同步返回 `void`。
- 移动序列统一通过 `IObjectMover.push(steps)` 追加，再 `start()` 并等待控制器
  `onEnd`；不逐条调用移动方法。
- 共享功能性函数放在 `event/utils.ts`，**不经 `event/index.ts` 导出**；非公共的
  功能性函数作为所属类的私有方法。
- `map.ts` / `hero.ts` / `event.ts` 只包含 built-in 类，不包含落单函数。
- 默认注册项由 `data-state/src/event/registrations.ts` 的唯一函数
  `createEventRegistrations()` 装配；`CoreState` 从该模块导入并传给 `GameEventSystem`。

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
    readonly safe?: boolean;
}
```

从 `(x, y)` 将静态图块转为动态图块，`push` 入 `steps` 后完整移动，再转回静态图块。
`safe` 为 `true` 时使用 `transferToStaticIfSafe`，否则使用 `transferToStatic`。源图块、
动态图块、移动控制器或目标静态图块不可用时安全返回 `void`。

### `deleteBlock` — `map.ts` 的 `EventDeleteBlock`

```ts
interface IDeleteBlockEventParam {
    readonly x: number;
    readonly y: number;
}
```

删除目标坐标的静态图块，并等待该坐标所有动态图块的删除 Promise。地图、图层或坐标
不可用时安全返回 `void`。

### `moveHero` — `hero.ts` 的 `EventMoveHero`

```ts
interface IMoveHeroEventParam {
    readonly steps: readonly ObjectMoveStep[];
}
```

把完整 `steps` 队列 `push` 进 `env.state.hero.location.mover` 并启动一次移动。勇士或
移动器缺失、移动已在进行中或动作无法启动时安全返回 `void`；启动成功后等待
`IMoverController.onEnd`。

### `moveHeroStep` — `hero.ts` 的 `EventMoveHeroStep`

```ts
interface IMoveHeroStepEventParam {}
```

不读取额外字段，使用勇士当前移动方向执行一次 `forward(1)`。移动器或控制器缺失、
移动已在进行中时安全返回 `void`，启动成功后等待 `onEnd`。

### `touchFront` — `hero.ts` 的 `EventTouchFront`

```ts
interface ITouchFrontEventParam {}
```

不读取额外字段。以勇士当前位置和当前朝向计算面前一格，收集该坐标的点事件、静态图块
事件和动态图块事件，以 `EventTrigger.OnTouch` 通过现有事件执行器顺序触发。来源收集由
该类的私有方法 `collectInvocations` 完成。缺少地图、图层、目标位置或事件执行器时安全
返回 `void`；该函数只触发 `onTouch`，不移动勇士。

### `insertEvents` — `event.ts` 的 `EventInsertEvents`

```ts
interface IInsertEventsEventParam {
    readonly ids: readonly string[];
}
```

按 `ids` 顺序临时构造事件调用，复用当前 `env`，通过当前事件执行器执行一次；不把这些
事件写入 `IGameEventStore`，也不改变地图持久化数据。有效 id 过滤由该类的私有方法
`collectInvocations` 完成。空序列、缺失事件存储、缺失事件 id 或缺失执行器时安全跳过；
执行 Promise 必须等待。

### `insertEvent` — `event.ts` 的 `EventInsertEvent`

```ts
type IInsertEventEventParam = Statement[];
```

接收一段 `Statement[]` 事件语句，直接使用现有 AnonTokyo 解释器执行该语句体。不读取
事件存储、不解析事件 id，也不写入事件存储。空语句体、缺失执行器或达到嵌套插入深度
上限时安全返回 `void`，解释器 Promise 必须等待。

## Registration

`data-state/src/event/registrations.ts` 只导出一个函数
`createEventRegistrations()`，按稳定顺序直接构造八个类的实例并返回
`BuiltInFunction[]`；不做分类包装，不引入工厂或描述符数组。`CoreState` 在创建
`GameEventSystem` 时导入该函数并传入注册项集合。除这八项外，本阶段不注册任何 legacy
built-in。

稳定顺序与所有权：

1. `setBlock` — `map.ts` 的 `EventSetBlock`
2. `moveBlock` — `map.ts` 的 `EventMoveBlock`
3. `deleteBlock` — `map.ts` 的 `EventDeleteBlock`
4. `moveHero` — `hero.ts` 的 `EventMoveHero`
5. `moveHeroStep` — `hero.ts` 的 `EventMoveHeroStep`
6. `touchFront` — `hero.ts` 的 `EventTouchFront`
7. `insertEvents` — `event.ts` 的 `EventInsertEvents`
8. `insertEvent` — `event.ts` 的 `EventInsertEvent`

`touchFront` 及其来源收集属于 hero 事件层；`event.ts` 只保留 `insertEvents` 与直接执行
`Statement[]` 的 `insertEvent`。`event/index.ts` 与 `data-state/src/index.ts` 保持
`export`-only，不成为第二装配者；`event/utils.ts` 不参与导出。事件语义、等待语义、
`Statement[]` 直接执行、缺失目标安全返回、legacy/save 边界与用户自有的 decorator
落点均保持不变。
