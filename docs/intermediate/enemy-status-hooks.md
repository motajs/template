# 状态钩子

中毒、衰弱、重生这类状态有个共同点：它们不会在一次计算里结束，而是要在移动、战斗、切换楼层等时机反复生效。只靠一次属性调整实现不了，必须挂到这些时机上——这就是钩子（hook）。

而且这类状态往往不能只挂一个钩子。中毒要同时管正常走路与瞬移，重生要同时管战后与切层。钩子本身的用法见[钩子](./hooks.md)，整体流程见[战斗总览](./combat-overview.md)。

## 为什么一个状态要用多个钩子

以中毒为例，它会从两个时机扣血：

- 勇士正常走一步时，在移动钩子的 `onStepEnd` 里扣血；
- 勇士通过寻路瞬移到目标点时，在寻路钩子的 `onAfterTeleportTo` 里按路径长度扣血。

只挂其中一个钩子，另一种移动方式就会漏掉中毒。重生也一样：战后要先记录位置，切层时再把怪物放回去，两个时机分别属于战斗钩子与楼层钩子。

## 三类内置状态

| 状态 | 使用的钩子                        | 实现位置                                     | 行为                                                 |
| ---- | --------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| 中毒 | `onStepEnd` + `onAfterTeleportTo` | `EnemyMoveHooks` / `EnemyPathfindingHooks`   | 读取 `poison` flag，按移动扣血；瞬移时按路径长度处理 |
| 衰弱 | `onAfterCombat` + 修饰器          | `EnemyCombatHooks`                           | 战后取最高虚弱值，用 `PercentageModifier` 降低攻防   |
| 重生 | `onAfterCombat` + `onSetFloor`    | `EnemyCombatHooks` / `EnemyChangeFloorHooks` | 战后记录 `rebirth` flag；切层时把记录的事件块放回    |

补充说明：

- 中毒的每步扣血由 `EnemyMoveHooks.handlePoison` 处理，移动钩子还会顺带调用 `handleMapDamage`；
- 衰弱在 `EnemyCombatHooks` 构造时向勇士的 `atk` 与 `def` 挂两个 `PercentageModifier`，战后通过 `setWeakValue` 设置负百分比；
- 重生的战后记录以楼层为键存入 `rebirth` flag，切换楼层时由 `EnemyChangeFloorHooks.onSetFloor` 读取并放回。

同一个 `onAfterCombat` 还处理诅咒、仇恨、退化等状态，因此新增状态时要先检查现有钩子是否已经覆盖了你的时机。

## 注册

这些钩子在 `initializeEnemy` 中注册：

```ts
state.hero.location.mover.addHook(new EnemyMoveHooks(state));
state.pathfinding.addHook(new EnemyPathfindingHooks(state));
state.combat.addHook(new EnemyCombatHooks(state));
state.hero.location.addHook(new EnemyChangeFloorHooks(state));
```

四个注册点分别对应：

- 勇士移动器：处理正常移动；
- 寻路系统：处理瞬移；
- 战斗流程：处理战前/战后；
- 勇士位置：处理切换楼层。这里的 `onSetFloor` 属于 `IHeroLocationHooks`，挂在 `state.hero.location` 上；它和[钩子](./hooks.md)里「切换楼层前后」的 `IHeroStateHooks.onBeforeChangeFloor` / `onAfterChangeFloor`（挂在 `state.hero` 上）是两族不同的钩子，别混用。

## 改内置：往内置钩子类里加逻辑

内置状态钩子一共四个类，全在 `src/data/enemy/hook.ts`，而且已经在 `initializeEnemy` 里注册好了。所以**改内置就是改这些类的现有方法体**——不新建类，也不用再调用 `addHook`。这是本篇的主线做法。

先按「什么时候生效」找落点：

| 想做的事               | 改哪里                                                  |
| ---------------------- | ------------------------------------------------------- |
| 勇士每走一步时生效     | `EnemyMoveHooks.onStepEnd`（或它调用的 `handlePoison`） |
| 勇士瞬移后生效         | `EnemyPathfindingHooks.onAfterTeleportTo`               |
| 战斗结束后生效         | `EnemyCombatHooks.onAfterCombat`                        |
| 切换楼层时生效         | `EnemyChangeFloorHooks.onSetFloor`                      |
| 影响勇士攻防的持续增减 | `EnemyCombatHooks` 的修饰器（构造时挂上，战后设值）     |

