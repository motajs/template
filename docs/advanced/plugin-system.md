# 插件系统

如果你已经用过中级教程里的[数据插件](../intermediate/data-plugins.md)，你会知道插件能把一组功能打包、挂到 `state` 上，并按固定时机初始化。那一篇停在「会用」；这一篇讲「能自己设计并维护」。

插件是高级 I 的核心：后面的可存档内容、录像一致性、钩子深入，实际都挂在某个插件上。读完本篇，你应该能独立写出一个插件、让插件彼此协作，并知道为什么插件的 `id` 不能随便改。

阅读前需要会基础语法：`class`、`new`、`import`、`async` / `await`。不需要懂引擎内部实现；涉及内部机制的地方，会先说清「你能拿它做什么」。

## 插件解决什么问题

假设你要加一个任务系统：它有自己的状态、自己的管理器，还要在加载完地图后读一遍任务配置。不做成插件的话，这些代码会散在几个地方——对象在 `src/data/initialize.ts` 里 `new`，存档注册也写在那里，加载后的初始化再塞进某个钩子。功能一多，`initialize.ts` 会变成所有人的公共草稿纸。

插件把这一组东西收进一个独立单元：

- 自己的对象在自己的目录里创建；
- 自己的存档内容在自己的 `awake` 里注册；
- 自己的加载后逻辑在自己的 `afterLoad` 里写；
- 启动时只需要在 `dataPlugins` 里 `new` 一次。

这和[声明式接口](./declarative-vs-imperative.md)是同一个思路：你不去改引擎的初始化流程，只声明「在哪个时机做什么」，时机由引擎统一调用。

还有一层现实理由：`src` 是你自己的代码，升级引擎时一般不用动；而内置包（`packages` / `packages-user`）在升级时可能会变。新增系统优先做成插件，等于把改动留在自己的地盘里，升级时要跟的差异更少。

## 最小插件

### IDataPluginDefine 的五个成员

一个插件实现 `IDataPluginDefine`：

| 成员                              | 类型                                     | 说明                         |
| --------------------------------- | ---------------------------------------- | ---------------------------- |
| `id`                              | `string`                                 | 插件标识符，全局唯一         |
| `dependencies`                    | `string[]`                               | 依赖的插件 id 数组           |
| `awake(state, dependencies)`      | `(state, dependencies) => void`          | 同步初始化，主对象构造期调用 |
| `initialize(state, dependencies)` | `(state, dependencies) => Promise<void>` | 异步初始化，加载开始前调用   |
| `afterLoad(state, dependencies)`  | `(state, dependencies) => Promise<void>` | 加载完毕后调用               |

只看类本身，最小实现如下（完整文件见下文「示例：一个完整插件」）。方法里用不到的参数可以省略，现有的 `DataShopPlugin` 就只收了 `state`：

```ts
import { ICoreState, IDataPluginDefine } from '@user/data-state';

// 一个最小插件：只有 id、dependencies 和三个时机方法
export class MyPlugin implements IDataPluginDefine {
    readonly id = 'my-plugin';
    readonly dependencies: string[] = [];

    awake(state: ICoreState): void {
        // 在这里装配插件自己的对象
    }

    async initialize(state: ICoreState): Promise<void> {}

    async afterLoad(state: ICoreState): Promise<void> {}
}
```

这里最容易混淆的是 `dependencies` 的两种形态：

- <strong>定义插件时</strong>，`dependencies` 是依赖插件的 <strong>id 字符串数组</strong>；
- <strong>三个时机方法收到时</strong>，`dependencies` 参数是这些 id 解析后的<strong>插件对象数组</strong>，元素类型是 `IDataPlugin`，含 `plugin` 与 `status` 两个字段。

所以「声明依赖」写的是 `id`，真正拿到的却是对象。两者不要混着写。

### 注册到 dataPlugins

插件写好后，在 `src/data/plugin/list.ts` 的 `dataPlugins` 数组里<strong>追加</strong>一项，不要清空或替换已有插件。列表里现在已经有商店插件：

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

如果你改的是<strong>已有插件</strong>，它对应的 `import` 通常已经在文件顶部，不要重复粘；如果你是<strong>新建插件</strong>，`list.ts` 里不会有你的类名，必须自己补一行 `import { MyPlugin } from './my-plugin';`（路径指向你的插件目录）。只把数组写成 `[new MyPlugin()]` 会把商店插件挤掉。

