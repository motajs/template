# 插件系统

如果你已经用过中级教程里的[数据插件](../intermediate/data-plugins.md)，你会知道插件能把一组功能打包、挂到 `state` 上，并按固定时机初始化。那一篇停在「会用」；这一篇讲怎么自己写一个插件、让插件彼此协作，以及为什么插件的 `id` 不能随便改。

插件是高级 I 的核心：后面的可存档内容、录像一致性、钩子深入，实际都挂在某个插件上。

阅读前需要会基础语法：`class`、`new`、`import`、`async` / `await`。不需要懂引擎内部实现；涉及内部机制的地方，会先说清「你能拿它做什么」。

## 插件解决什么问题

假设你要加一个任务系统：它有自己的状态、自己的管理器，还要在加载完地图后读一遍任务配置。不做成插件的话，这些代码会散在几个地方——对象在 `src/data/initialize.ts` 里 `new`，存档注册也写在那里，加载后的初始化再塞进某个钩子。功能一多，`initialize.ts` 会变成所有人的公共草稿纸。

插件把这一组东西收进一个独立单元：

- 自己的对象在自己的目录里创建；
- 自己的存档内容在自己的 `awake` 里注册；
- 自己的加载后逻辑在自己的 `afterLoad` 里写；
- 启动时只需要在 `dataPlugins` 里 `new` 一次。

这和[声明式接口](./declarative-vs-imperative.md)是同一个思路：你不去改引擎的初始化流程，只声明「在哪个时机做什么」，时机由引擎统一调用。

## 插件接口

一个数据端插件实现 `IDataPluginDefine`：

| 成员                              | 类型                                     | 说明                         |
| --------------------------------- | ---------------------------------------- | ---------------------------- |
| `id`                              | `string`                                 | 插件标识符，全局唯一         |
| `dataDeps`                        | `readonly string[]`                      | 依赖的其他数据端插件 id      |
| `awake(state, dependencies)`      | `(state, dependencies) => void`          | 同步初始化，主对象构造期调用 |
| `initialize(state, dependencies)` | `(state, dependencies) => Promise<void>` | 异步初始化，加载开始前调用   |
| `afterLoad(state, dependencies)`  | `(state, dependencies) => Promise<void>` | 加载完毕后调用               |

这里最容易混淆的是两处名字：

- <strong>声明依赖时</strong>，属性叫 `dataDeps`，写的是依赖插件的 <strong>id 字符串数组</strong>；
- <strong>三个时机方法收到时</strong>，参数叫 `dependencies`，类型是 `Readonly<IDataPlugin>[]`，元素是解析后的插件包装对象，含 `plugin` 与 `status` 两个字段。

所以「声明依赖」写的是 `id`，真正拿到的却是对象。两者不要混着写。

## 数据端与渲染端

插件分数据端与渲染端两套注册表：数据端插件实现 `IDataPluginDefine`，注册在 `dataPlugins`；渲染端插件实现 `IClientPluginDefine`（来自 `@user/client-modules`），注册在 `clientPlugins`。两套的生命周期时机相同，区别在依赖声明与生命周期参数。

| 插件类型 | 依赖声明                  | 能依赖                  |
| -------- | ------------------------- | ----------------------- |
| 数据端   | `dataDeps`                | 数据端插件              |
| 渲染端   | `dataDeps` + `clientDeps` | 数据端插件 + 渲染端插件 |

依赖方向是单向的：<strong>渲染端可以依赖数据端，数据端不能依赖渲染端</strong>。数据端不引用任何渲染端内容，才能在没有渲染端的环境里单独加载、存档与回放。

### 渲染端插件接口

`IClientPluginDefine` 在 `id`、`dataDeps` 之上多了一份 `clientDeps`，生命周期方法也因此多一个依赖参数：

| 成员                            | 说明                                     |
| ------------------------------- | ---------------------------------------- |
| `id: string`                    | 插件标识符，全局唯一                     |
| `dataDeps: readonly string[]`   | 依赖的数据端插件 id                      |
| `clientDeps: readonly string[]` | 依赖的渲染端插件 id                      |
| `awake(...)`                    | 同步初始化，渲染端主对象构造期调用       |
| `initialize(...)`               | 异步初始化，加载开始前调用，会被 `await` |
| `afterLoad(...)`                | 加载完毕后调用，会被 `await`             |

