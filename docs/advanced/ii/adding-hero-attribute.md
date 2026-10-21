# 新增勇士属性

勇士属性不只是数据表里多一列。一个属性会同时被类型常量、内容配置、修饰器、伤害计算、装备与界面读取；只在接口里加字段，读取处会拿到 `undefined`，参与运算后变成 `NaN`。新增属性真正要补的，是这条链路上的每一处。

本篇以攻速（`atkSpeed`，每回合造成的伤害按百分比缩放）与护甲（`armor`，按百分比减免最终伤害）为例，走完「改接口 → 补默认值与初始值 → 读取与修饰 → 接入伤害计算」的数据端流程。编辑器新增属性项与状态栏显示属于对应端的实现，本篇只留占位。

## 新增属性要改哪五处

| 位置     | 文件                                     | 要做什么                               |
| -------- | ---------------------------------------- | -------------------------------------- |
| 类型     | `packages-user/data-common/src/types.ts` | 在 `IHeroAttr` 中增加字段              |
| 默认值   | `packages-user/data-state/src/shared.ts` | 补齐 `HERO_DEFAULT_ATTRIBUTE`          |
| 初始值   | `src/content/core.jsonc`                 | 补齐 `init.hero.attribute`             |
| 计算接入 | `src/data/enemy/calculator.ts` 等读取处  | 让属性真正影响伤害或其他运算           |
| 显示     | 编辑器与渲染端                           | 编辑器属性项、状态栏显示（本篇不实现） |

前四处缺一不可。接口决定编译期可见性，`core.jsonc` 决定运行期取值，计算接入决定属性是否真的起作用；`HERO_DEFAULT_ATTRIBUTE` 只保证类型形状完整，不是运行时兜底。显示可以后补，但数据端必须先跑通。

中级教程的[勇士属性](../../intermediate/hero-attribute.md)已经讲过基础属性、最终属性与修饰器的常用调用，这里补齐「新增一个属性」的完整改动面。

## 改接口

`IHeroAttr` 位于 `packages-user/data-common/src/types.ts`。要给攻速与护甲留位置，就在接口中增加两个数值字段：

```ts
export interface IHeroAttr {
    /** 勇士名称 */
    name: string;
    /** 勇士等级 */
    level: number;
    /** 勇士生命值 */
    hp: number;
    /** 勇士生命值上限 */
    hpmax: number;
    /** 勇士攻击力 */
    atk: number;
    /** 勇士防御力 */
    def: number;
    /** 勇士护盾 */
    mdef: number;
    /** 勇士魔法值 */
    mana: number;
    /** 勇士魔法上限 */
    manamax: number;
    /** 勇士拥有的金币 */
    money: number;
    /** 勇士拥有的经验 */
    exp: number;
    /** 勇士攻速，百分比。100 表示正常速度，115 表示每回合造成 115% 伤害 */
    atkSpeed: number;
    /** 勇士护甲，百分比减伤。15 表示受到的最终伤害降低 15% */
    armor: number;
}
```

字段名一旦定下，就会被存档、内容配置、装备与插件引用，旧存档里也会以这个键保存数值。按项目的命名约定，新增公共字段要先确认名字再落笔；改名相当于改存档格式。

两个字段都参与伤害计算，因此都是 `number`。如果某个属性只用于展示、不参与数值运算，也仍然建议放在 `IHeroAttr` 之外，避免被存档与装备系统当成可修饰属性。

## 补默认值与初始值

`HERO_DEFAULT_ATTRIBUTE` 是属性对象的完整形状，只用于类型完整与示例，不会进入运行时。接口增加字段后，这里必须同步补齐，否则 `IHeroAttr` 的类型检查会报缺键：

