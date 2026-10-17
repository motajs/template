---
phase: 04-render-adaptation
plan: 4
subsystem: render
tags: [hero, renderer, hooks, IFaceManager, FaceGroup, passive-render]
requires: [{ phase: "04-render-adaptation", provides: "04-03 勇士本体被动适配（hero.ts 绑定 IHeroLocation 与现有钩子）" }]
provides:
- "勇士渲染朝向计算改用注入的 IFaceManager 的 Dir4FaceHandler（degrade/next）与勇士自身 mover.faceHandler（movement）"
- "MapHeroHook 拆为 MapHeroLocationHook / MapHeroMoverHook 并各自注册；onSetPos 无条件"
- "onStepEnd 的 AnimDir 分支按 step.dir 设置动画方向；hero.ts 改用 @motajs/animate 的 ExcitationCurve2D"
affects: [render-adaptation, dual-layout, client-modules]
key-files:
  created: []
  modified: [packages-user/client-modules/src/render/map/extension/hero.ts, packages-user/client-modules/src/render/map/extension/types.ts, packages-user/client-modules/src/render/map/extension/manager.ts]
key-decisions:
- "D-29 注入路径 B：IMapExtensionManager.addHero 新增 faceManager: IFaceManager 形参，manager.ts 转发给 MapHeroRenderer 构造器"
- "degrade/next 走 faceManager.get<FaceDirection>(FaceGroup.Dir4) 派生的 Dir4FaceHandler（贴图四向），movement 走 hero.mover.faceHandler（Dir8）"
- "MapHeroHook 拆为 MapHeroLocationHook / MapHeroMoverHook；onSetPos 只在 location 类一次且无条件"
- "D-27 仅 hero.ts：mutate-animate 的 TimingFn<2> 改为 @motajs/animate 的 ExcitationCurve2D"
requirements-completed: []
actuals:
  tokens: 1102
  tasks: 4
  commits: 2
  plan_head_before: 2169af4c67f21e3f484097342d7b69959c8a925b
metrics:
  duration: ~45min
  completed: 2026-09-19
  status: complete
---

# Phase 04 Plan 04: 勇士渲染修正 Summary

**按用户对 04-03 的人工审查裁定 D-24..D-28 与 D-29 修订，把 `render/map/extension/` 的勇士渲染从三个弃用 helper 改到注入的 `IFaceManager`（`degrade`/`next` 走 `Dir4FaceHandler`、`movement` 走 `hero.mover.faceHandler`），拆开重复触发的钩子类并去掉陈旧守卫、补上 AnimDir 设置、把 `hero.ts` 的 `mutate-animate` 换成 `@motajs/animate`。**

## 改动文件清单与职责

- `packages-user/client-modules/src/render/map/extension/types.ts` — 契约层：`IMapExtensionManager.addHero` 新增 `faceManager: IFaceManager` 形参（D-29，唯一契约面变化）；新增 `import { IFaceManager } from '@user/data-common'`。`IMapHeroRenderer` 与其余成员集合零增删，既有 jsDoc 逐字保留（未新增 `@param` 行，按 Task 0 默认）。
- `packages-user/client-modules/src/render/map/extension/manager.ts` — 注入层：`addHero(state, layer, faceManager)` 把 `faceManager` 转发为 `new MapHeroRenderer(this.renderer, layer, state, faceManager)` 的第 4 实参；`heroMap` / `removeHero` / `addDoor` / `removeDoor` / `addText` / `removeText` / `destroy` 未动。
- `packages-user/client-modules/src/render/map/extension/hero.ts` — 勇士渲染拓展本体：构造器新增 `readonly faceManager: IFaceManager` 与派生字段 `readonly dir4: IFaceHandler<FaceDirection>`（`faceManager.get<FaceDirection>(FaceGroup.Dir4)!`）；7 处弃用 helper 替换；`MapHeroHook` 拆为 `MapHeroLocationHook` / `MapHeroMoverHook`；`onSetPos` 无条件；`onStepEnd` 补 AnimDir；`mutate-animate` → `@motajs/animate`。

## D-24..D-29 逐条处置对照

