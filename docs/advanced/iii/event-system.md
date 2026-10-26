# 事件系统

事件把「一段脚本」和「什么时候跑」接在一起。数据端把它拆成五个角色：事件仓库按 id 保存事件对象，事件对象持有触发器与语句，收集器按坐标算出这次该执行谁，执行器逐条过滤并执行，解释器负责把语句跑起来。

本篇讲前四个角色，以及怎么新增一个内建函数；脚本如何编译成可执行程序、执行上下文如何迭代，属于[Anon-Tokyo 解释器](./anon-tokyo.md)一篇。序列化事件注册与地图事件 id 绑定属于内容配置，由编辑器负责，本篇不展开。

## 系统模型

| 角色                   | 职责                                                      |
| ---------------------- | --------------------------------------------------------- |
| `GameEventStore`       | 按 id 保存事件对象，`getEvent(id)` 取回实例               |
| `GameEvent`            | 持有触发器、原始语句与缓存的编译产物                      |
| `GameEventSystem`      | 持有事件仓库、解释器与执行器，`collectEvent` 产出调用列表 |
| `EventExecutor`        | 逐条查询仓库、过滤触发器、执行并合并返回值                |
| `AnonTokyoInterpreter` | 把语句编译成可执行程序，或直接执行语句                    |

一次派发的数据流如下。收集器只看坐标与图层，执行器只看调用列表，事件对象负责把语句变成可执行程序。三者分开后，换仓库或换解释器都不必改收集逻辑。

```text
事件仓库 GameEventStore（id → 事件对象）
        │
        ▼
收集器 GameEventSystem.collectEvent(layer, trigger, x, y)
        │  产出 IGameEventInvocation[]
        ▼
执行器 EventExecutor.execute(invocations, param)
        │  逐条查仓库、比较 trigger、调用 event.execute
        ▼
事件对象 GameEvent ──缓存的编译产物──> AnonTokyoInterpreter
```

数据端目前只在勇士移动的进入、离开、触碰三个时机走这条链路；其余触发器的状态见下一节。

## 事件与触发器

`EventTrigger` 是触发器枚举，完整取值如下：

| 值                    | 含义                                   | 数据端当前派发 |
| --------------------- | -------------------------------------- | -------------- |
| `None`                | 无触发器，事件需要手动执行             | 未派发         |
| `OnTouch`             | 碰到图块时触发，能直接走进去的不算触碰 | 勇士移动       |
| `OnEnter`             | 进入图块时触发                         | 勇士移动       |
| `OnLeave`             | 离开图块时触发                         | 勇士移动       |
| `OnBeforeBattle`      | 与怪物战斗前触发，返回值决定是否战斗   | 未派发         |
| `OnAfterBattle`       | 与怪物战斗后触发                       | 未派发         |
| `OnBeforeOpenDoor`    | 开门前触发，返回值决定是否能够成功开门 | 未派发         |
| `OnAfterOpenDoor`     | 开门后触发                             | 未派发         |
| `OnAfterGetItem`      | 成功拾取道具时触发                     | 未派发         |
| `OnBeforeChangeFloor` | 楼层切换前触发，返回值决定是否执行切换 | 未派发         |
| `OnAfterChangeFloor`  | 楼层切换后触发                         | 未派发         |

当前数据端内置派发只覆盖进入、离开、触碰三个时机，其余值是枚举的一部分，由对应系统使用或预留。写脚本时不要假设挂上某个触发器就一定会被执行；新增触发器取值并补上派发点属于引擎级改动，不属于内容扩展。

事件对象由 `GameEvent` 实现。它保存 `trigger`、`rawEvent` 与 `compiled`：`compile()` 编译并缓存结果，`execute(param, env)` 优先使用缓存，`setRaw(raw)` 在替换原始语句时清空缓存，`setTrigger(trigger)` 修改触发器。只读侧 `IReadonlyGameEvent` 暴露 `interpreter`、`trigger`、`rawEvent`、`compiled` 与 `compile()`、`execute()`。

## 收集：这一次该执行谁

`collectEvent(layer, trigger, x, y)` 先判断 `layer.inMap(x, y)`；坐标不在地图内直接返回空数组。

点事件按坐标读取：`layer.getPointEvent(x, y)` 返回「优先级 → 事件 id」的只读映射。图块事件按实例读取：当前格的静态图块（若存在）与每个动态图块各有一份 `tileEvent()` 映射。

两组分别按优先级降序排序，然后拼接：点事件整组在前，图块事件整组在后。也就是说，优先级只在组内比较；一个低优先级的点事件仍然排在高优先级的图块事件之前。

`collectEvent` 不按事件自身的触发器过滤。它把该坐标上的候选事件都放进列表，并把本次触发时机写进每个调用项的环境；真正的触发器过滤发生在执行器。

