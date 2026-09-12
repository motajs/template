# 需求综述

当前触发器系统中，进入图块与撞击图块被合并为同一个触发器，通过 `eventPass` 标志位区分。这种合并设计导致两个触发条件无法拥有各自独立的触发器，同时也缺失了离开图块与无法进入图块的触发器支持。本次重构将四类触发条件分离，使触发器系统各司其职。

# 需求理解

## 明确需求

1. 四类触发条件分离。进入图块（`onEnter`）、离开图块（`onLeave`）、撞击图块（`onHit`）、无法移动至图块（`onCannotEnter`）必须各自独立，图块可为每种条件分别指定触发器类型。
2. 撞击由 `eventPass` 决定。当 `eventPass` 为 `false` 时走撞击逻辑，应触发 `onHit`，而非复用进入图块的触发器。
3. 无法移动由 `inPass` / `outPass` 决定。当地形通行性检查失败时走无法移动逻辑，应触发 `onCannotEnter`。
4. 撞击与无法移动互斥。一次移动中只会发生其中一种，前者由 `eventPass` 控制，后者由 `inPass` / `outPass` 控制，二者不会同时触发。
5. `onLeave` 的触发条件。仅在未发生撞击且未发生无法移动时（即移动成功，`HeroMoveCode.Step`），英雄将要离开当前图块时触发。
6. `onEnter` 的触发时机。英雄到达目标图块且位置数据已切换后触发，通过 `ObjectMover` 的 `onStepEnd` 钩子实现。
7. 触发器不区分触发条件。一个触发器同时包含四个触发方法（`onEnter`、`onLeave`、`onHit`、`onCannotEnter`），而非为四种条件分别注册四个触发器。触发器注册表仍按数字类型注册。

## 隐含需求

1. 同一个触发器类型可被不同条件复用。由于一个触发器实例同时包含四个方法，同一种触发器类型既可被指定为进入触发器也可被指定为撞击触发器——取决于调用方调用哪个方法。
2. 离开图块的触发作用于出发图块。英雄从 A 移动到 B，`onLeave` 作用于 A 的图块，需要使用 `currLoc` 作为收集坐标。
3. 图块可同时拥有多种条件的触发器。图块属性可能在游戏中变化，点级覆盖可与底层图块不同，因此同一坐标可为不同条件指定不同的触发器类型。
4. 动态图块与静态图块拥有一致的触发器能力，`IDynamicTile` 也需要支持按条件读写触发器类型。

# 设计前提

1. 触发条件由游戏逻辑判定，不由触发器系统决定。`eventPass`、`inPass` / `outPass` 属于通行性判定范畴，判定结果决定走哪条触发路径。触发器系统只负责在给定条件后收集并执行对应触发器。
2. 触发器类型仍以数字标识。`ITriggerRegistry` 基于数字管理触发器工厂创建，不感知触发条件。注册一个触发器类型后，该类型即拥有四个条件方法。
3. 收集器不判定条件。`ITriggerCollector` 仅根据调用者给定的条件类型，从指定图块中收集该条件对应的触发器。条件选择由调用者（英雄移动系统）负责。
4. 收集必定执行，不做预检查。触发器数量极少，收集一个空集合而后自然跳过的开销可忽略不计。不提供 `hasTrigger` 等预检查方法。

# 核心概念定义

## 触发条件

一种由英雄移动行为引发的交互类型，决定应当调用图块触发器上的哪个方法。触发条件共有四种，分别对应四类英雄与图块的交互方式。一次移动中只会产生一种触发条件（Step → enter/leave、Hit → hit、CannotMove → cannotEnter），因此四种条件不是并行触发而是排他的。

## 进入触发

当英雄成功移动到某个图块上且位置数据已切换后执行。判定条件为 `canPass` 为 `true` 且 `shouldHit` 为 `false`，此时英雄成功进入图块，应调用目标图块对应触发器实例上的 `onEnter` 方法。由于触发时机在位置切换之后，使用 `ObjectMover` 的 `onStepEnd` 钩子——在该钩子中 `tile` 的坐标已更新为新位置。

## 离开触发

当英雄将要离开当前图块，且该步移动属于成功移动（未发生撞击、未发生无法移动）时执行。离开触发作用于出发图块，使用英雄当前位置坐标（`currLoc`）收集触发器，应调用对应触发器实例上的 `onLeave` 方法。由于触发时机是"将要离开"，在 `HeroMover.onStepEnd` 方法中、`setPos` 执行前调用 `leave`，此时英雄位置尚未变更。

## 撞击触发

当英雄尝试进入某个图块但被 `eventPass` 阻挡时执行。判定由 `eventPass` 完成：当 `eventPass` 为 `false` 时，英雄撞击目标图块并停止移动，应调用目标图块对应触发器实例上的 `onHit` 方法。

