# 插件系统

如果你已经用过中级教程里的[数据插件](../intermediate/data-plugins.md)，你会知道插件能把一组功能打包、挂到 `state` 上，并按固定时机初始化。那一篇停在「会用」；这一篇讲怎么自己写一个插件、让插件彼此协作，以及怎么在插件之外调用它。

插件分数据端与渲染端两套，写法、注册方式与生命周期一一对应：数据端插件负责逻辑与状态，渲染端插件负责画面与交互。渲染端插件可以依赖数据端插件，反过来不行。下面两边并列讲，遇到不同的地方单独说明。

插件是高级 I 的核心：后面的可存档内容、录像一致性、钩子深入，实际都挂在某个插件上。

阅读前需要会基础语法：`class`、`new`、`import`、`async` / `await`。不需要懂引擎内部实现；涉及内部机制的地方，会先说清「你能拿它做什么」。

## 注册与目录

数据端插件放在 `src/data/plugin/`，渲染端插件放在 `src/client/plugin/`，各自在自己的目录里：

| 位置                          | 放什么     |
| ----------------------------- | ---------- |
| `src/data/plugin/<插件名>/`   | 数据端插件 |
| `src/client/plugin/<插件名>/` | 渲染端插件 |

插件目录内部按需要拆文件，常见形状两端一致：

| 文件                                    | 放什么                                                        |
| --------------------------------------- | ------------------------------------------------------------- |
| `plugin.ts`                             | 插件类本身，实现 `IDataPluginDefine` 或 `IClientPluginDefine` |
| `types.ts`                              | 插件对外接口、存档数据结构                                    |
| `state.ts` / `manager.ts` / `system.ts` | 插件自己的对象，按需创建                                      |
| `index.ts`                              | 统一导出                                                      |

写好后，把插件实例 `new` 进对应端的列表：

| 端     | 列表文件                    | 数组            |
| ------ | --------------------------- | --------------- |
| 数据端 | `src/data/plugin/list.ts`   | `dataPlugins`   |
| 渲染端 | `src/client/plugin/list.ts` | `clientPlugins` |

```ts
// src/data/plugin/list.ts
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

```ts
// src/client/plugin/list.ts
import { IClientPluginDefine } from '@user/client-modules';
import { ClientShopPlugin } from './shop';
import { MyClientPlugin } from './my-client';

/** 渲染端插件列表 */
export const clientPlugins: IClientPluginDefine[] = [
    new ClientShopPlugin(),
    // 追加到末尾，不要替换上面的已有插件
    new MyClientPlugin()
];
```

新建插件时，`list.ts` 里不会有你的类名，必须自己补一行 `import`，路径指向你的插件目录。只把数组写成 `[new MyPlugin()]` 会把已有插件挤掉。

两个入口文件分别把主插件放在数组前面，再展开各自的列表：`src/data/entry.ts` 中是 `[new MainDataPlugin(HERO_FACE), ...dataPlugins]`，`src/client/entry.ts` 中是 `[new MainClientPlugin(), ...clientPlugins]`。日常只需要改两个 `list.ts`，不必动入口。

同一端的注册表里，`id` 重复时后一个会被忽略，控制台报一条错误（错误码 `78`），所以请保证 `id` 在各自的注册表里唯一。

## 插件解决什么问题

假设你要加一个任务系统：它有自己的状态、自己的管理器，还要在加载完地图后读一遍任务配置。不做成插件的话，这些代码会散在几个地方——对象在 `src/data/initialize.ts` 里 `new`，存档注册也写在那里，加载后的初始化再塞进某个钩子。功能一多，`initialize.ts` 会变成所有人的公共草稿纸。

插件把这一组东西收进一个独立单元：

- 自己的对象在自己的目录里创建；
- 自己的存档内容在自己的 `awake` 里注册；
- 自己的加载后逻辑在自己的 `afterLoad` 里写；
- 启动时只需要在对应端的插件列表里 `new` 一次。

这和[声明式接口](./declarative-vs-imperative.md)是同一个思路：你不去改引擎的初始化流程，只声明「在哪个时机做什么」，时机由引擎统一调用。

## 插件接口

数据端插件实现 `IDataPluginDefine`（来自 `@user/data-state`），渲染端插件实现 `IClientPluginDefine`（来自 `@user/client-modules`）。两者都由 `id`、依赖声明与三个时机方法组成；渲染端多一份 `clientDeps`，生命周期方法也多一个依赖参数。

先看两边的完整模板，后面逐项解释。

### 数据端插件模板

```ts
// src/data/plugin/my-plugin/types.ts
import { IDataPluginDefine } from '@user/data-state';

