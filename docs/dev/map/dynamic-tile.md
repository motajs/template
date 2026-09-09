# 需求综述

当前地图系统仅支持静态图块（通过 `IMapLayer` / `Uint32Array` 存储），
无法支持可移动的动态图块（例如 NPC、推箱子、可交互物件等）。
动态图块的核心特点：

1. **允许重叠**——同一格点可同时存在多个动态图块；
2. **整数坐标**——始终处于格点整数坐标，不出现小数，便于渲染优化与交互；
3. **异步移动**——移动接口返回 `Promise`，配合渲染动画；
4. **朝向转向**——部分图块移动时需同步更新朝向（如四方向 NPC 行走图）。

---

# 实现思路

## 1. 动态图块标识方案

**采用引用标识**：`createDynamicTile` 与 `transferToDynamic` 均返回
`IDynamicTile` 对象引用，调用方持有该引用作为后续操作（移动、删除、
设置朝向等）的唯一凭证。无需维护任何 ID，无唯一性管理负担。

调用方可将返回的 `IDynamicTile` 引用存储在自己的数据结构中，
`tile.x`、`tile.y`、`tile.num`、`tile.direction` 等字段始终反映图块的
最新状态——内部实现类持有可变字段，接口以 `readonly` 暴露给外部，
保证外部不能直接修改，内部可通过类实例更新。

## 2. 坐标表示

使用独立的 `x: number, y: number` 参数，与现有 `IMapLayer` 接口风格
（如 `setBlock(block, x, y)`、`getBlock(x, y)`）保持一致，不引入 `ITileLocator`。

## 3. 方向表示

移动方向与转向方向统一使用 `FaceDirection` 枚举：

- 语义明确，与已有 `IRoleFaceBinder`（朝向绑定）直接对接；
- 已有工具函数 `getFaceMovement(dir)` 可将其转换为坐标偏移，无需重复实现；
- 多步路径（`moveDynamicWith` 的 `steps` 参数）使用 `FaceDirection[]`。

`IDirectionDescriptor` 更偏向纯数学计算（用于范围迭代等），
语义上不适合表达「图块朝向某方向移动」的含义。

**已确定**：移动方向（`moveDirection`）与朝向（`faceDirection`）分离为两个独立字段。
后退等相对移动必须依赖两者分离才能正确表达（例如面朝上、向下后退时，`faceDirection`
保持 `Up`，`moveDirection` 更新为 `Down`）。

移动系统另立文档独立设计，包含双方向模型、`IDynamicMover` 抽象、
计划式移动接口及执行流程等完整方案，见
[动态图块移动系统](./dynamic-tile-move.md)。

`moveDynamicStep` / `moveDynamicWith` 保留为命令式便捷接口，适用于单次简单移动；
复杂路径和计划式移动统一使用 `IDynamicMover`。

## 4. 动态图块数据模型与图层归属

动态图块按**所属静态图层**组织层级关系：每个 `IMapLayer` 持有一个
`IDynamicLayer`，动态图块的渲染深度即为其所属 `IMapLayer` 的 `zIndex`，
与静态图块一致。因此 `IDynamicLayer` 接口挂载在 `IMapLayer` 上，
而不是 `ILayerState` 上（见第 5 节）。

每个动态图块存储以下信息：

```ts
/** 可移动对象的最小公共接口，供 `IObjectMover` 泛型约束使用 */
interface IObjectMovable {
    readonly x: number;
    readonly y: number;
    readonly moveDirection: FaceDirection;
    readonly faceDirection: FaceDirection;
    setPos(x: number, y: number): void;
    setMoveDirection(dir: FaceDirection): void;
    setFaceDirection(dir: FaceDirection): void;
}

interface IDynamicTile extends IObjectMovable {
    readonly num: number; // 图块数字（决定渲染图像）
    readonly layer: IDynamicLayer; // 所属动态图层
    readonly mover: IDynamicMover; // 绑定的移动器（计划式移动）
    /** 删除此图块，转发至 layer.deleteDynamic */
    delete(): void;
    /** 还原为静态图块，转发至 layer.transferToStatic */
    toStatic(): void;
    /** 还原为静态图块，如果当前位置有东西则不转换，转发只 layer.transferToStaticIfSafe */
    toStaticIfSafe(): boolean;
    /**
     * 单步便捷移动接口，等价于 `mover.step(dir, count); return mover.start();`。
     * 适用于简单移动场景，复杂路径通过 `tile.mover` 访问。
     */
    step(dir: FaceDirection, count?: number): IMoverController | null;
}
```

