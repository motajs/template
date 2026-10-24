# 勇士的装备系统

装备也是道具（`ItemCategory.Equipment`），但它和钥匙、药水不是一套流程。道具表只提供装备的原始定义；玩家实际拥有的每一件装备都是一个独立实例，穿在哪一栏又由另一套接口管理。这套拆分让「同一件装备可以有多份、每份强化不同」成为可能。

本篇讲装备实例仓、实例修饰器、装备槽、对比、排序与装备事件，最后说明修饰器与存档的内部约定。中级教程的[勇士装备](../../intermediate/hero-equipment.md)已经讲过常用调用，这里补齐实例、修饰器与读档恢复之间的关系。

## 装备与道具的区别

`IItemRawData` 是所有道具共用的定义，装备类道具的有效字段在 `equip` 里：

```ts
export interface IItemEquipData<THero> {
    /** 可以装备至的装备槽，每项之间为或的关系 */
    readonly slots: (number | string)[];
    /** 动画 id，具体表现由渲染端决定 */
    readonly animate: AnimationIds;
    /** 数值加成 */
    readonly value: Record<SelectKey<THero, number>, number>;
    /** 百分比加成 */
    readonly percentage: Record<SelectKey<THero, number>, number>;
    /** 穿上装备事件 */
    readonly loadEvent: unknown;
    /** 脱下装备事件 */
    readonly unloadEvent: unknown;
}
```

`category` 为 `Equipment` 的道具才会走装备系统。`equip.value` 与 `equip.percentage` 只是新实例的初始值。

`loadEvent` 与 `unloadEvent` **尚未实现**，详见下文「装备事件」。`animate` 是渲染端读取的动画 id，动画如何播放属于 `渲染端教程 · 装备动画`。 <!-- TODO(renderer): 装备动画 -->

装备需要实例，是因为「定义」与「持有」不是一回事：两把同样的剑可以分别强化到不同数值，卸下再穿上也要记住各自的状态。实例用自增的 `uid` 区分，装备槽只保存 `uid`。

## 装备实例仓

`state.hero.items.equipment` 是 `IHeroEquipsStore<IHeroAttr>`，管理所有已获得的装备实例：

| 成员                 | 作用                                                          |
| -------------------- | ------------------------------------------------------------- |
| `add(item)`          | 按图块数字或字符串 id 创建实例，返回新 `uid`；失败返回 `-1`   |
| `delete(uid)`        | 移除实例                                                      |
| `get(uid)`           | 取实例，未找到返回 `null`                                     |
| `instancesOf(equip)` | 取某件装备的全部实例，参数为图块数字或字符串 id，按排序器输出 |
| `instances()`        | 取全部实例，按排序器输出                                      |
| `count(item)`        | 数某件装备的实例数量，参数为图块数字或字符串 id               |
| `useSorter(sorter)`  | 设置排序器，传 `null` 恢复按 `uid` 升序                       |

`add` 的参数可以传图块数字或字符串 id，内部先经 `tileStore.num` 解析，再取 `itemStore` 里的定义。因此调用前道具定义必须已经注册。

```ts
import { ICoreState } from '@user/data-state';

/**
 * 发放一件装备，返回实例 uid；定义缺失时返回 -1。
 * 注意装备定义必须已经注册到 itemStore。
 */
function grantEquipment(state: ICoreState, id: string): number {
    const uid = state.hero.items.equipment.add(id);
    if (uid === -1) {
        // 图块 id 不存在，或该图块没有对应的道具定义
        return -1;
    }
    return uid;
}
```

拿到 `uid` 后，既可以交给装备槽穿戴，也可以直接改实例的加成。`instancesOf` 与 `count` 都按「同一件装备」聚合，与 `uid` 无关；两者都接受图块数字或字符串 id，内部同样先经 `tileStore.num` 解析。

## 装备实例的修饰器

每个实例是一个 `EquipmentState`，它把 `equip.value` 与 `equip.percentage` 维护成两组修饰器：

