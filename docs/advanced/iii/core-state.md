# CoreState 组装与初始化

数据端主对象 `CoreState` 是数据端的组合根。构造它时，所有子系统按层装配好、插件注册并排序、装配期回调同步执行；调用 `load()` 时，加载按固定次序推进。存档对象、存档执行器与加载器也都挂在它身上。

本篇只讲数据端的装配与生命周期。数据端插件怎么写见[插件系统](../i/plugin-system.md)，可存档内容的形状与压缩见[可存档内容](../i/saveable-content.md)。

## 系统模型

组合根存在的理由只有三条：读者拿到的所有入口都从它出发；层与层之间由它注入，不需要各自寻找依赖；生命周期只有一套，构造、加载、存档都按同一顺序推进。

| 层               | 放什么                                           | 一句话职责                             |
| ---------------- | ------------------------------------------------ | -------------------------------------- |
| Layer 0 公共数据 | 朝向、图块 / 道具 / 地图 / 事件 / 怪物仓库、录像 | 不依赖其它层，提供工具性接口与原始数据 |
| Layer 1 状态基座 | 标记、地图、勇士、怪物管理                       | 保存需要进存档的运行时状态             |
| Layer 2 系统层   | 怪物上下文、战斗、事件、寻路                     | 在状态之上执行游戏逻辑                 |
| Layer 3 顶层     | 加载管理器、加载器                               | 面向启动流程的入口                     |

```text
CoreState
  ├─ Layer 0  公共数据：朝向、仓库、录像
  ├─ Layer 1  状态基座：标记、地图、勇士、怪物管理
  ├─ Layer 2  系统层：怪物上下文、战斗、事件、寻路
  ├─ Layer 3  顶层：加载管理器、加载器
  ├─ 插件注册表：id → 插件，按依赖排出固定顺序
  └─ 存档：可存档对象映射 + 执行器绑定
```

层号只表示装配先后与依赖方向：上层可以拿下层，下层不反向依赖上层。需要回指主对象的子系统在构造时就会拿到它，这一点在后面的装配顺序里展开。

## 入口的职责

启动数据端只需要两个函数和一个主插件：