`x`、`y`、`moveDirection`、`faceDirection` 及 `setPos`/`setMoveDirection`/`setFaceDirection`
均由 `IObjectMovable` 提供，`IDynamicTile` 不再重复声明。
`IObjectMover<T extends IObjectMovable>` 以此接口为泛型约束，
使图块和玩家 mover 共享核心执行逻辑；具体渲染效果通过 `IObjectMoverHooks` 的 `onStepStart`/`onStepEnd` 钩子实现。

`DynamicLayer` 内部维护两个结构：

- `tileSet: Set<IDynamicTile>` — 所有图块的集合，用于迭代与归属判断；
- `posMap: Map<number, Map<number, Set<IDynamicTile>>>` — 按坐标索引
  （外层 key = y，内层 key = x，value = 该格点所有图块对象集合），
  图块移动时同步更新，支持越界坐标（见第 4.1 节）。

调用方持有 `IDynamicTile` 对象引用即可完成所有操作，
`posMap` 仅供按坐标查询（`getDynamicTilesAt`）使用，
因使用频率低，嵌套 `Map` 的开销完全可以接受。

`IDynamicTile` 上的 `moveStep`/`moveWith`/`delete`/`setDirection`/`setPos`/`toStatic`
均为便捷转发方法，内部直接调用 `tile.layer` 对应接口，不修改任何内部状态。
调用方可直接通过 `tile.xxx()` 操作，无需额外持有 `IDynamicLayer` 引用。

### 4.1 越界移动

动态图块的坐标不受楼层 `width`/`height` 约束，允许出现负值或超出地图范围的坐标。
这满足了如「图块飞出屏幕」「过场动画」等临时越界需求。
`DynamicLayer` 无需感知楼层尺寸，`resizeLayer` 也无需通知 `DynamicLayer`。

## 5. IDynamicLayer 挂载在 IMapLayer 上

动态图块的存储结构与 `IMapLayer`（Uint32Array）本质不同，独立封装为 `IDynamicLayer`。
`IMapLayer` 新增 `readonly dynamicLayer: IDynamicLayer` 属性，
调用方通过具体的图层对象操作该层的动态图块，z 层级天然与静态图块一致。

`IDynamicLayer` 实现 `IHookable<IDynamicLayerHooks>` 以支持渲染端订阅变更事件。
`IRoleFaceBinder` 通过 `setFaceBinder(binder)` 方法注入（见第 8 节），
不在构造时传入，使多楼层共用同一个 `binder` 实例更灵活。

`transferToDynamic(x, y)` 不需要 `layer` 参数，
因为它隶属于某个具体的 `IDynamicLayer`，直接从同级 `IMapLayer` 读写图块即可，
并返回创建的 `IDynamicTile` 引用。

## 6. 移动函数的坐标来源

`moveDynamicStep(direction, tile)` 与 `moveDynamicWith(steps, tile)` 均不接受
`ox, oy` 参数，改为直接接受 `IDynamicTile` 引用。当前坐标直接读取 `tile.x`、
`tile.y`，无需调用方额外传入。

内部行为：

- 直接读取 `tile.x`、`tile.y` 作为出发点；
- **立即**将图块逻辑坐标更新为目标位置（单步 `(tile.x+dx, tile.y+dy)`）；
- 同步更新 `posMap`；
- 触发 `onMoveTile` 钩子，收集所有钩子返回的 `Promise<void> | void`；
- `await Promise.all(promises)`——
  等待所有渲染动画完成后，本步才算兑现，再进入下一步。

详细多步路径与计划式移动的执行流程见
[动态图块移动系统](./dynamic-tile-move.md)。

## 7. transferToDynamic 与 transferToStatic

`transferToDynamic(x, y)` 不需要额外的 `layer` 参数。
`DynamicLayer` 在构造时持有对所属 `MapLayer` 的引用，
直接调用 `mapLayer.getBlock(x, y)` 读取图块数字，再调用 `mapLayer.setBlock(0, x, y)` 清除，
最后创建对应的动态图块并返回其引用。
若该位置图块为 0（空白），则发出 logger 警告并仍然创建 `num = 0` 的动态图块。

新增 `transferToStaticIfSafe(tile)` 作为安全版本：仅当目标位置静态图块为 0（空白）时才执行还原，
否则不转换并返回 `false`；转换成功返回 `true`。适用于不确定目标格是否已有图块的场景。

新增 `transferToStatic(tile)` 作为逆操作：将动态图块还原为静态图块。
对于「只移动一次就固定」的图块（如推箱子放到指定位置后不再移动），
及时转回静态存储可以降低存档体积、简化渲染订阅。执行流程：

