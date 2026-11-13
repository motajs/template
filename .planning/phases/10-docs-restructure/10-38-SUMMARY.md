---
phase: 10-docs-restructure
plan: 38
subsystem: docs
tags: [vitepress, markdown, advanced-iii, core-state, plugin-internals]

requires:
    - phase: 10-docs-restructure
      provides: 10-37 已完成高级 III 的通行性与寻路页，III 目录存在且侧边栏仍为空
provides:
    - docs/advanced/iii/core-state.md：数据端组合根的入口职责、加载管线、存档挂载、第二个实例与四层装配顺序
    - docs/advanced/iii/plugin-internals.md：插件依赖排序、状态机、三阶段执行、取回与失败现象
affects: [10-39 侧边栏注册与互链, 10-40 读者审阅]

actuals:
    tokens: 5215
    tasks: 4
    commits: 3
    plan_head_before: 6369f111e975861001b476bb9375938fc7690a94

tech-stack:
    added: []
    patterns:
        - 组合根类页面先讲模型再讲入口与管线（D-82）：系统模型 → 入口职责 → 加载管线 → 存档挂载 → 第二实例
        - 纯内部实现章节后置并以「此章节讲解一下」开头（D-69）：装配顺序与依赖排序都放在使用侧之后
        - 装配顺序按 L0 / L1 / L2 / L3 四层列表，只写公开访问器与接口名，不写私有字段
        - 插件内部页只讲机制与失败现象，不重复高级 I 的插件类写法；失败模式写现象而非告警码表
        - 边界与特殊情况统一放文末「边界与注意」（D-61），两页分别为九项与八项
        - 示例给完整函数或类上下文并带解释性注释（D-62 / D-65 / D-70）

key-files:
    created:
        - docs/advanced/iii/core-state.md
        - docs/advanced/iii/plugin-internals.md
        - .planning/phases/10-docs-restructure/10-38-SUMMARY.md
    modified: []

key-decisions:
    - Task 0 的汇报关卡已由用户预批准满足：用户审阅 10-38 至 10-41 剩余批次后回复「到第二天了，继续」，本计划据此继续
    - 按当前源码复核装配顺序：L0 公共数据、L1 状态基座、L2 系统层、L3 顶层；四层装完后才建立插件注册表并同步执行 awake
    - 加载管线固定写成 initialize → loader.start() → afterLoad → 检查插件状态；load() 与 loader.start() 都必须被迭代推进
    - 五个可存档 id 与当前源码一致：@system/hero、@system/flags、@system/maps、@system/enemy、@system/replay
    - 插件状态按源码写成四个：NotAwakened → Awakened → Initialized → Loaded；每个阶段只处理前一状态的插件
    - 失败模式只写现象：环、缺失依赖、重复 id、状态不符、启动后仍未完成；不罗列完整告警码表
    - 两页均不写渲染层与客户端主对象；不写源码行号与源码叙述；不提供重排构造顺序的做法
    - 两页互链成立：core-state 在装配顺序末尾指向 plugin-internals，plugin-internals 在取回小节指向 core-state 的加载管线
    - 与高级 I 的分工：插件写法与存档形状只保留链接，本篇分别讲「装配与生命周期」和「顺序怎么算、失败会怎样」

patterns-established:
    - 高级 III 组合根页结构：系统模型 → 入口职责 → 加载管线 → 存档挂载 → 第二实例 → 内部装配顺序 → 边界
    - 高级 III 插件内部页结构：系统模型 → 三阶段 → 取回 → 失败现象 → 内部排序 → 状态机 → 边界
    - 使用侧在前、纯内部实现在后；内部章节只解释顺序与状态，不建议读者调用排序函数或重排装配

requirements-completed: []