```ts
/**
 * 勇士属性的完整默认形状。
 * 注释里的「最终会从旧样板读取」是历史说法：当前运行时不会读取这个常量，
 * 它只用于保证接口字段在类型层面齐全；真正的新游戏初始值来自 core.jsonc。
 */
export const HERO_DEFAULT_ATTRIBUTE: IHeroAttr = {
    name: '',
    level: 0,
    hp: 1,
    hpmax: 0,
    atk: 0,
    def: 0,
    mdef: 0,
    mana: 0,
    manamax: 0,
    money: 0,
    exp: 0,
    // 100 表示正常攻速，低于 100 变慢，高于 100 变快
    atkSpeed: 100,
    // 0 表示没有减伤；15 表示减伤 15%
    armor: 0
};
```

实际进入游戏的初始值来自内容配置 `src/content/core.jsonc` 的 `init.hero.attribute`，由 `src/data/initialize.ts` 的 `afterLoad` 调用 `state.hero.createAttribute(coreConfig.init.hero.attribute)`，直接交给 `HeroAttribute` 构造。它不会与默认值合并，缺键就是缺键；`HERO_DEFAULT_ATTRIBUTE` 不会在运行时兜底：

```jsonc
"attribute": {
    "name": "勇士",
    "level": 0,
    "hp": 10000,
    "atk": 100,
    "def": 100,
    "mdef": 0,
    "mana": 0,
    "manamax": 0,
    "money": 0,
    "exp": 0,
    // 攻速以百分数存储：100 是正常速度
    "atkSpeed": 100,
    // 护甲同样以百分数存储：0 是不减伤
    "armor": 0
}
```

`core.jsonc` 允许注释，但这两项不是可选项。若只在接口与默认值里加、忘了内容配置，`getBaseAttribute('atkSpeed')` 会返回 `undefined`，`atkSpeed / 100` 随之变成 `NaN`，伤害与回合数都会失真。

### 旧存档迁移

新游戏只需要改 `core.jsonc`；旧存档不会和它合并。`state.loadState(save, compression)` 会把 `@system/hero` 里的 `attribute.values` 原样交给 `HeroAttribute.loadState`，缺的键不会被补。迁移点在调用 `loadState` 之前，直接改存档映射：

```ts
import { IHeroAttr, SaveCompression } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 在 state.loadState 之前补齐旧档缺失的勇士属性键。 */
function migrateHeroSave(save: Map<string, unknown>): void {
    const hero = save.get('@system/hero') as
        | { attribute?: { values?: Partial<IHeroAttr> } }
        | undefined;
    const values = hero?.attribute?.values;
    if (!values) return;

    // 旧档没有这两个键；补成与新游戏一致的默认值
    values.atkSpeed ??= 100;
    values.armor ??= 0;
}

/** 读档入口：先迁移，再交给数据端统一读档。 */
function loadWithMigration(
    state: ICoreState,
    save: Map<string, unknown>
): void {
    migrateHeroSave(save);
    state.loadState(save, SaveCompression.NoCompression);
}
```

也可以给 `'@system/hero'` 绑定一个 `ISaveableExecutor`，在 `afterLoad` 里用 `state.hero.getModifiableAttribute().set('armor', 0)` 补值。但 `afterLoad` 发生在属性读档之后，已经算过一轮最终值，补完还要依赖 `set` 触发重算；直接在 `loadState` 前改映射更干净。

## 读取与修饰

属性对象有两套读取方式：

- `getBaseAttribute(name)` 读基础值，也就是存档里保存的数值；
- `getFinalAttribute(name)` 读最终值，也就是基础值依次经过全部修饰器后的结果。

写基础值要用 `state.hero.getModifiableAttribute()`；只读场景用 `state.hero.getAttribute()`。直接改基础值会触发重算，最终值随之更新。

修饰器通过 `addModifier(name, modifier, save?)` 挂到某个属性上。内置的 `ValueModifier` 做数值加减，`PercentageModifier` 按基础值计算百分比：

