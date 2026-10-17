# 状态钩子

状态类特殊属性（中毒、衰弱、重生等）不会在一次计算里结束：它们要在移动、战斗、切换楼层等时机反复生效。这类属性必须借助钩子实现，而且一个状态往往需要**多个钩子**协同。钩子本身的用法见[钩子](./hooks.md)，整体流程见[战斗总览](./combat-overview.md)。

## 为什么一个状态要用多个钩子

以中毒为例，它会从两个时机扣血：

- 勇士正常走一步时，在移动钩子的 `onStepEnd` 里扣血；
- 勇士通过寻路瞬移到目标点时，在寻路钩子的 `onAfterTeleportTo` 里按路径长度扣血。

只挂其中一个钩子，另一种移动方式就会漏掉中毒。重生也一样：战后要先记录位置，切层时再把怪物放回去，两个时机分别属于战斗钩子与楼层钩子。

## 三类内置状态

| 状态 | 使用的钩子 | 实现位置 | 行为 |
|------|------------|----------|------|
| 中毒 | `onStepEnd` + `onAfterTeleportTo` | `EnemyMoveHooks` / `EnemyPathfindingHooks` | 读取 `poison` flag，按移动扣血；瞬移时按路径长度处理 |
| 衰弱 | `onAfterCombat` + 修饰器 | `EnemyCombatHooks` | 战后取最高虚弱值，用 `PercentageModifier` 降低攻防 |
| 重生 | `onAfterCombat` + `onSetFloor` | `EnemyCombatHooks` / `EnemyChangeFloorHooks` | 战后记录 `rebirth` flag；切层时把记录的事件块放回 |

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
- 勇士位置：处理切换楼层。

## 战斗流程中的时序

战斗钩子的执行顺序是：

1. 战前脚本 `before`；
2. `onBeforeCombat` 钩子；
3. 战后脚本 `after`；
4. `onAfterCombat` 钩子。

因此，想在「奖励结算之后」处理状态，应该用 `onAfterCombat`；想在战斗开始前拦截，应该用脚本的 `before`，见[战斗脚本](./enemy-combat-script.md)。

## 示例：下次战斗伤害乘二

这个状态需要两处配合：战斗钩子负责「挂上状态」，伤害计算器负责「消费状态」。先定义一个无参数特殊属性（code 45）：

```ts
// special.ts：45 - 蓄力
map.set(
    45,
    defineNonePropertySpecial(45, {
        name: '蓄力',
        desc: '战斗后，下一次战斗伤害翻倍。',
        color: '#F99'
    })
);
```

再写一个战斗钩子。它不修改内置的 `EnemyCombatHooks`，而是作为另一个钩子并存：

```ts
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { ICombatFlowHooks, IEnemyDamageInfo } from '@user/data-system';

export class ChargedHooks implements ICombatFlowHooks<IEnemyAttr, IHeroAttr> {
    constructor(readonly state: ICoreState) {}

    async onAfterCombat(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>
    ): Promise<void> {
        if (info.handler.enemy.hasSpecial(45)) {
            this.state.flags.setFieldValue('nextBattleDouble', true);
        }
    }
}

state.combat.addHook(new ChargedHooks(state));
```

最后在伤害计算器里消费这个 flag：

```ts
const double = handler.state.flags.getFieldValueDefaults(
    'nextBattleDouble',
    false
);
if (double) {
    damage *= 2;
    handler.state.flags.deleteField('nextBattleDouble');
}
```

把这段逻辑放在 `calculate` 返回之前即可。伤害公式的其余部分见[伤害计算](./enemy-calculator.md)。

这个例子体现了「一个状态要用多个钩子/系统」：`onAfterCombat` 只负责记录状态，真正影响伤害的是计算器。如果只在钩子里改 flag 而不改计算器，状态不会有任何效果。

状态里用到的临时加减或百分比，优先用修饰器实现，概念与 `save` 参数见[勇士属性](./hero-attribute.md)。
