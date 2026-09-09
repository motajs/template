# 需求综述

重新考虑之后，这一层需求更适合收敛成“图块数据”和“触发器数据”两套独立结构，而不是先抽象一层通用 `ITileInfo` 对象。

原因如下：

1. `IMapLayer` 内部的 `Uint32Array` 主要服务于高频查询与渲染，本身就应该尽量纯粹；
2. 大多数格点只是墙壁、地板、空气，不含任何触发器，没有必要给每个格点额外挂一个信息对象；
3. 当前触发器系统在数据层真正需要的并不是 `ITrigger` 对象，而只是“该载体对应哪一种触发器类型”；
4. 动态图块是实例对象，天然适合作为触发器的运行时载体，触发器跟随动态图块移动也更自然；
5. 存档是否需要记录触发器，取决于“触发器是跟随地图状态定义，还是跟随图块定义”，这应当单独讨论，而不是先把对象模型写死。

因此，本文不再优先设计 `IWrappedTileInfo`、`ITileInfo`、`createTileInfo`、`bindTileInfo` 这一套通用信息接口，而改为先构建一套**以 `ITileStore` 默认值为主、地图稀疏覆盖为辅的触发器方案**：

1. `ILayerState` 持有 `ITileStore` 引用，静态格点未主动设置时使用图块默认触发器类型；
2. `IMapLayer` 仅按坐标稀疏存储“手动覆盖值”，并提供 `revertTrigger` 恢复默认触发器；
3. 动态图块实例直接持有自己的触发器类型数字；
4. `ITrigger` 对象仍只存在于 Layer 2，在收集阶段按需实例化；
5. `setBlock` 与触发器解绑，不再通过 `keepInfo` 一类参数耦合两者。

---

# 接口设计与预期

## ILayerState.tileStore

- `ILayerState.tileStore`：当前图层状态持有的图块定义 store 引用。
- 预期频率：**低频到中频**。外部直接访问它的频率不会太高，但 `IMapLayer.getTriggerType` 等底层逻辑会稳定依赖它作为默认触发器来源。
- 典型使用场景：静态格点没有手动设置触发器时，`IMapLayer` 先读取当前图块数字，再通过 `layerState.tileStore.getTrigger(num)` 获取默认触发器类型。

## IMapLayer.getTriggerType

- `IMapLayer.getTriggerType(x, y)`：按坐标读取当前静态格点的“有效触发器类型”。若该点存在手动覆盖则返回覆盖值，否则回退到当前图块在 `ITileStore` 中的默认触发器类型。
- 预期频率：**高频**。触发器收集时每次都需要先确认目标静态格点最终会暴露出哪一种触发器。
- 典型使用场景：`ITriggerCollector.collect(x, y, layer)` 读取 `layer` 在 `(x, y)` 上的静态触发器类型。
- 返回值建议：与 `ITileStore` 保持一致，越界或不存在触发器时统一返回 `-1`。

## IMapLayer.setTriggerType

- `IMapLayer.setTriggerType(type, x, y)`：为指定静态格点写入手动覆盖的触发器类型数字。
- 预期频率：**中频**。主要出现在地图初始化、编辑器写回、运行时脚本修改事件配置等场景。
- 典型使用场景：给某一格配置战斗触发器；或显式将某个原本有默认触发器的图块覆盖为“无触发器”。
- 语义建议：`setTriggerType` 只负责写覆盖值，不负责恢复默认值。若 `type = -1`，表示显式覆盖为“无触发器”；若要恢复为图块默认触发器，应调用 `revertTrigger`。

## IMapLayer.revertTrigger

- `IMapLayer.revertTrigger(x, y)`：删除指定静态格点的手动触发器覆盖，使其重新回退到 `ITileStore` 的默认触发器类型。
- 预期频率：**低频到中频**。主要出现在编辑器撤销覆盖、脚本恢复默认配置、动静态图块转换回写时。
- 典型使用场景：某格点曾被脚本临时设置为其他触发器，演出结束后恢复为该图块原本的默认触发器。

## IDynamicTile.triggerType

- `IDynamicTile.triggerType`：当前动态图块携带的触发器类型数字，`-1` 表示无触发器。
- 预期频率：**中频**。收集器在读取某格所有动态图块时需要访问；运行时若有脚本操作某个动态图块事件，也可能直接读写。
- 典型使用场景：某个 NPC 作为动态图块移动时，其战斗或对话触发器跟随该实例一起移动。

## IDynamicTile.setTriggerType

