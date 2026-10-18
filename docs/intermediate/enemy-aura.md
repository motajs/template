# 怪物光环

有些怪物并不直接改自己，而是影响周围的怪物：站在它旁边的怪物攻击更高、金币更少，或者被「传染」上另一层光环。这类特殊属性的执行方式就是光环（aura）。

光环的效果作用在范围内的其他怪物身上（也可以包括自己）。它要回答两个问题：先算谁、后算谁？改基础属性还是改特殊属性？下面先从优先级讲起，再看内置光环与自定义写法。基础概念见[战斗总览](./combat-overview.md)。

光环属于「不读取外部环境、但会修改外部」的那一类：它只按范围命中目标，不会先观察环境再决定自己。（为什么没有「既读取外部、又修改外部」的能力，见[最终属性效果](./enemy-final.md)。）

## 优先级

每只怪物可能同时受到多个光环影响。谁先算、谁后算，会直接改变结果，所以光环用 `priority` 排队。

每个光环视图都有 `priority`，每个查询效果也有 `priority`，两者共用同一套优先级：

- 构建时从高优先级开始处理，再处理较低优先级；
- 高优先级产生的特殊属性变化，低优先级能看到；低优先级产生变化时，高优先级已经执行完，不能回头影响它；
- 由效果新增的光环只能影响之后的阶段。若新光环的优先级高于当前阶段，开发环境会告警并跳过它。

可以把它想成排队办事：号码靠前的人先办，办完的结果留在桌上，后面的人可以接着用；但后面的人办完事，前面的人已经离开，不能再回来改。

因此，想让一个光环「先于普通光环生效」，把它的 `priority` 设得更高即可。

## 内置光环

引擎内置了三类光环，分别处理不同的需求：

| 光环     | code | 视图类        | priority | 行为                                                |
| -------- | ---- | ------------- | -------- | --------------------------------------------------- |
| 普通光环 | 23   | `CommonAura`  | 10       | 按范围给怪物加 `hp` / `atk` / `def` 百分比          |
| 支援     | 24   | `GuardAura`   | 5        | 把范围内的怪物登记为支援者，战斗时一起结算          |
| 特殊光环 | 26   | `SpecialAura` | 20       | 通过 `SpecialAuraModifier` 给目标添加或修改特殊属性 |

这三类都在 `src/data/enemy/aura.ts` 中实现，并在 `initializeEnemy` 里通过 `ctx.registerAuraConverter(...)` 注册（`initializeEnemy` 是 `src/data/enemy/initialize.ts` 中集中注册内置怪物功能的入口函数；内置的光环转换器与你自己新增的转换器都从这里注册）。

普通光环（code 23）的参数接口是 `ISpecial23Value`，下文示例里 `setValue({...})` 传入的就是这几个字段：

| 字段      | 含义                                                                   |
| --------- | ---------------------------------------------------------------------- |
| `range`   | 光环范围值；为 0 时作用于同楼层所有怪物                                |
| `square`  | `true` 为矩形范围，`false` 为十字范围（范围大于 1 时按曼哈顿距离计算） |
| `hpBuff`  | 目标生命值提升百分比                                                   |
| `atkBuff` | 目标攻击力提升百分比                                                   |
| `defBuff` | 目标防御力提升百分比                                                   |

## 运作方式

一条光环要经过两步才会生效：先认出「这个特殊属性是一条光环」，再决定「这条光环怎么影响目标」。对应到代码里，就是转换器与视图两部分：

- **转换器** `IAuraConverter`：`shouldConvert(special, handler)` 判断某个特殊属性是否归自己处理；`convert(special, handler, context)` 返回光环视图；
- **视图** `IEnemyAuraView`：描述优先级、范围、影响方式。

用大白话说：**转换器**像一个「分诊台」——引擎拿到一条特殊属性后，会挨个问每个已注册的转换器「这条你管吗？」（`shouldConvert`），哪个回答「管」，就由它把这条属性翻译成一份**视图**；**视图**则是一张「操作说明」，写清这条光环的范围多大、优先级多少、具体要改目标的哪些属性（`apply` / `applySpecial`）。

