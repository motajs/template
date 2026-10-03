# 渲染端 ↔ 数据端接口对账审计

**日期:** 2026-09-18
**范围:** 被查对象 `packages-user/client-base` + `packages-user/client-modules`；`packages-user/data-{common,base,system,state}` 仅作接口基准（D-03/D-04）
**性质:** 只读清点，未修改任何代码（D-02）
**接口基准:** 各数据端包的 `types.ts` / `core.ts` / `ins.ts` 现行签名（D-04/D-05）

## 背景

本文件是 Phase 4 第一步（增量规划，D-01/D-02）的交付物：对渲染端与数据端做**只读接口对账**，清点所有「渲染端实现 ↔ 数据端现行接口」不匹配项，供用户决定阶段 4 剩余工作（适配实施 + 移动端/桌面端双布局，REND-01/REND-02）如何拆分。

本步**只清点、不改代码**。被查对象限 `client-base` 与 `client-modules`（D-03）；`data-common` / `data-base` / `data-system` / `data-state` 只作接口基准（D-04）。对账以**接口签名为准**，不受用户并行修改数据端**实现**的影响（D-05）。

## 方法

- **枚举面（A1..A7）**：A1 渲染契约桥、A2 组合根/单例、A3 legacy 全局 `core.*` 读取、A4 新数据层接口调用、A5 数据端类型直连、A6 双布局既有资产、A7 加载/素材接线。
- **判定口径**：每条 `core.*` 读取先判「读的是数据端状态」还是「渲染侧素材/全局」；数据端状态 → ① 错配或 ③ 多余旧路径，纯渲染侧素材/全局 → 「判定为『匹配』的同类边界」。不因出现 `core.` 就一律登记。
- **分类固定三选一**（D-06）：① 错配 `#04-01-M-N`、② 数据端缺失 `#04-01-G-N`（独立成节，D-08）、③ 多余旧路径 `#04-01-L-N`。一条记录只归一类，跨类拆条。
- **证据纪律**：每条含 `接口名 + 所属文件:行 + 分类 + 问题描述 + 影响 + 置信 + 依据`（D-07）；`#04-01-M-*` 的「依据」列引用数据端基准文件；静态阅读不能定论者进「未能从阅读确定（未猜测）」，不写成缺陷。
- **只读约束**：本 run 唯一允许写出的文件是本审计文档；允许只读子代理扫描（D-09），但子代理仅回传文本、不得写文件。
- **扫描前基线**：执行 `git status --porcelain -- packages-user/client-base packages-user/client-modules`，输出为空（被查两包无任何工作树改动）。
- **既有重构标记处置口径**：带 `// @ts-expect-error 需要重构` 的 import 是强线索但**不是结论**——按用户分类规则，此类「渲染端需局部重构以采用新接口」一律归 ① 错配（渲染侧适配项），不归 ②；每条仍须与数据端实签核对后定性。

## 发现

列序固定：`ID | 接口名 | 所属文件:行 | 分类 | 问题描述 | 影响 | 置信 | 依据`。本节只登记 ① 错配与 ③ 多余旧路径；② 数据端缺失见下一独立节。

