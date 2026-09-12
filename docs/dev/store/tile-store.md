# 需求综述

当前关于地图触发器的设计卡在“图块定义本身尚未抽象出来”这一前置问题上。继续讨论 [docs/dev/map/tile-info.md](docs/dev/map/tile-info.md) 中的地图触发器存储方案，会立刻撞上一个更底层的问题：

1. 某个图块数字到底对应什么 id；
2. 某个图块默认携带什么触发器类型；
3. 某个图块属于哪一类图块；
4. 旧引擎中的 `blocksInfo` 应该如何转移到新接口。

因此，下一步更合适的顺序不是继续扩展地图侧接口，而是先补齐一个独立的 `ITileStore`。它属于 Layer 0，不参与存档，也不承载运行时动态状态，只负责提供“图块定义查询”这一底层能力。

这次设计的目标如下：

1. 将当前挂在全局状态上的 `idNumberMap` 与 `numberIdMap` 收拢到 `ITileStore` 内；
2. 为图块定义提供统一查询入口：`getData`、`getTrigger`、`getType`；
3. 提供统一写入口 `addTile`，用于初始化阶段录入图块定义；
4. 提供 `attachLegacyConverter` 与 `fromLegacy` 两个接口，用于从旧引擎迁移图块定义；
5. 明确这部分能力不属于存档系统，且应当放在 Layer 0。

---

# 接口设计与预期

## ITileRawData

`ITileRawData` 表示单个图块的最小原始定义。按照当前结论，需要包含四个字段：图块数字、图块 id、触发器类型、图块类型。

- `ITileRawData.num`：预期频率**中频**。图块数字是整个图块定义系统的主键，`addTile`、`getData` 与旧引擎导入都会依赖它，但日常脚本中通常不会反复直接读写，故为中频。
- `ITileRawData.id`：预期频率**中频**。图块 id 常用于脚本层、兼容层与素材层之间的衔接，出现频率不低，但通常通过 `idToNumber` 间接使用，故为中频。典型使用场景：旧接口或脚本给出 `yellowDoor` 这类字符串 id，希望先查到对应图块数字。
- `ITileRawData.trigger`：预期频率**中频**。当前触发器设计已经收敛到“数据层只存触发器类型数字”，因此这是图块定义中的核心字段之一，但大多数代码仍会优先通过 `getTrigger` 访问，故为中频。典型使用场景：地图初始化时根据图块默认定义，给某个格点填入默认触发器类型。
- `ITileRawData.type`：预期频率**中频**。图块类型会被 `getType` 高效访问，但在定义录入阶段仍应直接作为图块原始数据的一部分保存，避免再人为拆成第二套并行数据源。典型使用场景：地图或逻辑层拿到某个图块定义后，希望直接知道其属于地形、怪物、NPC 还是道具。

当前建议接口如下：

```ts
export interface ITileRawData {
    readonly num: number;
    readonly id: string;
    readonly trigger: number;
    readonly type: TileType;
}
```

之所以推荐使用 `num` 而不是 `number`，是因为当前仓库内地图与图块相关接口几乎都使用 `num` 表示图块数字，延续这一命名更自然。

## TileType

`getType` 需要返回一个图块类型枚举。按照当前需求，建议先定义以下八种：

1. `Unknown`
2. `None`
3. `Terrain`
4. `Animate`
5. `Item`
6. `Enemy`
7. `Npc`
8. `Tileset`

这里的目的不是完整复刻旧引擎的所有 `cls`，而是先给当前执行层与地图层提供足够稳定、足够粗粒度的类型划分。基于旧引擎的现有分类，当前建议映射关系如下：

1. `0` 号空白图块映射为 `None`
2. `terrains` 与 `autotile` 统一映射为 `Terrain`
3. `animates` 映射为 `Animate`
4. `items` 映射为 `Item`
5. `enemys` 与 `enemy48` 统一映射为 `Enemy`
6. `npcs` 与 `npc48` 统一映射为 `Npc`
7. `tileset` 映射为 `Tileset`
8. 其他尚未归类或不存在的图块映射为 `Unknown`

这样处理的原因是：当前数据端真正需要的是“足够稳定的逻辑分类”，而不是把渲染素材维度的细分 `cls` 原封不动搬进底层接口。

## ITileStore

`ITileStore` 是图块定义的统一查询与写入接口。由于它本身不会进入存档，也不承担运行时状态变化，因此整体频率分布会明显偏向“读取高于写入”。