1. 读取 `tile.x`、`tile.y`、`tile.num`；
2. 若坐标不在所属 `MapLayer` 的合法范围内（即 `x < 0`、`y < 0`、
   `x >= width` 或 `y >= height`），发出 logger 警告并放弃操作；
3. 若 `mapLayer.getBlock(tile.x, tile.y) !== 0`，在开发环境下发出 logger 警告
   （目标格点已有静态图块内容，将被覆盖）；
   调用 `mapLayer.setBlock(tile.num, tile.x, tile.y)` 写回静态图块；
4. 从 `tileSet` 和 `posMap` 中移除该图块，触发 `onDeleteTile` 钩子。

## 8. 转向逻辑

`moveDynamicStep` / `moveDynamicWith` 在每一步移动时自动更新朝向（使用双方向模型，
详见 [动态图块移动系统](./dynamic-tile-move.md)）：

1. 更新 `tile.moveDirection` 为本步实际移动方向；
2. 通过外部注入的 `IRoleFaceBinder` 调用 `getFaceOf(tile.num, direction)` 查询
   该方向对应的图块数字；
3. 若图块无朝向绑定（返回 `null`），则不修改 `num`，仅更新 `faceDirection`；
4. 若有绑定，将 `tile.num` 与 `tile.faceDirection` 更新为查询结果。

`IRoleFaceBinder` 通过 `setFaceBinder(binder: IRoleFaceBinder): void` 方法注入，
不在构造时传入；初始状态视为无朝向绑定（`getFaceOf` 始终返回 `null`）。
若多个楼层共用同一个 `RoleFaceBinder` 实例，直接对各楼层各图层分别调用 `setFaceBinder` 即可。

对于八方向移动，转向查询逻辑扩展如下：

1. 更新 `tile.moveDirection` 为本步实际移动方向；
2. 调用 `getFaceOf(tile.num, direction)` 查询；
3. 若返回 `null` 且当前方向为斜向（八方向之一），
   调用 `degradeFace(direction)` 降级为四方向后再查询一次；
4. 若仍返回 `null`，不修改 `num`，仅更新 `faceDirection`；
5. 若查询到结果，将 `tile.num` 更新为结果图块数字，并更新 `faceDirection`。

手动设置朝向通过独立接口 `setDynamicDirection(tile, direction)` 完成，
逻辑与上述步骤 1–5 相同，但不触发移动。

## 9. IDynamicLayerHooks 与 ILayerStateHooks

`IDynamicLayerHooks` 定义三个钩子：

- `onCreateTile(tile: IDynamicTile)`：图块被创建（含转换）时触发；
- `onDeleteTile(tile: IDynamicTile)`：图块被删除时触发（传入删除前的快照）；
- `onMoveTile(tile: IDynamicTile, fromX: number, fromY: number): Promise<void> | void`：
  图块移动一步时触发，`tile` 为更新后的状态，`fromX`/`fromY` 为移动前坐标。
  返回 `Promise<void>` 时，移动器将等待其兑现后再进行下一步（配合 `Promise.all` 并行等待所有订阅方）。

`ILayerStateHooks` 新增对应的三个转发钩子，额外携带 `layer: IMapLayer` 参数，
与现有的 `onUpdateLayerArea`、`onResizeLayer` 等钩子风格一致：

- `onCreateDynamicTile(layer: IMapLayer, dynamicLayer: IDynamicLayer, tile: IDynamicTile)`
- `onDeleteDynamicTile(layer: IMapLayer, dynamicLayer: IDynamicLayer, tile: IDynamicTile)`
- `onMoveDynamicTile(layer: IMapLayer, dynamicLayer: IDynamicLayer, tile: IDynamicTile, fromX: number, fromY: number)`

`LayerState` 在为每个 `MapLayer` 注册 `StateMapLayerHook` 时，
同步订阅该层 `dynamicLayer` 的三个钩子，将事件加上 `layer`、`dynamicLayer` 参数后转发至楼层钩子。

---

# 涉及文件

> 移动相关的接口（`DynamicMoveDir`、`IDynamicMoveStep`、`IMoverController`、`IDynamicMover`）
> 设计详情见 [动态图块移动系统](./dynamic-tile-move.md)，
> 同样需要添加至 `types.ts`。

## 需要引用的文件

- `@motajs/common`：`IHookable`, `IHookBase`, `Hookable`, `logger`
- `@user/data-base/src/common`：`FaceDirection`, `IRoleFaceBinder`,
  `getFaceMovement`, `degradeFace`
