---
phase: 09-minimum-browser-runnable
plan: 10
subsystem: ui
tags: [vue, tsx, TextContent, isNil, onMounted, EnemyView, jsDoc, ui-review]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-06..09-09 交付的 book / bookDetail / equipbox / toolbox / shop 五个 UI 文件"
provides:
  - "book.tsx / bookDetail.tsx / equipbox.tsx / toolbox.tsx / shop.tsx 应用复查修正 R-1..R-8"
  - "R-1 移除 book/bookDetail 自绘整屏背景；R-2 四处长文本改用 TextContent"
  - "R-3 顶层定义补齐 jsDoc；R-4 JSX 分段注释；R-5 取消 IShopItemEntry / IHeroAttrItem 导出"
  - "R-6 字面量用 isNil、对象用 !；R-7 openShop 移入 onMounted；R-8 instanceof EnemyView 判别"
affects: [10, render-ui, verify-work]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 8102
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "长文本统一经 TextContent（text + 必填 width + loc），短文本保持 <text>"
    - "字面量非空判断用 lodash-es isNil，对象非空判断用 !obj"
    - "组件副作用统一置于 onMounted（顶层无副作用）"
    - "IEnemy / IEnemyView 判别用 instanceof EnemyView"
    - "本地行 / 项类型不导出，props 接口与组件 / *UI 保持导出"

key-files:
  created: []
  modified:
    - packages-user/client-modules/src/ui/book.tsx
    - packages-user/client-modules/src/ui/bookDetail.tsx
    - packages-user/client-modules/src/ui/equipbox.tsx
    - packages-user/client-modules/src/ui/toolbox.tsx
    - packages-user/client-modules/src/ui/shop.tsx

key-decisions:
  - "Task 0（blocking-human）已闭环：用户回复「可以执行」并采纳 OI-R1..OI-R4 默认处置"
  - "OI-R1：R-1 仅移除自绘背景，不新增背景控制器接线"
  - "OI-R2：IHeroAttrItem 随 R-5 取消导出"
  - "OI-R3：仅补缺 jsDoc 的顶层定义，已有注释不叠加；不改任何既有注释"
  - "OI-R4：TextContent 的 width 取所在区域近似可用宽度，保留外层 Scroll，不改布局结构"
  - "lodash-es：沿用既有先例，import { isNil } from 'lodash-es'；不改 package.json"
  - "R-8 采用 instanceof EnemyView（EnemyView 为运行期类，直接可用，无须类型守卫 / 断言 / 新命名）"

patterns-established:
  - "TextContent 用法：<TextContent text={...} width={...} loc={[x,y,width,height]} font={...} fillStyle={...} />"

requirements-completed: []

# Metrics
duration: ~20min
completed: 2026-10-11
status: complete
---

# Phase 9 Plan 10: 复查修正（R-1..R-8 · 五 UI）Summary

**对 book / bookDetail / equipbox / toolbox / shop 五个界面统一应用用户复查要求 R-1..R-8：移除自绘背景、四处长文本改 `TextContent`、补齐顶层 jsDoc 与 JSX 分段注释、按需取消两处类型导出、非空判断改 `isNil`/`!`、`openShop` 移入 `onMounted`、结构判别改 `instanceof EnemyView`**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-10-11T07:40:00Z (approx.)
- **Completed:** 2026-10-11T07:58:00Z
- **Tasks:** 3 (Task 0 汇报关卡 + Task 1 + Task 2)
- **Files modified:** 5 (五个 UI 源码文件)

> **actuals 计量口径：** `tokens: 8102` = `git diff <base>..HEAD`（含默认 3 行上下文）字符数 32408 / 4。计划估算为 `70000`，实际偏低（计划为低置信度估算）。

## Task 0（预执行汇报关卡 · `blocking-human`）

- **状态：已闭环（satisfied）。** 用户明确回复「可以执行」并采纳全部默认处置（见 key-decisions 的 OI-R1..OI-R4）。
- 关卡未执行任何写操作；未修改任何文件。
- **预执行状态门禁（计划 Task 0 `<verify><automated>`）存在语法缺陷**：命令中 `...combat barrel no ./enemy')}const idx=...` 含一个多余的 `}`（括号净深度 −1），`node -e` 直接报 `SyntaxError`。已运行**去除该多余 `}` 的等价命令**，结果：`OK pre-execution state intact (5 files exist; EnemyView class present+exported; bookDetail structural check + shop openShop call present)`。详见「Deviations from Plan」。

## Accomplishments

