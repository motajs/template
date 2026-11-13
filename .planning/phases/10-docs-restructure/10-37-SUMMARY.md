---
phase: 10-docs-restructure
plan: 37
subsystem: docs
tags: [vitepress, markdown, advanced-iii, passability, pathfinding]

requires:
    - phase: 10-docs-restructure
      provides: 10-36 已完成高级 III 的事件与解释器两页，III 目录存在且侧边栏仍为空
provides:
    - docs/advanced/iii/passability-and-pathfinding.md：通行性谓词契约、默认实现、两个实例、勇士移动三种结果、构图、搜索与系统层职责
affects: [10-39 侧边栏注册与互链, 10-40 读者审阅]

actuals:
    tokens: 4538
    tasks: 3
    commits: 2
    plan_head_before: 766cb3c68c20234c6845eac9e5cdc2f184f96da2

tech-stack:
    added: []
    patterns:
        - 系统类页面先讲模型再讲接口（D-82）：从两个消费方与「构图、搜索、交给移动器」讲起
        - 「同一契约、两个实例」单列一节，用表格对照勇士侧与寻路侧的实例来源和注入方式
        - 默认实现按层拆成事件层与 onlyEvents 图层，撞击单独用 eventPass 说明
        - 自定义重心放在谓词类与两条注入路径（D-77）
        - 边界与特殊情况统一放文末「边界与注意」（D-61），共九项
        - 代码块给完整函数或类上下文并带解释性注释（D-62 / D-65 / D-70）

key-files:
    created:
        - docs/advanced/iii/passability-and-pathfinding.md
        - .planning/phases/10-docs-restructure/10-37-SUMMARY.md
    modified: []

key-decisions:
    - Task 0 的汇报关卡已由用户预批准满足：用户明确表示「这些都是文档编写工作，不涉及代码本身，直接批准执行 10-33 至 10-37」，本计划据此继续
    - 页面固定写成「同一契约、两个实例」：勇士顶层实现自建默认谓词，寻路初始化另建一个注入求解器；改一侧不会自动改另一侧
    - 谓词语义按计划写成「canPass 判断能否进入目标格，shouldHit 判断是否产生撞击」，并明确 shouldHit 不是「不能走」
    - 默认实现按当前源码写成：先把方向降级到四向；事件层检查 outPass / inPass；其它图层只检查 onlyEvents 图块；撞击看事件层目标格静态图块的 eventPass
    - 勇士移动三种结果写成不能走、撞停、正常一步，并说明撞停走触碰、正常一步走离开与进入、不能走目前没有内置触发器
    - 寻路只讲「构图 → 搜索 → 交给移动器」的模型，不写 Dijkstra 证明、复杂度与性能结论
    - 与高级 II 切分：本篇不写 moveTo / teleportTo 的完整示例，不写损失函数与瞬移策略实现，只保留链接
    - 按计划不链接 ./event-system.md，事件系统只在正文中文字提及，互链留给 10-39

patterns-established:
    - 高级 III 通行性与寻路页结构：系统模型 → 谓词契约 → 默认实现 → 两个实例 → 勇士移动三种结果 → 构图 → 搜索 → 系统层 → 自定义谓词 → 边界
    - 两个消费方用「同一输入、同一契约、不同后续动作」对照，避免把寻路写成另一套通行规则

requirements-completed: []

coverage:
    - id: D1
      description: 讲清通行性谓词的契约、默认实现的分层判断，以及「同一契约、两个实例」的关系
      verification:
          - kind: other
            ref: '10-37-PLAN.md Task 1 自动门禁 PAGE-OK；人工对照 packages-user/data-base/src/map/types.ts、src/data/hero/predicate.ts、src/data/hero/moverImpl.ts、src/data/initialize.ts'
            status: pass
      human_judgment: false
    - id: D2
      description: 讲清勇士移动三种结果与寻路四状态，以及构图、搜索、系统层的职责边界
      verification:
          - kind: other
            ref: '人工对照 packages-user/data-base/src/hero/{types,mover}.ts、packages-user/data-system/src/path/{graph,finder,system,types}.ts'
            status: pass
      human_judgment: false
    - id: D3
      description: 与高级 II 无重复，页面可格式化、可构建、无死链
      verification:
          - kind: other
            ref: 'prettier --check 通过；cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build" 输出 build complete in 15.47s，无 dead link'
            status: pass
      human_judgment: false

