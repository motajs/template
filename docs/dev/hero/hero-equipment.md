# 需求综述

为勇士添加装备系统，实现装备的装上、卸下及属性加成。核心工作分为四层：实例存储层（`IHeroEquipsStore`，不可堆叠，以唯一 `uid` 管理每件装备）、装备状态层（`IEquipmentState`，纯数据，持有修饰器实例并负责存档读档）、属性加成层（通用 `ValueModifier` 与 `PercentageModifier`）、装备系统层（`IHeroEquipment`，操作装上/卸下，管理槽位）。

# 需求理解

## 明确需求

1. 独立 uid 管理。装备道具不沿用 `count` 合并计数，每件实例以自增 `uid` 唯一标识
2. 通用修饰器加成。属性加成通过 `ValueModifier` 和 `PercentageModifier` 实现，百分比 `priority` 高于数值
3. 修饰器存档隔离。装备修饰器不入勇士状态存档——需在 `addModifier` 中新增 `nosave` 参数
4. 排序与对比。提供 `IEquipmentSorter` 自定义排序和 `compareEquip` 属性对比
5. 槽位系统。槽位名称通过 `setSlots` 动态设置，装备声明可用槽位

## 隐含需求

1. 实例与定义分离。修饰器的值可独立于定义数据变化（强化通过 `setValue`），但修饰器的存在（有哪些属性）始终由定义决定
2. 装上/卸下必须可逆。卸下后勇士属性恢复到装上前的状态，修饰器的添加和移除必须对称
3. 重复装上处理策略。同一装备不能重复装上同一个槽，但已在其他槽的装备需通过 `autoUnload` 或直接拒绝来处理
4. 排序影响 UI 展示。装备实例的排序结果直接影响背包和装备栏的展示顺序，排序标准由游戏作者定义

# 设计前提

1. 装备不可堆叠。装备可能拥有不同的强化状态，同名装备的属性值可以不同，因此无法像消耗品一样合并计数——每件装备都是独立个体
2. 固定槽位序列。槽位是勇士身上若干个固定位置按顺序排列而成，每件装备只能安装到其声明兼容的槽位中
3. 修饰器是唯一加成载体。装备对勇士属性的影响完全通过修饰器实现，不存在修饰器之外的加成方式

# 核心概念定义

## 装备

装备是 `ItemCategory.Equipment` 类别的道具。与永久道具和消耗道具不同，装备不可堆叠——同名但强化状态不同的两件装备拥有不同的运行时数据，必须分立管理。每件装备的定义数据中包含可安装的槽位信息和属性加成定义（数值加成与百分比加成），实际属性影响由从定义派生的修饰器产生。

## 装备槽

装备槽是勇士身上若干固定位置的序列。每个槽位由一个字符串标识其名称（如"武器"、"头盔"），由游戏作者定义。每件装备在其定义中声明兼容的槽位列表，只有目标槽位名称在声明中时方可装上。槽位索引与槽位名称是两个维度：传入槽名时可能在多个同名槽中自动选择空槽；传入索引时精确定位。同一槽位同时最多容纳一件装备；若目标槽位已被占用，装上时自动卸载原装备。

## 装备装上行为

装备装上行为是指一件装备实例与勇士身上某个槽位之间建立的绑定关系。此关系使得装备的修饰器在该期间对勇士属性生效。此关系是临时的、可逆的——绑定可随时解除。

## 装备卸下行为

装备卸下行为是指解除装备实例与槽位之间绑定关系的操作。解除后装备实例本身不会消失，仅槽位恢复为空，装备的修饰器不再影响勇士属性。

## 装备修饰器

装备修饰器是装备对勇士属性产生影响的抽象单元。每件装备从定义数据派生出若干修饰器，每个修饰器持有一个值（加成的量）并拥有一种计算规则。修饰器分为两类：固定数值加成——直接在属性值上叠加；百分比加成——基于原始基础属性按比例计算。修饰器之间具有先后关系：百分比修饰器先于数值修饰器计算。修饰器的值与其所属装备实例绑定，可随强化等操作独立变化。

# 接口设计分析

## `IEquipmentState`

### 设计思路

由于装备修饰器的值会因强化而变化，独立于装备的定义数据，因此需要一个与装备实例一一对应的运行时状态对象，用于持有全部修饰器并在构造时从定义数据派生创建。修饰器本身不应直接序列化，而是保存其上游数据（即当前的 `value` 和 `percentage` 映射），读档时通过 `setValue` 恢复。这样设计也使得 `SaveCompression` 的差异化存储成为可能：`NoCompression` 完整存储，其他级别仅存与定义值不同的条目。

### 接口分析

- 成员 `uid: number`：预期频率**中频**。实例在存储层和装备系统中的唯一标识
- 成员 `item: IItemRawData<THero>`：预期频率**中频**。装备定义数据引用，获取名称、槽位等信息
- 成员 `modifiers: [SelectKey<THero, number>, IHeroModifier<number>][]`：预期频率**中频**。该装备的全部修饰器，装上/卸下时遍历