- `ITileStore.getData(num)`：预期频率**中频**。这个接口会返回完整的 `ITileRawData`，适合调试、兼容层、编辑器与初始化阶段使用，但在真正的高频逻辑中，调用方通常只关心某个单独字段，因此为中频。典型使用场景：兼容层需要同时读取图块数字、id 与默认触发器。
- `ITileStore.getTrigger(num)`：预期频率**高频**。这是 `getData(num).trigger` 的快捷接口，后续地图初始化、事件绑定与触发器相关逻辑都会优先使用这一接口，故为高频。典型使用场景：根据某个图块数字读取其默认触发器类型，再决定是否写入地图触发器稀疏表。
- `ITileStore.getType(num)`：预期频率**高频**。图块类型分类会直接影响地图逻辑、兼容层判断、后续的地图对象设计，因此它和 `getTrigger` 一样属于高频读取接口。典型使用场景：逻辑层拿到某个图块数字后，需要快速判断它属于地形、道具、怪物还是 NPC。
- `ITileStore.addTile(data)`：预期频率**低频**。图块定义在正常运行期不会动态修改，`addTile` 主要用于初始化与旧数据导入阶段，故为低频。
- `ITileStore.idToNumber(id)`：预期频率**中频**。它是 `idNumberMap` 的方法化替代，兼容层、脚本层和部分初始化逻辑都需要从字符串 id 反查图块数字，故为中频。典型使用场景：旧接口 `setBlock('yellowDoor', x, y)` 需要先把 id 转成图块数字。
- `ITileStore.numberToId(num)`：预期频率**中频**。它是 `numberIdMap` 的方法化替代，主要用于调试、兼容层与少量需要回推图块 id 的场景，故为中频。典型使用场景：拿到地图上的图块数字后，希望恢复出旧引擎语义下的图块 id。
- `ITileStore.attachLegacyConverter(converter)`：预期频率**低频**。仅在初始化或切换兼容转换器时调用，负责把旧引擎图块定义的解释规则注入到 store 中，故为低频。
- `ITileStore.fromLegacy(num, legacy)`：预期频率**低频**。用于将单个旧样板图块定义转换并写入 store，整体使用方式应与 `IEnemyManager.fromLegacyEnemy` 类似，由外层自行遍历 legacy store 后逐个调用，故为低频。典型使用场景：初始化时遍历 `core.maps.blocksInfo`，对每一项执行 `tileStore.fromLegacy(num, block)`。

当前建议接口如下：

```ts
export interface ITileStore {
    getData(num: number): ITileRawData | null;
    getTrigger(num: number): number;
    getType(num: number): TileType;
    addTile(data: ITileRawData): void;
    idToNumber(id: string): number | null;
    numberToId(num: number): string | null;
    attachLegacyConverter<TLegacy>(
        converter: ITileLegacyConverter<TLegacy>
    ): void;
    fromLegacy<TLegacy>(num: number, legacy: TLegacy): ITileRawData;
}
```

返回值语义建议如下：

1. `getData(num)`：若图块不存在，返回 `null`
2. `getTrigger(num)`：若图块不存在或未配置触发器，返回 `-1`
3. `getType(num)`：若图块不存在或尚未归类，返回 `TileType.Unknown`
4. `idToNumber(id)` / `numberToId(num)`：不存在时返回 `null`

之所以让 `getTrigger` 和 `getType` 在缺失场景下返回稳定默认值，是因为这两者更偏“高频逻辑查询”，热路径上不适合层层判空。

## ITileLegacyConverter / attachLegacyConverter / fromLegacy

`ITileStore` 本身不应直接理解旧引擎里 `blocksInfo` 的全部细节，而应通过用户层提供的 legacy converter 完成转换。这样做的原因是：旧引擎中的默认触发器来源并不统一，既有显式 `trigger` 字段，也有通过 `cls` 或其他成员隐式决定的情况。

从 [public/project/maps.js](public/project/maps.js) 当前样板可以直接看到两类典型情况：

1. 部分图块显式写了 `trigger`，例如黄门的 `openDoor`、箱子的 `pushBox`、冰面或滑板的特殊触发；
2. 部分图块没有显式 `trigger`，但其行为仍然会根据 `cls` 或其他规则隐式确定，例如怪物图块。

因此更合适的设计是：

