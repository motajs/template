---
phase: 10-docs-restructure
plan: 23
subsystem: docs
tags: [vitepress, pathfinding, hero-attribute, damage-calculator]

# Dependency graph
requires: []
provides:
  - "docs/advanced/ii/pathfinding.md：自动寻路的分工、四段流程、结果状态、两种移动方式与可替换点"
  - "docs/advanced/ii/adding-hero-attribute.md：新增勇士属性的接口、默认值、初始值、修饰器与伤害计算接入"
affects: [10-24, 10-25]

# Actuals (#2632)
actuals:
  tokens: 4921
  tasks: 2
  commits: 2
  plan_head_before: 0d3645989fc78d71319d0c10c1aabb1f91f3f8a5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "高级教程按库文档方式叙述：概念先行、完整代码块、解释性注释充足"
    - "主干与边界分离：边界情况集中在「边界与注意」一节"
    - "数据端专属内容；渲染端与编辑器用 D-47 非断链占位"

key-files:
  created:
    - docs/advanced/ii/pathfinding.md
    - docs/advanced/ii/adding-hero-attribute.md
  modified: []

key-decisions:
  - "寻路篇只讲流程与替换点，不展开最小损失搜索的内部实现"
  - "属性篇以 atkSpeed（基础 100）与 armor（基础 0）为例，接入伤害计算器"
  - "装备 percentage 使用倍率写法 0.15 表示 15%，与属性自身以百分数存储的 15 区分"

patterns-established:
  - "寻路绑定：初始化注入谓词与移动器，切换楼层时重新绑定图层与方向处理器"
  - "新增属性五处链路：接口 → 默认值 → 内容配置 → 计算接入 → 显示"

requirements-completed: []

coverage:
  - id: D1
    description: "自动寻路篇：四段流程、结果状态、moveTo/teleportTo、损失函数、瞬移策略与钩子"
    verification:
      - kind: automated_ui
        ref: "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "文档内容与源码一致性、叙述难度需按 D-46/D-57 由用户审阅"
  - id: D2
    description: "新增勇士属性篇：改 IHeroAttr、补默认值与内容配置、修饰器、伤害计算接入与验证"
    verification:
      - kind: automated_ui
        ref: "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "示例数值与示例选型需用户确认；编辑器与状态栏为 D-47 占位"

# Metrics
duration: 30min
completed: 2026-10-21
status: complete
---

# Phase 10 Plan 23: 高级 II 寻路与勇士属性 Summary

**高级 II 的自动寻路流程篇与新增勇士属性链路篇，源码核对完成，构建通过且无死链**

## Performance

- **Duration:** 约 30 分钟
- **Started:** 2026-10-21T18:20:00Z（约）
- **Completed:** 2026-10-21T18:50:41Z
- **Tasks:** 2（Task 0 审批门已由派发上下文放行）
- **Files created:** 2

## Accomplishments

- `pathfinding.md` 讲清「绑定移动器 → 构建图 → 求路径 → 交给移动器」四段流程，给出损失函数、瞬移策略与瞬移钩子的完整示例。
- `adding-hero-attribute.md` 以攻速与护甲为例，覆盖接口、默认值、内容配置、修饰器、伤害计算器与装备衔接。
- 两篇均按 D-59 库文档风格书写，CRLF、单 H1，构建 `build complete`，无 dead link。

## Task Commits

1. **Task 1: 编写自动寻路 pathfinding.md** - `64fb049` (docs)
2. **Task 2: 编写新增勇士属性 adding-hero-attribute.md** - `548007c` (docs)

**Plan metadata:** 本 SUMMARY 提交（docs）

## Files Created/Modified

- `docs/advanced/ii/pathfinding.md` - 自动寻路的分工、流程、状态、移动方式、损失函数、策略与钩子。
- `docs/advanced/ii/adding-hero-attribute.md` - 新增勇士属性的完整数据端链路与伤害计算接入。

## Decisions Made