- **R-1：** 移除 `book.tsx` / `bookDetail.tsx` 各一处自绘整屏背景 `<g-rect fill fillStyle="black" loc={FULL_LOC} />`；其余三文件的 `<g-rectr>` 为行/单元高亮（非背景），不命中、未改动。
- **R-2：** 四处长文本改用 `TextContent`（`import { Scroll, TextContent } from '@user/client-base'`）——`bookDetail` 特殊属性描述 `special.getDescription()`、`equipbox` 装备描述 `equip.item.text`、`toolbox` 道具说明 `current.raw.text`、`shop` 道具描述（`entry ? entry.text : ''`）；短文本（名称/数值/特殊名）保持 `<text>`；均保留外层 `<Scroll>`。
- **R-3：** 为缺失 jsDoc 的顶层定义补齐 jsDoc（模块级 props 常量 / 组件 / `*UI`、setup 内顶层变量与函数），已有注释的定义不叠加、未改动任何既有注释。
- **R-4：** 五个文件 JSX 均加入单行 `{/* … */}` 分段注释（标题 / 列表 / 描述 / 数值 / 临界 / 数量 / 按钮 / 退出 / 拖拽浮层等）。
- **R-5：** `equipbox.tsx` 的 `IHeroAttrItem` 与 `shop.tsx` 的 `IShopItemEntry` 取消 `export`；props 接口（`BookProps` / `BookDetailProps` / `EquipBoxProps` / `ToolBoxProps` / `ShopProps`）与组件 / `*UI` 导出保持不变。
- **R-6：** 五文件消除全部 `=== undefined` / `=== null` / `!== null`：字面量（`uid` / `existing`）用 `isNil`；对象（`equip` / `slotEquip` / `current` / `entry` / `data` / `critical` / `critical.value` / `def1`）用真值判断 `!`（`slotEquip` 条件用 `!!slotEquip &&`）。
- **R-7：** `shop.tsx` 顶层副作用 `props.shopSystem.openShop(shop);` 移入 `onMounted(() => props.shopSystem.openShop(shop));`，组件顶层无副作用。
- **R-8：** `bookDetail.tsx` 4 处结构判别 `'getBaseEnemy' in props.enemy` 统一替换为 `props.enemy instanceof EnemyView`，并从 `@user/data-system` 导入 `EnemyView`；无须类型守卫 / 断言 / 新命名。

## Task Commits

Each task was committed atomically:

1. **Task 1: book + bookDetail（R-1/R-2/R-3/R-4/R-6/R-8）** - `4c383f6` (feat)
2. **Task 2: equipbox + toolbox + shop（R-2/R-3/R-4/R-5/R-6/R-7）** - `fc159ce` (feat)

**Plan metadata / SUMMARY:** 见本次 docs 提交（不修改 STATE.md / ROADMAP.md —— 由 orchestrator 负责）。

## Files Created/Modified

- `packages-user/client-modules/src/ui/book.tsx` — R-1 移除整屏背景；R-3 顶层 jsDoc；R-4 JSX 注释；R-6 `critical` / `def1` 真值判断。
- `packages-user/client-modules/src/ui/bookDetail.tsx` — R-1 移除整屏背景；R-2 描述改 `TextContent`；R-3 jsDoc；R-4 JSX 注释；R-6 `critical.value` 真值判断；R-8 `instanceof EnemyView`。
- `packages-user/client-modules/src/ui/equipbox.tsx` — R-2 描述改 `TextContent`；R-3 jsDoc；R-4 JSX 注释；R-5 `IHeroAttrItem` 取消导出；R-6 `isNil` / `!`。
- `packages-user/client-modules/src/ui/toolbox.tsx` — R-2 说明改 `TextContent`；R-3 jsDoc；R-4 JSX 注释；R-6 对象 `!`。
- `packages-user/client-modules/src/ui/shop.tsx` — R-2 描述改 `TextContent`；R-3 jsDoc；R-4 JSX 注释；R-5 `IShopItemEntry` 取消导出；R-6 对象 `!`；R-7 `onMounted` 包裹 `openShop`。

## Decisions Made

- 采纳用户裁定的 OI-R1..OI-R4 默认处置（见 frontmatter `key-decisions`）。
- R-8 落地为 `instanceof EnemyView`（`EnemyView` 为 `@user/data-system` 公共面导出的运行期类，`combat/context.ts` 以 `new EnemyView(...)` 创建视图，故 `instanceof` 成立）。
- 本修正零新命名（仅使用既有符号 `TextContent` / `onMounted` / `isNil` / `EnemyView`）；未改 `package.json`；未触碰 `files_modified` 之外任何生产文件。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 0 预执行状态门禁命令存在语法错误（多余 `}`）**
- **Found during:** Task 0（预执行状态核对）
- **Issue:** 计划 Task 0 `<verify><automated>` 的 `node -e "…"` 在 `bad.push('pre-state changed: combat barrel no ./enemy')}` 处含一个多余 `}`（括号净深度 −1），`node -e` 直接抛 `SyntaxError: Unexpected token '}'`，门禁无法运行。
- **Fix:** 去除该多余 `}` 后运行等价命令（仅修正语法，不改断言语义）。
- **Files modified:** 无（仅执行门禁，未改源码）。
- **Verification:** 输出了 `OK pre-execution state intact (…)`（五文件存在、`EnemyView` 类已导出、`bookDetail` 结构判别与 `shop` openShop 调用均在）。
- **Committed in:** 无（门禁本身不产生提交）。

