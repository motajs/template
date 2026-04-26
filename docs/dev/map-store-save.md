# 需求综述

当前 `LayerState` 只存储当前激活地图的数据，切换地图时原地图内容彻底丢失，
无法参与存档系统。为此引入 `IMapStore`，集中管理所有楼层的 `LayerState`，
并实现 `ISaveableContent` 接口以支持存档读档。

核心目标：

- 多楼层数据同时存在于内存中，通过 id 访问；
- 通过 `active` 标记区分"玩家可能到达"与"无需关注"的楼层，节省存档开销；
- 通过 `compareWith` 提供参考基准，配合分级压缩大幅减少存档体积；
- `IStateBase.layer` 类型由 `ILayerState` 改为 `IMapStore`，
  操作楼层必须先通过 `getLayerState(id)` 取得具体楼层。

---

# 实现思路

## 1. 给 LayerState 添加 active 成员

`ILayerState` 新增 `readonly active: boolean` 和 `setActiveStatus(active: boolean): void`
两个接口，`LayerState` 实现类中 `active` 默认为 `false`。

两者的关系：

- `ILayerState.setActiveStatus`：直接操作楼层对象；
- `IMapStore.setMapActiveStatus(id, active)`：通过 id 操作，
  内部查找对应楼层后调用其 `setActiveStatus`。

## 2. 脏数据追踪（dirty tracking）

为支持 `LowCompression` 和 `HighCompression` 的差分存档，
需要知道哪些楼层相对于参考基准是否发生了修改。

**推荐方案：楼层级简单脏标记 + 存档时实际比较**

在 `LayerState` 内部维护 `private dirty: boolean = false`：

- 当楼层内任意 `MapLayer` 触发 `onUpdateBlock`、`onUpdateArea`、`onResize`
  钩子时，将 `dirty` 置为 `true`；
- `dirty` 只在 `compareWith` 首次调用时根据实际数据对比结果初始化，
  初始化后的 gameplay 过程中不再重置（仅置 true）。

在 `saveState` 时：

- 若 `dirty = false`，跳过该楼层（初始化后从未被触碰过）；
- 若 `dirty = true`：
    - **LowCompression**：与参考基准进行全量比较，若完全一致则跳过
      （消除"改了又改回"场景下的误判），否则存储所有行；
    - **HighCompression**：逐行与参考基准比较，只存储不一致的行。

在 `loadState` 时：若存档中此楼层没有任何数据（即未出现在 `floors` 中），
读档后将 `dirty` 置为 `false`（视为与参考基准一致）。

**不在 `MapLayer` 内维护 `dirtyRows`**，行级比较在 `saveState` 时直接对照参考基准进行。
这避免了每次 `setBlock`/`putMapData` 都更新行级标记的热路径开销，
且存档时实际比较已能消除误判，无需 `probablyDirty` + `setInterval` 或哈希方案。

存档时比较的开销：Uint32Array 内存连续，实际耗时极低，且保存操作本身是低频的，
若将来发现存档耗时问题，可考虑将比较逻辑移至 Web Worker。

## 3. compareWith 接口与参数类型

```ts
compareWith(ref: Map<string, Map<number, Uint32Array>>): void;
```

外层 `Map` 以楼层 id 为键，内层 `Map` 以图层 `zIndex` 为键，
值为对应图层的完整图块数组（Uint32Array，含所有行的扁平数据）。

使用此类型而非 `IMapStore` 的理由：接口更轻量，调用方可直接从游戏原始数据构建，
无需额外持有一个完整的 `IMapStore` 实例。

关于图层标识符：继续使用 `zIndex`，在单个楼层内 `zIndex` 是语义唯一的，
与已有 `MapLayer.zIndex` 接口保持一致。

**`compareWith` 以首次调用为唯一基准**，再次调用不更新参考（以游戏原始数据为基准，
避免存档之间产生依赖关系）。

实现步骤：

1. 若 `refData` 已存在，直接返回；
2. 保存 `ref` 引用到 `private refData`；
3. 遍历当前所有楼层，对每个楼层在 `ref` 中查找对应 id：
    - 不存在：`dirty = true`（新楼层，视为全脏）；
    - 存在：对每个 `MapLayer`（按 `zIndex` 匹配）做全量比较，
      若所有行与参考数据完全一致则 `dirty = false`，否则 `dirty = true`。

## 4. 楼层的创建与管理

`MapStore` 内部以 `Map<string, LayerState>` 存储所有楼层。
`getLayerState(id)` 对不存在的 id 直接返回 `null`，不自动创建。

只提供一个创建接口：

