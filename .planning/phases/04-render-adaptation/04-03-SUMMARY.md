---
phase: 04-render-adaptation
plan: 3
subsystem: render
tags: [hero, renderer, hooks, IHeroLocation, passive-render]
requires: [{ phase: "04-render-adaptation", provides: "04-01 只读对账账本与 04-02 勇士移动接口探索账本（#04-02-R-01..12）" }]
provides:
- "勇士渲染拓展绑定 IHeroLocation 并订阅数据端现有钩子 IHeroLocationHooks / IObjectMoverHooks（D-21）"
- "IMapHeroRenderer 按 D-20 裁剪外部驱动成员的完全被动契约"
affects: [render-adaptation, dual-layout, client-modules]
key-files:
  created: []
  modified: [packages-user/client-modules/src/render/map/extension/hero.ts, packages-user/client-modules/src/render/map/extension/types.ts, packages-user/client-modules/src/render/map/extension/manager.ts]
key-decisions: ["渲染端勇士本体绑定 IHeroLocation，经 hero.addHook / hero.mover.addHook 订阅数据端现有钩子（D-21），不新增数据端接口", "IMapHeroRenderer 按 D-20 删除 8 个外部驱动成员声明，勇士渲染改为完全被动，类内实现方法保留", "D-18 贴图别名 hero.image 只做最小编译桥接（读取收敛为一处 + 既有 // @ts-expect-error 惯用法标注），不重设贴图来源"]
requirements-completed: []
coverage:
- id: D1
  description: "三个在范围文件把勇士渲染绑定到 IHeroLocation 并通过数据端现有钩子被动驱动渲染"
  requirement: REND-01
  verification: [{ kind: unit, ref: "pnpm exec vue-tsc --noEmit（scoped render/map/extension/{hero,types,manager}.ts 命中 0 条）", status: pass }]
  human_judgment: true
  rationale: "MapExtensionManager.addHero 未被接线（client.ts:148-152 为注释），运行时渲染无法观察；本计划验收为编译 + 契约 + 静态机器门禁 + 人工代码复核，钩子映射语义需人工确认。"
- id: D2
  description: "REND-01 / REND-02 保持 Pending；本增量仅交付勇士本体子切片，未实施其余渲染适配与双布局"
  verification: []
  human_judgment: true
  rationale: "REND-01 / REND-02 的验收边界未提供（FLAGGED ASSUMPTION），本计划不发明阈值，需用户补齐边界判据。"
actuals:
  tokens: 6288
  tasks: 4
  commits: 3
  plan_head_before: f6cd9588767ab779d5f6114bf9167b9b4039b4f0
metrics:
  duration: ~40min
  completed: 2026-09-18
  status: complete
---

# Phase 04 Plan 03: 勇士本体被动适配 Summary

**渲染端勇士本体绑定 `IHeroLocation` 并改为订阅数据端现有钩子（`IHeroLocationHooks` / `IObjectMoverHooks`），`IMapHeroRenderer` 按 D-20 裁剪为完全被动契约，三个在范围文件清零旧控制器类型与旧钩子名。**

## 改动文件清单与职责

- `packages-user/client-modules/src/render/map/extension/manager.ts` — 绑定层：`heroMap` / `addHero` / `removeHero` 的键与参数由 `IHeroMoveController` 改为 `IHeroLocation`；删除首行 `// @ts-expect-error 需要重构` 并合并 import。
- `packages-user/client-modules/src/render/map/extension/types.ts` — 契约层：`IMapExtensionManager` 勇士键 / 参数改为 `IHeroLocation`；`IMapHeroRenderer` 按 D-20 删除 8 个外部驱动成员声明（`setHeroAnimateDirection` 随类型改名在 Task 1 删除，其余 7 个在 Task 2 删除），保留 D-18 / D-22 成员。
- `packages-user/client-modules/src/render/map/extension/hero.ts` — 勇士渲染拓展本体：构造器绑定 `IHeroLocation`；`hero.addHook`（`IHeroLocationHooks`）+ `hero.mover.addHook`（`IObjectMoverHooks<IHeroLocation>`）两次注册与 `locationController` / `moverController` 两字段；`MapHeroHook` 实现现有钩子成员名（`onSetPos` / `onMoveStart` / `onMoveEnd` / `onStepEnd` / `onSetFaceDir`），删除 6 个旧钩子方法名；动画方向改用 `ObjectAnimDirection` + `mover.currAnimDir`；`hero.image` 收敛为一处 D-18 编译桥接。