因此，**每一条特殊属性都可以对应不同的转换器**，不必都挤进同一个里；反过来，只要 `shouldConvert` 认得出来，多个 code 也可以共用同一个转换器。内置的三条光环就各有各的转换器（`CommonAuraConverter` / `GuardAuraConverter` / `SpecialAuraConverter`），下面两个自定义示例也各自写了一个转换器。

视图的核心成员：

- `priority`：优先级；
- `range`：影响范围对象；
- `couldApplyBase` / `couldApplySpecial`：描述此光环是否会修改基础属性 / 特殊属性；
- `getRangeParam()`：返回范围参数；
- `apply(handler, baseEnemy)`：修改目标怪物的基础属性；
- `applySpecial(handler, baseEnemy)`：返回 `IEnemySpecialModifier`，用于添加、删除或修改目标怪物的特殊属性。

`apply` 与 `applySpecial` 的差别，可以按「改什么」来记：

- `apply` 在「普通光环」阶段执行，目标是基础属性（`hp`、`atk`、`def` 等），拿到的 `baseEnemy` 是未修改的原始怪物；
- `applySpecial` 在「光环与特殊查询」阶段执行，返回一个修饰器，由上下文按当前优先级应用到目标的特殊属性上。只有 `couldApplySpecial` 为 `true` 的光环才会被调用；
- 只改基础属性就实现 `apply`；要给目标「上光环」或增删特殊属性，才实现 `applySpecial`。

范围对象由 `@motajs/common` 提供，常用的有 `FullRange`（全场）、`RectRange`（矩形）、`ManhattanRange`（曼哈顿距离/菱形）与 `RayRange`（射线）。

下方示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」。

### 改内置，还是自己写

光环与前面几篇不同：**它必须写一个「转换器 + 视图」的类**，没有「只改内置一处」的省事办法。原因是「怎么认出这条光环、怎么影响目标」在光环里是拆成两个对象表达的，引擎没有提供更简单的注册入口。（若你的需求恰好与内置三条光环同构，也可以直接改 `src/data/enemy/aura.ts` 里的内置实现。）

- **转换器**：只有 `shouldConvert` 与 `convert` 两个方法，负责「认领」特殊属性并构造视图。`shouldConvert` 通常照抄、只换一个 code；`convert` 里构造视图那一行要按你的视图构造函数改。
- **视图**：真正描述效果的地方（范围、优先级、`apply` / `applySpecial`），这部分必须按你的需求写。

下面两个示例用 `[模板]` 标出可原样照抄的行（多为依赖导入、接口签名、`shouldConvert`），用 `[需改]` 标出必须按需求改写的行（code、范围、优先级，以及 `apply` / `applySpecial` 里做的事）。

## 示例：基础光环（减少周围怪物的金币与经验）

先从一个只改基础属性的例子开始：让范围内的怪物金币与经验下降。第一步是定义一条带参数的特殊属性（code 取一个未占用的值，这里用 30）：

```ts
// [需改] 在 src/data/enemy/special.ts 里新增这条属性定义（编号换成你没用过的）
/** 30 - 削弱光环 */
export interface ISpecial30Value {
    range: number; // [需改] 光环范围值
    square: boolean; // [需改] true 矩形 / false 十字
    moneyBuff: number; // [需改] 金币变化百分比（负数表示下降）
    expBuff: number; // [需改] 经验变化百分比
}

// 30 - 削弱光环
map.set(
    30, // [需改] 编号：示例自选的未占用号
    defineCommonSerializableSpecial<ISpecial30Value>(
        30,
        { range: 1, square: false, moneyBuff: -20, expBuff: -20 }, // [需改] 默认参数
        {
            name: '削弱光环', // [需改] 显示名称
            desc: special =>
                `周围怪物金币与经验下降${Math.abs(special.value.moneyBuff)}%。`, // [需改] 悬停说明
            color: '#9AC' // [需改] 名称颜色
        }
    )
);
```