| ID | 接口名 | 所属文件:行 | 分类 | 问题描述 | 影响 | 置信 | 依据 |
|----|--------|-------------|------|----------|------|------|------|
| #04-01-M-01 | `HeroMover` / `IMoveController`（`@user/data-state`） | packages-user/client-modules/src/action/move.ts:4（使用 `:19,:29,:33`） | ① 错配 | import 带 `// @ts-expect-error 需要重构`（`move.ts:3`）。`data-state` 未导出这两个符号：`HeroMover` 实际导出在 `@user/data-base`，`IMoveController` 数据端名为 `IMoverController`（拼写 Mover），属渲染端需局部重构采用新接口 | `HeroKeyMover` 全类无法编译；按键移动模块需改 import 源与类型名 | 高 | packages-user/data-base/src/hero/mover.ts:22；packages-user/data-common/src/common/mover.ts:142；packages-user/data-state/src/index.ts:1-9（无该导出） |
| #04-01-M-02 | `HeroAnimateDirection`（`@user/data-common`） | packages-user/client-modules/src/render/map/extension/hero.ts:6（使用 `:53,:97,:170,:372,:437`）；packages-user/client-modules/src/render/map/extension/types.ts:5（使用 `:147`） | ① 错配 | import 带 `// @ts-expect-error 需要重构`。数据端该枚举已改名，`HeroAnimateDirection` 在全仓库 `data-*` 包中无定义；现行名为 `ObjectAnimDirection`，成员 Forward/Backward 一一对应 | 勇士/跟随者动画正向/反向播放方向类型无法解析（`hero.ts` 多处编译失败），需渲染端改用 `ObjectAnimDirection` | 高 | packages-user/data-common/src/common/mover.ts:40（ObjectAnimDirection） |
| #04-01-M-03 | `IHeroMoveController`（`@user/data-common` / `@user/data-base`） | packages-user/client-modules/src/render/map/extension/hero.ts:8（使用 `:79`）；packages-user/client-modules/src/render/map/extension/types.ts:7（使用 `:15,:27,:35`）；packages-user/client-modules/src/render/map/extension/manager.ts:2（使用 `:18,:27,:39`） | ① 错配 | import 带 `// @ts-expect-error 需要重构`。数据端无此名；旧「勇士移动控制器」被拆分为 `IObjectMover<T>` / `IHeroMover<T>` 与 `IMoverController`。渲染端 `heroMap: Map<IHeroMoveController, ...>`、`addHero`/`removeHero`、`MapHeroRenderer` 构造参数均失配 | 整个 `extension/hero.ts` 勇士渲染拓展无法按新接口接线，需按 `IHeroState`/`IHeroMover` 局部重构 | 高 | packages-user/data-common/src/common/mover.ts:235,142；packages-user/data-base/src/hero/types.ts:399 |
| #04-01-M-04 | `IHeroMoveControllerHooks`（`@user/data-common`） | packages-user/client-modules/src/render/map/extension/hero.ts:10（使用 `:61,:457`） | ① 错配 | import 带 `// @ts-expect-error 需要重构`。数据端无此 hooks 契约；现行拆为 `IObjectMoverHooks<T>` + `IHeroLocationHooks`，且钩子方法名整体不一致（渲染端 `onSetPosition`/`onStartMove`/`onEndMove` vs 数据端 `onSetPos`/`onMoveStart`/`onMoveEnd` 等） | 勇士贴图、移动、跳跃、透明度、跟随者的数据端通知全部断链，需改为订阅数据端现行 hooks | 高 | packages-user/data-common/src/common/mover.ts:166（IObjectMoverHooks）；packages-user/data-base/src/hero/types.ts:277（IHeroLocationHooks）、:486（IHeroFollowersControllerHooks） |
| #04-01-M-05 | `IHeroMoveController` 成员形状（`hero.x/y/direction/image/addHook`） | packages-user/client-modules/src/render/map/extension/hero.ts:79-89,115-119（另 `:143,:193`） | ① 错配 | 渲染端按旧 `HeroStatus` 形状读取 `hero.x`/`hero.y`/`hero.direction`/`hero.image`/`hero.addHook`。新 `IHeroMover` 经 `IObjectMover` 提供 x/y，但无 `direction`（朝向为 `faceDirection`/`moveDirection`）、无 `image`；`IHeroRendering` 仅暴露 `alpha`/`setAlpha` | `MapHeroRenderer` 构造、贴图选择、跟随者初始化全部错读旧成员 | 高 | packages-user/data-common/src/common/mover.ts:235-251；packages-user/data-base/src/hero/types.ts:436-449 |
| #04-01-M-06 | `getHeroStatusOn`（`@user/data-state`） | packages-user/client-modules/src/render/ui/main.tsx:29（使用 `:104-112`） | ① 错配 | import 带 `// @ts-expect-error 需要重构`（`main.tsx:28`）。`data-state` barrel（`index.ts:1-9`）无 `getHeroStatusOn` 导出，全仓库亦无定义（`data-state` 自身 `enemy/special.ts` 也是无 import 直接引用）。属性侧新等价为 `getFinalAttribute` | `main.tsx` 共 9 处属性读取无法解析，状态栏属性值读取断链 | 高 | packages-user/data-state/src/index.ts:1-9（无导出）；packages-user/data-base/src/hero/types.ts:106（getFinalAttribute） |
| #04-01-M-07 | `ItemState`（`@user/data-state`） | packages-user/client-modules/src/render/ui/statistics.tsx:11（使用 `:178`） | ① 错配 | import 带 `// @ts-expect-error 需要重构`（`statistics.tsx:10`）。`data-state` 无此导出且全仓库无定义；新接口为 `state.itemStore`（`IItemStore.getData(num)`），且入参由字符串 id 变为图块数字 | `ItemState.items.get(...)` 无法解析；统计界面道具分类逻辑失效 | 高 | packages-user/data-common/src/store/types.ts:189（IItemStore）；packages-user/data-state/src/core.ts:79（itemStore）、packages-user/data-state/src/ins.ts:10（state 单例） |
| #04-01-M-08 | `state.maps` 作为 `IGameMap` 传入 `map-render` | packages-user/client-modules/src/render/ui/main.tsx:248 | ① 错配 | `<map-render layerState={state.maps}>`：`state.maps` 类型是 `IMapState`（多楼层管理对象），而 `layerState` 契约要求单楼层 `IGameMap`（`render/elements/props.ts:27`）；`:247` 带 `// @ts-expect-error 需要重构`。正确取法应为 `state.maps.getActiveMap(floorId)` / `getMap(floorId)` | 主地图渲染入口状态对象类型/形状错配，地图图层读取链在根节点即失配 | 高 | packages-user/data-base/src/map/types.ts:617（IGameMap）、:744（IMapState）、:761（getMap）、:773（getActiveMap） |
| #04-01-M-09 | `IGameMapHooks.onUpdateLayerArea` / `.onUpdateLayerBlock` | packages-user/client-modules/src/render/map/renderer.ts:1745,1755（注册 `:426`，类型 `:83`） | ① 错配 | 渲染把「区域更新/单点图块更新」钩子挂在 `IGameMapHooks` 上，但现行 `IGameMapHooks` 只有 `onChangeBackground?` / `onUpdateLayer?` / `onResizeLayer?`；图层级的 `onUpdateArea` / `onUpdateBlock` 已下移到 `IMapLayerHooks`，且 `GameMap` 的 `StateMapLayerHook` 只桥接 `onResize` → `onResizeLayer` | `MapRenderer.updateLayerArea` / `updateLayerBlock`（`renderer.ts:1527,:1545`）永不被触发，静态图块/区域变更后顶点数组不刷新 | 高 | packages-user/data-base/src/map/types.ts:588-608（IGameMapHooks）、:207-230（IMapLayerHooks）；packages-user/data-base/src/map/gameMap.ts:222-232；packages-user/data-base/src/map/mapLayer.ts:243,300 |
| #04-01-L-01 | `core.status.*` / `core.itemCount()` / `core.status.replay` / `core.isReplaying()` | packages-user/client-modules/src/render/ui/main.tsx:99,103,114-120,124,127-128 | ③ 多余旧路径 | 同一文件 `:100-101,121-123,134` 已改用新接口 `client.flags.getFieldValueDefaults(...)`，但状态栏其余字段与回放态仍读 legacy 全局 `core.*`，新旧双路径并存 | 状态栏数值/回放状态读取仍走旧路径，未接新数据层接口 | 高 | packages-user/data-base/src/types.ts:21（IStateBase.hero）；packages-user/data-base/src/hero/types.ts:310（floorId）、:636（itemCount）；packages-user/data-common/src/replay/types.ts:375（IReplaySystem.replaying） |
| #04-01-L-02 | `core.isReplaying()` | packages-user/client-modules/src/action/move.ts:66 | ③ 多余旧路径 | 经 legacy 全局查录像播放态，同一文件已 import `@user/data-state`（带重构标记） | 输入门控走旧路径，未接数据端录像系统 | 高 | packages-user/data-common/src/replay/types.ts:375 |
| #04-01-L-03 | `core.isReplaying()` | packages-user/client-modules/src/action/hotkey.ts:478 | ③ 多余旧路径 | 按键门控读旧录像态 | 回放期按键门控走旧全局 | 高 | packages-user/data-common/src/replay/types.ts:375 |
| #04-01-L-04 | `core.doSL()` | packages-user/client-modules/src/action/hotkey.ts:496,499 | ③ 多余旧路径 | 撤销/重做仍走 legacy 存读档命令 | 存读档链路未接新 `ISaveSystem` 与新存档契约 | 高 | packages-user/data-state/src/core.ts:283（saveState）；packages-user/client-base/src/save/types.ts:42（ISaveSystem） |
| #04-01-L-05 | `core.setFlag()` / `core.removeFlag()` | packages-user/client-modules/src/render/ui/statistics.tsx:140,219,224,251 | ③ 多余旧路径 | 统计期间用 legacy flag 全局开关 | 新 `IFlagSystem` 未用 | 高 | packages-user/data-base/src/flag/types.ts:47（IFlagSystem）、:123（getFieldValue） |
| #04-01-L-06 | `core.status.hero`（读 + 赋 Proxy 写回） | packages-user/client-modules/src/render/ui/statistics.tsx:144,158,215,225,240 | ③ 多余旧路径 | 统计采样对旧 `core.status.hero` 读写并赋 Proxy；新 `state.hero` 为只读对象，无同名可写属性 | 统计代理手法无法直接平移，需改为对新 `IHeroState` 只读读取 | 中 | packages-user/data-base/src/types.ts:21；packages-user/data-base/src/hero/types.ts:889（IHeroState） |
| #04-01-L-07 | `window.hero` / `window.flags` / `core.status.hero.flags`（写全局） | packages-user/client-modules/src/render/ui/statistics.tsx:216-217,248-250 | ③ 多余旧路径 | 把旧 `hero.flags` 灌到 `window` 全局 | flag 来源应为新 `IFlagSystem` | 中 | packages-user/data-base/src/types.ts:27（IStateBase.flags） |
| #04-01-L-08 | `core.floorIds` | packages-user/client-modules/src/render/ui/statistics.tsx:243 | ③ 多余旧路径 | 遍历全楼层用旧 id 列表 | 楼层有序列表未接新数据端 | 高 | packages-user/data-base/src/map/types.ts:747（IMapState.maps） |
| #04-01-L-09 | `core.status.maps[floorId].blocks` | packages-user/client-modules/src/render/ui/statistics.tsx:174 | ③ 多余旧路径 | 旧 `status.maps` 是 `Record<id,{blocks}>`；新 `IMapState.getMap(id)` 返回 `IGameMap`，无 `.blocks` 字段（且该读取为 legacy 全局） | 全塔统计无法按旧字段取块，需改用新 `IGameMap` 取块接口 | 中 | packages-user/data-base/src/map/types.ts:761（getMap）、:617（IGameMap） |
| #04-01-L-10 | `core.status.floorId` | packages-user/client-modules/src/render/ui/viewmap.tsx:54,566 | ③ 多余旧路径 | 浏览地图用旧楼层 id | 楼层态来源不统一 | 高 | packages-user/data-base/src/hero/types.ts:310（IHeroLocation.floorId） |
| #04-01-L-11 | `core.floorIds` | packages-user/client-modules/src/render/ui/viewmap.tsx:71 | ③ 多余旧路径 | 同 L-08 | 同 L-08 | 高 | packages-user/data-base/src/map/types.ts:747 |
| #04-01-L-12 | `core.status.hero.flags.__removed__` / `core.floors[v].cannotViewMap` | packages-user/client-modules/src/render/ui/viewmap.tsx:73-74,137 | ③ 多余旧路径 | 旧 `hero.flags` 判楼层移除；`cannotViewMap` 为旧全塔属性 | flag/可见性读取走旧形状 | 中 | packages-user/data-base/src/flag/types.ts:123；packages-user/data-base/src/map/types.ts:744 |
| #04-01-L-13 | `core.hasItem()` | packages-user/client-modules/src/render/ui/viewmap.tsx:133 | ③ 多余旧路径 | 检查传送道具走旧全局 | 道具判定未接新物品栏 | 高 | packages-user/data-base/src/hero/types.ts:623（getItemState） |
| #04-01-L-14 | `core.flyTo()` | packages-user/client-modules/src/render/ui/viewmap.tsx:135 | ③ 多余旧路径 | 楼层传送走旧命令 | 未接新寻路/瞬移接口 | 中 | packages-user/data-system/src/path/types.ts:193（teleportTo） |
| #04-01-L-15 | `core.status.floorId` / `core.status.thisMap`（写回） | packages-user/client-modules/src/render/ui/viewmap.tsx:361-362 | ③ 多余旧路径 | 卸载时写旧 `status.floorId`/`thisMap`；新面为 `state.hero.location.setFloor(IGameMap)` | 浏览地图后状态恢复走旧形状 | 中 | packages-user/data-base/src/hero/types.ts:310（floorId）、:312（map） |
| #04-01-L-16 | `core.status.route` | packages-user/client-modules/src/render/ui/settings.tsx:165,230 | ③ 多余旧路径 | 读取/序列化旧录像路由数组（`core.encodeRoute(core.status.route)`） | 录像数据走旧字符串数组 | 高 | packages-user/data-common/src/replay/types.ts:329（IReplaySandboxConfig.route） |
| #04-01-L-17 | `core.status.hard` | packages-user/client-modules/src/render/ui/settings.tsx:168,228 | ③ 多余旧路径 | 难度读旧 status；同文件 `:166-167` 已用 `client.flags.getFieldValue` 取 seed，双路径 | 同 L-01 的双路径问题 | 中 | packages-user/data-base/src/flag/types.ts:123 |
| #04-01-L-18 | `core.doSL()` | packages-user/client-modules/src/render/ui/settings.tsx:175,177,186,200,208,210 | ③ 多余旧路径 | 回放加载/接续走 legacy 存读档 | 存读档链路未接新契约 | 高 | packages-user/data-state/src/core.ts:283；packages-user/client-base/src/save/types.ts:42 |
| #04-01-L-19 | `core.saves.saveIndex` | packages-user/client-modules/src/render/ui/settings.tsx:520 | ③ 多余旧路径 | 读旧存档索引 | 新 `ISaveSystem` 只有 `getLastSlot` | 高 | packages-user/client-base/src/save/types.ts:120（getLastSlot） |
| #04-01-L-20 | `core.clearLocalForage()` | packages-user/client-modules/src/render/ui/settings.tsx:574 | ③ 多余旧路径 | 清空走旧 localForage 全局 | 新存档系统未用 | 高 | packages-user/client-base/src/save/types.ts:42,115 |
| #04-01-L-21 | `core.saves.saveIndex`（写） | packages-user/client-modules/src/render/ui/settings.tsx:581,623 | ③ 多余旧路径 | 写旧存档索引 | 应为 `ISaveSystem.getLastSlot` 语义 | 中 | packages-user/client-base/src/save/types.ts:120 |
| #04-01-L-22 | `core.removeLocalForage()` | packages-user/client-modules/src/render/ui/settings.tsx:615,617 | ③ 多余旧路径 | 删档走旧 localForage | 应为新 `deleteSave` | 高 | packages-user/client-base/src/save/types.ts:115（deleteSave） |
| #04-01-L-23 | `core.maps.loadMap()` | packages-user/client-modules/src/render/ui/save.tsx:111 | ③ 多余旧路径 | 从存档原始数据重建地图走 legacy maps 模块 | 地图重建未接新数据端 | 中 | packages-user/data-base/src/map/types.ts:767（IMapState.fromRaw） |
| #04-01-L-24 | `core.saves.saveIndex` | packages-user/client-modules/src/render/ui/save.tsx:243,246 | ③ 多余旧路径 | 存读档页定位用旧索引 | 同 L-19 | 高 | packages-user/client-base/src/save/types.ts:120 |
| #04-01-L-25 | `core.removeSave()` | packages-user/client-modules/src/render/ui/save.tsx:531 | ③ 多余旧路径 | 删档走旧命令 | 应为 `ISaveSystem.deleteSave` | 高 | packages-user/client-base/src/save/types.ts:115 |
| #04-01-L-26 | `core.doSL()` | packages-user/client-modules/src/render/ui/save.tsx:563,584,586 | ③ 多余旧路径 | 存档/读档走 legacy 命令 | 同 L-18 | 高 | packages-user/data-state/src/core.ts:283 |
| #04-01-L-27 | `core.doSL()` | packages-user/client-modules/src/render/ui/toolbar.tsx:111,112 | ③ 多余旧路径 | 工具栏撤销/重做走 legacy 命令 | 同 L-18 | 高 | packages-user/data-state/src/core.ts:283 |
| #04-01-L-28 | `core.resumeReplay()` / `pauseReplay()` / `stopReplay()` / `speedDownReplay()` / `speedUpReplay()` / `rewindReplay()` / `stepReplay()` | packages-user/client-modules/src/render/ui/toolbar.tsx:188-192,202,203 | ③ 多余旧路径 | 回放控制走 legacy 全局命令 | 未接新回放沙箱 | 中 | packages-user/data-common/src/replay/types.ts:108,113,123,129（IReplaySandbox） |
| #04-01-L-29 | `core.isPlaying()` / `core.isMoving()` / `core.status.lockControl` | packages-user/client-modules/src/render/ui/toolbar.tsx:198 | ③ 多余旧路径 | 回放/移动门控读 legacy 全局；数据端无直接等价的播放态/移动态查询（见「未能从阅读确定」） | 门控走旧全局，无对位新接口 | 中 | packages-user/data-common/src/common/mover.ts:235（IObjectMover 移动态）；packages-user/data-state/src/ins.ts:10（state 单例） |
| #04-01-L-30 | `core.flags.statusBarItems` | packages-user/client-modules/src/render/ui/statusBar.tsx:158 | ③ 多余旧路径 | 状态栏显示项读旧 `core.flags`；同文件 `:119` 已用 `client.materials` | 状态项仍走旧全局 | 高 | packages-user/data-base/src/flag/types.ts:123；packages-user/data-base/src/types.ts:27 |
| #04-01-L-31 | `core.floors[s.floor]?.title` | packages-user/client-modules/src/render/ui/statusBar.tsx:139 | ③ 多余旧路径 | 状态栏楼层名读旧全塔属性 `title`；新 `IMapState` 无对应 title 字段（见「未能从阅读确定」） | 楼层名元数据来源未接新数据端 | 中 | packages-user/data-base/src/map/types.ts:744 |
| #04-01-L-32 | `core.status.replay.toReplay` / `core.status.route.push()` | packages-user/client-modules/src/render/components/choices.tsx:675,718-719,733,773-774,789 | ③ 多余旧路径 | 录像步消费/偏移与录像路由写回走旧结构 | 应为 `IReplayArray.add` 等新录像接口 | 高 | packages-user/data-common/src/replay/types.ts:329（route）、:195（IReplayArray.add） |
| #04-01-L-33 | `core.isReplaying()` | packages-user/client-modules/src/render/components/choices.tsx:715,770 | ③ 多余旧路径 | 选择框回放分支读旧录像态 | 同 L-02 | 高 | packages-user/data-common/src/replay/types.ts:375 |
| #04-01-L-34 | `core.maps.blocksInfo` | packages-user/client-modules/src/fallback/load.ts:44,59 | ③ 多余旧路径 | 兼容层按旧图块定义表建素材 | 图块定义应走新 `tileStore` | 中 | packages-user/data-common/src/store/types.ts:65（ITileStore） |
| #04-01-L-35 | `core.floorIds` | packages-user/client-modules/src/fallback/load.ts:111 | ③ 多余旧路径 | 遍历全楼层用旧 id 列表 | 同 L-08 | 中 | packages-user/data-base/src/map/types.ts:747 |
| #04-01-L-36 | `core.floors[v]`（原始楼层数据） | packages-user/client-modules/src/fallback/load.ts:112 | ③ 多余旧路径 | 读旧全塔楼层原始数据（bgmap/fgmap 等），新 `IMapStore` 数据形状不同 | 需按新 `IMapRawData`（`floorId`/`width`/`map`/`layerAlias`/`events`）适配 | 低 | packages-user/data-common/src/store/types.ts:254（IMapRawData）、:267（IMapStore） |
| #04-01-L-37 | `core.getSave()` | packages-user/client-modules/src/render/utils/saves.ts:21 | ③ 多余旧路径 | 读单档走 legacy 回调 API | 新异步 `ISaveSystem.load` 未用 | 高 | packages-user/client-base/src/save/types.ts:109（load） |
| #04-01-L-38 | `core.setLocalForage()` | packages-user/client-modules/src/render/utils/saves.ts:172,187 | ③ 多余旧路径 | 写档走旧 localForage | 应为新 `setGlobal` | 高 | packages-user/client-base/src/save/types.ts:133（setGlobal） |
| #04-01-L-39 | `core.removeLocalForage()` | packages-user/client-modules/src/render/utils/saves.ts:174 | ③ 多余旧路径 | 删档走旧 localForage | 应为新 `deleteSave` | 高 | packages-user/client-base/src/save/types.ts:115 |
| #04-01-L-40 | `core.saves.saveIndex` | packages-user/client-modules/src/render/utils/saves.ts:185 | ③ 多余旧路径 | 读旧存档索引 | 应为 `getLastSlot` | 高 | packages-user/client-base/src/save/types.ts:120 |
| #04-01-L-41 | `core.saves.saveIndex` / `core.saves.ids` | packages-user/client-modules/src/render/utils/saves.ts:173 | ③ 多余旧路径 | 判断存档存在走旧 `saves.ids` | 新保存系统无 ids 映射，语义需迁移 | 中 | packages-user/client-base/src/save/types.ts:42,120 |
| #04-01-L-42 | `core.floors[].title` | packages-user/client-modules/src/render/components/floorSelect.tsx:62,181 | ③ 多余旧路径 | 楼层选择器读旧 `core.floors[].title` | 楼层标题元数据未接新数据端（同 L-31） | 中 | packages-user/data-base/src/map/types.ts:744 |

