# 需求综述

战斗上下文系统已经完成，下一步需要在 `packages-user/data-system/src/combat` 中补齐真正的战斗流程，使其可以驱动“与某只怪物实际交战”这一行为，而不再只是做战前预估。

本次设计将战斗拆为三个阶段：

1. 战前准备
2. 战斗过程
3. 战后处理

其中：

- 战前准备与战后处理都属于流程阶段，需要支持两类扩展点：
    - 外部注入钩子：面向系统层或外部模块的扩展，适合做动画、日志、兼容桥接等观察型逻辑
    - 自定义脚本：面向战斗流程对象本身的注册式扩展，通过 `addCombatScript` 注入
- 战斗过程本身只保留一个实际结算方法，输出 `IEnemyDamageInfo`；这个方法是纯计算、无副作用的方法，直接写在流程对象内部，不额外设计成可注入接口
- 创建战斗流程对象时，必须一次性绑定勇士与怪物上下文，后续不可更改；流程对象本身始终绑定一个上下文，但在真正执行战斗时，传入战斗专用 handler 的 `context` 与 `locator` 允许为 `null`，以支持与不在地图上的怪物战斗
- 流程对象对外暴露统一的 `battle(...)` 异步方法，由它串起三个阶段；`battle` 接收的是计算后的怪物对象，而不是 `IEnemyView`

本次设计的重点不是把所有战后行为硬编码进一个类里，而是先把“可编排、可扩展、与现有 combat 风格一致”的骨架搭起来。删怪、发奖励、旧系统桥接等默认行为，全部由外部脚本或钩子注入，这个系统本身只提供流程壳。

# 接口设计与预期

## IEnemyDamageInfo

本次不新增 `IDamageInfo` 结构，直接复用现有的 `IEnemyDamageInfo` 作为战斗过程的返回值。当前阶段只需要真实伤害值与回合数，现有结构已经足够。

- `IEnemyDamageInfo.damage`：预期频率**高频**。对于真正消费战斗结果的代码来说，最常读取的一定是伤害值；无论是战后脚本、展示层还是日志统计，都会优先关心这一项。典型使用场景：战后脚本根据本次伤害值决定是否触发濒死保护、成就统计或额外效果。
- `IEnemyDamageInfo.turn`：预期频率**低频**。回合数虽然重要，但大多数战斗逻辑只关心能否战斗和最终伤害，真正直接读取回合数的场景相对少得多，因此归为低频。

若后续确实出现额外结算字段需求，再单独讨论；本次设计不预留额外成员。

## IEnemyHandlerBase 与 IReadonlyEnemyHandlerBase

本次保留四种 handler 语义，但不再把它们平铺写成四份完整定义，而是先抽出两个 base：

- `IEnemyHandlerBase<TEnemy, THero>`：可写怪物版本，只保留 `enemy`、`hero`、`data`
- `IReadonlyEnemyHandlerBase<TEnemy, THero>`：只读怪物版本，只保留 `enemy`、`hero`、`data`

然后再由四个具体接口各自补上 `context` 与 `locator`：

- `IRequiredEHandler<TEnemy, THero>`
- `IReadonlyRequiredEHandler<TEnemy, THero>`
- `INullableEHandler<TEnemy, THero>`
- `IReadonlyNullableEHandler<TEnemy, THero>`

这样拆分后，真正共享的只有三项公共成员，`context` / `locator` 是否可空则留给具体接口自己表达，不再把“可空”硬塞进 base 的泛型参数里。

建议定义如下：

```ts
interface IEnemyHandlerBase<TEnemy, THero> {
    readonly enemy: IEnemy<TEnemy>;
    readonly hero: IReadonlyHeroAttribute<THero>;
    readonly data: IStateBase;
}

interface IReadonlyEnemyHandlerBase<TEnemy, THero> {
    readonly enemy: IReadonlyEnemy<TEnemy>;
    readonly hero: IReadonlyHeroAttribute<THero>;
    readonly data: IStateBase;
}

interface IRequiredEHandler<TEnemy, THero> extends IEnemyHandlerBase<
    TEnemy,
    THero
> {
    readonly context: IEnemyContext<TEnemy, THero>;
    readonly locator: ITileLocator;
}

interface IReadonlyRequiredEHandler<
    TEnemy,
    THero
> extends IReadonlyEnemyHandlerBase<TEnemy, THero> {
    readonly context: IReadonlyEnemyContext<TEnemy, THero>;
    readonly locator: ITileLocator;
}

interface INullableEHandler<TEnemy, THero> extends IEnemyHandlerBase<
    TEnemy,
    THero
> {
    readonly context: IEnemyContext<TEnemy, THero> | null;
    readonly locator: ITileLocator | null;
}

interface IReadonlyNullableEHandler<
    TEnemy,
    THero
> extends IReadonlyEnemyHandlerBase<TEnemy, THero> {
    readonly context: IReadonlyEnemyContext<TEnemy, THero> | null;
    readonly locator: ITileLocator | null;
}
```

