---
phase: 10-docs-restructure
plan: 36
subsystem: docs
tags: [vitepress, markdown, advanced-iii, event-system, anon-tokyo, interpreter]

requires:
    - phase: 10-docs-restructure
      provides: 10-35 已完成 docs/advanced/iii/replay-internals.md，III 目录存在且侧边栏仍为空
provides:
    - docs/advanced/iii/event-system.md：事件仓库、事件对象、收集、执行与折叠、事件层，以及自定义内建函数
    - docs/advanced/iii/anon-tokyo.md：语句模型、编译产物、执行上下文与迭代器，以及与事件对象的衔接
affects: [10-39 侧边栏注册与互链, 10-40 读者审阅]

actuals:
    tokens: 3819
    tasks: 4
    commits: 3
    plan_head_before: 0db7800ff50cebb0d95166569d88083f98fdd4b4

tech-stack:
    added: []
    patterns:
        - 系统类页面先讲模型再讲接口（D-82）：事件页从仓库、对象、收集器、执行器、解释器讲起
        - 使用与原理分段（D-77）：事件页以自定义内建函数为重心，解释器页以理解模型为主
        - 纯内部实现章节后置并以「此章节讲解一下」开头（D-69）
        - 边界与特殊情况统一放文末「边界与注意」（D-61）
        - 代码块给完整类或函数上下文并带解释性注释（D-62 / D-65 / D-70）
        - 触发器只写「三个已派发 + 其余预留」，避免把枚举当成已实现能力

key-files:
    created:
        - docs/advanced/iii/event-system.md
        - docs/advanced/iii/anon-tokyo.md
        - .planning/phases/10-docs-restructure/10-36-SUMMARY.md
    modified: []

key-decisions:
    - Task 0 的汇报关卡已由用户预批准满足：用户明确表示「这些都是文档编写工作，不涉及代码本身，直接批准执行 10-33 至 10-37」，本计划据此继续，未再单独等待「可以执行」
    - 触发器表述固定为「当前数据端内置派发只覆盖进入、离开、触碰，其余值是枚举的一部分，由对应系统使用或预留」，不写成全部已实现
    - 收集顺序写成「点事件整组优先、图块事件整组在后，各组内部按优先级降序」，并明确优先级只在组内比较
    - 执行器语义写成「缺失事件告警并跳过、触发器不匹配静默跳过、CutIf 模式短路、OrReduce / AndReduce 非布尔告警」，并说明执行入口带录像标记
    - 自定义内建函数给出两个完整类（设置 Flag、勇士回血）、参数接口与注册路径；新增触发器枚举值明确为引擎级改动，不鼓励
    - 解释器页保持独立成页，没有与事件页合并；两页分工为「事件页讲谁收集、谁执行、内建函数怎么写」与「解释器页讲脚本怎么编译成程序、怎么迭代执行」
    - 解释器页把「缺少全局函数」写成调用时抛错，而不是编译期抛错，按当前接口行为落笔
    - 为满足 10-39 的锚点契约，在保留标题文字的前提下给「收集」章节追加显式锚点 `{#收集这一次该执行谁}`；VitePress 默认会把全角冒号转成连字符
    - 未在 docs/.vitepress/config.ts 注册本两页，也未链接尚不存在的 III 页面；留给 10-39

patterns-established:
    - 高级 III 事件页结构：系统模型 → 事件与触发器 → 收集 → 执行与折叠 → 事件层 → 自定义内建函数 → 边界
    - 高级 III 解释器页结构：系统模型 → 语句模型 → 与事件对象的衔接 → 内部实现 → 自定义内建函数与全局函数 → 边界
    - 章节锚点需要长期稳定时，用 VitePress 显式锚点语法锁定，避免中文标点被 slug 化后与外部链接不一致

requirements-completed: []

coverage:
    - id: D1
      description: 事件页讲清事件仓库、事件对象、收集顺序、执行与折叠、事件层，并给出可注册的内建函数完整写法
      verification:
          - kind: other
            ref: '10-36-PLAN.md Task 1 自动门禁 PAGE-OK；人工对照 packages-user/data-common/src/{event,store}/* 与 packages-user/data-system/src/event/*'
            status: pass
      human_judgment: false
    - id: D2
      description: 解释器页讲清语句模型、编译产物、执行上下文与迭代器，以及与事件对象的缓存衔接
      verification:
          - kind: other
            ref: '10-36-PLAN.md Task 2 自动门禁 PAGE-OK；人工对照 packages/anon-tokyo/src/{interpreter,type,compile}.ts'
            status: pass
      human_judgment: false
    - id: D3
      description: 两页互链成立，prettier --check 通过，构建 build complete 且无 dead link
      verification:
          - kind: other
            ref: 'prettier --check 通过；cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build" 输出 build complete in 19.63s，无 dead link'
            status: pass
      human_judgment: false