## 无法进入触发

当英雄尝试进入某个图块但被地形通行性（`inPass` / `outPass`）阻挡时执行。判定由 `canPass` 完成：当 `canPass` 为 `false` 时，英雄无法进入目标图块，应调用目标图块对应触发器实例上的 `onCannotEnter` 方法。在移动判定中 `canPass` 检查先于 `shouldHit` 检查，因此无法进入触发与撞击触发互斥。

# 接口设计分析

核心改动分为三个层面：触发器实例从单一方法变为四个方法，收集器增加条件参数以读取正确的触发器类型，集合执行时根据条件分发到对应方法。

## ITrigger

### 设计思路

当前 `ITrigger` 仅有一个 `trigger(handler)` 方法，所有触发条件共用这一个人口。由于四种触发条件需要各自独立的行为，触发器实例需要为每种条件提供独立的方法入口。

因此将 `trigger` 方法替换为四个条件方法：`onEnter`、`onLeave`、`onHit`、`onCannotEnter`。这四个方法各自接收 `ITriggerHandler` 上下文对象，独立实现对应逻辑。这样同一个触发器类型被指定为进入触发时调用 `onEnter`，被指定为撞击触发时调用 `onHit`，互不干扰。

由于触发器注册表仍按数字类型注册，同一个触发器工厂产出的实例自动具备四种方法。不需要为四种条件注册四个不同触发器——条件的选择由调用方在运行时决定调用哪个方法。

### 接口分析

- 方法 `onEnter(handler: ITriggerHandler)`：预期频率**高频**。绝大多数的移动目的地都是可以进入的图块，每次进入都会调用。
- 方法 `onLeave(handler: ITriggerHandler)`：预期频率**高频**。与 `onEnter` 对称，每次成功移动都会离开出发图块。
- 方法 `onHit(handler: ITriggerHandler)`：预期频率**中频**。仅 `eventPass` 为 `false` 的图块会产生撞击，不如进入频繁。
- 方法 `onCannotEnter(handler: ITriggerHandler)`：预期频率**低频**。仅地形阻挡时触发，场景相对最少。

### 预期体量

`ITrigger` 接口改动预期 5 行：四个方法替换原有的一个 `trigger` 方法。

---

## ITriggerCollection

### 设计思路

当前 `ITriggerCollection.trigger(handler)` 遍历所有触发器调用各自的 `trigger` 方法。由于 `ITrigger` 不再有 `trigger` 方法而变为四个条件方法，集合在执行时需要知道应当调用哪个方法。因此 `trigger` 方法需要增加 `condition` 参数，在遍历时根据条件分发给每个触发器的对应方法。

`triggerIter` 同理，也需要增加 `condition` 参数，以便在迭代分步执行时知道分发到哪个方法。

由于集合中存储的仍然是 `ITrigger` 实例，同一个集合可以被重复用于不同条件（虽然实际场景中不会这样使用）。集合不记录自身是"为哪个条件创建的"，条件信息仅在触发执行时传入。

### 接口分析

- 方法 `trigger(condition: TriggerCondition, handler: ITriggerHandler)`：预期频率**高频**。每次触发执行都要通过此方法，是集合的核心入口。修改仅增加 `condition` 参数，调用方式变化不大。
- 方法 `triggerIter(condition: TriggerCondition, handler: ITriggerHandler)`：预期频率**中频**。用于需要逐步控制触发流程的高级场景，使用频率低于普通 `trigger`。

### 预期体量

预期改动 10 行。`trigger` 方法中的遍历循环，将 `trigger.trigger(handler)` 替换为对 `condition` 的 `switch` 分发（或等价的条件方法调用）。逻辑简单，仅增加分发层。

---

## ITriggerCollector

### 设计思路

当前 `ITriggerCollector.collect(x, y, layer)` 不区分触发条件，统一读取图块上的单一触发器类型。由于四种条件可能有各自不同的触发器类型，收集器必须知道当前条件，才能从图块数据中读取该条件对应的触发器类型。

因此 `collect` 方法新增 `condition` 参数，收集器根据条件调用图块上对应的方法（如 `layer.getEnterTrigger(x, y)`）获取触发器类型，经由注册表创建 `ITrigger` 实例。收集到的触发器实例本身不绑定条件——条件信息仅用于"读取哪个触发器类型"，不传递给集合或触发器。

### 接口分析

- 方法 `collect(condition: TriggerCondition, x: number, y: number, layer: IMapLayer)`：预期频率**高频**。英雄每移动一格都要至少调用一次，是触发系统的核心入口。新增参数不影响复杂度。

### 预期体量

预期代码体量为 90-120 行。分析如下：