/** 插件对外暴露的能力；依赖它的插件按这个接口调用 */
export interface IMyPlugin extends IDataPluginDefine {
    doSomething(): void;
}
```

```ts
// src/data/plugin/my-plugin/plugin.ts
import { ICoreState, IDataPlugin } from '@user/data-state';
import { IMyPlugin } from './types';

// 数据端插件模板
export class MyPlugin implements IMyPlugin {
    // 插件标识符：在数据端注册表里唯一
    readonly id = 'my-plugin';
    // 依赖的其他数据端插件 id；没有依赖就留空
    readonly dataDeps: string[] = [];

    awake(state: ICoreState): void {
        // 在这里装配插件自己的对象
        // 需要进存档的对象，在这里调用 state.addSaveableContent(...)
    }

    doSomething(): void {
        // 对外方法：其他插件、钩子等通过插件对象调用
    }

    async initialize(
        state: ICoreState,
        dependencies: Readonly<IDataPlugin>[]
    ): Promise<void> {}

    async afterLoad(
        state: ICoreState,
        dependencies: Readonly<IDataPlugin>[]
    ): Promise<void> {}
}
```

### 渲染端插件模板

```ts
import {
    IClientCore,
    IClientPlugin,
    IClientPluginDefine
} from '@user/client-modules';
import { IDataPlugin } from '@user/data-state';

// 渲染端插件模板：写在 src/client/plugin/my-client/plugin.ts
export class MyClientPlugin implements IClientPluginDefine {
    // 插件标识符：在渲染端注册表里唯一
    readonly id = 'my-client-plugin';
    // 依赖的数据端插件 id；没有依赖就留空
    readonly dataDeps: string[] = [];
    // 依赖的渲染端插件 id；没有依赖就留空
    readonly clientDeps: string[] = [];

    awake(
        state: IClientCore,
        dataDeps: IDataPlugin[],
        clientDeps: IClientPlugin[]
    ): void {
        // 依赖已经解析好，直接取用即可
    }

    async initialize(
        state: IClientCore,
        dataDeps: IDataPlugin[],
        clientDeps: IClientPlugin[]
    ): Promise<void> {}

    async afterLoad(
        state: IClientCore,
        dataDeps: IDataPlugin[],
        clientDeps: IClientPlugin[]
    ): Promise<void> {}
}
```

### 逐项说明

**`id`**：两端的插件标识符，在各自的注册表里唯一。其他插件按这个字符串声明依赖，`getDataPlugin` / `getClientPlugin` 也按它取回插件。

**`dataDeps`**：依赖的数据端插件 id 数组。数据端插件只能填数据端插件；渲染端插件可以填任何数据端插件。没有依赖就留空数组。

**`clientDeps`**：只有渲染端插件有，写依赖的渲染端插件 id。没有依赖同样留空。

依赖方向是单向的：<strong>渲染端可以依赖数据端，数据端不能依赖渲染端</strong>。数据端不引用任何渲染端内容，才能在没有渲染端的环境里单独加载、存档与回放。

**依赖参数**：三个时机方法收到的依赖是解析后的插件包装对象，不是 id 字符串，形如 `{ status, plugin }`。数据端插件的参数统一叫 `dependencies`，类型是 `Readonly<IDataPlugin>[]`；渲染端插件分成 `dataDeps` 与 `clientDeps` 两个参数，类型分别是 `IDataPlugin[]` 与 `IClientPlugin[]`，顺序与声明一致。不需要时可以把依赖参数整个省略。

依赖在插件执行前已经解析完毕。如果声明在 `dataDeps` / `clientDeps` 里的依赖缺失或成环，插件本身不会被加载，所以拿到依赖后直接取 `.plugin` 用即可，<strong>不要判空</strong>。

**`awake`**：同步初始化，在主对象构造期调用。`awake` 返回 `void`，引擎不会等待它的返回值；需要 `await` 的东西放到 `initialize`。数据端此时地图与配置都还没加载，渲染端此时刚拿到渲染端主对象。

**`initialize`**：异步初始化，在加载开始前调用，会被 `await`。它不兑现，后面的插件与加载都不会继续。

**`afterLoad`**：加载完毕后调用，同样会被 `await`。适合读取加载内容之后再装配的对象。

三个时机的具体位置见下一节。

## 生命周期

三个时机在启动流程里的位置是固定的。两端一一对应，下面按数据端的执行顺序说明：

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

需要在 `awake` 里等的东西（读文件、等网络、等加载器），都不属于这里，放到 `initialize`。渲染端插件同样在渲染端主对象构造期执行 `awake`，只是没有存档注册这一类数据端操作。

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

排查时先看控制台里的错误码与 id，再顺链往上找。依赖尽量少：每多一条依赖，就多一个「对方改名或失败会拖住自己」的机会。渲染端插件之间的顺序按 `clientDeps` 同样处理；`dataDeps` 指向的数据端插件在渲染端启动前已经就绪。

## 调用插件

插件的能力不只在插件之间使用。其他插件、钩子、事件、命令式脚本、渲染端 UI，只要拿得到对应的主对象，都可以调用插件的公开成员。

### 在插件里用依赖参数

声明了依赖，最直接的方式就是用时机方法参数里的插件对象。注意它是 `{ status, plugin }` 包装对象，你要取 `.plugin`：

```ts
import { ICoreState, IDataPlugin, IDataPluginDefine } from '@user/data-state';
import { IShopPlugin } from '../shop';