这里有三个关键点：

- 旧的 required 语义和 nullable 语义都保留，但命名改为 `RequiredEHandler` / `NullableEHandler`
- `Base` 只承载真正共享的三项成员，不再把 `context` / `locator` 抽象过度
- 内部纯计算阶段继续使用 required 版本；战斗流程钩子与脚本使用 nullable 版本

### 风险说明

如果直接把 required 版本放宽成可空，至少会带来下面这些风险：

- 现有 `damage calculator`、`aura converter`、上下文构建逻辑会被迫接收可空 `context` / `locator`，需要成片补判断或非空断言
- 一些本来应当被视为错误调用的场景，会因为接口被放宽而静默溜过去，后续更难排查
- 战斗流程只是一个新需求，却会把可空语义扩散成 combat 旧模块的公共契约变化，影响面明显过大

`IEnemyHandlerBase` 与 `IReadonlyEnemyHandlerBase` 的成员频率可以一并分析，因为二者仅在 `enemy` 的只读性上不同：

- `enemy`：预期频率**中频**。无论是实际结算、战前判定还是战后奖励脚本，核心输入始终是当前这只怪物本身，但真正手写这类读取的位置并不会太多，因此定为中频。典型使用场景：内部结算方法读取怪物攻击、防御、特殊属性并计算战斗结果。
- `hero`：预期频率**中频**。战斗过程一定会读它，但对外部脚本来说，不是每一个脚本都会直接碰勇士属性，因此不宜定为高频。典型使用场景：战前脚本读取勇士当前生命值或某个关键属性，决定是否允许本次战斗继续执行。
- `data`：预期频率**低频**。虽然它能访问全局状态，但真正直接走到这一级的脚本相对少，通常只有做跨系统联动时才会用到。

四个具体接口额外补上的成员频率如下：

- `context`：预期频率**低频**。只有需要反查地图对象、刷新上下文或处理周边状态时才会用到，不属于大多数战斗脚本的常规输入。
- `locator`：预期频率**低频**。只有与地图强绑定的脚本才会真正关心坐标；很多离图战斗或纯数值逻辑根本不会访问它。

其中：

- 钩子接收 `IReadonlyNullableEHandler`
- 脚本接收 `INullableEHandler`
- 内部纯计算方法额外组装 `IReadonlyRequiredEHandler`

这样既能隔离战斗场景的可空语义，也不会再把 `IEnemyView` 这种可写入口直接暴露给战斗阶段。

## ICombatFlowHooks

战斗流程对象应支持实例级钩子注入，风格上与仓库中现有的 `IHookable/IHookController` 体系保持一致。这里的钩子只负责观察与通知，不参与流程控制，因此返回值统一为 `Promise<void>`。

建议形态如下：

```ts
interface ICombatFlowHooks<TEnemy, THero> extends IHookBase {
    onBeforeCombat?(
        handler: IReadonlyNullableEHandler<TEnemy, THero>,
        info: IEnemyDamageInfo
    ): Promise<void>;

    onAfterCombat?(
        handler: IReadonlyNullableEHandler<TEnemy, THero>,
        info: IEnemyDamageInfo
    ): Promise<void>;
}
```

- `ICombatFlowHooks.onBeforeCombat()`：预期频率**低频**。只有少数系统级扩展会专门监听战前阶段，例如动画准备、录像标记或调试日志，因此它属于明确存在但并不常写的扩展点。典型使用场景：渲染层在战前收到 `info` 后决定是否播放某段过渡动画。
- `ICombatFlowHooks.onAfterCombat()`：预期频率**低频**。它主要服务于系统层通知与收尾，常见业务逻辑更适合写在脚本里，而不是写成钩子。典型使用场景：录像或日志系统在战后统一记录本次战斗结果。

因此战斗流程对象本身建议实现为：

```ts
interface ICombatFlow<TEnemy, THero> extends IHookable<
    ICombatFlowHooks<TEnemy, THero>
> {}
```

这里钩子与脚本的分工很明确：