- `setValue(name, value)` 与 `getValue(name)`：数值加成，对应 `ValueModifier`；
- `setPercentage(name, value)` 与 `getPercentage(name)`：百分比加成，对应 `PercentageModifier`；
- `getModifiers()`：用于获取该实例的全部装备修饰器。

把加成设为 `0` 会删除对应条目与修饰器，而不是留下一个值为 0 的修饰器；读取不存在的属性返回 `0`。

```ts
import { ICoreState } from '@user/data-state';

/**
 * 强化一件装备：攻击 +5，防御 +10%。
 * 百分比用小数表示，0.1 即 10%。
 */
function strengthenEquipment(state: ICoreState, uid: number): void {
    const equip = state.hero.items.equipment.get(uid);
    if (!equip) return;

    equip.setValue('atk', 5);
    equip.setPercentage('def', 0.1);

    // 获取该实例的全部装备修饰器
    for (const [name, modifier] of equip.getModifiers()) {
        console.log('属性', name, '修饰器', modifier);
    }
}
```

两类修饰器的计算方式不同。`ValueModifier`（优先级 0）的 `modify(value)` 返回 `value + this.value`，直接加到当前值上；`PercentageModifier`（优先级 10）的 `modify(value, baseValue)` 返回 `value + baseValue * this.value`，乘的是基础属性值，再加到当前值上。

修饰器按 `priority` 从大到小应用，所以百分比先算、数值后加。若基础攻击为 `10`，装备提供 `atk +5` 与 `def +10%`，则攻击为 `15`，防御为 `baseDef * 1.1`。百分比不会把其它装备的数值加成也乘进去。

多件装备的百分比是**相加**，不是相乘：每件装备的 `PercentageModifier` 都独立按基础值计算 `baseValue * value`，再依次加到当前值上。两件各 `+10%` 的装备得到 `base * 1.2`，不是 `base * 1.21`；数值修饰器则在百分比之后再直接相加。

实例的修饰器是活的：穿戴后修改实例数值，`setValue` 会让已挂到属性上的修饰器标脏并立即重算，不需要重新穿戴。

## 装备槽与装备行为

`state.hero.equip` 是 `IHeroEquipment<IHeroAttr>`，管理「哪件装备穿在哪一栏」：

| 成员                            | 作用                                                           |
| ------------------------------- | -------------------------------------------------------------- |
| `slots`                         | 槽位名称数组                                                   |
| `setSlots(slots)`               | 设置槽位；通常来自存档，新游戏需要自己配置                     |
| `canEquipTo(uid, slot)`         | 返回 `EquipStatus`：`CanEquip` / `CannotEquip` / `NeedReplace` |
| `equip(uid, slot, autoUnload?)` | 穿戴，返回被替换下来的 `uid`；没有则 `undefined`               |
| `unequip(slot)`                 | 卸下指定索引的槽，返回被卸下的 `uid`                           |
| `equipped(uid)`                 | 查询某实例是否穿在身上                                         |
| `getEquipped(slot)`             | 取指定索引槽上的 `uid`                                         |
| `getEquips()`                   | 按槽位顺序取所有已装备实例，空槽为 `null`                      |

`slot` 可以传索引，也可以传名称。`hero.equip.slots` 本身是字符串数组，但 `slot` 参数同时接受 `number | string`：索引是最精确的寻址方式，名称只是粗略描述——多个槽同名时，传名称只能落到第一个可用槽，无法指定具体是哪一个。

装备定义里的 `equip.slots` 决定这件装备能装到哪些槽。`canEquipTo` 的第一道判定是 `equip.slots.includes(slot)`：定义里列了索引就传索引，列了名称就传名称；想让两种写法都可用，就把两种都列进去（如 `[0, 'weapon']`）。

`autoUnload` 只处理「同一件装备已经戴在另一个槽」的情况：为 `true` 时先从原槽卸下再穿到目标槽；为 `false` 时直接放弃这次穿戴。它不会替你处理目标槽上原有的装备——目标槽被占用时，`equip` 总会替换，并把旧装备的 `uid` 返回。

