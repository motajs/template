# 需求综述

本次改动目标：

1. **自动化分区激活器**：将楼层按游戏进程划分为若干"区域"，
   到达新区域时自动激活对应楼层、失活旧区域楼层，
   从而替代目前繁琐的手动 `setActiveStatus` 调用。
2. **楼层尺寸上移至 `LayerState`**：同一楼层的所有图层尺寸应当
   保持一致，因此将尺寸的权威来源从 `MapLayer` 移至 `LayerState`。

---

# 实现思路

## 1. 有序地图 id 列表

当前 `IMapStore.maps` 是 `ReadonlySet<string>`，无序且随楼层创建
自动填充。区域功能需要以**下标**标识范围，因此需改为有序数组。

修改方案：

- `IMapStore.maps` 类型改为 `ReadonlyArray<string>`；
- 新增 `setMapList(maps: string[]): void`，由外部显式指定有序列表
  （一般在游戏初始化时调用一次）；
- 新增 `useManualOrder(sort: (arr: string[]) => string[]): void`，
  允许自定义地图列表排序函数。调用时将当前 `maps` 的 `slice` 拷贝
  传入 `sort`，再对输出做合法性校验：将新旧数组各转为 `Set`，
  校验 `size` 相等且新集合是旧集合的子集（利用 `Set.prototype.isSubsetOf`）；
  校验通过后用返回值替换内部的 `maps`。这样当地图是动态生成时，
  作者依然可以自定义顺序，而不必手动维护全量列表；
- `createLayerState` 不再维护 `maps`，`maps` 完全由 `setMapList` 管理；
- 若 `createLayerState` 传入的 id 不在 `maps` 中，仍可正常创建，
  不影响存档逻辑，但该楼层不参与任何区域判断。

## 2. 区域定义与管理

### 类型定义

```ts
/** 单段闭区间 [start, end]，start 和 end 均为 maps 下标 */
export interface IMapAreaInterval {
    readonly start: number;
    readonly end: number;
}

/** 一个区域由一个或多个独立区间组成 */
export type MapArea = IMapAreaInterval[];
```

### 接口

- `setArea(areas: Set<MapArea>): void`：一次性设置所有区域信息，
  覆盖原有区域定义；每个元素代表一个区域，区域可包含多个区间，
  使用 `Set<MapArea>` 表示无序区域集合；
- `activeArea(id: string): void`：手动激活指定楼层所在区域的所有楼层。
  系统遍历 `areaList`，找到包含该楼层 id 的区域后，对该区域内的所有
  楼层调用 `setMapActiveStatus(floor, true)`；
- `deactiveArea(id: string): void`：手动取消激活指定楼层所在区域的
  所有楼层，逻辑与 `activeArea` 对称；判断时遍历 `areaList`，
  此操作为低频调用，无需缓存；

## 3. 自动分区激活器

### 接口

- `useAutoActivitor(enable: boolean): void`：是否启用自动激活器。

### 触发接口

需要一个通知接口供玩家相关模块调用：

- `notifyEnterFloor(id: string): void`：玩家进入指定楼层时调用此接口，
  通知地图管理器进行自动激活判断。

### 逻辑

`notifyEnterFloor(id)` 的执行流程（每次进入楼层均调用，内部短路）：

1. 若自动激活器未启用，直接返回；
2. 若 `isMapActive(id)` 为 `true`，直接返回（楼层已激活，无需操作）；
3. 遍历 `areaList`，找出包含 `id` 的区域；
4. 若未找到，直接返回（该楼层不在任何区域内）；
5. 若 `lastFloorId !== null`，调用 `deactiveArea(lastFloorId)` 失活上一个区域；
6. 调用 `activeArea(id)` 激活新区域，更新 `lastFloorId = id`。

### 内部状态

`MapStore` 新增：

- `private areaList: Set<MapArea>`：所有区域定义；
- `private lastFloorId: string | null = null`：上一次触发 `notifyEnterFloor`
  的楼层 id，用于定位并失活上一个激活区域；
- `private autoActivitorEnabled: boolean = false`：自动激活器开关。

## 4. 楼层尺寸上移至 LayerState

### 动机

当前 `MapLayer.width` / `MapLayer.height` 存储在图层中，
但同一楼层的所有图层尺寸必须一致，权威来源应当是 `LayerState`。

### 接口变动

**`ILayerState` 新增**：

```ts
readonly width: number;
readonly height: number;
```

**`addLayer` 签名调整**：

目前 `addLayer(width: number, height: number): IMapLayer`，
移除 width/height 参数，改为 `addLayer(): IMapLayer`，
使用 `LayerState` 内部存储的尺寸创建图层。

