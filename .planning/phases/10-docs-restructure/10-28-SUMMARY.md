---
phase: 10-docs-restructure
plan: 28
subsystem: docs
tags: [vitepress, markdown, mover, data-common, advanced-i]

requires:
    - phase: 10-docs-restructure
      provides: 高级 I 既有篇目（钩子深入、录像一致性）与高级 II 图块/寻路篇目的互引落点
provides:
    - docs/advanced/mover.md：高级 I 补写篇目「移动 Mover」
affects: [10-29 face-handler, 10-30 sidebar registration]

actuals:
    tokens: 5984
    tasks: 3
    commits: 2
    plan_head_before: e2e09f379d2b34d582e12ed5729dd9916e31b28e

tech-stack:
    added: []
    patterns:
        - 高级教程按一般库文档组织：概念 → 完整示例 → 接入位置
        - 注释与实现不一致时以方法注释为准，并在 SUMMARY 中报告

key-files:
    created:
        - docs/advanced/mover.md
        - .planning/phases/10-docs-restructure/10-28-SUMMARY.md
    modified: []

key-decisions:
    - 文档按源码命名使用 IMoverController；D-75 写作 IMoveController，按笔误处理。
    - forward 的语义按方法注释写「沿当前移动方向」；实现取 faceDirection 的差异已报告，未按实现改写文档语义（D-72）。
    - 执行期间在移动器上调用链式方法只写入下一次队列；追加本次执行只能用 controller.push / insert。
    - 模板（泛型骨架）与最小示例（SimpleTile + SimpleMover）分开，示例统一使用 class + new。

patterns-established:
    - 高级 I 补写篇目沿用「三件套 → 计划 → 执行 → 扩展 → 内部流程 → 边界 → 验证」的顺序。
    - 涉及纯内部实现的章节放在靠后位置，并以「此章节讲解一下……」开头（D-69）。

requirements-completed: []

coverage:
    - id: D1
      description: docs/advanced/mover.md 覆盖移动器三件套、链式计划、执行与等待、控制器、步骤类型、钩子、ObjectMover 模板与最小示例、内部执行流程、边界与验证
      verification:
          - kind: other
            ref: 'pnpm docs:build（build complete，dead link = 0）与 prettier --check'
            status: pass
      human_judgment: true
      rationale: 文档是否适配高级 I 读者、示例是否讲清，需要按 D-46 / D-57 的用户主导修订循环审阅；自动化只能验证结构、链接与构建。

duration: 25min
completed: 2026-10-23
status: complete
---

# Phase 10 Plan 28: 移动 Mover Summary

**新增高级 I 补写篇目 `docs/advanced/mover.md`，讲清 `IObjectMovable` / `IObjectMover` / `IMoverController` 三件套、链式计划、执行与等待、步骤类型、七个钩子，以及如何继承 `ObjectMover` 写自己的移动器。**

## Performance

- **Duration:** 约 25 分钟
- **Started:** 2026-10-23（本会话）
- **Completed:** 2026-10-23
- **Tasks:** 3/3（Task 0 汇报关卡已由用户预先批准）
- **Files modified:** 1 个新增文档；SUMMARY 1 个

## Accomplishments

- 新增 `docs/advanced/mover.md`（627 行，CRLF，单 H1「移动 Mover」），按高级 I 库文档风格组织，不使用中级教程的六步实操。
- 讲清「先排计划、再执行」主线：链式方法只入队，`start()` 取快照并执行；执行期间的追加只能用 `controller.push` / `insert`。
- 给出 `ObjectMover` 子类完整模板与 `SimpleTile` + `SimpleMover` 最小示例，演示「方向 → 偏移 → 落点」；模板与示例分开，示例用 `class` + `new`。
- 把纯内部执行流程放在靠后章节，并以「此章节讲解一下移动器的内部执行流程」开头（D-69）；边界情况集中到「边界与注意」。
- 构建通过、prettier 通过、无死链、无渲染端内容；`src/client` 未出现。

## 章节结构