- `IDynamicTile.setTriggerType(type)`：修改当前动态图块绑定的触发器类型。
- 预期频率：**低频到中频**。通常只在创建动态图块、转换动静态图块、特殊脚本重配置时使用。
- 典型使用场景：演出过程中把一个原本只是装饰的动态图块改成可交互单位。

## IDynamicLayer.transferToDynamic

- `IDynamicLayer.transferToDynamic(x, y, keepTrigger?)`：把静态图块转换为动态图块，并按参数决定是否保留原先的触发器。
- 预期频率：**中频**。每次把地图中的静态物件实例化为可移动对象时都会用到。
- 典型使用场景：把地图上的 NPC 图块转成 `IDynamicTile`，并让对话或战斗触发器跟着它一起移动。
- 语义建议：`keepTrigger` 默认值先定为 `true`。当 `keepTrigger = true` 时，将静态格点当前的有效触发器类型迁移到新建的动态图块；当 `keepTrigger = false` 时，新动态图块不保留原触发器，并且静态格点上的手动覆盖应一并清除。

## IDynamicLayer.transferToStatic

- `IDynamicLayer.transferToStatic(tile, keepTrigger?)`：把动态图块还原为静态图块，并按参数决定是否把动态图块携带的触发器写回静态格点。
- 预期频率：**中频**。会移动的图块在结束移动后重新落回地图时使用。
- 典型使用场景：可推动箱子停止后重新固化为静态图块，同时决定是否保留它携带的触发器。
- 语义建议：`keepTrigger` 默认值先定为 `true`。当 `keepTrigger = true` 时，将 `tile.triggerType` 写回目标静态格点；若写回值与该图块默认触发器一致，则应直接 `revertTrigger`，只在不一致时存入覆盖值。当 `keepTrigger = false` 时，不写回动态图块携带的触发器，静态格点自然回退到图块默认触发器。

## IDynamicLayer.transferToStaticIfSafe

- `IDynamicLayer.transferToStaticIfSafe(tile, keepTrigger?)`：在满足安全回写条件时将动态图块还原为静态图块，并保持与 `transferToStatic` 一致的触发器迁移语义。
- 预期频率：**中频**。用于需要先判断目标格点是否允许回写的动静态转换场景。
- 典型使用场景：某个可移动物体尝试停回地图时，若目标格点安全则回写图块和触发器，否则保留动态状态。
- 语义建议：为保持三组转换接口的对称性，`keepTrigger` 也应加入该接口，且默认值同样先定为 `true`。

## ITriggerCollector.collect

- `ITriggerCollector.collect(x, y, layer)`：当前不再从 `getTileInfo` 中读取对象信息，而是分别读取静态格点与动态图块上的触发器类型数字，再按需实例化 `ITrigger`。
- 预期频率：**中频**。玩家移动、交互判定、脚本触发等场景都会使用。
- 典型使用场景：
    1. 读取 `layer.getTriggerType(x, y)`；
    2. 迭代 `layer.dynamicLayer.getDynamicTilesAt(x, y)`，读取每个 `tile.triggerType`；
    3. 将所有非 `-1` 的触发器类型交给 `ITriggerRegistry` 创建运行时 `ITrigger` 对象；
    4. 排序后组成 `ITriggerCollection`。

这里需要注意：**数据层不再存 `ITrigger` 对象，只存触发器类型数字；对象实例化延后到收集阶段完成。** 这样既保留了 Layer 2 的运行时灵活性，又降低了 Layer 1 的存储复杂度。

## 当前不再优先设计的接口

以下内容在这轮设计中不再作为主方案：

1. `ITileInfo` / `IWrappedTileInfo` 一类通用格点信息对象；
2. `createTileInfo()` / `bindTileInfo()` 一类对象工厂接口；
3. `setBlock(block, x, y, keepInfo?)` 这类把图块写入与触发器保留策略绑在一起的接口。

这并不表示将来永远不会有通用格点附加信息，只是当前真实需求已经收敛到“触发器类型数字”，继续上抽象只会把接口设计得更重。

---

# 实现思路

## 1. 图块数组与触发器数据彻底分离

`IMapLayer` 内部继续保留 `Uint32Array` 作为图块数字的权威存储，仅服务于：

1. 高频 `getBlock` 查询；
2. 区域拷贝与渲染；
3. 与现有 `openDoor`、`closeDoor`、`putMapData`、`setMapRef` 等图块相关操作配合。

触发器数据则不再混入图块数组逻辑中，而是作为独立结构维护。

## 2. 静态图层使用“默认值 + 稀疏覆盖”

静态图层不应自行持有整份默认触发器表，而应通过 `ILayerState.tileStore` 获取默认值，只在地图侧额外存储“手动覆盖值”。

当前建议结构如下：