```ts
import { ICoreState } from '@user/data-state';
import { PercentageModifier } from '@user/data-base';

/** 给勇士挂一个临时的 +15% 攻速。 */
function addTemporaryAtkSpeed(state: ICoreState): void {
    const attribute = state.hero.getModifiableAttribute();
    const modifier = new PercentageModifier(0.15);

    // 第三个参数为 false：这个修饰器不进属性存档，由拥有它的系统负责恢复
    attribute.addModifier('atkSpeed', modifier, false);

    // 需要结束时用同一个修饰器对象移除
    // attribute.deleteModifier('atkSpeed', modifier);
}
```

`PercentageModifier` 的参数是倍率，`0.15` 表示基础值的 15%。基础攻速为 `100` 时，最终攻速是 `100 + 100 * 0.15 = 115`；它乘的是基础值，不会把其他修饰器的结果再乘一遍。

`save` 的取舍决定了读档后由谁恢复这个修饰器：

- 装备产生的加成用 `false`。装备槽在读档时会重新穿戴，实例修饰器随之重挂；属性存档再存一份会重复计算。详见[勇士的装备系统](./equipment-system.md)。
- 由某个系统长期维护的加成，也建议用 `false`，让该系统在自己的读档流程里恢复，避免两套来源各恢复一次。
- 确实需要属性自己保存的修饰器用 `true`，但它的 `type` 必须已经通过 `registerModifier` 注册；读档时找不到构造器会静默跳过该修饰器。

## 接入伤害计算

`IDamageCalculator.calculate(handler)` 接收只读的怪物与勇士信息，返回 `{ damage, turn }`：`damage` 是这场战斗勇士会损失的总生命，`turn` 是打完怪物需要的回合数。内置实现在 `src/data/enemy/calculator.ts`，由 `src/data/enemy/initialize.ts` 通过 `damageSystem.useCalculator(new MainDamageCalculator())` 注册。

攻速与护甲的接入点不同：

- **攻速影响「每回合伤害」**。先算 `atk - monDef`，再乘 `atkSpeed / 100`，最后用缩放后的每回合伤害计算回合数。
- **护甲影响「最终伤害」**。所有回合伤害汇总后，再乘 `1 - armor / 100`，并把护甲夹在 `0` 到 `100` 之间，避免负伤害或反向治疗。

顺序不能反：攻速要在算回合数之前生效，护甲要在最终伤害上生效。下面给出的是**完整**的 `MainDamageCalculator`，吸血、支援、先攻、破甲、反击、净化、魔防、负伤归零、固伤、仇恨、自爆全部保留，只插入攻速与护甲两处：

