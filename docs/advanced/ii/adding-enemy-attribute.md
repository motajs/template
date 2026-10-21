# 新增怪物属性

怪物属性和勇士属性一样，不只是数据表里多一列。属性对象要在接口、默认模板、内容数据与伤害计算之间保持一致；只在接口里加字段，读取处会拿到 `undefined`，参与运算后变成 `NaN`。新增属性真正要补的，是这条链路上的每一处。

本篇以攻速（`atkSpeed`，怪物每回合的伤害按百分比缩放）与护甲（`armor`，怪物受到的伤害按百分比减免）为例，走完「改接口 → 补数据 → 读取与修改 → 接入伤害、光环、查询与最终效果」的数据端流程。它与[新增勇士属性](./adding-hero-attribute.md)构成对照：勇士属性偏重修饰器与装备，怪物属性偏重上下文构建时的计算顺序。编辑器新增属性项与怪物图鉴属于对应端的实现，本篇只留占位。

## 怪物属性在哪里

`IEnemyAttr` 是所有怪物共享的属性形状，位于 `packages-user/data-common/src/types.ts`。它当前包含名称、生命、攻防、金币、经验、点数与支援来源：

```ts
export interface IEnemyAttr {
    /** 怪物名称 */
    name: string;
    /** 怪物生命值 */
    hp: number;
    /** 怪物攻击力 */
    atk: number;
    /** 怪物防御力 */
    def: number;
    /** 怪物金币 */
    money: number;
    /** 怪物经验值 */
    exp: number;
    /** 怪物拥有的点数 */
    point: number;
    /** 支援来源，即周围的支援怪物列表 */
    guard: Set<IEnemyView<IEnemyAttr>>;
}
```

具体数值来自 `IEnemyRawData.attribute`：怪物模板由 `num`（图块数字）、`attribute`（属性对象）与 `special`（特殊属性）组成。默认模板写在 `src/content/defaults/enemy.jsonc`，实际内容写在 `src/content/enemy.jsonc`。内容文件里每个怪物条目都有一份自己的 `attribute`，不会与默认模板合并。

`guard` 与其他字段不同：它是运行时由支援光环写入的集合（`GuardAura.apply` 会把来源怪物视图 `add` 进去），不是内容文件里手填的普通数值。改接口时不要把它当成内容字段，也不要在 `enemy.jsonc` 里补它。

## 改接口

要给攻速与护甲留位置，就在 `IEnemyAttr` 中增加两个数值字段：

```ts
export interface IEnemyAttr {
    // ...省略：name / hp / atk / def / money / exp / point / guard 原样保留

    /** 怪物攻速，百分比。100 表示正常速度，120 表示每回合伤害提高 20% */
    atkSpeed: number;
    /** 怪物护甲，百分比减伤。20 表示怪物受到的伤害降低 20% */
    armor: number;
}
```

字段名会被存档、内容数据、光环与查询引用，旧存档里也会以这个键保存数值。按项目的命名约定，新增公共字段要先确认名字再落笔；改名相当于改存档格式。

两个字段都参与伤害计算，因此都是 `number`。如果某个属性只用于展示、不参与数值运算，建议不要放进 `IEnemyAttr`，避免被存档与光环系统当成可计算属性。

## 补数据

接口增加字段后，默认模板与每一条怪物内容都要补齐。默认模板 `src/content/defaults/enemy.jsonc` 的 `attribute` 是单个对象：

```jsonc
{
    "num": "@required",
    "attribute": {
        "name": "新怪物",
        "hp": 0,
        "atk": 0,
        "def": 0,
        "money": 0,
        "exp": 0,
        "point": 0,
        // 攻速以百分数存储：100 是正常速度
        "atkSpeed": 100,
        // 护甲同样以百分数存储：0 是不减伤
        "armor": 0
    },
    "special": {}
}
```

`src/content/enemy.jsonc` 是一个数组，每个怪物条目也要补同样的两个键：

```jsonc
[
    {
        "num": 130,
        "attribute": {
            "name": "怪王",
            "hp": 100,
            "atk": 120,
            "def": 0,
            "money": 10,
            "exp": 0,
            "point": 0,
            "atkSpeed": 100,
            "armor": 0
        },
        "special": {}
    }
]
```