duration: 约 25 分钟
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 37: 通行性谓词与寻路原理 Summary

**写出高级 III 的《通行性谓词与寻路原理》：用「同一契约、两个实例」讲清勇士移动与寻路构图为什么一致、为什么不共享对象，并把构图、搜索与移动器交接写成一条可读的流程。**

## Performance

- **Duration:** 约 25 分钟
- **Completed:** 2026-10-26
- **Tasks:** 3/3（Task 0 由用户预批准满足；Task 1 / 2 已执行）
- **Files created:** 2（页面 + 本 SUMMARY）

## Accomplishments

- 新建 `docs/advanced/iii/passability-and-pathfinding.md`，单 H1《通行性谓词与寻路原理》，249 行。
- 主体结构为：`系统模型` → `通行性谓词契约` → `默认实现怎么判断` → `同一契约、两个实例` → `勇士移动的三种结果` → `构图：从起点只保留可达节点` → `搜索：最小损失与终端约束` → `系统层做什么` → `换一套通行语义` → `边界与注意`。
- 系统模型用一张角色表与一段 `text` 数据流讲清两个消费方：勇士移动在一步开始时问谓词，寻路在构图时问同一组方法；寻路整体是「构图 → 搜索 → 交给移动器」。
- 谓词契约写清 `canPass` 与 `shouldHit` 是两个问题，`shouldHit` 不是「不能走」而是「走得到但会撞」，并说明寻路侧 `canPass` 决定建不建边、`shouldHit` 决定终端。
- 默认实现按层写清：方向降级到四向；事件层检查 `pass.outPass` 与 `pass.inPass`；其它图层只检查 `pass.onlyEvents` 为真的图块；`shouldHit` 只看事件层目标格静态图块的 `eventPass`。附一个用默认谓词判断某一步的完整函数。
- 「同一契约、两个实例」单列一节：`DefaultHeroMoveTopImpl` 构造时自建一个默认谓词并由 `predicate()` 返回，数据端初始化时又为 `finder.usePassPredicate(...)` 新建一个；两者行为一致、对象不同，要一致就两边都换。
- 勇士移动三种结果写清不能走、撞停、正常一步；不能走调用 `cannotEnter` 并停止，撞停调用 `hit` 并停止，正常一步在结算时先离开再进入。触发器对应关系只用一句话带过，并注明不能走目前没有内置触发器。
- 构图写清前置条件、广度扩展、跳过原地、`canPass` 不建边、`shouldHit` 标记终端、只保留可达节点，以及损失值非法时回退为 1。
- 搜索写清最小损失、起点等于终点、目标不在图里、终端只能作终点，以及 `Success` / `InvalidInput` / `NoPath` / `TargetUnder` 四个状态。
- 系统层只写职责：绑定移动器、通过 finder 注入图层/谓词/方向处理器/损失函数、`getPath` 从移动器取起点、`moveTo` 恒逐步、`teleportTo` 询问回退策略、忙碌返回 `null`、`interrupt` 等待停止；不重复高级 II 的完整示例。
- 自定义谓词给出完整类 `NoTilePassPredicate`，在默认规则上叠加「禁止指定图块数字」，并给出寻路侧注入代码；勇士侧说明要换顶层实现或改默认实现，链接回移动 Mover 与 FaceHandler。
- 文末「边界与注意」覆盖九项：两个实例不共享、图层来源校验、缺方向处理器构图失败、起点越界、终端只能作终点、无路径是正常结果、目标在脚下不移动、换楼层重绑、瞬移跳过途经格。

## Task Commits

