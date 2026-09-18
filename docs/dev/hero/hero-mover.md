# 需求综述

将旧样板中的 `HeroMover`（`packages-user/data-state/src/legacy/move.ts`）基于新的 `IObjectMover` / `ObjectMover` 基类进行彻底性重构，编写新的 `IHeroMover` 接口和 `HeroMover` 实现类。

新实现的核心变化：

- 基类从旧 `ObjectMoverBase`（EventEmitter 模式）迁移至 `ObjectMover<IHeroLocation>`（Hook 模式）。
- `inLockControl` 删除，重构后不再需要。
- 移动速度不再由 `HeroMover` 存储，速度变更通过 `ObjectMover.speed()` 方法体现，实际动画时长在 Hook 中自行处理。
- `noRoute`、`ignoreTerrain`、`autoSave` 不再作为公开属性暴露，改为通过 `config()` / `getConfig()` 方法管理，配置对象为 `IHeroMoverConfig`。
- 摒弃所有 `core.xxx` 调用，这些功能将在后续通过新接口逐步补充。
- `HeroMover` 的实例化由 `IHeroLocation` 的实现类内部完成，构造时传入 `this` 作为 `tile`，解决循环依赖。

# 接口设计分析

`IHeroMover` 直接扩展 `IObjectMover<IHeroLocation>`，以下仅分析新增内容。

## IHeroMover

### 接口综述

`IHeroMover` 在通用对象移动器基础上，通过 `config()` 方法接收一个 `IHeroMoverConfig` 配置对象来控制本次移动的行为模式（是否忽略地形、是否记录路径、是否触发自动存档）。这种方法将三个相关标志聚合到统一的配置接口中，调用方便且后续扩展新配置项时无需新增独立属性。`getConfig()` 返回当前生效的只读配置，供内部逻辑和 Hook 查询移动上下文。

### 接口分析

- `IHeroMover.config(config)`：预期频率**中频**。在移动开始前统一配置本次移动的行为标志，一次性设置多个相关选项，比分别设置三个独立属性更加便利。典型使用场景：自动寻路系统在每次移动前调用 `mover.config({ noRoute: true }).forward(3).start()`，通过链式调用一气呵成。

- `IHeroMover.getConfig()`：预期频率**低频**。查询当前移动器的配置快照，主要用于 Hook 内部判断移动上下文，或调试时检查配置状态。典型使用场景：Hook 中的 `onStepStart` 获取 `mover.getConfig()` 以判断当前步是否需要路线记录。

### IHeroMoverConfig 成员分析

- `noRoute`：预期频率**中频**。控制本次移动是否记录进路线系统。路线回放、自动寻路等系统均需跳过路线记录，涉及面较广，故为中频。

- `ignoreTerrain`：预期频率**低频**。控制本次移动是否跳过地形碰撞检测，仅用于瞬移、强制移动等特殊场景。

- `autoSave`：预期频率**低频**。控制本次移动是否在特定时机触发自动存档，仅在地图伤害相关全局系统内部设置。

> 三个配置项在 `config()` 参数中均为可选，未显式设置的项保持当前值不变，`getConfig()` 返回的是已补全默认值的完整配置只读快照。

### 预期体量

接口定义部分（`IHeroMover`、`IHeroMoverConfig`）约 15-20 行。

`HeroMover` 类的预期代码体量为 200-250 行。分析如下：

- 类定义与私有属性（`noRoute`、`ignoreTerrain`、`autoSave` 各自独立声明），以及 `config` / `getConfig` 实现，约 30 行。
- `onMoveStart` 实现（同步渲染端状态、预检查首步地形等），约 30 行。
- `onMoveEnd` 实现（恢复状态、通知渲染端结束、清除自动寻路状态），约 20 行。
- `onStepStart` 实现（地形检测、自动存档判断、渲染端动画调用等），约 55 行。
- `onStepEnd` 实现（根据移动代码分发处理、返回新坐标、路线记录、触发器等），约 65 行。
- 辅助方法（坐标计算、地形检测等），约 30 行。
- `HeroMoveCode` 枚举定义，约 10 行。

### 可能风险

- `IHeroLocation` 接口已定义 `readonly mover: IObjectMover<this>`。由于 `IHeroMover extends IObjectMover<IHeroLocation>`，若 `HeroMover` 的构造在 `IHeroLocation` 内部完成（传入 `this`），类型可自然满足且无循环依赖问题。但需确保 `IHeroLocation` 的实现类确实在其构造过程中创建并持有 `HeroMover` 实例。