## ② 数据端缺失接口

本节登记「渲染端需要而数据端未提供」且**经阅读确认**的接口。凡不能确认的候选一律不登记为缺失项，转入「未能从阅读确定（未猜测）」。

本步未确认数据端缺失接口。

**②节结论：** 本步未确认数据端缺失接口；相关不确定项见「未能从阅读确定（未猜测）」

## 触发序列（举例）

**#04-01-M-01：** `HeroKeyMover` 构造期 import `{ HeroMover, IMoveController } from '@user/data-state'`（编译期即带 `// @ts-expect-error 需要重构`）→ 因其按旧概念「移动控制器」声明 `controller?: IMoveController`、`mover: HeroMover` → 数据端实际只在 `@user/data-base` 提供 `HeroMover`（`data-base/src/hero/mover.ts:22`）、把控制器命名为 `IMoverController`（`data-common/src/common/mover.ts:142`）→ 该模块无法按新接口接线，需局部重构为 `IHeroMover` / `IMoverController`。

**#04-01-M-06：** `updateStatus()` 调用 `getHeroStatusOn('atk')`（`main.tsx:104`）→ 该符号自 `@user/data-state` import（`main.tsx:28-29`，带 `// @ts-expect-error 需要重构`）→ `data-state` barrel 无此导出、全仓库无定义 → 按旧接口取属性失败；新路径应为 `state.hero.attribute.getFinalAttribute(...)`（`data-base/src/hero/types.ts:106`），需渲染端改读写法。

