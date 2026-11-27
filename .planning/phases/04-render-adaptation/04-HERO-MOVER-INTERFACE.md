# 勇士移动子系统：渲染端 ↔ 数据端接口探索

**日期:** 2026-09-18
**范围:** 勇士移动子系统（渲染端使用点 → 数据端现行接口）；排除 `HeroRendering` 渲染状态（`IHeroRendering` / 贴图别名 / alpha 钩子，D-18）与 legacy `core.*`（D-12，属第五阶段）
**性质:** 只读接口探索，未修改任何生产代码；相对规划时基线零新增改动（D-17）
**接口基准:** `packages-user/data-common/src/common/mover.ts`、`packages-user/data-base/src/hero/{types,mover}.ts` 及各自 barrel 现行导出（D-05）
**输入账本:** `04-RENDER-INTERFACE-AUDIT.md` 的 `#04-01-M-01..05`

## 背景

Phase 4 第二步（D-17）：04-01 的只读对账把主要失配点定位在**勇士移动**（`#04-01-M-01..05`），但「数据端到底提供什么、渲染端到底需要什么、差在哪」尚缺成员级结论。不先把差异钉到接口成员级就直接改渲染端，极易按旧形状改错，因此本步先做**只读接口探索**。

本步**只探索、不改任何代码**：不实施适配，不规划 04-03+，**不裁决缺失接口**（D-13：缺失接口等到开始改的时候再逐步确认）。

**范围的两侧边界：**

- **在范围内**：勇士移动契约与移动钩子 —— `IObjectMover` / `IObjectMoverHooks` / `IMoverController` / `IHeroMover` / `IHeroLocationHooks` / `IHeroFollowersControllerHooks` / `IHeroStateHooks`，以及 `onMoveHero` / `onJumpHero` / `onTurnHero` / `onStartMove` / `onEndMove` 等移动语义钩子。
- **不在范围内（显式排除）**：`HeroRendering` **渲染状态**相关成员（`IHeroRendering`、勇士贴图别名、alpha 钩子，D-18 —— 用户先改数据端，之后再处理）；legacy `core.*`（D-12 —— 属第五阶段）。二者不产生任何对账行或缺失候选。

## 方法

**枚举面：**

- **（a）数据端现行接口面**：`data-common` 移动器族（`IObjectMovable` / `IObjectMover` / `IObjectMoverHooks` / `IMoverController` / `ObjectMoveStep` 各族 / `ObjectAnimDirection`）+ `data-base/hero` 位置移动族（`IHeroState` / `IHeroLocation` / `IHeroMover` / `IHeroLocationHooks` / `IHeroFollowersControllerHooks` / `IHeroStateHooks` / `HeroMover`）+ 各 `index.ts` barrel 实际导出。
- **（b）渲染端勇士移动使用面**：`render/map/extension/{hero,types,manager}.ts` + `action/move.ts` + `client.ts` 接线点；`render/map/{moving,status,renderer}.ts` 仅作移动器契约参考，不登记为独立对账对象。

**判定三态（固定）：** **匹配** / **渲染端需改** / **数据端缺失**。带 `// @ts-expect-error 需要重构` 的 import 一律先归「渲染端需改」，不归「数据端缺失」。

**证据纪律：** 每条含 `接口/成员名 + 两侧 file:line`；静态阅读不能定论者进「未能从阅读确定（未猜测）」，不写成缺失或错配。允许只读子代理扫描（D-09），但子代理仅回传事实表、不得写文件。

**只读约束：** 本 run 仅新增本交付文档一个文件；被查渲染端两包相对下述扫描前基线零变化。

- **扫描前基线**：执行 `git status --porcelain -- packages-user/client-base packages-user/client-modules`，输出**逐行原样**记录如下（规划时为两条与勇士移动无关的用户未提交改动；**不回滚 / 不暂存 / 不提交 / 不修改**）：

```text
 M packages-user/client-base/src/load/loader.ts
 M packages-user/client-base/src/load/types.ts
```

- **基线摘要**：sha256=7497384469364c38952b3f144f256f29058a79ce820cbc4bcd9e141704f33eae

