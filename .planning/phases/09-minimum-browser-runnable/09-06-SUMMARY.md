---
phase: 09-minimum-browser-runnable
plan: 6
subsystem: ui
tags: [ui, book, enemy-handbook, data-system, damage-critical, client-modules]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-05 (post-migration UI fixes; statusBar/toolbar baseline stable)
provides:
  - 独立怪物详情 UI bookDetail.tsx（BookDetail/BookDetailUI），入参 IEnemy | IEnemyView，基础/计算后切换、特殊列表、临界表
  - 怪物手册列表 UI book.tsx（Book/BookUI），绑定 current EnemyContext、按 code 去重、9 项数值、滚动、点击开详情
affects: [book, equipbox, toolbox, shop]

actuals:
  tokens: 4600
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 新 UI 组件以 props.state.enemyContext / props.state.hero 读数据端（无 client 单例）
    - 基础属性临界走 calculateEnemyCritical(enemy,'atk',locator|null)；计算后走 calculateViewCritical(view,'atk')
    - 「1 防」= getIsolatedAttribute().add('def',1) + damage.with(isolated).calculateEnemyCritical(...) 求差

key-files:
  created:
    - packages-user/client-modules/src/ui/bookDetail.tsx
    - packages-user/client-modules/src/ui/book.tsx
  modified: []

key-decisions:
  - "OI-4：数字格式化沿用 core.formatBigNumber（as-is）"
  - "OI-5：命名照准 book.tsx/bookDetail.tsx、Book/BookDetail、GameUI 'book'/'book-detail'、BookProps/BookDetailProps、BookUI/BookDetailUI"
  - "OI-6：「1 防」以基础属性路径计算——getIsolatedAttribute().add('def',1) + with(...).calculateEnemyCritical(...) 求差"
  - "详情为独立 UI，不 import book.tsx；列表通过 controller.open(BookDetailUI, { enemy: view }) 打开详情"
  - "按 base.code 去重时仅收集 IEnemyView，不新增内部命名接口"

patterns-established:
  - "详情/列表两文件独立：详情入参 IEnemy|IEnemyView 结构判别（'getBaseEnemy' in enemy），列表传 IEnemyView 以启用切换"

requirements-completed: []

coverage:
  - id: D1
    description: "bookDetail.tsx 独立敌人详情 UI：基础/计算后属性切换、特殊属性列表、临界表、左下切换/右下返回"
    verification:
      - kind: automated_ui
        ref: "node -e BOOKDETAIL GATE (interface BookDetailProps / getBaseEnemy/getComputedEnemy / iterateSpecials / getSpecialName/getDescription / calculateEnemyCritical / calculateViewCritical / BookDetailUI)"
        status: pass
      - kind: automated_ui
        ref: "node -e CRLF GATE bookDetail.tsx"
        status: pass
    human_judgment: true
    rationale: "本计划验证仅为静态源码断言（无 pnpm check:type / build / 浏览器运行）；渲染与交互行为未经机器或人工运行验证，需 verifier 按 UAT 确认"
  - id: D2
    description: "book.tsx 怪物手册列表 UI：绑定 enemyContext、按 code 去重、9 项数值（含「1 防」）、滚动、点击开详情、右下退出"
    verification:
      - kind: automated_ui
        ref: "node -e BOOK GATE (interface BookProps / props.state.enemyContext / iterateEnemy / getBaseEnemy / .code / calculateEnemyCritical / baseInfo / with( / <icon / <Scroll / BookDetailUI / controller.open / controller.close)"
        status: pass
      - kind: automated_ui
        ref: "node -e CRLF GATE book.tsx + bookDetail.tsx"
        status: pass
      - kind: other
        ref: "git status --porcelain (scope guard: 仅本计划文件)"
        status: pass
    human_judgment: true
    rationale: "同上：仅静态断言，布局/交互/数值正确性未经运行验证，需 verifier 确认"

duration: 3min
completed: 2026-10-11
status: complete
---

# Phase 9 Plan 6: 怪物手册（book 列表 + 独立详情）Summary

**移植 legacy 怪物手册到新 UI 接口：独立详情 `bookDetail.tsx`（`IEnemy | IEnemyView` 入参、基础/计算后切换、特殊列表、系统二分法临界表）+ 列表 `book.tsx`（绑定当前 `EnemyContext`、按 `code` 去重、9 项数值含「1 防」、滚动、点击开详情、右下退出）。**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-10-11T05:40:00Z
- **Completed:** 2026-10-11T05:45:41Z
- **Tasks:** 3（Task 0 汇报关卡已闭环 + Task 1 + Task 2）
- **Files modified:** 2（均为新增）

## Accomplishments