```ts
import { EquipStatus } from '@user/data-base';
import { ICoreState } from '@user/data-state';

/**
 * 把装备穿到指定槽位。
 * 假设该装备定义允许这个槽位，且槽位名称已由 setSlots 配置好。
 */
function equipToSlot(state: ICoreState, uid: number, slot: string): void {
    const equipment = state.hero.equip;

    const status = equipment.canEquipTo(uid, slot);
    if (status === EquipStatus.CannotEquip) return;

    // NeedReplace 表示目标槽已有装备；equip 会替换它并返回旧 uid
    const replaced = equipment.equip(uid, slot, true);

    console.log('替换下来的装备', replaced);
    console.log('目标槽索引', equipment.slots.indexOf(slot));
}

/** 卸下并返回该槽的装备 uid。 */
function unequipSlot(state: ICoreState, index: number): number | undefined {
    return state.hero.equip.unequip(index);
}
```

`getEquipped` 与 `unequip` 都只接受索引。按名称操作时，先用 `slots.indexOf(name)` 换成索引；`indexOf` 返回 `-1` 表示该名称不存在。

## 装备对比

`compareEquip(equipA, equipB, slot)` 把目标槽当作空槽，分别模拟「只穿 A」与「只穿 B」时的最终属性，返回两者之差：A 的最终属性减 B 的最终属性。`equipA` 与 `equipB` 传实例 `uid`，传 `-1` 表示该侧没有装备；`slot` 只接受槽位索引。

它不考虑目标槽当前穿着什么，也不关心 A、B 是否穿在别的槽上：A、B 只是临时挂到克隆属性上试算，真实属性不会被修改。A 与 B 也可以就是目标槽上的现役装备，结果仍是它们各自与空槽叠加后的差值。

返回值的键只包含 A 或 B 涉及的属性；两者都没涉及的属性不会出现。

```ts
import { IHeroAttr } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/**
 * 比较两件武器在 0 号槽的表现（按空槽模拟）。
 * 正数表示 A 更高，负数表示 B 更高。
 */
function compareWeapons(state: ICoreState, a: number, b: number): void {
    const diff = state.hero.equip.compareEquip(a, b, 0);

    for (const name of Object.keys(diff) as (keyof IHeroAttr)[]) {
        console.log(name, diff[name]);
    }
}
```

需要「某件装备相对空槽」的差值时，把另一侧传 `-1` 即可。

## 排序器

`IHeroEquipsStore` 可以挂一个 `IEquipmentSorter`，决定 `instances()` 与 `instancesOf()` 的输出顺序。排序器只影响展示顺序，不影响装备槽。

`compare(handler)` 的 `handler` 提供 `equipA`、`equipB`、`store` 与 `state`；返回值约定：

- 负值：`equipA` 排在前面；
- 正值：`equipB` 排在前面；
- `0`：交给实例仓按 `uid` 升序排列。

```ts
import { IEquipmentSorter, IEquipmentSortHandler } from '@user/data-base';
import { IHeroAttr } from '@user/data-common';

/**
 * 按攻击加成从高到低排序。
 * 加成相同时返回 0，由实例仓按 uid 升序兜底。
 */
export class AtkBonusSorter implements IEquipmentSorter<IHeroAttr> {
    compare(handler: IEquipmentSortHandler<IHeroAttr>): number {
        const a = handler.equipA.getValue('atk');
        const b = handler.equipB.getValue('atk');

        // 降序：加成大的一方应返回负值
        if (a !== b) return b - a;
        return 0;
    }
}

/** 安装排序器；传 null 可恢复默认的 uid 顺序。 */
function useAtkSort(state: ICoreState): void {
    state.hero.items.equipment.useSorter(new AtkBonusSorter());
}
```

排序发生在每次调用 `instances()` 与 `instancesOf()` 时，返回的是新数组；它不会改变实例仓内部的存储顺序。