三个时机方法的第一个参数是渲染端主对象 `IClientCore`，后两个参数依次是数据端依赖 `IDataPlugin[]` 与渲染端依赖 `IClientPlugin[]`。它们直接以 `dataDeps` / `clientDeps` 命名，不再统一叫 `dependencies`，所以不必按顺序猜是哪一类。

```ts
import {
    IClientCore,
    IClientPlugin,
    IClientPluginDefine
} from '@user/client-modules';
import { IDataPlugin } from '@user/data-state';
import { IShopPlugin } from '../../data/plugin/shop';
import { IClientShopPlugin } from './client-shop';

// 渲染端插件：同时依赖一个数据端插件与一个渲染端插件
export class MyClientPlugin implements IClientPluginDefine {
    readonly id = 'my-client-plugin';
    readonly dataDeps: string[] = ['data-shop-plugin'];
    readonly clientDeps: string[] = ['client-shop-plugin'];

    awake(
        state: IClientCore,
        dataDeps: IDataPlugin[],
        clientDeps: IClientPlugin[]
    ): void {
        // 依赖对象已经按声明解析好，直接取用即可
        const dataShop = dataDeps[0]?.plugin as IShopPlugin | undefined;
        const clientShop = clientDeps[0]?.plugin as
            | IClientShopPlugin
            | undefined;
    }

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
```

两个依赖数组都要声明，没有依赖就留空。渲染端插件的注册方式与数据端对应：类写在自己的目录里，追加到 `src/client/plugin/list.ts` 的 `clientPlugins` 数组末尾；入口 `src/client/entry.ts` 同样把主插件放在数组前面。需要取回渲染端插件时用 `state.getClientPlugin(id)`，返回 `Readonly<IClientPlugin<T>> | null`，判空方式与 `getDataPlugin` 一致。

渲染端尚未完工，渲染端对象具体有哪些、插件能拿它们做什么，要等完工后再写。上面这些是当前已经定稿的接口。

## 注册到 dataPlugins

插件写好后，在 `src/data/plugin/list.ts` 的 `dataPlugins` 数组里<strong>追加</strong>一项，不要清空或替换已有插件：

```ts
import { IDataPluginDefine } from '@user/data-state';
import { DataShopPlugin } from './shop';
// 新建插件文件时，必须补上你自己的 import
import { MyPlugin } from './my-plugin';

/** 数据端插件列表 */
export const dataPlugins: IDataPluginDefine[] = [
    new DataShopPlugin(),
    // 追加到末尾，不要替换上面的已有插件
    new MyPlugin()
];
```

新建插件时，`list.ts` 里不会有你的类名，必须自己补一行 `import`，路径指向你的插件目录。只把数组写成 `[new MyPlugin()]` 会把商店插件挤掉。

数据端启动时会遍历这个数组，把插件收进注册表。同一个 `id` 出现两次时，后一个会被忽略，控制台报一条错误（错误码 `78`），所以请保证 `id` 唯一。

## 生命周期

三个时机在启动流程里的位置是固定的。按 `CoreState` 的实际执行顺序，可以画成这样：

```text
CoreState 构造
  └─ awake        同步执行，全部可初始化插件依次完成
load() 开始
  ├─ initialize   异步，加载开始前
  ├─ loader.start()   真正加载数据、产出进度
  └─ afterLoad    异步，加载完毕后
```

### awake：主对象构造期，同步执行

`awake` 在主对象构造过程中被调用，此时地图、配置都还没加载。它返回 `void`，<strong>引擎不会等待它的返回值</strong>——即使你把它写成 `async`，引擎也会立刻走到下一个插件。

所以 `awake` 适合做「不需要等外部数据」的装配：

- `new` 出插件自己的系统、管理器；
- 把它们挂到插件对象上，供后续调用；
- 调用 `state.addSaveableContent(id, content)` 注册需要进存档的对象。