1. 三个角色
2. 拿到现成的移动器
3. 排一个移动计划
4. 执行与等待
5. 执行中追加、插入与停止
6. 步骤类型
7. 移动器状态
8. 钩子
9. 实现自己的移动器（模板）
10. 示例：一个最小可移动对象
11. 与录像、存档的关系
12. 内部执行流程（D-69 靠后）
13. 边界与注意
14. 怎么验证

## 引用的源码落点

- `packages-user/data-common/src/common/mover.ts`：`IObjectMovable`、`IObjectMover`、`IMoverController`、`ObjectMover`、`ObjectMoveType` / `ObjectSpecialStep` / `ObjectAnimDirection`、`IObjectMoverHooks`。
- `packages-user/data-base/src/hero/mover.ts`：`HeroMover` 的五个抽象方法实现、`@shouldReplay` 落点、通行判断交给 `IHeroMoveTopImpl`、`cannotEnter` / `hit` 后直接 `controller.stop()`（不 `await`）。
- `packages-user/data-base/src/map/mover.ts`：`DynamicTileMover` 只处理各步骤的落点，未识别类型原样返回当前坐标。
- `packages-user/data-base/src/hero/types.ts`：`IHeroMover` 的 `config` / `getConfig` / `useTopImplementation`、`IHeroMoverConfig` 三字段、`HeroMoveCode` 四值、`IHeroLocationSave` 四字段。
- `packages-user/data-base/src/map/dynamicTile.ts`：动态图块持有 `mover`，`step` 为单步便捷入口。
- `packages/common/src/utils/types.ts`：`IFaceHandler` 与 `IFaceDescriptor`，正文只说明构造时传入朝向处理器，不展开 FaceHandler 细节。

## 核对到的关键语义

- `start()` 在移动中返回 `null`；否则切片 `moveQueue`、清空内部队列、把 `shouldStop` 置假、把 `moveDirection` 重置为 `Unknown`，返回控制器并驱动 `moveProgress`。
- `moveProgress` 顺序：子类 `onMoveStart` → 钩子 `onMoveStart`（`Promise.all`）→ 每步 `prepareStep` → 子类 `onStepStart`（返回 `code`）→ 钩子 `onStepStart` → 子类 `onStepEnd`（返回落点）→ 坐标变化时 `tile.setPos` → `onStepSettled` → 钩子 `onStepEnd` → 结束后子类 `onMoveEnd` → 钩子 `onMoveEnd`。
- `prepareStep`：`Dir` 同时写移动方向与朝向；`DirFace` 分开写；`Face` 只写朝向；`Special(Forward)` 取当前朝向，`Special(Backward)` 取 `opposite(当前朝向)` 并保持朝向不变；`Speed` 写 `currentSpeed`；`AnimDir` 写 `currAnimDir`。
- 控制器 `push` / `insert` 只在仍在移动、未 `stop`、未 `done` 时生效；`insert` 把步骤放到剩余队列最前面（当前步之后）；`stop()` 总是置停止标记并返回 `onEnd`，当前步走完后才退出。
- 执行期间 `mover.step` / `face` / `speed` 写的是下一次执行的队列，本次快照不会消费；要追加只能用控制器。
- 七个钩子：`onMoveStart` / `onMoveEnd` / `onStepStart` / `onStepEnd`（异步，`Promise.all`）与 `onSetPos` / `onSetFaceDir` / `onSetMoveDir`（同步）；`code` 由子类 `onStepStart` 传到钩子、子类 `onStepEnd` 与 `onStepEnd` 钩子。
- `setPos` / `setFaceDir` / `setMoveDir` 立即生效、不排队；移动过程中的落点写入直接调用 `tile.setPos`，不触发 `onSetPos`。
- `HeroMover` 在 `onStepStart` / `onStepEnd` / `onStepSettled` 标 `@shouldReplay`，`DynamicTileMover` 标在 `onStepEnd`；位置本身是存档内容，移动不为每一步写存档。

## 格式与构建结论