内置 `EnemyCombatHooks.onAfterCombat` 已经按「中毒 → 衰弱 → 诅咒 → 仇恨 → 退化 → 重生」的顺序排好；新状态接在末尾即可。它开头还有两句状态校验（`info.handler.state !== this.state` 等），不要删——删了会让别的存档 / 沙盒里的战斗也触发这些效果。

## 战斗流程中的时序

战斗钩子的执行顺序是：

1. 战前脚本 `before`；
2. `onBeforeCombat` 钩子；
3. 战后脚本 `after`；
4. `onAfterCombat` 钩子。

因此，想在「奖励结算之后」处理状态，应该用 `onAfterCombat`；想在战斗开始前拦截，应该用脚本的 `before`，见[战斗脚本](./enemy-combat-script.md)。

注意这个顺序带来一个有用的性质：**脚本的 `after` 每场只跑一次，且早于 `onAfterCombat`**。所以「本场消费、下场生效」的开关可以这样分工——脚本负责清掉上一场留下的标记，钩子负责在战斗结束时重新挂上。

## 示例：下次战斗伤害乘二

钩子能改状态，但「伤害乘二」最终要由伤害公式来兑现。这个例子展示一个状态如何跨多个系统：战斗钩子负责「挂上状态」，伤害计算器负责「读状态」，战斗脚本负责「一次性消费状态」。

:::warning 计算器不能消费状态
不要在伤害计算器里 `deleteField` 之类地去「消费」这个 flag。计算器在一次战斗里会被反复调用（算临界、显示伤害、图鉴等），谁先调用谁就把 flag 用掉了，真正开打时反而不翻倍；而且这属于改动外部状态，违反「计算器必须无副作用」的规则（见[伤害计算](./enemy-calculator.md)）。正确做法是：**计算器只读 flag**，由「一场战斗只跑一次」的**战斗脚本**去消费它。
:::

本示例要串起三个系统，三处都是改内置文件：在 `EnemyCombatHooks.onAfterCombat` 末尾挂上「蓄力」状态，在 `MainDamageCalculator.calculate` 里只读这个 flag 把伤害翻倍，在 `MainCombatScript.after` 里把 flag 消费掉。

**目标**：带「蓄力」（code 45）的怪物打完后，下一场战斗的伤害翻倍，且只翻倍一次。

**改哪里**：`src/data/enemy/special.ts` 登记属性；`src/data/enemy/hook.ts`、`calculator.ts`、`script.ts` 三处内置文件各加一段。全部是内置文件，改完不需要注册。

**复制什么**：先定义一个无参数特殊属性（code 45）——

