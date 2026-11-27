---
phase: 10-docs-restructure
plan: 16
subsystem: docs
tags: [vitepress, documentation, replay, shouldReplay, ignoreReplay, data-common, store, data-engine]

# Dependency graph
requires:
  - phase: 10-docs-restructure
    provides: "10-15 的读档禁用录像与执行器时机、10-14 的插件生命周期、中级教程的录像指令与数据端总览"
provides:
  - "docs/advanced/replay-consistency.md（高级 I 第四篇）"
  - "docs/advanced/data-stores.md（高级 I 第五篇）"
affects: ["10-17", "10-18", "10-19", "10-20"]

actuals:
  tokens: 5519
  tasks: 3
  commits: 3
  plan_head_before: 9142e75e64ac8b13af7597aa77eaf63e1df5891e

tech-stack:
  added: []
  patterns:
    - "录像篇先讲核心原则与两个装饰器职责，再讲落点、保证与不保证、检测边界"
    - "检测机制按源码三个提前返回条件描述，并显式声明收集入口目前只有测试调用"
    - "Store 篇以「定义 vs 实例」四对关系收束只读理由，不把已有对象一概说成不会更新"
    - "两篇各给独立「模板：」小节，模板与具体实操分开（D-50）"
    - "加粗统一用 HTML strong，规避 D-52 flanking 问题"

key-files:
  created:
    - docs/advanced/replay-consistency.md
    - docs/advanced/data-stores.md
  modified: []

key-decisions:
  - "录像篇把「收集区间由谁开启」写成显式边界：入口目前只有测试调用，正文只描述区间开启时的口径"
  - "明确 @ignoreReplay 作用于整段收集区间，而非单个方法，并指出它不能用来消告警"
  - "「能保证 / 不能保证」拆成两栏：前者三条，后者六项不检查项，避免读者把检查当正确性证明"
  - "Store 篇按源码修正：静态图块 raw() 每次现查、动态图块与背包道具缓存定义，因此只承诺「不保证一致」而非「不会更新」"
  - "eventStore.getEvent 按源码写成返回存储的实例（不是副本）；tileStore.getEvent 每次新建 Map 单独说明"
  - "EnemyStore 只说明它不在 IDataCommon 上，不写成主对象入口"
  - "高级 II/III 内容用代码 span 占位，不产生真实链接（D-47）"

patterns-established:
  - "录像标记实操：模板骨架 + 六步实操（含手动开收集区间的可运行验证）"
  - "Store 注册实操：机制骨架（无逐对象模板）+ 插件 awake 落点 + 三个观察验证只读理由"
  - "把「没有标记就没有告警」写成教学点，避免读者把无告警当成没问题"

requirements-completed: []

coverage:
  - id: D1
    description: "高级 I 第四篇：录像一致性（装饰器落点、保证与不保证、检测机制与边界、模板、六步实操、常见错误、验证）"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, dead link = 0"
        status: pass
    human_judgment: true
    rationale: "文档质量需用户人工审阅（D-46 第 2 阶段），自动化只能验证构建、链接与关键内容存在性"
  - id: D2
    description: "高级 I 第五篇：data-common 的 Store（四个 Store 各存什么、键与读取接口、运行时只读原因、注册位置、模板、六步实操、验证）"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, dead link = 0"
        status: pass
    human_judgment: true
    rationale: "文档质量需用户人工审阅（D-46 第 2 阶段），自动化只能验证构建、链接与关键内容存在性"

duration: 13min
completed: 2026-10-20
status: complete
---

# Phase 10 Plan 16: 录像一致性与 data-common 的 Store Summary

**高级 I 第四、五篇落地：把「该不该标录像装饰器」和「能不能改内容层 Store」变成可判断的规则——前者给出两个装饰器的落点与检查边界，后者给出四个 Store 的定义/实例对照与加载期注册骨架**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-10-20T06:24:00Z
- **Completed:** 2026-10-20T06:37:00Z
- **Tasks:** 3
- **Files modified:** 2 created

## Accomplishments