```ts
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import {
    CriticalableHeroStatus,
    IDamageCalculator,
    IEnemyDamageInfoBase,
    IReadonlyEnemyHandler
} from '@user/data-system';
import { ISpecial9Value } from './special';

/** 带攻速与护甲的勇士伤害计算器。 */
export class MainDamageCalculator implements IDamageCalculator<
    IEnemyAttr,
    IHeroAttr
> {
    /** 当前是否正在计算支援怪的伤害 */
    private inGuard: boolean = false;

    calculate(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): IEnemyDamageInfoBase {
        const { enemy, locator, hero } = handler;
        const hp = hero.getBaseAttribute('hp');
        const atk = hero.getFinalAttribute('atk');
        const def = hero.getFinalAttribute('def');
        // 支援中魔防只会被计算一次
        const mdef = this.inGuard ? 0 : hero.getFinalAttribute('mdef');
        const monAtk = enemy.getAttribute('atk');
        const monDef = enemy.getAttribute('def');
        let monHp = enemy.getAttribute('hp');

        // 无敌
        if (
            enemy.hasSpecial(18) &&
            handler.state.hero.items.itemCount('cross') < 1
        ) {
            return { damage: Infinity, turn: 0 };
        }

        let damage = 0;
        let heroPerDamage = 0;
        let enemyPerDamage = 0;

        // [需改] 攻速缩放勇士每回合伤害。
        // 插入点就是原来的 `heroPerDamage += atk - monDef`：
        // 必须在 `turn = Math.ceil(monHp / heroPerDamage)` 之前，
        // 也要在下面的 `<= 0` 早退之前，否则攻速为 0 时会除出 Infinity。
        const atkSpeed = hero.getFinalAttribute('atkSpeed');
        heroPerDamage += ((atk - monDef) * atkSpeed) / 100;
        if (heroPerDamage <= 0) {
            return { damage: Infinity, turn: 0 };
        }

        // 吸血
        const vampire = enemy.getSpecial<ISpecial9Value>(9);
        if (vampire) {
            const value = (vampire.value.vampire / 100) * hp;
            damage += value;
            // 如果吸血加到自身
            if (vampire.value.add) {
                monHp += value;
            }
        }

        // 魔攻
        if (enemy.hasSpecial(2)) {
            enemyPerDamage = monAtk;
        } else {
            enemyPerDamage = monAtk - def;
        }

        // 连击
        const multiHit = enemy.getSpecial<number>(4);
        if (multiHit) {
            enemyPerDamage *= multiHit.value;
        }
        if (enemyPerDamage < 0) enemyPerDamage = 0;

        // 回合数必须使用缩放后的每回合伤害
        let turn = Math.ceil(monHp / heroPerDamage);

        // 支援
        const guards = enemy.getAttribute('guard');
        if (guards.size > 0 && !this.inGuard) {
            this.inGuard = true;
            // 打支援怪时当前怪物也会打你，因此回合数与伤害都要累加
            for (const view of guards) {
                const extraInfo = this.calculate({
                    enemy: view.getComputedEnemy(),
                    context: handler.context,
                    locator,
                    hero,
                    state: handler.state
                });
                turn += extraInfo.turn;
                damage += extraInfo.damage;
            }
            this.inGuard = false;
        }

        // 先攻
        if (enemy.hasSpecial(1)) {
            damage += enemyPerDamage;
        }

        // 破甲
        const breakArmor = enemy.getSpecial<number>(5);
        if (breakArmor) {
            damage += (breakArmor.value / 100) * def;
        }

        // 反击
        const counterAttack = enemy.getSpecial<number>(6);
        if (counterAttack) {
            // 反击是每回合生效，因此加到 enemyPerDamage 上
            enemyPerDamage += (counterAttack.value / 100) * atk;
        }

        // 净化
        const purify = enemy.getSpecial<number>(7);
        if (purify) {
            damage += purify.value * mdef;
        }

        damage += (turn - 1) * enemyPerDamage;

        // 魔防
        damage -= mdef;

        // 未开启负伤时，如果伤害为负，则设为 0
        if (
            !handler.state.flags.getFieldValueDefaults(
                'enableNegativeDamage',
                false
            ) &&
            damage < 0
        ) {
            damage = 0;
        }

        // 固伤，无法被魔防减伤
        const fixedDamage = enemy.getSpecial<number>(20);
        if (fixedDamage) {
            damage += fixedDamage.value;
        }

        // 仇恨，无法被魔防减伤
        if (enemy.hasSpecial(15)) {
            damage += handler.state.flags.getFieldValueDefaults('hatred', 0);
        }

        // [需改] 护甲按最终伤害百分比减伤。
        // 放在魔防、负伤归零、固伤、仇恨之后，因此这些部分都会被护甲缩放；
        // 放在自爆之前：自爆只把低于 hp - 1 的伤害抬到下限，下限本身不缩放。
        // 如果你希望固伤/仇恨绕过护甲，把这段移到固伤之前。
        const armor = Math.min(
            Math.max(hero.getFinalAttribute('armor'), 0),
            100
        );
        damage *= 1 - armor / 100;

        // 自爆
        if (enemy.hasSpecial(17)) {
            damage = Math.max(damage, hp - 1);
        }

        return { damage: Math.floor(damage), turn };
    }

    getCriticalLimit(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        attribute: CriticalableHeroStatus<IHeroAttr>
    ): number {
        switch (attribute) {
            case 'atk': {
                if (handler.enemy.hasSpecial(3)) {
                    return Infinity;
                }
                return (
                    handler.enemy.getAttribute('def') +
                    handler.enemy.getAttribute('hp')
                );
            }
        }
        return handler.hero.getFinalAttribute(attribute);
    }
}
```