内容对象不会与默认模板合并，缺键就是缺键。读取到 `undefined` 后，`armor / 100` 与 `atkSpeed / 100` 都会变成 `NaN`，伤害与回合数随之失真。新增属性后，最好全局搜索一遍 `"attribute"`，确认每个模板入口都补齐。

### 旧存档迁移

新游戏补 `enemy.jsonc` 与默认模板即可；旧存档不会自动补键。`state.loadState(save, compression)` 读取 `@system/enemy` 时，会把每个脏模板的 `attrs` 原样交给怪物模板，缺失的键不会从内容配置或默认模板回填。迁移点在调用 `loadState` 之前：

```ts
import { IEnemyAttr, SaveCompression } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 在 state.loadState 之前补齐旧档里怪物模板缺失的属性键。 */
function migrateEnemySave(save: Map<string, unknown>): void {
    const enemy = save.get('@system/enemy') as
        | { modified?: Map<number, { attrs?: Partial<IEnemyAttr> }> }
        | undefined;
    if (!enemy?.modified) return;

    // modified 的键是怪物 code，值是该模板的属性与特殊属性存档
    for (const enemyState of enemy.modified.values()) {
        enemyState.attrs ??= {};
        enemyState.attrs.atkSpeed ??= 100;
        enemyState.attrs.armor ??= 0;
    }
}

/** 读档入口：先迁移，再交给数据端统一读档。 */
function loadEnemySave(state: ICoreState, save: Map<string, unknown>): void {
    migrateEnemySave(save);
    state.loadState(save, SaveCompression.NoCompression);
}
```

只补 `@system/enemy` 还不够：勇士属性也可能从旧档读入，两个存档键都要按各自的新字段做一次迁移。勇士侧的写法见[新增勇士属性](./adding-hero-attribute.md)的「旧存档迁移」。

## 读取与修改

怪物对象有两套写入口，取决于你拿到的是可写对象还是视图：

- `Enemy.getAttribute(key)` 读取属性，`setAttribute(key, value)` 直接赋值，`addAttribute(key, delta)` 在现有数值上增减；
- `IReadonlyEnemy` 只暴露 `getAttribute` 与 `cloneAttributes`，用于只读场景；
- 从 `IEnemyView` 取可写对象要用 `getModifiableEnemy()`；它返回的是**原始怪物**，不是计算后怪物。

下面的例子把某只怪物的护甲设为 20，然后通知上下文重算：

```ts
import { IEnemyAttr } from '@user/data-common';
import { IEnemyView } from '@user/data-system';

/** 把指定怪物的护甲设为 20，并让上下文重新计算它。 */
function setArmor(view: IEnemyView<IEnemyAttr>): void {
    // getModifiableEnemy() 返回原始怪物；修改不会自动同步到计算后怪物
    const enemy = view.getModifiableEnemy();
    enemy.setAttribute('armor', 20);

    // 标记为脏，下次读取 getComputedEnemy() 时才会重算
    view.markDirty();
}
```

直接改原始怪物后必须 `markDirty()`。少了这一步，`getComputedEnemy()` 仍然返回旧结果，伤害也不会变。更完整的刷新时机见[怪物上下文与战斗深入](./enemy-context-and-combat.md)。

## 接入伤害计算

伤害计算器通过 `handler.enemy` 读取**计算后怪物**，因此光环、查询与最终效果写进去的属性都会在这里生效。攻速与护甲的接入点不同：

- **攻速影响怪物每回合伤害**：先算 `monAtk - def`，再乘 `atkSpeed / 100`。
- **护甲影响怪物受到的伤害**：先算勇士每回合伤害 `atk - monDef`，再乘 `1 - armor / 100`；护甲越高，回合数越多，总伤害随之上升。

顺序不能反：护甲要在算回合数之前生效，攻速要在累加总伤害之前生效。下面保留与这两处改动相关的分支，其余特殊属性逻辑按原版保留：