```ts
Map<number, number>;
```

- key = `y * width + x` 形式的格点下标；
- value = 手动覆盖的触发器类型数字。

`IMapLayer.getTriggerType(x, y)` 的读取顺序建议为：

1. 若坐标越界，返回 `-1`；
2. 若该点存在手动覆盖，直接返回覆盖值；
3. 否则读取当前图块数字，并通过 `tileStore.getTrigger(num)` 返回默认触发器类型。

这样可以自然满足“仅存必要”的目标：

1. 没有手动修改过触发器的格点不占额外存储；
2. 大多数格点直接复用 `ITileStore` 中的默认定义，不需要在地图层重复抄一份；
3. 只有真正偏离默认值的点，才进入地图侧稀疏映射；
4. `revertTrigger` 只需删除覆盖记录即可恢复默认。

## 3. 动态图块直接携带触发器类型

动态图块已经是实例对象，因此不需要再为它额外建一层稀疏映射。更自然的方案是：

1. `DynamicTile` 内部直接保存 `triggerType: number`；
2. 图块移动时，触发器天然跟随这个实例走；
3. 收集器按坐标枚举动态图块后，直接读取其 `triggerType`。

这样“触发器跟着动态图块走”就不再需要额外维护坐标索引迁移，只要图块对象本身移动即可。

## 4. 动静态转换只负责迁移或丢弃触发器

因为静态格点与动态图块现在是两个不同的触发器载体，所以 `transferToDynamic` / `transferToStatic` / `transferToStaticIfSafe` 的核心职责也更清晰了：

1. `transferToDynamic(..., keepTrigger = true)`：把静态格点上的触发器迁到新动态图块；
2. `transferToDynamic(..., keepTrigger = false)`：只转换图块，不保留原触发器，并清理静态格点上的手动覆盖；
3. `transferToStatic(..., keepTrigger = true)`：把动态图块携带的触发器写回静态格点；若与默认值一致则回退默认，否则记为手动覆盖；
4. `transferToStatic(..., keepTrigger = false)`：只还原图块，不回写动态图块触发器，让静态格点自然回退到图块默认触发器；
5. `transferToStaticIfSafe(..., keepTrigger = true)`：在安全回写条件满足时，保持与 `transferToStatic` 一致的迁移语义。

这比把“是否保留触发器”揉进 `setBlock` 更符合职责边界，因为真正发生触发器载体切换的地方只有这些转换接口。

## 5. 图块写接口不再隐式影响触发器

既然图块数组与触发器数据已经拆开，则以下接口默认不应直接修改触发器：

1. `setBlock`
2. `putMapData`
3. `setMapRef`
4. `openDoor`
5. `closeDoor`

这样做的好处是：

1. 图块外观变化与逻辑触发变化彻底解耦；
2. 不再需要 `keepInfo` / `keepTrigger` 之类参数污染高频图块写路径；
3. 调用方若确实希望同步改动触发器，应显式调用 `setTriggerType` 或走动静态转换接口。

这里唯一需要特殊处理的是 `resize` / `resize2`：当地图缩小时，越界格点对应的稀疏触发器记录必须一起裁剪。

## 6. 触发器对象延后到 Layer 2 实例化

当前触发器接口仍然可以保留 `ITrigger` 对象模型，但这个对象不应该提前存进地图数据层。

更合理的职责划分是：

1. Layer 1 只存 `triggerType: number`；
2. `ITriggerCollector` 在收集时根据 `triggerType` 向 `ITriggerRegistry` 要工厂；
3. 再由工厂创建运行时 `ITrigger` 对象并执行后续排序、触发流程。

这样既满足“地图上只存一个触发器类型数字即可”的诉求，也不需要推翻当前 Layer 2 的触发器执行模型。

## 7. 当前存档边界

静态格点的触发器来源当前已经明确为“图块默认值 + 地图手动覆盖值”两层结构，因此存档边界也可以先做阶段性收敛：

1. 图块默认触发器由 `ITileStore` 提供，不需要在地图层重复存储；
2. 若静态格点的手动覆盖值需要进入存档，那么只需要保存地图侧的稀疏覆盖映射，而不需要保存整份默认触发器表；
3. 动态图块的存储方案目前尚未设计完成，因此其 `triggerType` 是否进入存档、读档后如何恢复，暂不在本轮接口设计中拍死。

因此，这一节当前只确认静态覆盖的存储边界；动态图块相关存档语义后续再单独设计。

## 8. 单个载体当前只存一个触发器类型

本轮设计中，每个静态格点与每个动态图块都只保存一个 `triggerType: number`。

这样做的原因是：

