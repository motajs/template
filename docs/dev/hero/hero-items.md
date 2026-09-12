# 需求综述

为勇士添加背包系统，用于存储永久道具（Constant）、消耗道具（Consumable）和装备道具（Equipment）。即捡即用道具（Pick）在 addItem/getItem 时直接执行效果，不进入背包。

背包系统由 `IHeroItems` 接口定义，作为 `IHeroState` 的新成员挂载。三种类型的道具分别存储在三张 `Map<number, IHeroItemState>` 中，键为道具图块数字 `num`。背包需要支持存档读档，继承 `ISaveableContent<IHeroItemsSave>`。

# 接口设计分析

## IHeroItemState

### 设计意图

单个道具在背包中的运行时状态，存储道具的基础标识信息与当前数量。`raw` 为对 `IItemRawData` 的引用，提供 `category`、`name` 等定义数据的便捷访问，读档时通过 `state.itemStore.getData(num)` 恢复。

### 接口分析

- `IHeroItemState.id`：预期频率**中频**。道具的字符串标识符，用于通过 id 寻址时做匹配。典型使用场景：通过 id 判断是否持有某特定道具。
- `IHeroItemState.num`：预期频率**高频**。道具的图块数字，是 Map 键及与地图关联的核心标识。典型使用场景：地图事件中检查玩家是否拥有 `num` 对应的钥匙。
- `IHeroItemState.raw`：预期频率**高频**。道具原始定义数据引用，提供 category、name、effect 等属性。典型使用场景：显示道具名称、判断道具类型、执行道具效果。
- `IHeroItemState.count`：预期频率**中频**。道具当前持有数量。三种可存储类型的道具均正常存储数量，不存在时视为无此道具。

### 预期体量

约 12-16 行。

## IHeroItemSave

### 设计意图

单个道具的存档格式，仅需存储可序列化的字段（`num`、`count`），`id` 和 `raw` 在读档时通过 `itemStore` 和 `tileStore` 恢复。

### 预期体量

约 5-8 行。

## IHeroItemsSave

### 设计意图

整个背包的存档格式，包含三种类型道具的存档数组。由于三种类型的道具分表存储，存档也对应分表。

### 预期体量

约 5-8 行。

## IHeroItems

### 设计意图

勇士背包管理接口，作为 `IHeroState` 的新成员。提供道具的增减查用等基础操作，所有操作均支持通过 `num`（数字）或 `id`（字符串）寻址。

`addItem` 是核心接口，负责向勇士给予道具（`count` 可为负数以实现扣除）。`getItem` 是 `addItem(item, 1)` 的便捷写法，语义为勇士在游戏中"拾取"一个道具。`getItemState` 是查询接口，获取道具的只读状态。

对于 Pick 类型道具，`addItem` / `getItem` 不将其存入背包，而是直接执行 `raw.effect.pickEffect`。

### 接口分析

- `IHeroItems.addItem(item, count?)`：预期频率**中频**。向勇士添加或减少道具。若道具为 Pick 类型则立刻执行其效果；否则根据 `category` 选择对应分表，增加或减少 `count`，数量归零或负数时自动删除条目。典型使用场景：勇士在地图上走到道具格后拾取道具；事件脚本中给予或扣除玩家道具。
- `IHeroItems.getItem(item)`：预期频率**高频**。使勇士获取一个道具，即 `addItem(item, 1)` 的另一种写法。Pick 类型立即执行效果，其他类型背包数量加一。典型使用场景：勇士走到地图道具格上触发拾取。
- `IHeroItems.getItemState(item)`：预期频率**高频**。获取指定道具的只读状态，是所有查询操作的入口。返回 `null` 表示未持有。典型使用场景：NPC 检查玩家是否持有某任务道具；UI 显示道具详情。
- `IHeroItems.useItem(item)`：预期频率**中频**。使用道具，仅对 Constant 和 Consumable 类型生效。调用 `raw.effect.useEffect`，Consumable 类型使用后数量减一。返回 `boolean` 表示是否使用成功。
- `IHeroItems.itemCount(item)`：预期频率**高频**。获取道具当前持有数量，不存在时返回 0。典型使用场景：UI 中显示道具剩余数量。

### 预期体量

接口约 20-25 行。

实现类 `HeroItems` 约 80-100 行。内部维护三张 `Map<number, IHeroItemState>`，提供增删查用及存档读档逻辑。

# 实现思路

## id 与 num 的统一寻址

所有接口参数均接受 `number | string` 类型的 `item`。当传入为数字时，直接用作 Map 键；当传入为字符串时，需要先通过 `state.tileStore.idToNumber(item)` 转换为 `num`，再用于查找。若转换结果为 `null` 则视为不存在。

注意：道具 `id` 与 `num` 的转换依赖 `ITileStore.idToNumber`，而非 `IItemStore`（道具本身是 tile 的一类具体属性，通过 tile 即可定位，`IItemStore` 只负责道具定义存储，不需要 id↔num 双向索引）。