### 预期体量

合计约 80 行。

- 构造器预期 15 行：两组循环分别从 `IItemEquipData.value` 和 `IItemEquipData.percentage` 创建 `ValueModifier` 和 `PercentageModifier`，修饰器数量通常为个位数
- 存档逻辑预期 30 行：两个压缩分支，每个分支内遍历两种修饰器、比较值、写入 `Map`
- 读档逻辑预期 25 行：与存档对称，差异模式下还需处理键缺失时回退到定义数据的逻辑

## `IHeroEquipsStore`

### 设计思路

由于装备不可堆叠（设计前提 1），需要以 `uid` 为键的独立存储模型，因此设计 `IHeroEquipsStore` 以 `Map` 管理所有实例。作为 `IHeroItems.equipment` 成员暴露，替代原有基于 `count` 的装备分表。

由于游戏作者可能需要自定义装备在背包中的排序，因此提供 `useSorter` 注入 `IEquipmentSorter` 回调，由 `instances` 和 `instancesOf` 调用。

由于装备栏 UI 需要展示装备切换前后的属性变化，因此提供 `compareEquip`，它先卸载目标槽位当前装备的修饰器，再分别模拟装上两件候选装备，通过 `getFinalAttribute` 对比差值。

### 接口分析

- 方法 `add(item: number | string): number`：预期频率**高频**。创建装备实例分配 `uid`，返回新 `uid`
- 方法 `delete(uid: number): void`：预期频率**中频**。按 `uid` 移除实例
- 方法 `get(uid: number): IEquipmentState<THero> | null`：预期频率**高频**。获取实例状态，与是否当前装备无关
- 方法 `count(item: number | string): number`：预期频率**中频**。按装备类型统计实例数量
- 方法 `compareEquip(equipA: number, equipB: number, slot: number): Readonly<Partial<THero>>`：预期频率**中频**。模拟装上两件装备后对比属性差
- 方法 `useSorter(comparer: IEquipmentSorter<THero> | null): void`：预期频率**低频**。注入自定义排序器
- 方法 `instancesOf(equip: number | string): IEquipmentState<THero>[]`：预期频率**中频**。按类型过滤并排序
- 方法 `instances(): IEquipmentState<THero>[]`：预期频率**中频**。排序返回全部实例

### 预期体量

合计约 120 行。

- 增删查预期 20 行：`add` 中包含从类型标识解析图块数字、从物品存储获取定义数据、创建 `EquipmentState`，其余为纯 `Map` 操作
- 计数预期 8 行：遍历所有实例，按 `item.num` 比较并计数
- 排序预期 15 行：根据是否注册了排序器分两分支，有排序器时需构造 `IEquipmentSortHandler` 并调用回调
- 实例列表获取预期 20 行：`instances` 收集全部实例并排序，`instancesOf` 多一层类型过滤
- 属性对比预期 35 行：两次 `clone` 属性对象，先卸载目标槽位已有装备的修饰器，再分别遍历候选装备的 `modifiers` 调用 `addModifier`，收集受影响的键并通过 `getFinalAttribute` 比对差值
- 存档读档预期 20 行：遍历所有实例调用各自存档读档方法

## `IHeroEquipment`

### 设计思路

由于装上/卸下操作需要同时访问装备实例存储（获取 `IEquipmentState` 及修饰器）和勇士属性对象（执行修饰器的添加与移除），且槽位占用关系需要独立维护（`Map<槽索引, uid>`），因此需要一个持有两者引用的系统层组件。

由于 UI 需要在装上之前判断兼容性且不能产生副作用，因此提供 `canEquipTo` 做只读检查。装上过程涉及多层判断（槽位兼容、已装检查、替换处理），因此 `equip` 返回被替换的 `uid` 供调用方跟进。卸下时按槽索引精确定位并清理，返回卸下的 `uid`。

由于装备栏 UI 需要按槽位顺序渲染，因此 `getEquips` 按 `slots` 顺序输出实例数组，空槽填 `null`，通过数组下标直接对应槽位。

### 接口分析

- 成员 `slots: readonly string[]`：预期频率**低频**。当前槽位名称序列
- 方法 `setSlots(slots: string[]): void`：预期频率**低频**。运行时设置槽位名称
- 方法 `canEquipTo(uid: number, slot: number | string): EquipStatus`：预期频率**高频**。无副作用的兼容性检查
- 方法 `equip(uid: number, slot: number | string, autoUnload?: boolean): number | undefined`：预期频率**高频**。装上并自动处理冲突，返回被替换 `uid`
- 方法 `unequip(slot: number): number | undefined`：预期频率**中频**。按槽卸下，返回被卸下 `uid`
- 方法 `equipped(uid: number): boolean`：预期频率**高频**。按 `uid` 查询是否已在某槽
- 方法 `getEquips(): (IEquipmentState<THero> | null)[]`：预期频率**中频**。按槽位顺序输出，空槽为 `null`