1. **Task 1: 复核通行性与寻路事实并落稿** — `eac3f0d`（docs）
2. **Task 2: 格式与构建门禁、写 SUMMARY** — 本次 SUMMARY 提交（docs）

## Files Created/Modified

- `docs/advanced/iii/passability-and-pathfinding.md` — 通行性谓词契约、默认实现、两个实例、勇士移动三种结果、构图、搜索、系统层与自定义谓词。
- `.planning/phases/10-docs-restructure/10-37-SUMMARY.md` — 本计划执行记录。

## Fact Verification

正文事实按当前源码复核，research 的行号未直接搬入页面。

- `packages-user/data-base/src/map/types.ts`：`IPassCheckHandler` 的 `currLoc` / `nextLoc` / `direction` / `map`；`IPassPredicate` 的 `canPass` / `shouldHit`。
- `packages-user/data-base/src/hero/types.ts`：`HeroMoveCode` 的 `Step` / `Stop` / `Hit` / `CannotMove`；`IHeroMoveTopImpl.predicate()` 与四类回调。
- `packages-user/data-base/src/hero/mover.ts`：`onStepStart` 先调 `canPass`，放行后再调 `shouldHit`；`CannotMove` 调 `cannotEnter` 并停止，`Hit` 调 `hit` 并停止，`Step` 返回目标格；`onStepSettled` 先 `leave` 再 `enter`。
- `src/data/hero/predicate.ts`：默认实现先把方向降级到四向；事件层检查 `outPass` / `inPass`；其它图层只检查 `onlyEvents` 图块；`shouldHit` 看目标格静态图块的 `eventPass`。
- `src/data/hero/moverImpl.ts`：`DefaultHeroMoveTopImpl` 构造时自建 `DefaultPassPredicateImpl`；`enter` / `leave` / `hit` 分别派发 `OnEnter` / `OnLeave` / `OnTouch`，`cannotEnter` 为空实现。
- `src/data/initialize.ts`：`MainDataPlugin.awake` 另建一个 `DefaultPassPredicateImpl` 注入 `finder`，图层先置 `null`，并把移动器指向勇士；随后创建 `DefaultHeroMoveTopImpl` 并 `useTopImplementation`。
- `packages-user/data-system/src/path/graph.ts`：`build` 检查图层、谓词、方向处理器与起点范围；BFS 跳过零偏移；`canPass` 失败跳过；`shouldHit` 把邻格加入终端；只把可达节点放入图；损失值非法回退 1。
- `packages-user/data-system/src/path/finder.ts`：`useMapLayer` 校验图层来源；`search` 起点等于终点返回空、目标不在图返回空、终端不能作中间点；`find` 归入四个状态。
- `packages-user/data-system/src/path/system.ts`：`getPath` 从移动器取起点；`moveTo` 恒逐步；`teleportTo` 询问回退策略；忙碌返回 `null`；`interrupt` 等待底层停止。
- `packages-user/data-system/src/path/types.ts`：`PathFindingStatus` 四个状态、`IMapGraphBuilder` / `IPathFinder` 的注入方法、`IPathfindingStep` 与 `IPathfindingController`。
- D-72：存在一处接口注释与实现表述不一致，已按 D-72 只在对话中报告，未写入文档正文。

## Page Split and Boundary

- 本篇只讲「契约与流程」：谁在什么时候调用谓词、默认实现怎么判断、为什么有两个实例、寻路如何构图与搜索、系统层怎么把步骤交给移动器。
- 高级 II 的 `../ii/pathfinding.md` 继续负责「怎么用」：完整绑定流程、`moveTo` / `teleportTo` 用法、损失函数与瞬移策略示例。本篇只在系统层与自定义小节保留链接。
- 本篇不重复 `moveTo` / `teleportTo` 的完整代码示例，也不实现损失函数或瞬移策略；正文只说明它们的职责与链接位置。
- 事件系统只在勇士移动三种结果里用文字提及，不链接 `./event-system.md`；互链留给 10-39。
- 文末单列「边界与注意」，共九项，与计划要求一一对应。

## Deliberately Not Written

