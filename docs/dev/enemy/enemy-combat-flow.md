# 需求综述

`packages-user/data-system/src/combat/types.ts` 中的战斗流程接口已经是本次实现的权威设计，文档只负责解释这套接口的目的、运行语义与落地方式，不再额外改造公共接口。

本次需要补齐的是 `packages-user/data-system/src/combat/combat.ts` 中真正的战斗流程实现，使 `ICombatFlow<TEnemy, THero>` 可以驱动一次完整的实际战斗，而不是只停留在伤害预估层。

按照当前 `types.ts` 的设计，战斗流程分为三个阶段：

1. 战前阶段：按优先级执行 `before` 脚本。
2. 战斗阶段：取得本次战斗的 `IEnemyDamageInfo<TEnemy, THero>`，并执行战前 hook。
3. 战后阶段：执行战后脚本，再执行战后 hook。

当前设计已经明确区分了两种入口：

1. `battle(enemy: IEnemyView<TEnemy>)`：面向怪物视图对象。
2. `battleComputed(enemy: IReadonlyEnemy<TEnemy>)`：面向计算后怪物对象。

是否“在地图上”不能仅由参数类型决定，而应以当前绑定上下文能否反查出有效坐标为准。对于不在地图上的怪物，当前设计已经明确：

1. 它会被视为“战斗时隶属于当前绑定的 `IEnemyContext<TEnemy, THero>`”。
2. 它不会被真正放入上下文。
3. `handler.context` 使用当前绑定的上下文。
4. `handler.locator` 使用原点 `(0, 0)`。
5. `handler.onMap` 为 `false`。

另外，当前流程对象的失败语义也已经确定：`hero`、`context`、`damage` 任意一个未绑定，则本次战斗直接返回 `null`。

# 接口设计与预期

## IEnemyDamageInfo

`IEnemyDamageInfo<TEnemy, THero>` 直接作为战斗结果对象使用，不新增额外结果结构。

- `IEnemyDamageInfo.damage`：预期频率**高频**。大多数消费战斗结果的代码首先关心伤害值。典型使用场景：战后脚本根据伤害值扣除勇士生命或触发保命逻辑。
- `IEnemyDamageInfo.turn`：预期频率**低频**。回合数重要，但直接消费它的逻辑明显少于伤害值。
- `IEnemyDamageInfo.handler`：预期频率**中频**。脚本或日志逻辑经常会顺手读取本次战斗关联的怪物、勇士与定位信息。典型使用场景：战后脚本通过 `handler.enemy` 读取掉落，或通过 `handler.locator` 定位当前怪物。

## ICombatFlowHandler

`ICombatFlowHandler<TEnemy, THero>` 是脚本阶段使用的可写信息对象，职责是把战斗执行阶段真正需要改动的数据集中到一个 handler 中。

- `ICombatFlowHandler.onMap`：预期频率**低频**。它只在脚本需要区分“地图内战斗”和“离图战斗”时才会被使用。
- `ICombatFlowHandler.hero`：预期频率**高频**。几乎所有真正产生副作用的战斗脚本都会碰到勇士对象。典型使用场景：战后脚本扣除生命、增加金币或写入状态。
- `ICombatFlowHandler.enemy`：预期频率**中频**。不少脚本会读取或修改怪物对象，但频率仍低于直接操作勇士对象。典型使用场景：战后脚本读取怪物奖励，或修改怪物的战后状态。
- `ICombatFlowHandler.context`：预期频率**低频**。只有需要反查地图对象或联动上下文的脚本才会使用它。
- `ICombatFlowHandler.locator`：预期频率**低频**。只有与地图位置强相关的逻辑才会读取坐标。
- `ICombatFlowHandler.state`：预期频率**低频**。它主要服务于跨系统联动，不是常规战斗脚本的主输入。

`handler` 的组装语义需要分成两条路径：

1. `battle(enemyView)`：
    - 先尝试从绑定上下文反查该视图的真实坐标
    - 若能反查到坐标，则 `onMap = true`
    - 若不能反查到坐标，则按离图战斗处理，`onMap = false`
    - `enemy` 使用该视图对应的可写怪物对象
    - `context`、`state` 使用绑定上下文中的真实运行信息
2. `battleComputed(enemy)`：
    - 若能从绑定上下文反查到视图，则按在图战斗处理，`onMap = true`
    - 若无法反查到视图，则按离图战斗处理，`onMap = false`
    - 离图时 `context` 仍使用绑定上下文，`locator` 固定使用原点 `(0, 0)`
    - 离图时怪物不真正加入上下文，但本次战斗仍要提供一个可写的怪物对象作为 `handler.enemy`

## ICombatFlowHook

`ICombatFlowHook<TEnemy, THero>` 是实例级观察型扩展点，它只接收 `IEnemyDamageInfo<TEnemy, THero>`，不直接接触可写 handler。

- `ICombatFlowHook.onBeforeCombat()`：预期频率**低频**。更适合动画、日志、录像等系统层观察逻辑。典型使用场景：战前记录一次战斗开始事件。
- `ICombatFlowHook.onAfterCombat()`：预期频率**低频**。同样偏观察与收尾，不负责流程控制。典型使用场景：战后统一记录本次战斗结果。

