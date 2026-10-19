# 自定义事件

在地图事件里，你能调用一批内建动作——设置图块、移动勇士、往事件里再插一段……这些都是引擎内置的**事件函数**。内置事件集已经相当完整（覆盖地图、玩家、事件、流程控制等常用动作）；当你需要其中没有的额外动作时，也能照着同样的方式加一个自己的事件函数，让事件语句调用到它。

本篇只讲「如何自定义新的事件函数」，不展开事件系统的原理。事件环境里会用到数据端主对象 `state`，它的获取方式与含义见[数据端总览](./data-state-overview.md)。

## 内建函数（BuiltInFunction）

事件里能调用的每一个动作都叫**内建函数**，接口为 `BuiltInFunction`（来自 `@motajs/anon-tokyo`——引擎里负责把事件脚本解释执行的包，其归属层级见 [src 导览](./src-tour.md) 的「包从哪来」）：

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

| 字段             | 说明                                     |
| ---------------- | ---------------------------------------- |
| `state`          | 数据端主对象，一切接口的入口             |
| `type`           | 事件类型（普通事件 / 点事件 / 图块事件） |
| `trigger`        | 本次事件的触发器类型                     |
| `heroLocator`    | 触发事件时勇士的位置                     |
| `heroFloor`      | 触发事件时勇士所在楼层                   |
| `triggerLocator` | 触发者的位置，可能不存在                 |
| `tile`           | 触发事件的图块，可能不存在               |
| `layer`          | 触发事件的图层，可能不存在               |
| `map`            | 触发事件的地图，可能不存在               |
| `system`         | 事件系统对象                             |

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

光写内建函数还不够，还要把它注册进事件系统。注册入口是 `src/data/event/registrations.ts` 的 `createEventRegistrations()`，它返回一个 `BuiltInFunction[]`。下面是它的**节选**（这里只列几个作示例）：

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

        // ...其余内置事件
    ];
}
```

这些内置事件覆盖了地图控制（`setBlock` / `moveBlock` / `removeBlock` 等）、玩家控制（`moveHero` / `stepHero` 等）、事件控制（`insertEvents` / `insertEvent` 等）以及更多常用动作。要**新增一个事件**，只需两步：按上一节写好事件函数类，再把它 `new` 出来加进这个数组。

## 内置事件导读

内置事件的实现按用途分散在 `src/data/event/` 下的若干文件里，例如：

- `map.ts`：图块相关。`setBlock` 取到事件图层后把指定坐标设为某个图块，`moveBlock` 把图块按步骤移动，`removeBlock` 删除图块；
- `hero.ts`：勇士相关。`moveHero` 让勇士按给定步骤移动，`stepHero` 让勇士前进一步；
- `event.ts`：事件相关。`insertEvents` 按 id 临时插入多个已有事件，`insertEvent` 临时执行一段事件语句。

想照着写新事件，挑一个功能相近的内置事件读它的 `func` 即可。

## 示例：设置 Flag

**目标**：让事件语句能调用一个 `setFlag` 动作，把指定的 Flag 字段设为指定值。

**改哪里**：事件函数**类**放进 `src/data/event/` 下的文件（可新建，也可并入与该功能相关的现有文件，例如图块相关的放进 `map.ts`）；下面的参数接口 `ISetFlagEventParam` 放进 `src/data/event/types.ts`；再注册进 `src/data/event/registrations.ts` 的 `createEventRegistrations()`。

**复制什么**：

```ts
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

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

再把新类加进注册数组：

```ts
export function createEventRegistrations(): BuiltInFunction[] {
    return [
        // ... 原有事件
        new EventSetFlag() // [!code ++]
    ];
}
```

**改什么**：把 `'setFlag'` 换成你的事件名（需全局唯一）；把 `setFieldValue(...)` 那一行换成你要执行的动作。

**怎么验证**：在事件语句里写一句 `setFlag(...)` 调用它，运行后读对应 Flag，应能看到写入的值（Flag 的读写见 [Flag 变量](./flags.md)）。

**注意**：`BuiltInFunction` 来自 `@motajs/anon-tokyo`、`IBlockEventEnv` 来自 `@user/data-system`（包名含义见 [src 导览](./src-tour.md) 的「包从哪来」），顶部缺哪个再补哪个；参数接口建议放进 `src/data/event/types.ts`，与内置参数放在一起。

## 示例：勇士回血

**目标**：让事件语句能调用一个 `healHero` 动作，按给定数值回复勇士生命值。

**改哪里**：事件函数类放进 `src/data/event/` 下；参数接口 `IHealHeroEventParam` 放进 `src/data/event/types.ts`；再注册进 `createEventRegistrations()`（方式同上例）。

**复制什么**：

```ts
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

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：把 `'healHero'` 换成你的事件名；把 `add('hp', param.hp)` 换成你要调整的属性与数值。

**怎么验证**：在事件里调用 `healHero(...)`，勇士生命值应增加对应数值（勇士属性的读写见 [勇士属性](./hero-attribute.md)）。

**注意**：回复生命走可修改属性接口的 `add('hp', ...)`，不要直接改 `state.hero.attribute`；事件名需全局唯一，与内置事件重名会冲突。

## 编辑器识别

编辑器若要为自定义事件生成图形化配置，需要先能识别出这个事件的参数结构。目前这一识别方式尚未最终确定。在它确定之前，按本篇的方式编写普通内建函数即可。