| 决策 | 处置 | 落点 |
|------|------|------|
| D-24 / D-29 | 7 处弃用 helper 全改走注入处理器；三个弃用名字（含 import）在三个在范围文件以独立 token 判定清零 | `hero.ts:134`、`:204`、`:232-233`、`:360-362`、`:369-374`、`:462` |
| D-24 细节 | `:357`（原 `addFollower`）对 `dir4.degrade(last.nextDirection)` 的结果显式判 `FaceDirection.Unknown` → `FaceDirection.Down` | `hero.ts:360-362` |
| D-29 契约 | `addHero` 增 `faceManager: IFaceManager` 形参；`manager.ts` 转发 | `types.ts:18`、`manager.ts:29-32` |
| D-25 | 两个内部类分别注册到 `hero` / `hero.mover`，各持一个 `IHookController`；`onSetPos` 只在 location 类一次、无条件 | `hero.ts:84-88`、`:477-512`、`:514-564` |
| D-26 | `ObjectMoveType.AnimDir` 分支按 `step.dir` 调 `setHeroAnimateDirection`；`Speed` 仍 `break` | `hero.ts:553-557` |
| D-27 | `import { ExcitationCurve2D } from '@motajs/animate'`；`generateJumpFn` 返回 `ExcitationCurve2D`；仅 `hero.ts` | `hero.ts:18`、`:258` |
| D-28 | `import { state } from '@user/data-state'` 与三处 `state.roleFace.getFaceOf(...)` 逐字保留 | `hero.ts:19`、`:238`、`:363`、`:426` |

**逐调用替换映射表（7 处，旧行号为改动前锚点）：**

| 旧调用 | 新调用 | 等价性 |
|--------|--------|--------|
| `degradeFace(hero.getCurrentFaceDirection())` `:132` | `this.dir4.degrade(hero.getCurrentFaceDirection())` | **等价**（斜向折叠相同、正交恒等、`Unknown→Unknown`） |
| `degradeFace(this.hero.getCurrentFaceDirection())` `:202` | `this.dir4.degrade(this.hero.getCurrentFaceDirection())` | 同上 |
| `degradeFace(last.nextDirection, FaceDirection.Down)` `:357` | `this.dir4.degrade(...)` + 显式 `Unknown→Down` 回退 | **等价**（`IFaceHandler.degrade` 无 `unknown` 形参，加回退后与旧 helper 的 `unknown` 形参逐字等价） |
| `getFaceMovement(direction)` `:230` | `this.hero.mover.faceHandler.movement(direction)` | **全输入域等价**（勇士自身 `mover.faceHandler` 为 Dir8） |
| `getFaceMovement(last.nextDirection)` `:364` | `this.hero.mover.faceHandler.movement(last.nextDirection)` | 同上 |
| `getFaceMovement(last.direction)` `:365` | `this.hero.mover.faceHandler.movement(last.direction)` | 同上 |
| `nextFaceDirection(this.heroEntity.direction)` `:453` | `this.dir4.next(this.heroEntity.direction)` | **仅正交输入等价**（均 90° 顺时针，`Up→Right`）；斜向输入分叉：旧 helper 在斜向间旋转（`LeftUp→RightUp`），`Dir4` 先退化再旋转（`LeftUp→Left→Up`）——仅无参 `turn()` 路径可达，仓库内无内部调用者（`:515`/`:520`/`:539` 均显式传参），`heroEntity.direction` 期望正交，属潜性差异 |

**语义映射实测：** 当日 `Dir4FaceHandler` 注册到 `FaceGroup.Dir4`、`Dir8FaceHandler` 注册到 `FaceGroup.Dir8`（`core.ts:117`/`:119`）；`hero.mover.faceHandler` 装配为 `Dir8FaceHandler`（`core.ts:116` → `:143` → `state.ts:55` → `location.ts:42`）。

## 执行前核对（Task 1 步骤 0a）

逐条打开当日 HEAD 数据端文件确认（结论 + `file:line`）：