## 执行前核对（Task 1 步骤 0a）

逐条打开当日 HEAD 数据端文件确认（结论 + `file:line`）：

| # | 复核项 | 结论 | 锚点 |
|---|--------|------|------|
| ① | `IHeroState.location: IHeroLocation` 存在 | 一致 | `packages-user/data-base/src/hero/types.ts:894` |
| ② | `IHeroLocation extends ISaveableContent<IHeroLocationSave>, IObjectMovable, IHookable<IHeroLocationHooks>, IDataCommonExtended` 且含 `readonly mover: IHeroMover<this>` | 一致 | `packages-user/data-base/src/hero/types.ts:303-314` |
| ③ | `IHeroLocationHooks.onSetPos?(x, y)` 与 `onSetFloor?(map)` | 一致 | `packages-user/data-base/src/hero/types.ts:283` / `:289` |
| ④ | `IObjectMoverHooks` 七成员 `onMoveStart` / `onMoveEnd` / `onStepStart` / `onStepEnd` / `onSetPos` / `onSetFaceDir` / `onSetMoveDir` 与参数形态 | 一致 | `packages-user/data-common/src/common/mover.ts:166-233` |
| ⑤ | `IObjectMover` 的 `moving` / `tile` / `faceDirection` / `moveDirection` / `currAnimDir` / `currentSpeed`；`getCurrentFaceDirection()` | 一致 | `packages-user/data-common/src/common/mover.ts:239-249`；`mover.ts:63`、`packages-user/data-base/src/hero/location.ts:65` |
| ⑥ | `ObjectAnimDirection` / `ObjectMoveType` / `ObjectSpecialStep` 仍由 `@user/data-common` 导出 | 一致 | `packages-user/data-common/src/common/mover.ts:40` / `:14` / `:33`；barrel `data-common/src/common/index.ts:4`、`data-common/src/index.ts:1` |
| ⑦ | `HeroLocation.setPos` 触发 `onSetPos`；`ObjectMover.moveProgress` 的 `onStepEnd` 在 `tile.setPos` 之后 | 一致 | `packages-user/data-base/src/hero/location.ts:59-63`；`packages-user/data-common/src/common/mover.ts:671-678` |

**结论：** 七条全部与规划基线一致，未发现差异，继续执行。

## 执行前基线（Task 1 步骤 0b）

Task 1 起始 `git status --porcelain`（排除 `packages-user/client-modules/src/render/map/extension/` 与 `.planning/phases/04-render-adaptation/` 两个前缀后）**原样**记录：

```text
 M .planning/STATE.md
 M .planning/state.json
 M packages-user/client-base/src/load/loader.ts
 M packages-user/client-base/src/load/types.ts
 M packages-user/data-base/src/load/loader.ts
 M packages-user/data-base/src/load/types.ts
 M packages-user/data-state/src/core.ts
 M packages-user/data-state/src/types.ts
 M packages/loader/src/progress.ts
 M packages/loader/src/types.ts
?? .planning/milestone.lock
```

基线摘要 sha256=d61b8915cca70783bfd2cc89f072bb4d8761e7290a028696f57ec3ae11cc761b

说明：执行起始时工作树与规划时预期集合略有漂移——规划时列出的 `.planning/phases/04-render-adaptation/04-CONTEXT.md` 已不再处于未提交状态；新增 `.planning/STATE.md`、`.planning/state.json` 两条（GSD 编排状态文件）。本计划仅记录当日实际基线，**不回滚 / 不暂存 / 不提交 / 不修改**其中任何用户并发改动。

## 类型门禁基线（Task 1 步骤 0c）

执行 `pnpm exec vue-tsc --noEmit`（整仓非 0 退出属预期，共 122 条诊断）。`client-modules` 命中行恰为 2 条，与规划记录一致：

```text
packages-user/client-modules/src/client.ts(66,9): error TS2554: Expected 1 arguments, but got 0.
packages-user/client-modules/src/render/ui/load.tsx(77,31): error TS2504: Type 'ITaskManager' must have a '[Symbol.asyncIterator]()' method that returns an async iterator.
```

三个在范围文件（`render/map/extension/{hero,types,manager}.ts`）当前 0 条诊断。

## #04-02-R-01..12 对账 → 本计划处置对照