楼层尺寸在 `createLayerState` 创建时指定，`createLayerState` 签名改为：

```ts
createLayerState(id: string, width: number, height: number): ILayerState;
```

运行时仍可通过 `resizeLayer` 修改楼层尺寸，该方法会同步对楼层内所有
图层执行 resize，保持尺寸一致。

**`resizeLayer` 签名调整**：

当前 `resizeLayer(layer, width, height, keepBlock?)` 只 resize 单个图层，
但既然尺寸是楼层级的，建议改为对该楼层的所有图层同步 resize：

```ts
resizeLayer(width: number, height: number, keepBlock?: boolean): void;
```

**`IMapLayer.resize` / `IMapLayer.resize2`**：

从 `IMapLayer` 接口中移除，保留为 `MapLayer` 的内部实现，
仅由 `LayerState.resizeLayer` 调用。

**`IMapLayer.width` / `IMapLayer.height`**：

保留在 `IMapLayer` 接口中，供外部通过图层对象直接获取尺寸。
其值始终与所属 `LayerState` 的 `width`/`height` 保持一致。

---

# 附加建议结论

1. **`IMapLayer.setMapRef` 可见性**：保留现有设计，偶尔有外部需求。
2. **`active` 状态管理**：不需要单独维护区域激活状态；
   `activeArea(id)` / `deactiveArea(id)` 是 `setMapActiveStatus` 的
   快捷方式，遍历区域楼层批量调用即可，无需额外的区域状态字段。
3. **`notifyEnterFloor` 返回值**：暂不添加，后续有需求再改进。

---

# 涉及文件

## 需要引用的文件

- `@user/data-base/src/map/types.ts`: 全部现有地图接口
- `@user/data-base/src/map/mapStore.ts`: `MapStore` 实现类
- `@user/data-base/src/map/layerState.ts`: `LayerState` 实现类
- `@user/data-base/src/map/mapLayer.ts`: `MapLayer` 实现类

## 需要修改的文件

### `@user/data-base/src/map/types.ts`

- [x] 新增 `IMapAreaInterval` 接口：区间定义，含 `start`、`end`
- [x] 新增 `MapArea` 类型别名：`IMapAreaInterval[]`，表示一个区域
- [x] 修改 `ILayerState`：
    - [x] 新增 `readonly width: number` 和 `readonly height: number`
    - [x] 修改 `addLayer` 签名，移除 `width`/`height` 参数（使用 `LayerState` 自身尺寸）
    - [x] 修改 `resizeLayer` 签名：移除 `layer` 参数，改为对整个楼层所有图层同步 resize
- [x] 修改 `IMapLayer`：
    - [x] 移除 `resize` / `resize2`（改为 `MapLayer` 内部方法）
- [x] 修改 `IMapStore`：
    - [x] 将 `readonly maps` 类型改为 `ReadonlyArray<string>`
    - [x] 修改 `createLayerState` 签名：新增 `width: number`、`height: number` 参数
    - [x] 新增 `setMapList(maps: string[]): void`
    - [x] 新增 `useManualOrder(sort: (arr: string[]) => string[]): void`
    - [x] 新增 `setArea(areas: Set<MapArea>): void`
    - [x] 新增 `activeArea(id: string): void`
    - [x] 新增 `deactiveArea(id: string): void`
    - [x] 新增 `useAutoActivitor(enable: boolean): void`
    - [x] 新增 `notifyEnterFloor(id: string): void`

### `@user/data-base/src/map/mapStore.ts`

- [x] 将 `maps: Set<string>` 改为 `maps: string[]`
- [x] 修改 `createLayerState`：添加 `width`/`height` 参数，不再维护 `maps`
- [x] 实现 `setMapList`
- [x] 实现 `useManualOrder`
- [x] 新增 `private areaList: Set<MapArea>`
- [x] 新增 `private lastFloorId: string | null`
- [x] 新增 `private autoActivitorEnabled: boolean`
- [x] 实现 `setArea`、`activeArea`、`deactiveArea`
- [x] 实现 `useAutoActivitor`
- [x] 实现 `notifyEnterFloor`

### `@user/data-base/src/map/layerState.ts`

- [x] 新增 `width: number` 和 `height: number` 成员（由构造参数初始化）
- [x] 修改 `addLayer`，移除 `width`/`height` 参数，使用 `this.width`/`this.height`
- [x] 修改 `resizeLayer`，移除 `layer` 参数，改为对所有图层同步 resize

### `@user/data-base/src/map/mapLayer.ts`

- [x] 将 `resize`/`resize2` 改为内部方法（从公共接口移除）

---
