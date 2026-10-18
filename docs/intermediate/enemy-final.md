# 最终属性效果

光环影响别人，查询读取外部再改自己。等这些外部影响都算完，有时还需要对怪物自己做一次最后的收尾：既不依赖周围环境，也不影响其他怪物。这类收尾调整就是最终效果（final effect）。

它适合实现「只看自己（和勇士）就能决定」的转换，例如坚固、模仿。整体流程见[战斗总览](./combat-overview.md)。

## 接口

`IEnemyFinalEffect` 只有两个成员：

- `priority`：优先级，越高越先执行；
- `apply(handler)`：读取 `handler.enemy` 与 `handler.hero`，修改 `handler.enemy` 的基础属性。

注册方式：

```ts
state.enemyContext.registerFinalEffect(effect);
```

`initializeEnemy` 已经注册了内置的 `MainEnemyFinalEffect`（`src/data/enemy/final.ts`）。它处理两个属性：

- **坚固（code 3）**：把怪物防御提升到不低于「勇士攻击 - 1」；
- **模仿（code 8）**：把怪物攻击与防御设置为勇士的最终攻击与最终防御。

## 三方对比

光环、查询、最终效果都在构建计算后怪物时执行，但读取与影响的范围不同。把三者放在一起看，分工就清楚了：

| 效果 | 读取其他怪物/上下文 | 影响其他怪物   | 典型用途                   |
| ---- | ------------------- | -------------- | -------------------------- |
| 光环 | 否（只按范围命中）  | 是             | 给周围怪物加属性或特殊属性 |
| 查询 | 是                  | 否（只改自身） | 抱团、同化、号角           |
| 最终 | 否                  | 否             | 坚固、模仿、仿攻           |

最终效果可以读取勇士属性（模仿与仿攻都需要），但不会扫描周围怪物，也不会改变其他怪物。

### 为什么没有「既依赖外部、又修改外部」的能力

看到这里可能会问：为什么没有一种效果，既能像查询那样读取周围环境，又能像光环那样修改其他怪物？

因为那会引入**循环依赖**。如果一个效果既读取外部、又改动外部，就再也说不清一只怪物最终的结果是根据**改动前**的环境、还是**改动后**的环境算出来的——而环境本身又被这次效果改掉了，前后互相牵扯，结果无法稳定确定。

所以上表里「读取外部」与「影响外部」同时为「是」的那一格被刻意留空：需要「读外部之后改变自己的结果」，就用查询；需要「影响其他怪物」，就用光环。两者分开、按固定阶段执行，循环依赖就不会出现。

## 示例：仿攻

「仿攻」让怪物的攻击力等于勇士的最终攻击力。仿攻与内置的模仿类似，区别是只改攻击、不改防御（这里的 code 32 是示例自选的未占用编号；内置的最终效果是坚固 code 3、模仿 code 8，内置编号见[特殊属性](./enemy-specials.md)）：

示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」。

```ts
// special.ts：32 - 仿攻
map.set(
    32,
    defineNonePropertySpecial(32, {
        name: '仿攻',
        desc: '怪物攻击等于勇士攻击。',
        color: '#B0C0DD'
    })
);
```

```ts
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { IEnemyFinalEffect, IEnemyHandler } from '@user/data-system';

export class AttackCopyFinal implements IEnemyFinalEffect<
    IEnemyAttr,
    IHeroAttr
> {
    readonly priority = 0;

    apply(handler: IEnemyHandler<IEnemyAttr, IHeroAttr>): void {
        if (!handler.enemy.hasSpecial(32)) return;
        handler.enemy.setAttribute(
            'atk',
            handler.hero.getFinalAttribute('atk')
        );
    }
}

state.enemyContext.registerFinalEffect(new AttackCopyFinal());
```

`apply` 里直接 `setAttribute`，因为最终阶段拿到的 `handler.enemy` 就是可修改的怪物对象。最终阶段之后不再有别的属性修正，所以这里写进去的值会直接进入伤害计算。

`priority` 只需要记住一句：数值越大越先执行；内置最终效果的 `priority` 是 `0`。

## 与伤害计算的分工

最终效果改的是怪物的基础属性，伤害计算器负责决定「这些属性如何变成伤害与回合数」。如果某个效果只是让怪物攻击更高，优先考虑写成光环、查询或最终效果；只有需要改变公式本身时，才去改[伤害计算](./enemy-calculator.md)。