coverage:
    - id: D1
      description: 讲清 CoreState 的组合根职责、入口分工、加载四步、存档挂载与第二个实例
      verification:
          - kind: other
            ref: '10-38-PLAN.md Task 1 自动门禁 PAGE-OK；人工对照 packages-user/data-state/src/core.ts、src/data/{entry,initialize}.ts、src/data.ts'
            status: pass
      human_judgment: false
    - id: D2
      description: 讲清插件顺序怎么算、状态怎么推进、依赖写错会看到什么
      verification:
          - kind: other
            ref: '10-38-PLAN.md Task 2 自动门禁 PAGE-OK；人工对照 packages-user/data-state/src/{plugin,types,core}.ts'
            status: pass
      human_judgment: false
    - id: D3
      description: 两页格式与构建双绿、互链可解析、无渲染层内容
      verification:
          - kind: other
            ref: 'prettier --check 通过；cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build" 输出 build complete in 21.16s，无 dead link；Task 3 门禁 GATE-OK'
            status: pass
      human_judgment: false

duration: 约 20 分钟
completed: 2026-10-27
status: complete
---

# Phase 10 Plan 38: CoreState 组装与初始化 / 插件内部机制 Summary

**写出高级 III 的装配两篇：用四层装配顺序、四步加载管线与存档挂载讲清数据端组合根，用依赖排序、四状态与失败现象讲清插件顺序从哪来、写错会怎样。**

## Performance

- **Duration:** 约 20 分钟
- **Completed:** 2026-10-27
- **Tasks:** 4/4（Task 0 由用户预批准满足；Task 1 / 2 / 3 已执行）
- **Files created:** 3（两页 + 本 SUMMARY）

## Accomplishments

- 新建 `docs/advanced/iii/core-state.md`，单 H1《CoreState 组装与初始化》，193 行。
- 主体结构为：`系统模型` → `入口的职责` → `加载管线` → `存档挂载` → `在游戏内另建一个数据端实例` → `内部实现：装配顺序` → `边界与注意`。
- 系统模型用一张分层表与 `text` 示意讲清组合根的三条理由：入口统一、层间注入、生命周期只有一套。
- 入口职责写清数据端入口只重新导出创建函数、配置入口组装四样配置、`createCoreState` 返回未异步初始化的实例，以及主插件在 `awake` 与 `afterLoad` 分别做什么；五个可存档 id 用表格列出。
- 加载管线写清四步：插件 `initialize` → 加载器 `start` → 插件 `afterLoad` → 检查未到 `Loaded` 的插件；并说明两处异步迭代器都必须被消费。
- 存档挂载写清注册与执行器两条线：重复 id 只保留第一个、执行器可绑对象或 id、读档时逐个对象短暂禁用录像、执行器在包裹之外；附完整注册与绑定示例。
- 第二个数据端实例单独成节：构造器不依赖全局单例，四个配置字段必填，示例完整演示构造与迭代加载。
- 内部装配顺序后置，以规定句式开头；按 L0 → L1 → L2 → L3 列出公开访问器与接口名，说明回指主对象的子系统、同层内部先后，以及四层装完后才注册插件、排序并同步 `awake`。
- 新建 `docs/advanced/iii/plugin-internals.md`，单 H1《插件内部机制》，121 行。
- 主体结构为：`系统模型` → `三个阶段怎么执行` → `取回一个插件` → `失败会怎样` → `内部实现：依赖排序` → `状态机` → `边界与注意`。
- 插件机制模型用五段链条讲清：插件表 → 依赖图 → 拓扑序 → 状态机 → 三阶段；三阶段用表格对照时机、是否等待与适合做什么。
- 取回小节给出完整函数，强调判空与状态检查，并链接回 CoreState 的加载管线。
- 失败现象写清环、缺失依赖、重复 id、状态不符与启动后仍未完成；只写控制台提示与插件静默不执行，不罗列完整告警码表。
- 依赖排序内部实现按四步写清：查缺失、查环、传播阻断、反复扫描输出拓扑序；并说明只在构造期算一次、`orderPlugins` 不供读者调用。
- 状态机写清四状态与推进条件，每个阶段只处理前一状态的插件；被阻断插件停在 `NotAwakened`。
- 文末「边界与注意」两页分别为九项与八项，覆盖加载迭代、配置必填、存档 id、执行器告警、录像禁用、依赖固定、下游阻断、`dataDeps` 与 `clientDeps` 分离等。

## Task Commits

1. **Task 1: 复核装配事实并落稿 core-state.md** — `44f1cd6`（docs）
2. **Task 2: 落稿 plugin-internals.md 并收口两页互链** — `459bb18`（docs）
3. **Task 3: 两页格式与构建门禁、写 SUMMARY** — 本次 SUMMARY 提交（docs）