| ID | 对账结论 | 本计划处置 |
|----|----------|------------|
| R-01 `IHeroMoveControllerHooks` 钩子族 | 渲染端需改 | 已覆盖：改接 `IHeroLocationHooks` / `IObjectMoverHooks` 现有成员名（D-21），旧名删尽 |
| R-02 `HeroMover` / `IMoveController`（`action/move.ts`） | 渲染端需改 | 不在本计划（D-19：移动控制交由用户手动处理） |
| R-03 `HeroAnimateDirection` | 渲染端需改 | 已覆盖：改用 `ObjectAnimDirection` |
| R-04 `IHeroMoveController` | 渲染端需改 | 已覆盖：改用 `IHeroLocation` |
| R-05 `hero.x` / `hero.y` | 匹配 | 保持（`IHeroLocation extends IObjectMovable`） |
| R-06 `hero.direction` | 渲染端需改 | 已覆盖：构造期 `getCurrentFaceDirection()`；移动/朝向读 `mover.faceDirection` / `moveDirection` |
| R-07 `hero.addHook` | 匹配 | 保持，并新增 `hero.mover.addHook` 一次注册 |
| R-08 跟随者增删钩子 | 渲染端需改 | 不在本计划（D-22 暂缓；跟随者成员与钩子方法逐字保留） |
| R-09 `oneStep` / `startMove(false,false,false,true)` | 渲染端需改 | 不在本计划（D-19 / #04-02-G-02） |
| R-10 `controller.queue` / `controller.push({type:'dir'})` | 渲染端需改 | 不在本计划（D-19） |
| R-11 `controller.onEnd` / `stop()` / `mover.on('stepEnd')` | 渲染端需改 | 部分：`action/move.ts` 属 D-19 不在本计划；渲染端钩子订阅改接现有钩子（`onMoveEnd` / `onStepEnd`） |
| R-12 `heroMap` / `addHero` / `removeHero` | 渲染端需改 | 已覆盖：键与参数改为 `IHeroLocation` |

未确定项消费：04-02「未能从阅读确定」第 2 条（`state.hero.location` 可达性）由 Task 1 步骤 0a ①/② 确认；第 7 条（`stepEnd` 桥接）由 `IObjectMoverHooks.onStepEnd` 在 `tile.setPos` 之后触发确认；第 6 条（`IMapHeroRenderer.waitMoveEnd` 签名落差）随 D-20 删除接口声明而消解。

## 机器门禁输出摘要

Task 1 / Task 2 / Task 3 均复跑，实际输出如下：

- scoped 类型门禁：`OK in-scope type errors 0; client-modules baseline 2`（三个在范围文件 0 条；`client-modules` 错误集 == 两条记录基线）
- 静态改名门禁：`OK static rename gate`（旧类型名 / 旧钩子方法名以独立 token 判定不复现；`IHeroLocation` / `ObjectAnimDirection` / `getCurrentFaceDirection` / `hero.addHook` / `hero.mover.addHook` / `locationController` / `moverController` 均存在）
- D-20 契约门禁：`OK D20 passive contract / D18 D22 preserved`
- D-18 / D-22 保留门禁：`OK mapping + D18 D22 hook members`
- ESLint：三文件 0 错误（`pnpm exec eslint` 退出码 0，含 `--fix` 后复跑）
- CRLF 门禁：`OK CRLF`（三个源文件与 SUMMARY 均无孤立 LF）
- 范围门禁（基线感知）：`OK scope (baseline-aware)`（无基线之外的范围外生产文件改动）
- 并发改动基线门禁：`OK user concurrent edits unchanged`（porcelain 条目集合与内容 sha256 与记录基线一致）

`client-modules` 基线两条原样：

```text
client.ts(66,9): error TS2554
render/ui/load.tsx(77,31): error TS2504
```

## 人工复核（Task 3 步骤 4）

