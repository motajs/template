# 怪物光环

光环（aura）是一类特殊属性的执行方式：带有光环的怪物不直接改自己，而是把效果施加到范围内的其他怪物（也可以包括自己）。本篇先讲优先级，再讲内置光环与自定义写法。基础概念见[战斗总览](./combat-overview.md)。

## 优先级

每个光环视图都有 `priority`，每个查询效果也有 `priority`，两者共用同一套优先级：

- 构建时从高优先级开始处理，再处理较低优先级；
- 高优先级产生的特殊属性变化，低优先级能看到；低优先级产生变化时，高优先级已经执行完，不能回头影响它；
- 由效果新增的光环只能影响之后的阶段。若新光环的优先级高于当前阶段，开发环境会告警并跳过它。

因此，想让一个光环「先于普通光环生效」，把它的 `priority` 设得更高即可。

## 内置光环

| 光环 | code | 视图类 | priority | 行为 |
|------|------|--------|----------|------|
| 普通光环 | 23 | `CommonAura` | 10 | 按范围给怪物加 `hp` / `atk` / `def` 百分比 |
| 支援 | 24 | `GuardAura` | 5 | 把范围内的怪物登记为支援者，战斗时一起结算 |
| 特殊光环 | 26 | `SpecialAura` | 20 | 通过 `SpecialAuraModifier` 给目标添加或修改特殊属性 |

这三类都在 `src/data/enemy/aura.ts` 中实现，并在 `initializeEnemy` 里通过 `ctx.registerAuraConverter(...)` 注册。

## 运作方式

一个光环由两部分组成：

- **转换器** `IAuraConverter`：`shouldConvert(special, handler)` 判断某个特殊属性是否归自己处理；`convert(special, handler, context)` 返回光环视图；
- **视图** `IEnemyAuraView`：描述优先级、范围、影响方式。

视图的核心成员：

- `priority`：优先级；
- `range`：影响范围对象；
- `couldApplyBase` / `couldApplySpecial`：描述此光环是否会修改基础属性 / 特殊属性；
- `getRangeParam()`：返回范围参数；
- `apply(handler, baseEnemy)`：修改目标怪物的基础属性；
- `applySpecial(handler, baseEnemy)`：返回 `IEnemySpecialModifier`，用于添加、删除或修改目标怪物的特殊属性。

`apply` 与 `applySpecial` 的差别：

- `apply` 在「普通光环」阶段执行，目标是基础属性（`hp`、`atk`、`def` 等），拿到的 `baseEnemy` 是未修改的原始怪物；
- `applySpecial` 在「光环与特殊查询」阶段执行，返回一个修饰器，由上下文按当前优先级应用到目标的特殊属性上。只有 `couldApplySpecial` 为 `true` 的光环才会被调用；
- 只改基础属性就实现 `apply`；要给目标「上光环」或增删特殊属性，才实现 `applySpecial`。

范围对象由 `@motajs/common` 提供，常用的有 `FullRange`（全场）、`RectRange`（矩形）、`ManhattanRange`（曼哈顿距离/菱形）与 `RayRange`（射线）。

## 示例：基础光环（减少周围怪物的金币与经验）

先定义一个带参数的特殊属性（code 取一个未占用的值，这里用 30）：

```ts
/** 30 - 削弱光环 */
export interface ISpecial30Value {
    range: number;
    square: boolean;
    moneyBuff: number;
    expBuff: number;
}

// 30 - 削弱光环
map.set(
    30,
    defineCommonSerializableSpecial<ISpecial30Value>(
        30,
        { range: 1, square: false, moneyBuff: -20, expBuff: -20 },
        {
            name: '削弱光环',
            desc: special =>
                `周围怪物金币与经验下降${Math.abs(special.value.moneyBuff)}%。`,
            color: '#9AC'
        }
    )
);
```

然后写转换器与视图：