需要在 `awake` 里等的东西（读文件、等网络、等加载器），都不属于这里，放到 `initialize`。

### initialize：加载开始前

`initialize` 在 `load()` 的最前面被调用，此时数据还没开始加载。它返回 `Promise`，引擎会 `await` 它。

只要这个 Promise 不兑现，后面的插件（包括依赖它的）都不会继续，`loader.start()` 也不会开始。所以这里可以放心做「加载前必须完成」的异步准备，但不要在里面等一个永远不会结束的任务。

### afterLoad：加载完毕后

`afterLoad` 在整个加载结束之后被调用，同样返回 `Promise` 并被等待。它适合「必须读到加载内容才能做」的初始化，例如读核心配置、读地图、根据数据创建对象。

`load()` 的最后一步就是 `await afterLoad()`：它不兑现，加载流程就不算结束。

### 状态与顺序

每个插件在注册表里都带着一个 `PluginStatus`，随阶段推进：

| 状态                       | 含义                          |
| -------------------------- | ----------------------------- |
| `PluginStatus.NotAwakened` | 还没执行 `awake`              |
| `PluginStatus.Awakened`    | 已执行 `awake`，未异步初始化  |
| `PluginStatus.Initialized` | 已执行 `initialize`，未加载完 |
| `PluginStatus.Loaded`      | 三个时机都已完成              |

三个阶段都按同一套依赖关系执行：<strong>被依赖的插件先完成同一阶段，依赖它的一方才会开始</strong>。也就是说，插件 B 的 `awake` 开始时，它声明的依赖插件 A 一定已经 `awake` 完毕。不构成依赖关系的插件之间，不要假定谁先谁后；需要顺序就显式声明依赖。

依赖关系在启动前定好，之后不会重算。启动后修改某个插件的 `dataDeps` 数组不会改变执行顺序，也没有接口在运行时追加插件。

依赖写错时，整条链路会被阻断：

- <strong>循环依赖</strong>：环上的插件全部被排除，控制台报一条错误（错误码 `76`），列出环上的 id；
- <strong>缺失依赖</strong>：`dataDeps` 里写了一个没有注册的 id，该插件被排除，控制台按「插件 id + 缺失的依赖 id」逐条报错（错误码 `77`）；
- <strong>下游阻断</strong>：依赖上述插件的插件也会一起被排除，三个时机一个都不执行。

排查时先看控制台里的错误码与 id，再顺链往上找。依赖尽量少：每多一条依赖，就多一个「对方改名或失败会拖住自己」的机会。渲染端插件也按同样方式处理 `clientDeps`。

## 插件之间怎么调用

### 用依赖参数直接调用

声明了依赖，最直接的方式就是用方法参数里的插件对象。注意它是 `IDataPlugin` 包装对象，你要取 `.plugin`：

```ts
// 插件 B 依赖插件 A，并在初始化时调用 A 的方法
export class PluginB implements IDataPluginDefine {
    readonly id = 'plugin-b';
    readonly dataDeps = ['plugin-a'];

    awake(state: ICoreState, dependencies: Readonly<IDataPlugin>[]): void {
        // 参数顺序与 dataDeps 数组一致
        const a = dependencies[0]?.plugin as PluginA | undefined;
        if (!a) return;
        a.doSomething();
    }

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
```

这段按新文件写，顶部需要 `import { ICoreState, IDataPlugin, IDataPluginDefine } from '@user/data-state';` 与 `import { PluginA } from './plugin-a';`（路径按你的目录调整）。`PluginA` 需要有能被外部调用的方法。通常的做法是像 `IShopPlugin` 那样，给自己的插件定一个接口：`interface IMyPlugin extends IDataPluginDefine { ... }`，把要暴露的方法写进去。

拿到的是注册表里同一个包装对象，它的 `status` 会随阶段推进更新。所以你在自己 `awake` 里看到的依赖状态是 `Awakened`，在 `afterLoad` 里看到的通常已经是 `Loaded`。

### 用 getDataPlugin 取回

没有声明依赖、或者在启动之后才按需访问时，用 `state.getDataPlugin(id)`。它返回 `Readonly<IDataPlugin<T>> | null`。下面这段放在能拿到 `state` 的方法里：

