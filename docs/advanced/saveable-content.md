# 可存档内容

存档不是「把内存里的东西倒进文件」，而是游戏状态的一份快照。读档之后，游戏必须从这份快照继续，按同一套规则运行：玩家位置、地图改动、Flag、怪物状态、插件自己的计数，都要回到存档那一刻。只要有一处没回到该有的样子，后面就会逐渐偏掉，而且往往要到很久以后才表现出来。

中级教程里的 [Flag 变量](../intermediate/flags.md) 已经替你存好了一类简单状态。这一篇讲更一般的情况：当你要自己定义一类需要进存档的数据时，怎么声明、怎么注册、怎么保证读档后的结果和存档时一致。

阅读前需要会基础语法：`class`、`new`、`Map`、`import`。如果你还没写过插件，建议先看[数据插件](../intermediate/data-plugins.md)与[插件系统](./plugin-system.md)；可存档内容通常就注册在插件的 `awake` 里。

## 什么该存，什么不该存

判断一个字段该不该进存档，只看一件事：<strong>读档之后，它还能不能从别的地方算回来</strong>。

- 算不回来、又会影响后续结果的，必须存；
- 每次都能从已有数据重新算出来的，不该存；
- 只影响当下表现的临时状态，也不该存。

| 状态                       | 该不该存 | 原因                                    |
| -------------------------- | -------- | --------------------------------------- |
| 勇士位置、属性、道具       | 存       | 影响后续所有结算                        |
| 地图图块改动、点事件       | 存       | 玩家改造过世界，无法从原始地图推回      |
| Flag 变量                  | 存       | 跨事件、跨楼层的持久状态                |
| 敌人当前状态               | 存       | 影响战斗与后续查询                      |
| 静态图块缓存、坐标索引     | 不存     | 由地图数据派生，随时可以重建            |
| 临时动画、提示、界面状态   | 不存     | 读档后重新产生，或根本不影响游戏结果    |
| 战斗上下文、寻路等 L2 系统 | 不存     | 只操作 Layer 1 数据，读档后按需重新建立 |

漏存会让字段回到默认值或只恢复一半；多存会把缓存、派生数据也写进去，读档时旧缓存覆盖新算出的结果，存档体积还会膨胀。所以 `saveState` 的原则是<strong>只交出重建所需的最小信息</strong>，`loadState` 的原则是<strong>先清空旧状态，再按存档重建</strong>。缓存不要存，读档后第一次用到时重新生成即可。

## ISaveableContent

可存档对象要实现 `ISaveableContent<T>`：

```ts
export const enum SaveCompression {
    /** 不进行压缩，仅提取必要数据 */
    NoCompression,
    /** 进行小幅度压缩，以性能为主要考虑目标 */
    LowCompression,
    /** 进行大幅度压缩，以体积为主要考虑目标 */
    HighCompression
}

export interface ISaveableContent<T> {
    saveState(compression: SaveCompression): T;
    loadState(state: T, compression: SaveCompression): void;
}
```

这里的 `T` 是这个对象的<strong>存档形状</strong>，不是对象本身的类型。`saveState` 返回它，`loadState` 接收它。

`loadState` 拿到的是普通数据，不是你的类实例。它要做的是把这份数据装回对象：该清空的清空，该重建的重建，不要假设旧字段还留着。商店管理器就是典型写法：

```ts
import { SaveCompression } from '@user/data-common';
import { IShopManager, IShopManagerSave, IShopState } from './types';
import { ShopState } from './state';

// 管理器节选：只保留 loadState，其余成员用注释省略
export class ShopManager implements IShopManager {
    private readonly shops: Map<string, IShopState> = new Map();

    // ... 其他成员省略

    loadState(state: IShopManagerSave, compression: SaveCompression): void {
        this.shops.clear();
        for (const save of state.list) {
            // 不能把普通对象直接塞进 Map，要重新构造类实例
            const shop: IShopState = new ShopState(save.id, this.state);
            shop.loadState(save, compression);
            this.shops.set(save.id, shop);
        }
    }
}
```

它没有把存档里的普通对象直接塞进 `Map`，而是重新 `new ShopState`，再让每个商店自己恢复内部状态。这样 `Map` 里装的仍然是带方法的类实例，而不是一堆失去原型的普通对象。

## 返回值必须独立