数据端启动时会遍历这个数组，把插件收进注册表。同一个 `id` 出现两次时，后一个会被忽略，控制台报一条错误（错误码 `78`），所以请保证 `id` 唯一。

## 三个生命周期进阶

三个时机在启动流程里的位置是固定的。按 `CoreState` 的实际执行顺序，可以画成这样：

```text
CoreState 构造
  └─ awake        同步执行，全部可初始化插件依次完成
load() 开始
  ├─ initialize   异步，加载开始前
  ├─ loader.start()   真正加载数据、产出进度
  └─ afterLoad    异步，加载完毕后
```

数据端主对象在构造时就会调用 `awake`；之后由 `load()` 依次执行 `initialize`、加载、`afterLoad`。`state` 本身的入口与常用对象见[数据端总览](../intermediate/data-state-overview.md)。

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

三个阶段都走同一份依赖排序结果：被依赖的插件先完成同一阶段，依赖它的一方才会开始。也就是说，插件 B 的 `awake` 开始时，它声明的依赖插件 A 一定已经 `awake` 完毕。

## dependencies 与排序

### 排序规则

引擎内部用 `orderPlugins` 计算顺序，结果包含三样东西：

| 字段      | 含义                                                    |
| --------- | ------------------------------------------------------- |
| `order`   | 可以初始化的插件拓扑序，被依赖者在前                    |
| `cyclic`  | 处于依赖环中的插件 id                                   |
| `missing` | 直接引用了不存在依赖的插件 id，以及它缺失的依赖 id 列表 |

排序只保证一件事：<strong>依赖关系成立时，被依赖的插件先完成，依赖它的后完成</strong>。不构成依赖关系的插件之间，引擎按登记顺序扫描，但这不是可以依赖的契约——需要谁先谁后，就显式声明依赖。

这份顺序在主对象构造时算一次，之后不会重算。启动后修改某个插件的 `dependencies` 数组不会改变顺序，也没有接口在运行时追加插件。依赖在启动前定好。

### 失败语义：循环依赖与缺失依赖

依赖写错不会「部分生效」，而是整条链路被阻断：

- <strong>循环依赖</strong>：能沿依赖边绕回自身的插件都会被记进 `cyclic`，控制台报一条错误（错误码 `76`），列出环上的 id；
- <strong>缺失依赖</strong>：`dependencies` 里写了一个没有注册的 id，该插件会被记进 `missing`，控制台按「插件 id + 缺失的依赖 id」逐条报错（错误码 `77`）；
- <strong>下游阻断</strong>：依赖了上述插件的插件，也会一起被排除。被排除的插件不会进入 `order`，三个时机一个都不会执行。

也就是说，一处依赖写错，受影响的不只是那一个插件，而是依赖它的整条链。排查时先看控制台里的错误码和 id，再顺链往上找。

依赖尽量少：每多一条依赖，就多一个「对方改名或失败会拖住自己」的机会。只依赖你确实要调用的插件。

## 插件之间怎么调用

### 用依赖参数直接调用

声明了依赖，最直接的方式就是用方法参数里的插件对象。注意它是 `IDataPlugin` 包装对象，你要取 `.plugin`：

```ts
// 插件 B 依赖插件 A，并在初始化时调用 A 的方法
export class PluginB implements IDataPluginDefine {
    readonly id = 'plugin-b';
    readonly dependencies = ['plugin-a'];

    awake(
        state: ICoreState,
        dependencies: IDataPlugin<IDataPluginDefine>[]
    ): void {
        // 参数顺序与 dependencies 数组一致
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
// 取回插件，先判空，再确认状态
const holder = state.getDataPlugin<PluginA>('plugin-a');
if (holder && holder.status === PluginStatus.Loaded) {
    holder.plugin.doSomething();
}
```

两个检查都不能省：

- 返回 `null` 表示没有这个 `id`，可能是没注册，也可能是拼写错了；
- `status` 没到你要的阶段，说明它还没执行到那一步，此时调用它的方法可能读到还没装配好的字段。

如果在启动阶段就要用某个插件，优先声明依赖，让引擎保证顺序；`getDataPlugin` 更适合可选的、运行中才发生的调用。

## 插件 id 稳定性与版本迁移

### 插件 id 与可存档 id 是两套命名

这是最容易混的一处。插件有插件 id，它注册的可存档内容另有存档 id，两者互不相干：