两处插入点的含义：

- **攻速**：替换的是「每回合伤害」的初值，位置在吸血、连击、支援之前，但仍在 `turn` 计算与 `<= 0` 早退之前。不能等 `turn` 算完再乘——那样回合数不会变，只是把总伤害整体缩小。
- **护甲**：放在所有伤害分量汇总之后，缩放的是最终伤害。魔防已经先减掉，固伤与仇恨随后加上，所以它们也会被护甲缩放；自爆在其后执行 `damage = max(damage, hp - 1)`。注意自爆只保证 `hp - 1` 这个**下限**不被护甲缩放：护甲仍会先缩放之前的伤害，只有缩放后低于下限时才被抬回；缩放后仍高于下限时不会恢复。因此不能说「自爆完全不受护甲影响」。不要把护甲乘进 `enemyPerDamage`：那样只减免每回合伤害，先攻、破甲、净化、固伤等一次性伤害会漏掉护甲。

`getCriticalLimit` 也要跟着新属性考虑。它决定临界计算的搜索上界；自定义属性若参与伤害，至少要让读取该属性的方式与计算器一致，避免界面显示一个值、战斗按另一个值结算。

## 与装备和道具的关系

装备的 `value` 与 `percentage` 是按属性名索引的记录，新属性不需要额外注册。只要 `IHeroAttr` 里有这个数值字段，内容层的装备定义就能直接写（`category: 4` 即 `ItemCategory.Equipment`）：

```jsonc
{
    "num": 120,
    "category": 4,
    "name": "疾风剑",
    "text": "攻击速度 +15%",
    "hideInToolbox": false,
    "equip": {
        "slots": ["weapon"],
        // 动画 id 由内容层定义，这里换成你自己的装备动画
        "animate": "equip",
        // 数值加成：攻速只走百分比，不额外加固定值
        "value": {},
        // 百分比加成：沿用装备系统的约定，0.15 表示 15%
        "percentage": { "atkSpeed": 0.15 },
        // 这两个字段目前只是数据，引擎不会自动执行
        "loadEvent": null,
        "unloadEvent": null
    }
}
```

内容层是 JSONC，不会经过 TypeScript 的 `Record` 检查。如果你要在 TS 里手写 `IItemEquipData<IHeroAttr>` 对象字面量，注意 `value` 与 `percentage` 的类型是 `Record<SelectKey<IHeroAttr, number>, number>`，它会要求补齐**全部**数值属性键；只写 `{ atkSpeed: 0.15 }` 无法通过类型检查。最省事的做法仍然是写在 `src/content/item.jsonc` 里。

装备实例会把这些记录转成 `ValueModifier` 与 `PercentageModifier`，穿戴时挂到勇士属性，卸下时移除。基础攻速 `100` 配上 `percentage.atkSpeed = 0.15`，最终攻速就是 `115`。注意属性本身按百分数存储（`15` 表示 15%），而装备的 `percentage` 是倍率（`0.15` 表示 15%），两者写法不同。

道具效果若要直接改攻速，也可以调用 `state.hero.getModifiableAttribute().add('atkSpeed', value)` 或挂修饰器；道具效果属于内容层，这里不额外展开。

## 编辑器与状态栏

编辑器需要在英雄属性面板增加攻速与护甲两个输入项；状态栏需要在合适的位置显示它们的当前值。两处都属于对应端的实现，不在本篇范围内：