**#04-01-M-09：** 地图上某点图块被改写 → 数据端 `MapLayer` 触发的是 `IMapLayerHooks.onUpdateBlock`（`data-base/src/map/mapLayer.ts:243`）→ 但渲染端把处理函数注册为 `IGameMapHooks.onUpdateLayerBlock`（`renderer.ts:426,1755`），而 `IGameMapHooks` 已无该方法、`StateMapLayerHook` 也只桥接 `onResize` → `MapRenderer.updateLayerBlock` 永不被调用 → 顶点数组不刷新，画面与数据不一致。

## 判定为「匹配」的同类边界

- **渲染侧素材族（`core.material.*` / `core.materials` / `core.icons.*` / `core.tilesets`）**：这些读取的是渲染端自己的素材/纹理资产，不是数据端状态，因此不算数据端错配。判据：其值由渲染端 `client-base/src/material/**` 与加载器写入（如 `client-base/src/load/loader.ts:103,129,151,167` 写 `core.material.images.*`、`:284,418` 读 `core.materials`），数据端 `types.ts` 中并无对应状态字段。典型命中：`render/elements/cache.ts`、`render/elements/misc.ts`、`render/components/misc.tsx`、`render/weather/presets/cloud.ts`、`render/weather/presets/fog.ts`、`render/weather/presets/sun.ts`、`fallback/load.ts:55-56`。
- **渲染工具/全局（非数据端状态）**：`core.formatBigNumber`（显示格式化）、`core.arrayToRGBA`（`render/ui/title.tsx:126`）、`core.drawThumbnail`（`render/components/thumbnail.tsx:75`）、`core.drawTip`（`render/ui/save.tsx:524,533`）、`core.platform.isPC`（`render/ui/settings.tsx:284`）、`core.download`（`render/ui/settings.tsx:223`）、`core.playSound`（`render/ui/settings.tsx:432`）、`core.formatDate2`（`render/ui/settings.tsx:224`）、`core.getTilesetOffset` / `core.getAnimateFrames`（`render/elements/cache.ts:135,254`）、`core.getMappedName`（`fallback/audio.ts:49`）——均为渲染/浏览器/工具侧能力。
- **legacy 行为命令 / UI 控制（非数据端状态读取）**：`core.openBook`/`openToolbox`/`openEquipbox`/`useFly`/`openQuickShop`/`turnHero`/`getNextItem`/`confirmRestart`/`debug`（`action/hotkey.ts:481-514`、`render/ui/toolbar.tsx`、`render/ui/viewmap.tsx:130`）、`core.ui.closePanel`（`render/ui/settings.tsx:164`）、`core.ui._drawViewMaps`（`render/ui/toolbar.tsx:199`）、`core.doRegisteredAction`（`render/ui/main.tsx:198,207,216`）、`core.chooseReplayFile`（`render/ui/title.tsx:214`、`render/ui/settings.tsx:217`）、`core.startGame`（`render/ui/title.tsx:227`、`render/ui/settings.tsx:168`）、`core.restart`（`render/ui/settings.tsx:112`）——为生命周期/交互命令，非数据端状态读取。
- **A1 渲染契约桥（全链一致）**：`client-base/src/types.ts` 的 `IClientBase extends ICoreState` 继承成员全部核对一致；`client-modules/src/types.ts` 的 `IClientCore extends IClientBase` 新增成员无冲突 → 判为匹配。
- **A2 组合根/单例**：`ClientCore extends CoreState implements IClientCore`（`client.ts:46`）接口要求成员逐一实现；`loading.once('coreInit')`（`index.ts:8`）、`loading.once('loaded')`/`emit('assetBuilt')`（`client.ts:97,99`）、`hook.on('restart')`（`render/index.tsx:37`）均命中数据端现行事件键；`core.ts:6` 单例与 `data-state/src/ins.ts:10` 一致 → 判为匹配。
- **A4 新接口用法**：`hook` 订阅（`render/index.tsx:4,37-40`）、`loading` 生命周期（`client-modules/src/index.ts:1`、`client.ts:43`）、`state` 单例（`render/map/extension/hero.ts:21,225`）、`client.flags.getFieldValueDefaults`（`main.tsx:100-101,121-123,134`）均命中数据端现行接口，属已走新接口。
- **A5 数据端类型直连（解析成功）**：`IGameMap` / `IMapLayer` / `IGameMapHooks` / `IMapState` / `IMapLayerHooks` / `IMapLayerHookController` 在 `render/map/renderer.ts`、`render/map/moving.ts`、`render/map/element.ts`、`render/map/status.ts`、`render/map/vertex.ts`、`render/map/types.ts`、`render/elements/props.ts`、`render/map/extension/manager.ts`、`render/map/extension/door.ts` 的 import 均解析成功；`getMapRef()` 的 `IMapLayerData{expired,array}` 解构（`vertex.ts:620,820`）匹配；`extension/door.ts` 的 `MapDoorHook` 命中 `IMapLayerHooks` → 判为匹配。
- **A7 加载器 import（解析成功）**：`client-base/src/load/loader.ts:16-28` 的处理器类型与 `loading`/`IMotaDataLoader` 均解析成功；`client-base/src/material/**` 无 `@user/data-*` import、无 `core.` 读取，为纯渲染素材实现。
- **`gameListener`**：`data-base/src/game.ts:266-267` 的 `@deprecated gameListener` 在 `client-base`/`client-modules` 中无任何引用，渲染端已改走 `hook` → 判为匹配。