- Dijkstra 证明、复杂度与性能结论；只写「最小损失搜索」的输入输出与终端约束。
- 渲染端移动动画、瞬移表现与场景生命周期。
- 瞬移钩子的时序疑点（research C8）；只在对话中报告，不写进正文。
- `moveTo` / `teleportTo` 的完整示例与回退策略实现；由高级 II 承担。
- 损失函数的具体实现与 `Infinity` 用法讨论；由高级 II 承担。
- 源码行号、源码叙述、「模板」与「[需改]」标记（D-80 / D-83）。
- 侧边栏注册与指向尚不存在 III 页面的链接。

## Gates

- `node node_modules/prettier/bin/prettier.cjs --write docs/advanced/iii/passability-and-pathfinding.md`：通过，文件为 CRLF（249 个 CRLF、0 个 LF）。
- `node node_modules/prettier/bin/prettier.cjs --check docs/advanced/iii/passability-and-pathfinding.md`：通过（All matched files use Prettier code style）。
- Task 1 自动门禁：`PAGE-OK`。
- 结构门禁：单 H1、CRLF、十个小节齐备、文末「边界与注意」。
- 事实门禁：`IPassPredicate`、`IPassCheckHandler`、`MapGraphBuilder`、`PathFinder`、`PathfindingSystem`、`DefaultPassPredicateImpl`、`canPass`、`shouldHit`、`eventPass` 均出现；三类勇士移动结果与四种寻路状态写对。
- 切分门禁：无 `moveTo` / `teleportTo` 完整示例，无损失函数或瞬移策略实现；只保留链接。
- 链接门禁：相对 `.md` 目标全部存在；含 `../ii/pathfinding.md` 与 `../i/mover.md`、`../i/face-handler.md`。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`，退出码 0，输出 `build complete in 15.47s`，无 `dead link`。

## Handoff to 10-39

- 本页尚未注册进 `docs/.vitepress/config.ts` 的「高级 III · 原理与架构」分组（`items: []`），也未链接 III 导览或其它 III 页面。
- 10-39 需要：注册本页到侧边栏，替换 `docs/advanced/index.md` 与 `docs/advanced/ii/index.md` 中「高级 III 尚未编写」的占位，并在 III 导览中把本页列入阅读路径。
- 本页与 `./event-system.md` 的互链尚未建立；10-39 可在事件页或导览中补上「通行性判断与事件触发器」的交叉引用。
- 本页标题均为稳定的中文标题；10-39 如需链接到具体小节，按构建后实际生成的锚点填写，或给标题追加显式锚点，避免全角标点被 slug 化后与链接不一致。

## Deviations from Plan

None - 计划按原样执行。Task 0 的汇报关卡由用户预批准满足，未再单独等待「可以执行」；其余任务按计划完成。

## Issues Encountered

- 工作区存在与本计划无关的既有改动（`packages-user/client-base/*`、`.planning/phases/09-*`、`packages-user/client-base/src/map/__test__/`、`src/client/ui/*`），所有提交均只暂存本计划文件。
- 本计划第一笔提交前的 HEAD 已被一笔与本计划无关的 `docs(09-28)` 提交推进到 `766cb3c`；ledger 以该提交为基线，本计划只新增页面与 SUMMARY。
- 构建产物 `public/_docs/*` 未纳入提交，遵循仓库既有做法。
- 未发现需要暂停执行的阻塞问题；无认证关卡、无包安装。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 本页已可构建、可格式化、无死链，十个主体小节齐备，边界九项完整。
- 10-39 可以直接注册侧边栏并建立 III 导览与互链；10-40 可对本页做读者审阅与章节使用概率评估。

## Self-Check: PASSED

- 文件存在：`docs/advanced/iii/passability-and-pathfinding.md`、`.planning/phases/10-docs-restructure/10-37-SUMMARY.md`
- 提交存在：`eac3f0d`（Task 1）、本次 SUMMARY 提交（Task 2）
- 门禁存在：`PAGE-OK`、prettier `--check` 通过、`build complete in 15.47s`、无 dead link