- `编辑器 · 新增英雄属性项`
- `渲染端 · 状态栏`

<!-- TODO(advanced-II): 编辑器属性项与状态栏显示 -->

数据端完成后，这两个入口只需要读取 `getFinalAttribute('atkSpeed')` 与 `getFinalAttribute('armor')`。在它们实现之前，先用控制台或调试脚本确认数值正确。

## 怎么验证

先准备一只属性固定的怪物，避免光环、支援或随机因素干扰。把内容配置里的 `atkSpeed` 设为 `100`、`armor` 设为 `0`，读取最终属性，再穿上一件 +15% 攻速的装备，最后观察伤害变化：

```ts
import { IEnemyAttr } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { IEnemyView } from '@user/data-system';

/** 打印攻速、护甲与对指定怪物的伤害。 */
function verifyHeroAttribute(
    state: ICoreState,
    enemy: IEnemyView<IEnemyAttr>
): void {
    const attribute = state.hero.getAttribute();
    console.log('攻速', attribute.getFinalAttribute('atkSpeed'));
    console.log('护甲', attribute.getFinalAttribute('armor'));

    const damageSystem = state.enemyContext.getDamageSystem();
    if (!damageSystem) return;

    const info = damageSystem.getDamageInfo(enemy);
    if (!info) return;

    console.log('伤害', info.damage, '回合', info.turn);
}
```

预期现象：

- 初始攻速为 `100`、护甲为 `0`；
- 穿上 +15% 攻速的装备后，最终攻速变为 `115`，同一只怪物的战斗回合数下降；
- 把护甲调高后，`damage` 随护甲上升而下降，`turn` 不变。

若最终攻速是 `NaN`，先检查 `core.jsonc` 的 `init.hero.attribute` 是否补了键；`HERO_DEFAULT_ATTRIBUTE` 只影响类型检查，补了它也不会在运行时兜底。若装备穿上后数值不变，检查装备定义的键名是否与接口字段完全一致。

## 边界与注意

- **所有创建英雄属性的位置都要补键**：类型常量（`HERO_DEFAULT_ATTRIBUTE`）、内容配置、测试夹具各一处。`Partial<IHeroAttr>` 不会报缺键，但运行时仍会读到 `undefined`。
- **内容配置不会与默认值合并**：`createAttribute` 直接使用传入对象，缺键就是 `undefined`；不要指望默认值兜底。
- **百分数属性统一用百分数存储**：`15` 表示 15%，计算时再除以 `100`。装备的 `percentage` 则是倍率，`0.15` 表示 15%。
- **不要把新属性塞进既有汇总字段**：例如不要把攻速加进 `money` 或 `exp` 的统计逻辑，读这些字段的系统并不知道新属性的语义。
- **新增字段会影响存档结构**：读旧档时缺失的键不会自动补齐。迁移入口是在调用 `state.loadState(save, compression)` 之前修改 `@system/hero` 的 `attribute.values`（见上文「旧存档迁移」），不要指望 `core.jsonc` 或 `HERO_DEFAULT_ATTRIBUTE` 兜底；写入新档后，旧版本读到多出的键通常可忽略，但不能假设旧版本认识它。
- **`save = true` 的修饰器要注册类型**：读档按 `type` 查构造器，未注册的修饰器会被静默跳过，数值看起来「读档后消失了」。
- **护甲要夹在有效区间**：大于 `100` 会变成治疗，负数会放大伤害；在计算器入口统一夹一次。
- **攻速改动会影响回合数**：凡是依赖 `turn` 的逻辑（支援、先攻、状态持续时间）都要跟着复核，不能只改伤害数字。
- **编辑器与状态栏尚未接入**：在对应端实现之前，不要假设属性会自动出现在界面上。

渲染端如何展示这两个属性不在本篇范围内。 <!-- TODO(renderer): 攻速与护甲的状态栏显示 -->

返回[高级 II 导览](./index.md)。