duration: 约 30 分钟
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 36: 事件系统与 Anon-Tokyo 解释器 Summary

**写出高级 III 的事件两篇：事件页从仓库、对象、收集器、执行器讲到折叠与事件层，并给出可注册的内建函数；解释器页讲清语句如何编译成程序、上下文与迭代器如何执行，两页用真实相对链接互指。**

## Performance

- **Duration:** 约 30 分钟
- **Completed:** 2026-10-26
- **Tasks:** 4/4（Task 0 由用户预批准满足；Task 1 / 2 / 3 已执行）
- **Files created:** 3（两页 + 本 SUMMARY）

## Accomplishments

- 新建 `docs/advanced/iii/event-system.md`，单 H1《事件系统》，268 行。
- 主体结构为：`系统模型` → `事件与触发器` → `收集：这一次该执行谁` → `执行与折叠` → `事件层` → `自定义一个内建函数` → `边界与注意`。
- 系统模型用一张角色表与一张 `text` 数据流图讲清事件仓库、事件对象、收集器、执行器与解释器的分工。
- 触发器表完整列出 11 个枚举值，并逐行标注「数据端当前派发」；正文明确只有进入、离开、触碰三个时机有派发点，其余由对应系统使用或预留。
- 收集小节写清坐标判断、点事件与图块事件的来源、两组各自按优先级降序再拼接、调用项只有 `id` 与 `env`、`collectEvent` 不按事件自身触发器过滤；附一个打印来源、优先级与执行顺序的完整函数。
- 执行小节写清缺失仓库或事件告警 171、触发器不匹配静默跳过、`CutIfFalsy` / `CutIfTruthy` 短路、`OrReduce` / `AndReduce` 非布尔告警 172、执行器模式是共享状态、执行入口带录像标记；附一个用或折叠执行并读取合并结果的完整函数。
- 事件层小节写清它是 `alias` 为 `event` 的普通图层、`IGameMap.eventLayer` 是当前楼层默认事件层、切换楼层后使用目标楼层自己的事件层。
- 自定义内建函数小节给出两个完整类（`setFlag` 与 `healHero`）、参数接口、`createEventRegistrations()` 注册路径、`env` 常用字段与 `getPossibleLayer` 的取法，并提示新增触发器枚举值属于引擎级改动。
- 新建 `docs/advanced/iii/anon-tokyo.md`，单 H1《Anon-Tokyo 解释器》，165 行。
- 解释器页结构为：`系统模型` → `语句模型` → `与事件对象的衔接` → `内部实现：编译与执行` → `自定义内建函数与全局函数` → `边界与注意`。
- 语句模型完整列出 `StatementType` 的 11 个种类，说明块用语句数组表示、函数声明只出现在枚举里；同时给出表达式、值、作用域三层与四种执行操作。
- 与事件对象的衔接写清 `GameEvent` 缓存编译产物、`setRaw` 清空缓存、没有编译产物时可退回直接执行原始语句；解释器不负责触发器过滤与坐标收集。
- 内部实现以「此章节讲解一下 Anon-Tokyo 的执行循环的内部实现」开头，讲编译期解析内建函数、运行期创建上下文与压栈，并给出「编译一次、多次执行」的完整示例。
- 两页互链：事件页引言链接 `./anon-tokyo.md`，解释器页引言链接 `./event-system.md`，解释器页自定义小节链接 `./event-system.md#自定义一个内建函数`。

## Task Commits

1. **Task 1: 复核事件事实并落稿 event-system.md** — `9fee3c4`（docs）
2. **Task 2: 落稿 anon-tokyo.md 并收口两页互链** — `f3e9ea7`（docs）
3. **Task 3: 两页格式与构建门禁、写 SUMMARY** — 本次 SUMMARY 提交（docs）

**Plan metadata:** 本次 SUMMARY 提交同时包含两页锚点修正。

## Files Created/Modified

- `docs/advanced/iii/event-system.md` — 事件系统的模型、触发器、收集、执行与折叠、事件层与自定义内建函数。
- `docs/advanced/iii/anon-tokyo.md` — 解释器的语言特性、语句模型、编译产物、执行上下文与迭代器。
- `.planning/phases/10-docs-restructure/10-36-SUMMARY.md` — 本计划执行记录。

