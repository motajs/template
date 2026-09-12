# 需求综述

参考 `ITileStore` 的设计，为道具系统定义 Layer 0 的原始数据存储层，包含 `IItemRawData`、`IItemLegacyConverter`、`IItemStore` 接口及 `ItemStore` 实现类，并挂载至 `IDataCommon`。道具本身是一类 tile 的具体属性，通过 tile 即可定位，不需要独立的 id↔num 双向索引。

# 接口设计分析

## ItemCategory 枚举

在 `store/types.ts` 中与 `TileType` 并列定义，用于标识道具分类：

- `Unknown`：未知或尚未归类的道具。
- `Constant`：永久道具，获得后常驻生效。
- `Consumable`：一次性道具，使用后消耗。
- `Pick`：即捡即用道具，捡到立刻生效。
- `Equipment`：装备类道具，可装备 / 卸下。

### 设计意图

放在 `store/types.ts` 而非 `data-common/src/types.ts`，以避免 `types.ts` ↔ `store/types.ts` 之间的循环引用。`types.ts` 通过 `./store` 导入 `IItemStore` 挂载到 `IDataCommon`；若将 `ItemCategory` 放在 `types.ts`，`store/types.ts` 引用它时会产生循环。

## IItemRawData

### 设计意图

参考 `ITileRawData` 的设计，`IItemRawData` 是道具的原始数据定义，存储于 `IItemStore` 中。除基础数据字段外，通过 `readonly effect: IItemEffect` 成员承载道具效果。旧样板字符串效果由 `IItemLegacyConverter` 在转换时通过 `new Function` 编译为 `IItemEffect` 实例。

`IItemStore` 作为 Layer 0 的基础设施被 `IDataCommon` 持有，与 `ITileStore` 平级。后续 `IItemManager`（Layer 1）通过 `IDataCommonExtended.state.itemStore` 访问原始数据，据此创建 `IItem<TAttr>` 运行时实例。

### 接口分析

- `IItemRawData.num`：预期频率**高频**。道具在地图上的图块数字，是地图→道具的核心关联键。典型使用场景：事件触发器读取地图上某图块对应的道具信息。
- `IItemRawData.id`：预期频率**高频**。道具的字符串唯一标识符。典型使用场景：通过 id 跨地图引用道具。
- `IItemRawData.category`：预期频率**中频**。道具分类，决定使用时的基础行为分支。典型使用场景：拾取道具时判断是否为 `Pick` 类以立即触发效果。
- `IItemRawData.name`：预期频率**高频**。道具显示名称，UI 展示的核心字段。
- `IItemRawData.text`：预期频率**低频**。道具描述文本，仅详情展示时出现。
- `IItemRawData.effect`：预期频率**中频**。道具效果对象，包含 `pickEffect`、`useEffect`、`canUse` 三个方法。典型使用场景：拾取道具时调用 `effect.pickEffect(state)` 触发即捡即用效果。

### 预期体量

`IItemRawData` 约 15–20 行（含 `effect` 成员）。

## IItemEffect

### 设计意图

道具效果接口，与 `IItemRawData` 并列定义在 `store/types.ts` 中。包含 `pickEffect`、`useEffect`、`canUse` 三个方法，参数为当前道具的 `IItemRawData`。由 `IItemLegacyConverter` 在转换时通过 `new Function` 编译实例化，编译函数内部自行持有 `IStateSystem` 引用（由实现类构造函数传入），方法内据此调用编译函数。

### 接口分析

- `IItemEffect.pickEffect`：预期频率**低频**。拾取道具时调用（仅 `Pick` 类型），参数为当前道具数据。
- `IItemEffect.useEffect`：预期频率**中频**。使用道具时调用（`Constant` 和 `Consumable` 类型），参数为当前道具数据。典型使用场景：使用消耗道具触发属性变化。
- `IItemEffect.canUse`：预期频率**中频**。判定道具是否可用（`Constant` 和 `Consumable` 类型），参数为当前道具数据。典型使用场景：开门钥匙判断是否满足使用条件。

### 预期体量

`IItemEffect` 约 12–15 行。

## IItemLegacyConverter

### 设计意图