- 数据端入口只重新导出创建函数。业务代码从统一入口导入 `createCoreState`，不需要直接接触构造器。
- 配置入口 `createCoreStateConfig(starter)` 组装四样东西：加载 starter、核心配置地址、插件列表与事件注册。插件列表把主插件放在最前面，再展开插件列表文件里的业务插件。
- 创建函数 `createCoreState(starter)` 用上面的配置构造实例，返回尚未异步初始化的主对象；加载要由调用方推进，见[加载管线](#加载管线)。

主插件 `MainDataPlugin` 承担数据端的内置装配，在 `awake` 里依次做：

- 注册四方向与八方向朝向处理器；
- 为寻路注入通行谓词，把图层先置空，并把移动器指向勇士；
- 为勇士换上默认的顶层移动实现；
- 添加默认加载钩子；
- 初始化敌人、录像与钩子；
- 注册五个可存档对象。

这五个存档 id 与对象一一对应：

| 存档 id          | 对象                 |
| ---------------- | -------------------- |
| `@system/hero`   | `state.hero`         |
| `@system/flags`  | `state.flags`        |
| `@system/maps`   | `state.maps`         |
| `@system/enemy`  | `state.enemyManager` |
| `@system/replay` | `state.replaySystem` |

存档 id 与插件 id 是两套命名。注册规则、重复 id 的处理与执行器绑定见[可存档内容](../i/saveable-content.md#注册到存档系统)。

主插件的 `afterLoad` 在加载完成后才执行：它从加载器取核心配置，再用配置里的初始属性与坐标创建勇士的属性与位置。属性与位置不能放进 `awake`，因为那时核心配置还没读出来。

## 加载管线

`state.load()` 是一个异步迭代器，按固定四步推进：

```text
load()
  ├─ 1. 插件 initialize      异步，加载开始前
  ├─ 2. loader.start()       异步迭代，真正加载数据
  ├─ 3. 插件 afterLoad       异步，加载完成后
  └─ 4. 检查插件状态          未到 Loaded 的插件逐个告警
```

`initialize` 放在加载前，是因为此时还可以往加载器里追加配置；插件要在加载前完成的异步准备也放在这里。`loader.start()` 依次读取核心配置、额外配置与自定义任务，并产出加载进度。`afterLoad` 放在加载后，因为此时核心配置、地图与其它内容才可读。最后一步只做检查：正常走完三个阶段的插件状态都是 `Loaded`，不是的会被点名。

`load()` 与 `loader.start()` 都是异步迭代器：拿到迭代器不等于加载开始，必须把迭代推进完。`load()` 只负责初次加载，玩家读档不会重跑这条管线。

## 存档挂载

存档系统只认识两样东西：注册过的可存档对象，以及绑定在这些对象上的执行器。两者都挂在主对象上。

- 注册：`state.addSaveableContent(id, content)`。id 在整份存档里唯一；重复注册会告警，并且只有第一个注册的对象生效。
- 绑定：`state.bindSaveableExecuter(content 或 id, executor)`。传对象时，对象必须已经注册，否则告警并忽略；传 id 时，找不到对应对象会静默返回。
- 读档：主对象先清掉残留的录像禁用标记，再逐个对象执行 `loadState`。每个对象的 `loadState` 都被录像禁用与恢复包裹，读档本身不会记进录像；执行器在这层包裹之外运行，因为它可能需要做出需要记录的行为。

下面这个函数注册一个计数对象并绑定执行器：

```ts
// 存档形状：只放重建必需的字段
interface ICounterSave {
    readonly count: number;
}

// 可存档对象：负责在活对象与存档数据之间转换
class CounterSaveable implements ISaveableContent<ICounterSave> {
    private count = 0;

    add(delta: number): void {
        this.count += delta;
    }

    // 返回独立的新对象，不能返回 this
    saveState(): ICounterSave {
        return { count: this.count };
    }

    // 按存档覆盖运行时状态，不保留旧值
    loadState(state: ICounterSave): void {
        this.count = state.count;
    }
}

// 执行器：当前对象 loadState 返回后立即运行
class CounterExecutor implements ISaveableExecutor<ICounterSave> {
    afterLoad(data: ICounterSave, state: ICoreState): void {
        // 此时只保证当前对象已经恢复，不要假设其它对象也恢复完毕
        console.log('计数已恢复：', data.count, state);
    }
}

// 注册并绑定：通常写在插件的 awake 里
export function registerCounter(state: ICoreState): void {
    const counter = new CounterSaveable();
    // 存档 id 必须唯一；重复注册会告警并忽略后一个
    state.addSaveableContent('@plugin/counter', counter);
    // 传对象或注册 id 都可以；对象要先注册，再绑定
    state.bindSaveableExecuter(counter, new CounterExecutor());
}
```

## 在游戏内另建一个数据端实例

构造器不依赖全局单例。只要传一份完整配置，就能在游戏内或脚本里再建一个独立的数据端实例，与主实例并行运行；回放、结果对比、离线校验都可以这样做。

配置有四个必填字段：加载 starter、核心配置地址、插件列表与事件注册。缺任何一项，构造期就会失败；也不能只给加载 starter 与核心配置地址。

```ts
// 再建一个数据端实例：与主实例完全独立
export async function createSecondaryState(
    loadStarter: ILoadTaskStarter,
    coreURL: string,
    dataPlugins: ICoreStateConfig['dataPlugins'],
    events: ICoreStateConfig['events']
): Promise<ICoreState> {
    // 四个字段都必填：构造期就要用它们装配加载器与插件
    const config: ICoreStateConfig = {
        loadStarter,
        coreURL,
        dataPlugins,
        events
    };

    // 新实例不共享主实例的勇士、地图、事件仓库或存档
    const state = new CoreState(config);

    // load() 是异步迭代器：必须消费它，加载才真正推进
    for await (const _loadedBytes of state.load()) {
        // 这里可以读取加载进度，也可以忽略
    }

    return state;
}
```

两个实例各自持有自己的子系统与存档映射，互不影响。要让第二个实例与主实例行为一致，就传同一组插件列表与事件注册，并确保主插件也在列表里；需要另一套规则时，换一组插件与事件即可。

## 内部实现：装配顺序

此章节讲解一下 CoreState 的装配顺序的内部实现。

构造器按四层顺序创建全部子系统，再处理插件。层与层之间不是随便排列的：每一层只使用已经装好的下层，并把自己暴露给上层。

| 层          | 装入的子系统                                                                                                                                                                            | 为什么在这一层                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| L0 公共数据 | 朝向绑定器 `roleFace`、朝向管理器 `faceManager`、图块仓库 `tileStore`、道具仓库 `itemStore`、地图仓库 `mapStore`、事件仓库 `eventStore`、怪物仓库 `enemyStore`、录像系统 `replaySystem` | 不依赖其它子系统，先建好供所有层使用     |
| L1 状态基座 | 标记系统 `flags`、地图状态 `maps`、勇士状态 `hero`、怪物管理 `enemyManager`                                                                                                             | 保存需要进存档的运行时状态               |
| L2 系统层   | 怪物上下文 `enemyContext`、战斗流程 `combat`、事件系统 `eventSystem`、寻路系统 `pathfinding`                                                                                            | 在状态之上执行逻辑，构造时需要拿到主对象 |
| L3 顶层     | 加载管理器 `loadManager`（`LoadManager`）、数据加载器 `loader`                                                                                                                          | 面向启动流程；加载器随后登记核心配置地址 |

L0 内部也有先后：道具仓库与怪物仓库依赖图块仓库，所以图块仓库先建。L1 与 L2 里有几个子系统需要回指主对象，构造时就把当前实例传进去：地图、勇士、怪物上下文、战斗、事件系统与寻路都属于这一类。L3 的加载器不反向引用主对象，它只拿加载管理器与 starter，再把核心配置登记为自己的第一份配置。

四层装完后才处理插件：先遍历插件列表建立注册表，重复 id 在这里告警并跳过；再按每个插件声明的 `dataDeps` 建依赖表，调用一次 `orderPlugins` 得到固定顺序；最后同步执行 `awake`，把已排好序的插件逐个装配。装配期回调结束后，构造器返回，异步初始化与加载还没有开始。插件状态推进与依赖排序的细节见[插件内部机制](./plugin-internals.md)。

## 边界与注意

- **加载必须被迭代推进**：`createCoreState` 只构造实例；`load()` 是异步迭代器，不消费它，加载不会开始，插件也不会进入 `Loaded`。
- **配置四个字段都必填**：加载 starter、核心配置地址、插件列表、事件注册缺一不可。
- **重复可存档 id 只保留第一个**：后一个注册会告警并被忽略，不是覆盖。
- **执行器绑未注册对象会告警**：传对象前先调用 `addSaveableContent`；传 id 时找不到对象则静默返回。
- **读档的键要对得上**：存档缺少某个已注册 id 会告警并跳过；存档多出未注册 id 会在读完时告警。
- **插件未到完成态会被告警**：`load()` 结束时会逐个检查，状态不是 `Loaded` 的插件都会被点名。
- **读档期间录像被临时禁用**：每个对象的 `loadState` 都被禁用与恢复包裹，执行器不在包裹内。
- **不要重排装配顺序**：层与层之间的依赖是固定的，重排会让需要回指主对象的子系统拿不到已装配的下层。
- **不要手动构造内部子系统**：需要新能力时新增插件，或通过公开入口扩展；自己创建内部对象会绕过存档、录像与生命周期管理。

返回[高级 III 导览](./index.md)。