```ts
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import {
    CriticalableHeroStatus,
    IDamageCalculator,
    IEnemyDamageInfoBase,
    IReadonlyEnemyHandler
} from '@user/data-system';

/** 带攻速与护甲的怪物伤害计算器骨架。 */
export class EnemyAttributeCalculator implements IDamageCalculator<
    IEnemyAttr,
    IHeroAttr
> {
    calculate(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): IEnemyDamageInfoBase {
        const { enemy, hero } = handler;
        const atk = hero.getFinalAttribute('atk');
        const def = hero.getFinalAttribute('def');
        const monAtk = enemy.getAttribute('atk');
        const monDef = enemy.getAttribute('def');
        const monHp = enemy.getAttribute('hp');

        // [需改] 护甲是怪物受到的百分比减伤，先夹到 0 到 100
        // 夹紧可以避免负伤害，也避免超过 100 后变成「反向治疗」
        const armor = Math.min(Math.max(enemy.getAttribute('armor'), 0), 100);
        // 勇士每回合伤害：先减怪物防御，再乘护甲系数
        const heroPerDamage = (atk - monDef) * (1 - armor / 100);
        if (heroPerDamage <= 0) {
            // 打不动怪物，战斗无法结束
            return { damage: Infinity, turn: 0 };
        }

        // 回合数随每回合伤害同步变化：护甲越高，需要的回合越多
        const turn = Math.ceil(monHp / heroPerDamage);

        // [需改] 攻速缩放怪物每回合伤害；100 表示正常速度
        // 用 Math.max 防止负数攻速把伤害变成治疗
        const atkSpeed = Math.max(enemy.getAttribute('atkSpeed'), 0);
        let enemyPerDamage = Math.max(monAtk - def, 0) * (atkSpeed / 100);

        // ...此处按原版保留无敌、吸血、连击、支援、先攻、破甲、反击、净化等分支...

        // 总伤害：勇士先手，怪物实际出手 turn - 1 次
        let damage = (turn - 1) * enemyPerDamage;

        // ...此处按原版保留魔防、负伤归零、固伤、仇恨、自爆等分支...

        return { damage: Math.floor(damage), turn };
    }

    getCriticalLimit(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        attribute: CriticalableHeroStatus<IHeroAttr>
    ): number {
        // 临界计算的上界；自定义属性参与伤害时，读取方式要与 calculate 一致
        return handler.hero.getFinalAttribute(attribute);
    }
}
```

内置公式的全部段落见[伤害计算](../../intermediate/enemy-calculator.md)。这段骨架只保留攻速与护甲相关的分支；真正替换内置计算器时，无敌、吸血、支援、先攻、破甲、反击、净化、固伤、仇恨、自爆等分支都要按原顺序保留，否则这些机制会一起失效。

## 接入光环

光环的公共接口是 `IAuraView<TEnemy, TRange>`，它的 `apply(handler, baseEnemy)` 在基础属性阶段执行，适合给范围内的怪物加护甲或攻速。`handler.enemy` 是计算后怪物，`baseEnemy` 是未修改的原始怪物：读原始值用后者，写结果用前者。

`IEnemyAuraView` 是在 `IAuraView` 之上多出 `enemy` / `special` / `locator` 的派生接口，专门表示「由某只怪物的某个特殊属性转换出来的光环」。**无来源的全局光环不是 `IEnemyAuraView`**：它没有来源怪物，只实现 `IAuraView`，再用 `state.enemyContext.addAura(...)` 注册。转换器与特殊光环的完整写法见[怪物光环](../../intermediate/enemy-aura.md)，这里只保留无来源全局光环的视图本身：

```ts
import { FullRange, IRange } from '@motajs/common';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { IReadonlyEnemy } from '@user/data-base';
import {
    IAuraView,
    IEnemyHandler,
    IEnemySpecialModifier
} from '@user/data-system';

/** 给范围内所有怪物增加 10 点护甲的无来源全局光环。 */
export class ArmorAura implements IAuraView<IEnemyAttr, void> {
    readonly priority = 10;
    readonly couldApplyBase = true;
    readonly couldApplySpecial = false;
    readonly range: IRange<void> = new FullRange();

    getRangeParam(): void {
        return undefined;
    }

    apply(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        baseEnemy: IReadonlyEnemy<IEnemyAttr>
    ): void {
        // [需改] 修改的是计算后怪物；光环的加成会进入伤害计算
        handler.enemy.addAttribute('armor', 10);

        // 若光环要按目标原始值算百分比，应读取 baseEnemy，而不是 handler.enemy
        // 例如：baseEnemy.getAttribute('armor') * 0.1
    }

    applySpecial(): IEnemySpecialModifier<IEnemyAttr> | null {
        // 只改基础属性，不增删特殊属性
        return null;
    }
}

// 初始化阶段注册一次；同一个实例会一直留在 globalAuraList 里
state.enemyContext.addAura(new ArmorAura());
```

