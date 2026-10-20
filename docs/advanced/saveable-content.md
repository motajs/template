# 可存档内容

存档不是「把内存里的东西倒进文件」，而是游戏状态的一份快照。读档之后，游戏必须从这份快照继续，按同一套规则运行：玩家位置、地图改动、Flag、怪物状态、插件自己的计数，都要回到存档那一刻。只要有一处没回到该有的样子，后面就会逐渐偏掉，而且往往要到很久以后才表现出来。

中级教程里的 [Flag 变量](../intermediate/flags.md) 已经替你存好了一类简单状态。这一篇讲更一般的情况：当你要自己定义一类需要进存档的数据时，怎么声明、怎么注册、怎么保证读档后的结果和存档时一致。

阅读前需要会基础语法：`class`、`new`、`Map`、`import`。如果你还没写过插件，建议先看[数据插件](../intermediate/data-plugins.md)与[插件系统](./plugin-system.md)；可存档内容通常就注册在插件的 `awake` 里。

## 存档一致性：什么该存，什么不该存

判断一个字段该不该进存档，只看一件事：<strong>读档之后，它还能不能从别的地方算回来</strong>。

- 算不回来、又会影响后续结果的，必须存；
- 每次都能从已有数据重新算出来的，不该存；
- 只影响当下表现的临时状态，也不该存。

| 状态                       | 该不该存 | 原因                                    |
| -------------------------- | -------- | --------------------------------------- |
| 勇士位置、属性、道具       | 存       | 影响后续所有结算                        |
| 地图图块改动、点事件       | 存       | 玩家改造过世界，无法从原始地图推回      |
| Flag 变量                  | 存       | 跨事件、跨楼层的持久状态                |
| 敌人当前状态               | 存       | 影响战斗、地图伤害与后续查询            |
| 静态图块缓存、坐标索引     | 不存     | 由地图数据派生，随时可以重建            |
| 临时动画、提示、界面状态   | 不存     | 读档后重新产生，或根本不影响游戏结果    |
| 战斗上下文、寻路等 L2 系统 | 不存     | 只操作 Layer 1 数据，读档后按需重新建立 |

漏存和多存会带来两类不同的问题：

- <strong>漏存</strong>：读档后字段回到默认值，或者只恢复了一半。表现可能是玩家位置对了但背包空了，也可能是地图对了但某个开关又关上了。更隐蔽的是录像：数据端状态不一致，回放结果自然对不上。
- <strong>多存</strong>：把缓存或派生数据也写进存档。读档时缓存被旧值覆盖，和刚恢复的真实数据对不上；存档体积还会随缓存膨胀。更麻烦的是升级之后，旧缓存的结构可能已经不适配新代码。

所以 `saveState` 的原则是<strong>只交出重建所需的最小信息</strong>，`loadState` 的原则是<strong>先清空旧状态，再按存档重建</strong>。缓存不要存，读档后第一次用到时重新生成即可；Flag 系统就是这么做的：它只存每个字段的值，`FlagCommonField` 对象本身在读档时重新 `new` 出来。

## ISaveableContent：对象与存档形状

可存档对象要实现 `ISaveableContent<T>`，它只有两个方法：

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

这里的 `T` 是这个对象的<strong>存档形状</strong>，不是对象本身的类型。`saveState` 返回它，`loadState` 接收它。`saveState` 的返回值必须是一份深拷贝，接口注释也明确要求经过 `structuredClone`；直接把 `this` 返回去，等于把活对象交给存档系统，之后任何修改都会污染已经保存的数据。

`loadState` 拿到的是普通数据，不是你的类实例。它要做的是把这份数据装回对象：该清空的清空，该重建的重建，不要假设旧字段还留着。商店管理器就是典型写法：

```ts
loadState(state: IShopManagerSave): void {
    this.shops.clear();
    for (const save of state.list) {
        const shop: IShopState = new ShopState(save.id, this.state);
        shop.loadState(save, compression);
        this.shops.set(save.id, shop);
    }
}
```

它没有把存档里的普通对象直接塞进 `Map`，而是重新 `new ShopState`，再让每个商店自己恢复内部状态。这样 `Map` 里装的仍然是带方法的类实例，而不是一堆失去原型的普通对象。

## structuredClone 约束

存档数据会经过 `structuredClone`，它只认识一部分类型。写 `saveState` 之前，先确认你要返回的东西在支持范围内。

| 支持                        | 说明               |
| --------------------------- | ------------------ |
| 普通对象、数组              | 逐层复制           |
| 数字、字符串、布尔、`null`  | 原样复制           |
| `Map`、`Set`                | 复制成新的容器     |
| `TypedArray`、`ArrayBuffer` | 复制底层二进制数据 |
| `Date`                      | 复制时间值         |