每个调用项形如 `{ id, env }`，`env` 是这次调用的完整环境：

| 字段             | 含义                                 |
| ---------------- | ------------------------------------ |
| `state`          | 数据端主对象                         |
| `type`           | 事件类型：普通事件、点事件或图块事件 |
| `trigger`        | 本次触发时机                         |
| `system`         | 事件系统对象                         |
| `heroLocator`    | 触发时勇士的位置                     |
| `heroFloor`      | 触发时勇士所在楼层                   |
| `triggerLocator` | 触发坐标                             |
| `tile`           | 触发事件的图块，点事件为空           |
| `layer`          | 触发事件的图层，可能为空             |
| `map`            | 触发事件的地图，可能为空             |

下面的函数先打印某格的来源与优先级，再按本次触发时机取调用列表，按执行顺序打印：

```ts
import { EventTrigger } from '@user/data-common';
import { IMapLayer } from '@user/data-base';
import { BlockEventType, IGameEventSystem } from '@user/data-system';

/**
 * 打印某格的事件来源、优先级与执行顺序。
 * 只看事件层；坐标不在地图内时 collectEvent 会返回空数组。
 */
function printEvents(
    system: IGameEventSystem,
    layer: IMapLayer,
    x: number,
    y: number
): void {
    // 点事件：优先级 → 事件 id
    const point = layer.getPointEvent(x, y);
    if (point) {
        for (const [priority, id] of point) {
            console.log('点事件', priority, id);
        }
    }

    // 图块事件：静态图块与每个动态图块各有一份
    const loc = layer.getLocationData(x, y);
    if (loc?.static) {
        for (const [priority, id] of loc.static.tileEvent().get()) {
            console.log('静态图块事件', priority, id);
        }
    }
    for (const tile of loc?.dynamics ?? []) {
        for (const [priority, id] of tile.tileEvent().get()) {
            console.log('动态图块事件', priority, id);
        }
    }

    // 本次触发时机写进 env.trigger；事件自身的触发器由执行器过滤
    const invocations = system.collectEvent(layer, EventTrigger.OnEnter, x, y);
    invocations.forEach((invocation, index) => {
        const { env } = invocation;
        const source =
            env.type === BlockEventType.PointEvent ? '点事件' : '图块事件';
        console.log(index, env.trigger, source, invocation.id);
    });
}
```

调用项本身只有 `id` 与 `env`，不带优先级；优先级体现在列表顺序里。想同时看到优先级，就像上面这样直接读事件视图。

## 执行与折叠

`EventExecutor.execute(invocations, param)` 按列表顺序逐条处理：

1. 仓库为空或 `getEvent(id)` 找不到事件：告警 171 并跳过。
2. 事件自身的 `trigger` 与 `invocation.env.trigger` 不一致：静默跳过。
3. 否则 `await event.execute(param, env)`，把结果加入结果列表。

执行模式决定是否提前结束：`Normal` 全部执行；`CutIfFalsy` 遇到 falsy 结果立即结束；`CutIfTruthy` 遇到 truthy 结果立即结束。折叠模式决定返回值：`NoReduce` 返回结果数组；`OrReduce` 从 `false` 起做或运算；`AndReduce` 从 `true` 起做与运算。`OrReduce` 与 `AndReduce` 遇到非布尔值会告警 172，然后按 JavaScript 的短路规则继续。

模式和折叠方式都是执行器上的状态，用 `setMode` 与 `setReduce` 修改；它们会被后续执行共享，改完记得按需复位。

`execute` 带录像标记，回放时会重放这次执行，不需要额外登记。

```ts
import {
    EventReduceMode,
    IGameEventExecutor,
    IGameEventInvocation
} from '@user/data-system';

/**
 * 用「或」折叠执行一组事件，返回合并后的布尔结果。
 * 调用方负责保证事件 id 已经在事件仓库中注册。
 */
async function executeOr(
    executor: IGameEventExecutor,
    invocations: IGameEventInvocation[]
): Promise<boolean> {
    // 折叠模式是执行器状态；需要时再改回 NoReduce
    executor.setReduce(EventReduceMode.OrReduce);
    // param 会原样传给每个事件；没有额外参数时给空对象
    return executor.execute<boolean>(invocations, { custom: {} });
}
```

## 事件层

事件层不是特殊类型，而是 `alias` 为 `event` 的普通图层。它具备图层的全部能力：图块、点事件视图、图块事件视图、存档与钩子都可以照常使用。

`IGameMap.eventLayer` 指向当前楼层的默认事件层，类型是 `IMapLayer | null`。地图构造时，图层加载流程会把 `alias` 为 `event` 的图层登记为事件层；切换楼层后，使用的是目标楼层自己的 `eventLayer`。