## Fact Verification

正文事实按当前源码复核，research 的行号未直接搬入页面：

- `packages-user/data-common/src/event/types.ts`：`EventTrigger` 的 11 个值、`IReadonlyGameEvent` 与 `IGameEvent` 的字段与方法。
- `packages-user/data-common/src/event/event.ts`：`GameEvent` 的 `trigger` / `rawEvent` / `compiled`、`compile()` 缓存、`execute()` 优先级、`setRaw` 清空缓存、`setTrigger`。
- `packages-user/data-common/src/store/eventStore.ts`：`addEvent` 重复 id 告警 170 并覆盖、`getEvent(id)` 返回实例或 `null`。
- `packages-user/data-system/src/event/system.ts`：`collectEvent` 的坐标判断、点事件与图块事件来源、两组分别排序后拼接、`env` 十个字段。
- `packages-user/data-system/src/event/executor.ts`：缺失事件告警 171、触发器不匹配跳过、`CutIfFalsy` / `CutIfTruthy`、`OrReduce` / `AndReduce` 非布尔告警 172、`@shouldReplay`。
- `packages-user/data-system/src/event/types.ts`：`BlockEventType`、`IBlockEventEnv`、`IGameEventInvocation`、`EventExecuteMode`、`EventReduceMode`、`collectEvent` 的接口注释。
- `src/data/hero/moverImpl.ts`：只有 `enter` / `leave` / `hit` 三个派发点，分别对应 `OnEnter` / `OnLeave` / `OnTouch`；`cannotEnter` 为空实现。
- `src/data/event/{map,hero,event,registrations,types,utils}.ts`：内建函数类的 `name` / `func`、参数接口位置、注册数组、`getPossibleLayer` / `getPossibleMap`。
- `packages/anon-tokyo/src/interpreter.ts`：`BuiltInFunction`、`LanguageFeature`、`AnonTokyoInterpreter`、`AnonTokyoExecutable`、`AnonTokyoExecutionContext`、`AnonTokyoIterator` 的注册、编译、执行与四种操作。
- `packages/anon-tokyo/src/type.ts`：`StatementType` 的 11 个值、`Expression` / `Value` / `Block`、`Scope` 三层、`OPType` 四值。
- 解释器页把「缺少全局函数」写成调用时抛错：当前实现是在 `Call` 执行时按名字查表，而不是编译期预解析全局调用。
- 未把与实现不一致的注释写进正文；相关条目只在对话中报告（D-72）。

## Page Split and Boundary

- 事件页只讲「谁收集、谁执行、内建函数怎么写」，不解释迭代器循环与编译细节。
- 解释器页只讲「脚本怎么编译成程序、怎么迭代执行」，不重讲坐标收集、事件仓库与触发器过滤。
- 两页都不重复高级 I 的 `data-stores` 事件仓库用法，也不重复高级 II 的 `point-and-tile-events` 两类事件归属；对应位置只链接。
- 两页都在文末单列「边界与注意」；事件页 10 条、解释器页 9 条。

## Deliberately Not Written

- 序列化事件注册、地图事件 id 绑定与编辑器识别规则；只在事件页边界留一句「由编辑器负责」。
- 完整内建事件目录与事件脚本语法全量。
- 事件页不解释解释器内部的程序节点与迭代循环；解释器页不解释事件收集。
- 解释器页不写 `dump()` 能力，也不给 `save` 字段赋予存档或录像语义。
- 源码行号、源码叙述、「模板」与「[需改]」标记（D-80 / D-83）。
- 侧边栏注册与指向尚不存在 III 页面的链接。

## Gates