（摘要由固定命令对 status 条目 + 各基线条目**文件内容的 sha256** 取摘要；只读门禁要求「当前 porcelain 条目集合 == 基线记录条目集合」且该 `sha256` 未变，能发现基线文件内容被改动。）

## 数据端现行接口

**`data-common` 移动器族（`packages-user/data-common/src/common/mover.ts`）：**

- **`ObjectMoveType`**（步骤类型枚举：`Dir` / `DirFace` / `Speed` / `Face` / `Special` / `AnimDir` / `Teleport` / `Jump`）：`packages-user/data-common/src/common/mover.ts:14`
- **`ObjectSpecialStep`**（`Forward` / `Backward`）：`packages-user/data-common/src/common/mover.ts:33`
- **`ObjectAnimDirection`**（`Forward` / `Backward`；替代渲染端 `HeroAnimateDirection`）：`packages-user/data-common/src/common/mover.ts:40`
- **`IObjectMovable`**（`x` / `y` / `setPos` / `getCurrentFaceDirection`）：`packages-user/data-common/src/common/mover.ts:47`
- **`IObjectMoveStepDir` / `IObjectMoveStepDirFace` / `IObjectMoveStepSpeed` / `IObjectMoveStepFace` / `IObjectMoveStepSpecial` / `IObjectMoveAnimDir` / `IObjectMoveTP` / `IObjectMoveJump`**：`packages-user/data-common/src/common/mover.ts:66` 起
- **`ObjectMoveStep`**（上述各步骤的联合类型）：`packages-user/data-common/src/common/mover.ts:132`
- **`IMoverController`**（`done` / `onEnd` / `push(...steps)` / `insert(...steps)` / `stop()`）：`packages-user/data-common/src/common/mover.ts:142`
- **`IObjectMoverHooks<T>`**（`onMoveStart` / `onMoveEnd` / `onStepStart` / `onStepEnd` / `onSetPos` / `onSetFaceDir` / `onSetMoveDir`）：`packages-user/data-common/src/common/mover.ts:166`
- **`IObjectMover<T>`**（`moving` / `tile` / `faceDirection` / `moveDirection` / `currAnimDir` / `currentSpeed` / `faceHandler` / `setPos` / `setFaceDir` / `setMoveDir` / `tp` / `jump` / `step` / `stepFace` / `forward` / `backward` / `speed` / `face` / `animDir` / `push` / `clear` / `start`，extends `IHookable<IObjectMoverHooks<T>>`）：`packages-user/data-common/src/common/mover.ts:235`
- **`ObjectMover<T>` 基类**（`moveQueue` / `start()` 实现）：`packages-user/data-common/src/common/mover.ts:357`（队列 `:364`、`start` `:689`）

**`data-base/hero` 位置移动族：**

- **`IHeroLocationHooks`**（`onSetPos` / `onSetFloor`）：`packages-user/data-base/src/hero/types.ts:277`
- **`IHeroLocation`**（`floorId` / `map` / `mover`，extends `IObjectMovable`）：`packages-user/data-base/src/hero/types.ts:303`
- **`HeroMoveCode`** / **`IHeroMoveTopHandler`** / **`IHeroMoveTopImpl`** / **`IHeroMoverConfig`**：`packages-user/data-base/src/hero/types.ts:327` / `:338` / `:351` / `:390`
- **`IHeroMover<T>`**（`config` / `getConfig` / `useTopImplementation`，extends `IObjectMover<T>`）：`packages-user/data-base/src/hero/types.ts:399`
- **`IHeroFollower`**：`packages-user/data-base/src/hero/types.ts:464`
- **`IHeroFollowersControllerHooks`**（`onAddFollower` / `onRemoveFollower` / `onGatherFollowers`）：`packages-user/data-base/src/hero/types.ts:486`
- **`IHeroFollowersController`**（`addFollower` / `getFollower` / `getFollowersById` / `getAllFollowers` / `removeFollower` / `removeAllFollowers` / `gatherFollowers` / `gatherFollowersSync`）：`packages-user/data-base/src/hero/types.ts:508`
- **`IHeroStateHooks`**（`onBeforeChangeFloor` / `onAfterChangeFloor`）：`packages-user/data-base/src/hero/types.ts:858`
- **`IHeroState`**（`location` → `IHeroLocation`、`followers` → `IHeroFollowersController`）：`packages-user/data-base/src/hero/types.ts:889`
- **`HeroMover<T>`**（`config` / `getConfig` / `useTopImplementation`，extends `ObjectMover<T>`）：`packages-user/data-base/src/hero/mover.ts:22`（配置 `:46` / `:59` / `:67`）

