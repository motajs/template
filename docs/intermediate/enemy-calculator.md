# 伤害计算

属性算准之后，战斗还差最后一步换算：这些 `hp`、`atk`、`def` 到底意味着勇士会掉多少血、要打几回合？负责这件事的就是伤害计算器。

它实现的是 `f(enemy, hero)`：输入计算后的怪物与勇士属性，输出 `{ damage, turn }`。本篇导读内置公式，并说明要改公式时应该动哪里。整体流程见[战斗总览](./combat-overview.md)。

## 接口

`IDamageCalculator` 有两个方法：

- `calculate(handler)`：返回 `IEnemyDamageInfoBase`，即 `{ damage, turn }`；
- `getCriticalLimit(handler, attribute)`：返回指定勇士属性进行临界计算时的上界。

`handler` 是 `IReadonlyDamageHandler`，包含：

- `enemy`：计算后的怪物对象；
- `hero`：勇士属性对象；
- `context`：怪物上下文；
- `locator`：怪物位置；
- `state`：数据端状态对象。

注册方式：

```ts
state.enemyContext.getDamageSystem()?.useCalculator(new MainDamageCalculator());
```

`initializeEnemy` 在创建 `DamageSystem` 后就调用了 `useCalculator(new MainDamageCalculator())`，因此默认使用内置公式。

## 内置公式逐段导读

与其一次背下整条公式，不如按顺序看每一段在算什么。`MainDamageCalculator.calculate`（`src/data/enemy/calculator.ts`）按以下顺序计算：

1. **读取属性**：从 `hero` 读 `hp`、`atk`、`def`、`mdef`，从 `enemy` 读 `atk`、`def`、`hp`。
2. **无敌分支**：满足条件时直接返回 `{ damage: Infinity, turn: 0 }`，表示无法击败。
3. **勇士每回合伤害**：`atk - monDef`。如果小于等于 0，同样返回 `Infinity`。
4. **吸血**：按勇士生命值比例增加伤害，必要时把伤害加到怪物生命上。
5. **怪物每回合伤害**：`monAtk - def`；魔攻时忽略勇士防御；连击则乘以攻击次数。
6. **回合数**：`turn = ceil(monHp / heroPerDamage)`。
7. **支援**：怪物带有支援者时，递归计算每个支援者的伤害与回合数，并把它们累加到当前怪物上。
8. **先攻、破甲、反击、净化**：按各自规则增加伤害或每回合伤害。
9. **总伤害**：`damage += (turn - 1) * enemyPerDamage`，再减去魔防；未开启负伤时，负伤害归零。
10. **固伤、仇恨、自爆**：固伤与仇恨不受魔防影响；自爆把伤害抬到「勇士生命 - 1」。
11. **返回**：`damage` 向下取整，连同 `turn` 一起返回。

「加自己的属性加在哪一步」取决于你想改什么：

- 只是让怪物某项属性更高：不要改计算器，放进光环、查询或最终效果，让 `enemy.getAttribute(...)` 读到新值即可；
- 要让属性按回合数累积、按条件改变倍率、或增加新的伤害分支：在 `calculate` 的对应段落里改公式；
- 只是给勇士一侧加临时数值：用[勇士属性](./hero-attribute.md)里的修饰器，计算器会自动读到最终属性。

## 支援怪

支援怪部分的递归计算较绕：计算当前怪物时，会把每个支援者的回合数与伤害也加进来。初次阅读可以暂时跳过这一段，不影响自定义普通怪物的公式；等需要处理支援组合时再回来看。

## 示例：等差数列属性

有时公式本身要随回合变化，而光环、查询、最终效果都做不到这一点——它们改的是一次计算里的固定属性。这时就该动计算器。

「等差数列属性」指怪物攻击每回合按固定值递增。属性本身在一次计算中是常量，所以不能靠给 `atk` 加值实现；要在 `calculate` 里把「每回合伤害」按等差数列求和：

示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」。

```ts
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import {
    CriticalableHeroStatus,
    IDamageCalculator,
    IEnemyDamageInfoBase,
    IReadonlyEnemyHandler
} from '@user/data-system';

export class ArithmeticCalculator implements IDamageCalculator<
    IEnemyAttr,
    IHeroAttr
> {
    calculate(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): IEnemyDamageInfoBase {
        const { enemy, hero } = handler;
        const heroPerDamage = hero.getFinalAttribute('atk') - enemy.getAttribute('def');
        if (heroPerDamage <= 0) {
            return { damage: Infinity, turn: 0 };
        }

        const turn = Math.ceil(enemy.getAttribute('hp') / heroPerDamage);
        const base = Math.max(
            0,
            enemy.getAttribute('atk') - hero.getFinalAttribute('def')
        );
        const step = 5;

        // 首项 base，公差 step，共 turn 项
        const damage = turn * base + (step * turn * (turn - 1)) / 2;
        return { damage: Math.floor(damage), turn };
    }

    getCriticalLimit(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        attribute: CriticalableHeroStatus<IHeroAttr>
    ): number {
        return handler.hero.getFinalAttribute(attribute);
    }
}
```

这是只保留本示例所需分支的最小计算器；内置公式里的无敌、吸血、支援等分支需要你按上文顺序自行保留。

## 临界

临界计算回答「勇士某项属性提高到多少时，战斗结果会发生变化」。相关接口：

- `getCriticalLimit(handler, attribute)`：返回该属性的计算上界；
- `calculateViewCritical(enemy, attribute, precision?)` 与 `calculateEnemyCritical(...)`：伤害系统上的临界计算方法，返回 `IEnemyCritical` 的生成器；
- `CriticalableHeroStatus<THero>`：只允许数值类型的勇士属性，例如 `atk`、`def`、`hp`。

内置 `getCriticalLimit` 对 `atk` 的处理是：怪物有坚固时返回 `Infinity`，否则返回 `def + hp`；其他属性直接返回勇士当前最终值。

现有约定是**伤害值随属性提高单调递减**。临界值唯一依赖「最后的伤害值」，因此公式不单调也能运行，只是算出的临界点不准。写自定义公式时尽量保持单调，临界结果才有意义。