- `createLayerState(id: string): ILayerState`：创建并注册一个空白楼层
  （无任何 `MapLayer`，用户拿到后再调用 `addLayer` 配置图层结构），返回楼层对象。

注册时若 id 已存在，发出 logger 警告并覆盖。

若 `compareWith` 已调用后再通过上述接口新增楼层，新楼层直接视为全脏（`dirty = true`），
因为 `refData` 中不存在对应数据。

## 5. 存档数据格式

### 类型定义

```ts
/** 单个 MapLayer 的存档数据 */
interface IMapLayerSave {
    readonly width: number;
    readonly height: number;
    /**
     * key = 行索引，value = 该行完整的 Uint32Array 数据；
     * NoCompression/LowCompression 时包含所有行（0 到 height - 1）；
     * HighCompression 时只包含与参考基准不同的行；
     * 读档时，不在此 Map 中的行从参考基准还原。
     */
    readonly rows: ReadonlyMap<number, Uint32Array>;
}

/** 单个楼层的存档数据 */
interface ILayerStateSave {
    readonly background: number;
    /**
     * key = zIndex，value = 对应图层存档数据；
     * 使用 Map 格式以支持图层的动态增删。
     */
    readonly layers: ReadonlyMap<number, IMapLayerSave>;
}

/** 整个 MapStore 的存档数据 */
interface IMapStoreSave {
    /**
     * key = 楼层 id，只包含 active 的楼层；
     * inactive 的楼层不写入，读档时无需处理。
     */
    readonly floors: ReadonlyMap<string, ILayerStateSave>;
}
```

### 各压缩等级存储策略

| 压缩级别          | 楼层粒度                                                        | 行粒度                   |
| ----------------- | --------------------------------------------------------------- | ------------------------ |
| `NoCompression`   | 存储所有 active 楼层                                            | 存储该楼层所有行         |
| `LowCompression`  | 跳过 `dirty = false` 的楼层；dirty 楼层全量比较后仍一致的也跳过 | 存储该楼层所有行         |
| `HighCompression` | 同 LowCompression                                               | 只存储与参考基准不同的行 |

### 读档策略

读档时直接操作数组引用（通过 `setMapRef`），避免逐行拷贝的额外开销：

1. 若参考基准（`refData`）未设置，抛出 logger 错误，**不进行任何读档操作**；
2. 遍历 `state.floors`，对每个楼层 id：
    - 若当前 `MapStore` 中不存在该 id，发出 logger 警告并跳过；
    - 对该楼层每个图层，先从参考基准取出对应 `zIndex` 的数组，
      将其深拷贝为新数组作为底层（确保未存档行使用参考基准值）；
    - 再将 `ILayerStateSave.layers` 中对应图层的 `rows` 数据写入该数组的对应行；
    - 调用 `MapLayer.setMapRef(array)` 直接替换内部引用，无需额外拷贝；
3. 对未出现在 `state.floors` 中的 active 楼层，
   从参考基准深拷贝完整数组后调用 `setMapRef` 还原，并将 `dirty` 置为 `false`。

## 6. saveState / loadState 实现

根据压缩等级分别编写三个存档函数和三个读档函数，
`saveState(compression)` 和 `loadState(state, compression)` 根据 `compression` 分发，
无需在每个楼层的遍历循环内部判断等级：

- `private saveNoCompression(): IMapStoreSave`
- `private saveLowCompression(): IMapStoreSave`
- `private saveHighCompression(): IMapStoreSave`
- `private loadNoCompression(state: IMapStoreSave): void`
- `private loadLowCompression(state: IMapStoreSave): void`
- `private loadHighCompression(state: IMapStoreSave): void`

`saveState` 结果需通过 `structuredClone` 深拷贝后返回。

## 7. IMapStore 接口设计（新增到 `map/types.ts`）

```ts
interface IMapStore extends ISaveableContent<IMapStoreSave> {
    /** 所有楼层的 id 集合 */
    readonly maps: ReadonlySet<string>;

    // --- 楼层访问 ---
    /** 获取指定 id 的楼层状态，不存在则返回 null */
    getLayerState(id: string): ILayerState | null;
    /** 获取指定 id 的楼层状态，要求楼层必须是 active 的，否则返回 null */
    getActiveMap(id: string): ILayerState | null;

    // --- 楼层管理 ---
    /** 创建并注册一个空白楼层，返回楼层状态对象 */
    createLayerState(id: string): ILayerState;

    // --- active 管理 ---
    /** 获取指定 id 的楼层是否激活，不存在的 id 返回 false */
    isMapActive(id: string): boolean;
    /** 设置指定 id 楼层的激活状态 */
    setMapActiveStatus(id: string, active: boolean): void;
    /** 迭代所有 active 的楼层，yield [id, ILayerState] */
    iterateActiveMaps(): Iterable<[string, ILayerState]>;
    /** 迭代所有 inactive 的楼层，yield [id, ILayerState] */
    iterateInactiveMaps(): Iterable<[string, ILayerState]>;
    /** 迭代所有楼层，yield [id, ILayerState] */
    iterateAllMaps(): Iterable<[string, ILayerState]>;

    // --- 差分压缩基准 ---
    /**
     * 设置压缩参考基准，以首次调用为唯一基准，再次调用不更新。
     * @param ref 外层 key = 楼层 id，内层 key = zIndex，value = 图层完整图块数据
     */
    compareWith(ref: Map<string, Map<number, Uint32Array>>): void;
}
```