- `node node_modules/prettier/bin/prettier.cjs --check docs/advanced/iii/event-system.md docs/advanced/iii/anon-tokyo.md`：通过（All matched files use Prettier code style）。
- Task 1 自动门禁：`PAGE-OK`；Task 2 自动门禁：`PAGE-OK`。
- 结构门禁：两页均 CRLF、单 H1；七个事件小节与六个解释器小节齐备；解释器内部实现章节后置且以规定句式开头；两页文末均有「边界与注意」。
- 误导门禁：触发器表述含「未派发 / 预留」限定，无「全部已实现」；无「模板」「[需改]」；无 `src/client`；解释器页无 `dump(`。
- 链接门禁：相对 `.md` 目标全部存在；两页互链成立；事件页含 `../../intermediate/events.md` 与 `../i/data-stores.md`；解释器页含 `../../intermediate/events.md` 与 `../i/data-stores.md`。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`，退出码 0，输出 `build complete in 19.63s`，无 `dead link`。
- 渲染抽查：`public/_docs/advanced/iii/event-system.html` 中 H1 = 1、表格 = 3、TS 代码块 = 5、text 代码块 = 1；`anon-tokyo.html` 中 H1 = 1、表格 = 5、TS 代码块 = 1。
- 锚点抽查：`public/_docs/advanced/iii/event-system.html` 中「收集」章节的 id 为 `收集这一次该执行谁`，与 10-39 计划使用的链接一致。

## Handoff to 10-39

- 本两页尚未注册进 `docs/.vitepress/config.ts` 的「高级 III · 原理与架构」分组（`items: []`），也未链接尚未存在的 III 导览或其它 III 页面。
- 10-39 需要：注册两页到侧边栏、替换 `docs/advanced/index.md` 与 `docs/advanced/ii/index.md` 中「高级 III 尚未编写」的占位，并在 III 导览中把两页列入阅读路径。
- 事件页「收集」章节已用显式锚点锁定为 `#收集这一次该执行谁`；10-39 直接使用该锚点即可，不需要改标题。
- 可顺手把其它页面对「事件系统」「解释器」的占位改为指向本两页的真实链接。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 给「收集」章节追加显式锚点，保证 10-39 的链接可用**

- **Found during:** Task 3（构建后的锚点抽查）
- **Issue:** 计划要求标题逐字为 `## 收集：这一次该执行谁`，同时约定 10-39 链接到 `#收集这一次该执行谁`。VitePress 默认会把全角冒号 slug 成连字符，实际生成 `#收集-这一次该执行谁`，两者不一致，10-39 的链接会变成死链。
- **Fix:** 保留标题文字不变，在行尾追加 VitePress 显式锚点 `{#收集这一次该执行谁}`；渲染后的标题仍是「收集：这一次该执行谁」，锚点变为约定值。
- **Files modified:** `docs/advanced/iii/event-system.md`
- **Verification:** 重新构建后检查 `public/_docs/advanced/iii/event-system.html`，`id="收集这一次该执行谁"` 存在，连字符锚点不存在。
- **Committed in:** 本次 SUMMARY 提交。

**2. [Rule 1 - Bug] 修正「缺失全局函数」的报错时机**

- **Found during:** Task 2（落稿 anon-tokyo.md）
- **Issue:** 计划边界写「缺失内建或全局函数会在编译期直接抛错」；当前实现对内建函数是编译期查表抛错，对全局函数是执行到 `Call` 时才按名字查表抛错。
- **Fix:** 正文与边界按实际接口行为分别写成「缺少内建函数在编译时抛错」「缺少全局函数在调用时抛错」。
- **Files modified:** `docs/advanced/iii/anon-tokyo.md`
- **Verification:** 对照 `packages/anon-tokyo/src/interpreter.ts` 的 `compile` / `getBuiltInFunction` / `getGlobalFunction` / `callByName`。
- **Committed in:** `f3e9ea7`（Task 2 提交）。

---

**Total deviations:** 2 auto-fixed（1 blocking、1 bug）
**Impact on plan:** 两项都不改变页面分工与内容范围；第一项保证 10-39 的既定锚点可用，第二项避免把报错时机写错。

## Issues Encountered

- 工作区存在与本计划无关的既有改动（`packages-user/client-base/*`、`.planning/phases/09-*`、`packages-user/client-base/src/map/__test__/`），所有提交均只暂存本计划文件。
- 构建产物 `public/_docs/*` 未纳入提交，遵循仓库既有做法。
- 未发现需要暂停执行的阻塞问题；无认证关卡、无包安装。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 事件与解释器两页已可构建、可格式化、无死链，锚点契约已锁定。
- 10-39 可以直接注册侧边栏并建立 III 导览与互链；10-40 可对两页做读者审阅与使用概率评估。

## Self-Check: PASSED

- 文件存在：`docs/advanced/iii/event-system.md`、`docs/advanced/iii/anon-tokyo.md`、`.planning/phases/10-docs-restructure/10-36-SUMMARY.md`
- 提交存在：`9fee3c4`（Task 1）、`f3e9ea7`（Task 2）、本次 SUMMARY 提交（Task 3）
- 门禁存在：`PAGE-OK`、prettier `--check` 通过、`build complete in 19.63s`、无 dead link、锚点 `收集这一次该执行谁` 存在