**barrel 实际导出核对（D-05）：**

- **`@user/data-common`**：`packages-user/data-common/src/index.ts:1` 转发 `./common` → `packages-user/data-common/src/common/index.ts:4` 转发 `./mover`；故 `IObjectMover` / `IMoverController` / `IObjectMoverHooks` / `IObjectMovable` / `ObjectAnimDirection` 可经 `@user/data-common` 取得。
- **`@user/data-base`**：`packages-user/data-base/src/index.ts:3` 转发 `./hero` → `packages-user/data-base/src/hero/index.ts:8` 转发 `./mover`、`:10` 转发 `./types`；故 `HeroMover` / `IHeroMover` / `IHeroLocation` / `IHeroState` 可经 `@user/data-base` 取得。
- **`@user/data-state`**：`packages-user/data-state/src/index.ts:1` 转发 `./hero`，但 `packages-user/data-state/src/hero/index.ts:1` 仅转发 `./moverImpl` / `:2` `./predicate` / `:3` `./types`，**未导出** `HeroMover` / `IMoveController`；渲染端 `packages-user/client-modules/src/action/move.ts:4` 从 `@user/data-state` import 二者因此失配（见 `#04-02-R-02`）。
- **`@motajs/common`**：`IHookable.addHook` / `IHookController.load/unload` 契约位于 `packages/common/src/types.ts:81` / `:52`，由 `packages/common/src/hook.ts:24` 的 `Hookable.addHook` 实现（`hero.addHook` 的落点）。

## 渲染端现状

**`render/map/extension/hero.ts`（`MapHeroRenderer` / `MapHeroHook`）：**

- 构造器（`hero.addHook(new MapHeroHook(this))` / `hero.x` / `hero.y` / `hero.direction`）：`packages-user/client-modules/src/render/map/extension/hero.ts:76-102`
- `addHeroMoving`（`hero.image` 贴图别名读取 `:115` / `:119` / `:121` —— 属贴图子系统，按 D-18 排除，不进入对账与候选）：`packages-user/client-modules/src/render/map/extension/hero.ts:110`
- `updateHeroTexture`（贴图，按 D-18 排除）：`packages-user/client-modules/src/render/map/extension/hero.ts:138`
- `tick`（`HeroAnimateDirection.Forward` 使用点 `:170`）：`packages-user/client-modules/src/render/map/extension/hero.ts:165`
- `setImage`（贴图，按 D-18 排除）：`packages-user/client-modules/src/render/map/extension/hero.ts:191`
- `setAlpha`（alpha，按 D-18 排除）：`packages-user/client-modules/src/render/map/extension/hero.ts:198`
- `setPosition`：`packages-user/client-modules/src/render/map/extension/hero.ts:202`
- `moveEntity`：`packages-user/client-modules/src/render/map/extension/hero.ts:215`
- `jumpEntity`：`packages-user/client-modules/src/render/map/extension/hero.ts:264`
- `startMove`：`packages-user/client-modules/src/render/map/extension/hero.ts:282`
- `waitMoveEnd`：`packages-user/client-modules/src/render/map/extension/hero.ts:295`
- `stopMove`：`packages-user/client-modules/src/render/map/extension/hero.ts:300`
- `move`：`packages-user/client-modules/src/render/map/extension/hero.ts:307`
- `jumpTo`：`packages-user/client-modules/src/render/map/extension/hero.ts:316`
- `addFollower`：`packages-user/client-modules/src/render/map/extension/hero.ts:341`
- `removeFollower`：`packages-user/client-modules/src/render/map/extension/hero.ts:378`
- `removeAllFollowers`：`packages-user/client-modules/src/render/map/extension/hero.ts:424`
- `setFollowerAlpha`（alpha，按 D-18 排除）：`packages-user/client-modules/src/render/map/extension/hero.ts:431`
- `setHeroAnimateDirection`：`packages-user/client-modules/src/render/map/extension/hero.ts:437`
- `turn`：`packages-user/client-modules/src/render/map/extension/hero.ts:441`
- `MapHeroHook`（`Partial<IHeroMoveControllerHooks>`；`onSetImage` / `onSetAlpha` / `onSetFollowerAlpha` 属贴图 / alpha 子系统按 D-18 排除；移动 / 位置 / 跟随者钩子 `onSetPosition` / `onTurnHero` / `onStartMove` / `onMoveHero` / `onEndMove` / `onJumpHero` / `onAddFollower` / `onRemoveFollower` / `onRemoveAllFollowers` 见 `:469-512`）：`packages-user/client-modules/src/render/map/extension/hero.ts:457`