- 新建 `docs/advanced/replay-consistency.md`（单 H1、CRLF、数据端 only），承接中级 `replay-commands.md` 与 10-15 的读档禁用录像结论。
- 讲清两个装饰器的职责与差异：`@shouldReplay` 在收集区间内登记路径、本身不写录像；`@ignoreReplay` 置全局标记，<strong>整段区间</strong>跳过核对，不是单方法局部生效。
- 给出落点判定：写在玩家动作可达且真正改状态的方法上，列出 Flag / 道具 / 装备 / 属性 / 位置 / 图层六类内置先例；明确只读、试算、展示与搜索路径都不该标。
- 「能保证什么、不能保证什么」拆两栏：能保证的是「区间内没有新录像步就告警并列出路径」；不保证逻辑、参数、顺序、一一对应、漏入口与自动记录。
- 检测机制按 `replay/func.ts` 逐条描述：`beginReplaySafetyCollection` 记 `beforeLength` 并清空路径；`endReplaySafetyCollection` 三个提前返回条件；告警码 `159` / `160` / `161` / `162`；`logReplaySafetyDetail` 打印嵌套路径树。
- 按源码核对后写出关键边界：收集入口目前只在 `replay/__test__/func.test.ts` 中调用，正文只描述「区间开启时」的检测口径，不臆造每步自动检测。
- 读档边界按 `data-state/src/core.ts` 描述：`loadState` 被 `disable` / `revert` 包裹，执行器不在包裹内。
- 独立「模板：给方法加录像标记」小节（`[模板]` / `[需改]`）；六步实操落在 `packages-user/data-base/src/flag/system.ts`，并给出可运行的手动收集区间验证（含「去掉标记告警反而消失」的教学点）。
- 新建 `docs/advanced/data-stores.md`（单 H1、CRLF、数据端 only），回指中级 `data-state-overview.md`、`tile-store.md`。
- 逐个讲清四个 Store：`tileStore`（图块数字 → `ITileRawData`，含双向索引与默认事件）、`itemStore`（道具图块数字 → `IItemRawData`，构造接收 `tileStore` 做换算）、`mapStore`（`floorId` → `IMapRawData`）、`eventStore`（事件 id → 事件实例）。
- 用四对「定义 vs 实例」关系讲只读理由，并按源码区分取用方式：静态图块 `raw()` 每次现查、动态图块与背包道具缓存定义、运行时楼层由 `fromRaw` 一次性构造、事件派发按 id 现查。
- 给出运行时写 Store 的四个后果（不进存档 / 不进录像 / 不保证更新已有对象 / 绕过检查）与正确注册位置表（`awake` / `initialize` / `afterLoad` / 专门初始化函数）。
- 明确 `eventStore.getEvent` 返回的是存储的实例、不要修改；`tileStore.getEvent` 例外地每次新建 `Map`；`EnemyStore` 不在 `IDataCommon` 上。
- 独立「模板：在加载期注册 Store 原始数据」小节，并解释 Store 注册为什么没有逐对象模板（`add*` 是逐条登记原始定义，不实现接口）。
- 六步实操落在插件 `awake` 的注册段；「怎么验证」用三个观察说明为什么不该在运行时改定义。
- 两篇均含 D-49.3 原句、常见错误、怎么验证与小结；prettier 通过；`pnpm docs:build` 输出 `build complete`，无 dead link。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 replay-consistency.md** - `65801ea` (docs)
2. **Task 2: 编写 data-stores.md** - `25e8dcb` (docs)
3. **Task 3: 两篇源码核对、格式与构建收口** - `30b7d86` (docs)

**Plan metadata:** `docs(10-16): complete replay-consistency and data-stores plan`（本 SUMMARY 的提交）

## Files Created/Modified

- `docs/advanced/replay-consistency.md` - 录像一致性高级教程：核心原则、两个装饰器、落点、保证与不保证、检测机制与边界、模板、六步实操、常见错误、验证
- `docs/advanced/data-stores.md` - data-common 的 Store 高级教程：四个 Store 逐讲、定义与实例、只读理由、注册位置、模板、六步实操、常见错误、验证

## Decisions Made

- 检测口径按源码事实写成「收集区间开启时」；把「入口目前只有测试调用」写成显式边界与手动验证方式，不写成缺陷（D-14）。
- 「能保证 / 不能保证」用两栏而非一段话，避免读者把检测当成正确性证明；「没标记就没有告警」被单独提升为教学点。
- Store 篇最初草稿把「改 Store 不影响已有对象」一概而论，Task 3 核对 `staticTile.ts` / `dynamicTile.ts` 后改为区分现查与缓存，只承诺「不可依赖」。
- `tileStore.getEvent` 的返回语义与 `eventStore.getEvent` 分开写：前者每次新建 `Map`，后者返回存储的实例，避免一句话概括掩盖差异。
- `EnemyStore` 只作为「还有一张原始数据表，但不在 `IDataCommon` 上」的说明，不给出任何主对象访问路径。
- 两篇的高级 II/III 内容统一用代码 span 占位（`高级 II · 自定义录像行为` 等），不产生真实链接（D-47）。

## Deviations from Plan

None - plan executed exactly as written.

（Task 3 源码核对阶段修正了两处表述：Store 与已有对象的关系、以及通行掩码的用词；均在同一 Task 3 提交前完成，未产生计划外提交。）

## Issues Encountered

- 首轮静态门禁在 `**能保证的：**` / `**不能保证的：**` 上触发 D-52 flanking 检查，改为 `<strong>` + 全角冒号后通过。
- 构建仅出现 Vite 的 chunk 体积警告，不影响 `build complete`；无 dead link。
- 仓库中 `.planning/*` 与 `pnpm-lock.yaml` 在本次执行前已有未提交修改，未纳入本计划的任何提交。
- 本计划三个任务提交完成后，区间内出现一条并发会话的提交 `a147188 docs(09-21): 重写为 revision 4`（只改 `09-21-PLAN.md`，与本计划无关）。因此用 `plan_head_before..HEAD` 统计会多出这一条；本计划自身提交数为 3。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10-17（钩子深入）可直接引用本篇的 Store / 录像说法，无需重复解释 `state` 入口。
- 高级 I 的「录像一致性」与「data-common 的 Store」两篇已与中级 `replay-commands.md`、`data-state-overview.md`、`tile-store.md` 双向打通。
- 待用户按 D-46 第 2 阶段、D-57 的人格（懂基本语法但代码能力一般）做人工审阅。

## Self-Check: PASSED

- `docs/advanced/replay-consistency.md` exists.
- `docs/advanced/data-stores.md` exists.
- `65801ea`, `25e8dcb`, `30b7d86` exist in git history.
- Static gates: `STATIC-OK`（两篇）；build gate: `GATE-OK`，`build complete`，dead link = 0。

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-20_