- 静态与动态图块的收集逻辑预期 90 行：保留当前 `collect` 方法的优先级逻辑（单动态优先值比较、多动态排序去重），差异在于读取触发器类型时需根据 `condition` 分发到不同字段，每个分支代码量较小但分支较多。

---

## IMapLayer / IDynamicTile

### 设计思路

当前 `IMapLayer` 有 `getTriggerType(x, y)` 和 `setTriggerType(type, x, y)` 两个方法，`IDynamicTile` 有 `triggerType` 字段和 `setTriggerType` 方法。由于四种触发条件各自独立，这些单一入口需要扩展为按条件读写。

对于 `IMapLayer`，需要四个 `getXxxTrigger(x, y)` 和四个 `setXxxTrigger(type, x, y)` 方法（`xxx` 为 Enter / Leave / Hit / CannotEnter）。读取时先查点级覆盖映射，若未设置则回退到 `ITileStore` 的对应条件默认值。

对于 `IDynamicTile`，需要为每种条件提供字段及 setter。

`ITileRawData` 的设计不在此文档范围内，由项目负责人单独处理。

### 接口分析

- 方法 `IMapLayer.getEnterTrigger(x, y)` 等四个：预期频率**高频**。收集器每次收集都需调用其中之一，与进入触发等条件频率一致。
- 方法 `IMapLayer.setEnterTrigger(type, x, y)` 等四个：预期频率**中频**。运行时修改触发器类型有一定场景（事件修改图块行为等），但远低于读取频率。
- 字段 `IDynamicTile.enterTrigger` 等四个字段：预期频率**高频**。收集动态图块触发器时需要读取对应条件字段。
- 方法 `IDynamicTile.setEnterTrigger(type)` 等四个 setter：预期频率**中频**。同 `IMapLayer` 的 setter 频率。

### 预期体量

不在此文档范围内展开——`ITileRawData` 的内部实现由项目负责人处理。接口层面的方法签名改动预期约 20 行（四个 getter + 四个 setter 的方法声明）。

---

## IHeroMoveTopImpl

### 设计思路

当前 `IHeroMoveTopImpl` 仅有 `hit` 方法处理撞击触发，进入触发和无法进入触发均未覆盖。四种条件分离后，需要补齐缺失的触发入口：`enter`、`leave`、`cannotEnter`。

`onLeave` 的触发目标是出发图块，使用 `handler.currLoc` 坐标收集，触发时机是离开前（在 `onStepEnd` 方法中调用）。`onEnter` 的触发目标是目标图块，使用 `handler.nextLoc` 坐标收集，触发时机是位置切换后，通过 `ObjectMover` 的 `onStepEnd` 钩子实现——钩子中的 `tile` 坐标已更新为新位置。`onHit` 和 `onCannotEnter` 的触发目标都是目标图块，使用 `handler.nextLoc` 坐标收集。

在英雄移动流程中各条件的分发：
- `Step`：`onStepEnd` 方法中调用 `leave(handler)` 触发离开，`onStepEnd` 钩子中调用 `enter(handler)` 触发进入。
- `Hit`：`onStepEnd` 方法中调用 `hit(handler)` 触发撞击（原逻辑，内部改为收集时指定 `Hit` 条件）。
- `CannotMove`：`onStepEnd` 方法中调用 `cannotEnter(handler)` 触发无法进入。

### 接口分析

- 方法 `enter(handler: IHeroMoveTopHandler)`：预期频率**高频**。绝大多数移动成功后会调用。
- 方法 `leave(handler: IHeroMoveTopHandler)`：预期频率**高频**。与 `enter` 对称，每次成功移动前调用。
- 方法 `cannotEnter(handler: IHeroMoveTopHandler)`：预期频率**低频**。仅地形阻挡时触发。
- 方法 `hit(handler: IHeroMoveTopHandler)`：现有方法，内部逻辑修改为收集时指定 `TriggerCondition.Hit`。预期频率不变。

### 预期体量

预期代码体量为 50 行。分析如下：

- `enter` 方法预期 12 行：与当前 `hit` 类似——获取 `floorId`、获取 `ILayerState`、取 `eventLayer`、收集指定条件的触发器、执行。
- `leave` 方法预期 12 行：与 `enter` 对称，差异在于收集时坐标使用 `currLoc`。
- `cannotEnter` 方法预期 12 行：与 `hit` 对称，条件替换为 `CannotEnter`。
- `hit` 方法修改预期 14 行：在现有骨架基础上透传条件参数。

---

# 实现思路

## ITrigger 方法拆分