# 实现思路

## 1. 在 `types.ts` 中新增相关接口与枚举

新增 `IHeroMoverConfig` 接口，包含 `noRoute`、`ignoreTerrain`、`autoSave` 三个可选布尔成员。

新增 `IHeroMover` 接口，继承 `IObjectMover<IHeroLocation>`，新增 `config(config)` 和 `getConfig()` 两个方法。

新增 `HeroMoveCode` 枚举，公开导出，包含正常移动、停止、撞击、不可移动等代码，供 Hook 用户判断每步移动结果。

## 2. 完成 `HeroMover` 类

在 `packages-user/data-state/src/hero/mover.ts` 中实现 `HeroMover extends ObjectMover<IHeroLocation>`。

构造函数接收两个参数：
- `tile: IHeroLocation` — 勇士位置对象，同时满足 `IObjectMovable`，作为基类移动操作的绑定目标。
- `faceHandler: IFaceHandler<FaceDirection>` — 朝向处理器，由 `IHeroLocation` 实现类在创建 `HeroMover` 时传入（本样式中为 `Dir4FaceHandler`）。

`config(config)`：将传入配置中已显式提供的字段分别赋值到对应的私有属性 `noRoute`、`ignoreTerrain`、`autoSave`，未传入的字段保持原值，返回 `this` 以支持链式调用。

`getConfig()`：从三个私有属性分别读取当前值，组装为 `Readonly<IHeroMoverConfig>` 返回，默认值均为 `false`。

`onMoveStart`：移动开始时读取当前配置，通过 `IHeroLocation.mover`（渲染端 `HeroMoveController` 实例）启动渲染端移动动画。若 `ignoreTerrain` 为 `false`，预检查第一步是否能通过。

`onMoveEnd`：移动结束时通知渲染端移动结束，清除自动寻路相关状态。

`onStepStart`：根据 `ignoreTerrain` 判断是否进行地形检测，若不可通过则返回对应的 `HeroMoveCode`。处理 `autoSave` 的存档判断逻辑。启动渲染端单步移动动画。根据 `noRoute` 判断是否记录路线。

> **注意**：地形检测、路线记录、触发器、中毒伤害等具体逻辑依赖的新接口尚不存在，`core.xxx` 调用在此重构中摒弃。当前在这些位置以 `// TODO:` 标记占位，等待后续接口补充。

`onStepEnd`：根据 `onStepStart` 返回的 `HeroMoveCode` 执行对应逻辑：
- `Step`：返回目标坐标 `ITileLocator` 让基类更新位置，执行路线记录与后置逻辑。
- `Hit`：停止移动，触发目标格触发器。
- `CannotMove`：停止移动，不触发触发器。
- `Stop`：停止移动，清除自动寻路。

## 3. 在 `hero/index.ts` 中导出

在 `packages-user/data-state/src/hero/index.ts` 中新增 `export * from './mover'`。

# 涉及文件

## 需要引用的文件

- `@motajs/common`：引用 `ITileLocator` 等基础接口。
- `@user/data-common`：引用 `IObjectMover`、`IObjectMovable`、`ObjectMover`、`ObjectMoveStep`、`ObjectMoveStepType`、`FaceDirection`、`IFaceHandler`、`IFaceDescriptor` 等类型。
- `@user/data-base`：引用 `IHeroLocation`、`IHeroMoveController` 等勇士相关接口。
- `types.ts`（同包顶层）：引用 `IHeroMover`、`IHeroMoverConfig`、`HeroMoveCode`（类实现接口时自引用）。

## 需要修改的文件

### `packages-user/data-state/src/types.ts`

- [ ] 新增 `IHeroMoverConfig` 接口：定义移动配置对象的三个可选布尔成员 `noRoute`、`ignoreTerrain`、`autoSave`。
- [ ] 新增 `IHeroMover` 接口：继承 `IObjectMover<IHeroLocation>`，新增 `config()` 和 `getConfig()` 方法。
- [ ] 新增 `HeroMoveCode` 枚举：定义勇士移动步骤返回码，公开导出供 Hook 使用。

### `packages-user/data-state/src/hero/mover.ts`（新建）

- [ ] 实现 `HeroMover` 类：继承 `ObjectMover<IHeroLocation>`，实现 `config`、`getConfig` 及基类四个抽象方法。

### `packages-user/data-state/src/hero/index.ts`

- [ ] 新增 `export * from './mover'`：导出新模块。