- 新增 `bookDetail.tsx`：独立详情 UI，入参 `IEnemy<IEnemyAttr> | IEnemyView<IEnemyAttr>`；结构判别（`'getBaseEnemy' in props.enemy`）区分视图；基础/计算后属性经 `getBaseEnemy()`/`getComputedEnemy()` 切换；特殊列表经 `iterateSpecials()` + `getSpecialName()`/`getDescription()`；临界表基础模式 `calculateEnemyCritical(base,'atk',locator)`、计算模式 `calculateViewCritical(view,'atk')`；左下角切换按钮文案随模式变化，右下角「返回上一级」调用 `close(props.instance)`。
- 新增 `book.tsx`：绑定 `props.state.enemyContext`，按 `base.code` 去重；纵向 `<Scroll noscroll>` 平铺行；每行 `<icon icon={base.code}>` + 名称 + 特殊名 + 生命/攻击/防御/金币/经验 + 伤害/临界/减伤/「1 防」；伤害/临界/减伤经基础路径 `calculateEnemyCritical`，「1 防」经 `with(隔离属性 add('def',1))` 求差；点击行 `controller.open(BookDetailUI, { enemy: view })`；右下「退出」`controller.close(props.instance)`。
- 两文件均通过静态符号门禁 + CRLF 门禁 + 范围守卫；未改 `package.json`、未改任何既有文件、未触碰用户并发改动。

## Task Commits

Each task was committed atomically:

1. **Task 0: 预执行汇报关卡（checkpoint:decision, gate=blocking-human）** - 无提交（纯汇报/只读；用户已在父会话回复「可以执行」并采纳默认处置，见 OI-4..OI-6）
2. **Task 1: 新建 bookDetail.tsx（独立详情 UI）** - `04fc4ff` (feat)
3. **Task 2: 新建 book.tsx（列表 UI + 最终静态门禁）** - `0f0b277` (feat)

**Plan metadata:** 见本 SUMMARY 提交

## Files Created/Modified

- `packages-user/client-modules/src/ui/bookDetail.tsx` - 独立怪物详情 UI（BookDetail/BookDetailUI/BookDetailProps），基础/计算后切换、特殊列表、临界表、左下切换/右下返回
- `packages-user/client-modules/src/ui/book.tsx` - 怪物手册列表 UI（Book/BookUI/BookProps），enemyContext 绑定、code 去重、9 项数值、滚动、开详情、右下退出

## Decisions Made

- OI-4：数字格式化沿用 `core.formatBigNumber`（as-is，无新等价 API）。
- OI-5：命名照准（文件名 `book.tsx`/`bookDetail.tsx`；组件 `Book`/`BookDetail`；GameUI `'book'`/`'book-detail'`；props 接口 `BookProps`/`BookDetailProps`；导出 `BookUI`/`BookDetailUI`）。未向 `src/ui/index.ts` 添加导出。
- OI-6：「1 防」以基础属性路径计算——`getIsolatedAttribute()` 取隔离属性并 `add('def',1)`，用 `damage.with(isolated).calculateEnemyCritical(base,'atk',locator)` 与当前 `baseInfo.damage` 求差。
- 详情独立（不 import `book.tsx`）；列表传 `IEnemyView` 使详情可切换基础/计算后。
- 去重时仅收集 `IEnemyView`（`Map<number, IEnemyView>`），避免引入未在 Task 0 呈报的额外命名接口。

## Deviations from Plan

None - plan executed exactly as written.

（说明：GSD 执行器规范建议将本计划 `book.tsx` 的空值 TODO 记入跨阶段 `.planning/WINDOWS.md`；但本计划执行约束明确「仅暂存/提交两个新文件 + SUMMARY」，故已回退该账本写入，改为记入下方「Known Stubs」。）

## Known Stubs

- `packages-user/client-modules/src/ui/book.tsx:62` — `// TODO: 伤害系统未绑定或已达临界上界时，伤害 / 临界 / 减伤 / 「1 防」留空`。此为**计划明确要求**的优雅降级（`getDamageSystem()` 返回 `null` 或 `next().done === true` 时对应数值留空），非阻碍本计划目标的桩；数据端绑定后自动显示。非本计划范围，无需后续计划解决。

## Issues Encountered

None.

## Threat Flags

None（仅读取 `props.state.enemyContext` / `props.state.hero`，不写数据端；无新增网络/文件/信任边界）。

## Next Phase Readiness

- book 列表与独立详情均已落地并通过静态门禁，位于 `packages-user/client-modules/src/ui/`。
- 未接线「如何从地图打开 book」（D-27 明确不在本计划范围）；`book.tsx`/`bookDetail.tsx` 未向 `src/ui/index.ts` 添加导出（保持与同 wave 计划互不冲突）。
- 若需浏览器/交互层验证，须另行走 UAT（本计划仅静态断言）。

## Self-Check: PASSED

- `packages-user/client-modules/src/ui/book.tsx` 存在（9777 bytes）
- `packages-user/client-modules/src/ui/bookDetail.tsx` 存在（8670 bytes）
- 提交 `04fc4ff`、`0f0b277` 存在于 `refine/data-client`
- 计划级验收符号门禁：两文件均通过
- CRLF 门禁：两文件均通过
- 范围守卫 `git status --porcelain`：无越界改动

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-11*