```ts
export interface ITileLegacyConverter<TLegacy> {
    fromLegacy(num: number, legacy: TLegacy): ITileRawData;
}
```

其中：

1. `attachLegacyConverter(converter)` 负责向 store 注入转换器；
2. `fromLegacy(num, legacy)` 负责调用当前转换器完成单个 legacy 图块定义的转换，并将结果写入 store；
3. 导入整个旧引擎 `blocksInfo` 时，由外层自行遍历并多次调用 `fromLegacy`。

当前更推荐的使用形式是：

```ts
tileStore.attachLegacyConverter(converter);

for (const [key, value] of Object.entries(core.maps.blocksInfo)) {
    tileStore.fromLegacy(Number(key), value);
}
```

其职责包括：

1. 用户层定义 legacy -> `ITileRawData` 的转换规则；
2. 显式处理“trigger 字段优先”与“按 cls 推导”并存的旧设计；
3. 保证 `ITileStore` 本体只负责存储与查询，不负责耦合旧样板细节。

---

# 实现思路

## 1. 先建立独立的 store 模块

因为 `ITileStore` 属于 Layer 0，且不依赖地图、怪物、勇士等更高层模块，所以更适合作为 `@user/data-base/src/store` 下的首个 Store 类接口存在。

当前不建议单独再开 `tile` 文件夹，而是直接放到 [packages-user/data-base/src/store](packages-user/data-base/src/store) 中。这样后续若还有其他内容迁移为新的 Store 类接口，也可以继续并列放在 `store` 目录下，而不是再拆出多个平行顶层目录。

## 2. 对外暴露方法，对内仍可继续使用双映射

`idNumberMap` 与 `numberIdMap` 迁移到 `ITileStore` 后，对外不再暴露原始 `Map`，而改成方法：

1. `idToNumber(id)`
2. `numberToId(num)`

但在内部实现上，仍然完全可以保留：

1. `Map<string, number>`
2. `Map<number, string>`
3. `Map<number, ITileRawData>`

也就是说，这次重构的重点是**收拢职责和稳定接口**，不是刻意放弃现有映射结构。

## 3. getType 直接从原始数据读取

按照当前结论，`ITileRawData` 包含：

1. `num`
2. `id`
3. `trigger`
4. `type`

这意味着 `getType(num)` 不需要再依赖额外并行映射，而可以直接读取 `getData(num)?.type`。这样做的好处是：

1. `addTile` 的输入结构完整且闭合；
2. 不会再出现“raw data 一套、type 映射又一套”的双数据源；
3. legacy converter 转换出的结果可以直接完整写入 store。

## 4. addTile 只负责录入定义，不负责存档

`addTile(data)` 的职责应当收敛到“向 store 录入一个图块定义”，而不是承担任何运行时逻辑。

因为这部分数据不会动态变更，也不参与存档，所以其主要使用时机只有：

1. 初次初始化
2. 旧引擎数据迁移
3. 极少量的测试或工具链注入

当前你已经给出了 number 冲突时“警告并覆盖”的语义，这一点应该直接保留。

此外，`id` 冲突但 `num` 不冲突时，也应当采用同样的警告并覆盖策略；并且警告内容需要明确指出冲突来源到底是 `num` 还是 `id`。

## 5. 全局状态从两张 Map 改为一个 store

当前 [packages-user/data-base/src/types.ts](packages-user/data-base/src/types.ts) 里的 `IStateBase` 仍直接暴露：

1. `idNumberMap`
2. `numberIdMap`

如果 `ITileStore` 建立起来，那么全局状态更合理的暴露方式应当改为：

```ts
readonly tileStore: ITileStore;
```

后续所有调用点统一改成：

1. `state.tileStore.idToNumber(id)`
2. `state.tileStore.numberToId(num)`
3. `state.tileStore.getTrigger(num)`
4. `state.tileStore.getType(num)`

这样图块定义相关职责就不会再散落在全局状态根节点上。

## 6. 旧引擎迁移的职责边界

当前 [packages-user/data-state/src/index.ts](packages-user/data-state/src/index.ts) 在初始化阶段直接遍历 `core.maps.blocksInfo`，并手动填充 `state.idNumberMap` / `state.numberIdMap`。

引入 `ITileStore` 后，这段初始化逻辑更适合拆成两段：