## 装备事件

`EquipmentState` 提供 `IEquipmentStateHooks.onChangeModifier`，但它监听的是**修饰器变化**，不是穿戴。`setValue`、`setPercentage` 以及删除条目都会触发它；`equip` 与 `unequip` 本身不会触发。它适合做「装备强化后重算某个系统」这类联动：

```ts
import { ICoreState } from '@user/data-state';

/** 监听一件装备的修饰器变化。 */
function watchEquipment(state: ICoreState, uid: number): void {
    const equip = state.hero.items.equipment.get(uid);
    if (!equip) return;

    const controller = equip.addHook({
        onChangeModifier(modifiers) {
            // 改变 setValue / setPercentage 时触发
            // modifiers 是实时迭代器，不要保存到回调之外
            for (const [name, modifier] of modifiers) {
                console.log('装备属性变化', name, modifier.value);
            }
        }
    });

    // 不再需要时卸载；只移除钩子，不会卸下装备
    controller.unload();
}
```

`IItemRawData.equip.loadEvent` 与 `unloadEvent` **尚未实现**：它们不是自动钩子，引擎不会在穿戴或卸下时执行它们，目前只是数据字段。**引擎也没有内置「装备穿上/卸下」钩子**，`onChangeModifier` 不能替代它。需要「穿上后触发」的行为，就在调用 `equip` / `unequip` 的统一入口里处理，或者包装一个自己的装备服务：

```ts
import { ICoreState } from '@user/data-state';

/** 在穿戴入口统一处理穿上后的逻辑。 */
function equipWithCallback(
    state: ICoreState,
    uid: number,
    slot: string | number
): number | undefined {
    const replaced = state.hero.equip.equip(uid, slot);
    // 只有这里能确定「刚完成一次穿戴」；不要依赖 loadEvent 或 onChangeModifier
    console.log('穿上', uid, '替换下', replaced);
    return replaced;
}
```

## 修饰器与存档的内部实现

此章节讲解一下装备修饰器与存档的内部实现。

装备修饰器以 `this.attribute.addModifier(name, modifier, false)` 加入勇士属性，第三个参数表示不进属性存档。读档时 `HeroAttribute.loadState` 会清空所有修饰器，只重建存档里保存的那些；装备修饰器不在其中，因此读档后的勇士暂时没有任何装备加成。

恢复发生在 `HeroEquipment.loadState`：它先清空 `equips` 映射，再按存档逐个调用 `equip` 重新穿戴。重新穿戴会把实例的修饰器重新挂到属性上，装备加成就回来了。整个过程在 `replaySystem.disable()` 与 `revert()` 之间进行，不会被记进录像。

`HeroState.loadState` 的顺序保证这条路径可行：属性 → 位置 → 道具（装备实例仓）→ 装备槽。实例仓先按存档重建，装备槽随后才能按 `uid` 找到它们。

由此得到一条实践规则：装备加成只能由 `equip` 与 `unequip` 维护。绕过装备槽，直接把装备修饰器 `addModifier(name, modifier)` 到勇士属性上，读档后这些修饰器会被清掉；如果给它们 `save = true`，读档时属性会先恢复一份，重新穿戴又会再加一份，数值翻倍。需要长期存在的非装备修饰器，应该由拥有它的系统自己负责存档，参见[勇士属性](../../intermediate/hero-attribute.md)。

正确的顺序是：先 `add` 得到实例、改好实例数值，再 `equip` 穿戴。读档时不要手动重挂修饰器，`loadState` 已经处理。

## 怎么验证

依次发放、强化、穿戴、卸下，再存档读档，确认差值符合预期：