参考 `ITileLegacyConverter`，定义从旧样板道具对象到 `IItemRawData` 的转换器接口。转换时需将旧样板中的字符串效果（`itemEffect`、`useItemEffect`、`canUseItemEffect`）通过 `new Function` 编译为 `IItemEffect` 实例，赋给 `IItemRawData.effect`。编编译函数签名为 `(state: IStateSystem) => void`（`canUse` 返回 `boolean`），实现类内部自行持有 `IStateSystem`，接口方法仅传递 `IItemRawData`。

与后续 `IItemLegacyBridge` 不同——`IItemLegacyConverter` 位于 store 层负责原始数据的导入（含效果编译），`IItemLegacyBridge`（Layer 1）负责运行时属性的转换。二者分层独立，分别处理静态数据与运行时对象。

### 接口分析

- `IItemLegacyConverter.fromLegacy`：预期频率**低频**。仅在样板加载阶段调用，执行旧格式→新格式的批量转换，含字符串效果的编译。

### 预期体量

一个方法，约 8–10 行。

## IItemStore

### 设计意图

参考 `ITileStore` 的接口模式，作为道具原始数据的集中存储。道具本身是一类 tile 的具体属性，通过 tile 即可查找到对应的道具信息，因此不需要 `ITileStore` 那样的双向 id↔num 索引。但数据内仍存储 `id` 与 `num`，方便在需要时进行查询。

### 接口分析

- `IItemStore.getData`：预期频率**高频**。按图块数字获取完整原始数据，是查询道具定义的最常用入口。典型使用场景：地图图层解析到某图块数字后读取道具定义。
- `IItemStore.getCategory`：预期频率**中频**。快速判断道具分类，避免完整获取数据。典型使用场景：拾取判定时只关心是否为 `Pick` 类型。
- `IItemStore.addItem`：预期频率**低频**。添加一个道具原始定义，仅在样板加载时调用。
- `IItemStore.attachLegacyConverter`：预期频率**低频**。挂载旧样板转换器，初始化阶段调用。
- `IItemStore.fromLegacy`：预期频率**低频**。使用当前转换器转换并写入一个旧样板道具定义。

### 预期体量

接口约 20–25 行，实现类 `ItemStore` 约 50–70 行（内部仅维护 `dataMap: Map<number, IItemRawData>` 一张表，与 `TileStore` 相比少了双向索引表）。

# 涉及文件

## 需要引用的文件

- `@user/data-common/src/store/types.ts`：参考 `ITileRawData`、`ITileLegacyConverter`、`ITileStore` 的接口模式，用于设计 `IItemStore`。
- `@user/data-common/src/store/tileStore.ts`：参考 `TileStore` 的实现模式，用于实现 `ItemStore`。

## 需要修改的文件

### `@user/data-common/src/store/types.ts`

- [x] 新增 `ItemCategory` 枚举：包含 `Unknown`、`Constant`、`Consumable`、`Pick`、`Equipment` 五个成员。放在 `store/types.ts` 以避免与 `types.ts` 的循环引用。
- [x] 补齐 `IItemRawData` 接口：新增 `readonly effect: IItemEffect` 成员。
- [x] 新增 `IItemEffect` 接口：包含 `pickEffect(item: IItemRawData): void`、`useEffect(item: IItemRawData): void`、`canUse(item: IItemRawData): boolean` 三个方法。
- [x] 新增 `IItemLegacyConverter<TLegacy>` 接口：定义旧样板道具→`IItemRawData` 的转换方法，负责将旧样板字符串效果编译为 `IItemEffect` 实例。
- [x] 新增 `IItemStore<TLegacy>` 接口：提供 `getData`、`getCategory`、`addItem`、`attachLegacyConverter`、`fromLegacy` 方法，不需要 id↔num 双向索引。

### `@user/data-common/src/store/itemStore.ts`（新建）

- [x] 新增 `ItemStore<TLegacy>` 类：实现 `IItemStore<TLegacy>` 接口，参考 `TileStore` 的实现模式。
- [x] 内部维护 `dataMap: Map<number, IItemRawData>` 一张表，无需 id num 双向映射。
- [x] 实现 `fromLegacy`：无 converter 时抛出错误。

### `@user/data-common/src/store/index.ts`

- [x] 新增 `export * from './itemStore'` 导出。

### `@user/data-common/src/types.ts`

- [x] 修改 `IDataCommon` 接口：新增 `readonly itemStore: IItemStore` 成员。
