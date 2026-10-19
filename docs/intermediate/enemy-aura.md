# 怪物光环

有些怪物并不直接改自己，而是影响周围的怪物：站在它旁边的怪物攻击更高、金币更少，或者被「传染」上另一层光环。这类特殊属性的执行方式就是光环（aura）。

光环的效果作用在范围内的其他怪物身上（也可以包括自己）。它要回答两个问题：先算谁、后算谁？改基础属性还是改特殊属性？下面先从优先级讲起，再看内置光环、怎么改它们，最后才是自己写类。基础概念见[战斗总览](./combat-overview.md)。

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

因此，**每一条特殊属性都可以对应不同的转换器**，不必都挤进同一个里；反过来，只要 `shouldConvert` 认得出来，多个 code 也可以共用同一个转换器。内置的三条光环就各有各的转换器（`CommonAuraConverter` / `GuardAuraConverter` / `SpecialAuraConverter`），文末「自己写光环类」的两个示例也各自写了一个转换器。

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

## 改内置：调整内置光环的行为

内置三类光环都写在 `src/data/enemy/aura.ts`，而且已经在 `initializeEnemy` 里注册好了。所以**改内置就是在这些类的现有方法里加分支、改参数**：不用新建类，也不用再调用 `registerAuraConverter`。这是本篇的主线做法，绝大多数需求都能这样完成。

先按「想改什么」找到落点：

| 想改的东西        | 改哪个方法                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| 光环影响哪些属性  | `CommonAura.apply`（基础属性）、`SpecialAuraModifier.add/modify`（特殊属性） |
| 光环影响多大范围  | `CommonAura.createRange` 与 `getRangeParam`、`GuardAura.getRangeParam`       |
| 光环什么时候执行  | 视图里的 `readonly priority`                                                 |
| 光环认领哪个 code | 转换器里的 `shouldConvert`                                                   |

三组「转换器 + 视图」的对应关系是：普通光环 `CommonAuraConverter` → `CommonAura`；支援 `GuardAuraConverter` → `GuardAura`；特殊光环 `SpecialAuraConverter` → `SpecialAura`（特殊属性由 `SpecialAuraModifier` 改动）。日常调整效果不必动 `shouldConvert`，只有想让某个内置转换器改认另一个 code 时才需要改它。

### 示例：让普通光环同时影响金币与经验

**目标**：普通光环（code 23）除了现有的生命 / 攻击 / 防御百分比，还能按参数调整范围内怪物的金币与经验。

**改哪里**：`src/data/enemy/special.ts` 的 `ISpecial23Value` 与 code 23 的默认值；`src/data/enemy/aura.ts` 的 `CommonAura.apply`。两处都是内置文件，改完不需要注册。

**复制什么**：先给参数接口补两个字段——

```ts
/** 23 - 光环 */
export interface ISpecial23Value {
    // [模板] 原有字段保持不变
    range: number;
    square: boolean;
    hpBuff: number;
    atkBuff: number;
    defBuff: number;
    // [需改] 新增：金币 / 经验变化百分比，正数提升、负数下降
    moneyBuff: number;
    expBuff: number;
}
```

再把 code 23 的默认值补齐（不补的话，旧数据读到的这两个字段是 `undefined`）——

```ts
// 23 - 光环
map.set(
    23,
    defineCommonSerializableSpecial<ISpecial23Value>(
        23,
        {
            range: 0,
            square: false,
            hpBuff: 0,
            atkBuff: 0,
            defBuff: 0,
            moneyBuff: 0, // [需改] 新增字段的默认值
            expBuff: 0 // [需改] 新增字段的默认值
        }
        // ...省略：name / desc / color 原样保留
    )
);
```

最后在 `CommonAura.apply` 末尾追加两个分支——

