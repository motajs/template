# 需求综述

开发道具系统，核心包括以下内容：

1. **道具分类**：道具分为四种类型——`constant` 永久道具、`consumable` 一次性道具、`pick` 即捡即用道具、`equipment` 装备类道具。
2. **旧样板兼容**：参考 `packages-user/data-state/src/enemy/legacy.ts` 的模式，定义旧样板兼容接口，不关心旧样板内部存储格式。
3. **道具事件与道具脚本**：事件是面向新手的低代码自定义功能（该子系统尚未构建，仅提供接口占位）；脚本则传入函数，用于高级用户自定义道具行为。

整体架构遵循现有模式：Layer 0（`data-common`）定义 `ItemCategory` 枚举与 `IItemStore` 存储层（见 [item-store.md](./item-store.md)），Layer 1（`data-base`）定义核心运行时接口与实现类，Layer 2（`data-system`）为执行引擎层，Layer 3（`data-state`）提供旧样板兼容桥接实现等顶层集成。

# 接口设计分析

## IItemAttr（Layer 1 - 运行时属性）

### 设计意图

道具的基础属性接口，定义所有道具共有的字段。与 `IEnemyAttr` 类似，作为道具数据的核心载体。道具分类不同会导致其附加能力差异较大（如装备类有攻防加成、消耗类有恢复量等），因此 `IItemAttr` 仅包含所有道具共有的最小属性集合，分类特有的属性通过事件 / 脚本机制覆盖。

### 接口分析

- `IItemAttr.id`：预期频率**高频**。道具的唯一标识，在查询道具模板、存档读档等场景中频繁使用。典型使用场景：通过 id 获取指定道具模板。
- `IItemAttr.name`：预期频率**高频**。道具显示名称，几乎所有 UI 展示场景都需要。典型使用场景：物品栏、商店、拾取提示中显示道具名称。
- `IItemAttr.category`：预期频率**中频**。分类决定道具的基础行为模式（拾取后是否消耗、是否能装备等），在使用道具时作为关键判断依据。典型使用场景：判断道具是否可以装备到装备栏。
- `IItemAttr.text`：预期频率**低频**。道具描述文本，仅在详情展示中出现。典型使用场景：鼠标悬浮或点击时的 Tooltip。

### 预期体量

`IItemAttr` 仅为一个简单的属性接口，预计约 10–15 行。

## IReadonlyItem / IItem

### 设计意图

遵循怪物的只读 / 可变双接口模式：`IReadonlyItem<TAttr>` 提供读访问，`IItem<TAttr>` 继承前者并扩展写操作与 `ISaveableContent`。道具的核心能力（事件与脚本）挂载于 `IItem` 上。

### 接口分析

- `IReadonlyItem.id`：预期频率**高频**。同 `IItemAttr.id`，在只读场景下主要使用的访问方式。
- `IReadonlyItem.code`：预期频率**中频**。道具在地图上的图块数字，用于从地图图块关联到道具模板。典型使用场景：处理事件触发器从地图上读取道具信息。
- `IReadonlyItem.category`：预期频率**中频**。判断道具类别以决定后续行为。
- `IReadonlyItem.getAttribute`：预期频率**中频**。获取道具属性的指定字段，与怪物接口保持一致。典型使用场景：战斗计算中读取装备道具提供的属性加成。
- `IItem.addEvent`：预期频率**低频**。添加事件配置（低代码），通常由样板编辑器生成。由于事件系统尚未构建，此处仅提供接口占位。
- `IItem.addScript`：预期频率**低频**。添加脚本函数，通常由高级用户在代码中直接编写。
- `IItem.clone`：预期频率**中频**。深拷贝道具对象，用于创建怪物掉落物的独立实例。典型使用场景：战斗结算后为怪物掉落道具生成独立副本。

### 预期体量

两个接口合计约 30–40 行，其中 `IItem` 主要是在 `IReadonlyItem` 基础上增加写操作与 `ISaveableContent` 实现。

## IItemEvent 与 IItemScript

### 设计意图

道具自定义行为的两种途径：

- **IItemEvent**：面向新手的低代码配置。用户通过编辑器配置预设事件类型及参数，运行时由事件引擎解析执行。当前事件引擎尚未构建，本接口仅作为占位，后续事件系统实现后再对接。
- **IItemScript**：面向高级用户的函数式定制。用户直接传入函数，由道具系统在适当时机调用。脚本持有道具自身的引用，可在函数内通过 `item` 访问道具信息。

### 接口分析

- `IItemEvent.type`：预期频率**高频（编辑器层面）**。事件类型标识，决定事件引擎如何解析该事件。典型使用场景：样板编辑器中下拉选择"回复 HP"事件类型。
- `IItemEvent.params`：预期频率**高频**。事件参数，与 type 配合决定具体效果。
- `IItemScript.execute`：预期频率**中频**。执行脚本函数时的入口。典型使用场景：道具使用触发自定义逻辑（如播放动画后增减属性）。

### 预期体量

两个接口合计约 15–20 行，当前阶段仅需定义最小化的接口形状。

## IItemSaveState / IItemManagerSaveState

### 设计意图

