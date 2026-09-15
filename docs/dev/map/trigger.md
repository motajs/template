# 需求综述

当前地图系统已完成图层管理与动态图块的构建，但地图上每个格点可能存在的**事件逻辑**（如战斗、对话、商店等）尚无统一抽象。本需求旨在建立一套触发器系统，将地图事件的注册、收集与触发解耦为三个独立接口层，最终可通过统一的方式触发地图上某一点所有匹配的事件。

触发器本身不与地图绑定，可独立于地图存在。由于触发的执行依赖 Layer 2 的上下文（`IStateBase` 等），整个触发器系统均归属 Layer 2（`@user/data-system`），地图在 Layer 1 中只存储可序列化的图块数据，不直接持有 `ITrigger`。

---

# 接口设计与预期

## ITrigger

- `ITrigger.type`：预期频率**低频**，触发器的类型标识符，以数字表示，用于区分不同种类的触发器（如战斗、对话等）；一般仅在实例化时通过构造参数传入一次，运行期基本不读写，故为低频。
- `ITrigger.priority`：预期频率**低频**，仅在创建触发器时设置一次，用于控制同格点多触发器的执行顺序；绝大多数情况下一个格点只会有一个触发器，多触发器仅为少量拓展场景预留，在 `collect` 场景下，同一次收集中的 `priority` 重复会被视为配置冲突，故为低频。
- `ITrigger.trigger(handler)`：预期频率**中频**，用户在脚本中有时会直接持有某个触发器引用并手动触发，但大多数事件触发都通过 `ITriggerCollection.trigger` 完成，直接调用此方法的场合相对有限，故为中频。接受 `ITriggerHandler` 上下文对象（必选 `state: IStateBase`，可选 `layer?: ILayerState`、`mapLayer?: IMapLayer`、`locator?: ITileLocator`），返回 `Promise<void>`。典型使用场景：脚本中已持有某个战斗触发器引用，希望直接触发而不经过格点收集流程。
- `ITrigger.collection()`：预期频率**中频**，当用户希望将单个触发器包装为集合并走统一触发流程时使用，场景较为固定但有一定出现概率，故为中频。典型使用场景：脚本中手动构造只含单个触发器的集合，再调用 `collection.trigger(...)` 统一触发。

## ITriggerRegistry

以触发器**类型**（`type: number`）为核心提供注册与查询；`registerString` / `getString` 是触发器自身 id 的字符串别名，与地图图块绑定无关，不参与 `collect` 的自动收集流程。共四个方法，不拆分为子接口。

- `ITriggerRegistry.register(type, factory)`：预期频率**低频**，按触发器类型注册触发器工厂函数（`(type: number) => ITrigger`），由注册表在实例化时将当前 `type` 透传给工厂，使 `ITrigger.type` 跟随注册表，`collect` 时每次调用工厂创建独立实例，一种触发器类型只注册一次，故为低频。
- `ITriggerRegistry.get(type)`：预期频率**低频**，主要供 `ITriggerCollector` 内部调用，用户代码几乎不会直接使用，故为低频。
- `ITriggerRegistry.registerString(id, factory)`：预期频率**低频**，为触发器注册字符串别名（`() => ITrigger`），仅用于手动按字符串 id 查询，与地图图块收集无关，故为低频。
- `ITriggerRegistry.getString(id)`：预期频率**低频**，按字符串 id 查询触发器工厂，调用方手动获取后实例化，主要供内部调用，故为低频。

## ITriggerCollection

- `ITriggerCollection.count`：预期频率**低频**，在"当格点无任何触发器时跳过处理"的场景下可快速判断，避免额外迭代，故为低频。
- `ITriggerCollection.trigger(handler)`：预期频率**高频**，这是触发器系统对用户暴露的最主要入口，凡是需要触发某格事件的地方都会出现此调用，故为高频。接受 `ITriggerHandler` 上下文对象，顺序异步执行所有触发器，返回 `Promise<void>`。典型使用场景：玩家移动到某格后，移动系统调用 `collection.trigger(handler)` 依次执行该格所有已排序的触发器。
- `ITriggerCollection.triggerIter(handler)`：预期频率**低频**，返回 `AsyncGenerator<ITrigger, void, ITriggerHandler | null>`，允许调用方逐个手动推进触发器执行，每次 `next(handler)` 可传入新的上下文（传 `null` 则沿用初始 `handler`），故为低频。典型使用场景：需要在两个触发器之间插入额外效果（如战斗结束后立刻播放特效）的进阶场景。
- `ITriggerCollection.iterate()`：预期频率**低频**，仅在需要检查当前集合包含哪些触发器时使用（如 UI 显示交互提示），多数情况下直接触发而无需遍历，故为低频。
- `ITriggerCollection.push(trigger)`：预期频率**低频**，在脚本中偶尔需要向已有集合末尾追加一个触发器（如特殊演出追加额外效果），直接插入末尾不重新排序，故为低频。
- `ITriggerCollection.unshift(trigger)`：预期频率**低频**，与 `push` 对称，向集合头部强制插入触发器，直接插入头部不重新排序，场景更为罕见，故为低频。
- `ITriggerCollection.concat(...others)`：预期频率**低频**，将当前集合与一个或多个其他集合按自身在前、传入参数依序在后的顺序合并为新集合，不重新排序。此接口需求存疑，先行提供，故为低频。