然后写转换器与视图：

```ts
// [模板] 依赖导入：@motajs/common 提供范围对象，其余来自用户包
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

// [模板] 两个范围对象各建一次复用
const MANHATTAN_RANGE = new ManhattanRange();
const RECT_RANGE = new RectRange();

// [需改] 类名：换成你的转换器名
export class WeakAuraConverter implements IAuraConverter<
    IEnemyAttr,
    IHeroAttr
> {
    // [模板] shouldConvert：认领本转换器负责的 code，通常只需换掉这个判断
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 30; // [需改] code
    }

    // [模板] convert 签名固定：把认领到的特殊属性翻译成视图
    convert(
        special: ISpecial<ISpecial30Value>,
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): WeakAura {
        // [需改] 构造视图，并决定把哪些信息传给它（这里传了来源怪物、属性、位置）
        return new WeakAura(handler.enemy, special, handler.locator);
    }
}

// [需改] 类名：换成你的视图名
export class WeakAura implements IEnemyAuraView<
    IEnemyAttr,
    IRectRangeParam | IManhattanRangeParam,
    ISpecial30Value
> {
    // [需改] priority：越大越先执行；高优先级的结果能被低优先级看到
    readonly priority = 8;
    // [需改] 本光环改基础属性（走 apply）还是改特殊属性（走 applySpecial）
    readonly couldApplyBase = true;
    readonly couldApplySpecial = false;
    // [模板] 范围对象在构造函数里挑选，getRangeParam 负责给参数
    readonly range: IRange<IRectRangeParam | IManhattanRangeParam>;

    // [模板] 构造函数把来源怪物、特殊属性、位置存下来
    constructor(
        readonly enemy: IReadonlyEnemy<IEnemyAttr>,
        readonly special: ISpecial<ISpecial30Value>,
        readonly locator: ITileLocator
    ) {
        // [模板] 按参数里的 square 选矩形或曼哈顿范围
        this.range = special.value.square ? RECT_RANGE : MANHATTAN_RANGE;
    }

    // [模板] 生成范围参数：矩形用左上角与宽高，曼哈顿用中心点与半径
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

    // [需改] apply：真正修改目标基础属性；baseEnemy 是未修改的原始怪物
    apply(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        baseEnemy: IReadonlyEnemy<IEnemyAttr>
    ): void {
        // [需改] 从参数里取出要用的字段
        const { moneyBuff, expBuff } = this.special.value;
        // [模板] handler.enemy 是被光环命中的目标怪物
        const enemy = handler.enemy;
        if (moneyBuff !== 0) {
            // [需改] 以 baseEnemy 的原始值算百分比，避免多个光环互相叠乘
            const money = (baseEnemy.getAttribute('money') * moneyBuff) / 100;
            enemy.addAttribute('money', Math.floor(money));
        }
        if (expBuff !== 0) {
            const exp = (baseEnemy.getAttribute('exp') * expBuff) / 100;
            enemy.addAttribute('exp', Math.floor(exp));
        }
    }

    // [模板] 本光环不改特殊属性，返回 null
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

如果光环要给目标「加一条特殊属性」，而不是直接改基础属性，就把逻辑放进 `applySpecial`。下面的例子给范围内没有普通光环的怪物加上 code 23 的普通光环：

```ts
// [需改] 这条无参属性定义同样加进 src/data/enemy/special.ts
// special.ts：31 - 传染光环
map.set(
    31, // [需改] 编号
    defineNonePropertySpecial(31, {
        name: '传染光环', // [需改] 显示名称
        desc: '同楼层没有光环的怪物获得普通光环。', // [需改] 悬停说明
        color: '#9F9' // [需改] 名称颜色
    })
);
```

```ts
// [模板] 依赖导入
import { FullRange, ITileLocator } from '@motajs/common';
import {
    IAuraConverter,
    IEnemyAuraView,
    IEnemySpecialModifier,
    IReadonlyEnemyHandler
} from '@user/data-system';
import { IReadonlyEnemy, ISpecial } from '@user/data-base';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';

