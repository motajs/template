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

## ② 数据端缺失接口

本节登记「渲染端需要而数据端未提供」且**经阅读确认**的接口。凡不能确认的候选一律不登记为缺失项，转入「未能从阅读确定（未猜测）」。

本步未确认数据端缺失接口。

**②节结论：** 本步未确认数据端缺失接口；相关不确定项见「未能从阅读确定（未猜测）」

## 触发序列（举例）

**#04-01-M-01：** `HeroKeyMover` 构造期 import `{ HeroMover, IMoveController } from '@user/data-state'`（编译期即带 `// @ts-expect-error 需要重构`）→ 因其按旧概念「移动控制器」声明 `controller?: IMoveController`、`mover: HeroMover` → 数据端实际只在 `@user/data-base` 提供 `HeroMover`（`data-base/src/hero/mover.ts:22`）、把控制器命名为 `IMoverController`（`data-common/src/common/mover.ts:142`）→ 该模块无法按新接口接线，需局部重构为 `IHeroMover` / `IMoverController`。

**#04-01-M-06：** `updateStatus()` 调用 `getHeroStatusOn('atk')`（`main.tsx:104`）→ 该符号自 `@user/data-state` import（`main.tsx:28-29`，带 `// @ts-expect-error 需要重构`）→ `data-state` barrel 无此导出、全仓库无定义 → 按旧接口取属性失败；新路径应为 `state.hero.attribute.getFinalAttribute(...)`（`data-base/src/hero/types.ts:106`），需渲染端改读写法。

**#04-01-M-09：** 地图上某点图块被改写 → 数据端 `MapLayer` 触发的是 `IMapLayerHooks.onUpdateBlock`（`data-base/src/map/mapLayer.ts:243`）→ 但渲染端把处理函数注册为 `IGameMapHooks.onUpdateLayerBlock`（`renderer.ts:426,1755`），而 `IGameMapHooks` 已无该方法、`StateMapLayerHook` 也只桥接 `onResize` → `MapRenderer.updateLayerBlock` 永不被调用 → 顶点数组不刷新，画面与数据不一致。

## 判定为「匹配」的同类边界

- **渲染侧素材族（`core.material.*` / `core.materials` / `core.icons.*` / `core.tilesets`）**：这些读取的是渲染端自己的素材/纹理资产，不是数据端状态，因此不算数据端错配。判据：其值由渲染端 `client-base/src/material/**` 与加载器写入（如 `client-base/src/load/loader.ts:103,129,151,167` 写 `core.material.images.*`、`:284,418` 读 `core.materials`），数据端 `types.ts` 中并无对应状态字段。典型命中：`render/elements/cache.ts`、`render/elements/misc.ts`、`render/components/misc.tsx`、`render/weather/presets/{cloud,fog,sun}.ts`、`fallback/load.ts:55-56`。
- **A1 渲染契约桥（全链一致）**：`client-base/src/types.ts` 的 `IClientBase extends ICoreState` 继承成员全部核对一致；`client-modules/src/types.ts` 的 `IClientCore extends IClientBase` 新增成员无冲突 → 判为匹配。
- **A2 组合根/单例**：`ClientCore extends CoreState implements IClientCore`（`client.ts:46`）接口要求成员逐一实现；`loading.once('coreInit')`（`index.ts:8`）、`loading.once('loaded')`/`emit('assetBuilt')`（`client.ts:97,99`）、`hook.on('restart')`（`render/index.tsx:37`）均命中数据端现行事件键；`core.ts:6` 单例与 `data-state/src/ins.ts:10` 一致 → 判为匹配。
- **A4 新接口用法**：`hook` 订阅（`render/index.tsx:4,37-40`）、`loading` 生命周期（`client-modules/src/index.ts:1`、`client.ts:43`）、`state` 单例（`render/map/extension/hero.ts:21,225`）、`client.flags.getFieldValueDefaults`（`main.tsx:100-101,121-123,134`）均命中数据端现行接口，属已走新接口。
- **A5 数据端类型直连（解析成功）**：`IGameMap` / `IMapLayer` / `IGameMapHooks` / `IMapState` / `IMapLayerHooks` / `IMapLayerHookController` 在 `render/map/{renderer,moving,element,status,vertex,types}.ts`、`render/elements/props.ts`、`render/map/extension/{manager,door}.ts` 的 import 均解析成功；`getMapRef()` 的 `IMapLayerData{expired,array}` 解构（`vertex.ts:620,820`）匹配；`extension/door.ts` 的 `MapDoorHook` 命中 `IMapLayerHooks` → 判为匹配。
- **A7 加载器 import（解析成功）**：`client-base/src/load/loader.ts:16-28` 的处理器类型与 `loading`/`IMotaDataLoader` 均解析成功；`client-base/src/material/**` 无 `@user/data-*` import、无 `core.` 读取，为纯渲染素材实现。
- **`gameListener`**：`data-base/src/game.ts:266-267` 的 `@deprecated gameListener` 在 `client-base`/`client-modules` 中无任何引用，渲染端已改走 `hook` → 判为匹配。

## 未能从阅读确定（未猜测）

1. **② 节是否有缺失项**：本步未确认任何数据端缺失接口，但存在若干候选（如游戏工程元数据 `core.firstData.*`、勇士渲染粒度钩子），其「应由数据端补充」还是「由渲染端改接既有数据对象」无法仅凭静态阅读判定，故不登记为 ②，见下（Task 3 定稿段继续补全）。

## 处置

- **本步性质**：只读清点，**无任何生产代码改动**；被查两包 `client-base` / `client-modules` 保持零改动。
- **后续拆分**：实际适配实施与移动端/桌面端双布局**未在本 run 规划**，由用户在对账结果出来后决定如何拆分（D-01/D-02）。REND-01（渲染端适配新数据层接口）与 REND-02（双布局）的验收边界尚未提供，需用户在规划实施前补齐。
- **双布局既有资产（仅登记为后续起点，不展开实施）**：
  - packages-user/client-modules/src/render/use.ts:22-66 —— `Orientation`（Landscape/Portrait）枚举、`OrientationHook`、`checkOrientation()`（`window.innerWidth >= window.innerHeight`）与 `onOrientationChange()`；当前在 `client-modules` 内无消费点。
  - packages-user/client-modules/src/shared.ts:33-105 —— `MAP_BLOCK_WIDTH`/`MAP_BLOCK_HEIGHT`（13×13）、`MAP_WIDTH`/`MAP_HEIGHT`、`STATUS_BAR_WIDTH`、`MAIN_WIDTH`/`MAIN_HEIGHT` 等布局常量；现为「单一横屏 + 最多双状态栏」的静态常量，与 `Orientation` 判定尚未接线。
