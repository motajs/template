# 自定义事件

在地图事件里，你能调用一批内建动作——设置图块、移动勇士、往事件里再插一段……这些都是引擎内置的**事件函数**。当内置的还不够用时，你也能照着同样的方式加一个自己的动作，让事件语句调用到它。

本篇只讲「如何自定义新的事件函数」，不展开事件系统的原理。事件环境里会用到数据端主对象 `state`，它的获取方式与含义见[数据端总览](./data-state-overview.md)。

## 内建函数（BuiltInFunction）

事件里能调用的每一个动作都叫**内建函数**，接口为 `BuiltInFunction`：

```ts
interface BuiltInFunction<P, E> {
    name: string;
    save?: boolean;
    func: (parameters: P, env: E) => any;
}
```

- `name`：事件语句里调用它时使用的名字，需全局唯一；
- `func(param, env)`：执行逻辑。`param` 是调用时传入的参数对象，`env` 是当前事件的环境。

一个内建函数通常写成一个类，`name` 是它的属性，`func` 是它的方法。内置的 `setBlock`、`moveHero` 等就是这样实现的。

## 事件环境 env

`func` 的第二个参数是事件环境 `IBlockEventEnv`，里面放的是「这次事件在什么情况下被触发」。常用的字段：

| 字段 | 说明 |
| --- | --- |
| `state` | 数据端主对象，一切接口的入口 |
| `type` | 事件类型（普通事件 / 点事件 / 图块事件） |
| `trigger` | 本次事件的触发器类型 |
| `heroLocator` | 触发事件时勇士的位置 |
| `heroFloor` | 触发事件时勇士所在楼层 |
| `triggerLocator` | 触发者的位置，可能不存在 |
| `tile` | 触发事件的图块，可能不存在 |
| `layer` | 触发事件的图层，可能不存在 |
| `map` | 触发事件的地图，可能不存在 |
| `system` | 事件系统对象 |

其余字段见 API 参考。多数情况下你只需要 `state`：通过它能访问勇士、地图、Flag 等（见[数据端总览](./data-state-overview.md)）。

从 `env` 取图层时要小心它可能不存在，内置的 `getPossibleLayer(env)` 就是用来兜底的：它依次尝试 `env.layer`、`env.map`、`env.heroFloor` 对应的地图，帮你拿到一个可用的事件图层。

## 参数接口

每个内建函数都有自己的参数接口，定义在 `src/data/event/types.ts`。例如：

```ts
interface ISetBlockEventParam {
    readonly x: number;
    readonly y: number;
    readonly tile: number | string;
}
```

自定义事件的参数接口也建议放在这个文件里，与内置参数放在一起；事件函数**类**本身则放在 `src/data/event/` 目录下的文件里——可以新建文件，也可以放进与该功能相关的现有文件（例如图块相关的放进 `map.ts`）。`registrations.ts` 通过 `import` 把这些类引入后再注册。

## 注册事件

光写内建函数还不够，还要把它注册进事件系统。注册入口是 `src/data/event/registrations.ts` 的 `createEventRegistrations()`，它返回一个 `BuiltInFunction[]`：

```ts
export function createEventRegistrations(): BuiltInFunction[] {
    return [
        // 地图控制
        new EventSetBlock(),
        new EventMoveBlock(),
        new EventRemoveBlock(),

        // 玩家控制
        new EventMoveHero(),
        new EventStepHero(),

        // 事件控制
        new EventInsertEvents(),
        new EventInsertEvent()
    ];
}
```

目前它注册了 7 个内置事件：地图控制 `setBlock` / `moveBlock` / `removeBlock`、玩家控制 `moveHero` / `stepHero`、事件控制 `insertEvents` / `insertEvent`。把你自己写的事件函数 `new` 出来加进这个数组，就完成注册。

## 内置事件导读

内置事件的实现分别放在 `src/data/event/` 下：

- `map.ts`：图块相关。`setBlock` 取到事件图层后把指定坐标设为某个图块，`moveBlock` 把图块按步骤移动，`removeBlock` 删除图块；
- `hero.ts`：勇士相关。`moveHero` 让勇士按给定步骤移动，`stepHero` 让勇士前进一步；
- `event.ts`：事件相关。`insertEvents` 按 id 临时插入多个已有事件，`insertEvent` 临时执行一段事件语句。

想照着写，挑一个内置事件读它的 `func` 即可。

## 示例：设置 Flag

下面这个事件函数把参数里的 Flag 名与值写进 Flag 系统（示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」）：

```ts
import { BuiltInFunction } from '@motajs/anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';

interface ISetFlagEventParam {
    /** Flag 名 */
    readonly field: string;
    /** 要设置的值 */
    readonly value: number | string | boolean;
}

export class EventSetFlag implements BuiltInFunction<
    ISetFlagEventParam,
    IBlockEventEnv
> {
    name: string = 'setFlag';

    func(param: ISetFlagEventParam, env: IBlockEventEnv) {
        env.state.flags.setFieldValue(param.field, param.value);
    }
}
```

写好后加进 `createEventRegistrations()`：

```ts
export function createEventRegistrations(): BuiltInFunction[] {
    return [
        // ... 原有事件
        new EventSetFlag() // [!code ++]
    ];
}
```

Flag 的读写接口见 [Flag 变量](./flags.md)。

## 示例：勇士回血

再写一个让勇士回复生命值的事件函数。它读取参数里的回复量，通过可修改属性接口加到勇士的 `hp` 上：

```ts
import { BuiltInFunction } from '@motajs/anon-tokyo';
import { IBlockEventEnv } from '@user/data-system';

interface IHealHeroEventParam {
    /** 回复的生命值 */
    readonly hp: number;
}

export class EventHealHero implements BuiltInFunction<
    IHealHeroEventParam,
    IBlockEventEnv
> {
    name: string = 'healHero';

    func(param: IHealHeroEventParam, env: IBlockEventEnv) {
        env.state.hero.getModifiableAttribute().add('hp', param.hp);
    }
}
```

勇士属性的读写方式见[勇士属性](./hero-attribute.md)。

## 编辑器识别

编辑器若要为自定义事件生成图形化配置，需要先能识别出这个事件的参数结构。目前这一识别方式尚未最终确定。在它确定之前，按本篇的方式编写普通内建函数即可。