## Files Created/Modified

- `docs/advanced/iii/core-state.md` — 数据端组合根的系统模型、入口职责、加载管线、存档挂载、第二个实例、四层装配顺序与边界。
- `docs/advanced/iii/plugin-internals.md` — 插件机制模型、三阶段、取回、失败现象、依赖排序内部实现、状态机与边界。
- `.planning/phases/10-docs-restructure/10-38-SUMMARY.md` — 本计划执行记录。

## Fact Verification

正文事实按当前源码复核，未把行号或源码叙述写进页面。

- `packages-user/data-state/src/core.ts`：构造顺序为 L0（朝向绑定、朝向管理、图块 / 道具 / 地图 / 事件 / 怪物仓库、录像）→ L1（标记、地图、勇士、怪物管理）→ L2（怪物上下文、战斗、事件、寻路）→ L3（加载管理器、加载器 + 登记核心配置）；随后遍历插件列表、重复 id 告警并跳过、按 `dataDeps` 建表、调用一次 `orderPlugins`、同步 `awake`。
- `packages-user/data-state/src/core.ts`：`load()` 为 `initialize()` → `yield* loader.start()` → `afterLoad()` → 逐个检查是否 `Loaded`；`awake` / `initialize` / `afterLoad` 分别只处理 `NotAwakened` / `Awakened` / `Initialized`。
- `packages-user/data-state/src/core.ts`：`addSaveableContent` 重复 id 告警并保留第一个；`bindSaveableExecuter` 传 id 找不到时静默返回、传未注册对象告警；`loadState` 先清录像禁用标记，每个对象 `disable` → `loadState` → `revert`，执行器在包裹外；缺少键告警，多余键读完告警。
- `packages-user/data-state/src/types.ts`：`PluginStatus` 四值 `NotAwakened` / `Awakened` / `Initialized` / `Loaded`；`ICoreStateConfig` 四字段 `loadStarter` / `coreURL` / `dataPlugins` / `events`；`ISaveableExecutor.afterLoad(data, state)`。
- `packages-user/data-state/src/plugin.ts`：`orderPlugins` 先查缺失依赖，再从每个插件沿依赖边搜索回自身查环，随后把阻断传播到下游，最后反复扫描输出依赖已就绪的插件。
- `packages-user/data-state/src/loader/loader.ts`：`start()` 依次处理核心配置 → 核心配置钩子 → 额外配置 → 额外配置钩子 → 自定义任务；`loading` 与 `dataLoaded` 在当前版本已赋值，重复进入保护与完成后返回成立。
- `src/data.ts`：只重新导出 `createCoreState`。
- `src/data/entry.ts`：`createCoreStateConfig(starter)` 组装 `loadStarter`、`coreURL`、`dataPlugins`（主插件在前）与 `events`；`createCoreState` 返回未经异步初始化的实例。
- `src/data/initialize.ts`：`MainDataPlugin.awake` 注册朝向、注入寻路谓词与移动器、换勇士顶层实现、添加加载钩子、初始化敌人 / 录像 / 钩子，并注册五个可存档对象；`afterLoad` 读取核心配置后创建勇士属性与位置。
- `src/data/plugin/list.ts`：当前业务插件列表只有 `DataShopPlugin`，主插件由入口另行放在最前。
- D-72：复核中发现测试与构造契约的一处不一致，按 D-72 只在对话中报告，未写入文档正文。

## Page Split and Boundary

- `core-state` 讲「装配顺序与生命周期」：构造期装了什么、加载分几段、入口各自负责什么、存档挂在哪里、怎样再建一个实例。
- `plugin-internals` 讲「顺序怎么算出来、失败会怎样」：插件表如何变成拓扑序、状态如何推进、依赖写错会看到什么。
- `core-state` 不解释拓扑排序细节，只在装配顺序末尾提到调用一次 `orderPlugins` 并链接到插件内部页。
- `plugin-internals` 不重讲插件写法：不贴插件类示例、不讲 `list.ts` 注册步骤，只保留到高级 I 插件系统页的链接。
- 两页都不写渲染层、客户端主对象与渲染端插件内部；`dataDeps` 与 `clientDeps` 只在边界里作为「两套依赖不要混用」的一句提示。
- 两页互链成立：`core-state` → `./plugin-internals.md`；`plugin-internals` → `./core-state.md#加载管线`。

