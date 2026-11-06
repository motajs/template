---
phase: 10-docs-restructure
plan: 08
subsystem: docs
tags: [vitepress, markdown, combat, tutorial, beginner-friendly]

requires:
  - phase: 10-docs-restructure
    provides: 10-07 建立的 state 获取口径与 enemy-map-damage 修正
provides:
  - 战斗组 8 篇的引导式、入门友好重写
  - combat-overview 对「计算后怪物 / 为什么要 buildup / 为什么分四步」的平实解释
affects: [docs/intermediate 战斗组, 后续 D-09 复审]

actuals:
  tokens: 3774
  tasks: 3
  commits: 3
  plan_head_before: a24457c

tech-stack:
  added: []
  patterns:
    - "引导式文档：先给场景与动机，再引出接口、示例与表格"

key-files:
  created: []
  modified:
    - docs/intermediate/combat-overview.md
    - docs/intermediate/enemy-specials.md
    - docs/intermediate/enemy-aura.md
    - docs/intermediate/enemy-query.md
    - docs/intermediate/enemy-final.md
    - docs/intermediate/enemy-calculator.md
    - docs/intermediate/enemy-combat-script.md
    - docs/intermediate/enemy-status-hooks.md

key-decisions:
  - "只改讲法，不改接口事实与 D-33..D-41 的内容范围"
  - "combat-overview 用「模板 → 重建副本」解释计算后怪物，用「确认零件、装主体、按环境微调、收尾检查」解释四阶段"
  - "enemy-query 的警示补充「引擎未内置」字样，落实 N-1 留白"

requirements-completed: []

coverage:
  - id: D1
    description: "combat-overview 讲清计算后怪物、为何重建、为何分四步，并保留 mermaid 流程与文档对照表"
    verification:
      - kind: other
        ref: "pnpm docs:build (build complete); static CRLF/H1/mermaid/buildup checks"
        status: pass
    human_judgment: true
    rationale: "新手可读性与动机解释是否到位需 D-09 人工复审"
  - id: D2
    description: "enemy-specials/aura/query/final 改为引导式开篇并保留 D-34..D-37 全部要点与示例"
    verification:
      - kind: other
        ref: "pnpm docs:build; static factory/applySpecial/register checks; relative link check"
        status: pass
    human_judgment: true
    rationale: "引导式讲法是否自然、概念是否易懂需人工审阅"
  - id: D3
    description: "enemy-calculator/combat-script/status-hooks 改为引导式开篇并保留 D-38/D-40/D-41 要点"
    verification:
      - kind: other
        ref: "pnpm docs:build; static getCriticalLimit/addCombatScript/onAfterTeleportTo checks"
        status: pass
    human_judgment: true
    rationale: "示例导读与选型表的可理解性需人工审阅"

duration: 8min
completed: 2026-10-17
status: complete
---

# Phase 10 Plan 08: 战斗组文档引导式重写 Summary

**战斗组 8 篇改为「先建立直觉与动机、再引出接口与示例」的引导式写法，并用平实语言讲清「计算后怪物、为什么要 buildup、为什么分四步」，同时完整保留 D-33..D-41 的内容范围与示例。**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-17T20:58:00+08:00
- **Completed:** 2026-10-17T21:06:00+08:00
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `combat-overview` 重写开篇与「计算后怪物」段落：用「模板 → 属性算准的副本」解释计算后怪物，补齐「为什么要重建（为了获得准确属性）」与「为什么分四步（各阶段各管一事）」；保留 mermaid 流程与「流程步骤 → 对应文档」表，且不提临界值。
- `enemy-specials` 从「基础属性决定血与攻防，特殊属性决定还会做什么」引入，再引出 `code` + `value` 与两类工厂函数；保留属性实现位置表、编辑器识别约定、多个示例与怪物比较说明。
- `enemy-aura` / `enemy-query` / `enemy-final` 分别从「影响周围」「需要看周围」「最后收尾」建立直觉，再讲优先级、接口与示例；`enemy-query` 明确标注查询效果引擎未内置。
- `enemy-calculator` / `enemy-combat-script` / `enemy-status-hooks` 分别从「属性换算成伤害」「战斗前后的规则」「状态反复生效」引入；保留公式逐段导读、脚本/钩子选型表、多钩子协同与跨系统示例。
- 8 篇均保持 kebab-case、CRLF、单 H1、无元叙述；站内相对链接全部有效；`pnpm docs:build` 通过。

## Task Commits

Each task was committed atomically:

1. **Task 1: 重写 combat-overview、enemy-specials（引导式）** - `b1b7c8e` (docs)
2. **Task 2: 引导式重写 enemy-aura/query/final** - `f5e432d` (docs)
3. **Task 3: 引导式重写 calculator/script/status-hooks** - `de5e9e1` (docs)

**Plan metadata:** SUMMARY 单独提交（本文件）。

_Note: 本计划为文档改写，无 TDD 任务。_

## Files Created/Modified

- `docs/intermediate/combat-overview.md` - 重写开篇与计算后怪物/重建/四阶段动机；保留流程图与对照表
- `docs/intermediate/enemy-specials.md` - 引导式开篇；保留两类定义、示例、实现位置表与编辑器约定
- `docs/intermediate/enemy-aura.md` - 引导式开篇；先讲优先级，再讲内置光环、转换器/视图与两个示例
- `docs/intermediate/enemy-query.md` - 引导式开篇；保留未内置警示、常规/特殊查询、三示例与优先级
- `docs/intermediate/enemy-final.md` - 引导式开篇；保留接口、内置效果、三方对比与仿攻示例
- `docs/intermediate/enemy-calculator.md` - 引导式开篇；保留接口、公式导读、支援怪跳过说明、等差数列与临界约定
- `docs/intermediate/enemy-combat-script.md` - 引导式开篇；保留接口、内置脚本、脚本/钩子选型表与两个示例
- `docs/intermediate/enemy-status-hooks.md` - 引导式开篇；保留多钩子协同、三类状态表、注册、时序与跨系统示例

## Decisions Made

- **只改讲法，不改事实。** 接口名、字段名、示例与 D-33..D-41 的内容范围全部保留，写作以 10-04 已核对源码的口径为准。
- **用比喻承接抽象概念。** `combat-overview` 用「模板 → 属性算准的副本」解释计算后怪物，用「确认零件 → 装主体 → 按环境微调 → 收尾检查」解释四阶段；`enemy-aura` 用「排队办事」解释优先级的前向可见性。
- **N-1 留白显式化。** `enemy-query` 的警示由「需要自己注册的新增内容」改为「引擎未内置、需要自己注册的新增内容」，不改变原有警示信息。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- 提交过程中一次 `git commit --amend` 误落在 Task 3，导致 `enemy-query.md` 被并入错误的提交。已通过 `git reset` 回收并重建三个任务提交，工作树内容未受影响，最终提交边界与计划一致。
- `pnpm docs:build` 输出 chunk 体积警告（>500 kB），为既有构建提示，不影响 build complete 与 dead-link 检查。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 战斗组 8 篇已完成引导式重写，构建与静态门禁通过。
- 内容可读性、动机解释是否到位仍待 D-09 人工复审。
- STATE.md / ROADMAP.md 由 orchestrator 统一更新，本计划未触碰。

## Self-Check: PASSED

- 8 个目标文件均存在，均为 CRLF、单 H1。
- 三个任务提交存在且各自只包含对应文件：`b1b7c8e`、`f5e432d`、`de5e9e1`。
- `pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 通过，输出 `build complete in 13.70s`。
- 站内相对链接检查无 dead link。