```ts
import { ICoreState, PluginStatus } from '@user/data-state';
import { PluginA } from './plugin-a';

// 取回插件，先判空，再确认状态
export function callPluginA(state: ICoreState): void {
    const holder = state.getDataPlugin<PluginA>('plugin-a');
    if (holder && holder.status === PluginStatus.Loaded) {
        holder.plugin.doSomething();
    }
}
```

两个检查都不能省：

- 返回 `null` 表示没有这个 `id`，可能是没注册，也可能是拼写错了；
- `status` 没到你要的阶段，说明它还没执行到那一步，此时调用它的方法可能读到还没装配好的字段。

如果在启动阶段就要用某个插件，优先声明依赖，让引擎保证顺序；`getDataPlugin` 更适合可选的、运行中才发生的调用。

## 插件 id 稳定性与版本迁移

插件有插件 id，它注册的可存档内容另有存档 id，两者互不相干：

| 名称    | 例子               | 用在哪                                      |
| ------- | ------------------ | ------------------------------------------- |
| 插件 id | `data-shop-plugin` | `dataPlugins` 注册表、其他插件的 `dataDeps` |
| 存档 id | `@plugin/shop`     | `state.addSaveableContent(id, content)`     |

商店插件就是现成的例子：它的插件 id 是 `data-shop-plugin`，在 `awake` 里注册的存档内容却是 `@plugin/shop`。这两个字符串没有任何推导关系，不要以为改了插件 id 存档 id 会跟着变。

插件 id 会被别的插件的 `dataDeps` 引用，所以它是一份对外契约：

- <strong>不要随意改名</strong>。改名后，依赖它的插件会变成「缺失依赖」，整条链被阻断；
- <strong>不要复用旧 id 表示新语义</strong>。旧依赖方仍然能找到这个 id，但拿到的是另一套对象，运行时会以「方法不存在」之类的形式炸掉，而且很难从依赖声明上看出来。

需要演进时，按改动大小选最小做法：

1. <strong>行为兼容的升级</strong>：保留原 `id`，只改实现。依赖方不需要动。
2. <strong>语义确实变了</strong>：新增一个 id，不要复用旧 id；同时把所有依赖方的 `dataDeps` 一起改掉，不要分几次发布。
3. <strong>必须过渡</strong>：让旧 id 继续注册一个兼容实现（或做转发），等所有依赖方迁完再删。
4. <strong>存档 id 尽量不动</strong>：读档时按存档 id 找内容，改了它，旧存档里的数据就对不上。确实要改时，需要自己写迁移逻辑（读档后从旧 id 取数据写进新对象），不要只改字符串。

## 注册与目录

插件放在 `src/data/plugin/` 下自己的目录里。现有商店插件的形状可以作为参考：

| 文件                                    | 放什么                               |
| --------------------------------------- | ------------------------------------ |
| `plugin.ts`                             | 插件类本身，实现 `IDataPluginDefine` |
| `types.ts`                              | 插件对外接口、存档数据结构           |
| `state.ts` / `manager.ts` / `system.ts` | 插件自己的对象，按需创建             |
| `index.ts`                              | 统一导出                             |

然后在 `list.ts` 里 `new` 出来加进 `dataPlugins`。最终传给 `CoreState` 的插件数组在 `src/data/entry.ts` 里拼成：主插件在前，`dataPlugins` 展开在后。日常只需要改 `list.ts`，不必动 `entry.ts`。

## 示例：一个完整插件

假设要新建一个插件：它要能被启动流程加载，并拥有自己的对象与存档内容。插件放在 `src/data/plugin/` 下自己的目录里，下面这份代码写在新建的 `plugin.ts` 中，顶部的 `import` 要一起保留：