```ts
import {
    IManhattanRangeParam,
    IRange,
    IRectRangeParam,
    ITileLocator,
    ManhattanRange,
    RectRange
} from '@motajs/common';
import {
    IAuraConverter,
    IEnemyAuraView,
    IEnemyHandler,
    IEnemySpecialModifier,
    IReadonlyEnemyHandler
} from '@user/data-system';
import { IReadonlyEnemy, ISpecial } from '@user/data-base';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { ISpecial30Value } from './special';

const MANHATTAN_RANGE = new ManhattanRange();
const RECT_RANGE = new RectRange();

export class WeakAuraConverter implements IAuraConverter<IEnemyAttr, IHeroAttr> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 30;
    }

    convert(
        special: ISpecial<ISpecial30Value>,
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): WeakAura {
        return new WeakAura(handler.enemy, special, handler.locator);
    }
}

export class WeakAura implements IEnemyAuraView<
    IEnemyAttr,
    IRectRangeParam | IManhattanRangeParam,
    ISpecial30Value
> {
    readonly priority = 8;
    readonly couldApplyBase = true;
    readonly couldApplySpecial = false;
    readonly range: IRange<IRectRangeParam | IManhattanRangeParam>;

    constructor(
        readonly enemy: IReadonlyEnemy<IEnemyAttr>,
        readonly special: ISpecial<ISpecial30Value>,
        readonly locator: ITileLocator
    ) {
        this.range = special.value.square ? RECT_RANGE : MANHATTAN_RANGE;
    }

    getRangeParam(): IRectRangeParam | IManhattanRangeParam {
        const { range, square } = this.special.value;
        if (square) {
            return {
                x: this.locator.x - range,
                y: this.locator.y - range,
                w: range * 2 + 1,
                h: range * 2 + 1
            };
        }
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            radius: range
        };
    }

    apply(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        baseEnemy: IReadonlyEnemy<IEnemyAttr>
    ): void {
        const { moneyBuff, expBuff } = this.special.value;
        const enemy = handler.enemy;
        if (moneyBuff !== 0) {
            const money = (baseEnemy.getAttribute('money') * moneyBuff) / 100;
            enemy.addAttribute('money', Math.floor(money));
        }
        if (expBuff !== 0) {
            const exp = (baseEnemy.getAttribute('exp') * expBuff) / 100;
            enemy.addAttribute('exp', Math.floor(exp));
        }
    }

    applySpecial(): IEnemySpecialModifier<IEnemyAttr> | null {
        return null;
    }
}
```

注册：

```ts
state.enemyContext.registerAuraConverter(new WeakAuraConverter());
```

`apply` 里用 `baseEnemy` 的原始值做百分比，因此多个光环不会把彼此的结果继续乘进去。

## 示例：特殊光环（给周围怪物上光环）

如果要给周围怪物「上」一个特殊属性，而不是直接改基础属性，就在 `applySpecial` 中返回一个 `IEnemySpecialModifier`。下面的例子给范围内没有普通光环的怪物加上 code 23 的普通光环：

```ts
// special.ts：31 - 传染光环
map.set(
    31,
    defineNonePropertySpecial(31, {
        name: '传染光环',
        desc: '同楼层没有光环的怪物获得普通光环。',
        color: '#9F9'
    })
);
```

```ts
import { FullRange, ITileLocator } from '@motajs/common';
import {
    IAuraConverter,
    IEnemyAuraView,
    IEnemySpecialModifier,
    IReadonlyEnemyHandler
} from '@user/data-system';
import { IReadonlyEnemy, ISpecial } from '@user/data-base';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';

export class ChainAuraModifier implements IEnemySpecialModifier<IEnemyAttr> {
    constructor(readonly special: ISpecial<void>) {}

    add(handler: IReadonlyEnemyHandler<IEnemyAttr, any>): ISpecial<any>[] {
        if (handler.enemy.hasSpecial(23)) return [];
        const sp = handler.state.enemyManager.getSpecial(23)?.();
        if (!sp) return [];
        sp.setValue({
            range: 1,
            square: false,
            hpBuff: 20,
            atkBuff: 0,
            defBuff: 0
        });
        return [sp];
    }

    delete(): ISpecial<any>[] {
        return [];
    }

    modify(): boolean {
        return false;
    }
}

export class ChainAuraConverter implements IAuraConverter<IEnemyAttr, IHeroAttr> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 31;
    }

    convert(
        special: ISpecial<void>,
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): ChainAura {
        return new ChainAura(handler.enemy, special, handler.locator);
    }
}

export class ChainAura implements IEnemyAuraView<IEnemyAttr, void, void> {
    readonly priority = 25;
    readonly couldApplyBase = false;
    readonly couldApplySpecial = true;
    readonly range = new FullRange();

    constructor(
        readonly enemy: IReadonlyEnemy<IEnemyAttr>,
        readonly special: ISpecial<void>,
        readonly locator: ITileLocator
    ) {}

    getRangeParam(): void {
        return undefined;
    }

    apply(): void {}

    applySpecial(): IEnemySpecialModifier<IEnemyAttr> | null {
        return new ChainAuraModifier(this.special);
    }
}
```

这里 `priority = 25` 高于内置特殊光环的 20，所以它在特殊光环之前执行；它新加上的普通光环（priority 10）会在之后的阶段生效。

不要把 `couldApplySpecial` 设为 `false` 后又指望 `applySpecial` 被调用：上下文只会对 `couldApplySpecial === true` 的光环调用它。

## 注册与全局光环

- 由特殊属性产生的光环：实现 `IAuraConverter` 并 `state.enemyContext.registerAuraConverter(...)`；
- 没有来源怪物、始终生效的光环：实现 `IAuraView` 并 `state.enemyContext.addAura(view)`。

`initializeEnemy` 已经注册了 `CommonAuraConverter`、`GuardAuraConverter` 与 `SpecialAuraConverter`。新增转换器时照同样方式追加即可。