`addAura` 接受的就是 `IAuraView`。如果你写成 `implements IEnemyAuraView`，编译期会要求补 `enemy`、`special`、`locator` 三个字段，而无来源光环根本拿不出这些值。

光环修改的是计算后怪物，因此不需要你自己标脏：`buildup()` 结束时会统一清空伤害缓存；局部刷新也会在 `refreshEnemy` 末尾处理。**不要在光环里改 `baseEnemy`**，那会污染原始模板，并让后续重建从被改过的值出发。

## 接入查询

查询用于「读取外部状态，再改自己」。常规查询实现 `IEnemyCommonQueryEffect`，在 `apply(handler, special, query)` 里通过 `query()` 取得上下文，统计周围怪物后修改自身属性：

```ts
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { ISpecial } from '@user/data-base';
import {
    IEnemyCommonQueryEffect,
    IEnemyHandler,
    IReadonlyEnemyContext
} from '@user/data-system';

/** 周围每有一只同类，自身攻速 +5 的常规查询。 */
export class PackAtkSpeedQuery implements IEnemyCommonQueryEffect<
    IEnemyAttr,
    IHeroAttr
> {
    readonly priority = 10;

    apply(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        special: ISpecial<any>,
        query: () => IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>
    ): void {
        // [需改] 必须通过 query() 取上下文：
        // 它会把「这只怪物查询过外部状态」登记下来，局部刷新时才会重算它
        const ctx = query();
        let count = 0;

        for (const [locator, view] of ctx.iterateEnemy()) {
            // 跳过自己，只统计其他怪物
            if (
                locator.x === handler.locator.x &&
                locator.y === handler.locator.y
            ) {
                continue;
            }
            if (view.getComputedEnemy().hasSpecial(special.code)) {
                count++;
            }
        }

        // [需改] 每有一个同类，攻速提高 5
        handler.enemy.addAttribute('atkSpeed', count * 5);
    }
}
```

注册时把效果绑定到一个特殊属性 `code` 上：

```ts
// [需改] code 换成触发这条查询的特殊属性编号（示例自选 40）
state.enemyContext.registerCommonQueryEffect(40, new PackAtkSpeedQuery());
```

注册只决定「拥有 code 40 的怪物会执行哪条查询」，**不会让任何怪物自动拥有 40**。常规查询的执行条件是怪物身上有对应特殊属性：在 `src/content/enemy.jsonc` 的 `special` 里写 `"40": ...`，或在运行时用 `enemy.addSpecial(...)` 添加。只注册效果、不给怪物 code，查询一次也不会触发。

查询效果需要 `registerCommonQueryEffect` 注册；引擎的 `src/data/enemy/initialize.ts` **没有注册任何查询实现**，不注册就不会执行。如果要增删或改写目标拥有的特殊属性，应使用特殊查询 `IEnemySpecialQueryEffect`，写法见[怪物查询](../../intermediate/enemy-query.md)，本篇不重复。

## 接入最终效果

最终效果 `IEnemyFinalEffect.apply(handler)` 只影响自身，不读取外部上下文，适合做「最后再补一点护甲」这类收尾。`priority` 数值越大越先执行：

```ts
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { IEnemyFinalEffect, IEnemyHandler } from '@user/data-system';

/** 给自己补 5 点护甲的最终效果。 */
export class ArmorFinalEffect implements IEnemyFinalEffect<
    IEnemyAttr,
    IHeroAttr
> {
    readonly priority = 0;

    apply(handler: IEnemyHandler<IEnemyAttr, IHeroAttr>): void {
        // [需改] 最终阶段只改自身基础属性，不再查询上下文
        handler.enemy.addAttribute('armor', 5);
    }
}
```

注册方式：

```ts
state.enemyContext.registerFinalEffect(new ArmorFinalEffect());
```

内置的 `MainEnemyFinalEffect`（`src/data/enemy/final.ts`）已经在 `initializeEnemy` 里注册；自写效果是追加执行，不是替换。最终效果与光环、查询的时序关系见[怪物上下文与战斗深入](./enemy-context-and-combat.md)。

## 编辑器与图鉴

编辑器需要在怪物属性面板增加攻速与护甲两个输入项；怪物图鉴需要显示它们的当前值。两处都属于对应端的实现，不在本篇范围内：

- `编辑器 · 新增怪物属性项`
- `怪物图鉴`