```ts
import { ICoreState, IDataPlugin, IDataPluginDefine } from '@user/data-state';

// 插件类：实现 IDataPluginDefine 的五个成员
export class MyPlugin implements IDataPluginDefine {
    // 插件 id：全局唯一，发布后不要改，其他插件可能依赖它
    readonly id = 'my-plugin';
    // 依赖的数据端插件 id；没有依赖就留空
    readonly dataDeps: string[] = [];

    // 插件自己的对象；暂时没有就删掉这一行以及 awake 里对应的装配
    mySystem!: MySystem;

    awake(state: ICoreState): void {
        // 装配插件自己的对象；这里不要 await
        this.mySystem = new MySystem(state);
        // 有需要存档的数据时注册；这里是存档 id，不是插件 id
        state.addSaveableContent('@plugin/my-plugin', this.mySystem);
    }

    async initialize(
        state: ICoreState,
        dependencies: Readonly<IDataPlugin>[]
    ): Promise<void> {
        // 加载开始前要做的事；可以 await，但会阻塞加载
    }

    async afterLoad(
        state: ICoreState,
        dependencies: Readonly<IDataPlugin>[]
    ): Promise<void> {
        // 需要读取加载内容时写在这里
    }
}
```

`MySystem` 是你自己写的类，文档不会替你定义。暂时没有对应对象时，把 `mySystem` 字段、`new MySystem(state)` 以及相关的 `addSaveableContent` 一起删掉，否则编译器会报「找不到名称 MySystem」。

写好后，把插件追加到 `src/data/plugin/list.ts` 的 `dataPlugins` 数组末尾，并补上新建文件的 `import`，写法见前面的「注册到 dataPlugins」。

需要定制的通常只有三处：类名与 `id`；`dataDeps`（没有依赖就留空，不要填插件对象）；`awake` 里的装配。需要进存档的对象必须实现 `ISaveableContent`（`saveState` / `loadState`），细节见[可存档内容](./saveable-content.md)。

## 示例：读一个现有插件

### DataShopPlugin：awake 里装配并注册存档

商店插件是 `dataPlugins` 里当前唯一的独立插件，适合逐段对照。它的代码在 `src/data/plugin/shop/plugin.ts`：

```ts
export class DataShopPlugin implements IShopPlugin {
    id: string = 'data-shop-plugin';
    dataDeps: string[] = [];

    shop!: IShopSystem;
    manager!: IShopManager;

    /** 数据端主对象 */
    private state!: ICoreState;

    createShopState(id: string): IShopState {
        return new ShopState(id, this.state);
    }

    awake(state: ICoreState): void {
        this.state = state;
        this.shop = new ShopSystem(state);
        this.manager = new ShopManager(state);

        state.addSaveableContent('@plugin/shop', this.manager);
    }

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
```

逐段看：

- `id` 是 `data-shop-plugin`，没有依赖，所以它会在 `awake` 的第一批里执行；
- `awake` 先保存 `state`，再创建系统与管理器。这两个对象都需要主对象，所以只能在这里 `new`；
- `state.addSaveableContent('@plugin/shop', this.manager)` 把管理器注册为存档内容。<strong>注册的是管理器，不是插件本身</strong>；存档 id 也另起了一套命名；
- `initialize` 与 `afterLoad` 都是空的：商店不依赖加载内容，装配在 `awake` 就完成了。

`IShopPlugin` 在 `IDataPluginDefine` 之上加了 `shop`、`manager`、`createShopState`，这就是「插件对外暴露能力」的写法。别的插件依赖它时，就能直接调用这些成员。

### MainDataPlugin：afterLoad 读取加载后的配置

主插件 `src/data/initialize.ts` 的 `MainDataPlugin` 是 `afterLoad` 的典型用法。它的 `awake` 负责装配朝向、寻路、加载钩子与各系统；创建勇士则放到 `afterLoad`：

```ts
import { ICoreState, ICoreStateCoreConfig } from '@user/data-state';
import { FaceDirection, FaceGroup, IFacedTileLocator } from '@user/data-common';
import { logger } from '@motajs/common';
import { IDataMainPlugin } from './types';

// 主插件节选：只保留 afterLoad，其余成员用注释省略
export class MainDataPlugin implements IDataMainPlugin {
    readonly id = 'main-data-plugin';
    readonly dataDeps: string[] = [];

    // 朝向组由入口在构造时传入
    constructor(readonly heroFace: FaceGroup) {}

    // ... awake / initialize 等成员省略

    async afterLoad(state: ICoreState): Promise<void> {
        // 核心配置只有在加载完成后才拿得到
        const coreConfig = state.loader.getConfig<ICoreStateCoreConfig>('core');
        if (!coreConfig) {
            logger.error(79, 'Data');
            return;
        }
        const dir = state.faceManager.get(this.heroFace);
        if (!dir) {
            logger.error(80);
            return;
        }
        state.hero.createAttribute(coreConfig.init.hero.attribute);
        const location: IFacedTileLocator = {
            x: coreConfig.init.hero.x,
            y: coreConfig.init.hero.y,
            direction: FaceDirection.Down
        };
        state.hero.createLocation(location, dir);
    }
}
```