## 8. ILayerState 接口修改

在现有 `ILayerState` 上新增：

```ts
/** 此楼层是否处于激活状态 */
readonly active: boolean;
/** 设置楼层激活状态 */
setActiveStatus(active: boolean): void;
```

## 9. IStateBase 修改

将 `IStateBase.layer: ILayerState` 改为 `IStateBase.layer: IMapStore`。

---

# 涉及文件

## 需要引用的文件

- `@user/common/types.ts`: `ISaveableContent`, `SaveCompression`
- `@user/data-base/map/types.ts`: 全部现有地图接口（`IMapLayer`, `ILayerState`, 等）

## 需要修改的文件

### `@user/data-base/src/map/types.ts`

- [ ] 新增 `IMapLayerSave` 接口：单个 MapLayer 存档数据格式
- [ ] 新增 `ILayerStateSave` 接口：单个楼层存档数据格式
- [ ] 新增 `IMapStoreSave` 接口：MapStore 整体存档数据格式
- [ ] 修改 `ILayerState`：新增 `readonly active: boolean` 和
      `setActiveStatus(active: boolean): void`
- [ ] 修改 `IMapLayer`：新增 `setMapRef(array: Uint32Array): void`
- [ ] 新增 `IMapStore` 接口：继承 `ISaveableContent<IMapStoreSave>`，
      含全部接口（见第 7 节）

### `@user/data-base/src/map/mapLayer.ts`

### `@user/data-base/src/map/layerState.ts`

- [ ] 新增 `active: boolean = false` 成员：楼层激活状态
- [ ] 实现 `setActiveStatus(active: boolean): void`
- [ ] 新增 `private dirty: boolean = false` 成员：楼层级脏标记
- [ ] 修改 `StateMapLayerHook.onUpdateArea`、`onUpdateBlock`、`onResize`：
      在转发钩子的同时，将 `state.dirty` 置 `true`
- [ ] 新增 `isDirty(): boolean` 方法：返回 `this.dirty`，供 `MapStore` 读取
- [ ] 新增 `setDirty(dirty: boolean): void` 方法：
      供 `MapStore.compareWith` 时根据实际比较结果设置

### `@user/data-base/src/map/mapLayer.ts`

- [ ] 新增 `setMapRef(array: Uint32Array): void` 方法：
      直接替换内部图块数组引用，跳过拷贝，供 `MapStore` 读档时使用。
      需确保传入数组长度与 `width × height` 匹配，
      并触发必要的钩子通知（不触发 `onResize`，应触发 `onUpdateArea` 通知全区域更新）。
      在方法注释中明确标注：调用后不得再持有或修改传入的数组。

### `@user/data-base/src/map/mapStore.ts`（新文件）

- [ ] 实现 `MapStore` 类，实现 `IMapStore`
- [ ] `private mapData: Map<string, LayerState>`：楼层 id 到状态对象的映射
- [ ] `readonly maps: ReadonlySet<string>`：所有楼层 id 的只读集合视图
- [ ] `private refData: Map<string, Map<number, Uint32Array>> | null`：参考基准
- [ ] 实现 `getLayerState`、`getActiveMap`、`createLayerState`
- [ ] 实现 `isMapActive`、`setMapActiveStatus`、`iterateActiveMaps`、`iterateInactiveMaps`、`iterateAllMaps`
- [ ] 实现 `compareWith`
- [ ] 实现 `saveNoCompression`、`saveLowCompression`、`saveHighCompression`
- [ ] 实现 `loadNoCompression`、`loadLowCompression`、`loadHighCompression`
- [ ] 实现 `saveState(compression)` 和 `loadState(state, compression)` 分发

### `@user/data-base/src/map/index.ts`

- [ ] 补充导出 `mapStore.ts`

### `@user/data-base/src/types.ts`

- [ ] 将 `IStateBase.layer` 类型由 `ILayerState` 改为 `IMapStore`