| # | 复核项 | 结论 | 锚点 |
|---|--------|------|------|
| ① | `IFaceHandler<T extends number>` 七成员（`degrade`/`movement`/`move`/`opposite`/`next`/`mapDirection`/`mapMovement`）；`movement` 返回 `IFaceDescriptor { readonly x; readonly y }`；`degrade` 对 Unknown 返回 Unknown | 一致 | `packages/common/src/utils/types.ts:145-197` |
| ② | `IFaceManager.get<T extends number>(group): IFaceHandler<T> \| null`；`FaceGroup.Dir4` / `Dir8` | 一致 | `packages-user/data-common/src/common/faceManager.ts:13-39` / `:6-11` |
| ③ | 当日装配 `Dir4FaceHandler` → `FaceGroup.Dir4`、`Dir8FaceHandler` → `FaceGroup.Dir8` | 一致 | `packages-user/data-state/src/core.ts:115-120` |
| ④ | `Dir4FaceHandler.degrade` 折叠斜向 + `Unknown→Unknown`；`next` 先 degrade 再 90° 顺时针 | 一致 | `packages-user/data-common/src/common/faceManager.ts:169-193` |
| ⑤ | `IObjectMover.faceHandler: IFaceHandler<FaceDirection>` | 一致 | `packages-user/data-common/src/common/mover.ts:251` |
| ⑥ | `IHeroMover<T> extends IObjectMover<T>`；`IHeroLocation.mover: IHeroMover<this>` | 一致 | `packages-user/data-base/src/hero/types.ts:399` / `:303-314` |
| ⑦ | `HeroLocation` 由 `IFaceHandler<FaceDirection>` 构造 `HeroMover`；装配链 `dir8`（`core.ts:116`）→ `HeroState(this, dir8, …)`（`:143`）→ `HeroLocation(state, defaultLoc, faceHandler)`（`state.ts:55`）→ `new HeroMover(this, faceHandler)`（`location.ts:42`），故 `hero.mover.faceHandler` 为 `Dir8FaceHandler` | 一致 | `packages-user/data-base/src/hero/location.ts:33-45` |
| ⑧ | 三个弃用 helper 仍导出且签名如记录（「待替换物尚在」的核对） | 一致 | `packages-user/data-common/src/common/utils.ts:8` / `:37` / `:64` |
| ⑨ | `hero.ts` 7 处调用行号仍为 `:132`/`:202`/`:230`/`:357`/`:364`/`:365`/`:453`，import 行仍为 `:2`/`:4`/`:7` | 一致 | `packages-user/client-modules/src/render/map/extension/hero.ts` |
| ⑩ | 注入侧处理器：`faceManager.get(FaceGroup.Dir4)` 返回 `Dir4FaceHandler`；`hero.mover.faceHandler` 为 `Dir8FaceHandler`（非计划外处理器） | 一致 | `faceManager.ts:117-120`、`location.ts:42` |

**结论：** 十项全部与规划基线一致，未发现差异，继续执行（未按记忆改代码）。

## 执行前基线（Task 1 步骤 0b）

Task 1 起始 `git status --porcelain`（排除 `packages-user/client-modules/src/render/map/extension/` 与 `.planning/phases/04-render-adaptation/` 两个前缀后）**原样**记录：

<!-- CONCURRENT-BASELINE:START -->
?? .planning/milestone.lock
<!-- CONCURRENT-BASELINE:END -->
基线摘要 sha256=ec6d2b5bc41cd1b89d25f6bea00ef5b821ad409b8018da692497d989d7fb84dc

说明：本次基线**未沿用** 04-03 SUMMARY 的旧列表——那批改动（`client-base/src/load/*` 等）已随 `4e64953 chore: 内部接口改名` 落库；当日实测工作树仅余 `.planning/milestone.lock` 一条未跟踪项。本计划**不回滚 / 不暂存 / 不提交 / 不修改**其中任何条目。

## 类型门禁基线（Task 1 步骤 0c）

`pnpm exec vue-tsc --noEmit`（整仓非 0 退出属预期，共 99 条诊断）后归一化 `client-modules/src` 命中行，**原样**记录：

<!-- TYPE-BASELINE:START -->
<!-- TYPE-BASELINE:END -->

当日实测：`client-modules` 命中 **0 条**（04-03 记录的 2 条 `client.ts(66,9)` / `render/ui/load.tsx(77,31)` 已不再出现，系用户并发改动落库改变了基线；按计划「以当日实测为准」，不静默沿用旧值）。三个在范围文件（`render/map/extension/{hero,types,manager}.ts`）当前 0 条诊断。

## 机器门禁输出摘要

Task 1 / Task 2 / Task 3 均复跑，实际输出如下（`node -e` 脚本因 shell 对 `'@` 序列的转义问题，改用等价临时脚本文件执行，逻辑与计划内联脚本逐字一致；`pnpm exec eslint` / `pnpm exec vue-tsc` 直接执行）：