```ts
// special.ts：45 - 蓄力
// [需改] 照常加进 src/data/enemy/special.ts
map.set(
    45, // [需改] 编号
    defineNonePropertySpecial(45, {
        name: '蓄力', // [需改] 名称
        desc: '战斗后，下一次战斗伤害翻倍。', // [需改] 说明
        color: '#F99' // [需改] 颜色
    })
);
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**第一步：在战斗钩子里「挂上状态」。** 加在 `EnemyCombatHooks.onAfterCombat` 末尾——

```ts
async onAfterCombat(
    info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>
): Promise<void> {
    // ...省略：内置的状态校验与中毒、衰弱、诅咒、仇恨、退化、重生各段...

    // [需改] 带「蓄力」（code 45）的怪物战斗后，记下「下次战斗伤害翻倍」
    if (info.handler.enemy.hasSpecial(45)) {
        this.state.flags.setFieldValue('nextBattleDouble', true);
    }
}
```

**第二步：在战斗脚本里「消费状态」。** 加在 `MainCombatScript.after` 末尾。它每场战斗只执行一次，而且早于 `onAfterCombat`，正好清掉上一场留下的标记：

```ts
async after(
    info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>,
    handler: ICombatFlowHandler<IEnemyAttr, IHeroAttr>
): Promise<void> {
    // ...省略：内置的经验金币结算、诅咒判断与全局提示...

    // [需改] 战斗结束后清掉标记，保证只翻倍一次
    handler.state.flags.deleteField('nextBattleDouble');
}
```

**第三步：让伤害计算器「只读」这个 flag**（不改、不删）。加在 `MainDamageCalculator.calculate` 返回之前——

```ts
// [模板] 放在 calculate 返回之前：只读，不修改任何外部状态
const double = handler.state.flags.getFieldValueDefaults(
    'nextBattleDouble',
    false
);
if (double) {
    damage *= 2; // [需改] 翻倍逻辑；注意不要在这里 deleteField
}
```

**改什么**：编号（`45`）、flag 名（`nextBattleDouble`）、翻倍写法换成你自己的。

**怎么验证**：先打一场带「蓄力」的怪物（这场结束时 flag 被挂上），再打任意一只**不带**蓄力的怪物——第二场伤害应翻倍；接着打第三场，应恢复原值（第二场结束时 flag 已被脚本清掉）。如果第二场打的仍是带蓄力的怪物，它在结尾会重新挂上 flag，第三场就还会翻倍，这属于预期行为。

**注意**：这里要三个系统配合，缺一不可——钩子负责记录状态，计算器只读并翻倍，战斗脚本负责在真正的战斗里消费掉它。若把消费放进计算器，就会因计算器被反复调用（临界、显示、图鉴等）而提前把 flag 用掉，只有放进「每场战斗只跑一次」的脚本里才可靠。

三处都在内置类里，所以不必注册；如果你确实另写了钩子或脚本类，才需要在 `initializeEnemy` 里 `addHook` / `addCombatScript`（见下一节）。

状态里用到的临时加减或百分比，优先用修饰器实现，概念与 `save` 参数见[勇士属性](./hero-attribute.md)。

## 自己写钩子类

只有在「内置四个钩子类都放不下」时才需要自己写：比如这段逻辑要独立于内置状态、能单独注册或移除，或者你想让它排在某个内置钩子的前后。

自己写类要同时处理接口签名、挂载点与注册，而且同一个钩子接口上会与内置类并存、顺序不总由你控制，改动面比在内置方法体里加一段大。

**如果你不怎么懂代码，建议直接改内置钩子（`src/data/enemy/hook.ts` 的四个 `Enemy*Hooks` 类），而不是自己写新的类。** 上面「改内置」一节已经覆盖了移动、瞬移、战后、切层四个时机；自写钩子意味着你要自己确认挂载点、优先级与状态校验。

做法是实现对应接口的类，构造时保存 `state`，再 `addHook` 到对应挂载点：

- 移动：`state.hero.location.mover.addHook(new ...Hooks(state))`，实现 `IObjectMoverHooks`；
- 寻路：`state.pathfinding.addHook(new ...Hooks(state))`，实现 `IPathfindingSystemHooks`；
- 战斗：`state.combat.addHook(new ...Hooks(state))`，实现 `ICombatFlowHooks`；
- 切层：`state.hero.location.addHook(new ...Hooks(state))`，实现 `IHeroLocationHooks`。

下面仍以「蓄力」为例，演示自写类的形态：一个钩子负责挂状态，一个脚本负责消费（示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」）。

```ts
// [需改] 类名
export class ChargedHooks implements ICombatFlowHooks<IEnemyAttr, IHeroAttr> {
    constructor(readonly state: ICoreState) {} // [模板] 存下数据端状态，供读写 flag

    // [模板] onAfterCombat 签名固定：一场战斗结束后调用一次
    async onAfterCombat(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>
    ): Promise<void> {
        // [需改] 只有带「蓄力」（code 45）的怪物战斗后，才设置这个 flag
        if (info.handler.enemy.hasSpecial(45)) {
            // [需改] 在全局 flag 里记下「下次战斗伤害翻倍」
            this.state.flags.setFieldValue('nextBattleDouble', true);
        }
    }
}

// [需改] 类名
export class ConsumeDoubleScript implements ICombatScript<
    IEnemyAttr,
    IHeroAttr
> {
    constructor(readonly state: ICoreState) {} // [模板] 存下状态以清 flag

    // [需改] 优先级必须与内置脚本的 0 不同，否则 addCombatScript 会告警并忽略
    readonly priority = -10;

    // [模板] 本脚本不拦截战斗，直接放行
    async before(): Promise<boolean> {
        return true;
    }

    // [模板] after 一场战斗只跑一次，是消费 flag 的正确位置
    async after(): Promise<void> {
        // [需改] 战斗结束后清掉 flag，保证只翻倍一次
        this.state.flags.deleteField('nextBattleDouble');
    }
}

// [需改] 注册：钩子挂到战斗流程，脚本追加进战斗流程
state.combat.addHook(new ChargedHooks(state));
state.combat.addCombatScript(new ConsumeDoubleScript(state));
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：编号（`45`）、类名、flag 名、`priority` 与翻倍写法换成你自己的。第三步「计算器只读」与上面改内置的写法完全相同，不再重复。

**怎么验证**：同「改内置」一节——打一场、再打一场，看第二场是否翻倍、第三场是否恢复。

**注意**：自写钩子与内置 `EnemyCombatHooks` **同时**存在，不是替换。注册位置要放进 `initializeEnemy`（`src/data/enemy/initialize.ts`），与内置钩子那几行并列。