```ts
apply(
    handler: IEnemyHandler<IEnemyAttr, any>,
    baseEnemy: IReadonlyEnemy<IEnemyAttr>
): void {
    const { enemy } = handler;
    const { hpBuff, atkBuff, defBuff, moneyBuff, expBuff } =
        this.special.value;

    // ...省略：原有的 hpBuff / atkBuff / defBuff 三段，保持不变...

    // [需改] 新增：同样用 baseEnemy 的原始值算百分比
    if (moneyBuff !== 0) {
        const money = (baseEnemy.getAttribute('money') * moneyBuff) / 100;
        enemy.addAttribute('money', Math.floor(money));
    }
    if (expBuff !== 0) {
        const exp = (baseEnemy.getAttribute('exp') * expBuff) / 100;
        enemy.addAttribute('exp', Math.floor(exp));
    }
}
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：新增字段的名字与含义、`apply` 里改的属性换成你自己的。如果只是想改现有数值的算法（例如把取整改成四舍五入），只改 `apply` 里对应那一段，不用动参数接口。

**怎么验证**：给一只怪物挂上带 `moneyBuff: -20` 的光环，让它旁边站另一只怪物，看后者显示的金币是否下降 20%。

**注意**：`apply` 里一律用 `baseEnemy`（未修改的原始怪物）算百分比，否则多个光环会把彼此的结果继续乘进去。改内置不需要再注册——`initializeEnemy` 已经注册过这些转换器。

### 改另外两类内置光环

- **支援（24）**：`GuardAura.apply` 把来源怪物登记进目标的 `guard` 属性，`GuardAura.getRangeParam` 固定返回周围 3×3。想让支援范围更大，或改成按某个参数决定，就改这两个方法。
- **特殊光环（26）**：`SpecialAuraModifier.add` 负责「目标没有的属性就补上」，`modify` 负责「已有的数值属性按 `mulAdd` 加算或乘算」。要支持新的叠加方式，改 `modify` 里的判断。
- **调整执行顺序**：直接改对应视图的 `readonly priority`。内置值是支援 5、普通光环 10、特殊光环 20，改大就会更早执行。

## 自己写光环类

只有在「内置三类光环表达不了、往内置方法体里也塞不进去」时才需要自己写类。典型情况是：一种全新的特殊属性要有自己的范围、优先级和影响方式，而它既不改基础属性、也不符合特殊光环那种「按 code 列表加属性」的形态。

自己写类要同时处理接口签名、`shouldConvert` 认领、注册时机与优先级，改动面比改内置方法体大得多。

**如果你不怎么懂代码，建议直接改内置光环类（`src/data/enemy/aura.ts` 的 `CommonAura` / `GuardAura` / `SpecialAura`），而不是自己写新的类。** 上面「改内置」一节已经覆盖了绝大多数需求：调数值、调范围、调优先级、给目标加属性，都能在现有方法里完成。

自己写的做法是「转换器 + 视图」两个类：转换器只有 `shouldConvert` 与 `convert` 两个方法，负责认领特殊属性并构造视图；视图负责范围、优先级与 `apply` / `applySpecial`。下面两个示例用 `[模板]` 标出可原样照抄的行（多为接口签名、`shouldConvert`、范围对象的构建），用 `[需改]` 标出必须按需求改写的行（code、范围、优先级，以及 `apply` / `applySpecial` 里做的事）。

两个示例都新建了自己的 code（30、31），不修改内置的 23 / 24 / 26。如果需求只是「让已有光环多做一点事」，用上一节的改内置写法更省事。

### 示例：基础光环（减少周围怪物的金币与经验）

先从一个只改基础属性的例子开始：让范围内的怪物金币与经验下降。它用 code 30（示例自选的未占用号）定义一条带参数的特殊属性，再配一个转换器与视图。

**目标**：站在带「削弱光环」怪物周围的怪物，金币与经验按参数下降。

**改哪里**：`src/data/enemy/special.ts` 登记属性；另建文件写转换器与视图；`src/data/enemy/initialize.ts` 注册（见文末「注册在哪里」）。

**复制什么**：先在 `special.ts` 登记属性——

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

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

再写转换器与视图——

```ts
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

最后把注册行加进 `initializeEnemy`（`src/data/enemy/initialize.ts`，见文末「注册在哪里」）：

```ts
state.enemyContext.registerAuraConverter(new WeakAuraConverter());
```

**改什么**：编号（`30`）、类名、`priority`、范围参数与 `apply` 里改的字段（本示例 `moneyBuff` / `expBuff`）换成你自己的。

**怎么验证**：把带该属性的怪物与另一只怪物放在范围内，看后者的金币 / 经验是否按参数下降。

**注意**：`apply` 里用 `baseEnemy` 的原始值做百分比，因此多个光环不会把彼此的结果继续乘进去。只改基础属性就实现 `apply`；要改目标的特殊属性才需要 `applySpecial`。

### 示例：特殊光环（给周围怪物上光环）

如果光环要给目标「加一条特殊属性」，而不是直接改基础属性，就把逻辑放进 `applySpecial`。下面的例子给范围内没有普通光环的怪物加上 code 23 的普通光环。

**目标**：站在带「传染光环」怪物附近的怪物，若自己没有普通光环，就获得一层 code 23 的普通光环。

**改哪里**：`src/data/enemy/special.ts` 登记属性；另建文件写转换器与视图；`src/data/enemy/initialize.ts` 注册（见文末「注册在哪里」）。

**复制什么**：先在 `special.ts` 登记属性——

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

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

再写转换器与视图——

```ts
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

**改什么**：编号（`31`）、类名、`priority`、范围与 `add` 里设置的参数（本示例的 `range` / `hpBuff` 等光环字段）换成你自己的。

**怎么验证**：把带该属性的怪物与一只没有普通光环的怪物放在范围内，看后者是否被加上了普通光环（属性提升）。

**注意**：`priority = 25` 高于内置特殊光环的 20，所以它在特殊光环之前执行；它新加上的普通光环（priority 10）会在之后的阶段生效。不要把 `couldApplySpecial` 设为 `false` 后又指望 `applySpecial` 被调用：上下文只会对 `couldApplySpecial === true` 的光环调用它。

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