<strong>存档的顶层不会自动做深拷贝。</strong> `CoreState.saveState` 只是把每个对象 `saveState` 的返回值按 id 放进一个 `Map`，不会再 `structuredClone` 一遍。因此 `saveState` 必须自己返回一个<strong>独立的新对象</strong>：不能返回 `this`，也不能让返回值里的字段与活对象共享引用。否则之后对游戏对象的修改会直接改到已保存的数据上，读档时拿到的就是被污染的值。

```ts
import { ISaveableContent } from '@user/data-common';

// 错误：把活对象交给存档系统；顶层不会再复制
export class BadSaveable implements ISaveableContent<BadSaveable> {
    constructor(private readonly count: number) {}

    saveState(): BadSaveable {
        return this;
    }

    loadState(state: BadSaveable): void {
        // 这里只是让示例结构完整；真正的错误在 saveState 的返回值
    }
}
```

返回值还要能被持久化。存档最终写入存储层，而存储层按结构化克隆处理数据，只认识一部分类型：

| 支持                        | 说明               |
| --------------------------- | ------------------ |
| 普通对象、数组              | 逐层复制           |
| 数字、字符串、布尔、`null`  | 原样复制           |
| `Map`、`Set`                | 复制成新的容器     |
| `TypedArray`、`ArrayBuffer` | 复制底层二进制数据 |
| `Date`                      | 复制时间值         |

不支持的包括函数、`Symbol`、DOM 节点、`WeakMap` 与 `WeakSet`。遇到函数这类值，结构化克隆会直接抛错，而不是悄悄跳过。

还有一条更隐蔽的限制：<strong>类实例会丢失原型与方法</strong>。结构化克隆只复制实例自身的可枚举属性，复制结果是一个普通对象。所以 `saveState` 要返回纯数据，`loadState` 里再重新构造类实例。

深拷贝有成本。小型状态直接用 `structuredClone` 最省事；大存档整棵复制会明显变慢，这时可以手工构造一个新对象，只复制重建必需的字段。手工构造时，数组、`Map` 这类容器也要新建一份，不能把原容器直接挂上去。目的不是「一定要调用 `structuredClone`」，而是返回值不能与活对象共享引用。

## 注册可存档对象

实现好之后，用 `state.addSaveableContent(id, content)` 把它交给存档系统：

```ts
import { ICoreState } from '@user/data-state';
import { MySaveable } from './state';

// 在插件或初始化函数里注册；下文插件示例里的对象叫 this.store
export function registerMyStore(state: ICoreState, store: MySaveable): void {
    state.addSaveableContent('@plugin/my-store', store);
}
```

`id` 是这个对象在存档里的唯一标识。整份数据端存档就是一个 `Map<string, unknown>`，键是注册 id，值是该对象的 `saveState` 返回值。注册之后，存档时它会自动被遍历，读档时也会自动收到自己的那份数据。

`id` 必须唯一。重复注册同一个 id 时，后一个会被忽略，控制台打一条警告（错误码 `112`）。这不是「后一个覆盖前一个」，而是第一个注册的继续生效，所以两个系统抢同一个 id 时，第二个实际上没有进存档。

需要按 id 取回对象时，用 `state.getSaveableContent<T>(id)`。它返回 `ISaveableContent<T> | null`，没有这个 id 时返回 `null`。

插件通常在 `awake` 里注册。此时主对象刚创建完，装配插件自己的对象正合适，注册顺序也最早、最可控。`initialize` / `afterLoad` 也能调用 `addSaveableContent`，但会排到已有对象之后，读档顺序也随之后移；只有对象必须等加载内容才能构造时才这样做。内置内容也是同样的注册方式，主插件在 `awake` 里注册了五项：

| 存档 id          | 对应对象             |
| ---------------- | -------------------- |
| `@system/hero`   | `state.hero`         |
| `@system/flags`  | `state.flags`        |
| `@system/maps`   | `state.maps`         |
| `@system/enemy`  | `state.enemyManager` |
| `@system/replay` | `state.replaySystem` |

商店插件则注册 `@plugin/shop`，对应的是 `ShopManager`，不是插件对象本身。插件 id 与存档 id 是两套命名，不要互相推导。

## 三级压缩

`SaveCompression` 有三档：

| 级别              | 含义                             | 典型用途                 |
| ----------------- | -------------------------------- | ------------------------ |
| `NoCompression`   | 不压缩，仅提取必要数据           | 调试、需要完整数据的场景 |
| `LowCompression`  | 小幅度压缩，以性能为主要考虑目标 | 常规存档                 |
| `HighCompression` | 大幅度压缩，以体积为主要考虑目标 | 体积敏感的分发或自动存档 |