**`render/map/extension/types.ts`：**

- `IMapExtensionManager.heroMap`（键类型 `IHeroMoveController`）：`packages-user/client-modules/src/render/map/extension/types.ts:15`
- `addHero` / `removeHero`（参数 `IHeroMoveController`）：`packages-user/client-modules/src/render/map/extension/types.ts:26` / `:35`
- `IMapHeroRenderer` 契约（`setImage` / `addFollower` / `removeFollower` / `removeAllFollowers` / `setPosition` / `startMove` / `waitMoveEnd` / `stopMove` / `move` / `jumpTo` / `setAlpha` / `setFollowerAlpha` / `setHeroAnimateDirection` / `turn`）：`packages-user/client-modules/src/render/map/extension/types.ts:63`
- `setHeroAnimateDirection(direction: HeroAnimateDirection)`：`packages-user/client-modules/src/render/map/extension/types.ts:147`

**`render/map/extension/manager.ts`：**

- `// @ts-expect-error 需要重构` + `import { IHeroMoveController } from '@user/data-base'`：`packages-user/client-modules/src/render/map/extension/manager.ts:1-2`
- `heroMap` / `addHero` / `removeHero`：`packages-user/client-modules/src/render/map/extension/manager.ts:18` / `:26` / `:39`

**`action/move.ts`（`HeroKeyMover` 全类）：**

- `// @ts-expect-error 需要重构` + `import { HeroMover, IMoveController } from '@user/data-state'`：`packages-user/client-modules/src/action/move.ts:3-4`
- `class HeroKeyMover` / `controller?: IMoveController` / `mover: HeroMover`：`packages-user/client-modules/src/action/move.ts:11` / `:19` / `:29`
- legacy 门控 `core.isReplaying()` / `core.isPlaying()` / `core.waitHeroToStop()` / `core.status.lockControl`：`packages-user/client-modules/src/action/move.ts:66` / `:97` / `:123` / `:156`
- `this.mover.oneStep(this.moveDir)` / `this.mover.startMove(false, false, false, true)`：`packages-user/client-modules/src/action/move.ts:125`
- `controller.onEnd.then(...)`：`packages-user/client-modules/src/action/move.ts:130`
- `this.mover.on('stepEnd', this.onStepEnd)`：`packages-user/client-modules/src/action/move.ts:137`
- `con.queue.length` / `con.push({ type: 'dir', value: this.moveDir })`：`packages-user/client-modules/src/action/move.ts:169`
- `this.controller?.stop()` / `this.mover.off('stepEnd', this.onStepEnd)`：`packages-user/client-modules/src/action/move.ts:145` / `:180`

**`client.ts` 接线点：**

- 被注释的 `this.mainMapExtension.addHero(this.hero.mover, layer)`：`packages-user/client-modules/src/client.ts:148`

**`render/map/{moving,status,renderer}.ts`（仅移动器契约参考，不登记为独立对账对象）：**

- `IMovingBlock` / `addMovingBlock` / `getMovingBlock` / `updateMoving`：`packages-user/client-modules/src/render/map/types.ts:194` / `:534` / `:544` / `:1101`
- `IMovingRenderer` / `MovingBlock`：`packages-user/client-modules/src/render/map/moving.ts:8` / `:26`
- `MapRenderer.addMovingBlock` / `requestTicker`：`packages-user/client-modules/src/render/map/renderer.ts:1616` / `:1698`
- `StaticBlockStatus` / `DynamicBlockStatus`：`packages-user/client-modules/src/render/map/status.ts:4` / `:39`

