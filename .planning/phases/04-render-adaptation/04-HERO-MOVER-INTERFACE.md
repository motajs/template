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

（Task 2 横向补齐成员级清单）

- **`IObjectMovable`**（`x` / `y` / `setPos` / `getCurrentFaceDirection`）：`packages-user/data-common/src/common/mover.ts:47`
- **`IHeroMover<T>`**（`config` / `getConfig` / `useTopImplementation`，extends `IObjectMover<T>`）：`packages-user/data-base/src/hero/types.ts:399`
- **barrel 实际导出核对**：`packages-user/data-common/src/index.ts:1` → `packages-user/data-common/src/common/index.ts:4`；`packages-user/data-base/src/index.ts:3` → `packages-user/data-base/src/hero/index.ts:8`

## 渲染端现状

（Task 2 横向补齐使用点清单）

- **`MapHeroRenderer` 构造器**（`hero.addHook` / `hero.x` / `hero.y` / `hero.direction`）：`packages-user/client-modules/src/render/map/extension/hero.ts:76`
- **`hero.addHook(new MapHeroHook(this))`**：`packages-user/client-modules/src/render/map/extension/hero.ts:81`
- **`HeroKeyMover`**（移动器使用面）：`packages-user/client-modules/src/action/move.ts:11`

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