三档不是「随便挑一个实现」，而是同一份数据在不同压缩策略下的三种写法。地图图层是现成的例子：

| 级别              | 图层实际存什么                                                       |
| ----------------- | -------------------------------------------------------------------- |
| `NoCompression`   | 直接存完整的地图矩阵                                                 |
| `LowCompression`  | 图层脏且与参考数组不一致时存完整矩阵；否则不存矩阵，读档时用参考数组 |
| `HighCompression` | 图层脏时只存与参考数组不同的行；没有参考数组时退回完整矩阵           |

参考数组来自加载时的原始地图数据。低压缩和高压缩都假设「读档时还能拿到同一份参考」，所以它们只记录差异。这也是压缩能生效的前提：<strong>压缩级别只改变数据怎么存，不能改变游戏结果</strong>。

自定义对象可以三档用同一套实现，例如都返回独立构造的完整数据。这没有问题，但必须满足两个条件：

1. 三档都能被自己的 `loadState` 正确读回，不能只有 `NoCompression` 能读；
2. 任何一档都不能改变语义，读档后的游戏状态必须一致。

真正的差异压缩涉及存档格式与压缩算法，属于 `高级 II · 存档格式演进` 与 `高级 II · 压缩算法细节`。

## 存档顺序与执行器

存档和读档都按<strong>注册顺序</strong>遍历。`saveables` 是一个 `Map`，`addSaveableContent` 的先后就是 `saveState` 与 `loadState` 的先后。`saveState` 依次调用每个对象的 `saveState`，把结果按 id 写进存档；`loadState` 再按同一顺序调用每个对象的 `loadState`。

读档时有两种不一致会被告警：

- 存档里缺少某个已注册 id 的数据：跳过该对象，控制台告警（错误码 `177`），它的执行器也不会运行；
- 存档里多出某个未注册 id 的数据：读档结束后统一告警（错误码 `178`），列出多余的 id。

如果读档后还需要做一步收尾，用 `state.bindSaveableExecuter(content 或 id, executor)` 绑定执行器。执行器实现 `ISaveableExecutor<T>`：

```ts
export interface ISaveableExecutor<T> {
    afterLoad(data: T, state: IStateBase): void;
}
```

绑定时可以传对象本身，也可以传注册 id。传 id 时如果找不到对应对象，会静默返回；传对象时如果它没有注册过，会打一条警告（错误码 `113`）。所以先注册，再绑定。

一个可存档对象只能绑定一个执行器，重复绑定会替换前一个；一个执行器可以绑定多个对象，适合做全局性的读档收尾。

关键在时机：<strong>执行器在该对象的 `loadState` 返回后立即运行</strong>，不是等所有对象都读完之后统一运行。此时它前面的对象已经恢复完毕，后面的对象还没开始。这个顺序直接决定了跨对象引用该怎么解析。

读档开始时，主对象会先清掉残留的录像禁用标记，再逐个恢复对象。每个对象的 `loadState` 都被 `replaySystem.disable()` 与 `revert()` 包裹，读档本身不会被记进录像；但执行器<strong>不在包裹范围内</strong>，因为它可能确实要做需要记录的行为。

### 示例：读档后切换到目标楼层

假设你的读档流程需要在勇士恢复之后，再走一遍完整的楼层切换（触发切换钩子等），可以把这个收尾交给执行器：

```ts
import { IHeroAttr } from '@user/data-common';
import { IHeroStateSave, IStateBase } from '@user/data-base';
import { ICoreState, ISaveableExecutor } from '@user/data-state';

// 示例：读档后让勇士回到存档记录的楼层。
// 实际内部实现并不是这样处理的，这里只示意执行器能做什么。
export class HeroFloorExecutor implements ISaveableExecutor<
    IHeroStateSave<IHeroAttr>
> {
    afterLoad(data: IHeroStateSave<IHeroAttr>, state: IStateBase): void {
        const { floorId, x, y, direction } = data.location;
        const floor = floorId ? state.maps.getMap(floorId) : null;
        if (!floor) return;
        // changeFloor 是异步的；执行器接口本身是同步的，这里只发起，不等待
        void state.hero.changeFloor({ target: floor, x, y, face: direction });
    }
}

// 绑定到勇士的存档 id：通常写在初始化阶段
export function bindHeroFloorExecutor(state: ICoreState): void {
    state.bindSaveableExecuter('@system/hero', new HeroFloorExecutor());
}
```