// 依赖商店插件，在初始化时调用它的公开成员
export class ShopConsumerPlugin implements IDataPluginDefine {
    readonly id = 'shop-consumer-plugin';
    // 依赖顺序与 dataDeps 数组一致
    readonly dataDeps = ['data-shop-plugin'];

    awake(state: ICoreState, dependencies: Readonly<IDataPlugin>[]): void {
        // 依赖已经解析好，直接取 .plugin，不需要判空
        const [{ plugin }] = dependencies;
        const dataShop = plugin as IShopPlugin;
        const shop = dataShop.createShopState('my-shop');
        shop.enable();
    }

    async initialize(
        state: ICoreState,
        dependencies: Readonly<IDataPlugin>[]
    ): Promise<void> {}

    async afterLoad(
        state: ICoreState,
        dependencies: Readonly<IDataPlugin>[]
    ): Promise<void> {}
}
```

依赖数组的顺序与 `dataDeps` 一致。元素是注册表里同一个包装对象，它的 `status` 会随阶段推进更新：你在自己 `awake` 里看到的依赖状态是 `Awakened`，在 `afterLoad` 里看到的通常已经是 `Loaded`。

要调用插件自己的成员，需要把 `.plugin` 断言成它的对外接口（例如 `IShopPlugin`）。所以写插件时，如果希望别人调用你的方法，就在 `types.ts` 里定一个 `IMyPlugin extends IDataPluginDefine`，把公开成员写进去。渲染端插件的 `dataDeps` / `clientDeps` 参数同理，分别断言成数据端接口与渲染端接口。

### 用 getDataPlugin 取回

没有声明依赖、或者在启动之后才按需访问时，用 `state.getDataPlugin(id)`。它返回 `Readonly<IDataPlugin<T>> | null`：

```ts
import { ICoreState, PluginStatus } from '@user/data-state';
import { IShopPlugin } from './types';

// 按 id 取回插件，确认状态后再调用
export function enableShop(state: ICoreState): void {
    const holder = state.getDataPlugin<IShopPlugin>('data-shop-plugin');
    if (!holder || holder.status !== PluginStatus.Loaded) {
        return;
    }
    holder.plugin.createShopState('my-shop').enable();
}
```

这里和依赖参数相反，两个检查都不能省：

- 返回 `null` 表示没有这个 `id`，可能是没注册，也可能是拼写错了；
- `status` 没到你要的阶段，说明它还没执行到那一步，此时调用它的方法可能读到还没装配好的字段。

渲染端用 `state.getClientPlugin(id)`，返回 `Readonly<IClientPlugin<T>> | null`，判空方式与 `getDataPlugin` 一致。

如果在启动阶段就要用某个插件，优先声明依赖，让引擎保证顺序；`getDataPlugin` 更适合可选的、运行中才发生的调用。

### 插件之外也能调用

调用方不必是插件。钩子、事件脚本、命令式函数，只要拿得到 `state`，都能按 id 取回插件并调用它的公开成员：

```ts
import { ICoreState, PluginStatus } from '@user/data-state';
import { IHeroAttr } from '@user/data-common';
import { IHeroAttributeHooks } from '@user/data-base';
import { IMyPlugin } from './types';