- 寻路篇不解释最小损失搜索的内部实现，只保留输入输出与替换点（D-67）。
- 初始化只注入通行谓词与移动器，图层初始为 `null`；文档明确说明方向处理器需在绑定楼层时自行注入，否则 `getPath` 返回 `InvalidInput`。
- 属性示例选攻速与护甲：攻速参与每回合伤害并影响回合数，护甲在最终伤害上按百分比减免。
- 装备 `percentage` 采用倍率写法（`0.15` = 15%），与属性自身以百分数存储（`15` = 15%）在文中区分说明。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 装备 percentage 示例改为 0.15 以匹配源码语义**
- **Found during:** Task 2
- **Issue:** 计划任务书写 `percentage: { atkSpeed: 15 }`，但 `PercentageModifier.modify` 按 `baseValue * this.value` 计算，`15` 会得到 1500%；现有 `equipment-system.md` 与中级 `hero-attribute.md` 也约定 `0.1` 表示 10%。
- **Fix:** 示例改为 `percentage: { atkSpeed: 0.15 }`，并说明属性自身按百分数存储、装备 `percentage` 是倍率；基础 100 加 15% 仍得到 115，与计划验证预期一致。
- **Files modified:** `docs/advanced/ii/adding-hero-attribute.md`
- **Verification:** 对照 `packages-user/data-base/src/hero/modifier.ts` 与 `equipStore.ts`；构建通过。
- **Committed in:** `548007c`

**2. [Rule 1 - Bug] 瞬移钩子的触发范围按源码修正**
- **Found during:** Task 1
- **Issue:** `onBeforeTeleportTo` 只在瞬移分支触发，而 `onAfterTeleportTo` 挂在所有 `startMove` 的控制器结束回调上，普通逐步移动也会触发；计划文字容易读成两者都只在瞬移时触发。
- **Fix:** 文档分别说明两个钩子的触发条件，并提醒任意绑定到 `useMover` 的移动器都会触发，不只勇士。
- **Files modified:** `docs/advanced/ii/pathfinding.md`
- **Verification:** 对照 `packages-user/data-system/src/path/system.ts`；构建通过。
- **Committed in:** `64fb049`

---

**Total deviations:** 2 auto-fixed（均为源码一致性的 Rule 1 修正）
**Impact on plan:** 不扩大范围；修正后示例与源码、既有装备文档保持一致。

## Issues Encountered

- PowerShell 执行策略阻止直接运行 `pnpm`，改用 `cmd /c "pnpm ..."` 完成 prettier 与构建命令。
- 工作区存在与本计划无关的既有修改 `packages/system/src/hotkey/type.ts`，未纳入任何提交。

## Known Stubs

- `docs/advanced/ii/adding-hero-attribute.md` 的编辑器与状态栏显示按 D-47 占位：`编辑器 · 新增英雄属性项`、`渲染端 · 状态栏`，并附 `<!-- TODO(advanced-II): 编辑器属性项与状态栏显示 -->`。
- 两篇末尾的渲染端表现占位分别是 `<!-- TODO(renderer): 寻路移动动画与瞬移表现 -->` 与 `<!-- TODO(renderer): 攻速与护甲的状态栏显示 -->`。

这些占位是计划明确要求的非断链占位，不影响数据端内容的完整性。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10-24 可直接沿用本篇「改接口 → 补默认值 → 接入系统」的链路，对照编写新增怪物属性。
- 10-25 接入侧边栏时新增这两篇入口；本计划未修改 `docs/.vitepress/config.ts`。
- 两篇均需按 D-46/D-57 进入用户主导的修订循环后再收尾。

---
*Phase: 10-docs-restructure*
*Completed: 2026-10-21*

## Self-Check: PASSED

- `docs/advanced/ii/pathfinding.md` 存在，提交 `64fb049`
- `docs/advanced/ii/adding-hero-attribute.md` 存在，提交 `548007c`
- `.planning/phases/10-docs-restructure/10-23-SUMMARY.md` 存在