1. 先在用户层实现并挂载 legacy converter；
2. 再遍历 `core.maps.blocksInfo`，逐个调用 `tileStore.fromLegacy(num, block)`；
3. 其他真正依赖图块定义的初始化逻辑，例如朝向绑定，再从 `tileStore` 继续读取数据。

这样旧引擎兼容逻辑就不会和全局状态初始化逻辑搅在一起。

同时，因为旧样板里的触发器来源并不统一，这种“用户层 converter + store 只负责存储”的边界也更合理：

1. store 不需要知道 `trigger` 究竟来自字段、`cls`，还是更特殊的 legacy 规则；
2. 用户层可以按当前项目的具体兼容策略自由决定优先级；
3. 将来若 legacy 来源变化，只需要替换 converter，不必改 `ITileStore` 本体。

---

# 涉及文件

## 需要引用的文件

- [packages-user/data-base/src/types.ts](packages-user/data-base/src/types.ts)：当前 `IStateBase` 仍直接暴露 `idNumberMap` 与 `numberIdMap`
- [packages-user/data-state/src/index.ts](packages-user/data-state/src/index.ts)：当前旧引擎图块定义导入逻辑的主要入口
- [packages-user/data-state/src/core.ts](packages-user/data-state/src/core.ts)：当前 `CoreState` 中两张映射的实际持有位置
- [packages-user/client-modules/src/fallback/load.ts](packages-user/client-modules/src/fallback/load.ts)：当前旧引擎图块 `cls` 分类的实际使用点，可作为 `TileType` 映射参考
- [docs/dev/map/tile-info.md](docs/dev/map/tile-info.md)：后续地图触发器设计将直接依赖 `ITileStore`

## 需要修改的文件

### `@user/data-base/src/store/types.ts`

- [ ] 新增 `ITileRawData` 接口：定义图块最小原始定义，当前包含 `num`、`id`、`trigger`、`type`
- [ ] 新增 `TileType` 枚举：定义统一的图块逻辑分类
- [ ] 新增 `ITileLegacyConverter` 接口：定义 legacy 图块定义到 `ITileRawData` 的转换规则
- [ ] 新增 `ITileStore` 接口：提供图块定义的统一查询与写入入口
- [ ] 为 `ITileStore` 新增 `attachLegacyConverter` 与 `fromLegacy`

### `@user/data-base/src/store/tileStore.ts`

- [ ] 实现 `ITileStore`
- [ ] 内部维护 `num -> raw data`、`id -> num` 与 `num -> id` 的映射
- [ ] 实现 `addTile` 的警告覆盖逻辑，并区分 `num` 冲突与 `id` 冲突
- [ ] 实现 `attachLegacyConverter` 与 `fromLegacy`

### `@user/data-base/src/store/index.ts`

- [ ] 导出 tile 模块公共接口与实现

### `@user/data-base/src/types.ts`

- [ ] 从 `IStateBase` 中移除 `idNumberMap` 与 `numberIdMap`
- [ ] 新增 `readonly tileStore: ITileStore`

### `@user/data-base/src/index.ts`

- [ ] 补齐 tile 模块的公共导出

### `@user/data-state/src/core.ts`

- [ ] 移除 `CoreState` 对两张映射的直接持有
- [ ] 改为持有 `tileStore`

### `@user/data-state/src/index.ts`

- [ ] 将旧引擎 `blocksInfo` 的初始化逻辑迁移到“挂载 converter 后逐个调用 `fromLegacy`”
- [ ] 后续朝向绑定等逻辑改为通过 `tileStore.idToNumber` 读取图块数字

### `docs/dev/map/tile-info.md`

- [ ] 在 `ITileStore` 定稿后，再继续补齐地图触发器设计文档中对图块默认触发器来源的描述

---

# 当前结论

1. `TileType` 应当直接包含进 `ITileRawData`，不再单独拆成并行数据源。
2. legacy 导入不再使用顶层工厂函数，而改为 `attachLegacyConverter + fromLegacy` 组合；由用户层自行提供 converter，再逐个执行转换。
3. `addTile` 在 `num` 冲突与 `id` 冲突两种场景下都应警告并覆盖，且警告信息必须明确指出冲突来源。
4. `getTrigger(num)` 在图块不存在或无触发器时统一返回 `-1`。
5. 旧引擎里的默认触发器来源是混合式的：有时来自显式 `trigger` 字段，有时来自 `cls` 或其他规则；这一差异应当由用户层 converter 消化，而不是让 `ITileStore` 本体直接耦合旧样板细节。