不支持的包括函数、`Symbol`、DOM 节点、`WeakMap` 与 `WeakSet`。遇到函数这类值，`structuredClone` 会直接抛错，而不是悄悄跳过。

还有一条更隐蔽的限制：<strong>类实例会丢失原型与方法</strong>。`structuredClone` 只复制实例自身的可枚举属性，复制结果是一个普通对象。所以下面这种写法是错的：

```ts
// 错误：类实例的方法不会跟着进存档
saveState(): IMySave {
    return this;
}
```

读档后你拿到的不是 `MySaveable`，而是一个 `{ values: ... }` 形状的普通对象，`this.add`、`this.get` 都不存在。正确做法是在 `saveState` 里主动取出数据，在 `loadState` 里重新构造类实例。

嵌套对象会被逐层克隆，得到的是与原对象断开的新图。也正因如此，<strong>不要把活对象引用塞进存档数据</strong>：读档后它只是另一份副本，不再和原对象共享身份。跨对象引用应该存 id 或键，具体做法见后文。

## 注册可存档对象

实现好之后，用 `state.addSaveableContent(id, content)` 把它交给存档系统：

```ts
state.addSaveableContent('@plugin/example-counter', this.counter);
```

`id` 是这个对象在存档里的唯一标识。整份数据端存档就是一个 `Map<string, unknown>`，键是注册 id，值是该对象的 `saveState` 返回值。注册之后，存档时它会自动被遍历，读档时也会自动收到自己的那份数据。

`id` 必须唯一。重复注册同一个 id 时，后一个会被忽略，控制台打一条警告（错误码 `112`）。这不是「后一个覆盖前一个」，而是第一个注册的继续生效，所以两个系统抢同一个 id 时，第二个实际上没有进存档。

需要按 id 取回对象时，用 `state.getSaveableContent<T>(id)`。它返回 `ISaveableContent<T> | null`，没有这个 id 时返回 `null`。

插件通常在 `awake` 里注册。此时主对象刚创建完，装配插件自己的对象正合适；`initialize` 与 `afterLoad` 都太晚，读档可能已经发生。内置内容也是同样的注册方式，主插件在 `awake` 里注册了五项：

| 存档 id          | 对应对象             |
| ---------------- | -------------------- |
| `@system/hero`   | `state.hero`         |
| `@system/flags`  | `state.flags`        |
| `@system/maps`   | `state.maps`         |
| `@system/enemy`  | `state.enemyManager` |
| `@system/replay` | `state.replaySystem` |

商店插件则注册 `@plugin/shop`，对应的是 `ShopManager`，不是插件对象本身。插件 id 与存档 id 是两套命名，不要互相推导。

## 三级压缩

`SaveCompression` 有三档，含义写在枚举注释里：

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

自定义对象可以三档用同一套实现，例如都返回 `structuredClone` 后的完整数据。这没有问题，但必须满足两个条件：

1. 三档都能被自己的 `loadState` 正确读回，不能只有 `NoCompression` 能读；
2. 任何一档都不能改变语义，读档后的游戏状态必须一致。

如果以后要实现真正的差异压缩，参考数组从哪来、差异怎么合并，属于存档格式与压缩算法的细节，见 `高级 II · 存档格式演进` 与 `高级 II · 压缩算法细节`。

## 存档顺序与执行器

存档和读档都按<strong>注册顺序</strong>遍历。`saveables` 是一个 `Map`，`addSaveableContent` 的先后就是 `saveState` 与 `loadState` 的先后。`saveState` 依次调用每个对象的 `saveState`，把结果按 id 写进存档；`loadState` 再按同一顺序调用每个对象的 `loadState`。

读档时有两种不一致会被告警：

- 存档里缺少某个已注册 id 的数据：跳过该对象，控制台告警（错误码 `177`），它的执行器也不会运行；
- 存档里多出某个未注册 id 的数据：读档结束后统一告警（错误码 `178`），列出多余的 id。

前者常见于旧存档或改过 id，后者常见于删掉了某个可存档对象但旧存档还留着数据。

如果读档后还需要做一步收尾，用 `state.bindSaveableExecuter(content 或 id, executor)` 绑定执行器。执行器实现 `ISaveableExecutor<T>`：

```ts
export interface ISaveableExecutor<T> {
    afterLoad(data: T, state: IStateBase): void;
}
```