- 钩子偏系统扩展与观察
- 脚本偏流程配置与流程控制

## ICombatScript

战前与战后脚本统一收敛为一个注册入口，不再拆成 `addBeforeCombatScript` / `addAfterCombatScript` 两套 API。脚本本身就是一个对象，同时提供战前与战后两个方法。

建议形态如下：

```ts
interface ICombatScript<TEnemy, THero> {
    readonly priority: number;

    before(
        handler: INullableEHandler<TEnemy, THero>,
        info: IEnemyDamageInfo
    ): Promise<boolean>;

    after(
        handler: INullableEHandler<TEnemy, THero>,
        info: IEnemyDamageInfo
    ): Promise<void>;
}
```

`ICombatScript` 的成员频率如下：

- `ICombatScript.priority`：预期频率**中频**。每个脚本对象都必须声明优先级，但它只在定义脚本与注册冲突判断时出现，不属于到处都会写到的成员。典型使用场景：删怪脚本需要排在奖励脚本之前或之后时，通过 `priority` 控制顺序。
- `ICombatScript.before()`：预期频率**中频**。战前脚本有明确使用场景，例如读取预先算出的伤害信息、拦截非法战斗或执行战前演出，但并不是每一个脚本都会真正写战前逻辑。典型使用场景：某个脚本在战前根据 `info.damage` 判断本次战斗是否允许继续执行。
- `ICombatScript.after()`：预期频率**中频**。大多数默认行为更偏向战后，但它同样只会出现在定义脚本的代码里，不应误判成高频。典型使用场景：战后脚本删除怪物、发放奖励、扣除勇士生命或触发额外状态修改。

如果某个脚本只关心战前或战后，则另一侧直接返回默认值即可：

- 不关心战前时，`before` 返回 `Promise.resolve(true)`
- 不关心战后时，`after` 返回 `Promise.resolve()`

对应流程对象提供：

- `addCombatScript(script)`：注册一个脚本对象
- `deleteCombatScript(script)`：删除一个脚本对象

优先级规则建议与现有系统保持一致：

- 数值越大越先执行
- 若已有脚本占用同一优先级，则在注册时使用 `logger.warn(...)` 抛出警告，并直接放弃这次新增，不保留重复项

只有 `before` 允许通过返回 `false` 取消战斗；钩子和 `after` 都不参与流程控制。

## 战斗过程

战斗过程不额外抽成公开接口、类型别名或可注入配置，而是直接实现为 `CombatFlow` 内部的一个同步方法。它只负责一件事：

- 根据传入的怪物与勇士状态结算 `IEnemyDamageInfo`

这个同步方法必须是纯计算、无副作用的方法：

- 不修改勇士状态
- 不删除怪物
- 不发放奖励
- 不做任何桥接逻辑

异步需求全部放在战前与战后阶段处理；真正的勇士状态修改也放在战后脚本中执行，而不是放在这个内部结算方法里。

## ICombatFlow

`ICombatFlow` 是对外的战斗流程对象。它在构造时绑定勇士与上下文，后续不可更改，负责串起“战前 → 战斗 → 战后”三段流程，并统一返回 `Promise`。

建议成员如下：

- `readonly hero: IReadonlyHeroAttribute<THero>`：当前绑定的勇士属性对象
- `readonly context: IEnemyContext<TEnemy, THero>`：当前绑定的怪物上下文
- `addCombatScript(script)`：注册脚本对象
- `deleteCombatScript(script)`：删除脚本对象
- `battle(enemy, locator?)`：执行一次完整战斗流程

这些成员与方法的频率分析如下：

- `ICombatFlow.hero`：预期频率**低频**。它主要用于初始化后的少量检查、调试或对外只读暴露，不会成为常规调用点。
- `ICombatFlow.context`：预期频率**低频**。和 `hero` 类似，它更多是一个绑定关系的公开暴露，而不是经常被外部消费的核心接口。
- `ICombatFlow.addCombatScript()`：预期频率**中频**。虽然运行时通常只在初始化阶段调用，但从“用户会不会写这个调用”的角度看，所有默认行为和扩展模块都要通过它注册脚本，因此它会出现在若干模块初始化代码中。典型使用场景：在战斗系统初始化时注册删怪、奖励、战前拦截等脚本。
- `ICombatFlow.deleteCombatScript()`：预期频率**低频**。只有模块卸载、临时逻辑失效或测试场景才会显式移除脚本，常规游戏流程很少写到它。
- `ICombatFlow.battle()`：预期频率**低频**。这里的频率是指“会有多少地方真的去写这个调用”，而不是运行时调用次数；通常只有触发器入口、强制战斗指令和少量特殊逻辑会直接调用它，因此归为低频。