// [需改] 类名：换成你的修饰器名；它负责「给目标增删改特殊属性」
export class ChainAuraModifier implements IEnemySpecialModifier<IEnemyAttr> {
    // [模板] 构造函数存下来源属性
    constructor(readonly special: ISpecial<void>) {}

    // [需改] add：返回要添加给目标的特殊属性数组
    add(handler: IReadonlyEnemyHandler<IEnemyAttr, any>): ISpecial<any>[] {
        // [需改] 已经有普通光环（code 23）就不再添加
        if (handler.enemy.hasSpecial(23)) return [];
        // [模板] 从怪物管理器取一条新的属性实例
        const sp = handler.state.enemyManager.getSpecial(23)?.();
        if (!sp) return [];
        // [需改] 设置这条属性的参数（这里是普通光环的字段）
        sp.setValue({
            range: 1,
            square: false,
            hpBuff: 20,
            atkBuff: 0,
            defBuff: 0
        });
        // [模板] 返回要添加的属性
        return [sp];
    }

    // [模板] 本修饰器不删除属性，返回空数组
    delete(): ISpecial<any>[] {
        return [];
    }

    // [模板] 本修饰器不修改已有属性，返回 false
    modify(): boolean {
        return false;
    }
}

// [需改] 类名：换成你的转换器名
export class ChainAuraConverter implements IAuraConverter<
    IEnemyAttr,
    IHeroAttr
> {
    // [模板] shouldConvert：认领 code，通常只换这个判断
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 31; // [需改] code
    }

    // [模板] convert 签名固定
    convert(
        special: ISpecial<void>,
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): ChainAura {
        // [需改] 构造视图
        return new ChainAura(handler.enemy, special, handler.locator);
    }
}

// [需改] 类名：换成你的视图名
export class ChainAura implements IEnemyAuraView<IEnemyAttr, void, void> {
    // [需改] priority = 25 高于内置特殊光环的 20，故先执行
    readonly priority = 25;
    // [需改] 本光环只改特殊属性：couldApplyBase 为 false，couldApplySpecial 为 true
    readonly couldApplyBase = false;
    readonly couldApplySpecial = true;
    // [需改] 范围：这里用 FullRange 作用于全场
    readonly range = new FullRange();

    // [模板] 构造函数保存来源信息
    constructor(
        readonly enemy: IReadonlyEnemy<IEnemyAttr>,
        readonly special: ISpecial<void>,
        readonly locator: ITileLocator
    ) {}

    // [模板] 范围参数：FullRange 不需要参数
    getRangeParam(): void {
        return undefined;
    }

    // [模板] 本光环不改基础属性，apply 留空
    apply(): void {}

    // [需改] applySpecial：返回修饰器，由上下文按优先级应用到目标
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

### 注册在哪里

`registerAuraConverter` 要写进 `initializeEnemy`。下面是 `src/data/enemy/initialize.ts` 中该函数的样子（省略了无关的行）：

```ts
export function initializeEnemy(
    state: ICoreState
): IEnemyInitializationReturns {
    // ...省略：怪物管理器、特殊属性、上下文、伤害系统、地图伤害的初始化...

    const ctx = state.enemyContext;

    // 注册光环转换器 —— 内置光环转换器在这里注册
    ctx.registerAuraConverter(new CommonAuraConverter());
    ctx.registerAuraConverter(new GuardAuraConverter());
    ctx.registerAuraConverter(new SpecialAuraConverter());
    // [需改] 你自己的光环转换器紧接着追加即可：
    // ctx.registerAuraConverter(new WeakAuraConverter());

    // ...省略：最终效果、脚本与钩子的注册...
}
```

把 `registerAuraConverter(new WeakAuraConverter())` 放在这几行之后，你的光环就会随 `initializeEnemy` 一起生效。

> 光环机制的设计原理（优先级为何这样设计、转换器与视图为何要分开、范围是如何定义的）会在**高级教程**中讲解（预留标记：`高级教程 · 光环设计原理`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 光环设计原理 -->