这段为什么不能放进 `awake`：`coreConfig` 来自 `core.jsonc`，要等加载器读完才有。`awake` 阶段 `getConfig` 拿不到内容，创建勇士就会失败。`afterLoad` 正好是「加载已完成、但游戏还没正式开始」的时机。它同时说明了另一个点：`afterLoad` 拿到的 `state` 与 `awake` 是同一个主对象，`awake` 里存下的引用（如 `this.heroFace`）此时仍然可用。

## 验证

启动完成后，用 `state.getDataPlugin` 取回插件，确认它已经进了注册表：

```ts
import { ICoreState, PluginStatus } from '@user/data-state';
import { MyPlugin } from './my-plugin';

// 启动完成后取回插件并检查状态
export function checkMyPlugin(state: ICoreState): void {
    const holder = state.getDataPlugin<MyPlugin>('my-plugin');
    console.log(holder?.status === PluginStatus.Loaded, holder?.plugin);
}
```

`PluginStatus` 与 `ICoreState` 从 `@user/data-state` 引入，`MyPlugin` 从你的插件文件引入。`status` 应为 `Loaded`，`plugin` 应是你 `new` 的那个实例。如果是 `null`，先检查 `list.ts` 有没有真的 `new` 并放进数组。

想确认依赖阻断，可以把 `dataDeps` 里的某个 id 改成一个不存在的名字再启动：控制台应报缺失依赖错误（`77`，带插件 id 与缺失的依赖 id），并且你的插件没有任何时机输出。插件注册的存档内容如何验证，见[可存档内容](./saveable-content.md)的「验证」一节。

## 边界与注意

- <strong>在 awake 里 await</strong>。`awake` 的返回值会被忽略，写 `async awake` 也不会被等待。异步准备放到 `initialize`。
- <strong>把 dataDeps 写成对象</strong>。它必须是 id 字符串数组；插件对象是三个时机方法收到的参数，不是声明时写的东西。
- <strong>依赖成环</strong>。环上的插件全部被排除，依赖它们的下游也不执行。依赖关系要单向。
- <strong>依赖 id 拼错</strong>。插件不会报「找不到类」，而是被当作缺失依赖排除；控制台会给出插件 id 与缺失的 id。
- <strong>用 getDataPlugin 不判空</strong>。它可能返回 `null`，也可能处于你还没等到阶段。
- <strong>把插件 id 当显示名随意改</strong>。别的插件的 `dataDeps` 会立刻失效，存档 id 也不会跟着变。
- <strong>直接改其他系统的内部字段</strong>。插件之间应通过公开方法与接口协作；直接改私有字段会绕开对方维护的一致性逻辑。

## 小结

- 插件把一组对象与它们的生命周期收进一个独立单元，启动时在 `dataPlugins` 里 `new` 一次。
- `dataDeps` 声明的是 id 字符串；三个时机方法收到的是解析后的插件对象。
- 渲染端插件实现 `IClientPluginDefine`，用 `dataDeps` 与 `clientDeps` 分别声明两类依赖；渲染端可以依赖数据端，数据端不能依赖渲染端。
- `awake` 在构造期同步执行，不能等异步；`initialize` 在加载前、`afterLoad` 在加载后，二者都会阻塞。
- 三个阶段都按依赖顺序走；循环依赖、缺失依赖会连同下游一起被阻断。
- 插件 id 是对外契约，不要随意改名或复用；它与可存档 id 是两套命名。

返回[高级 I 导览](./index.md)。