**`// @ts-expect-error 需要重构` 清单位置（被查两包全部出现点）：**

- `packages-user/client-modules/src/action/move.ts:3`
- `packages-user/client-modules/src/render/map/extension/hero.ts:5`
- `packages-user/client-modules/src/render/map/extension/hero.ts:7`
- `packages-user/client-modules/src/render/map/extension/hero.ts:9`
- `packages-user/client-modules/src/render/map/extension/manager.ts:1`
- `packages-user/client-modules/src/render/map/extension/types.ts:4`
- `packages-user/client-modules/src/render/map/extension/types.ts:6`
- `packages-user/client-modules/src/render/ui/main.tsx:28`（非勇士移动，属 D-11 属性读取）
- `packages-user/client-modules/src/render/ui/main.tsx:247`（非勇士移动，属 `state.maps` 类型错配）
- `packages-user/client-modules/src/render/ui/statistics.tsx:10`（非勇士移动，属 D-11）

## 逐成员对账（匹配 / 渲染端需改 / 数据端缺失）

结论取 **匹配** / **渲染端需改** / **数据端缺失** 三态之一；每条两侧均给 `file:line`，数据端无对位时写「无对位，最接近：<file:line>」。

| ID | 成员 | 渲染端锚点 | 数据端锚点 | 对账结论 | 说明 |
|----|------|------------|------------|----------|------|
| #04-02-R-01 | `IHeroMoveControllerHooks` 钩子族（移动 / 位置 / 跟随者子集） | `packages-user/client-modules/src/render/map/extension/hero.ts:81` `packages-user/client-modules/src/render/map/extension/hero.ts:457` | 有对位：`packages-user/data-common/src/common/mover.ts:166` `packages-user/data-common/src/common/mover.ts:216`；有对位：`packages-user/data-base/src/hero/types.ts:277` `packages-user/data-base/src/hero/types.ts:283`；`onSetPosition` / `onStartMove` / `onEndMove` / `onMoveHero` / `onJumpHero` / `onTurnHero` / `onAddFollower` / `onRemoveFollower` / `onRemoveAllFollowers` 无同名对位，最接近：`packages-user/data-common/src/common/mover.ts:166` | 渲染端需改 | `addHook` 注册的移动 / 位置 / 跟随者钩子方法名与数据端现行 hooks 整体不一致，需随 `IHeroMoveControllerHooks` 整体重构；贴图 / alpha 钩子按 D-18 排除，不在本行范围 |
| #04-02-R-02 | `HeroMover` / `IMoveController`（import 源与类型名） | `packages-user/client-modules/src/action/move.ts:4` `packages-user/client-modules/src/action/move.ts:19` `packages-user/client-modules/src/action/move.ts:29` `packages-user/client-modules/src/action/move.ts:33` | `packages-user/data-base/src/hero/mover.ts:22` `packages-user/data-common/src/common/mover.ts:142` | 渲染端需改 | 带 `// @ts-expect-error 需要重构`（`move.ts:3`）；`IMoveController` 数据端现名为 `IMoverController`，`HeroMover` 实际在 `@user/data-base`，`@user/data-state` barrel 未导出二者 |
| #04-02-R-03 | `HeroAnimateDirection` | `packages-user/client-modules/src/render/map/extension/hero.ts:6` `packages-user/client-modules/src/render/map/extension/hero.ts:53` `packages-user/client-modules/src/render/map/extension/hero.ts:97` `packages-user/client-modules/src/render/map/extension/types.ts:5` `packages-user/client-modules/src/render/map/extension/types.ts:147` | `packages-user/data-common/src/common/mover.ts:40` | 渲染端需改 | 带 `// @ts-expect-error 需要重构`；数据端现行为 `ObjectAnimDirection`，成员 `Forward` / `Backward` 一一对应 |
| #04-02-R-04 | `IHeroMoveController` | `packages-user/client-modules/src/render/map/extension/hero.ts:8` `packages-user/client-modules/src/render/map/extension/hero.ts:79` `packages-user/client-modules/src/render/map/extension/types.ts:7` `packages-user/client-modules/src/render/map/extension/types.ts:15` `packages-user/client-modules/src/render/map/extension/manager.ts:2` `packages-user/client-modules/src/render/map/extension/manager.ts:18` | `packages-user/data-base/src/hero/types.ts:303` `packages-user/data-base/src/hero/types.ts:399` | 渲染端需改 | 带 `// @ts-expect-error 需要重构`；数据端无此名，已拆为 `IHeroLocation` + `IHeroMover`，`IHeroLocation.mover` 提供 `IHeroMover` |
| #04-02-R-05 | `hero.x` / `hero.y` | `packages-user/client-modules/src/render/map/extension/hero.ts:87` `packages-user/client-modules/src/render/map/extension/hero.ts:88` `packages-user/client-modules/src/render/map/extension/hero.ts:117` `packages-user/client-modules/src/render/map/extension/hero.ts:122` | `packages-user/data-common/src/common/mover.ts:48` `packages-user/data-common/src/common/mover.ts:49` `packages-user/data-common/src/common/mover.ts:58` | 匹配 | `IHeroLocation extends IObjectMovable`（`data-base/src/hero/types.ts:303`），`x` / `y` / `setPos` 均有对位 |
| #04-02-R-06 | `hero.direction` | `packages-user/client-modules/src/render/map/extension/hero.ts:89` `packages-user/client-modules/src/render/map/extension/hero.ts:125` `packages-user/client-modules/src/render/map/extension/hero.ts:193` | `packages-user/data-common/src/common/mover.ts:243` `packages-user/data-common/src/common/mover.ts:245` `packages-user/data-common/src/common/mover.ts:63` | 渲染端需改 | 现行无单成员 `direction`：朝向为 `IObjectMover.faceDirection` / `moveDirection`，只读朝向可经 `IObjectMovable.getCurrentFaceDirection()` |
| #04-02-R-07 | `hero.addHook` | `packages-user/client-modules/src/render/map/extension/hero.ts:81` | `packages-user/data-common/src/common/mover.ts:235` `packages-user/data-common/src/common/mover.ts:216` | 匹配 | `IObjectMover<T> extends IHookable<IObjectMoverHooks<T>>`；`addHook` 来自 `IHookable`（`packages/common/src/types.ts:81`），返回 `IHookController`，`load` / `unload` 对位 `hero.ts:82` / `:453` |
| #04-02-R-08 | 跟随者增删钩子（`onAddFollower` / `onRemoveFollower` / `onRemoveAllFollowers`） | `packages-user/client-modules/src/render/map/extension/hero.ts:502` `packages-user/client-modules/src/render/map/extension/hero.ts:506` `packages-user/client-modules/src/render/map/extension/hero.ts:510` `packages-user/client-modules/src/render/map/extension/hero.ts:341` | `packages-user/data-base/src/hero/types.ts:486` `packages-user/data-base/src/hero/types.ts:492` `packages-user/data-base/src/hero/types.ts:499` | 渲染端需改 | 现行 `IHeroFollowersControllerHooks` 参数为 `(follower: IHeroFollower, index)`，渲染端按 `(number, string)` / `(string, boolean)`；`onRemoveAllFollowers` 无同名钩子，最接近 `IHeroFollowersController.removeAllFollowers()`（`types.ts:556`） |
| #04-02-R-09 | `HeroKeyMover` 单步启动期望（`oneStep` / `startMove(false, false, false, true)`） | `packages-user/client-modules/src/action/move.ts:125` `packages-user/client-modules/src/action/move.ts:126` | `packages-user/data-common/src/common/mover.ts:293` `packages-user/data-common/src/common/mover.ts:350`；无对位，最接近：`packages-user/data-base/src/hero/mover.ts:22` | 渲染端需改 | `oneStep` / `startMove(...)` 在 `IObjectMover` 无同名方法；对应能力为 `step(dir)` + `start(): Readonly<IMoverController> | null`，需改为「追加步 + 启动」组合 |
| #04-02-R-10 | `controller.queue` / `controller.push({ type: 'dir', value })` | `packages-user/client-modules/src/action/move.ts:169` `packages-user/client-modules/src/action/move.ts:170` | 无对位，最接近：`packages-user/data-common/src/common/mover.ts:152` `packages-user/data-common/src/common/mover.ts:132` `packages-user/data-common/src/common/mover.ts:364` | 渲染端需改 | `IMoverController` 无 `queue` 成员（队列私有于 `ObjectMover.moveQueue`）；`push` 参数为 `ObjectMoveStep` 而非 `{ type: 'dir', value }`，渲染端需改构造 `IObjectMoveStepDir` |
| #04-02-R-11 | `controller.onEnd` / `controller.stop()` / `mover.on('stepEnd')` | `packages-user/client-modules/src/action/move.ts:130` `packages-user/client-modules/src/action/move.ts:137` `packages-user/client-modules/src/action/move.ts:145` `packages-user/client-modules/src/action/move.ts:180` | `packages-user/data-common/src/common/mover.ts:146` `packages-user/data-common/src/common/mover.ts:163` `packages-user/data-common/src/common/mover.ts:202` | 渲染端需改 | `onEnd` / `stop()` 有对位；`mover.on('stepEnd', ...)` 事件名订阅与 `IObjectMoverHooks.onStepEnd` 回调契约不同，需改订阅方式 |
| #04-02-R-12 | `IMapExtensionManager.heroMap` 键类型 / `addHero` / `removeHero` | `packages-user/client-modules/src/render/map/extension/types.ts:15` `packages-user/client-modules/src/render/map/extension/types.ts:27` `packages-user/client-modules/src/render/map/extension/types.ts:35` `packages-user/client-modules/src/render/map/extension/manager.ts:18` | `packages-user/data-base/src/hero/types.ts:303` `packages-user/data-base/src/hero/types.ts:399` | 渲染端需改 | 键类型 `IHeroMoveController` 需改为 `IHeroLocation` / `IHeroMover`；被注释接线 `client.ts:150` 以 `this.hero.mover`（`IHeroMover`）为参，与 `addHero(state: IHeroMoveController, ...)` 形状不一致 |