- `@user/data-base/src/map/types.ts`：`IMapLayer`, `IMapLayerHooks`,
  `ILayerState`, `ILayerStateHooks`

## 需要修改的文件

### `@user/data-base/src/map/types.ts`

- [ ] 新增 `IObjectMovable` 接口：
      含 `x`、`y`、`moveDirection`、`faceDirection` 四个只读属性及
      `setPos`/`setMoveDirection`/`setFaceDirection` 三个方法；
      供 `IObjectMover<T extends IObjectMovable>` 泛型约束使用
- [ ] 新增 `IDynamicTile extends IObjectMovable` 接口：
      含 `num`、`layer`、`mover` 三个只读属性及 `delete`/`toStatic` 两个便捷方法；
      无 `id` 字段，坐标/方向成员由 `IObjectMovable` 提供
- [ ] 新增移动相关类型（详见移动文档接口定义汇总，已移至 `move/types.ts`）：
      `DynamicMoveStepType`、`DynamicMoveStep`、`IMoverController`、
      `IObjectMoverHooks`、`IObjectMover`、`IDynamicMover`
- [ ] 新增 `IDynamicLayerHooks extends IHookBase` 接口：
      含 `onCreateTile`、`onDeleteTile`、`onMoveTile` 三个钩子方法
- [ ] 新增 `IDynamicLayer extends IHookable<IDynamicLayerHooks>` 接口：
    - [ ] `createDynamicTile(num, x, y): IDynamicTile`: 在指定位置创建动态图块，
          返回图块引用
    - [ ] `transferToDynamic(x, y): IDynamicTile`: 从所属静态图层读取并清除
          指定位置图块，创建对应动态图块并返回引用
    - [ ] `transferToStatic(tile: IDynamicTile)`: 将动态图块还原为静态图块；
          坐标越界则警告并放弃，否则写回静态图层并触发 `onDeleteTile`
    - [ ] `transferToStaticIfSafe(tile: IDynamicTile): boolean`: 仅当目标位置静态图块为 0
          时才还原，否则不转换；返回是否转换成功
    - [ ] `deleteDynamicTile(tile: IDynamicTile)`: 删除指定图块，不在此层则警告
    - [ ] `getDynamicTilesAt(x, y)`: 获取指定格点所有动态图块的可迭代对象
    - [ ] `moveDynamicWith` / `moveDynamicStep` 已由 `IDynamicMover` 权其责。
          `IDynamicLayer` 不再提供此两个方法，删除对应条目。
    - [ ] `setDynamicDirection(tile: IDynamicTile, direction)`: 手动设置朝向，
          同步更新 `direction` 与 `num`（若有朝向绑定）
    - [ ] `setDynamicPos(tile: IDynamicTile, x: number, y: number)`: 直接设置图块位置，
          同步更新 `posMap`，触发 `onMoveTile` 钩子，不更新朝向
    - [ ] `setFaceBinder(binder: IRoleFaceBinder)`: 注入朝向绑定器
- [ ] 修改 `IMapLayer`：新增 `readonly dynamicLayer: IDynamicLayer`
- [ ] 修改 `ILayerStateHooks`：新增 `onCreateDynamicTile`、`onDeleteDynamicTile`、
      `onMoveDynamicTile` 三个转发钩子，额外携带 `layer: IMapLayer` 与
      `dynamicLayer: IDynamicLayer` 两个参数

### `@user/data-base/src/map/dynamicLayer.ts`（新文件）

- [ ] 实现 `DynamicLayer extends Hookable<IDynamicLayerHooks>` 类，
      实现 `IDynamicLayer`
- [ ] 实现内部类 `DynamicTile implements IDynamicTile`：
      持有 `layer: IDynamicLayer` 引用，`delete`/`toStatic` 转发至 `layer`；
      `step(dir, count?)` 封装为便捷方法
- [ ] `DynamicTile` 构造时同步创建 `readonly mover: DynamicMover`，
      移动调度由 `move/dynamicMover.ts` 中的 `DynamicMover` 类实现
- [ ] `private mapLayer: IMapLayer`：构造参数，所属静态图层引用，
      供 `transferToDynamic` / `transferToStatic` 读写使用
- [ ] `private faceBinder: IRoleFaceBinder | null = null`：朝向绑定器，
      通过 `setFaceBinder` 注入
- [ ] `private tileSet: Set<IDynamicTile>`：所有图块的集合，用于迭代与归属判断
- [ ] `private posMap: Map<number, Map<number, Set<IDynamicTile>>>`：
      按坐标索引（外层 key = y，内层 key = x），支持越界坐标