## ITriggerCollector

`ITriggerCollector` 独立存在于 Layer 2（`@user/data-system`），不附属于 `ILayerState`。调用方持有 collector 引用，调用 `collect(x, y, layer)` 时显式传入目标图层（`IMapLayer`）。收集时会依赖后续由 `IMapLayer.getTileInfo` 暴露的图块信息，其中包含触发器类型。引擎层会利用 `ILayerState.eventLayer` 自动调用 `collect` 实现默认收集行为，该行为不在本接口设计范围内；若需对多个图层收集，调用方自行多次调用并合并结果，合并顺序、跨层排序结果与跨层冲突处理均由调用方自行决定。

- `ITriggerCollector.collect(x, y, layer)`：预期频率**中频**，在移动系统或交互系统中需要确认某格事件时调用，使用场景固定且有一定频率，故为中频。`layer` 为必选，调用方显式指定要收集的目标图层（`IMapLayer`）。典型使用场景：玩家向某格移动时，移动系统持有 collector 引用并调用 `collector.collect(x, y, layer)` 获取目标格的 `ITriggerCollection`，再决定是否阻断移动或直接触发。
- `ITriggerCollector.attachRegistry(registry)`：预期频率**低频**，仅在初始化或切换注册表时调用，故为低频。

---

# 实现思路

## 1. 触发器对象 ITrigger

`ITrigger` 代表一类事件逻辑（如"战斗触发器"、"对话触发器"），是整个系统的原子单元。`type` 成员以数字标识触发器种类，在常规注册流程下由注册表在实例化时通过构造参数注入；`priority` 控制同格点的执行顺序，并在 `collect` 场景下充当唯一执行位。触发器本身是极其宽泛的东西，一般只有几种类型，比如战斗、触发系统事件、触发自定义事件等，不会每种战斗和每种对话都开一种触发器。触发时接受外部传入的 `ITriggerHandler` 上下文参数，执行对应逻辑。

`ITrigger` 提供 `collection()` 方法，将单个触发器包装为 `ITriggerCollection`，供不需要收集步骤的场景直接使用。

## 2. 触发器注册接口 ITriggerRegistry

触发器以类型为单位注册。为保证每个收集场景下的 `ITrigger` 实例相互独立（触发器可在内部保存状态而不互相影响），注册时传入工厂函数 `(type: number) => ITrigger`，由注册表在创建实例时将当前类型透传给工厂，使实例上的 `ITrigger.type` 跟随注册表；`collect` 时按需调用工厂创建新实例。字符串别名注册仍用于手动查询场景，不参与 `collect` 自动收集。`ITriggerRegistry` 直接包含以下四个方法：

- `register(type: number, factory: (type: number) => ITrigger)`：按触发器类型注册触发器工厂
- `get(type: number)`：按触发器类型查询触发器工厂
- `registerString(id: string, factory: () => ITrigger)`：为触发器注册字符串别名（仅用于手动查询，不参与 `collect` 自动收集）
- `getString(id: string)`：按字符串 id 查询触发器工厂

每个 key 只对应一个工厂。重复注册同一 key 时，发出警告并以新工厂覆盖旧的。

## 3. 触发收集 ITriggerCollector