1. 当前触发器本身不接受用户自定义参数，地图侧没有必要提前背负对象列表；
2. 对绝大多数格点而言，一个触发器类型已经足够；
3. 同一点多触发器仍可通过“静态格点 1 个 + 多个动态图块各 1 个”的方式聚合。

当前这条限制已经足够。以现有触发器定位来看，一个触发器类型只是告诉系统“这次行为该走哪种处理分支”；更复杂的行为应当放到自定义事件等更高自由度的描述层中，而不是在单个图块上堆叠多个触发器类型。

---

# 涉及文件

## 需要引用的文件

- `@user/data-base/src/map/types.ts`：当前 `ILayerState`、`IMapLayer`、`IDynamicLayer`、`IDynamicTile` 的权威接口定义
- `@user/data-base/src/store/types.ts`：`ITileStore` 的权威接口定义
- `@user/data-base/src/map/mapLayer.ts`：静态图层当前的图块数组实现
- `@user/data-base/src/map/dynamicLayer.ts`：动静态图块转换逻辑的当前实现
- `@user/data-base/src/map/dynamicTile.ts`：动态图块实例对象，适合新增 `triggerType`
- `docs/dev/map/trigger.md`：当前触发器文档仍假定从 `getTileInfo` 读取信息，后续需要同步调整

## 需要修改的文件

### `@user/data-base/src/map/types.ts`

- [ ] 不再新增 `ITileInfo` / `IWrappedTileInfo` 作为本轮主接口
- [ ] 为 `ILayerState` 新增 `readonly tileStore: ITileStore`
- [ ] 为 `IMapLayer` 新增 `getTriggerType(x, y): number`
- [ ] 为 `IMapLayer` 新增 `setTriggerType(type: number, x: number, y: number): void`
- [ ] 为 `IMapLayer` 新增 `revertTrigger(x: number, y: number): void`
- [ ] 为 `IDynamicTile` 新增 `readonly triggerType: number`
- [ ] 为 `IDynamicTile` 新增 `setTriggerType(type: number): void`
- [ ] 修改 `IDynamicLayer.transferToDynamic`：新增 `keepTrigger?: boolean`
- [ ] 修改 `IDynamicLayer.transferToStatic`：新增 `keepTrigger?: boolean`
- [ ] 修改 `IDynamicLayer.transferToStaticIfSafe`：新增 `keepTrigger?: boolean`

### `@user/data-base/src/map/mapLayer.ts`

- [ ] 新增静态手动覆盖触发器类型的稀疏存储结构
- [ ] 实现 `getTriggerType` / `setTriggerType` / `revertTrigger`
- [ ] 保持 `setBlock`、`putMapData`、`setMapRef`、`openDoor`、`closeDoor` 与触发器逻辑解耦
- [ ] 在 `resize` / `resize2` 中裁剪越界触发器记录

### `@user/data-base/src/map/dynamicTile.ts`

- [ ] 新增 `triggerType` 成员与对应写接口

### `@user/data-base/src/map/dynamicLayer.ts`

- [ ] 在 `transferToDynamic` 中实现静态格点与动态图块之间的触发器迁移或丢弃逻辑
- [ ] 在 `transferToStatic` 中实现动态图块与静态格点之间的触发器迁移或丢弃逻辑
- [ ] 若保留 `transferToStaticIfSafe` 的对称性，同步补齐其触发器迁移逻辑

### `@user/data-base/src/map/mapStore.ts`

- [ ] 若静态手动覆盖需要进入存档，仅保存地图侧稀疏覆盖映射
- [ ] 动态图块触发器字段的存档逻辑待动态图块存储方案定稿后再补齐

### `docs/dev/map/trigger.md`

- [ ] 将 `collect` 过程从“读取 `getTileInfo` 中的对象信息”改为“读取静态与动态载体上的触发器类型数字，再按需实例化 `ITrigger`”

---

# 当前结论

1. 静态格点触发器来源采用“`ITileStore` 默认值 + 地图手动覆盖值”两层结构，`revertTrigger` 用于恢复默认值。
2. `getTriggerType(x, y)` 与 `ITileStore.getTrigger(num)` 对齐，越界或不存在触发器时统一返回 `-1`。
3. `transferToDynamic`、`transferToStatic`、`transferToStaticIfSafe` 的 `keepTrigger` 默认值暂定为 `true`。
4. 静态图层只稀疏存储手动覆盖值，不重复保存整份默认触发器表。
5. 动态图块触发器的存档语义暂不拍死，待动态图块存储方案单独定稿后再处理。
6. 单个载体只保存一个 `triggerType` 当前已经足够，复杂行为应交由自定义事件等更高层描述。