绑定时可以传对象本身，也可以传注册 id。传 id 时如果找不到对应对象，会静默返回；传对象时如果它没有注册过，会打一条警告（错误码 `113`）。所以先注册，再绑定。

一个可存档对象只能绑定一个执行器，重复绑定会替换前一个；一个执行器可以绑定多个对象，适合做全局性的读档收尾。

关键在时机：<strong>执行器在该对象的 `loadState` 返回后立即运行</strong>，不是等所有对象都读完之后统一运行。此时它前面的对象已经恢复完毕，后面的对象还没开始。这个顺序直接决定了跨对象引用该怎么解析。

还有一处与录像有关的细节：每个对象的 `loadState` 都被 `replaySystem.disable()` 与 `revert()` 包裹，读档本身不会被记进录像；但执行器<strong>不在包裹范围内</strong>，因为它可能确实要做需要记录的行为。在执行器里操作会影响成绩的状态时要谨慎，录像一致性的完整规则见 `高级教程 I · 录像一致性`。

### afterLoad 的两种含义

`afterLoad` 这个名字在两处出现，含义完全不同：

| 位置                            | 什么时候运行                            | 用来做什么                         |
| ------------------------------- | --------------------------------------- | ---------------------------------- |
| 插件 `afterLoad(state, deps)`   | 初次加载流程末尾，每个插件只运行一次    | 读配置、创建依赖加载内容的初始对象 |
| 执行器 `afterLoad(data, state)` | 每次读档，在该对象 `loadState` 之后立即 | 解析跨对象引用、做读档收尾         |

插件 `afterLoad` 只在<strong>初次加载</strong>后运行。玩家读档时，加载流程不会重跑，插件 `afterLoad` 也不会再执行。所以它不能替代读档执行器：需要「每次读档都做」的事，必须绑执行器。

反过来，执行器也不适合做「初次加载」的初始化。它只在读档时运行，首次进入游戏时没有存档可读，自然不会触发。

## 跨对象引用

存档里不要直接存另一个对象的引用。原因在 `structuredClone`：引用会被复制成新对象，读档后原对象和新对象是两份不同的东西，身份已经丢了；如果那个对象是类实例，方法也一并丢掉。

正确做法是<strong>存 id 或键，读档时再解析</strong>。常见的键有楼层 `floorId`、商店 id、可存档 id，以及你自己维护的稳定 `uid`。例如一个任务系统要记住「目标商店」：

```ts
// [需改] 存档里只存 id，不存 IShopState 对象
export interface IQuestSave {
    readonly targetShopId: string;
    readonly targetFloorId: string;
}
```

读档时怎么把它变回对象，有三种策略：

| 策略           | 做法                                                             | 适用场景                           |
| -------------- | ---------------------------------------------------------------- | ---------------------------------- |
| 先注册被引用者 | 保证被引用对象的 `addSaveableContent` 早于引用者                 | 依赖关系固定，启动时就能确定顺序   |
| 执行器延后解析 | 在引用者的执行器里解析；执行器运行时，注册在它之前的对象都已恢复 | 被引用者注册在前，但引用者需要收尾 |
| 惰性解析       | 存档只存 id，第一次真正用到时再按 id 查                          | 被引用者可能后注册、可能不存在     |

选择时看注册顺序：执行器只保证「该对象自己的 `loadState` 已完成」，不保证后面的对象已完成。如果你要引用的对象注册在引用者之后，执行器里拿到的可能还是旧状态，这时应该改成惰性解析，或者调整注册顺序，让被引用者先注册。

「拥有者注册在被引用者之后」是最省事的做法：先注册商店管理器，再注册引用商店的任务系统；这样任务系统的执行器运行时，商店已经恢复完毕。依赖关系不固定时，才需要惰性解析兜底。

```ts
// [需改] 读档后在执行器里解析引用
export class QuestSaveExecutor implements ISaveableExecutor<IQuestSave> {
    afterLoad(data: IQuestSave, state: IStateBase): void {
        const map = state.maps.getMap(data.targetFloorId);
        // [需改] 找不到时怎么处理，由你决定；不要假设它一定存在
    }
}
```

绑定放在注册之后：

```ts
state.bindSaveableExecuter('@plugin/example-quest', new QuestSaveExecutor());
```

## 模板：一个可存档对象的最小骨架

<strong>目标</strong>：写出一个能被注册、能正确存档与读档的对象，读档后它的内部数据与存档时一致。

<strong>改哪里</strong>：放进你自己的插件目录，通常与插件类放在一起；不需要为它单独新建一套目录。