`ITriggerCollector` 属于 Layer 2（`@user/data-system`），独立于 `ILayerState` 存在，不挂载到任何 Layer 1 接口上。地图在 Layer 1 中只存储可序列化的图块数据（如图块编号），不持有 `ITrigger` 实例。收集时，调用方显式传入目标图层 `layer`（`IMapLayer`），`ITriggerCollector` 读取该图层中该格点的图块数据——包括静态图块（通过 `IMapLayer.getBlock`）以及动态图块（通过 `IMapLayer.dynamicLayer`）——并结合后续由 `IMapLayer.getTileInfo` 暴露的图块信息读取其中记录的触发器类型，再通过 `ITriggerRegistry` 获取工厂并构造对应的 `ITrigger`，收集后排序，返回 `ITriggerCollection`。注册表通过 `attachRegistry(registry)` 设置。

排序规则：按触发器自身 `priority` 降序排列。这里的 `priority` 不仅表示执行顺序，也表示单次收集内的唯一执行位；正常情况下同一坐标只会有一个触发器，多触发器支持仅用于极少数拓展场景。收集阶段若发现两个或以上触发器的 `priority` 相同，则视为配置冲突，发出警告，并将本次结果中所有该优先级的触发器全部剔除，不进入 `ITriggerCollection`。

## 4. 触发器集合 ITriggerCollection

`ITriggerCollection` 是一组已排序的 `ITrigger` 的载体，提供统一的触发入口 `trigger(...)` 与迭代方法 `iterate()`、数量属性 `count`。`push` / `unshift` / `concat` 均不对集合重新排序，语义为"强制指定执行位置"，与 `priority` 排序体系完全分离（`ITriggerCollection` 本身与地图无关，不应自行排序）。可由：

- `ITriggerCollector.collect` 返回；
- `ITrigger.collection()` 方法直接构造（单触发器集合）。

触发执行策略：`trigger(handler)` 顺序异步执行（返回 `Promise<void>`），触发器之间串行等待；`triggerIter(handler)` 返回异步生成器，调用方可逐个推进执行并为每一步单独传入上下文，适用于需要在触发器间插入额外逻辑的进阶场景。

---

# 涉及文件

## 需要引用的文件

- `@user/data-base`（跨包引用）：`@user/data-system/trigger/types.ts` 中的 `ITriggerHandler` 需要引用 `IStateBase`（全局状态）、`ILayerState`（楼层状态）、`IMapLayer`（图层）与 `ITileLocator`；`ITriggerCollector.collect` 同样需要引用 `IMapLayer`，并依赖其后续提供的 `getTileInfo` 读取图块信息中的触发器类型

## 需要修改的文件

### `@user/data-base` 中的 `ILayerState`

- [x] 新增 `readonly eventLayer: IMapLayer | null` 属性：表示该楼层的默认事件图层，供引擎默认收集行为使用（引擎默认收集逻辑不在本设计范围内）
- [x] 新增 `setEventLayer(layer: IMapLayer | null): void` 方法：设置默认事件图层

## 需要新建的文件

### `@user/data-system/trigger/types.ts`

- [ ] 新增 `ITriggerHandler` 接口：触发时传入的上下文对象，包含必选的 `state: IStateBase` 以及可选的 `layer?: ILayerState`、`mapLayer?: IMapLayer`、`locator?: ITileLocator`
- [ ] 新增 `ITrigger` 接口：触发器原子对象，代表一类事件逻辑；包含 `type: number` 类型标识、`priority` 优先级成员、`trigger(handler: ITriggerHandler): Promise<void>` 触发方法与 `collection()` 方法以便包装为集合
- [ ] 新增 `ITriggerRegistry` 接口：包含 `register(type, factory: (type: number) => ITrigger)` `get(type)` `registerString(id, factory: () => ITrigger)` `getString(id)` 四个方法；以触发器类型 `type` 为核心管理注册与查询，字符串 id 为触发器自身别名，不参与 `collect` 自动收集；数字注册路径下由注册表透传 `type` 给工厂，保证实例的 `ITrigger.type` 与注册项一致
- [ ] 新增 `ITriggerCollection` 接口：包含已排序的触发器集合，提供 `trigger(handler)` 顺序异步触发入口（`Promise<void>`）与 `triggerIter(handler)` 异步迭代触发入口（`AsyncGenerator<ITrigger, void, ITriggerHandler | null>`）、`iterate()` 迭代方法、`count` 数量属性、`push` / `unshift` 向集合末尾或头部插入（不重排序）的方法，以及 `concat(...others)` 按自身在前的顺序合并多个集合（不重排序）的方法
- [ ] 新增 `ITriggerCollector` 接口：包含 `collect(x: number, y: number, layer: IMapLayer)` 收集方法与 `attachRegistry(registry: ITriggerRegistry | null)` 注册表设置方法