| 名称    | 例子               | 用在哪                                          |
| ------- | ------------------ | ----------------------------------------------- |
| 插件 id | `data-shop-plugin` | `dataPlugins` 注册表、其他插件的 `dependencies` |
| 存档 id | `@plugin/shop`     | `state.addSaveableContent(id, content)`         |

商店插件就是现成的例子：它的插件 id 是 `data-shop-plugin`，在 `awake` 里注册的存档内容却是 `@plugin/shop`。这两个字符串没有任何推导关系，不要以为改了插件 id 存档 id 会跟着变，也不要从插件 id 猜存档 id。

### 迁移时的最小做法

插件 id 会被别的插件的 `dependencies` 引用，所以它是一份对外契约：

- <strong>不要随意改名</strong>。改名后，依赖它的插件会变成「缺失依赖」，整条链被阻断；
- <strong>不要复用旧 id 表示新语义</strong>。旧依赖方仍然能找到这个 id，但拿到的是另一套对象，运行时会以「方法不存在」之类的形式炸掉，而且很难从依赖声明上看出来。

需要演进时，按改动大小选最小做法：

1. <strong>行为兼容的升级</strong>：保留原 `id`，只改实现。依赖方不需要动。
2. <strong>语义确实变了</strong>：新增一个 id，不要复用旧 id；同时把所有依赖方的 `dependencies` 一起改掉，不要分几次发布。
3. <strong>必须过渡</strong>：让旧 id 继续注册一个兼容实现（或做转发），等所有依赖方迁完再删。
4. <strong>存档 id 尽量不动</strong>：读档时按存档 id 找内容，改了它，旧存档里的数据就对不上——当前对象会报「缺少存档数据」，旧数据则会成为多余键。确实要改时，需要自己写迁移逻辑（读档后从旧 id 取数据写进新对象），不要只改字符串。

## 注册与目录

插件放在 `src/data/plugin/` 下自己的目录里。现有商店插件的形状可以作为参考：

| 文件                                    | 放什么                               |
| --------------------------------------- | ------------------------------------ |
| `plugin.ts`                             | 插件类本身，实现 `IDataPluginDefine` |
| `types.ts`                              | 插件对外接口、存档数据结构           |
| `state.ts` / `manager.ts` / `system.ts` | 插件自己的对象，按需创建             |
| `index.ts`                              | 统一导出                             |

然后在 `list.ts` 里 `new` 出来加进 `dataPlugins`。最终传给 `CoreState` 的插件数组在 `src/data/entry.ts` 里拼成：主插件在前，`dataPlugins` 展开在后。日常只需要改 `list.ts`，不必动 `entry.ts`。

这是少数<strong>应该新建文件与目录</strong>的场景：插件本身就是一个独立单元，把它的类、接口和对象放在一起，比全部塞进 `initialize.ts` 更容易维护。除此之外的普通效果直接写在对应的内置实现文件里，不要为每个效果新建目录。

## 示例：一个完整插件

假设要新建一个插件：它要能被启动流程加载，并拥有自己的对象与存档内容。插件放在 `src/data/plugin/` 下自己的目录里，下面这份代码写在新建的 `plugin.ts` 中，顶部的 `import` 要一起保留：

```ts
import { ICoreState, IDataPlugin, IDataPluginDefine } from '@user/data-state';

// 插件类：实现 IDataPluginDefine 的五个成员
export class MyPlugin implements IDataPluginDefine {
    // 插件 id：全局唯一，发布后不要改，其他插件可能依赖它
    readonly id = 'my-plugin';
    // 依赖的插件 id 字符串数组；没有依赖就留空
    readonly dependencies: string[] = [];

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
        dependencies: IDataPlugin<IDataPluginDefine>[]
    ): Promise<void> {
        // 加载开始前要做的事；可以 await，但会阻塞加载
    }

    async afterLoad(
        state: ICoreState,
        dependencies: IDataPlugin<IDataPluginDefine>[]
    ): Promise<void> {
        // 需要读取加载内容时写在这里
    }
}
```

`MySystem` 是你自己写的类，文档不会替你定义。先按需求写出这个类；暂时没有对应对象时，把 `mySystem` 字段、`new MySystem(state)` 以及相关的 `addSaveableContent` 一起删掉，否则编译器会报「找不到名称 MySystem」。

写好后，把插件追加到 `src/data/plugin/list.ts` 的 `dataPlugins` 数组末尾，并补上新建文件的 `import`：

