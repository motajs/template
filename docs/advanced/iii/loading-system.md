# 加载系统

一次加载把游戏运行所需的外部数据取到内存：核心配置、地图与图块、道具与敌人，以及你自己定义的资源。数据端把这套过程拆成可组合的三层：单个资源由 `LoadTask` 描述，多个任务由 `LoadManager` 聚合，阶段顺序由 `MotaDataLoader` 编排。

这样拆分的好处是每一层都能单独替换：换一个加载环境只需要换 starter，加一种资源只需要加一个任务，加一份配置只需要在正确的阶段追加。

本篇先讲模型与阶段顺序，再讲三类扩展点；进度只作为可观察量，最后用一小节说明渲染端如何在接口层消费同一个加载器。

## 系统模型

| 对象               | 职责                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| `LoadTask<T, R>`   | 描述一个资源：用 starter 取响应，按 `dataType` 读取，再交给 processor 产出 `R` |
| `LoadManager`      | 聚合多个任务，累计任务数与字节数，并用异步迭代器推进加载                       |
| `MotaDataLoader`   | 按阶段编排核心配置、额外配置与自定义任务，并暴露 `getConfig`                   |
| `ILoadTaskStarter` | 环境适配点：决定「怎么取响应」，网页端由 `WebLoadStarter` 用 `fetch` 实现      |

`LoadTask` 的泛型有两个参数：`T` 是响应数据类型（`LoadDataType`），`R` 是 processor 处理后的结果。构造任务时至少要给 `identifier`、`url` 与 `dataType`；任务本身不知道环境，所有取数据的工作都交给 starter。

`LoadManager` 不关心任务加载的是什么，只维护两个集合与两个计数：已加入的任务、已完成的任务，以及已加载字节与加载总量。它提供的 `load()` 是一个异步迭代器，迭代值就是当前已加载的字节数。

`MotaDataLoader` 是数据端的加载入口。它持有 `manager` 与 `starter`，负责把配置文件与自定义任务按顺序交给管理器，并在阶段之间触发钩子。

`ILoadTaskStarter` 把「取响应」抽象成 `start(request)`，返回 `IResponseLike`。`WebLoadStarter` 只是用 `fetch` 实现它；换到别的环境时，换一个 starter 即可，任务、处理器与阶段编排都不用改。

```text
LoadTask ──starter──> IResponseLike ──processor──> R
    │
LoadManager 聚合多个 LoadTask，维护任务数与字节数
    │
MotaDataLoader 按阶段把任务交给 LoadManager
```

## 一次加载的阶段

`MotaDataLoader.start()` 按固定顺序推进，前一段没有完成就不会进入下一段：

1. 加载核心配置（`addCoreConfig` 登记的任务）。
2. 触发 `onCoreConfigLoaded`，此时可以继续追加额外配置。
3. 加载额外配置（`addExtraConfig` 登记的任务）。
4. 触发 `onExtraConfigLoaded`，此时可以追加自定义任务。
5. 加载自定义任务（`addCustomTask` 登记的任务）。
6. 全部任务完成，`loaded()` 兑现。

```text
核心配置 → onCoreConfigLoaded → 额外配置 → onExtraConfigLoaded → 自定义任务 → 完成
```

这个顺序决定了两条最常用的规则；判断「来不来得及」看的是对应的收集循环有没有跑过，而不是 `start()` 有没有被调用：

- `addExtraConfig` 必须在第 3 步的收集循环之前：在加载开始前，或在 `onCoreConfigLoaded` 里调用。放到 `onExtraConfigLoaded` 里已经太晚，本次加载不会再读取它。
- `addCustomTask` 必须在第 5 步的收集循环之前：在加载开始前，或在 `onCoreConfigLoaded` / `onExtraConfigLoaded` 里调用都可以。等到自定义任务已经开始加载，或加载结束后再追加，本次加载不会读取它。

`start()` 只会真正执行一次，第二次调用会因为已经加载过而直接返回，所以错过窗口没有补读机会。