## 缺失接口候选

本节登记「渲染端需要而数据端无对位」的**候选**；只记录、不设计、不修复（D-13），未经用户裁决不视为最终缺失清单。

### #04-02-G-01：勇士移动语义钩子族（onMoveHero / onJumpHero / onTurnHero / onStartMove / onEndMove）

- **渲染端需求**：`MapHeroHook` 需要按方向 / 时长的移动语义钩子（`onMoveHero(direction, time)` / `onJumpHero(x, y, time, waitFollower)` / `onTurnHero(direction)` / `onStartMove()` / `onEndMove()`）来驱动 `MapHeroRenderer.move` / `jumpTo` / `turn` / `startMove` / `waitMoveEnd`（`packages-user/client-modules/src/render/map/extension/hero.ts:469` 起）。
- **数据端现状**：无同名对位；最接近的是面向数据对象事件的 `IObjectMoverHooks`（`packages-user/data-common/src/common/mover.ts:166`，含 `onMoveStart` / `onMoveEnd` / `onStepStart` / `onStepEnd` / `onSetPos`）与 `IHeroLocationHooks`（`packages-user/data-base/src/hero/types.ts:277`，含 `onSetPos`），其参数为 `(tile, mover)` 数据对象而非渲染语义。
- **待确认**：应由数据端补齐渲染语义钩子，还是渲染端改接数据对象钩子（可能与本表 `#04-02-R-01` 及 `#04-02-R-04` 的整体重构方案重叠）？留待用户裁决（D-13）。