存档状态接口，与 `IEnemySaveState` / `IEnemyManagerSaveState` 对应的设计。`IItemSaveState` 保存单个道具的完整状态快照，`IItemManagerSaveState` 保存管理器中所有变更的模板。事件与脚本是否需要存档取决于其可变性 — 如果事件配置与脚本函数在运行时不可变，则无需存档。

### 预期体量

两个接口合计约 15–20 行。

## IItemLegacyBridge

### 设计意图

参考 `IEnemyLegacyBridge` 的设计，定义从旧样板道具对象到新道具属性的转换接口。不关心旧样板数据结构，仅定义方法签名。

### 接口分析

- `IItemLegacyBridge.fromLegacyItem`：预期频率**低频**。仅在样板加载时调用一次，用于将所有旧样板道具转换为新格式。仅此一方法，不存在中频场景。

### 预期体量

仅一个方法，约 8–12 行。

## IItemManager

### 设计意图

遵循 `IEnemyManager` 的 Manager 模式，管理道具模板（prefab），负责创建、注册、旧样板导入及存档读档。事件注册与脚本注册暂不纳入 Manager（当前事件系统未构建，脚本为函数引用无需注册），但预留接口位置。

### 接口分析

- `IItemManager.createItem`：预期频率**中频**。根据图块数字创建道具实例，是战斗掉落、商店购买等场景的入口。典型使用场景：战斗结算时根据怪物掉落表 code 创建道具。
- `IItemManager.addPrefab`：预期频率**低频**。添加道具模板，样板加载阶段调用。
- `IItemManager.addPrefabFromLegacy`：预期频率**低频**。从旧样板导入道具模板，样板加载阶段调用。
- `IItemManager.fromLegacyItem`：预期频率**低频**。从旧样板道具对象转换。
- `IItemManager.getPrefab`：预期频率**中频**。获取道具模板的只读视图。典型使用场景：UI 查询道具信息用于展示。

### 预期体量

接口约 60–80 行，实现类约 200–300 行（包含 prefab 管理、dirty 追踪、存档读档逻辑，与 `EnemyManager` 体量相当）。

# 问题

1. `IItemAttr` 当前仅设计了 `id`、`name`、`category`、`text` 四个字段，是否需要额外添加分类相关的通用字段（如道具对应图块数字 `code`）？`code` 目前放在了 `IReadonlyItem` 层而非 `IItemAttr` 层，这样是否合理？
2. 对于装备类道具，是否需要一个独立的 `IEquipmentAttr` 接口来承载攻防加成等属性？还是这些应该完全通过事件 / 脚本机制实现？
3. `IItemEvent` 的事件类型标识应使用字符串还是枚举？按照开发规范应使用枚举，但事件系统尚未构建，此时定义枚举存在不确定性。建议先定义为 `string` 留白，待事件系统构建后再替换为枚举？
4. 道具的数据是否应该进入存档？如果道具在游戏中不可变（即模板数据不变化），则无需存档。但考虑到可能存在"道具数量"这类可变状态，是否需要单独的状态管理？还是数量管理不属于道具系统本身的职责？
5. 道具与背包系统之间的关系如何处理？背包系统是否独立于道具系统？还是道具系统需要预留背包相关接口？

# 涉及文件

## 需要引用的文件

- `@user/data-common/src/save/types.ts`：引用 `ISaveableContent`、`SaveCompression`。
- `@user/data-base/src/enemy/types.ts`：参考 `IEnemyManager` 和 `IEnemyLegacyBridge` 的接口模式。

## 需要修改的文件

### `@user/data-common/src/types.ts`

- [ ] 新增 `IItemAttr` 接口：定义道具运行时属性的基础字段。

### `@user/data-base/src/item/types.ts`（新建）

- [ ] 新增 `IItemSaveState<TAttr>` 接口：单个道具的存档格式。
- [ ] 新增 `IItemManagerSaveState<TAttr>` 接口：道具管理器的存档格式。
- [ ] 新增 `IReadonlyItem<TAttr>` 接口：只读道具接口。
- [ ] 新增 `IItem<TAttr>` 接口：可变道具接口，继承 `IReadonlyItem<TAttr>` 和 `ISaveableContent<IItemSaveState<TAttr>>`。
- [ ] 新增 `IItemEvent` 接口：事件配置占位接口。
- [ ] 新增 `IItemScriptFn` 类型别名：道具脚本函数签名。
- [ ] 新增 `IItemLegacyBridge<TAttr>` 接口：旧样板兼容桥接接口。
- [ ] 新增 `IItemManager<TAttr>` 接口：道具管理器接口，继承 `ISaveableContent<IItemManagerSaveState<TAttr>>`。

### `@user/data-base/src/item/enum.ts`（新建，如需要）

- [ ] 若 `IItemEvent.type` 需要枚举，在此定义事件类型枚举。

### `@user/data-base/src/item/index.ts`（新建）

- [ ] 新增 barrel 导出，汇总导出 `types.ts` 中的所有内容。

### `@user/data-base/src/index.ts`

- [ ] 新增 `export * from './item'` 导出。

### `@user/data-base/src/types.ts`

- [ ] 修改 `IStateBase` 接口：新增 `readonly itemManager: IItemManager<IItemAttr>` 成员。