- prettier：`node node_modules/prettier/bin/prettier.cjs --check docs/advanced/mover.md` → 「All matched files use Prettier code style!」。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → 退出码 0，输出 `build complete`，无 dead link。
- 静态门禁：CRLF、单 H1、三件套 / 链式接口 / 步骤类型 / 状态 / 钩子 / 模板 / 最小示例 / 内部流程 / 边界 / 验证齐全；无 `src/client`；无加粗边界问题；相对 `.md` 链接目标均存在。

## 向用户报告的不一致

供你确认是否为设计如此；文档已按方法注释书写，未按实现改写语义（D-72）：

1. `IObjectMover.forward` 的方法注释写「沿当前移动方向移动」，`ObjectMover.prepareStep` 对 `Special(Forward)` 实际取的是 `faceDirection`（`const dir = this.faceDirection`），并把它同时写入 `moveDirection` 与 `faceDirection`。在 `face()` 只改朝向、不改移动方向之后，注释语义与实现结果会不同；测试文件的注释也写作「forward 沿当前朝向连续前进」。文档按方法注释写「沿当前移动方向」，并提示 `forward()` 前先用 `step` / `stepFace` 确定移动方向。
2. 附带观察：`IObjectMoverHooks.onSetMoveDir` 的首句注释写作「当设置移动对象的朝向时触发」，而方法名、参数与实现都是移动方向；这不影响实现，文档按 `setMoveDir` 的语义书写。

## Task Commits

1. **Task 1: 编写 mover.md 正文** — `caf2753`（docs）
2. **Task 2: 源码核对、格式与构建收口** — `d234758`（docs）

**Plan metadata:** SUMMARY 以独立收尾提交记录（依赖 SUMMARY 的门禁需要在提交前运行）。

## Files Created/Modified

- `docs/advanced/mover.md` — 高级 I「移动 Mover」正文，627 行。
- `.planning/phases/10-docs-restructure/10-28-SUMMARY.md` — 本执行总结。

## Decisions Made

- 按源码使用 `IMoverController`，把 D-75 的 `IMoveController` 视为笔误。
- `forward` 按方法注释语义书写；实现差异只报告，不写进文档（D-72）。
- 模板用泛型 `SimpleMover<T>` 骨架；最小示例把 `T` 固定为 `SimpleTile`，两段代码分开，避免把模板当成具体示例（D-50 / D-64）。
- 执行中追加的边界写在「执行中追加、插入与停止」主干里（计划要求），其余边界集中到「边界与注意」（D-61）。

## Deviations from Plan

None - 计划内容按顺序执行。Task 0 为汇报关卡，用户已在派发时预先批准「可以执行」，未重复阻塞。

实现细节上有两处按源码核对修正了措辞（均在 Task 2 内完成）：

- `push` / `insert` 才有「仍在移动、未 stop、未 done」的短路；`stop()` 本身总是置停止标记。初稿把三者写成同一条件，已改。
- 子类对外除链式方法、`start()`、三个 setter 外，还能读 `moving` / `tile` / `faceDirection` / `moveDirection` / `currAnimDir` / `currentSpeed` / `faceHandler` 等只读状态；初稿写「对外只有……」，已改。

## Issues Encountered

- 构建门禁的验证脚本要求 SUMMARY 已存在，因此先完成正文与构建、再写 SUMMARY、最后运行完整门禁；SUMMARY 作为独立收尾提交，Task 2 的正文改动仍使用计划指定的提交信息。
- 未修改 `config.ts`、生产代码或渲染端内容；侧边栏注册留给 10-30。

## User Setup Required

None - 无外部服务配置。

## Next Phase Readiness

- `docs/advanced/mover.md` 已可供 10-29 的 `FaceHandler 系列` 与 10-30 的侧边栏 / 互引收口引用。
- 与 `static-vs-dynamic-tiles.md` / `pathfinding.md` 的互引目前是单向的（本篇指出去）；10-30 可把它们的 `高级 I · 移动 Mover` 代码 span 换成真实链接。
- `forward` 的注释 / 实现差异待用户确认；确认前文档按方法注释语义，不影响构建。

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-23_

## Self-Check: PASSED

- docs/advanced/mover.md 存在
- 10-28-SUMMARY.md 存在
- 提交 caf2753、d234758 存在
