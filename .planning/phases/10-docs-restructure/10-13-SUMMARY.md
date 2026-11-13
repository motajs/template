---
phase: 10-docs-restructure
plan: 13
subsystem: docs
tags: [vitepress, documentation, declarative, imperative, data-engine]

# Dependency graph
requires:
  - phase: 10-docs-restructure
    provides: "中级教程中的特殊属性、战斗总览、伤害计算、数据端与钩子页面"
provides:
  - "docs/advanced/declarative-vs-imperative.md（高级 I 第一篇）"
affects: ["10-14", "10-15", "10-16", "10-17"]

actuals:
  tokens: 3056
  tasks: 2
  commits: 2
  plan_head_before: 8f325091998f568b6632d28be8fe8fea7421ca61

tech-stack:
  added: []
  patterns:
    - "旧样板命令式与新样板声明式并排对照"
    - "五组源码事实说明声明什么、引擎何时执行、为何更稳"
    - "通用模板单独成节，示例只用于演示六步"

key-files:
  created:
    - docs/advanced/declarative-vs-imperative.md
  modified: []

key-decisions:
  - "旧样板示例用伪代码并明确标注不可照抄，避免臆造旧接口名"
  - "通用模板与六步示例分开，示例不冒充模板"
  - "加粗改用 HTML strong，以满足 D-52 与计划中的加粗门禁"

patterns-established:
  - "声明式扩展统一按「实现接口、注册一次、引擎调用」三步理解"
  - "计算类扩展必须无副作用；状态修改放到引擎规定的时机"

requirements-completed: []

coverage:
  - id: D1
    description: "高级 I 第一篇：声明式 vs 命令式接口"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete"
        status: pass
    human_judgment: true
    rationale: "文档内容与受众适配需用户人工审阅（D-46 第 2 阶段）"
---

# Phase 10 Plan 13: 声明式 vs 命令式接口 Summary

**高级 I 第一篇落地：用旧样板命令式与新样板声明式并排对照，串起光环、伤害计算器、道具效果、可存档对象与钩子五组源码事实，并给出通用模板、六步示例与可操作验证。**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-10-19T13:45:00Z
- **Completed:** 2026-10-19T14:12:26Z
- **Tasks:** 2
- **Files modified:** 1 created

## Accomplishments

- 新建 `docs/advanced/` 并写下 `declarative-vs-imperative.md`，单 H1、CSV/CRLF 规范、数据端 only。
- 用「谁决定执行时机」讲清命令式与声明式的差别，并给出执行时机、次数、副作用、存档、录像、组合方式的对照表。
- 五组机制全部落在当前源码事实：`special` + `special.ts` / `aura.ts`、`IDamageCalculator`、`IItemEffect`、`ISaveableContent`、`addHook` / `forEachHook`。
- 加入独立的「模板：声明式扩展的通用骨架」，与六步示例分开；示例按目标、改哪里、复制什么、改什么、怎么验证、注意组织。
- 明确「计算器必须无副作用」「地图伤害按计算后怪物结算」「一次性动作仍用命令式但必须计入录像」。
- 指向高级 II/III 的内容只用代码 span 或 HTML 注释占位，不产生真实链接。
- prettier 检查通过；`pnpm docs:build` 输出 `build complete`，无 dead link。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 declarative-vs-imperative.md 正文** - `47777bc` (docs)
2. **Task 2: 源码核对、格式与构建收口** - `7285ab9` (docs)

Task 0 为人工确认关卡，用户已批准，无代码提交。

## Files Created/Modified

- `docs/advanced/declarative-vs-imperative.md` - 高级 I 第一篇，声明式与命令式接口的概念与实操基础

## Decisions Made

- 旧样板命令式示例使用伪代码并标注「不可照抄」，因为无法核实的旧接口名不应臆造。
- 通用模板与具体示例分开：模板只给「实现接口、注册一次、引擎调用」的骨架，六步示例只演示一条光环声明。
- 加粗改用 HTML `<strong>`：计划中的加粗门禁正则会把闭合 `**` 后紧跟中文标点也判为违规，D-52 明确允许 `<strong>`。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 加粗语法改用 HTML strong**
- **Found during:** Task 1（正文写作）
- **Issue:** 计划的 BOLD-FLANK 正则同时匹配「`**` 后紧跟标点」，中文里 `**目标**：` 这类闭合标记会被误判，导致 `**` 无法通过门禁。
- **Fix:** 按 D-52 允许的方式，统一改用 `<strong>…</strong>`；渲染效果不变，门禁可通过。
- **Files modified:** `docs/advanced/declarative-vs-imperative.md`
- **Verification:** STATIC-OK、prettier 检查通过、构建 `build complete`。
- **Committed in:** `47777bc`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 仅影响加粗的书写形式，不改变内容与结构。

## Issues Encountered

- 构建门禁运行 `pnpm` 时会顺带改写 `pnpm-lock.yaml`（删掉已不存在的 workspace 链接）。该改动与本计划无关，已在每次提交前还原，未纳入提交。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 本篇可作为 10-14 至 10-17 的概念基础：插件、存档、录像与钩子都建立在「声明规则、引擎在合适时机执行」之上。
- 页面尚未注册到 `docs/.vitepress/config.ts`，按计划留到 10-18 统一处理。
- 待用户按 D-46 第 2 阶段进行高级 I 读者修订。

## Self-Check: PASSED

- FOUND: `docs/advanced/declarative-vs-imperative.md`
- FOUND: `47777bc`
- FOUND: `7285ab9`