执行器接口的 `afterLoad` 是同步的，所以它只能「发起」异步操作；需要等待完成的流程要放在你自己的读档调用处。

### afterLoad 的两种含义

`afterLoad` 这个名字在两处出现，含义完全不同：

| 位置                            | 什么时候运行                            | 用来做什么                         |
| ------------------------------- | --------------------------------------- | ---------------------------------- |
| 插件 `afterLoad(state, deps)`   | 初次加载流程末尾，每个插件只运行一次    | 读配置、创建依赖加载内容的初始对象 |
| 执行器 `afterLoad(data, state)` | 每次读档，在该对象 `loadState` 之后立即 | 解析跨对象引用、做读档收尾         |

插件 `afterLoad` 只在<strong>初次加载</strong>后运行。玩家读档时，加载流程不会重跑，插件 `afterLoad` 也不会再执行。所以它不能替代读档执行器：需要「每次读档都做」的事，必须绑执行器。反过来，执行器也不适合做「初次加载」的初始化，它只在读档时运行。

## 跨对象引用

存档里不要直接存另一个对象的引用。返回值必须独立：直接放活对象，存档就会与游戏对象共享同一份引用，之后互相污染；即使存储层复制了它，读档后身份也已经丢了，类实例的方法也会一并丢掉。

正确做法是<strong>存 id 或键，读档时再解析</strong>。常见的键有楼层 `floorId`、商店 id、可存档 id，以及你自己维护的稳定 `uid`。例如一个任务系统要记住「目标商店」：

```ts
// 引用方：存档里只存目标 id，不存 IShopState 对象
export interface IQuestSave {
    readonly targetShopId: string;
}

export class QuestSaveable implements ISaveableContent<IQuestSave> {
    private targetShopId: string | null = null;

    constructor(private readonly state: ICoreState) {}

    /** 在你的任务逻辑里调用，记录目标商店 */
    setTargetShop(id: string): void {
        this.targetShopId = id;
    }

    saveState(): IQuestSave {
        return { targetShopId: this.targetShopId ?? '' };
    }

    loadState(state: IQuestSave): void {
        this.targetShopId = state.targetShopId;
    }
}
```

这两个类放在你自己的插件目录里（例如 `src/data/plugin/my-plugin/state.ts`）。新文件顶部需要：`import { ISaveableContent } from '@user/data-common';`、`import { ICoreState } from '@user/data-state';`；一会儿的执行器还要 `ISaveableExecutor`（同样来自 `@user/data-state`）与 `IStateBase`（来自 `@user/data-base`）。

读档时怎么把它变回对象，有三种策略：

| 策略           | 做法                                                             | 适用场景                           |
| -------------- | ---------------------------------------------------------------- | ---------------------------------- |
| 先注册被引用者 | 保证被引用对象的 `addSaveableContent` 早于引用者                 | 依赖关系固定，启动时就能确定顺序   |
| 执行器延后解析 | 在引用者的执行器里解析；执行器运行时，注册在它之前的对象都已恢复 | 被引用者注册在前，但引用者需要收尾 |
| 惰性解析       | 存档只存 id，第一次真正用到时再按 id 查                          | 被引用者可能后注册、可能不存在     |

执行器只保证「该对象自己的 `loadState` 已完成」，不保证后面的对象已完成。如果你要引用的对象注册在引用者之后，执行器里拿到的可能还是旧状态，这时应该改成惰性解析，或者调整注册顺序，让被引用者先注册。

引用者自己的注册与绑定如下，顺序不能反：

```ts
import { ICoreState } from '@user/data-state';

// 先注册引用者，再绑定执行器
export function registerQuest(state: ICoreState, quest: QuestSaveable): void {
    state.addSaveableContent('@plugin/example-quest', quest);
    state.bindSaveableExecuter(
        '@plugin/example-quest',
        new QuestSaveExecutor()
    );
}
```

执行器里按 `@plugin/shop` 取回商店管理器。`getSaveableContent` 返回的是 `ISaveableContent<T>`，要调用管理器自己的 `getShop`，需要断言成 `IShopManager`：

```ts
// 读档后按 id 解析目标商店
export class QuestSaveExecutor implements ISaveableExecutor<IQuestSave> {
    afterLoad(data: IQuestSave, state: IStateBase): void {
        const manager = state.getSaveableContent<IShopManagerSave>(
            '@plugin/shop'
        ) as IShopManager | null;
        const shop = manager?.getShop(data.targetShopId) ?? null;
        // 找不到时怎么处理，由你决定；不要假设它一定存在
    }
}
```