1. 逐钩子映射与 Task 0 汇报并经用户确认的映射表一致：`IHeroLocationHooks.onSetPos(x,y)`（`data-base/src/hero/location.ts:59-63`）→ 非移动中 `setPosition`；`IObjectMoverHooks.onMoveStart`（`mover.ts:651-656`）→ `startMove()`；`onMoveEnd`（`mover.ts:682-686`）→ `await waitMoveEnd()`；`onStepEnd`（`mover.ts:675-678`，坐标已更新）→ 设 `currAnimDir` 动画方向 + 按 `step.type` 分派；`onSetFaceDir`（`mover.ts:529-534`）→ `turn(dir)`。
2. `onSetPos` 的「移动中 return」守卫正确：`this.hero.hero.mover.moving` 为真时不瞬时吸附，逐格定位交由 `onStepEnd` 做移动动画。
3. `onStepEnd` 的 `ObjectMoveType` 分派覆盖 `Dir` / `DirFace` / `Special` / `Face` / `Teleport` / `Jump`；`AnimDir` / `Speed` 确无渲染动作（动画方向已在开头由 `currAnimDir` 设置，速度由数据端消费）。
4. D-18 编译桥接只收敛了一处 `hero.image` 读取（`const imageAlias = hero.image;` + 新增 `// @ts-expect-error 需要重构（…D-18…）`），既有 `logger.warn(88/89)` 分支结构未变。
5. D-18 / D-22 成员逐字保留：`setImage` / `setAlpha` / `setFollowerAlpha` / `onSetImage` / `onSetAlpha` / `onSetFollowerAlpha` 与跟随者族 `addFollower` / `removeFollower` / `removeAllFollowers` / 三钩子方法均未被删除或改写语义（由 D-18 / D-22 保留门禁输出确认）。
6. 未新增任何公共接口成员：`IMapHeroRenderer` / `IMapExtensionManager` 的成员集合只减不增。
7. 运行时 UAT 不可得已写明：`MapExtensionManager.addHero` 当前无调用点，`client.ts:148-152` 的 `addHero(this.hero.mover, layer)` 仍为注释，故勇士渲染拓展在运行时未启用，本计划不接线 `client.ts`。

## 未实现项清单

- `onStepStart`：不实现（渲染只在新坐标就绪后由 `onStepEnd` 推进，避免重复驱动）。
- `onSetMoveDir`：不实现（渲染朝向只随 `onSetFaceDir` 变化；`moveDirection` 已由 `onStepEnd` 读取）。
- `IHeroLocationHooks.onSetFloor`：不实现（楼层切换需要重绑图层的接线路径，本增量不接线 `client.ts`；登记为后续增量事项）。
- `client.ts` 的 `addHero` 接线启用：未做（本计划明确不接线）。
- `hero.image` 贴图来源：未重设（D-18，待用户先改数据端后处理）。
- `action/move.ts` 与 `#04-02-G-02`（`oneStep` / 控制器队列）：未做（D-19，交由用户手动处理）。
- 跟随者位置 / 动画归属：未做（D-22 暂缓）。
- 其余 ① 错配（`#04-01-M-06..09`）与 42 条 ③ 多余旧路径、移动端 / 桌面端双布局（REND-02）：未做。

## REND-01 / REND-02 状态

REND-01 / REND-02 在本 run 后**仍保持 Pending**：本计划只完成「勇士本体适配（渲染端被动重接）」一个子切片，未实施其余渲染适配与移动端 / 桌面端双布局（两条 FLAGGED ASSUMPTION）。

**运行时 UAT 不可得（诚实降级）：** 渲染端无测试设施，且 `MapExtensionManager.addHero` 当前**未被接线**（`client.ts:148-152` 仍为注释），故运行时渲染无法观察。本计划实际验证为「编译 + 契约 + 静态」三类机器门禁（scoped 类型 / 静态改名 / D-20 契约 / D-18·D-22 保留 / eslint / CRLF / 范围 / 并发改动基线）加人工代码复核；**未以任何不可运行的门禁冒充通过**。运行时渲染 UAT 顺延到启用接线的增量。

## Task Commits

- `a3826bf` — `refactor(04-03): rebind hero renderer to IHeroLocation and existing hooks`（仅三个源文件）
- 本 SUMMARY 由计划内的 `docs(04-03): record execution state` 提交（仅本文件）
- 计划元数据（STATE.md / ROADMAP.md）由后续元数据提交处理

## Deviations from Plan

None - 计划按原文执行（三个文件、命名清单、D-18 编译桥接与全部机器门禁均照计划落地）。

## Known Stubs

None。`addHeroMoving` 中的 `// @ts-expect-error 需要重构（…D-18…）` 是计划预批准的**最小编译桥接**，不是占位实现：其运行分支与既有 `logger.warn(88/89)` 语义保持不变，贴图来源归属留待 D-18 增量。