建议形态如下：

```ts
interface ICombatFlow<TEnemy, THero> extends IHookable<
    ICombatFlowHooks<TEnemy, THero>
> {
    readonly hero: IReadonlyHeroAttribute<THero>;
    readonly context: IEnemyContext<TEnemy, THero>;

    addCombatScript(script: ICombatScript<TEnemy, THero>): void;

    deleteCombatScript(script: ICombatScript<TEnemy, THero>): void;

    battle(
        enemy: IReadonlyEnemy<TEnemy>,
        locator?: ITileLocator | null
    ): Promise<IEnemyDamageInfo | null>;
}
```

这里不再接收 `IEnemyView`。调用方只要能提供计算后的怪物对象，就可以发起战斗；若该怪物本来就在地图中，再额外提供 `locator` 即可。

## 流程顺序

建议的执行顺序如下：

1. 调用 `battle(enemy, locator?)`，传入计算后的怪物对象，以及可选的地图定位符
2. 组装 `INullableEHandler` 与 `IReadonlyNullableEHandler`：`data` 统一来自绑定上下文上的 `dataState`；`context` 与 `locator` 是否为 `null` 取决于这只怪物是否真的属于当前地图上下文
3. 先额外组装一个内部使用的 `IReadonlyRequiredEHandler`，调用流程对象内部的纯计算方法，得到 `IEnemyDamageInfo`
4. 执行 `onBeforeCombat(handler, info)` 钩子；钩子只做观察与准备，不影响流程
5. 按优先级执行全部战前脚本；战前脚本同样接收 `info`，若任一脚本明确返回 `false`，则直接取消战斗并返回 `null`
6. 按优先级执行全部战后脚本；真正的勇士扣血等副作用在这里完成
7. 执行 `onAfterCombat(handler, info)` 钩子
8. 兑现 `battle(...)` 返回的 `Promise`

这样安排后，流程既能处理地图内怪物，也能处理离图怪物，同时不会把观察逻辑和真正参与控制的逻辑混在一起。

# 预期体量

预期代码体量为 120-180 行。分析如下：

- `combat/types.ts` 的改动主要是补齐 `IEnemyHandlerBase`、`IReadonlyEnemyHandlerBase`、`IRequiredEHandler`、`IReadonlyRequiredEHandler`、`INullableEHandler`、`IReadonlyNullableEHandler`，以及战斗流程相关接口
- `combat/combat.ts` 中的 `CombatFlow` 类主要包含脚本存储、优先级校验、handler 组装、纯伤害计算与统一的 `battle(...)` 编排逻辑
- `combat/index.ts` 的导出改动体量很小，基本只是一两行

由于本次不接入全局 legacy hook，也不硬编码任何默认行为，因此整体体量会比先前方案更小。

# 实现思路

## 1. 在 `combat/types.ts` 中补齐战斗流程接口

新增战斗流程所需的类型，包括：

- 复用现有 `IEnemyDamageInfo` 作为战斗结果类型
- 新增 `IEnemyHandlerBase` 与 `IReadonlyEnemyHandlerBase`
- 新增 `IRequiredEHandler` 与 `IReadonlyRequiredEHandler`
- 新增 `INullableEHandler` 与 `IReadonlyNullableEHandler`
- `ICombatFlowHooks`
- `ICombatScript`
- `ICombatFlow`

这里不新增 `IDamageInfo`，但会新增战斗专用 handler；旧 handler 保持原状，不再直接改公共契约。

## 2. 在 `combat/combat.ts` 中实现 `CombatFlow`

实现一个真正的流程编排类：

- 构造器中绑定 `hero` 与 `context`
- 通过私有成员保存脚本列表
- 提供 `addCombatScript` / `deleteCombatScript`
- 提供统一的 `battle(enemy, locator?)`
- 在类内部写一个同步的纯伤害计算方法

此类本身不做具体战斗结算，只负责把三阶段按顺序跑通。

## 3. 抽出统一的脚本注册逻辑

全部脚本共用同一套行为：

- 注册
- 注销
- 按优先级从高到低排序
- 同优先级警告并直接放弃新增项

因此 `combat.ts` 中应优先抽出一个局部的脚本登记结构或辅助方法，避免重复写优先级判断与删除逻辑。

## 4. 将伤害计算与状态修改拆开