执行器文件还要从 `../shop` 引入 `IShopManager` / `IShopManagerSave`（路径按你的目录调整）。

## 示例：一个可存档对象

假设你要让一组自定义计数跟着存档走。先写出可存档对象：它实现 `ISaveableContent<T>`，`T` 是存档形状。下面这个类可以放在插件目录里（例如 `src/data/plugin/my-plugin/state.ts`）：

```ts
import { ISaveableContent } from '@user/data-common';

// 存档形状：只放重建必需的数据，字段类型必须能被结构化克隆
export interface IMySave {
    readonly values: Map<string, number>;
}

export class MySaveable implements ISaveableContent<IMySave> {
    // 运行时的真实数据；Map 只是常见选择，换成你真正要保存的结构
    private readonly values: Map<string, number> = new Map();

    // 对外方法按你的需求增删
    setValue(key: string, value: number): void {
        this.values.set(key, value);
    }

    // 验证时会用到；不需要就删掉
    getValue(key: string): number | undefined {
        return this.values.get(key);
    }

    saveState(): IMySave {
        // 返回独立的新对象，不能返回 this，也不能与 this.values 共享引用
        return { values: structuredClone(this.values) };
    }

    loadState(state: IMySave): void {
        // 先清空旧状态，再按存档重建，避免残留上一次的数据
        this.values.clear();
        for (const [key, value] of state.values) {
            this.values.set(key, value);
        }
    }
}
```

落笔时按你的数据结构替换 `values` 与 `IMySave` 的字段：只放重建必需的信息，缓存与派生数据不要放；`loadState` 里该 `new` 的类实例要重新 `new`，不要直接使用存档里的普通对象。

压缩参数可以按需省略：`ISaveableContent` 声明的是 `saveState(compression)` / `loadState(state, compression)`，TypeScript 允许实现时少写参数，调用方仍会按接口传两个实参，多出的那个被忽略；需要区分压缩级别时，再把 `compression: SaveCompression` 加回来。

`saveState` 里不要修改对象状态；`loadState` 不要假设旧数据还在。

## 示例：把可存档对象接到插件里

可存档对象本身不会自动进入存档，还要在插件里持有并注册。下面的代码写在你插件的 `plugin.ts` 里：

```ts
export class MyPlugin implements IDataPluginDefine {
    readonly id = 'my-plugin';
    readonly dataDeps: string[] = [];

    // 持有可存档对象，供插件其他方法使用
    store!: MySaveable;

    awake(state: ICoreState): void {
        this.store = new MySaveable();
        // 存档 id 要唯一，并与插件 id 分开命名
        state.addSaveableContent('@plugin/my-store', this.store);
    }

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
```

`store` 与 `MySaveable` 换成你自己的类；对象构造需要 `state` 时，也在这里传入。注册优先放在 `awake`：对象必须等加载内容才能构造时，也可以放到插件 `afterLoad`，但注册顺序会排在已有对象之后。无论放在哪，只注册一次，并保证早于任何存档 / 读档调用。

## 验证

存档与读档的入口都在主对象上：`state.saveState(compression)` 返回一份 `ReadonlyMap<string, unknown>`，键是注册 id，值是该对象的 `saveState` 结果；`state.loadState(snapshot, compression)` 按同一份映射恢复。下面的代码放进一个能拿到 `state` 的临时函数（或你插件的某个方法里）执行：

```ts
import { SaveCompression } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { MyPlugin } from './plugin/my-plugin';

// 验证：存档 → 改状态 → 读档；MyPlugin / MySaveable 换成你自己的类
export function verifySaveLoad(state: ICoreState): void {
    const plugin = state.getDataPlugin<MyPlugin>('my-plugin')?.plugin;
    if (!plugin) return;

    plugin.store.setValue('count', 1);
    const snapshot = state.saveState(SaveCompression.NoCompression);

    plugin.store.setValue('count', 2);
    state.loadState(snapshot, SaveCompression.NoCompression);
    console.log(plugin.store.getValue('count')); // 应为 1
}
```

读档后应回到存档时的值。如果读到的是修改后的值，说明 `saveState` 返回了与活对象共享的引用，而不是独立副本。

对同一个对象把三档压缩各跑一次，可以确认三种策略读回来的结果一致：