当前设计下，hook 的定位很明确：

1. 它们只拿到 `info`。
2. 它们不直接承担状态修改职责。
3. 它们位于脚本阶段之后，只负责观察已经成立的流程结果。

## ICombatScript

`ICombatScript<TEnemy, THero>` 是战斗流程对象上的注册式扩展点，用于承载真正参与流程的逻辑。

- `ICombatScript.priority`：预期频率**中频**。所有脚本都要声明优先级，但它主要出现在定义脚本和排查顺序问题时。典型使用场景：让扣血脚本先于奖励脚本，或让删怪脚本压到最后执行。
- `ICombatScript.before()`：预期频率**中频**。只有需要拦截战斗或做战前准备的脚本才会实现它。典型使用场景：根据 `info.damage` 判断本次战斗是否允许继续进行。
- `ICombatScript.after()`：预期频率**中频**。绝大多数默认行为都更适合放在战后脚本里。典型使用场景：扣血、删怪、发奖励。

脚本层的规则已经确定：

1. `before()` 可以返回 `false` 来取消本次战斗。
2. `after()` 只负责战后逻辑，不再影响战斗是否成立。
3. 同一 `priority` 的脚本不允许并存；注册时需要警告并拒绝新增。
4. 脚本按 `priority` 从高到低执行。

## ICombatFlow

`ICombatFlow<TEnemy, THero>` 是对外暴露的流程对象，本体负责绑定依赖、组织阶段顺序与执行脚本。

- `ICombatFlow.hero`：预期频率**低频**。它主要用于只读检查或调试。
- `ICombatFlow.context`：预期频率**低频**。通常只在调试或初始化检查中使用。
- `ICombatFlow.damage`：预期频率**低频**。它更偏运行时绑定状态的公开暴露，而不是常规调用点。
- `ICombatFlow.bindHero()`：预期频率**中频**。初始化流程对象时必须绑定勇士。典型使用场景：状态系统创建完勇士属性对象后注入给战斗流程。
- `ICombatFlow.bindContext()`：预期频率**中频**。初始化或切换上下文时需要重绑战斗目标来源。典型使用场景：进入新楼层后，将新的怪物上下文绑定给战斗流程。
- `ICombatFlow.bindDamage()`：预期频率**中频**。战斗流程本身不做伤害计算，必须依赖外部提供的伤害上下文。典型使用场景：伤害系统初始化完成后绑定给战斗流程。
- `ICombatFlow.battle()`：预期频率**低频**。它面向怪物视图对象，适合最常规的战斗入口。典型使用场景：交互逻辑在玩家尝试攻击某个怪物视图时直接传入 `IEnemyView<TEnemy>`。
- `ICombatFlow.battleComputed()`：预期频率**低频**。它主要服务于“只有计算后怪物对象，没有视图对象”的调用点。典型使用场景：脚本逻辑对一个临时怪物对象发起离图战斗。
- `ICombatFlow.addCombatScript()`：预期频率**中频**。所有默认行为和扩展模块都要通过它接入流程。典型使用场景：初始化阶段注册扣血、删怪、奖励等脚本。

结合这些成员可以看出，`ICombatFlow` 的设计目的不是把所有逻辑都塞进一个类里，而是提供一个可被上层系统组装的公共流程壳。

## 流程顺序

当前流程顺序已经确定为：

1. 先计算本次战斗的 `IEnemyDamageInfo<TEnemy, THero>`。
2. 按优先级执行全部 `before()` 脚本。
3. 若战前脚本未取消战斗，则执行 `onBeforeCombat(info)` hook。
4. 执行全部 `after()` 脚本。
5. 执行 `onAfterCombat(info)` hook。
6. 返回本次战斗信息。

也就是说，hook 并不是包裹整段脚本流程的最外层，而是位于脚本之后的观察阶段：`before scripts -> before hook -> after scripts -> after hook`。

# 预期体量

预期代码体量为 140-220 行。分析如下：

1. `combat/combat.ts` 需要新建 `CombatFlow<TEnemy, THero>`，实现 hook 能力、绑定逻辑、脚本存储、重复优先级拒绝以及 `battle(...)` / `battleComputed(...)` 两条入口，这部分是主要体量来源。
2. `combat/combat.ts` 还需要补齐离图 `battleComputed(...)` 的虚拟上下文语义，包括 `onMap = false`、原点定位与不真正加入上下文的处理。
3. `combat/index.ts` 只需要增加 `export * from './combat'`，改动很小。
4. `combat/types.ts` 作为已确认的设计源头，本次文档不计划修改其公共接口。

# 可能风险

本次文档将 `combat/types.ts` 视为已确认设计，不计划改动其中的公共接口，因此这里不额外展开实现风险。

# 实现思路

## 1. 新增 `combat/combat.ts`

新增 `CombatFlow<TEnemy, THero>` 类，使用 `@motajs/common` 的 `Hookable` / `HookController` 体系实现 `ICombatFlow<TEnemy, THero>`。