```ts
import { IDataPluginDefine } from '@user/data-state';
import { DataShopPlugin } from './shop';
// 新建插件文件时补上这一行；改已有插件则复用它原有的 import
import { MyPlugin } from './my-plugin';

/** 数据端插件列表 */
export const dataPlugins: IDataPluginDefine[] = [
    new DataShopPlugin(),
    // 追加到末尾，不要替换上面的已有插件
    new MyPlugin()
];
```

只把数组写成 `[new MyPlugin()]` 会把商店插件挤掉。注册进 `dataPlugins` 只是第一步：`awake` 里的异步工作不会被等待；`initialize` 与 `afterLoad` 里启动的异步任务必须 `await`，否则阶段会提前结束。注册位置只有 `list.ts` 的数组，不要另外找地方调用插件方法。

需要定制时，通常只改这几处：

- <strong>类名与 id</strong>：`MyPlugin` 与 `my-plugin` 换成你的名字，`id` 全局唯一。
- <strong>dependencies</strong>：填依赖插件的 id 字符串；没有就保持空数组，不要填插件对象。
- <strong>awake 里的装配</strong>：换成你自己的对象。需要进存档的对象必须实现 `ISaveableContent`（`saveState` / `loadState`），细节见[可存档内容](./saveable-content.md)。
- <strong>存档 id</strong>：`@plugin/my-plugin` 换成你自己的存档 id，与插件 id 分开命名。
- <strong>initialize / afterLoad</strong>：用不到就留空方法；用到时按需加逻辑。

## 示例：读一个现有插件

### DataShopPlugin：awake 里装配并注册存档

商店插件是 `dataPlugins` 里当前唯一的独立插件，适合逐段对照。它的代码在 `src/data/plugin/shop/plugin.ts`：

```ts
export class DataShopPlugin implements IShopPlugin {
    id: string = 'data-shop-plugin';
    dependencies: string[] = [];

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
- `state.addSaveableContent('@plugin/shop', this.manager)` 把管理器注册为存档内容。<strong>注册的是管理器，不是插件本身</strong>；存档 id 也另起了一套命名。这样读档时恢复的是商店数据，插件对象本身不需要进存档；
- `initialize` 与 `afterLoad` 都是空的：商店不依赖加载内容，装配在 `awake` 就完成了。

`IShopPlugin` 在 `IDataPluginDefine` 之上加了 `shop`、`manager`、`createShopState`，这就是「插件对外暴露能力」的写法。别的插件依赖它时，就能直接调用这些成员。

### MainDataPlugin：afterLoad 读取加载后的配置

主插件 `src/data/initialize.ts` 的 `MainDataPlugin` 是 `afterLoad` 的典型用法。它的 `awake` 负责装配朝向、寻路、加载钩子与各系统；创建勇士则放到 `afterLoad`：

```ts
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
```

这段为什么不能放进 `awake`：`coreConfig` 来自 `core.jsonc`，要等加载器读完才有。`awake` 阶段 `getConfig` 拿不到内容，创建勇士就会失败。`afterLoad` 正好是「加载已完成、但游戏还没正式开始」的时机。

它同时说明了另一个点：`afterLoad` 拿到的 `state` 与 `awake` 是同一个主对象，`awake` 里存下的引用（如 `this.heroFace`）此时仍然可用。

## 改现有插件还是新建插件

先分清两种改动：

- 只是给现有插件加一点行为，例如给商店多一个查询接口、调整某个系统的默认值——<strong>直接改现有插件的代码</strong>，在它的类里加方法或改实现；
- 要加一组独立的功能，有自己的状态、自己的管理器、自己的存档内容——<strong>新建插件</strong>。新建的插件同样留在 `src` 里，升级时不用跟着内置包的差异走。

这里说的「改内置」只指改 `packages` / `packages-user` 里的代码。新增系统优先做成插件，正是为了不碰它们；只有现有插件与扩展点都覆盖不了、必须替换内置行为时，才去动内置包。

## 常见错误

- <strong>在 awake 里 await</strong>。`awake` 的返回值会被忽略，写 `async awake` 也不会被等待。异步准备放到 `initialize`。
- <strong>把 dependencies 写成对象</strong>。它必须是 id 字符串数组；插件对象是三个时机方法收到的参数，不是声明时写的东西。
- <strong>依赖成环</strong>。环上的插件全部被排除，依赖它们的下游也不执行。依赖关系要单向。
- <strong>依赖 id 拼错</strong>。插件不会报「找不到类」，而是被记为缺失依赖并从 `order` 中排除；控制台会给出插件 id 与缺失的 id。
- <strong>用 getDataPlugin 不判空</strong>。它可能返回 `null`，也可能处于你还没等到阶段。
- <strong>把插件 id 当显示名随意改</strong>。别的插件的 `dependencies` 会立刻失效，存档 id 也不会跟着变。
- <strong>直接改其他系统的内部字段</strong>。插件之间应通过公开方法与接口协作；直接改私有字段会绕开对方维护的一致性逻辑。
- <strong>重复注册同一个 id</strong>。后一个会被忽略并报错（`78`），你以为生效的插件其实没有进注册表。

## 验证

想确认三个时机按顺序发生，可以在插件的三个方法里各放一条可观察信号：

```ts
// [验证] 用提示确认时机顺序
awake(state: ICoreState): void {
    state.emitTip('my-plugin: awake');
}