### #04-02-G-02：HeroKeyMover 依赖的 oneStep 与控制器 queue

- **渲染端需求**：`HeroKeyMover.tryStartMove` / `onStepEnd` 依赖 `mover.oneStep(dir)` 与 `controller.queue` / `controller.push({ type: 'dir', value })`（`packages-user/client-modules/src/action/move.ts:125`、`:169`、`:170`）。
- **数据端现状**：无同名对位；最接近的是 `IObjectMover.step(dir, count?)`（`packages-user/data-common/src/common/mover.ts:293`）、`IMoverController.push(...steps)`（`packages-user/data-common/src/common/mover.ts:152`）与私有队列 `ObjectMover.moveQueue`（`packages-user/data-common/src/common/mover.ts:364`，`IMoverController` 不暴露队列）。
- **待确认**：`oneStep` 的单步语义与队列可读性应由数据端补齐，还是渲染端改为只用 `step` + `push`（不读取队列）？留待用户裁决（D-13）。

**候选结论：** 本步登记 2 项缺失接口候选（未经用户裁决，不视为最终缺失清单，见 D-13）

## 未能从阅读确定（未猜测）

1. **`controller.queue` 的运行时形状与 `IMoverController` 可达性**：渲染端 `action/move.ts:169` 读取 `con.queue.length`，但 `IMoverController`（`data-common/src/common/mover.ts:142`）无队列成员；队列在 `ObjectMover` 内为受保护成员（`mover.ts:364`）。渲染端是否曾依赖某个已删除的控制器扩展面，无法静态定论。
2. **`state.hero.location` 是否为当前渲染端可取的入口**：`IHeroState.location` → `IHeroLocation`（`data-base/src/hero/types.ts:889`、`:303`）在静态契约上可达；但 `state` 单例（`data-state/src/ins.ts:10`）运行时是否已暴露与渲染端期望一致的取法，无法仅凭静态阅读确认。
3. **钩子合并关系**：渲染端 `MapHeroHook`（`hero.ts:457`）与数据端 `IObjectMoverHooks` / `IHeroLocationHooks` / `IHeroFollowersControllerHooks` 的合并方式无法静态定论（见 `#04-02-R-01` / `#04-02-G-01`）。
4. **移动语义钩子候选与 04-01「未能从阅读确定」第 2 条的重叠关系**：04-01 已登记「勇士 / 跟随者渲染粒度钩子」候选；该条中的贴图 / alpha 子项按 D-18 排除，本步只保留移动子项（`#04-02-G-01`），二者是否应合并为单一缺失项无法静态定论。
5. **`state.roleFace` 的可达性**：渲染端在 `hero.ts:225` / `:348` / `:407` 读取 `state.roleFace.getFaceOf(...)`，该成员属于本增量对账面还是渲染侧局部能力，无法从勇士移动契约静态定论。
6. **`IMapHeroRenderer.waitMoveEnd` 签名落差**：接口声明带参（`packages-user/client-modules/src/render/map/extension/types.ts:103`），实现无参（`packages-user/client-modules/src/render/map/extension/hero.ts:295`）；属渲染端内部签名落差还是与数据端钩子契约相关，无法静态定论。
7. **`stepEnd` 事件来源**：渲染端订阅 `mover.on('stepEnd', ...)`（`action/move.ts:137`），数据端现行钩子为 `IObjectMoverHooks.onStepEnd`（`mover.ts:202`）回调而非事件发射器事件；事件名与回调的桥接方式无法静态定论。