## 2. 完成绑定与脚本存储

类内部保存三个绑定对象与脚本列表：

1. `hero`：保存可写勇士对象，同时对外按接口暴露只读视图。
2. `context`：保存当前战斗所属的怪物上下文。
3. `damage`：保存当前使用的伤害上下文。
4. `scriptList`：保存已注册脚本，并在注册时检查重复优先级。

## 3. 完成两条战斗入口的数据组装

1. `battle(enemyView)`：
    - 检查绑定是否完整，不完整直接返回 `null`
    - 通过 `damage.getDamageInfo(enemyView)` 获取伤害信息
    - 通过 `context.getEnemyLocatorByView(enemyView)` 判断当前是否在图
    - 若能拿到坐标，则组装 `onMap = true` 的 `ICombatFlowHandler<TEnemy, THero>`
    - 若拿不到坐标，则按离图语义组装 `onMap = false`、`locator = (0, 0)` 的 `ICombatFlowHandler<TEnemy, THero>`
2. `battleComputed(enemy)`：
    - 检查绑定是否完整，不完整直接返回 `null`
    - 先尝试从 `context.getViewByComputed(enemy)` 反查视图
    - 若反查成功，则复用在图路径处理
    - 若反查失败，则按离图语义处理：`onMap = false`、`locator = (0, 0)`、怪物不加入上下文
    - 离图时的伤害计算直接使用绑定 `context` 上当前 `IDamageSystem<TEnemy, THero>` 的 calculator，基于绑定上下文、原点坐标与目标怪物组装只读 handler 进行纯计算

## 4. 完成 `battle(...)` 主流程

主流程按固定顺序执行：

1. 先取得 `IEnemyDamageInfo<TEnemy, THero>` 与 `ICombatFlowHandler<TEnemy, THero>`。
2. 按优先级执行全部 `before()` 脚本，若任一脚本返回 `false`，则立刻结束并返回 `null`。
3. 执行 `onBeforeCombat(info)` hook。
4. 执行全部 `after()` 脚本，处理真正的副作用。
5. 执行 `onAfterCombat(info)` hook。
6. 返回本次战斗信息。

## 5. 更新 `combat/index.ts`

在当前导出列表基础上补上 `export * from './combat'`，让上层可以直接拿到流程实现。

# 涉及文件

## 需要引用的文件

1. `@motajs/common`：用于 `IHookBase`、`IHookable`、`IHookController`、`Hookable`、`HookController`、`logger`。
2. `@user/data-base`：用于 `IEnemy`、`IReadonlyEnemy`、`IHeroAttribute`、`IReadonlyHeroAttribute`、`IStateBase`。
3. `combat/types.ts`：本次实现的权威接口来源，重点使用 `ICombatFlow`、`ICombatFlowHandler`、`ICombatFlowHook`、`ICombatScript`、`IEnemyDamageInfo`、`IEnemyView`。
4. `combat/context.ts`：需要使用 `getViewByComputed(...)`、`getEnemyLocatorByView(...)`、`getDamageSystem()` 等能力。
5. `combat/damage.ts`：需要复用 `IDamageContext.getDamageInfo(...)`、`IDamageContext.getDamageInfoByComputed(...)` 与 `IDamageSystem.getCalculator()` 的现有语义。
6. `combat/enemy.ts`：需要依赖怪物视图提供的可写怪物入口。

## 需要修改的文件

### `packages-user/data-system/src/combat/combat.ts`

- [ ] 新增 `CombatFlow<TEnemy, THero>` 类：实现 `ICombatFlow<TEnemy, THero>` 的完整流程壳。
- [ ] 新增绑定成员：保存 `hero`、`context`、`damage` 三个外部注入对象。
- [ ] 新增脚本存储成员：保存已注册的战斗脚本，并在注册时拒绝重复优先级。
- [ ] 新增私有组装方法：分别处理 `battle(IEnemyView<TEnemy>)` 与 `battleComputed(IReadonlyEnemy<TEnemy>)` 的 handler 组装。
- [ ] 编写 `CombatFlow.battle(...)` 与 `CombatFlow.battleComputed(...)`：按接口设计执行战前、战斗、战后三阶段。

### `packages-user/data-system/src/combat/index.ts`

- [ ] 新增 `export * from './combat'`：导出战斗流程实现。

# 问题

1. `battle(enemy: IEnemyView<TEnemy>)` 传入怪物视图时，是否应当与 `battleComputed(...)` 保持完全一致的离图判定，即只要 `context.getEnemyLocatorByView(enemy)` 返回空，就按 `onMap = false`、原点坐标处理？

> 使用所有的可能查询方式，包括 `getEnemyLocator` `getEnemyLocatorByView` `getViewByComputed` 等都查一遍，如果还是没有才按不在地图上处理。还有为啥要写成离图在图？看着不别扭吗，直接写成在地图上和不在地图上多清晰。

2. 离图战斗时提供给 `handler.enemy` 的可写怪物对象，是否直接使用传入视图上的可写对象 / 传入 computed 怪物的克隆对象即可，还是还有额外约束？