[`CoreState.load()`](./core-state.md#加载管线) 在加载器外面又包了两层插件时机：插件的 `initialize()` 在 `loader.start()` 之前执行，`afterLoad()` 在加载完成之后执行。因此 `initialize` 适合追加配置或自定义任务，`afterLoad` 适合读取已经加载好的配置。插件三个时机的完整语义见[插件系统](../i/plugin-system.md#生命周期)。

## 配置文件与处理器

配置文件是一种带有系统前缀的 JSONC：注释集中放在文件开头，最后一行注释固定为 `// --- SYSTEM PREFIX END --- //`，之后才是 JSON 内容。加载器用 `PrefixedJSONCProcessor` 按这行前缀切分，再对后半段做 `JSON.parse`。

前缀缺失或 JSON 解析失败时，加载器会报错并把该配置按空对象处理。也就是说，单个坏文件不会让整次加载中断，但依赖这份配置的后续逻辑会读到空内容。

两类配置的职责不同：

| 方法                      | 用途                                   | 加载时机                             |
| ------------------------- | -------------------------------------- | ------------------------------------ |
| `addCoreConfig(id, url)`  | 核心配置，决定内容清单与顶层信息       | 最先加载                             |
| `addExtraConfig(id, url)` | 额外配置，按核心配置给出的内容目录展开 | 核心配置与 `onCoreConfigLoaded` 之后 |

额外配置的 `url` 相对于内容目录：开发环境是 `src/content`，构建后内容目录会被移动到游戏根目录。配置文件路径由加载器统一改写，不需要自己补环境前缀。默认的数据端钩子 `DefaultDataLoaderHook` 会读取核心配置里的内容目录，追加 `enemy`、`item`、`map-list`、`tile` 等额外配置。

配置文件由编辑器产出，不需要手写 JSONC。

## 扩展点：加一份配置

新增一份配置，通常是在插件的 `initialize` 里调用 `addExtraConfig`。`initialize` 在 `loader.start()` 之前执行，正好赶在额外配置阶段之前。

```ts
import { IDataPluginDefine, ICoreState } from '@user/data-state';

/** 任务配置的形状，按你的配置文件内容声明 */
interface IQuestConfig {
    /** 任务 id 到任务定义的映射 */
    readonly quests: Record<string, { title: string; reward: number }>;
}

// 在数据端插件里追加一份额外配置
export class QuestConfigPlugin implements IDataPluginDefine {
    // 插件标识符，在数据端插件注册表里唯一
    readonly id = 'quest-config-plugin';
    // 本插件不依赖其他插件
    readonly dataDeps: string[] = [];

    // 不需要同步装配，留空
    awake(): void {}

    // initialize 在加载开始前执行，适合追加配置
    async initialize(state: ICoreState): Promise<void> {
        // 路径相对于内容目录，文件由编辑器产出
        state.loader.addExtraConfig('quest', 'quest/quest.jsonc');
    }

    // 额外配置加载完成后，按 id 取回配置
    async afterLoad(state: ICoreState): Promise<void> {
        const config = state.loader.getConfig<IQuestConfig>('quest');
        // 配置缺失时加载器给的是空对象，使用前先判断
        if (!config) return;
        // 在这里把 config.quests 交给自己的任务系统
    }
}
```

`addExtraConfig` 的第一个参数是配置 id，也是 `getConfig` 取回时使用的键；第二个参数是相对于内容目录的路径。同一份配置只需要登记一次，读取时用同一个 id。

如果确实要新增核心配置，用 `addCoreConfig`，并且必须在加载开始前调用。绝大多数扩展只需要额外配置。

## 扩展点：加一种资源

新增一种资源类型，需要三样东西：一个描述资源的 `LoadTask`、一个把原始响应转换成你需要的结果的 processor，以及一个能取响应的 starter。准备好后调用 `addCustomTask`。

```ts
import {
    ILoadTaskStarter,
    ILoadTaskProcessor,
    LoadDataType,
    LoadTask
} from '@motajs/loader';
import { IMotaDataLoader } from '@user/data-state';

/** 自定义资源处理后的结果形状 */
interface IQuestTable {
    /** 任务 id 到任务标题的映射 */
    readonly titles: Record<string, string>;
}

/** 把 JSON 响应整理成任务系统直接可用的结构 */
class QuestProcessor implements ILoadTaskProcessor<
    LoadDataType.JSON,
    IQuestTable
> {
    async process(response: any): Promise<IQuestTable> {
        // 这里只做形状转换，真正的校验放在使用配置的地方
        return { titles: response.titles ?? {} };
    }
}

/**
 * 追加一个自定义资源任务。
 * 在加载开始前，或 onCoreConfigLoaded / onExtraConfigLoaded 中调用。
 */
export function addQuestTask(
    loader: IMotaDataLoader,
    starter: ILoadTaskStarter
): Promise<IQuestTable> {
    // 自定义任务的地址不会被加载器改写：开发环境在 src 下，构建后在根目录
    const url = import.meta.env.DEV
        ? `${import.meta.env.BASE_URL}src/content/quest/quest.json`
        : `${import.meta.env.BASE_URL}content/quest/quest.json`;
    const task = new LoadTask<LoadDataType.JSON, IQuestTable>({
        // 任务标识符，用于区分不同资源
        identifier: 'quest-table',
        // 使用上面按环境计算好的地址
        url,
        // 响应按 JSON 读取，processor 收到的就是解析后的对象
        dataType: LoadDataType.JSON
    });
    // 处理器负责把原始数据变成业务直接可用的结果
    task.setProcessor(new QuestProcessor());
    // 任务不会自动继承加载器的 starter，必须显式设置
    task.setStarter(starter);
    // 返回的 Promise 在这个任务完成后兑现
    return loader.addCustomTask(task);
}
```

`dataType` 五选一：`ArrayBuffer`、`Uint8Array`、`Blob`、`Text`、`JSON`。它决定 processor 收到的是哪种原始值；不设置 processor 时，任务结果就是这份原始值。

自定义任务会和配置任务一起交给同一个 `LoadManager`，所以它们都会出现在加载进度里。`addCustomTask` 返回的 Promise 只表示这一个任务完成，不表示整次加载完成；整次加载的完成时机看 `loader.loaded()`。

## 扩展点：换一个加载环境

换加载环境只需要实现 `ILoadTaskStarter`：`start(request)` 接收请求配置，返回 `Promise<IResponseLike>`。网页端返回的 `Response` 本身就满足 `IResponseLike`，所以自定义 starter 通常只是改请求地址、请求方式或错误处理。

```ts
import {
    ILoadTaskRequest,
    ILoadTaskStarter,
    IResponseLike
} from '@motajs/loader';

/** 把请求改写到另一个来源的启动器 */
export class BaseURLLoadStarter implements ILoadTaskStarter {
    // 目标来源，例如另一台资源服务器
    constructor(private readonly baseURL: string) {}

    start(request: ILoadTaskRequest): Promise<IResponseLike> {
        // 请求地址与请求配置都由调用方给出，starter 只负责取响应
        return fetch(new URL(request.url, this.baseURL), {
            method: request.method,
            body: request.body,
            headers: request.headers
        });
    }
}
```

把 starter 实例传给创建数据端主对象的入口即可，例如 `createCoreState(new BaseURLLoadStarter('https://example.com/'))`。任务、处理器与阶段顺序都不需要改。

同样的抽象也支持本地数据包：把本地目录里的文件包装成 `IResponseLike`，就能让同一套加载流程从本地读取。仓库当前没有提供这种实现，本篇不展开。

## 进度

`LoadManager` 的 `load()` 返回异步迭代器：每推进一次，迭代值就是当前已加载的字节数。`MotaDataLoader.start()` 把同样的迭代值转发出来，所以 `for await` 迭代加载器就能跟着加载进度走。

加载过程中可以读取这些计数：

| 成员               | 含义                           |
| ------------------ | ------------------------------ |
| `getLoadedTasks()` | 已经加载完成的任务数           |
| `getAddedTasks()`  | 已经加入的任务数               |
| `getTaskRatio()`   | 已完成任务数与已加入任务数之比 |
| `getLoadedByte()`  | 已加载的字节数                 |
| `getByteRatio()`   | 已加载字节与总量之比           |

这些计数只用于展示。数据端不依赖进度决定任何业务逻辑；需要等待加载结果时，应当读配置、读任务结果或等 `loaded()`，而不是等某个比例。数据端与渲染端的分工见[数据端与渲染端](../../intermediate/data-vs-render.md)。

## 渲染端如何消费加载进度

渲染端复用同一套配置与同一个加载器：它在数据端配置的基础上创建渲染端主对象，再追加自己的渲染侧配置。`RenderLoaderHooks` 就是在 `onCoreConfigLoaded` 里追加贴图、音频、动画与字体配置的钩子。

加载场景只做接口级消费：迭代同一个 `loader.start()`，从 `loader.manager` 读取已加载任务数、已加入任务数、已加载字节与字节比例，交给进度条绘制。它不改变加载顺序，也不参与配置解析。

```text
state.loader.start()
  ├─ 迭代值：当前已加载字节
  └─ state.loader.manager
       ├─ getLoadedTasks() / getAddedTasks()
       └─ getLoadedByte() / getByteRatio()
```

## 边界与注意

- <strong>配置 id 是键</strong>：同一个 id 只登记一份配置，后来用同一个 id 追加不会变成第二份。需要两份配置时使用不同 id。
- <strong>addCustomTask 的调用时机</strong>：只能在加载开始前，或 `onCoreConfigLoaded` / `onExtraConfigLoaded` 中调用；等到自定义任务已经开始加载或加载结束后再调用，本次加载不会读取它。
- <strong>addExtraConfig 的调用时机</strong>：只能在加载开始前或 `onCoreConfigLoaded` 中调用；在 `onExtraConfigLoaded` 里追加已经错过本次加载。
- <strong>前缀缺失或解析失败</strong>：加载器会报错并把该配置按空对象处理，整次加载继续。依赖这份配置的代码要能接受空内容。
- <strong>自定义任务的路径</strong>：配置文件路径由加载器统一改写；自己构造的 `LoadTask` 地址不会被改写，需要按开发环境与构建产物分别给出正确路径。
- <strong>自定义 starter 的返回契约</strong>：`start` 必须返回满足 `IResponseLike` 的对象；标准 `Response` 可以直接用。
- <strong>自定义任务要设置 starter</strong>：任务不会自动继承加载器的 starter，漏设时任务不会开始加载。
- <strong>字节进度可能不准</strong>：所有任务的总大小要等响应头都到达后才能确定，总量未知时字节比例只是近似值。
- <strong>start 必须被迭代</strong>：调用 `loader.start()` 只是拿到异步迭代器，真正推进加载的是迭代过程。`CoreState.load()` 已经替你完成迭代；手动驱动时要自己消费完。

返回[高级 III 导览](./index.md)。