<strong>复制什么</strong>：下面是机制本身的通用骨架，复制后按 `[需改]` 修改。它不是某个具体效果，计数器示例只是用法演示，不要拿示例当模板。

```ts
// [模板] 一个可存档对象的最小骨架：复制后按 [需改] 修改
export interface IMySave {
    // [需改] 存档形状，只能用 structured-cloneable 的类型
    readonly values: Map<string, number>;
}

export class MySaveable implements ISaveableContent<IMySave> {
    // [需改] 运行时的真实数据；Map 只是常见选择
    private readonly values: Map<string, number> = new Map();

    // [需改] 对外方法按你的需求增删
    setValue(key: string, value: number): void {
        this.values.set(key, value);
    }

    saveState(): IMySave {
        // [需改] 必须交出深拷贝，不能返回 this
        return { values: structuredClone(this.values) };
    }

    loadState(state: IMySave): void {
        // [需改] 先清空旧状态，再按存档重建
        this.values.clear();
        for (const [key, value] of state.values) {
            this.values.set(key, value);
        }
    }
}
```

<strong>改什么</strong>：

1. <strong>类名与接口名</strong>：`MySaveable`、`IMySave` 换成你的名字。
2. <strong>字段</strong>：把 `values` 换成你真正要保存的数据。只放重建必需的信息，缓存与派生数据不要放。
3. <strong>存档形状</strong>：`IMySave` 里列出 `saveState` 返回的字段，并确认每个字段都能被 `structuredClone` 处理。
4. <strong>loadState</strong>：按你的数据结构清空并重建。类实例要重新 `new`，不要直接使用存档里的普通对象。
5. <strong>压缩参数</strong>：如果三档实现相同，方法可以省略 `compression` 参数；需要区分时再补上。

<strong>注意</strong>：`saveState` 里不要修改对象状态，也不要返回 `this` 或带方法的类实例。`loadState` 不要假设旧数据还在，先清空再重建，才不会残留上次的状态。

## 示例：插件里的计数器

<strong>目标</strong>：插件维护一组计数器，读档后计数能恢复。

<strong>改哪里</strong>：你插件的 `plugin.ts` 与它自己的对象文件。下面先给计数器类，再给插件的注册代码。

<strong>复制什么</strong>：计数器类：

```ts
// [需改] 插件里的计数器
export interface ICounterSave {
    readonly values: Map<string, number>;
}

export class Counter implements ISaveableContent<ICounterSave> {
    private readonly values: Map<string, number> = new Map();

    add(key: string, value: number = 1): void {
        this.values.set(key, (this.values.get(key) ?? 0) + value);
    }

    get(key: string): number {
        return this.values.get(key) ?? 0;
    }

    saveState(): ICounterSave {
        return { values: structuredClone(this.values) };
    }

    loadState(state: ICounterSave): void {
        this.values.clear();
        for (const [key, value] of state.values) {
            this.values.set(key, value);
        }
    }
}
```

然后在插件的 `awake` 里创建并注册：

```ts
// [需改] 插件里注册计数器
export class CounterPlugin implements IDataPluginDefine {
    readonly id = 'example-counter-plugin';
    readonly dependencies: string[] = [];

    counter!: Counter;

    awake(state: ICoreState): void {
        this.counter = new Counter();
        state.addSaveableContent('@plugin/example-counter', this.counter);
    }

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
```

如果文件顶部报缺少 `ISaveableContent`，再补 `import { ISaveableContent } from '@user/data-common';`；通常插件文件已经引入过相关类型，不要重复粘。

<strong>改什么</strong>：

1. <strong>存档 id</strong>：`@plugin/example-counter` 换成你自己的 id，保证唯一，并与插件 id 分开命名。
2. <strong>键与值</strong>：`add(key, value)` 的键换成你的业务键；需要存字符串就改 `Map` 的值类型。
3. <strong>方法</strong>：`add`、`get` 只是演示，按你的需求增删；存档形状 `ICounterSave` 跟着改。
4. <strong>注册位置</strong>：必须在 `awake` 里注册，且只注册一次。

<strong>怎么验证</strong>：启动后调用 `counter.add('kill', 1)`，存档，再 `add` 一次让它变成 2，然后读档。读档后 `counter.get('kill')` 应回到 1。如果还是 2，检查 `loadState` 有没有先 `clear()`；如果读档后 `get` 报「不是函数」，检查是不是把类实例直接塞进了存档。

## 改内置还是自己写

先看你要改的东西属于哪一类：