## Deliberately Not Written

- L4 / L5 渲染层、客户端主对象与渲染端插件生命周期。
- 完整告警码表；失败只写现象与控制台提示。
- 源码行号、源码叙述、「模板」与「[需改]」标记（D-80 / D-83）。
- 重排构造顺序的做法；边界明确不要重排，也不要手动构造内部子系统。
- `orderPlugins` 的调用示例；只解释它为什么存在。
- 测试与构造契约不一致的具体细节；按 D-72 只在对话报告。
- 侧边栏注册与指向尚不存在 III 导览的链接。

## Gates

- Task 1 自动门禁：`PAGE-OK`。
- Task 2 自动门禁：`PAGE-OK`。
- `node node_modules/prettier/bin/prettier.cjs --write`：两页通过，均为 CRLF（core-state 193 个 CRLF、plugin-internals 121 个 CRLF，0 个孤立 LF）。
- `node node_modules/prettier/bin/prettier.cjs --check docs/advanced/iii/core-state.md docs/advanced/iii/plugin-internals.md`：通过。
- 结构门禁：两页单 H1；内部实现章节均在使用侧之后并以「此章节讲解一下」开头；文末均有「边界与注意」。
- 事实门禁：四层装配、加载四步、入口职责、五个可存档 id、排序四步、四状态、三阶段与失败现象均写入。
- D-52 加粗边界：两页加粗短语均为纯中文，无标点贴边。
- 链接门禁：`../i/plugin-system.md`、`../i/saveable-content.md#注册到存档系统`、`./core-state.md#加载管线`、`./plugin-internals.md` 的目标均存在。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 退出码 0，输出 `build complete in 21.16s`，无 dead link；Task 3 门禁 `GATE-OK`。

## Handoff to 10-39

- 两页尚未注册进 `docs/.vitepress/config.ts` 的「高级 III · 原理与架构」分组（`items: []`）。
- 10-39 创建 `docs/advanced/iii/index.md` 后，需要给两页补 `返回[高级 III 导览](./index.md)` 回链；本计划为保持构建无死链，暂未链接尚不存在的导览。
- 10-39 还需替换 `docs/advanced/index.md` 与 `docs/advanced/ii/index.md` 中「高级 III 尚未编写」的占位，并把两页列入阅读路径。
- 两页已互为兄弟链接，满足 10-39 的同层互链要求；其它 III 页面若在正文提到装配或顺序，可按 10-39 的规则补 `./core-state.md` 与 `./plugin-internals.md`。
- 页面标题为稳定中文标题；10-39 如需链接具体小节，可直接使用 `#加载管线` 等现有标题锚点。

## Deviations from Plan

None - 计划按原样执行。Task 0 的汇报关卡由用户预批准满足，未再单独等待「可以执行」；其余任务按计划完成。

## Issues Encountered

- 工作区存在与本计划无关的既有改动（`packages-user/client-base/src/map/*`、`packages-user/client-base/src/map/__test__/`、`.planning/phases/09-*`），所有提交均只暂存本计划文件。
- 构建产物 `public/_docs/*` 未纳入提交，遵循仓库既有做法。
- 未发现需要暂停执行的阻塞问题；无认证关卡、无包安装。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 两页已可构建、可格式化、无死链；四个要求小节与内部实现章节齐备，边界项完整。
- 10-39 可以直接创建导览、补回链、注册侧边栏并替换占位；10-40 可对两页做读者审阅与章节使用概率评估。

## Self-Check: PASSED

- 文件存在：`docs/advanced/iii/core-state.md`、`docs/advanced/iii/plugin-internals.md`、`.planning/phases/10-docs-restructure/10-38-SUMMARY.md`
- 提交存在：`44f1cd6`（Task 1）、`459bb18`（Task 2）、本次 SUMMARY 提交（Task 3）
- 门禁存在：两页 `PAGE-OK`、prettier `--check` 通过、`build complete in 21.16s`、无 dead link、`GATE-OK`