## 未能从阅读确定（未猜测）

1. **② 候选：游戏工程元数据（name/version/title）** —— 渲染端经 legacy `core.firstData.*` 读取（`client.ts:71`、`render/utils/saves.ts:27,28,44,45,103`、`render/ui/settings.tsx:224,227,299,317,504,522`、`render/ui/title.tsx:368`）；`@user/data-*` 无任何工程元数据接口（`IMotaDataLoader` 仅 progress/jsonProcessor/initSystemLoadTask/addCustomLoadTask/load，`data-base/src/load/types.ts:10-38`）。「应由数据端新增接口，还是继续由 legacy bridge 供给」无法判定，故不登记为 ②。
2. **② 候选：勇士/跟随者渲染粒度钩子** —— 渲染端需要 `onTurnHero`/`onMoveHero`/`onJumpHero`/`onSetFollowerAlpha`/`onAddFollower(number,string)`/`onRemoveFollower(string,animate)`（`render/map/extension/hero.ts:473,481,489,502-516`）；数据端 `IObjectMoverHooks`/`IHeroFollowersControllerHooks` 提供的是面向数据对象的事件（`data-common/src/common/mover.ts:166`、`data-base/src/hero/types.ts:486-506`）。「数据端补渲染语义钩子」还是「渲染端改接数据对象钩子」无法判定，可能与 M-04 的重构方案重叠。
3. **勇士贴图别名 `hero.image`** —— `render/map/extension/hero.ts:115,119,143,193`；`IHeroState` 暴露 location/attribute/followers/rendering/items/equip，`IHeroRendering` 仅 `alpha`（`data-base/src/hero/types.ts:436-449`）。按用户分类规则，该缺口随 `IHeroMoveController` 整体归 ①（M-05），不重复登记为 ②；「数据端是否确应提供贴图别名」未定。
4. **无对位的旧状态读**（数据端无直接等价查询，故不登记为 ③，也不登记为 ②）：`core.status.lockControl`（`action/move.ts:97,123,156`、`action/hotkey.ts:478`、`render/ui/main.tsx:139`、`render/ui/toolbar.tsx:198`）、`core.status.stepPostfix`（`render/ui/main.tsx:155,165`）、`core.getNextLvUpNeed()`（`render/ui/main.tsx:113`）、`core.getLvName()`（`render/ui/main.tsx:125`）、`core.isPlaying()`/`core.isMoving()`（`action/move.ts:66`、`render/ui/toolbar.tsx:198`）、`core.waitHeroToStop()`（`action/move.ts:67`）。
5. **旧存档内部态**（新 `ISaveSystem` 无对应成员）：`core.saves.ids`/`autosave`/`favorite`/`favoriteName`/`cache`（`render/ui/settings.tsx:575-583,618-625`、`render/utils/saves.ts:173`）、`core.control._updateFavoriteSaves()`（`render/ui/settings.tsx:585,627`）、`core.removeLocalStorage()`（`render/ui/settings.tsx:586,628`）、`core.syncSave()`（`render/ui/settings.tsx:440,453`）、`core.getAllSaves()`（`render/utils/saves.ts:38`）。
6. **`core.control.__replay_getTimeout()`** —— `render/components/choices.tsx:717,728,772,783`；数据端无对应接口。
7. **`core.extractBlocks(floorId)` / `core.extractBlocksForUI(map, flags)`** —— `render/ui/statistics.tsx:160`、`render/ui/save.tsx:112`。
8. **`core.calValue` / `core.replaceText`** —— `render/components/textboxTyper.ts:906`、`render/components/tip.tsx:103`。
9. **`fallback/load.ts:112` 的 `core.floors[v]` 形状** —— 读出 bgmap/bg2map/map/fgmap/fg2map 五层数组，而 `IMapRawData` 为 `map` + `layerAlias` + `events` 结构（`data-common/src/store/types.ts:254`）；是否可等价映射需人工确认。
10. **`getHeroStatusOn` / `ItemState` 的归属** —— 是否将作为 `data-state` 导出补齐，还是由 `state.hero.attribute.getFinalAttribute`（`data-base/src/hero/types.ts:106`）/ `state.itemStore`（`data-common/src/store/types.ts:189`）取代：全仓库无定义。
11. **`state.maps` 在 `render/ui/main.tsx:248` 的正确替代** —— `getActiveMap`/`getMap`/新 selector 无法从静态契约确定。
12. **`core.materials` / `core.loader._loadAnimate` 是否会由 `MaterialManager`/新加载器取代** —— `client-base/src/load/loader.ts:188,284,418` 暂留在「匹配」边界，未登记为 ③。
13. **A6 双布局资产是否已规划接线** —— `render/use.ts` 的 `Orientation`/`onOrientationChange` 是否应接到 `shared.ts` 布局常量，无法判定（当前无消费点）。
14. **模式实现未验证** —— `state` 单例（`data-state/src/ins.ts:10`）与 `client`（`client-modules/src/core.ts:6`）运行时是否已完全覆盖上述 legacy 字段，仅静态阅读、未做运行验证。
15. **`ISaveSystem`（`client-base/src/save/types.ts:42`）与数据端存档方案的最终关系** —— 渲染侧除 `client.ts:70-71` 初始化外无任何消费者；其 `autosave` / `save(state: Map<string, ISaveableContent<unknown>>)` 与数据端 `ICoreState.saveState(): ReadonlyMap<string, unknown>`（`data-state/src/types.ts:15-16`）是两套不同形态。