- Task 1 scoped 类型门禁：`OK in-scope type errors 0; client-modules baseline 0`
- Task 1 D-24 / D-29 注入门禁：`OK D24 face handler injection (deprecated helpers 0; faceHandler wired)`
- Task 1 ESLint（三文件）：退出码 0
- Task 1 CRLF 门禁：`OK CRLF`
- Task 2 拆分门禁：`OK D25 split hooks / D26 AnimDir`
- Task 2 D-18 / D-22 保留门禁：`OK D18 D22 members preserved`
- Task 2 scoped 类型门禁：与 Task 1 同一 run（代码状态未变）——`OK in-scope type errors 0; client-modules baseline 0`
- Task 2 ESLint（hero.ts）：退出码 0
- Task 2 CRLF 门禁：`OK CRLF`
- Task 3 范围门禁（基线感知）：`OK scope (baseline-aware): out-of-scope extra 0`
- Task 3 并发改动基线门禁：`OK user concurrent edits unchanged entries 1`
- Task 3 静态门禁 A（D-24/D-25/D-26/D-28）：`OK final gates D24 D25 D26 D28 (getFaceOf=3)`
- Task 3 静态门禁 B（D-27 + D-18/D-22 契约）：`OK final D27 + D18 D22 preservation`
- Task 3 终验类型门禁：`OK final type gate: in-scope 0; client-modules baseline 0`
- Task 3 ESLint（三文件）：退出码 0
- Task 3 CRLF 门禁（三源文件）：`OK CRLF`
- Task 3 SUMMARY 完整性门禁：`OK summary completeness`

## 人工复核（Task 3 步骤 6）

1. **D-24 / D-29 7 处逐条对位**：见上「逐调用替换映射表」；当日实测 `FaceGroup.Dir4` → `Dir4FaceHandler`、`FaceGroup.Dir8` → `Dir8FaceHandler`，故 `degrade`/`next` 取四向处理器、`movement` 取勇士自身 `hero.mover.faceHandler`（Dir8）。结论：`degrade` 与旧 `degradeFace` **等价**（`:134`/`:204`）；`movement` 与旧 `getFaceMovement` **全输入域等价**（`:232-233`/`:369-374`）；`next` 与旧 `nextFaceDirection(face8=false)` **仅正交输入等价**（均 90° 顺时针 `Up→Right`），斜向分叉已记录（仅无参 `turn()` 路径可达，无内部调用者，`heroEntity.direction` 期望正交）。
2. **Down 回退（`:357` 细节）**：对 `dir4.degrade(last.nextDirection)` 的结果显式判 `FaceDirection.Unknown` → `FaceDirection.Down`；因 `Dir4FaceHandler.degrade` 斜向折叠与旧 helper 一致，加上回退后与旧 helper 的 `unknown` 形参语义**逐字等价**。
3. **D-25 拆分**：`MapHeroLocationHook` 注册到 `hero`、`MapHeroMoverHook` 注册到 `hero.mover`，各持 `locationController` / `moverController`；`onSetPos` 只出现一次且无条件 `this.hero.setPosition(x, y)`。不再重复触发的理由：`ObjectMover.setPos` 先 `this.tile.setPos(...)`（触发 location 钩子）再由 `forEachHook` 触发 mover 钩子（`mover.ts:522-527`），而 mover 类刻意不实现 `onSetPos`，故同一次定位只触发一次。
4. **D-26**：`ObjectMoveType.AnimDir` 分支改为 `this.hero.setHeroAnimateDirection(step.dir); break;`，且保留开头既有 `setHeroAnimateDirection(mover.currAnimDir)`；`ObjectMoveType.Speed` 仍为 `break`（无渲染动作）。
5. **D-27**：`hero.ts` 已无 `mutate-animate`（独立 token），`ExcitationCurve2D` 由 `moveRelative(curve: TimingFn<2>, ...)`（`moving.ts:162-166`）形参接受（以编译结果为准：scoped 类型门禁 0 条）；其余 `mutate-animate` 存量使用未动。
6. **D-28**：`import { state } from '@user/data-state'` 与三处 `state.roleFace.getFaceOf`（`:238`/`:363`/`:426`）逐字未动（门禁 `getFaceOf=3`）。
7. **D-18 / D-22 保留**：`setImage` / `setAlpha` / `setFollowerAlpha` / `addFollower` / `removeFollower` / `removeAllFollowers` 与钩子方法 `onSetImage` / `onSetAlpha` / `onSetFollowerAlpha` / `onAddFollower` / `onRemoveFollower` / `onRemoveAllFollowers` 逐字保留（由 D-18/D-22 门禁与契约门禁确认）。
8. **接口面**：未新增 / 删除任何公共接口成员；`types.ts` 仅 `addHero` 增一个 `faceManager` 形参，`IMapHeroRenderer` 的 7 个保留成员逐字仍在。
9. **运行时 UAT 不可得（诚实降级）**：`MapExtensionManager.addHero` 当前无任何调用点，`client.ts:151-155` 的 `addHero` 接线仍为注释，故勇士渲染拓展在运行时未启用；本计划不接线 `client.ts`，运行时渲染无法观察。本计划实际验证为「scoped 类型 + 静态 / 契约 + eslint / CRLF + 范围 / 并发基线」机器门禁加人工代码复核，**未以任何不可运行的门禁冒充通过**。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 为满足计划的「单行签名 / 单行构造调用」静态门禁而加 `// prettier-ignore`**

