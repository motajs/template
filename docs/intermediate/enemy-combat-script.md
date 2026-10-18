# 战斗脚本

战斗前后常有一些规则要跑：有的怪物「不许打」，有的战斗要「打完回血」，还有的要在结算奖励前调整状态。这些规则不适合塞进伤害公式，而是在战斗流程上挂一段逻辑——这就是战斗脚本（combat script）。

战前脚本可以决定「这场战斗是否发生」，战后脚本负责结算奖励或修改状态。脚本与钩子的分工见下方选型表，整体流程见[战斗总览](./combat-overview.md)。

## 接口

`ICombatScript` 有三个成员：

- `priority`：优先级，越高越先执行；
- `before(info, handler)`：战前执行，返回 `Promise<boolean>`。返回 `false` 会立刻停止后续战前脚本，并放弃此次战斗；
- `after(info, handler)`：战后执行，返回 `Promise<void>`。

`info` 是 `IEnemyDamageInfo`，包含 `damage`、`turn` 与 `handler`；`handler` 是 `ICombatFlowHandler`，包含：

- `onMap`：怪物是否在地图上；
- `force`：是否为强制战斗；
- `hero`：可修改的勇士属性对象；
- `enemy`：怪物对象；
- `context`：怪物上下文；
- `locator`：怪物位置。

注册方式：

```ts
state.combat.addCombatScript(new MainCombatScript());
```

同优先级的脚本不能重复注册：`addCombatScript` 遇到相同 `priority` 会告警并忽略后一个脚本。内置的 `MainCombatScript` 优先级为 `0`。

## 内置脚本

`MainCombatScript`（`src/data/enemy/script.ts`）做两件事：

- **战前**：非强制战斗时，如果勇士当前生命小于本次伤害，返回 `false`，阻止战斗；
- **战后**：把怪物与支援者的经验、金币加到勇士身上；`curse` flag 为 `true` 时不加；最后发出一次全局提示。

### 改内置，还是自己写

- **改内置脚本**：直接改 `src/data/enemy/script.ts` 的 `MainCombatScript`（内置的战前拦截与战后结算就写在里面）。
- **写自己的脚本**：实现 `ICombatScript` 接口，再用 `addCombatScript` 追加。适合额外规则，或不想改动内置文件时。

`addCombatScript` 是**追加**而不是替换：内置脚本仍会执行，新脚本按 `priority` 与它一起排序；但同优先级的脚本不能重复注册。

## 脚本 vs 钩子

战斗前后能做事的除了脚本，还有钩子。两者的区别主要在「能不能改变战斗的走向」和「多个监听者如何共存」：

| 需求                           | 用脚本                    | 用钩子                            |
| ------------------------------ | ------------------------- | --------------------------------- |
| 决定这场战斗是否发生           | 是，`before` 返回 `false` | 否，`onBeforeCombat` 不能阻止战斗 |
| 按固定顺序结算奖励或回血       | 是，用 `priority` 排序    | 顺序不由优先级控制                |
| 只响应战斗结果做副作用         | 可以，但不是必须          | 是，`onAfterCombat` 更直接        |
| 多个互不影响的监听者           | 不适合，同优先级会冲突    | 适合，多个钩子可以并存            |
| 需要和内置脚本一样参与战前拦截 | 是                        | 否                                |

简单记：**要拦截或按顺序结算，用脚本；只想在战斗前后做附加动作，用钩子。**

## 战前示例：拥有某特殊属性时无法战斗

下面的脚本检查怪物是否拥有 code 18 的特殊属性（无敌，编号见[特殊属性](./enemy-specials.md)的「内置属性编号表」），有则直接放弃战斗（示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」）。代码中用 `[模板]` 标出可原样照抄的行，用 `[需改]` 标出必须按需求修改的行。

```ts
// [模板] 依赖导入：类型分别来自 @user/data-common 与 @user/data-system
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import {
    ICombatFlowHandler,
    ICombatScript,
    IEnemyDamageInfo
} from '@user/data-system';

// [需改] 类名：换成你的脚本名
export class SealCombatScript implements ICombatScript<IEnemyAttr, IHeroAttr> {
    // [需改] priority：越大越先执行；内置脚本是 0
    readonly priority = 100;

    // [模板] before 签名固定：战前执行，返回 false 即放弃战斗
    async before(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>,
        handler: ICombatFlowHandler<IEnemyAttr, IHeroAttr>
    ): Promise<boolean> {
        // [需改] 判断条件：怪物带「无敌」（code 18）就拦下
        if (handler.enemy.hasSpecial(18)) {
            // [需改] 向玩家提示（可换成别的处理）
            handler.state.emitTip('这个怪物无法被击败。');
            // [模板] 返回 false：放弃本次战斗
            return false;
        }
        // [模板] 返回 true：允许继续
        return true;
    }

    // [模板] after 也必须实现；本脚本战后不做任何事，留空即可
    async after(): Promise<void> {}
}

// [需改] 注册这行要挪进 initializeEnemy（见文末「注册在哪里」）
state.combat.addCombatScript(new SealCombatScript());
```

`priority = 100` 让它先于内置脚本执行；返回 `false` 后，后续战前脚本、战后脚本与 `onAfterCombat` 钩子都不会执行。

这里的 18 号在内置属性编号表里就是「无敌」，地图伤害的转换器也使用同一套编号（阻击是 16），所以这个判断与其他系统没有编号冲突。

## 战后示例：战后玩家回复固定量生命值

下面的脚本在每场战斗后给勇士回复 20 点生命：

```ts
// [模板] 依赖导入
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import {
    ICombatFlowHandler,
    ICombatScript,
    IEnemyDamageInfo
} from '@user/data-system';

// [需改] 类名：换成你的脚本名
export class HealAfterCombatScript implements ICombatScript<
    IEnemyAttr,
    IHeroAttr
> {
    // [需改] priority：设成负值，排在内置脚本之后执行
    readonly priority = -10;

    // [模板] before 也要实现；本脚本不拦截战斗，直接返回 true
    async before(): Promise<boolean> {
        return true;
    }

    // [模板] after 签名固定：战后执行
    async after(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>,
        handler: ICombatFlowHandler<IEnemyAttr, IHeroAttr>
    ): Promise<void> {
        // [需改] 真正做的事：给勇士回 20 点血
        handler.hero.add('hp', 20);
    }
}

// [需改] 注册
state.combat.addCombatScript(new HealAfterCombatScript());
```

`priority = -10` 让它在内置脚本之后执行，避免在奖励结算之前改动勇士状态。`handler.hero` 是可修改对象，直接 `add` 即可。

`priority` 只需要记住一句：数值越大越先执行；战前与战后各自按这个顺序遍历脚本列表。

## 注册在哪里

`addCombatScript` 要写进 `initializeEnemy`。下面是 `src/data/enemy/initialize.ts` 中该函数的样子（省略了无关的行）：

```ts
export function initializeEnemy(
    state: ICoreState
): IEnemyInitializationReturns {
    // ...省略：怪物管理器、特殊属性、上下文、伤害系统、地图伤害的初始化...

    const ctx = state.enemyContext;

    // ...省略：光环转换器与最终效果的注册...

    // 添加默认战前战后脚本 —— 内置脚本在这里注册
    state.combat.addCombatScript(new MainCombatScript());
    // [需改] 你自己的脚本紧接着追加即可：
    // state.combat.addCombatScript(new SealCombatScript());

    // ...省略：钩子的注册...
}
```

把 `addCombatScript(...)` 放在内置脚本那一行之后，你的脚本就会随 `initializeEnemy` 一起生效。