// 钩子里调用插件：钩子只负责在合适的时机触发
export class MyAttributeHooks implements IHeroAttributeHooks<IHeroAttr> {
    constructor(private readonly state: ICoreState) {}

    onUpdateAttribute<K extends keyof IHeroAttr>(
        name: K,
        value: IHeroAttr[K]
    ): void {
        const holder = this.state.getDataPlugin<IMyPlugin>('my-plugin');
        if (holder?.status === PluginStatus.Loaded) {
            holder.plugin.doSomething();
        }
    }
}
```

这里同样要判空与检查状态，因为 `getDataPlugin` 只是查注册表，不保证插件已经加载完成。渲染端插件用 `getClientPlugin`，写法一致。

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
- `state.addSaveableContent('@plugin/shop', this.manager)` 把管理器注册为存档内容。<strong>注册的是管理器，不是插件本身</strong>；
- `initialize` 与 `afterLoad` 都是空的：商店不依赖加载内容，装配在 `awake` 就完成了。

`IShopPlugin` 在 `IDataPluginDefine` 之上加了 `shop`、`manager`、`createShopState`，这就是「插件对外暴露能力」的写法。别的插件依赖它时，就能直接调用这些成员。

渲染端也有形状对应的 `ClientShopPlugin`（`src/client/plugin/shop/plugin.ts`）：它的三个时机都是空的，只把 `Shop` 与 `ShopUI` 作为公开成员暴露出来，供其他渲染端插件使用。两端插件的结构一致，差别只在依赖与生命周期参数。

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
import { IMyPlugin } from './types';

// 启动完成后取回插件并检查状态
export function checkMyPlugin(state: ICoreState): void {
    const holder = state.getDataPlugin<IMyPlugin>('my-plugin');
    console.log(holder?.status === PluginStatus.Loaded, holder?.plugin);
}
```

`PluginStatus` 与 `ICoreState` 从 `@user/data-state` 引入，`IMyPlugin` 是你写在插件 `types.ts` 里的对外接口。`status` 应为 `Loaded`，`plugin` 应是你 `new` 的那个实例。如果是 `null`，先检查 `list.ts` 有没有真的 `new` 并放进数组。

想确认依赖阻断，可以把 `dataDeps` 里的某个 id 改成一个不存在的名字再启动：控制台应报缺失依赖错误（`77`，带插件 id 与缺失的依赖 id），并且你的插件没有任何时机输出。插件注册的存档内容如何验证，见[可存档内容](./saveable-content.md)的「验证」一节。

## 边界与注意

- <strong>在 awake 里 await</strong>。`awake` 的返回值会被忽略，写 `async awake` 也不会被等待。异步准备放到 `initialize`。
- <strong>把 dataDeps 写成对象</strong>。它必须是 id 字符串数组；插件对象是三个时机方法收到的参数，不是声明时写的东西。
- <strong>对依赖参数判空</strong>。依赖在插件执行前已经解析好，写 `dataDeps[0]?.plugin` 只会掩盖声明错误；直接取 `dataDeps[0].plugin`。
- <strong>依赖成环</strong>。环上的插件全部被排除，依赖它们的下游也不执行。依赖关系要单向。
- <strong>依赖 id 拼错</strong>。插件不会报「找不到类」，而是被当作缺失依赖排除；控制台会给出插件 id 与缺失的 id。
- <strong>用 getDataPlugin 不判空</strong>。它查的是注册表，可能返回 `null`，也可能还没到你需要的阶段。
- <strong>直接改其他系统的内部字段</strong>。插件之间应通过公开方法与接口协作；直接改私有字段会绕开对方维护的一致性逻辑。

## 小结

- 插件把一组对象与它们的生命周期收进一个独立单元，在对应端的 `list.ts` 里 `new` 一次。
- 数据端与渲染端的写法一一对应；`dataDeps` 声明数据端依赖，渲染端另有 `clientDeps`；渲染端可以依赖数据端，数据端不能依赖渲染端。
- `awake` 在构造期同步执行，不能等异步；`initialize` 在加载前、`afterLoad` 在加载后，二者都会阻塞。
- 三个阶段都按依赖顺序走；循环依赖、缺失依赖会连同下游一起被阻断。
- 插件可以被其他插件调用，也可以在钩子、事件或任何拿得到主对象的地方按 id 取回调用。

返回[高级 I 导览](./index.md)。