```ts
import { SaveCompression } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/**
 * 验证装备加成与读档恢复。
 * 假设已注册 sword 定义、其 slots 包含 'weapon'，
 * 且验证环境只使用一个 weapon 槽。
 */
function verifyEquipment(state: ICoreState): void {
    const attribute = state.hero.attribute;
    const store = state.hero.items.equipment;
    const equipment = state.hero.equip;

    equipment.setSlots(['weapon']);

    const baseAtk = attribute.getBaseAttribute('atk');
    const baseDef = attribute.getBaseAttribute('def');

    const uid = store.add('sword');
    if (uid === -1) return;

    const item = store.get(uid);
    if (!item) return;
    item.setValue('atk', 5);
    item.setPercentage('def', 0.1);

    equipment.equip(uid, 'weapon');
    console.log('穿戴后攻击', attribute.getFinalAttribute('atk'));
    console.log('穿戴后防御', attribute.getFinalAttribute('def'));

    // 先存档，此时装备仍穿在身上，装备槽与实例仓都会写进快照
    const snapshot = state.hero.saveState(SaveCompression.NoCompression);

    // 再卸下，确认修饰器被移除
    equipment.unequip(equipment.slots.indexOf('weapon'));
    console.log('卸下后攻击', attribute.getFinalAttribute('atk'));

    // 最后读档：属性先回到基础值，HeroEquipment.loadState 再按快照重新穿戴
    state.hero.loadState(snapshot, SaveCompression.NoCompression);

    console.log('读档后攻击', attribute.getFinalAttribute('atk'));
    console.log('读档后防御', attribute.getFinalAttribute('def'));

    // 预期值：攻击 = baseAtk + 5，防御 = baseDef * 1.1
    console.log('预期攻击', baseAtk + 5, '预期防御', baseDef * 1.1);
}
```

穿戴后攻击应比基础值多 `5`，防御应为 `baseDef * 1.1`；卸下后两者回到基础值。因为存档发生在卸下之前，读档后 `HeroEquipment.loadState` 会按快照重新穿戴，这两个差值应再次出现。若把存档放在卸下之后，快照里没有已穿戴的装备，读档后自然不会有加成——这不是读档失败。

## 边界与注意

- **`add` 失败返回 `-1`**：图块 id 不存在，或该图块没有道具定义。`add` 不检查 `category`，传非装备道具可能得到无法使用的实例；调用方应先确认它是装备。
- **索引最精确，名称是粗略描述**：`slot` 可以传索引或名称；同名槽只能靠索引区分。装备定义 `equip.slots` 决定可装备的槽位，`canEquipTo` 会先检查定义里是否包含你传入的写法。
- **`autoUnload` 为 `false` 时不会搬移**：同一件装备已经戴在别的槽时，`equip` 会直接放弃，不做任何修改。
- **`unequip` 只接受索引**：按名称卸下要先 `slots.indexOf(name)`；`-1` 不会卸下任何东西。
- **不要删掉已穿戴的实例**：`delete(uid)` 只移除实例仓里的记录，不会解除装备槽的引用，也不会移除已经挂到属性上的修饰器。先 `unequip` 再 `delete`。
- **不要缩短已使用的 `slots`**：`equips` 以槽位索引为键，缩短数组会留下看不见但仍生效的槽位。先卸下再改。
- **读档会重建实例**：`HeroEquipsStore.loadState` 先清空再按存档重建，旧实例对象不再代表当前状态。读档后按 `uid` 重新 `get`，不要长期缓存实例引用。
- **`compareEquip` 两侧都为空时**返回 `{}` 并告警（code 195），不会抛错；`slot` 只接受索引。
- **`compareEquip` 按空槽比较**：目标槽当前穿什么不影响结果；某一侧传 `-1` 表示该侧空槽。
- **排序器不影响装备槽**：它只决定 `instances()` 与 `instancesOf()` 的展示顺序；`getEquipped` 与 `getEquips` 永远按槽位顺序。
- **`getModifiers()` 返回实时迭代器**：不要把它保存到回调之外；需要留存时先转成数组。

编辑器与状态栏的展示不在本篇范围内。 <!-- TODO(editor): 装备栏与状态栏展示 -->

返回[高级 II 导览](./index.md)。