<!-- TODO(advanced-II): 编辑器属性项与怪物图鉴 -->

数据端完成后，这两个入口只需要读取计算后怪物的 `atkSpeed` 与 `armor`。在它们实现之前，先用控制台或调试脚本确认数值正确。

## 怎么验证

固定一只怪物与勇士属性，避免光环、支援或随机因素干扰。模板护甲不能直接写在 `getComputedEnemy()` 上；要先改可修改怪物，再 `markDirty()` + `requestRefresh()`，最后重新取伤害：

```ts
import { IEnemyAttr } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { IEnemyView } from '@user/data-system';

/** 修改模板属性并立即刷新这只怪物。 */
function setEnemyAttribute(
    state: ICoreState,
    view: IEnemyView<IEnemyAttr>,
    name: 'armor' | 'atkSpeed',
    value: number
): void {
    // getModifiableEnemy() 返回模板；改完不会自动同步
    view.getModifiableEnemy().setAttribute(name, value);

    // 标脏后申请刷新，伤害缓存也会随之失效
    view.markDirty();
    state.enemyContext.requestRefresh(view);
}

/** 对比 50 护甲与 0 护甲下的伤害。 */
function verifyEnemyAttribute(
    state: ICoreState,
    view: IEnemyView<IEnemyAttr>
): void {
    const damageSystem = state.enemyContext.getDamageSystem();
    if (!damageSystem) return;

    setEnemyAttribute(state, view, 'armor', 50);
    const highArmor = view.getComputedEnemy();
    const high = damageSystem.getDamageInfo(view);
    console.log(
        '计算后护甲',
        highArmor.getAttribute('armor'),
        '伤害',
        high?.damage,
        '回合',
        high?.turn
    );

    setEnemyAttribute(state, view, 'armor', 0);
    const low = damageSystem.getDamageInfo(view);
    console.log('0 护甲伤害', low?.damage, '回合', low?.turn);

    setEnemyAttribute(state, view, 'atkSpeed', 120);
    const fast = damageSystem.getDamageInfo(view);
    console.log('120 攻速伤害', fast?.damage, '回合', fast?.turn);
}
```

预期现象：

- `armor` 从 `50` 改为 `0` 后，勇士每回合伤害恢复，回合数减半，总伤害大致翻倍；
- 计算后护甲可能高于模板值（光环或最终效果会继续叠加），所以打印的是 `getComputedEnemy()` 的结果；
- `atkSpeed` 从 `100` 提到 `120` 后，怪物每回合伤害提高 20%，总伤害随之上升。

如果第二次读取仍是旧伤害，检查是否漏了 `markDirty()` 或 `requestRefresh()`：只改模板不会让伤害缓存失效。

若最终值是 `NaN`，先检查接口、默认模板与内容条目是否都补了键；若光环加了护甲但伤害不变，确认 `buildup()` 是否已经执行，以及是否误改了原始怪物而没有标脏。

## 边界与注意

- **接口、默认模板、内容条目都要补键**：三处缺一不可。内容对象不会与默认模板合并，缺键就是 `undefined`。
- **`guard` 不要写进内容**：它是运行时由支援光环维护的集合，手填会与运行时行为冲突。
- **百分数统一用整数存储**：`20` 表示 20%，计算时再除以 `100`；不要一处存 `0.2`、另一处存 `20`。
- **新增字段会进入怪物存档**：读旧档时缺失的键不会自动补齐，需要按上文「旧存档迁移」在 `state.loadState` 之前给默认值。
- **光环、查询、最终效果改的都是计算后怪物**：刷新前不要把它当原始数据；也不要在这三个阶段改 `getBaseEnemy()`。
- **直接改原始怪物要标脏**：`getModifiableEnemy()` 的修改不会自动同步，必须 `markDirty()` 后调用 `state.enemyContext.requestRefresh(view)`，再重新读取计算后怪物与伤害。
- **护甲要夹在有效区间**：大于 `100` 会让怪物无法被击败，负数会放大伤害；在计算器入口统一夹一次。
- **攻速改动会影响回合数**：凡是依赖 `turn` 的逻辑（支援、先攻、状态持续时间）都要跟着复核，不能只改伤害数字。
- **编辑器与图鉴尚未接入**：在对应端实现之前，不要假设属性会自动出现在界面上。

返回[高级 II 导览](./index.md)。
