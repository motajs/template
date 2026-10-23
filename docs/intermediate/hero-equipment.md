# 勇士装备

装备是一种特殊的道具：它要穿到某个槽位上，并给属性加成。为了把「穿在哪」和「拥有哪些」分开管，装备系统分成了两部分——`state.hero.equip` 管理**装备槽**（哪件装备穿在哪一栏），`state.hero.items.equipment` 是**装备实例仓库**（管理所有已获得的装备实例）。本篇介绍如何用这两组接口。

## 装备槽（IHeroEquipment）

`state.hero.equip` 管的是「穿在身上的装备」，它提供：

- `slots`：装备槽位数组，每一项是这一栏的名称；
- `setSlots(slots)`：设置装备槽；
- `canEquipTo(uid, slot)`：判断某件装备能否装备到指定槽，返回 `EquipStatus`；
- `equip(uid, slot, autoUnload?)`：把装备穿上；
- `unequip(slot)`：卸下指定槽的装备；
- `equipped(uid)`：查询某装备是否处于装备状态；
- `getEquipped(slot)`：取指定槽的装备 uid；
- `getEquips()`：按槽位顺序取所有已装备实例；
- `compareEquip(equipA, equipB, slot)`：比较两件装备在同一槽位上的属性表现，详见下文「比较装备」。

`slot` 可以传装备槽索引（数字）或槽位名称（字符串）。`EquipStatus` 有三个取值：`CanEquip`（可以直接装备）、`CannotEquip`（不能装备）、`NeedReplace`（需要替换槽位上的装备）。

`equip` 的 `autoUnload` 参数默认为 `true`：当要装备的装备当前穿在别的槽上时，自动把它从原槽卸下。`equip` 与 `unequip` 都会返回被卸下的装备 uid（没有则为 `undefined`）。

**目标**：给勇士获得一件装备并穿上 0 号槽，随后再把它卸下。

**改哪里**：你要操作装备的地方——例如某个事件函数或道具效果里。

**复制什么**：

```ts
// 获得一件新装备实例，拿到它的 uid
const uid = state.hero.items.equipment.add('sword');

// 穿到 0 号槽；返回被自动卸下的装备 uid（没有则 undefined）
state.hero.equip.equip(uid, 0);

// 卸下 0 号槽，返回被卸下的装备 uid
const off = state.hero.equip.unequip(0);
```

> 复制说明：片段已省略 `import`（这里用到的都是 `state` 上的成员，一般无需额外引入）；若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md#照抄教程里的代码时-怎么处理-import) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：把 `'sword'` 换成你的装备 id 或图块数字；把 `0`（槽位）换成目标槽的索引或名称；`uid`、`off` 不需要时可省去接收。

**怎么验证**：穿装备后看 `state.hero.equip.getEquipped(0)` 是否返回该 uid、`state.hero.equip.equipped(uid)` 是否为 `true`；卸下后应为 `undefined` / `false`。

**注意**：`equip` 的 `autoUnload` 默认为 `true`（自动从原槽卸下）；要事先判断能否装备，用 `canEquipTo(uid, slot)`，它返回 `CanEquip` / `CannotEquip` / `NeedReplace`。

## 装备实例仓库（IHeroEquipsStore）

`state.hero.items.equipment` 管的是「背包里所有的装备实例」——同一件装备可以有多件，各自独立，所以这里存的是**实例**而非装备本身。它提供：

- `add(item)`：获得一件装备道具、创建实例，返回新实例的 uid；
- `delete(uid)`：移除指定装备实例；
- `get(uid)`：取指定装备实例的状态，与是否装备无关；
- `instancesOf(equip)`：取某件装备的所有实例；
- `instances()`：取当前所有装备实例；
- `count(item)`：取某件装备的实例总数。

```ts
const instances = state.hero.items.equipment.instancesOf('sword');
const total = state.hero.items.equipment.count('sword');
```

## 装备的加成

每件装备实例（`IEquipmentState`）对勇士属性提供**数值加成**与**百分比加成**，分别通过 `getValue` / `getPercentage` 读取，`setValue` / `setPercentage` 修改。这两类加成本质上就是[勇士属性](./hero-attribute.md#修饰器-数值与百分比加成)中的修饰器：装备时把对应的 `ValueModifier` / `PercentageModifier` 挂到勇士属性上，卸下时移除，因此不必手动维护加成数值。

```ts
const equipState = state.hero.items.equipment.get(uid);
equipState?.setValue('atk', 12);
const atkBonus = equipState?.getValue('atk') ?? 0;
```

## 比较装备

`compareEquip(equipA, equipB, slot)` 用于比较两件装备在指定装备槽上的表现，返回「装备 A 时属性 − 装备 B 时属性」的差值。传入 `-1` 表示该侧无装备，可用来比较「某件装备相对空槽」的提升。

```ts
const diff = state.hero.equip.compareEquip(uid, -1, 0);
// diff.atk 即装备这件装备相对空槽的攻击提升
```

> 装备排序器（决定同一槽位上多件装备如何排序、如何挑选「更好」的一件）会在**高级教程**中讲解（预留标记：`高级教程 · 装备排序器`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 装备排序器 -->

装备道具本身来自道具定义，见[勇士道具](./hero-items.md)；想从 `state` 出发找到这些对象，见[数据端总览](./data-state-overview.md)。