## 处置

- **本步性质**：只读接口探索，**未修改任何生产代码**；被查渲染端两包相对「扫描前基线」零新增改动（用户既有的 `packages-user/client-base/src/load/**` 改动保持原样，不回滚 / 不暂存 / 不提交）。
- **适配工作**：勇士移动适配实施（04-03+）**未在本 run 规划**，由用户在本探索结果与缺失候选裁决后另行规划（D-17 / D-13）。
- **显式排除项**：`HeroRendering` 渲染状态（D-18：`IHeroRendering` / 勇士贴图别名 / `onSetImage` / `onSetAlpha` / `onSetFollowerAlpha` —— 用户先改数据端，之后再处理）与 legacy `core.*`（D-12 —— 属第五阶段）。二者不产生任何对账行或缺失候选。
- **范围的另一侧**：勇士移动契约与移动钩子（`IObjectMover` / `IHeroMover` / `IHeroLocationHooks` / `IHeroFollowersControllerHooks` / `IHeroStateHooks`，`onMoveHero` / `onJumpHero` / `onTurnHero` / `onStartMove` / `onEndMove` 等）**在范围内**，照常登记。
- **缺失接口裁决**：缺失接口候选须经用户逐步裁决（D-13），本步只记录、不设计、不修复，未经裁决不视为最终缺失清单。
- **`getHeroStatusOn` 类裸函数**（D-11）属 UI 属性读取，不属本增量范围，不登记为缺失。
- **只读门禁**：相对基线的零变化（porcelain 条目集合逐条一致 + `基线摘要 sha256` 未变）由机器门禁判定；本 run 只新增本交付文档一个文件，未规划 04-03+ 适配。