- 只是给现有系统补存档，例如某个内置对象漏了一个字段——<strong>直接改它的 `saveState` 与 `loadState`</strong>，不要在外面再包一层；
- 要新增一组独立功能，有自己的状态、自己的管理器、自己的生命周期——做成插件，并给插件里的对象实现 `ISaveableContent`。

能改内置解决的问题，不值得再新建一个可存档对象。新建意味着多一个 id、多一处注册、多一份读档顺序要维护；出问题时，排查面也更大。

<strong>如果你不怎么懂代码，建议直接改内置，而不是自己写新的类。</strong>在内置类的 `saveState` 里补一个字段、在 `loadState` 里补一行恢复，改动小、对照原代码就能看出差异；自己写新类则要同时处理注册、存档形状、读档顺序与引用解析。

## 常见错误

- <strong>saveState 返回 this</strong>。活对象被交给存档系统，后续修改会污染已保存的数据；读档后也不是原来的类实例。
- <strong>返回带方法的类实例</strong>。`structuredClone` 会丢掉原型与方法，读档后调用方法直接报错。
- <strong>把缓存或索引也存进去</strong>。读档时旧缓存覆盖新算出的结果，状态对不上；这类数据应该重建。
- <strong>漏掉某个字段</strong>。读档后该字段回到默认值，表现为「只恢复了一半」。
- <strong>重复注册同一个 id</strong>。后一个被忽略并告警（`112`），你以为生效的对象其实没进存档。
- <strong>执行器里访问尚未恢复的对象</strong>。执行器只保证当前对象已恢复；注册在后面的对象还没读。
- <strong>把插件 afterLoad 当读档钩子</strong>。它只在初次加载后运行一次，玩家读档时不会再触发。
- <strong>在 saveState 里改状态</strong>。存档是只读快照，`saveState` 不应该有副作用；需要整理数据时，先复制再整理。
- <strong>跨对象引用直接存对象</strong>。`structuredClone` 会复制成新对象，读档后身份丢失，两个系统各拿一份。

## 怎么验证

<strong>第一项：改状态，存档，再改，读档</strong>。

把目标字段改到一个可观察的值，存档；再把它改成另一个值，然后读档。读档后应回到存档时的值。同时确认<strong>没有存</strong>的缓存被重新生成，而不是保留了读档前的旧值。

<strong>第二项：三档压缩各跑一次</strong>。

分别用 `SaveCompression.NoCompression`、`LowCompression`、`HighCompression` 存档并读档。三档都应恢复出相同结果；如果只有某一档出错，说明 `saveState` 与 `loadState` 对压缩级别的处理不一致。

<strong>第三项：确认注册成功</strong>。

在启动完成后调用：

```ts
const content = state.getSaveableContent('@plugin/example-counter');
console.log(content);
```

应拿到你注册的对象，而不是 `null`。为 `null` 时先检查 `addSaveableContent` 的 id 是否拼错、是否真的执行到了 `awake`。

<strong>第四项：故意删掉存档里的一个键</strong>。

读档时控制台应出现缺键告警（`177`），并跳过该对象，而不是静默通过。存档里多出未注册的 id 时，应出现多键告警（`178`）。这两条能帮你区分「没存进去」和「读的时候没对上」。

<strong>第五项：检查跨对象引用</strong>。

构造一个引用其他对象的场景，读档后确认引用仍指向正确的对象，而不是 `null` 或另一份副本。若拿到的是旧状态，检查被引用对象的注册顺序，或改成执行器延后解析。

<strong>第六项：检查执行器时机</strong>。

在执行器里打印一条日志，确认它在对应对象的 `loadState` 之后立即出现，而不是等所有对象读完才统一出现。如果顺序不对，说明你把执行器当成了全局读档完成钩子。

## 小结

- 只存重建必需的状态；缓存、派生数据与 L2 系统不进存档。
- `ISaveableContent<T>` 的 `T` 是存档形状；`saveState` 必须返回 `structuredClone` 后的数据，`loadState` 要清空并重建。
- 存档数据必须是 structured-cloneable 的；类实例会丢原型与方法，读档时要自己重建。
- 用 `addSaveableContent` 注册，id 唯一；重复 id 后一个被忽略（`112`）。
- 三档压缩只改变存储方式，不改变结果；每一档都必须能被自己的 `loadState` 读回。
- 存档与读档按注册顺序执行；执行器在该对象 `loadState` 后立即运行，且不被录像禁用包裹。
- 插件 `afterLoad` 只在初次加载后运行一次，不能替代读档执行器。
- 跨对象引用存 id 或键，读档时按顺序或延迟解析，不要存活对象引用。
- 不懂代码时优先改内置的 `saveState` / `loadState`，不要急着写新类。