## 道具存取流程

1. `addItem(item, count)`：将 `item` 解析为 `num`，调用 `state.itemStore.getData(num)` 获取 `raw`。若 `raw` 为 `null` 则忽略。若 `raw.category === ItemCategory.Pick`，执行 `raw.effect.pickEffect(raw)` 后直接返回。否则，根据 `raw.category` 选择对应分表 `Map<number, IHeroItemState>`，若已存在条目则加大 `count`，结果 ≤ 0 则删除条目，否则创建新条目插入。
2. `getItem(item)`：调用 `addItem(item, 1)`。
3. `getItemState(item)`：将 `item` 解析为 `num`，通过 `state.itemStore.getCategory(num)` 获取道具类型并定位对应分表，从分表中获取条目并返回只读快照，不存在返回 `null`。
4. `useItem(item)`：通过 `getItemState` 获取条目，若不存在或非 Constant/Consumable 类型则返回 `false`；若 `raw.effect.canUse` 为 `false` 则返回 `false`。调用 `raw.effect.useEffect`。若为 Consumable 类型，`count--`，归零时删除条目。返回 `true`。
5. `itemCount(item)`：通过 `getItemState` 获取条目，存在则返回 `count`，不存在返回 `undefined`。

## 存档读档

- `saveState`：遍历三张分表，将每个条目提取 `{ num, count }` 形成 `IHeroItemSave`，构造 `IHeroItemsSave` 并返回。
- `loadState`：遍历 `IHeroItemsSave` 中三种类型数组，对每条 `IHeroItemSave` 调用 `state.itemStore.getData(num)` 恢复 `raw`，重建分表。

# 涉及文件

## 需要引用的文件

- `@user/data-common`：引用 `ISaveableContent`、`IDataCommonExtended`、`SaveCompression`、`IItemRawData`、`ItemCategory`、`IDataCommon`。
- `@user/data-base/hero/types.ts`：引用 `IHeroState`，向其新增 `items` 成员。

## 需要修改的文件

### `@user/data-base/hero/types.ts`

- [x] 新增 `IHeroItemSave` 接口：包含 `readonly num: number`、`readonly count: number`。
- [x] 新增 `IHeroItemsSave` 接口：包含 `readonly constants: readonly IHeroItemSave[]`、`readonly consumables: readonly IHeroItemSave[]`、`readonly equipments: readonly IHeroItemSave[]`。
- [x] 新增 `IHeroItemState` 接口：包含 `readonly id: string`、`readonly num: number`、`readonly raw: IItemRawData<THero>`、`count: number`。
- [x] 新增 `IHeroItems<THero>` 接口：继承 `ISaveableContent<IHeroItemsSave>`、`IDataCommonExtended`，提供 `addItem`、`getItem`、`getItemState`、`useItem`、`itemCount` 方法。
- [x] 修改 `IHeroStateSave<THero>`：新增 `readonly items: IHeroItemsSave` 成员。
- [x] 修改 `IHeroState<THero>`：新增 `readonly items: IHeroItems<THero>` 成员。

### `@user/data-base/hero/items.ts`（新建）

- [ ] 实现 `HeroItemState` 类：实现 `IHeroItemState` 接口，存储 `id`、`num`、`raw`、`count`。
- [ ] 实现 `HeroItems` 类：实现 `IHeroItems<THero>` 接口，按功能分区（查询 / 增删 / 使用 / 存档 / 私有辅助）。
- [ ] `HeroItems` 内部维护 `constants`、`consumables`、`equipments` 三张 `Map<number, HeroItemState>`。
- [ ] 实现 `internalGetItemState` 私有方法：通过 `itemStore.getCategory` 定位分表后从中获取，返回可修改引用。
- [ ] 实现 `getItemState`：包装 `internalGetItemState`，返回 `Readonly` 快照。
- [ ] 实现 `addItem`：通过 `state.itemStore.getData` 获取 `raw`，Pick 类型执行效果后直接返回；其他类型按 `category` 插入对应分表，支持负数删除。
- [ ] 实现 `getItem`：转发至 `addItem(item, 1)`。
- [ ] 实现 `useItem`：仅对 Constant/Consumable 调用 `raw.effect.useEffect`，Consumable 减量，返回成功与否。
- [ ] 实现 `itemCount`：通过 `getItemState` 返回 count 或 0。
- [ ] 实现 `mapToSave` / `loadMap`：存档仅存 `{ num, count }`，读档通过 `itemStore.getData` 恢复 `raw`。
- [ ] 实现 `saveState` / `loadState`：序列化与反序列化三张分表。

### `@user/data-base/hero/state.ts`

- [ ] `HeroState` 构造函数中新增 `this.items = new HeroItems(state)`。
- [ ] `saveState` 中新增 `items: this.items.saveState(compression)`。
- [ ] `loadState` 中新增 `this.items.loadState(state.items, compression)`。

### `@user/data-base/hero/index.ts`

- [ ] 新增 `export * from './items'` 导出。