### 预期体量

合计约 140 行。

- 兼容性检查预期 30 行：分 `typeof slot === 'number'` 和字符串两分支，数字分支直接查 `Map`，字符串分支需遍历 `slots` 查找匹配槽名并判断空槽
- 装上逻辑预期 50 行：同 `uid` 跨槽检查与 `autoUnload` 策略、数字/字符串两分支下的槽位查找与替换、卸载旧装备后再装新装备
- 卸下逻辑预期 15 行：按槽索引取值、遍历修饰器移除、清空槽位
- 装备列表获取预期 15 行：按 `slots` 数组长度遍历，对每个下标查 `Map` 获取 `uid` 再查存储获取实例
- 查询与存档读档预期 20 行：`equipped` 遍历 `Map.values()` 比对；存档写 `Map` 和 `slots`，读档清空后按存档顺序逐个 `equip`

## 通用修饰器

### 设计思路

由于装备的属性加成只有固定数值和基于基础属性的百分比两种形式，因此提供 `ValueModifier` 和 `PercentageModifier` 两个通用修饰器即可覆盖全部需求。二者均继承 `BaseHeroModifier<number, number>`，`type` 硬编码以便读档时通过工厂重建，`priority` 由构造器参数传入——装备创建时分别传 0 和 10 以确保百分比先于数值计算。

### 预期体量

合计约 40 行。

- 构造器与 `type` 存储预期 15 行：接收 `priority` 与 `value`，存储 `type` 为硬编码字符串
- `modify` 方法预期 6 行：分别实现加法（`value + this.value`）和百分比计算（`value + baseValue * this.value`）
- 无独立存档逻辑：修饰器值的变化由 `EquipmentState` 的 `value`/`percentage` 映射管理

---

# 实现思路

## 存档差异化存储

1. `saveState` 时判断 `SaveCompression`：`NoCompression` 直接存入完整的 `value` 和 `percentage` 映射
2. 其他级别将每个修饰器的当前值与 `this.item.equip` 中的原始定义值逐一比对，仅当不同时写入映射
3. `loadState` 反向处理：`NoCompression` 对所有修饰器 `setValue`；其他级别查询存档中的值，键缺失时回退到原始定义值

## `compareEquip` 属性模拟

1. 克隆当前属性，若目标槽位已有装备，先移除其修饰器
2. 将装备 A 的修饰器加到副本上，通过 `getFinalAttribute` 获取各属性值
3. 对另一副本重复步骤 1 和 2，换为装备 B
4. 收集两件装备 `modifiers` 覆盖到的所有属性键，计算差值

# 涉及文件

## `@user/data-base/hero/types.ts`

- [ ] 新增 `IEquipmentStateSave`：装备状态存档接口，按照本文描述完成设计
- [ ] 新增 `IHeroEquipsStoreSave`：实例仓库存档接口，按照本文描述完成设计
- [ ] 新增 `IHeroEquipmentSave`：装备系统存档接口，按照本文描述完成设计
- [ ] 新增 `IEquipmentState`：装备状态纯数据层接口，按照本文描述完成设计
- [ ] 新增 `IHeroEquipsStore`：装备实例存储接口，按照本文描述完成设计
- [ ] 新增 `IEquipmentSortHandler`：排序上下文接口，按照本文描述完成设计
- [ ] 新增 `IEquipmentSorter`：排序回调接口，按照本文描述完成设计
- [ ] 新增 `EquipStatus`：装备兼容判断结果枚举，按照本文描述完成设计
- [ ] 新增 `IHeroEquipment`：装备系统层接口，按照本文描述完成设计
- [ ] 修改 `IHeroItems`：新增装备存储成员以接入装备系统
- [ ] 修改 `IHeroAttribute.addModifier`：新增存档隔离参数
- [ ] 修改 `IHeroStateSave`：新增装备系统成员以接入存档流程
- [ ] 修改 `IHeroState`：新增装备系统成员以接入读档流程

## `@user/data-base/hero/equipment.ts`

- [ ] 编写 `EquipmentState` 类：按照本文描述实现装备状态层
- [ ] 编写 `HeroEquipsStore` 类：按照本文描述实现实例存储层
- [ ] 编写 `HeroEquipment` 类：按照本文描述实现装备系统层

## `@user/data-base/hero/modifier.ts`

- [ ] 编写 `ValueModifier` 类：按照本文描述实现数值修饰器
- [ ] 编写 `PercentageModifier` 类：按照本文描述实现百分比修饰器

## `@user/data-base/hero/attribute.ts`

- [ ] 修改 `HeroAttribute` 类：按照本文描述支持修饰器存档隔离

## `@user/data-base/hero/items.ts`

- [ ] 修改 `HeroItems` 类：按照本文描述传递勇士属性引用并接入装备存储

## `@user/data-base/hero/state.ts`

- [ ] 修改 `HeroState` 类：按照本文描述初始化装备系统并改写存档读档流程