- [ ] 实现全部接口方法，移动时同步更新 `tileSet` 与 `posMap`

### `@user/data-base/src/map/mapLayer.ts`

- [ ] 新增 `readonly dynamicLayer: DynamicLayer`：构造时以 `this` 为参数创建

### `@user/data-base/src/map/layerState.ts`

- [ ] 修改 `StateMapLayerHook`（或 `addLayer` 中的订阅逻辑）：
      在为每个 `MapLayer` 注册钩子时，同时订阅其 `dynamicLayer` 的三个钩子，
      将事件加上 `layer`、`dynamicLayer` 参数后转发至楼层的 `ILayerStateHooks`

---

# 接口定义汇总

以下为本次新增与修改的完整接口签名，供实现时参考。

移动相关接口（`IObjectMoverHooks`、`IObjectMover`、`IDynamicMover`、`IMoverController`、`DynamicMoveStep` 等）
详见 [dynamic-tile-move.md](./dynamic-tile-move.md) 接口定义汇总，此处不再重复。

## 新增接口

### IObjectMovable

```ts
interface IObjectMovable {
    readonly x: number;
    readonly y: number;
    readonly moveDirection: FaceDirection;
    readonly faceDirection: FaceDirection;
    setPos(x: number, y: number): void;
    setMoveDirection(dir: FaceDirection): void;
    setFaceDirection(dir: FaceDirection): void;
}
```

### IDynamicTile

```ts
interface IDynamicTile extends IObjectMovable {
    readonly num: number;
    readonly layer: IDynamicLayer;
    readonly mover: IDynamicMover;
    delete(): void;
    toStatic(): void;
    toStaticIfSafe(): boolean;
    /** 等价于 mover.step(dir, count); return mover.start(); */
    step(dir: FaceDirection, count?: number): IMoverController | null;
}
```

### IDynamicLayerHooks

```ts
interface IDynamicLayerHooks extends IHookBase {
    onCreateTile(tile: IDynamicTile, layer: IDynamicLayer): void;
    onDeleteTile(tile: IDynamicTile, layer: IDynamicLayer): void;
}
```

### IDynamicLayer

```ts
interface IDynamicLayer extends IHookable<IDynamicLayerHooks> {
    createDynamic(num: number, x: number, y: number): IDynamicTile;
    transferToDynamic(x: number, y: number): IDynamicTile;
    transferToStatic(tile: IDynamicTile): void;
    transferToStaticIfSafe(tile: IDynamicTile): boolean;
    deleteDynamic(tile: IDynamicTile): void;
    getDynamicTilesAt(x: number, y: number): Iterable<IDynamicTile>;
    setDynamicDirection(tile: IDynamicTile, direction: FaceDirection): void;
    setDynamicPos(tile: IDynamicTile, x: number, y: number): void;
    setFaceBinder(binder: IRoleFaceBinder): void;
}
```

## 修改接口

### IMapLayer（新增属性）

```ts
interface IMapLayer {
    // ...现有成员...
    readonly dynamicLayer: IDynamicLayer;
}
```

---

# 问题

1. **`ox, oy` 是否为必要参数？** ✅ 已确定

    已确定移除。调用方持有 `IDynamicTile` 引用，坐标直接从 `tile.x`、`tile.y` 读取，
    `ox, oy` 为冗余参数，接口简化为 `moveDynamicStep(direction, tile)` 和
    `moveDynamicWith(steps, tile)`。

2. **`IRoleFaceBinder` 的注入方式** ✅ 已确定

    已确定使用 `setFaceBinder(binder)` 方法注入，不在构造时传入。
    实际修改 `faceBinder` 的场景极少，接口保持简单。

3. **动态图块的存档支持** ⏸ 暂缓

    动态图块状态（NPC 当前位置、推箱子位置等）属于游戏核心存档内容，
    长期来看必须纳入存档体系。但当前设计与旧引擎完全不同，
    存档格式需从头设计，建议在动态图块功能稳定后单独立项设计存档方案。
    **本次实现不涉及存档，`IDynamicLayer` 暂不实现 `ISaveableContent`。**

4. **`IDynamicLayer` 是否需要感知楼层尺寸** ✅ 已确定

    已确定不感知。标识方案改为引用，`posMap` 同步改为
    `Map<number, Map<number, Set<IDynamicTile>>>` 嵌套结构（外层 key = y，内层 key = x），
    彻底去掉字符串键，天然支持越界坐标，`resizeLayer` 无需通知 `DynamicLayer`。
    `getDynamicTilesAt` 接口保留，使用频率低，嵌套 Map 开销完全可接受。
