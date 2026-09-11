# Phase 3 Event Built-in Contract

本文件记录 `confirm-record` checkpoint 的确认结果。范围只包含本阶段批准的八个
event built-ins；不加入完整 legacy 事件目录，不保留未决字段，也不把渲染行为放入
数据端函数。

## User structural supersession

本节晚于初始 checkpoint，优先于下方旧参数记录：

- `data-state/src/event/index.ts` 只负责稳定注册项和 barrel exports，不承载参数解析、环境形状检查或其他业务逻辑。
- built-in 调用不在热路径重复执行运行时参数类型判断；具体函数直接消费已确定的参数契约。
- `eventInsertEvents` 保留现有事件 ID 序列语义；`eventInsertEvent` 改为接收 `Statement[]` 并直接通过现有解释器执行，不读取 event store，也不接受事件 ID。
- 事件函数仍可按既有事件执行器契约等待事件链；本节只修正 `eventInsertEvent` 的输入和 `index.ts` 的职责，不把 replay command 的同步约束扩展到普通事件执行器。

## Shared contract

- 每个函数都使用 `(param, env)` 调用形式。
- `env` 的类型固定为 `IBlockEventEnv`。目标解析顺序为：明确的
  `env.layer`，`env.map` 的 `eventLayer`，最后是通过 `env.heroFloor` 从
  `env.state.maps` 获取的地图及其 `eventLayer`。
- 目标、图块、勇士、事件存储或事件 id 缺失时，函数安全跳过并返回 `void`；不抛出
  业务错误，不访问 DOM、render global 或 legacy global。
- 地图删除、移动、勇士移动和临时事件序列都等待完整的 Promise 动作；没有需要等待
  的动作时同步返回 `void`。
- 默认注册项由 `data-state/src/event` 提供，`CoreState` 只负责把注册项传给
  `GameEventSystem`；`GameEventSystem` 通过现有 `AnonTokyoInterpreter` 的
  `builtInFunctions` 初始化项装配。函数实现不复制到 `CoreState`。
- 注册项只包含下表八个稳定名称。

## Parameter contracts

### `eventSetBlock`

```ts
interface ISetBlockEventParam {
    readonly x: number;
    readonly y: number;
    readonly tile: number | string;
}
```

在解析出的目标图层设置 `(x, y)` 的静态图块。`tile` 通过 `env.state.tileStore`
解析；图块 id、地图、图层或坐标目标不可用时安全返回 `void`。

### `eventMoveBlock`

```ts
interface IMoveBlockEventParam {
    readonly x: number;
    readonly y: number;
    readonly steps: readonly ObjectMoveStep[];
    readonly safe?: boolean;
}
```

从 `(x, y)` 将静态图块转为动态图块，按 `steps` 完整移动，再转回静态图块。
`safe` 为 `true` 时使用 `transferToStaticIfSafe`，否则使用
`transferToStatic`。源图块、动态图块、移动控制器或目标静态图块不可用时安全返回
`void`；移动控制器的 `onEnd` 和最终转换都必须等待。

### `eventDeleteBlock`

```ts
interface IDeleteBlockEventParam {
    readonly x: number;
    readonly y: number;
}
```

删除目标坐标的静态图块，并等待该坐标所有动态图块的删除 Promise。地图、图层或
坐标不可用时安全返回 `void`。

### `eventMoveHero`

```ts
interface IMoveHeroEventParam {
    readonly steps: readonly ObjectMoveStep[];
}
```

把完整 `steps` 队列加入 `env.state.hero.location.mover` 并启动一次移动。勇士或
移动器缺失、移动已在进行中或动作无法启动时安全返回 `void`；启动成功后等待
`IMoverController.onEnd`。

### `eventMoveHeroStep`

```ts
interface IMoveHeroStepEventParam {}
```

不读取额外字段，使用勇士当前移动方向执行一次 `forward(1)`。勇士、移动器或控制器
缺失时安全返回 `void`，启动成功后等待 `onEnd`。

### `eventTouchFront`

```ts
interface ITouchFrontEventParam {}
```

不读取额外字段。以勇士当前位置和当前朝向计算面前一格，收集该坐标的点事件、静态
图块事件和动态图块事件，以 `EventTrigger.OnTouch` 通过现有事件执行器顺序触发。
缺少勇士、地图、图层、目标位置或事件执行器时安全返回 `void`；事件执行 Promise
必须等待。该函数只触发 `onTouch`，不移动勇士。

### `eventInsertEvents`

```ts
interface IInsertEventsEventParam {
    readonly ids: readonly string[];
}
```

按 `ids` 顺序临时构造事件调用，复用当前 `env`，通过当前事件执行器执行一次；不把
这些事件写入 `IGameEventStore`，也不改变地图持久化数据。空序列、缺失事件存储、缺失
事件 id 或缺失执行器时安全跳过；执行 Promise 必须等待。

### `eventInsertEvent`

```ts
type IInsertEventEventParam = Statement[];
```

接收一段 `Statement[]` 事件语句，直接使用现有 AnonTokyo 解释器执行该语句体，
参数为 `{ custom: {} }`，环境为当前 `env`。不读取事件存储、不解析事件 id，
也不写入事件存储。空语句体、缺失执行器或达到嵌套插入深度上限时安全返回 `void`，
解释器 Promise 必须等待。

## Registration

`data-state/src/event/index.ts` 提供稳定名称对应的默认注册项，顺序为：

1. `eventSetBlock`
2. `eventMoveBlock`
3. `eventDeleteBlock`
4. `eventMoveHero`
5. `eventMoveHeroStep`
6. `eventTouchFront`
7. `eventInsertEvents`
8. `eventInsertEvent`

`CoreState` 在创建 `GameEventSystem` 时传入该注册项集合；`GameEventSystem` 将其
转换为 AnonTokyo 的 built-in function entries。除这八项外，本阶段不注册任何
legacy built-in。