流程类内部的结算方法只负责计算 `IEnemyDamageInfo`，不产生任何副作用。真正的勇士扣血、删怪、发奖励等行为全部放在战后脚本中处理。是否复用现有 `IDamageSystem` 的预估结果，可以在实现时再决定，但这部分仍然不设计成一个可替换的公开配置点。

## 5. 所有默认行为都通过外部脚本定义

默认的战后行为，如：

- 删除怪物
- 发放金币与经验
- 战后额外状态修改
- 旧系统桥接

都统一通过外部 `ICombatScript` 或实例级钩子完成。`CombatFlow` 本身只提供壳，不内置任何默认战前或战后逻辑。

## 6. 在 `combat/index.ts` 中导出新模块

当前 `combat/index.ts` 只导出了 `context`、`damage`、`enemy`、`mapDamage`、`types`，实现后需要补上对 `combat.ts` 的导出，保证 `@user/data-system` 的上层调用点可以直接使用战斗流程对象。

# 涉及文件

## 需要引用的文件

- `@motajs/common`：需要 `IHookBase`、`IHookable`、`IHookController`、`Hookable`、`HookController`、`logger`，分别用于实例级钩子能力与重复优先级警告
- `@user/data-base`：需要 `IStateBase`、`IReadonlyHeroAttribute`、`IReadonlyEnemy`
- `combat/types.ts`：已有 `IEnemyContext`、`IReadonlyEnemyContext`、`IEnemyDamageInfo` 等接口，是本次接口扩展的核心落点
- `combat/damage.ts`：虽然本次不直接修改，但内部的纯伤害计算方法大概率会参考或复用这里的预估逻辑
- `trigger/collector.ts`：可参考其优先级冲突时的警告写法，但本次脚本注册的冲突处理规则与它不同

## 需要修改的文件

### `packages-user/data-system/src/combat/types.ts`

- [ ] 新增 `IEnemyHandlerBase<TEnemy, THero>` 接口：抽出 `enemy`、`hero`、`data` 三个共享成员
- [ ] 新增 `IReadonlyEnemyHandlerBase<TEnemy, THero>` 接口：抽出只读 handler 的共享成员
- [ ] 新增 `IRequiredEHandler<TEnemy, THero>` 接口：承接 required 语义的 `context` 与 `locator`
- [ ] 新增 `IReadonlyRequiredEHandler<TEnemy, THero>` 接口：承接只读 required 语义
- [ ] 新增 `INullableEHandler<TEnemy, THero>` 接口：承接 nullable 语义的 `context` 与 `locator`
- [ ] 新增 `IReadonlyNullableEHandler<TEnemy, THero>` 接口：承接只读 nullable 语义
- [ ] 新增 `ICombatFlowHooks<TEnemy, THero>` 接口：实例级战斗钩子定义
- [ ] 新增 `ICombatScript<TEnemy, THero>` 接口：定义统一的脚本对象模型
- [ ] 新增 `ICombatFlow<TEnemy, THero>` 接口：定义流程对象的公开 API

### `packages-user/data-system/src/combat/combat.ts`

- [ ] 新增 `CombatFlow<TEnemy, THero>` 类：实现战斗流程编排
- [ ] 新增脚本存储成员：保存脚本列表
- [ ] 新增优先级注册/注销辅助逻辑：统一处理重复优先级警告与放弃注册
- [ ] 实现 `addCombatScript` / `deleteCombatScript`
- [ ] 实现内部同步结算方法：纯计算 `IEnemyDamageInfo`
- [ ] 实现 `battle(enemy, locator?)`：按“战前 → 战斗 → 战后”的顺序执行

### `packages-user/data-system/src/combat/index.ts`

- [ ] 新增 `export * from './combat'`：将战斗流程对象导出给上层使用

# 已确认事项

1. 直接复用 `IEnemyDamageInfo`，本次不新增新的结算结果结构
2. 全局 `hook` 属于 legacy 内容，不纳入本次设计
3. 这个系统只是流程壳，默认行为全部由外部脚本或钩子定义，不做任何硬编码
4. 战斗阶段不上传 `IEnemyView`，统一处理 computed enemy；真正执行战斗时，战斗专用 handler 上的 `context` 与 `locator` 允许为 `null`
5. 新增战斗专用 handler，但不修改旧 handler，也不新增可注入的战斗过程接口；脚本统一为单对象模型
6. 内部伤害计算方法是纯计算、无副作用的方法；真正的勇士状态修改放在战后脚本中执行