```ts
import { SaveCompression } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { MyPlugin } from './plugin/my-plugin';

// 验证：三档压缩都应恢复出同一个值
export function verifyCompression(state: ICoreState): void {
    const plugin = state.getDataPlugin<MyPlugin>('my-plugin')?.plugin;
    if (!plugin) return;

    for (const compression of [
        SaveCompression.NoCompression,
        SaveCompression.LowCompression,
        SaveCompression.HighCompression
    ]) {
        plugin.store.setValue('count', 1);
        const snapshot = state.saveState(compression);

        plugin.store.setValue('count', 2);
        state.loadState(snapshot, compression);
        console.log(compression, plugin.store.getValue('count')); // 每次都应为 1
    }
}
```

如果只有某一档出错，说明 `saveState` 与 `loadState` 对压缩级别的处理不一致。

启动完成后还可以直接确认注册成功：

```ts
import { ICoreState } from '@user/data-state';

// 启动完成后确认注册成功
export function checkRegistered(state: ICoreState): void {
    const content = state.getSaveableContent('@plugin/my-store');
    console.log(content);
}
```

应拿到你注册的对象，而不是 `null`。为 `null` 时先检查 `addSaveableContent` 的 id 是否拼错、是否真的执行到了 `awake`。

要确认缺键与多键的告警，可以故意删掉存档里的一个键。`saveState` 返回的是 `ReadonlyMap`，要删键先复制成可修改的 `Map`：

```ts
import { SaveCompression } from '@user/data-common';
import { ICoreState } from '@user/data-state';

// 验证：删掉本对象的存档数据再读档，应告警 177
export function verifyMissingKey(state: ICoreState): void {
    const snapshot = state.saveState(SaveCompression.NoCompression);
    const edited = new Map(snapshot);
    edited.delete('@plugin/my-store');
    state.loadState(edited, SaveCompression.NoCompression);
}
```

读档时控制台应出现缺键告警（`177`），并跳过该对象；存档里多出未注册的 id 时，应出现多键告警（`178`）。这两条能帮你区分「没存进去」和「读的时候没对上」。

跨对象引用的检查需要构造一个引用其他对象的场景：读档后确认引用仍指向正确的对象，而不是 `null` 或另一份副本。若拿到的是旧状态，检查被引用对象的注册顺序，或改成执行器延后解析。

## 边界与注意

- <strong>saveState 返回 this 或内部活对象</strong>。顶层不会替你复制，存档映射会直接持有活对象，后续修改会污染已保存的数据。
- <strong>返回带方法的类实例</strong>。持久化时结构化克隆会丢掉原型与方法，读档后调用方法直接报错。
- <strong>把缓存或索引也存进去</strong>。读档时旧缓存覆盖新算出的结果，状态对不上；这类数据应该重建。
- <strong>漏掉某个字段</strong>。读档后该字段回到默认值，表现为「只恢复了一半」。
- <strong>重复注册同一个 id</strong>。后一个被忽略并告警（`112`），你以为生效的对象其实没进存档。
- <strong>执行器里访问尚未恢复的对象</strong>。执行器只保证当前对象已恢复；注册在后面的对象还没读。
- <strong>把插件 afterLoad 当读档钩子</strong>。它只在初次加载后运行一次，玩家读档时不会再触发。
- <strong>在 saveState 里改状态</strong>。存档是只读快照，`saveState` 不应该有副作用。
- <strong>跨对象引用直接存对象</strong>。存档与活对象共享引用，之后互相污染，读档后身份也已经丢失。

## 小结

- 只存重建必需的状态；缓存、派生数据与 L2 系统不进存档。
- `ISaveableContent<T>` 的 `T` 是存档形状；`saveState` 必须返回独立于活对象的数据，顶层不会替你 `structuredClone`。
- 存档数据必须能被结构化克隆；类实例会丢原型与方法，读档时要自己重建。
- 用 `addSaveableContent` 注册，id 唯一；重复 id 后一个被忽略（`112`）。
- 三档压缩只改变存储方式，不改变结果；每一档都必须能被自己的 `loadState` 读回。
- 存档与读档按注册顺序执行；执行器在该对象 `loadState` 后立即运行，且不被录像禁用包裹。
- 插件 `afterLoad` 只在初次加载后运行一次，不能替代读档执行器。
- 跨对象引用存 id 或键，读档时按顺序或延迟解析，不要存活对象引用。

返回[高级 I 导览](./index.md)。