## 处置

- **本步性质**：只读清点，**无任何生产代码改动**；被查两包 `client-base` / `client-modules` 保持零改动（`git status --porcelain -- packages-user/client-base packages-user/client-modules` 为空）。
- **分类分工**：① 错配（M）为「已引向新面但形状/名称不兼容、需渲染端局部重构」；③ 多余旧路径（L）为「仍走已被新接口取代的 legacy 全局 `core.*`」；② 独立节本步未确认缺失项，候选见「未能从阅读确定」。
- **后续拆分**：实际适配实施与移动端/桌面端双布局**未在本 run 规划**，由用户在对账结果出来后决定如何拆分（D-01/D-02）。REND-01（渲染端适配新数据层接口）与 REND-02（双布局）的验收边界尚未提供，需用户在规划实施前补齐。
- **双布局既有资产（仅登记为后续起点，不展开实施）**：
  - packages-user/client-modules/src/render/use.ts:22-66 —— `Orientation`（Landscape/Portrait）枚举、`OrientationHook`、`checkOrientation()`（`window.innerWidth >= window.innerHeight`）与 `onOrientationChange()`；当前在 `client-modules` 内无消费点。
  - packages-user/client-modules/src/shared.ts:33-105 —— `MAP_BLOCK_WIDTH`/`MAP_BLOCK_HEIGHT`（13×13）、`MAP_WIDTH`/`MAP_HEIGHT`、`STATUS_BAR_WIDTH`、`MAIN_WIDTH`/`MAIN_HEIGHT` 等布局常量；现为「单一横屏 + 最多双状态栏」的静态常量，与 `Orientation` 判定尚未接线。