勇士移动时，移动实现取当前地图的 `eventLayer` 调用 `collectEvent`；没有事件层时直接返回。点事件与图块事件各自的归属与读写接口见[点事件与图块事件](../ii/point-and-tile-events.md)。

## 自定义一个内建函数

事件脚本里能调用的每个动作都是内建函数。新增一个动作分三步：写类、声明参数接口、加入注册列表。

内建函数类实现 `BuiltInFunction<P, IBlockEventEnv>`：`name` 是脚本里调用的名字，`func(param, env)` 是执行逻辑。下面两个完整的类分别演示写状态与改勇士属性：

```ts
import { BuiltInFunction } from '@motajs/anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';
import { IHealHeroEventParam, ISetFlagEventParam } from './types';

// 把指定的 Flag 字段设为指定值
export class EventSetFlag implements BuiltInFunction<
    ISetFlagEventParam,
    IBlockEventEnv
> {
    name: string = 'setFlag';

    func(param: ISetFlagEventParam, env: IBlockEventEnv): void {
        // env.state 是数据端主对象，Flag 系统挂在它上面
        env.state.flags.setFieldValue(param.field, param.value);
    }
}

// 按给定数值回复勇士生命值
export class EventHealHero implements BuiltInFunction<
    IHealHeroEventParam,
    IBlockEventEnv
> {
    name: string = 'healHero';

    func(param: IHealHeroEventParam, env: IBlockEventEnv): void {
        // 走可修改属性接口，不要直接改 hero.attribute
        env.state.hero.getModifiableAttribute().add('hp', param.hp);
    }
}
```

参数接口单独声明，通常与其它事件参数一起放在 `src/data/event/types.ts`：

```ts
/** 事件：设置 Flag */
export interface ISetFlagEventParam {
    /** Flag 名 */
    readonly field: string;
    /** 要设置的值 */
    readonly value: number | string | boolean;
}

/** 事件：勇士回血 */
export interface IHealHeroEventParam {
    /** 回复的生命值 */
    readonly hp: number;
}
```

最后把实例加入 `createEventRegistrations()` 返回的数组。这个数组由 `src/data/entry.ts` 放进 `ICoreStateConfig.events`，随配置进入 `CoreState`；`GameEventSystem` 构造解释器时把它作为 `builtInFunctions` 传进去。注册一次后，脚本就能按 `name` 调用。

```ts
import { BuiltInFunction } from '@motajs/anon-tokyo';
import { EventHealHero, EventSetFlag } from './custom';

/**
 * 创建全部内建事件的注册项。
 * 新增的内建函数加进这个数组即可。
 */
export function createEventRegistrations(): BuiltInFunction[] {
    return [
        // ...已有的内建函数
        new EventSetFlag(),
        new EventHealHero()
    ];
}
```

`func` 的第二个参数是本次调用的环境。`env.state` 是入口，Flag、勇士、地图、事件仓库与录像系统都从它取；`env.layer` 与 `env.map` 是触发事件的图层与地图，`env.trigger` 是本次触发时机，`env.tile` 是触发事件的图块（点事件为空），`env.triggerLocator` 是触发坐标，`env.heroLocator` 与 `env.heroFloor` 是勇士的位置与所在楼层。

需要默认图层时用 `getPossibleLayer(env)`：它先取 `env.layer`，再取 `env.map.eventLayer`，最后按 `env.heroFloor` 找地图的事件层。相同思路的 `getPossibleMap(env)` 用于取地图。

分步的内建函数写法与更多示例见[自定义事件](../../intermediate/events.md)；事件仓库本身的用法见 [data-common 的 Store](../i/data-stores.md)。

## 边界与注意

- **坐标越界返回空列表**：`collectEvent` 不告警，只返回空数组。
- **点事件与图块事件互不替代**：同一格可以同时有两者，也可以只有其中一种。
- **同一优先级只能挂一个事件**：重复设置会覆盖并告警 136。
- **事件 id 必须已注册**：调用列表里的 id 在仓库里找不到时，执行器告警 171 并跳过。
- **触发器不匹配会被静默跳过**：事件自身的 `trigger` 与本次时机不一致，不会告警。
- **短路模式下后面的条目不再执行**：`CutIfFalsy` 与 `CutIfTruthy` 命中后立即结束。
- **折叠模式遇到非布尔值只告警**：`OrReduce` 与 `AndReduce` 会告警 172，但不会中断执行。
- **多条事件是异步顺序执行**：不要假设它们并发，也不要依赖未声明的执行顺序。
- **执行器状态是共享的**：`mode` 与 `reduce` 会影响后续执行，改完记得复位。
- **事件注册属于内容配置**：序列化事件注册与地图事件 id 绑定由编辑器负责，本篇不展开。