- **Found during:** Task 1（`types.ts` / `manager.ts`）
- **Issue:** 计划的静态门禁要求 `types.ts` 出现单行 `addHero(state: IHeroLocation, layer: IMapLayer, faceManager: IFaceManager): IMapHeroRenderer | null;`、`manager.ts` 出现单行 `new MapHeroRenderer(this.renderer, layer, state, faceManager)`；但两条行宽（104 / 92 字符）均超过 `.prettierrc` 的 `printWidth: 80`，`eslint --fix` 会按 prettier 换行，导致门禁正则失配、且不换行则 `prettier/prettier` 报错——计划内两条验收要求互相冲突。
- **Fix:** 按仓库既有惯例（`renderer.ts:271` / `vertex.ts:118` 等 7 处）在两行前加 `// prettier-ignore`，使单行形态与 eslint 0 错误同时成立；`IMapExtensionManager.addHero` 的 jsDoc 与成员集合未动，`hero.ts` 未加任何 `prettier-ignore`（其被替换行的换行形态本就被门禁正则接受）。
- **Files modified:** `packages-user/client-modules/src/render/map/extension/types.ts`、`packages-user/client-modules/src/render/map/extension/manager.ts`
- **Commit:** `3414233`

## Known Stubs

None。本计划未引入任何硬编码空值、占位文本或未接线的数据源；`client.ts` 的未接线是计划明确延后项，非占位实现。

## 未实现项清单（显式延后）

- `client.ts` 的 `addHero` 接线启用：未做（本计划明确不接线；注入路径 B 的 `faceManager` 形参已就位，未来接线处传 `this.faceManager`）。
- `IHeroLocationHooks.onSetFloor`：仍不实现（楼层切换需重绑图层的接线路径，本增量不接线 `client.ts`）。
- `onStepStart` / `onSetMoveDir`：仍不实现（既有约定，理由照 04-03）。
- 贴图 / 不透明度来源（D-18）、跟随者位置 / 动画归属（D-22）：未做。
- `action/move.ts` 与移动控制 `#04-02-G-02`（`oneStep` / 控制器队列）：未做（D-19）。
- `hero.ts` 之外的 `mutate-animate` 存量迁移（D-27 范围外）：未做。
- 其余 ① 错配（`#04-01-M-06..09`）与 ③ 多余旧路径：未做。
- 移动端 / 桌面端双布局（REND-02）：未做。

## REND-01 / REND-02 状态

REND-01 / REND-02 在本 run 后**仍保持 Pending**：本计划只落地「04-03 勇士渲染修正」一个子切片，未实施其余渲染适配（REND-01）与移动端 / 桌面端双布局（REND-02）；两条 FLAGGED ASSUMPTION 的验收边界仍未提供，用户须在推进后续增量前补齐。REND-01 的 D-24/D-25/D-26 子切片已在本计划内落地（需求整体保持 Pending）。

**运行时 UAT 不可得（诚实降级）：** 渲染端无测试设施，且 `MapExtensionManager.addHero` 当前未被接线（`client.ts:151-155` 仍为注释），故运行时渲染无法观察。实际验证为 scoped 类型门禁 + 静态 / 契约门禁 + D-18/D-22/D-28 保留门禁 + eslint / CRLF + 范围（基线感知）/ 并发基线门禁 + 人工代码复核；运行时渲染 UAT 顺延到启用接线的增量。

## Task Commits

- `3414233` — `refactor(04-04): align hero renderer with IFaceManager and split hooks`（仅三个源文件；`hero.ts` / `types.ts` / `manager.ts`，无删除）
- 本 SUMMARY 由计划内的 `docs(04-04): record execution state` 提交（仅本文件）
- 计划元数据（`STATE.md` / `ROADMAP.md`）由后续元数据提交处理

## Self-Check: PASSED

- 三个在范围文件均存在且已提交（`git show --stat HEAD` 显示 `hero.ts` / `types.ts` / `manager.ts`，无删除）。
- 源提交 `3414233` 存在于 `git log`。
- SUMMARY 的 `TYPE-BASELINE` / `CONCURRENT-BASELINE` 段与门禁复算一致。