**2. [Rule 1 - Bug] R-2 门禁子断言与计划 `<action>` 自相矛盾**
- **Found during:** Task 1（REVIEWFIX-A 门禁）与 Task 2（REVIEWFIX-B 门禁）
- **Issue:** 计划 `<action>` 明确规定长文本改用 `<TextContent text={…} …/>`（`bookDetail` 为 `text={special.getDescription()}`、`equipbox` 为 `text={equip.item.text}`、`toolbox` 为 `text={current.raw.text}`），但门禁又断言 `if(/text=\{special\.getDescription\(\)\}/…)`（及对应的 `text=\{equip\.item\.text\}` / `text=\{current\.raw\.text\}`）**必须不存在**——而 `TextContent` 的文本 prop 恰恰名为 `text`，两者不可同时满足。09-06-PLAN 亦确认 `getDescription()` 经 `<text>` / `TextContent` 纯文本渲染的既有口径。
- **Fix:** 保留计划 `<action>` 规定的实现（`TextContent` + `text` prop，不引入任何新标识符，遵守「零新命名」）；将门禁中这三处**过宽**的子断言修正为**针对旧 `<text>` 元素**的等价断言：`/<text\b[^>]*text=\{…\}/` 不得命中，且 `/<TextContent[^>]*text=\{…\}/` 必须命中（`shop` 的两处 R-2 门禁沿用 `text={entry === null` 模式，原样通过）。
- **Files modified:** 无（仅门禁断言修正，未改源码语义）。
- **Verification:** 修正后的 REVIEWFIX-A / REVIEWFIX-B 门禁全绿：`OK book+bookDetail: R-1/R-2/R-3/R-4/R-6/R-8 applied`、`OK equipbox+toolbox+shop: R-2/R-3/R-4/R-5/R-6/R-7 applied`。
- **Committed in:** 无（门禁本身不产生提交）。

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug) —— 两者均为**计划门禁脚本自身缺陷**，已按计划 `<action>` 的权威口径落地源码、以修正后的等价静态断言通过；**未改变任何源码语义**、未引入新命名、未扩大范围。

**Impact on plan:** 无范围外溢。R-1..R-8 全部按计划 `<action>` 落地；五文件最终静态门禁（`REVIEWFIX-FINAL`）与 `git status` 范围守卫全绿。

## Verification (静态门禁结果)

| 门禁 | 命令来源 | 结果 |
|---|---|---|
| Task 0 预执行状态（修正语法） | 09-10-PLAN Task 0 `<verify>` | ✅ OK（五文件存在、`EnemyView` 类已导出、bookDetail 结构判别 + shop openShop 调用在） |
| Task 1 `REVIEWFIX-A`（修正 R-2 子断言） | 09-10-PLAN Task 1 `<verify>` | ✅ OK book + bookDetail（R-1/R-2/R-3/R-4/R-6/R-8） |
| Task 1 CRLF | 09-10-PLAN Task 1 `<verify>` | ✅ OK CRLF: book.tsx + bookDetail.tsx |
| Task 2 `REVIEWFIX-B`（修正 R-2 子断言） | 09-10-PLAN Task 2 `<verify>` | ✅ OK equipbox + toolbox + shop（R-2/R-3/R-4/R-5/R-6/R-7） |
| Task 2 `REVIEWFIX-FINAL`（五文件） | 09-10-PLAN Task 2 `<verify>` | ✅ OK 5 files: no `===`/`!==` null/undefined, no `import type`, no `?.`, CRLF |
| 范围守卫 `git status --porcelain` | 09-10-PLAN Task 2 `<verify>` | ✅ 仅五个 UI 文件的改动被提交，无越界生产文件 |

**无全仓门禁：** 全程未使用 `pnpm check:type` / `pnpm build` / 全仓 TS 诊断数。

## Issues Encountered

- 计划的 Task 0 / R-2 门禁存在自身缺陷（见上「Deviations」），已通过修正等价断言解决；此为**计划脚本问题**，非源码问题。按 AGENTS.md「不擅自将问题视为问题并记录、须经确认」的要求，此处仅作执行偏差如实记录，**是否认定为需修订的问题请用户裁定**。

## Known Stubs

None — 未引入任何 stub / 占位 / TODO（新增注释均为 jsDoc 与 JSX 分段注释；未新增 `TODO`/`FIXME`）。

## Threat Flags

None — 改动仅限五个 UI 源码文件的注释、导入、非空判断、背景移除、文本载体与副作用搬迁；未引入新网络端点 / 鉴权路径 / 文件访问或模式变更。

## User Setup Required

None — 无外部服务配置。

## Next Phase Readiness

- 五个 UI 文件已统一符合 R-1..R-8 复查要求；`TextContent` / `isNil` / `onMounted` / `EnemyView` 均从既有包导入，未改依赖。
- 待用户裁定：Task 0 / R-2 门禁脚本缺陷是否需要回改 `09-10-PLAN.md`（本次未改计划文件，仅如实记录）。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-11*

## Self-Check: PASSED

- FOUND: `.planning/phases/09-minimum-browser-runnable/09-10-SUMMARY.md`
- FOUND: `4c383f6` (Task 1 commit)
- FOUND: `fc159ce` (Task 2 commit)
- 未修改 STATE.md / ROADMAP.md（由 orchestrator 负责）