async initialize(state: ICoreState): Promise<void> {
    state.emitTip('my-plugin: initialize');
}

async afterLoad(state: ICoreState): Promise<void> {
    state.emitTip('my-plugin: afterLoad');
}
```

把插件加进 `dataPlugins` 后启动，三条提示应依次出现：`awake` 最早，`initialize` 在加载开始前，`afterLoad` 在加载结束后。用控制台输出也可以，只要顺序能被观察到。

启动完成后，用 `state.getDataPlugin` 取回插件，确认它已经进了注册表：

```ts
// [验证] 取回插件并检查状态
const holder = state.getDataPlugin<MyPlugin>('my-plugin');
console.log(holder?.status === PluginStatus.Loaded, holder?.plugin);
```

`PluginStatus` 从 `@user/data-state` 引入，`MyPlugin` 从你的插件文件引入。`status` 应为 `Loaded`，`plugin` 应是你 `new` 的那个实例。如果是 `null`，先检查 `list.ts` 有没有真的 `new` 并放进数组。

要确认插件注册的存档内容能恢复，先存档，再改动它，然后读档。两个入口同样在主对象上：`state.saveState(compression)` 返回一份 `ReadonlyMap<string, unknown>`，`state.loadState(snapshot, compression)` 再用同一份映射恢复。把下面几行放进一个能拿到 `state` 的临时函数执行一次：

```ts
// [验证] 存档，改掉可观察值，再读档；类名与路径换成你自己的
import { SaveCompression } from '@user/data-common';
import { MyPlugin } from './plugin/my-plugin';

const plugin = state.getDataPlugin<MyPlugin>('my-plugin')?.plugin;
if (plugin) {
    // store 换成你插件里实际注册的可存档对象
    plugin.store.setValue('count', 1);
    const snapshot = state.saveState(SaveCompression.NoCompression);

    plugin.store.setValue('count', 2);
    state.loadState(snapshot, SaveCompression.NoCompression);
    console.log(plugin.store.getValue('count')); // 应为 1
}
```

这里假设插件用[可存档内容](./saveable-content.md)里的 `MySaveable` 作为注册对象，它带有 `setValue` / `getValue`；换成你自己的对象时，把 `plugin.store` 与这两个方法一起替换掉。读档后应回到存档时的值。没恢复时依次检查：对象有没有实现 `ISaveableContent`、有没有在 `awake` 里用 `state.addSaveableContent` 注册、`saveState` 返回的数据里有没有漏字段。完整的验证写法（含三档压缩与修改映射）见[可存档内容](./saveable-content.md)的「验证」一节。

最后可以故意把 `dependencies` 里的某个 id 改成一个不存在的名字，重新启动。此时应出现两条现象：控制台报缺失依赖错误（错误码 `77`，带插件 id 与缺失的依赖 id），你的插件没有任何时机输出。改回正确 id 后应恢复正常。这一步能让你亲眼看到「阻断」不是只影响被写错的插件。

## 小结

- 插件把一组对象与它们的生命周期收进一个独立单元，启动时在 `dataPlugins` 里 `new` 一次。
- `dependencies` 声明的是 id 字符串；三个时机方法收到的是解析后的插件对象。
- `awake` 在构造期同步执行，不能等异步；`initialize` 在加载前、`afterLoad` 在加载后，二者都会阻塞。
- 三个阶段都按依赖顺序走；循环依赖、缺失依赖会连同下游一起被阻断。
- 插件 id 是对外契约，不要随意改名或复用；它与可存档 id 是两套命名。
- 新增系统优先写成插件；只有必要时才改内置包。

返回[高级 I 导览](./index.md)。