1. 移除 `ITrigger.trigger(handler)` 方法，新增 `onEnter`、`onLeave`、`onHit`、`onCannotEnter` 四个方法，签名均为 `(handler: ITriggerHandler): Promise<void>`。
2. `BaseTrigger` 抽象类中四个方法均标记为 `abstract`，子类必须实现。
3. `BaseTrigger.collection()` 方法不变。

## 集合执行分发

1. `ITriggerCollection.trigger` 和 `triggerIter` 增加 `condition: TriggerCondition` 参数。
2. 遍历触发器的循环中，根据 `condition` 调用对应方法，替代原来的 `trigger.trigger(handler)`。

## 收集器改造

1. `collect` 方法增加 `condition` 参数。
2. 静态触发器读取根据 `condition` 选择调用 `layer.getEnterTrigger` 等对应方法。
3. 动态触发器读取根据 `condition` 选择读取 `tile.enterTrigger` 等对应字段。
4. 优先级排序逻辑不变。

## 英雄移动系统适配

1. `IHeroMoveTopImpl` 新增 `enter`、`leave`、`cannotEnter` 三个方法，直接调用收集器收集对应条件的触发器并执行。
2. `HeroMover.onStepEnd` 中 `Step` 分支：调用 `leave(handler)` 触发离开后再返回 `nextLoc`。
3. `HeroMover` 注册 `onStepEnd` 钩子：当 `code === HeroMoveCode.Step` 时，调用 `enter(handler)`。此时钩子中的 `tile` 坐标已通过 `setPos` 更新为新位置，可直接从 `tile` 获取当前坐标构造 handler。
4. `HeroMover.onStepEnd` 中 `CannotMove` 分支：调用 `cannotEnter(handler)`。
5. `HeroMoveCode.Hit` 注释更新为"不能移动，并触发目标格撞击触发器"。

# 涉及文件

## `@user/data-system/trigger/types.ts`

- [ ] 新增 `TriggerCondition` 枚举：定义 `Enter`、`Leave`、`Hit`、`CannotEnter` 四个成员。
- [ ] 修改 `ITrigger` 接口：移除 `trigger` 方法，新增 `onEnter`、`onLeave`、`onHit`、`onCannotEnter` 四个方法。
- [ ] 修改 `ITriggerCollection.trigger` 和 `triggerIter` 方法签名：新增 `condition: TriggerCondition` 参数。
- [ ] 修改 `ITriggerCollector.collect` 方法签名：新增 `condition: TriggerCondition` 参数。

## `@user/data-system/trigger/trigger.ts`

- [ ] 修改 `BaseTrigger` 抽象类：四个条件方法标记为 `abstract`，移除 `trigger`。

## `@user/data-system/trigger/collection.ts`

- [ ] 修改 `TriggerCollection.trigger`：遍历中根据 `condition` 分发给对应条件方法。
- [ ] 修改 `TriggerCollection.triggerIter`：同上。

## `@user/data-system/trigger/collector.ts`

- [ ] 修改 `TriggerCollector.collect`：根据 `condition` 读取图块对应字段。

## `@user/data-base/map/types.ts`

- [ ] 修改 `IMapLayer` 接口：新增四个 `getXxxTrigger` 和四个 `setXxxTrigger` 方法，替换原有的 `getTriggerType` / `setTriggerType`。
- [ ] 修改 `IDynamicTile` 接口：新增四个条件字段及对应的 setter，替换原有的 `triggerType` / `setTriggerType`。

## `@user/data-base/map/mapLayer.ts`

- [ ] 实现新增的八个方法，内部映射管理适配。

## `@user/data-base/map/dynamicTile.ts`

- [ ] 拆分 `triggerType` 为四个条件字段，实现四个 setter。

## `@user/data-base/map/dynamicLayer.ts`

- [ ] 修改 `createDynamic` 和 `transferToDynamic` 中触发器同步逻辑：同步四个条件字段。

## `@user/data-base/hero/types.ts`

- [ ] 新增 `IHeroMoveTopImpl.enter` 方法。
- [ ] 新增 `IHeroMoveTopImpl.leave` 方法。
- [ ] 新增 `IHeroMoveTopImpl.cannotEnter` 方法。
- [ ] 更新 `HeroMoveCode` 枚举中 `Hit` 和 `CannotMove` 的注释。

## `@user/data-state/hero/moverImpl.ts`

- [ ] 实现新增的 `enter`、`leave`、`cannotEnter` 方法。
- [ ] 修改 `hit` 方法：调用收集器时传入 `TriggerCondition.Hit`。

## `@user/data-base/hero/mover.ts`

- [ ] 修改 `onStepEnd`：`Step` 分支调用 `leave`；`CannotMove` 分支调用 `cannotEnter`。
- [ ] 注册 `onStepEnd` 钩子：`Step` 时调用 `enter`，利用钩子中 `tile` 坐标已更新的时机。
