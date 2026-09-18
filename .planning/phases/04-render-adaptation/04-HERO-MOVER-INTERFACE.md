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

## 缺失接口候选

（Task 3 补齐：候选登记与结论行）

## 未能从阅读确定（未猜测）

（Task 3 补齐：无法静态定论项）

## 处置

- **本步性质**：只读接口探索，**未修改任何生产代码**；被查渲染端两包相对「扫描前基线」零新增改动（用户既有的 `packages-user/client-base/src/load/**` 改动保持原样，不回滚 / 不暂存 / 不提交）。
- **适配工作**：勇士移动适配实施（04-03+）**未在本 run 规划**，由用户在本探索结果与缺失候选裁决后另行规划（D-17 / D-13）。
- **显式排除项**：`HeroRendering` 渲染状态（D-18：`IHeroRendering` / 勇士贴图别名 / `onSetImage` / `onSetAlpha` / `onSetFollowerAlpha` —— 用户先改数据端，之后再处理）与 legacy `core.*`（D-12 —— 属第五阶段）。二者不产生任何对账行或缺失候选。
- **范围的另一侧**：勇士移动契约与移动钩子（`IObjectMover` / `IHeroMover` / `IHeroLocationHooks` / `IHeroFollowersControllerHooks` / `IHeroStateHooks`，`onMoveHero` / `onJumpHero` / `onTurnHero` / `onStartMove` / `onEndMove` 等）**在范围内**，照常登记。
- **缺失接口裁决**：缺失接口候选须经用户逐步裁决（D-13），本步只记录、不设计、不修复，未经裁决不视为最终缺失清单。
- **`getHeroStatusOn` 类裸函数**（D-11）属 UI 属性读取，不属本增量范围，不登记为缺失。
